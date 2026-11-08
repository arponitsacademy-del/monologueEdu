<?php

namespace App\Services;

use App\Models\CoursePurchaseSmsSetting;
use App\Models\CourseSmsTemplate;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class CoursePurchaseSmsService
{
    public function __construct(
        protected GreenWebSmsService $smsService
    ) {}

    /**
     * Dispatches an automated SMS to the customer when a course purchase is confirmed.
     */
    public function sendPurchaseSms(Order $order): array
    {
        $setting = CoursePurchaseSmsSetting::current();
        if (! $setting->enabled) {
            return [
                'success' => false,
                'status' => 'disabled',
                'message' => 'Course purchase auto SMS is disabled in settings.',
            ];
        }

        $user = $order->user;
        $phone = $user?->phone ?? $order->latestPayment?->sender_phone;
        if (empty($phone)) {
            return [
                'success' => false,
                'status' => 'no_phone',
                'message' => 'User does not have a phone number.',
            ];
        }

        // Determine template (Course override vs General fallback)
        $courseTemplate = null;
        if ($order->course_id) {
            $courseTemplate = CourseSmsTemplate::where('course_id', $order->course_id)
                ->where('is_active', true)
                ->first();
        }

        $rawTemplate = (! empty($courseTemplate) && ! empty(trim($courseTemplate->template)))
            ? $courseTemplate->template
            : $setting->general_template;

        if (empty(trim($rawTemplate))) {
            return [
                'success' => false,
                'status' => 'empty_template',
                'message' => 'SMS template is empty.',
            ];
        }

        // Render message placeholders
        $courseTitle = $order->course?->title ?? 'Course';
        $studentName = $user?->name ?? 'Student';
        $orderNumber = $order->order_number ?? '#' . $order->id;
        $amount = '৳' . number_format((float) $order->final_amount, 2);
        $loginUrl = url('/login');
        $siteName = 'Monologue Edu';

        $rendered = str_replace(
            ['{student_name}', '{course_title}', '{order_id}', '{amount}', '{site_name}', '{login_url}'],
            [$studentName, $courseTitle, $orderNumber, $amount, $siteName, $loginUrl],
            $rawTemplate
        );

        Log::info("Dispatching Course Purchase SMS to {$phone}: {$rendered}");

        return $this->smsService->sendSms($phone, $rendered, 'course_purchase');
    }
}

