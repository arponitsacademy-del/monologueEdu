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
}
