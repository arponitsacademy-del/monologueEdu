<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\CourseBundle;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\User;
use App\Services\CoursePurchaseSmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminManualEnrollmentController extends Controller
{
    /**
     * Get list of both courses and bundles for manual enrollment.
     */
    public function courses(): JsonResponse
    {
        return $this->targets();
    }

    /**
     * Unified list of courses and course bundles.
     */
    public function targets(): JsonResponse
    {
        // 1. Fetch Courses
        $courses = Course::with(['categories:id,name'])
            ->withCount(['enrollments' => function ($q) {
                $q->where('status', Enrollment::STATUS_ACTIVE);
            }])
            ->orderBy('title')
            ->get()
            ->map(function ($c) {
                $activeCategory = $c->categories->first();
                return [
                    'id' => $c->id,
                    'type' => 'course',
                    'title' => $c->title,
                    'slug' => $c->slug,
                    'thumbnail' => $c->thumbnail,
                    'price' => (float) ($c->sale_price ?? $c->price),
                    'regular_price' => (float) $c->price,
                    'sale_price' => $c->sale_price !== null ? (float) $c->sale_price : null,
                    'status' => $c->status,
                    'category' => $activeCategory ? ['id' => $activeCategory->id, 'name' => $activeCategory->name] : null,
                    'enrollments_count' => $c->enrollments_count ?? 0,
                ];
            });

        // 2. Fetch Course Bundles
        $bundles = CourseBundle::with(['courses:id,title,thumbnail'])
            ->orderBy('title')
            ->get()
            ->map(function ($b) {
                $enrollmentsCount = Order::where('bundle_id', $b->id)
                    ->where('payment_status', Order::PAYMENT_PAID)
                    ->distinct('user_id')
                    ->count('user_id');

                return [
                    'id' => $b->id,
                    'type' => 'bundle',
                    'title' => $b->title,
                    'slug' => $b->slug,
                    'thumbnail' => $b->thumbnail,
                    'price' => (float) ($b->sale_price ?? $b->regular_price),
                    'regular_price' => (float) $b->regular_price,
                    'sale_price' => $b->sale_price !== null ? (float) $b->sale_price : null,
                    'status' => $b->status,
                    'courses_count' => $b->courses->count(),
                    'courses' => $b->courses->map(fn($bc) => ['id' => $bc->id, 'title' => $bc->title]),
                    'category' => ['id' => 0, 'name' => 'কম্বো বান্ডেল'],
                    'enrollments_count' => $enrollmentsCount,
                ];
            });

        $allTargets = $courses->concat($bundles)->values();

        return response()->json([
            'status' => 'success',
            'targets' => $allTargets,
            'courses' => $courses,
            'bundles' => $bundles,
        ]);
    }

    /**
     * Search users by name, phone, or email.
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));
        $targetType = $request->input('target_type', 'course');
        $targetId = $request->input('target_id', $request->input('course_id'));

        if (empty($query)) {
            return response()->json([
                'status' => 'success',
                'users' => [],
            ]);
        }

        // Clean phone digits for phone search
        $digitsOnly = preg_replace('/[^0-9]/', '', $query);

        $users = User::select('id', 'name', 'phone', 'email', 'role', 'status')
            ->where(function ($q) use ($query, $digitsOnly) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");

                if (! empty($digitsOnly) && strlen($digitsOnly) >= 3) {
                    $q->orWhere('phone', 'like', "%{$digitsOnly}%");
                }
            })
            ->limit(25)
            ->get();

        // Check enrollment status for target
        $enrolledUserIds = [];
        if (! empty($targetId) && $users->isNotEmpty()) {
            if ($targetType === 'bundle') {
                $enrolledUserIds = Order::where('bundle_id', $targetId)
                    ->whereIn('user_id', $users->pluck('id'))
                    ->where('payment_status', Order::PAYMENT_PAID)
                    ->pluck('user_id')
                    ->toArray();
            } else {
                $enrolledUserIds = Enrollment::where('course_id', $targetId)
                    ->whereIn('user_id', $users->pluck('id'))
                    ->where('status', Enrollment::STATUS_ACTIVE)
                    ->pluck('user_id')
                    ->toArray();
            }
        }

        $formatted = $users->map(function ($u) use ($enrolledUserIds) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'phone' => $u->phone,
                'email' => $u->email,
                'role' => $u->role,
                'status' => $u->status,
                'is_enrolled' => in_array($u->id, $enrolledUserIds, true),
            ];
        });

        return response()->json([
            'status' => 'success',
            'users' => $formatted,
        ]);
    }

    /**
     * Bulk lookup phone numbers (comma, newline, or space separated).
     */
    public function lookupPhones(Request $request): JsonResponse
    {
        $request->validate([
            'phones' => ['required'],
            'target_type' => ['nullable', 'string', 'in:course,bundle'],
            'target_id' => ['nullable', 'integer'],
            'course_id' => ['nullable', 'integer'],
        ]);

        $rawPhones = $request->input('phones');
        $targetType = $request->input('target_type', 'course');
        $targetId = $request->input('target_id', $request->input('course_id'));

        // Split tokens by comma, semicolon, newline, spaces
        if (is_array($rawPhones)) {
            $tokens = $rawPhones;
        } else {
            $tokens = preg_split('/[,\s;\n\r]+/', (string) $rawPhones, -1, PREG_SPLIT_NO_EMPTY);
        }

        $normalizedList = [];
        foreach ($tokens as $token) {
            $clean = preg_replace('/[^0-9]/', '', (string) $token);
            if (empty($clean)) {
                continue;
            }

            // Normalization logic for Bangladesh numbers
            if (str_starts_with($clean, '8801')) {
                $clean = substr($clean, 2); // remove 88 -> 01...
            } elseif (str_starts_with($clean, '1') && strlen($clean) === 10) {
                $clean = '0' . $clean; // prepend 0 -> 01...
            }

            if (strlen($clean) === 11 && str_starts_with($clean, '01')) {
                $normalizedList[] = $clean;
            } elseif (! empty($clean)) {
                $normalizedList[] = $clean;
            }
        }

        $normalizedList = array_values(array_unique($normalizedList));

        if (empty($normalizedList)) {
            return response()->json([
                'status' => 'error',
                'message' => 'কোনো ভ্যালিড মোবাইল নম্বর পাওয়া যায়নি।',
                'matched_users' => [],
                'unmatched_phones' => [],
            ], 422);
        }

        // Find users matching these phone numbers
        $matchedUsers = [];
        $unmatchedPhones = [];

        foreach ($normalizedList as $phone) {
            $user = User::where('phone', $phone)
                ->orWhere('phone', '+88' . $phone)
                ->orWhere('phone', '88' . $phone)
                ->orWhere('phone', 'like', "%{$phone}")
                ->first();

            if ($user) {
                if (! isset($matchedUsers[$user->id])) {
                    $isEnrolled = false;
                    if (! empty($targetId)) {
                        if ($targetType === 'bundle') {
                            $isEnrolled = Order::where('bundle_id', $targetId)
                                ->where('user_id', $user->id)
                                ->where('payment_status', Order::PAYMENT_PAID)
                                ->exists();
                        } else {
                            $isEnrolled = Enrollment::where('course_id', $targetId)
                                ->where('user_id', $user->id)
                                ->where('status', Enrollment::STATUS_ACTIVE)
                                ->exists();
                        }
                    }

                    $matchedUsers[$user->id] = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'phone' => $user->phone,
                        'email' => $user->email,
                        'role' => $user->role,
                        'status' => $user->status,
                        'is_enrolled' => $isEnrolled,
                    ];
                }
            } else {
                $unmatchedPhones[] = $phone;
            }
        }

        return response()->json([
            'status' => 'success',
            'matched_users' => array_values($matchedUsers),
            'unmatched_phones' => array_values(array_unique($unmatchedPhones)),
            'total_parsed' => count($normalizedList),
            'matched_count' => count($matchedUsers),
            'unmatched_count' => count(array_unique($unmatchedPhones)),
        ]);
    }

    /**
     * Perform manual enrollment for Course or Bundle.
     */
    public function enroll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => ['nullable', 'string', 'in:course,bundle'],
            'target_id' => ['nullable', 'integer'],
            'course_id' => ['nullable', 'integer'],
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['required', 'exists:users,id'],
            'send_sms' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $targetType = $validated['target_type'] ?? 'course';
        $targetId = $validated['target_id'] ?? $validated['course_id'];

        if (empty($targetId)) {
            return response()->json([
                'status' => 'error',
                'message' => 'কোর্স বা বান্ডেল আইডি প্রদান করা আবশ্যক।',
            ], 422);
        }

        $userIds = array_unique($validated['user_ids']);
        $sendSms = $request->boolean('send_sms', false);
        $notes = $validated['notes'] ?? 'Manual enrollment by admin';

        $enrolled = [];
        $alreadyEnrolled = [];
        $failed = [];
        $targetTitle = '';

        if ($targetType === 'bundle') {
            $bundle = CourseBundle::with('courses')->findOrFail($targetId);
            $targetTitle = $bundle->title;

            DB::transaction(function () use (
                $bundle,
                $userIds,
                $sendSms,
                $notes,
                &$enrolled,
                &$alreadyEnrolled,
                &$failed
            ) {
                foreach ($userIds as $userId) {
                    try {
                        $user = User::find($userId);
                        if (! $user) {
                            $failed[] = ['user_id' => $userId, 'reason' => 'User not found'];
                            continue;
                        }

                        // Check if already has paid bundle order
                        $existingOrder = Order::where('user_id', $user->id)
                            ->where('bundle_id', $bundle->id)
                            ->where('payment_status', Order::PAYMENT_PAID)
                            ->first();

                        if ($existingOrder) {
                            $alreadyEnrolled[] = [
                                'id' => $user->id,
                                'name' => $user->name,
                                'phone' => $user->phone,
                            ];
                            continue;
                        }

                        // 1. Create paid Order for Bundle
                        $orderNumber = 'MAN-' . now()->format('ymd') . '-' . strtoupper(Str::random(5));
                        $order = Order::create([
                            'order_number' => $orderNumber,
                            'user_id' => $user->id,
                            'course_id' => null,
                            'bundle_id' => $bundle->id,
                            'original_price' => $bundle->regular_price ?? 0,
                            'discount_amount' => 0,
                            'final_amount' => $bundle->sale_price ?? $bundle->regular_price ?? 0,
                            'payment_status' => Order::PAYMENT_PAID,
                            'order_status' => Order::ORDER_COMPLETED,
                            'payment_method' => 'manual_admin',
                            'notes' => $notes . ' (Bundle Manual Enrollment by Admin #' . auth()->id() . ')',
                        ]);

                        // 2. Enroll into ALL courses included in the Bundle
                        foreach ($bundle->courses as $bundleCourse) {
                            Enrollment::updateOrCreate(
                                [
                                    'user_id' => $user->id,
                                    'course_id' => $bundleCourse->id,
                                ],
                                [
                                    'order_id' => $order->id,
                                    'status' => Enrollment::STATUS_ACTIVE,
                                    'enrolled_at' => now(),
                                ]
                            );
                        }

                        // 3. Log Audit
                        AuditLog::log('manual_bundle_enrollment', 'Order', $order->id, null, [
                            'admin_id' => auth()->id(),
                            'user_id' => $user->id,
                            'bundle_id' => $bundle->id,
                            'order_number' => $order->order_number,
                            'courses_count' => $bundle->courses->count(),
                        ]);

                        // 4. Send SMS if requested
                        if ($sendSms) {
                            try {
                                app(CoursePurchaseSmsService::class)->sendPurchaseSms($order);
                            } catch (\Throwable $e) {
                                Log::warning('Manual bundle enrollment SMS error: ' . $e->getMessage());
                            }
                        }

                        $enrolled[] = [
                            'id' => $user->id,
                            'name' => $user->name,
                            'phone' => $user->phone,
                            'email' => $user->email,
                            'order_number' => $order->order_number,
                        ];
                    } catch (\Throwable $e) {
                        $failed[] = [
                            'user_id' => $userId,
                            'reason' => $e->getMessage(),
                        ];
                    }
                }
            });
        } else {
            // Single Course Enrollment
            $course = Course::findOrFail($targetId);
            $targetTitle = $course->title;

            DB::transaction(function () use (
                $course,
                $userIds,
                $sendSms,
                $notes,
                &$enrolled,
                &$alreadyEnrolled,
                &$failed
            ) {
                foreach ($userIds as $userId) {
                    try {
                        $user = User::find($userId);
                        if (! $user) {
                            $failed[] = ['user_id' => $userId, 'reason' => 'User not found'];
                            continue;
                        }

                        // Check if already actively enrolled
                        $existing = Enrollment::where('user_id', $user->id)
                            ->where('course_id', $course->id)
                            ->where('status', Enrollment::STATUS_ACTIVE)
                            ->first();

                        if ($existing) {
                            $alreadyEnrolled[] = [
                                'id' => $user->id,
                                'name' => $user->name,
                                'phone' => $user->phone,
                            ];
                            continue;
                        }

                        // 1. Create paid Order
                        $orderNumber = 'MAN-' . now()->format('ymd') . '-' . strtoupper(Str::random(5));
                        $order = Order::create([
                            'order_number' => $orderNumber,
                            'user_id' => $user->id,
                            'course_id' => $course->id,
                            'bundle_id' => null,
                            'original_price' => $course->price ?? 0,
                            'discount_amount' => 0,
                            'final_amount' => $course->sale_price ?? $course->price ?? 0,
                            'payment_status' => Order::PAYMENT_PAID,
                            'order_status' => Order::ORDER_COMPLETED,
                            'payment_method' => 'manual_admin',
                            'notes' => $notes . ' (Course Manual Enrollment by Admin #' . auth()->id() . ')',
                        ]);

                        // 2. Create or activate Enrollment
                        $enrollment = Enrollment::updateOrCreate(
                            [
                                'user_id' => $user->id,
                                'course_id' => $course->id,
                            ],
                            [
                                'order_id' => $order->id,
                                'status' => Enrollment::STATUS_ACTIVE,
                                'enrolled_at' => now(),
                            ]
                        );

                        // 3. Log Audit
                        AuditLog::log('manual_course_enrollment', 'Enrollment', $enrollment->id, null, [
                            'admin_id' => auth()->id(),
                            'user_id' => $user->id,
                            'course_id' => $course->id,
                            'order_number' => $order->order_number,
                        ]);

                        // 4. Send SMS if requested
                        if ($sendSms) {
                            try {
                                app(CoursePurchaseSmsService::class)->sendPurchaseSms($order);
                            } catch (\Throwable $e) {
                                Log::warning('Manual enrollment SMS delivery error: ' . $e->getMessage());
                            }
                        }

                        $enrolled[] = [
                            'id' => $user->id,
                            'name' => $user->name,
                            'phone' => $user->phone,
                            'email' => $user->email,
                            'order_number' => $order->order_number,
                        ];
                    } catch (\Throwable $e) {
                        $failed[] = [
                            'user_id' => $userId,
                            'reason' => $e->getMessage(),
                        ];
                    }
                }
            });
        }

        return response()->json([
            'status' => 'success',
            'message' => count($enrolled) . ' জন শিক্ষার্থী সফলভাবে "' . $targetTitle . '"-এ এনরোল সম্পন্ন হয়েছে।',
            'target' => [
                'id' => $targetId,
                'type' => $targetType,
                'title' => $targetTitle,
            ],
            'enrolled_count' => count($enrolled),
            'already_enrolled_count' => count($alreadyEnrolled),
            'failed_count' => count($failed),
            'enrolled' => $enrolled,
            'already_enrolled' => $alreadyEnrolled,
            'failed' => $failed,
        ]);
    }

    /**
     * Get recent manual enrollments history.
     */
    public function history(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 20);

        $orders = Order::where('payment_method', 'manual_admin')
            ->with([
                'user:id,name,phone,email',
                'course:id,title,slug,thumbnail',
                'bundle:id,title,slug,thumbnail',
            ])
            ->latest()
            ->paginate($perPage);

        return response()->json($orders);
    }

    /**
     * Get enrolled students for a specific course or bundle.
     */
    public function getTargetStudents(Request $request, string $type, int $id): JsonResponse
    {
        $search = trim((string) $request->input('q', ''));
        $perPage = max(10, min(100, (int) $request->input('per_page', 50)));

        if ($type === 'bundle') {
            $bundle = CourseBundle::with(['courses:id,title,thumbnail'])->findOrFail($id);

            $query = Order::where('bundle_id', $bundle->id)
                ->where('payment_status', Order::PAYMENT_PAID)
                ->whereHas('user')
                ->with(['user:id,name,phone,email,registration_number,status']);

            if (!empty($search)) {
                $cleanDigits = preg_replace('/[^0-9]/', '', $search);
                $query->whereHas('user', function ($uq) use ($search, $cleanDigits) {
                    $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('registration_number', 'like', "%{$search}%");

                    if (!empty($cleanDigits) && strlen($cleanDigits) >= 3) {
                        $uq->orWhere('phone', 'like', "%{$cleanDigits}%");
                    }
                });
            }

            $orders = $query->orderBy('id', 'desc')->paginate($perPage);

            $students = $orders->getCollection()->map(function ($order) {
                return [
                    'enrollment_id' => $order->id,
                    'user_id' => $order->user_id,
                    'user' => $order->user,
                    'enrolled_at' => $order->created_at?->toISOString() ?? (string) $order->created_at,
                    'status' => 'active',
                    'order_number' => $order->order_number,
                    'payment_method' => $order->payment_method ?? 'bundle',
                ];
            });

            return response()->json([
                'status' => 'success',
                'target' => [
                    'id' => $bundle->id,
                    'type' => 'bundle',
                    'title' => $bundle->title,
                    'slug' => $bundle->slug,
                    'thumbnail' => $bundle->thumbnail,
                    'courses_count' => $bundle->courses->count(),
                    'courses' => $bundle->courses->map(fn($c) => ['id' => $c->id, 'title' => $c->title]),
                    'total_students' => Order::where('bundle_id', $bundle->id)->where('payment_status', Order::PAYMENT_PAID)->distinct('user_id')->count('user_id'),
                ],
                'students' => $students,
                'pagination' => [
                    'total' => $orders->total(),
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                ],
            ]);
        }

        // Course
        $course = Course::with(['categories:id,name'])->findOrFail($id);

        $query = Enrollment::where('course_id', $course->id)
            ->whereHas('user')
            ->with(['user:id,name,phone,email,registration_number,status', 'order:id,order_number,payment_method']);

        if (!empty($search)) {
            $cleanDigits = preg_replace('/[^0-9]/', '', $search);
            $query->whereHas('user', function ($uq) use ($search, $cleanDigits) {
                $uq->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");

                if (!empty($cleanDigits) && strlen($cleanDigits) >= 3) {
                    $uq->orWhere('phone', 'like', "%{$cleanDigits}%");
                }
            });
        }

        $enrollments = $query->orderBy('id', 'desc')->paginate($perPage);

        $students = $enrollments->getCollection()->map(function ($enr) {
            return [
                'enrollment_id' => $enr->id,
                'user_id' => $enr->user_id,
                'user' => $enr->user,
                'access_key' => $enr->getOrGenerateAccessKey(),
                'enrolled_at' => $enr->enrolled_at?->toISOString() ?? $enr->created_at?->toISOString() ?? (string) $enr->created_at,
                'status' => $enr->status,
                'order_number' => $enr->order?->order_number ?? 'MANUAL-' . $enr->id,
                'payment_method' => $enr->order?->payment_method ?? 'manual',
            ];
        });

        return response()->json([
            'status' => 'success',
            'target' => [
                'id' => $course->id,
                'type' => 'course',
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
                'category' => $course->categories->first()?->name ?? 'সাধারণ কোর্স',
                'total_students' => Enrollment::where('course_id', $course->id)->whereHas('user')->count(),
            ],
            'students' => $students,
            'pagination' => [
                'total' => $enrollments->total(),
                'current_page' => $enrollments->currentPage(),
                'last_page' => $enrollments->lastPage(),
                'per_page' => $enrollments->perPage(),
            ],
        ]);
    }

    /**
     * Remove / unenroll student from course or bundle.
     */
    public function removeEnrollment(Request $request, int $id): JsonResponse
    {
        $enrollment = Enrollment::with(['user', 'course'])->find($id);

        if ($enrollment) {
            $user = $enrollment->user;
            $course = $enrollment->course;

            $enrollment->delete();

            AuditLog::log('manual_unenrollment', 'Enrollment', $id, null, [
                'admin_id' => auth()->id(),
                'user_id' => $user?->id,
                'user_name' => $user?->name,
                'user_phone' => $user?->phone,
                'course_id' => $course?->id,
                'course_title' => $course?->title,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'শিক্ষার্থীকে কোর্স থেকে সফলভাবে রিমুভ করা হয়েছে।',
            ]);
        }

        // If not found in Enrollment table, check if it's an Order ID (for Bundle)
        $order = Order::with(['user'])->find($id);
        if ($order && $order->bundle_id) {
            $bundle = CourseBundle::with('courses')->find($order->bundle_id);
            $user = $order->user;

            if ($bundle && $user) {
                $bundleCourseIds = $bundle->courses->pluck('id')->toArray();
                Enrollment::where('user_id', $user->id)
                    ->whereIn('course_id', $bundleCourseIds)
                    ->delete();
            }

            $order->delete();

            AuditLog::log('manual_bundle_unenrollment', 'Order', $id, null, [
                'admin_id' => auth()->id(),
                'user_id' => $user?->id,
                'user_name' => $user?->name,
                'user_phone' => $user?->phone,
                'bundle_id' => $order->bundle_id,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'শিক্ষার্থীকে বান্ডেল থেকে সফলভাবে রিমুভ করা হয়েছে।',
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'এনরোলমেন্ট বা অর্ডার রেকর্ড পাওয়া যায়নি।',
        ], 404);
    }

    /**
     * Bulk remove / revoke access of students from Course or Bundle.
     */
    public function bulkRemove(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'target_type' => ['required', 'string', 'in:course,bundle'],
            'target_id' => ['required', 'integer'],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer'],
            'enrollment_ids' => ['nullable', 'array'],
            'enrollment_ids.*' => ['integer'],
            'remove_all' => ['nullable', 'boolean'],
        ]);

        $targetType = $validated['target_type'];
        $targetId = (int) $validated['target_id'];
        $removeAll = $request->boolean('remove_all', false);
        $userIds = array_values(array_filter(array_unique($validated['user_ids'] ?? [])));
        $enrollmentIds = array_values(array_filter(array_unique($validated['enrollment_ids'] ?? [])));

        if (! $removeAll && empty($userIds) && empty($enrollmentIds)) {
            return response()->json([
                'status' => 'error',
                'message' => 'বাদ দেওয়ার জন্য অন্তত একজন শিক্ষার্থী নির্বাচন করুন।',
            ], 422);
        }

        $removedCount = 0;

        if ($targetType === 'bundle') {
            $bundle = CourseBundle::with('courses')->findOrFail($targetId);
            $bundleCourseIds = $bundle->courses->pluck('id')->toArray();

            DB::transaction(function () use (
                $bundle,
                $bundleCourseIds,
                $removeAll,
                $userIds,
                $enrollmentIds,
                &$removedCount
            ) {
                $ordersQuery = Order::where('bundle_id', $bundle->id);

                if (! $removeAll) {
                    if (! empty($userIds)) {
                        $ordersQuery->whereIn('user_id', $userIds);
                    } elseif (! empty($enrollmentIds)) {
                        $ordersQuery->whereIn('id', $enrollmentIds);
                    }
                }

                $orders = $ordersQuery->get();
                $targetUserIds = $orders->pluck('user_id')->filter()->unique()->values()->toArray();

                if (! empty($targetUserIds) && ! empty($bundleCourseIds)) {
                    Enrollment::whereIn('user_id', $targetUserIds)
                        ->whereIn('course_id', $bundleCourseIds)
                        ->delete();
                }

                $removedCount = $orders->count();
                $ordersQuery->delete();

                AuditLog::log('manual_bulk_unenroll_bundle', 'CourseBundle', $bundle->id, null, [
                    'admin_id' => auth()->id(),
                    'bundle_id' => $bundle->id,
                    'bundle_title' => $bundle->title,
                    'removed_count' => $removedCount,
                    'user_ids' => $targetUserIds,
                    'remove_all' => $removeAll,
                ]);
            });
        } else {
            // Course
            $course = Course::findOrFail($targetId);

            DB::transaction(function () use (
                $course,
                $removeAll,
                $userIds,
                $enrollmentIds,
                &$removedCount
            ) {
                $enrollmentQuery = Enrollment::where('course_id', $course->id);

                if (! $removeAll) {
                    if (! empty($userIds)) {
                        $enrollmentQuery->whereIn('user_id', $userIds);
                    } elseif (! empty($enrollmentIds)) {
                        $enrollmentQuery->whereIn('id', $enrollmentIds);
                    }
                }

                $deletedUserIds = (clone $enrollmentQuery)->pluck('user_id')->filter()->unique()->values()->toArray();
                $removedCount = $enrollmentQuery->count();

                $enrollmentQuery->delete();

                AuditLog::log('manual_bulk_unenroll_course', 'Course', $course->id, null, [
                    'admin_id' => auth()->id(),
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                    'removed_count' => $removedCount,
                    'user_ids' => $deletedUserIds,
                    'remove_all' => $removeAll,
                ]);
            });
        }

        return response()->json([
            'status' => 'success',
            'message' => "সফলভাবে {$removedCount} জন শিক্ষার্থীর কোর্স এক্সেস বাতিল করা হয়েছে।",
            'removed_count' => $removedCount,
        ]);
    }
}
