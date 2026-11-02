<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\SmsCampaign;
use App\Models\User;
use App\Models\WebsiteSetting;
use App\Services\GreenWebSmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsMarketingController extends Controller
{
    /**
     * Get courses list with enrolled students count for audience selection.
     */
    public function getCourses(): JsonResponse
    {
        $courses = Course::select('id', 'title', 'thumbnail', 'status')
            ->withCount(['enrollments' => function ($q) {
                $q->where('status', 'active');
            }])
            ->latest()
            ->get();

        return response()->json($courses);
    }

    /**
     * Preview recipient count and samples based on audience criteria.
     */
    public function getPreview(Request $request): JsonResponse
    {
        $targetType = $request->input('target_type', 'all');
        $courseId = $request->input('course_id');
        $customNumbers = $request->input('custom_numbers');

        $recipients = $this->resolveRecipients($targetType, $courseId, $customNumbers);

        $total = count($recipients);
        $sample = array_slice($recipients, 0, 5);

        // Mask phone numbers for privacy in preview
        $maskedSample = array_map(function ($item) {
            $phone = $item['phone'];
            $len = strlen($phone);
            if ($len > 6) {
                $masked = substr($phone, 0, 4) . str_repeat('*', $len - 7) . substr($phone, -3);
            } else {
                $masked = $phone;
            }

            return [
                'name' => $item['name'],
                'phone' => $masked,
            ];
        }, $sample);

        $course = null;
        if ($targetType === 'course' && $courseId) {
            $course = Course::select('id', 'title', 'thumbnail')->find($courseId);
        }

        return response()->json([
            'total_recipients' => $total,
            'sample_recipients' => $maskedSample,
            'course' => $course,
        ]);
    }

    /**
     * Send marketing / bulk SMS to targeted audience.
     */
    public function sendMarketingSms(Request $request, GreenWebSmsService $smsService): JsonResponse
    {
        $request->validate([
            'target_type' => ['required', 'string', 'in:all,students,teachers,course,custom'],
            'course_id' => ['nullable', 'required_if:target_type,course', 'exists:courses,id'],
            'custom_numbers' => ['nullable', 'required_if:target_type,custom', 'string'],
            'message' => ['required', 'string', 'min:2', 'max:1000'],
            'title' => ['nullable', 'string', 'max:120'],
        ]);

        $targetType = $request->input('target_type');
        $courseId = $request->input('course_id');
        $customNumbers = $request->input('custom_numbers');
        $rawMessage = $request->input('message');
        $titleInput = $request->input('title');

        $recipients = $this->resolveRecipients($targetType, $courseId, $customNumbers);

        if (empty($recipients)) {
            return response()->json([
                'message' => 'নির্বাচিত টার্গেটে কোনো বৈধ মোবাইল নম্বর পাওয়া যায়নি।',
            ], 422);
        }

        $course = null;
        if ($targetType === 'course' && $courseId) {
            $course = Course::find($courseId);
        }

        $setting = WebsiteSetting::first();
        $siteName = $setting ? $setting->site_name : 'Novonex Academy';

        $campaignTitle = $titleInput;
        if (empty($campaignTitle)) {
            if ($targetType === 'course' && $course) {
                $campaignTitle = $course->title . ' - স্টুডেন্ট নোটিশ';
            } elseif ($targetType === 'students') {
                $campaignTitle = 'সকল শিক্ষার্থী বাল্ক বার্তা';
            } elseif ($targetType === 'teachers') {
                $campaignTitle = 'সকল শিক্ষক নোটিশ';
            } elseif ($targetType === 'custom') {
                $campaignTitle = 'কাস্টম নম্বর ক্যাম্পেইন';
            } else {
                $campaignTitle = 'সকল ব্যবহারকারী প্রচার বার্তা';
            }
        }

        // Create campaign record
        $campaign = SmsCampaign::create([
            'user_id' => auth()->id(),
            'title' => $campaignTitle,
            'target_type' => $targetType,
            'course_id' => $courseId,
            'message' => $rawMessage,
            'total_recipients' => count($recipients),
            'status' => 'processing',
        ]);

        $sentCount = 0;
        $failedCount = 0;

        foreach ($recipients as $recipient) {
            // Replace variables
            $personalizedMessage = str_replace(
                ['{name}', '{site_name}', '{course_title}'],
                [$recipient['name'] ?: 'প্রিয় শিক্ষার্থী', $siteName, $course ? $course->title : ''],
                $rawMessage
            );

            $result = $smsService->sendSms(
                $recipient['phone'],
                $personalizedMessage,
                'marketing',
                $campaign->id
            );

            if ($result['success']) {
                $sentCount++;
            } else {
                $failedCount++;
            }
        }

        $campaign->update([
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
            'status' => 'completed',
        ]);

        return response()->json([
            'message' => "ক্যাম্পেইন সফলভাবে সম্পন্ন হয়েছে! সফল: {$sentCount} টি, ব্যর্থ: {$failedCount} টি।",
            'campaign' => $campaign->load('course:id,title'),
        ]);
    }

    /**
     * Get campaign history.
     */
    public function getHistory(): JsonResponse
    {
        $campaigns = SmsCampaign::with(['course:id,title', 'user:id,name'])
            ->latest()
            ->paginate(15);

        return response()->json($campaigns);
    }

    /**
     * Helper to resolve recipients list without duplicates.
     *
     * @return array<int, array{name: string, phone: string}>
     */
    protected function resolveRecipients(string $targetType, ?int $courseId, ?string $customNumbers): array
    {
        $uniqueMap = [];

        if ($targetType === 'course' && $courseId) {
            $users = User::whereHas('enrollments', function ($q) use ($courseId) {
                $q->where('course_id', $courseId)->where('status', 'active');
            })
            ->whereNotNull('phone')
            ->select('id', 'name', 'phone')
            ->get();

            foreach ($users as $user) {
                $normalized = User::normalizePhone($user->phone);
                if ($normalized && User::isValidPhoneNumber($normalized)) {
                    $uniqueMap[$normalized] = [
                        'name' => $user->name,
                        'phone' => $normalized,
                    ];
                }
            }
        } elseif ($targetType === 'students') {
            $users = User::where('role', 'student')
                ->whereNotNull('phone')
                ->select('id', 'name', 'phone')
                ->get();

            foreach ($users as $user) {
                $normalized = User::normalizePhone($user->phone);
                if ($normalized && User::isValidPhoneNumber($normalized)) {
                    $uniqueMap[$normalized] = [
                        'name' => $user->name,
                        'phone' => $normalized,
                    ];
                }
            }
        } elseif ($targetType === 'teachers') {
            $users = User::where('role', 'teacher')
                ->whereNotNull('phone')
                ->select('id', 'name', 'phone')
                ->get();

            foreach ($users as $user) {
                $normalized = User::normalizePhone($user->phone);
                if ($normalized && User::isValidPhoneNumber($normalized)) {
                    $uniqueMap[$normalized] = [
                        'name' => $user->name,
                        'phone' => $normalized,
                    ];
                }
            }
        } elseif ($targetType === 'all') {
            $users = User::whereNotNull('phone')
                ->select('id', 'name', 'phone')
                ->get();

            foreach ($users as $user) {
                $normalized = User::normalizePhone($user->phone);
                if ($normalized && User::isValidPhoneNumber($normalized)) {
                    $uniqueMap[$normalized] = [
                        'name' => $user->name,
                        'phone' => $normalized,
                    ];
                }
            }
        } elseif ($targetType === 'custom' && $customNumbers) {
            // Split by comma, whitespace, or newline
            $rawList = preg_split('/[\r\n,]+/', $customNumbers, -1, PREG_SPLIT_NO_EMPTY);
            foreach ($rawList as $raw) {
                $trimmed = trim($raw);
                if (! empty($trimmed)) {
                    $normalized = User::normalizePhone($trimmed);
                    if ($normalized && User::isValidPhoneNumber($normalized)) {
                        $uniqueMap[$normalized] = [
                            'name' => 'গ্রাহক',
                            'phone' => $normalized,
                        ];
                    }
                }
            }
        }

        return array_values($uniqueMap);
    }
}
