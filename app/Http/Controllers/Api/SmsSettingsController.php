<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\SmsLog;
use App\Models\SmsSetting;
use App\Services\GreenWebSmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsSettingsController extends Controller
{
    public function getSettings(): JsonResponse
    {
        $settings = SmsSetting::current();

        return response()->json([
            'provider' => $settings->provider,
            'api_token_masked' => $settings->masked_token,
            'has_token' => ! empty($settings->api_token),
            'sender_id' => $settings->sender_id,
            'sms_enabled' => (bool) $settings->sms_enabled,
            'otp_enabled' => (bool) $settings->otp_enabled,
            'otp_expiration_minutes' => $settings->otp_expiration_minutes,
            'otp_resend_cooldown_seconds' => $settings->otp_resend_cooldown_seconds,
            'recent_logs' => SmsLog::latest('created_at')->limit(10)->get(),
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'api_token' => ['nullable', 'string'],
            'sender_id' => ['nullable', 'string', 'max:50'],
            'sms_enabled' => ['required', 'boolean'],
            'otp_enabled' => ['required', 'boolean'],
            'otp_expiration_minutes' => ['required', 'integer', 'min:1', 'max:60'],
            'otp_resend_cooldown_seconds' => ['required', 'integer', 'min:10', 'max:300'],
        ]);

        $settings = SmsSetting::current();

        $updateData = [
            'sender_id' => $validated['sender_id'] ?? null,
            'sms_enabled' => $validated['sms_enabled'],
            'otp_enabled' => $validated['otp_enabled'],
            'otp_expiration_minutes' => $validated['otp_expiration_minutes'],
            'otp_resend_cooldown_seconds' => $validated['otp_resend_cooldown_seconds'],
        ];

        // Update token only if provided (and not just masked placeholder)
        if (! empty($validated['api_token']) && ! str_contains($validated['api_token'], '****')) {
            $updateData['api_token'] = $validated['api_token'];
        }

        $settings->update($updateData);

        AuditLog::log('sms_settings_updated', 'SmsSetting', $settings->id, null, [
            'sms_enabled' => $settings->sms_enabled,
            'otp_enabled' => $settings->otp_enabled,
        ]);

        return response()->json([
            'message' => 'এসএমএস কনফিগারেশন সফলভাবে সেভ করা হয়েছে।',
            'settings' => [
                'provider' => $settings->provider,
                'api_token_masked' => $settings->masked_token,
                'has_token' => ! empty($settings->api_token),
                'sender_id' => $settings->sender_id,
                'sms_enabled' => (bool) $settings->sms_enabled,
                'otp_enabled' => (bool) $settings->otp_enabled,
                'otp_expiration_minutes' => $settings->otp_expiration_minutes,
                'otp_resend_cooldown_seconds' => $settings->otp_resend_cooldown_seconds,
            ],
        ]);
    }

    public function testSms(Request $request, GreenWebSmsService $smsService): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $result = $smsService->sendSms(
            $validated['phone'],
            'Novonex LMS: এটি গ্রিনওয়েব এসএমএস গেটওয়ের একটি টেস্ট মেসেজ।'
        );

        return response()->json($result);
    }
}
