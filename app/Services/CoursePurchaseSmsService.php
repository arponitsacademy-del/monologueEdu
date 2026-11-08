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
     * Dispatches an automated SMS to the customer when a course or bundle purchase is confirmed.
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

        // Determine template (Bundle override vs Course override vs General fallback)
        $specificTemplate = null;

        if (! empty($order->bundle_id)) {
            $specificTemplate = CourseSmsTemplate::where('type', 'bundle')
                ->where('bundle_id', $order->bundle_id)
                ->where('is_active', true)
                ->first();
        } elseif (! empty($order->course_id)) {
            $specificTemplate = CourseSmsTemplate::where(function ($q) {
                    $q->where('type', 'course')->orWhereNull('type');
                })
                ->where('course_id', $order->course_id)
                ->where('is_active', true)
                ->first();
        }

        $rawTemplate = (! empty($specificTemplate) && ! empty(trim($specificTemplate->template)))
            ? $specificTemplate->template
            : $setting->general_template;

        if (empty(trim($rawTemplate))) {
            return [
                'success' => false,
                'status' => 'empty_template',
                'message' => 'SMS template is empty.',
            ];
        }

        // Render message placeholders
        $courseTitle = $order->course?->title ?? ($order->bundle?->title ?? 'Course');
        $bundleTitle = $order->bundle?->title ?? ($order->course?->title ?? 'Course Bundle');
        $studentName = $user?->name ?? 'Student';
        $orderNumber = $order->order_number ?? '#' . $order->id;
        $amount = '৳' . number_format((float) $order->final_amount, 2);
        $loginUrl = url('/login');
        $siteName = 'Monologue Edu';

        $rendered = str_replace(
            ['{student_name}', '{course_title}', '{bundle_title}', '{order_id}', '{amount}', '{site_name}', '{login_url}'],
            [$studentName, $courseTitle, $bundleTitle, $orderNumber, $amount, $siteName, $loginUrl],
            $rawTemplate
        );

        Log::info("Dispatching Purchase SMS to {$phone}: {$rendered}");

        return $this->smsService->sendSms($phone, $rendered, 'course_purchase');
    }
}
