<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Course;
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
     * Get list of all courses for manual enrollment dropdown.
     */
    public function courses(): JsonResponse
    {
        $courses = Course::select('id', 'title', 'slug', 'thumbnail', 'price', 'discount_price', 'status', 'category_id')
            ->with(['category:id,name'])
            ->withCount(['enrollments' => function ($q) {
                $q->where('status', Enrollment::STATUS_ACTIVE);
            }])
            ->orderBy('title')
            ->get();

        return response()->json([
            'status' => 'success',
            'courses' => $courses,
        ]);
    }

    /**
     * Search users by name, phone, or email.
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));
        $courseId = $request->input('course_id');

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
            ->limit(20)
            ->get();

        // Check enrollment status for course
        $enrolledUserIds = [];
        if (! empty($courseId) && $users->isNotEmpty()) {
            $enrolledUserIds = Enrollment::where('course_id', $courseId)
                ->whereIn('user_id', $users->pluck('id'))
                ->where('status', Enrollment::STATUS_ACTIVE)
                ->pluck('user_id')
                ->toArray();
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
            'course_id' => ['nullable', 'integer'],
        ]);

        $rawPhones = $request->input('phones');
        $courseId = $request->input('course_id');

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
        $matchedPhoneSet = [];

        foreach ($normalizedList as $phone) {
            $user = User::where('phone', $phone)
                ->orWhere('phone', '+88' . $phone)
                ->orWhere('phone', '88' . $phone)
                ->orWhere('phone', 'like', "%{$phone}")
                ->first();

            if ($user) {
                if (! isset($matchedUsers[$user->id])) {
                    $isEnrolled = false;
                    if (! empty($courseId)) {
                        $isEnrolled = Enrollment::where('course_id', $courseId)
                            ->where('user_id', $user->id)
                            ->where('status', Enrollment::STATUS_ACTIVE)
                            ->exists();
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
                $matchedPhoneSet[] = $phone;
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
     * Perform the manual enrollment for the selected users.
     */
    public function enroll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['required', 'exists:users,id'],
            'send_sms' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $course = Course::findOrFail($validated['course_id']);
        $userIds = array_unique($validated['user_ids']);
        $sendSms = $request->boolean('send_sms', false);
        $notes = $validated['notes'] ?? 'Manual enrollment by admin';

        $enrolled = [];
        $alreadyEnrolled = [];
        $failed = [];

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

                    // 1. Create paid Order for audit and accounting
                    $orderNumber = 'MAN-' . now()->format('ymd') . '-' . strtoupper(Str::random(5));
                    $order = Order::create([
                        'order_number' => $orderNumber,
                        'user_id' => $user->id,
                        'course_id' => $course->id,
                        'original_price' => $course->price ?? 0,
                        'discount_amount' => 0,
                        'final_amount' => $course->price ?? 0,
                        'payment_status' => Order::PAYMENT_PAID,
                        'order_status' => Order::ORDER_COMPLETED,
                        'payment_method' => 'manual_admin',
                        'notes' => $notes . ' (Admin #' . auth()->id() . ')',
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
                    AuditLog::log('manual_enrollment_created', 'Enrollment', $enrollment->id, null, [
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

        return response()->json([
            'status' => 'success',
            'message' => count($enrolled) . ' জন শিক্ষার্থী সফলভাবে এনরোল সম্পন্ন হয়েছে।',
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
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
            ])
            ->latest()
            ->paginate($perPage);

        return response()->json($orders);
    }
}
