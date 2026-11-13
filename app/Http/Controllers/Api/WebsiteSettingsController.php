<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebsiteSettingsController extends Controller
{
    public function getSettings(): JsonResponse
    {
        $settings = WebsiteSetting::current();
        return response()->json($settings->toArray());
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site_name' => ['sometimes', 'required', 'string', 'max:255'],
            'site_tagline' => ['nullable', 'string', 'max:255'],
            'default_language' => ['sometimes', 'string', 'in:en,bn'],
            'logo_url' => ['nullable', 'string', 'max:1000'],
            'favicon_url' => ['nullable', 'string', 'max:1000'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'primary_color' => ['sometimes', 'required', 'string', 'max:20'],
            'secondary_color' => ['sometimes', 'required', 'string', 'max:20'],
            'copyright_text' => ['nullable', 'string', 'max:500'],
            'header_settings' => ['nullable', 'array'],
            'footer_settings' => ['nullable', 'array'],
            'manual_payment_settings' => ['nullable', 'array'],
        ]);

        $settings = WebsiteSetting::current();

        if (array_key_exists('logo_url', $validated)) {
            $header = $settings->header_settings ?? [];
            $header['logo_url'] = $validated['logo_url'];
            $validated['header_settings'] = $header;
        }

        $settings->update($validated);

        AuditLog::log('website_settings_updated', 'WebsiteSetting', $settings->id, null, $validated);

        return response()->json([
            'message' => 'ওয়েবসাইট সেটিংস সফলভাবে আপডেট করা হয়েছে।',
            'settings' => $settings,
        ]);
    }

    public function updateHeaderSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'header_settings' => ['required', 'array'],
        ]);

        $settings = WebsiteSetting::current();
        $updates = [
            'header_settings' => $validated['header_settings'],
        ];

        if (array_key_exists('logo_url', $validated['header_settings'])) {
            $updates['logo_url'] = $validated['header_settings']['logo_url'];
        }

        $settings->update($updates);

        AuditLog::log('header_settings_updated', 'WebsiteSetting', $settings->id, null, $validated);

        return response()->json([
            'message' => 'হেডার বিল্ডার সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।',
            'settings' => $settings,
            'header_settings' => $settings->header_settings,
        ]);
    }

    public function updateFooterSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'footer_settings' => ['required', 'array'],
        ]);

        $settings = WebsiteSetting::current();
        $updates = [
            'footer_settings' => $validated['footer_settings'],
        ];

        if (array_key_exists('copyright_text', $validated['footer_settings'])) {
            $updates['copyright_text'] = $validated['footer_settings']['copyright_text'];
        }

        $settings->update($updates);

        AuditLog::log('footer_settings_updated', 'WebsiteSetting', $settings->id, null, $validated);

        return response()->json([
            'message' => 'ফুটার বিল্ডার সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।',
            'settings' => $settings,
            'footer_settings' => $settings->footer_settings,
        ]);
    }

    public function updateManualPaymentSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'manual_payment_settings' => ['required', 'array'],
            'manual_payment_settings.bkash' => ['required', 'array'],
            'manual_payment_settings.bkash.enabled' => ['required', 'boolean'],
            'manual_payment_settings.bkash.account_number' => ['required', 'string', 'max:50'],
            'manual_payment_settings.bkash.type' => ['required', 'string', 'in:send_money,payment,cash_out'],
            'manual_payment_settings.bkash.instructions' => ['nullable', 'string', 'max:1000'],
            'manual_payment_settings.bkash.instructions_en' => ['nullable', 'string', 'max:1000'],
            'manual_payment_settings.nagad' => ['required', 'array'],
            'manual_payment_settings.nagad.enabled' => ['required', 'boolean'],
            'manual_payment_settings.nagad.account_number' => ['required', 'string', 'max:50'],
            'manual_payment_settings.nagad.type' => ['required', 'string', 'in:send_money,payment,cash_out'],
            'manual_payment_settings.nagad.instructions' => ['nullable', 'string', 'max:1000'],
            'manual_payment_settings.nagad.instructions_en' => ['nullable', 'string', 'max:1000'],
            'manual_payment_settings.rocket' => ['required', 'array'],
            'manual_payment_settings.rocket.enabled' => ['required', 'boolean'],
            'manual_payment_settings.rocket.account_number' => ['required', 'string', 'max:50'],
            'manual_payment_settings.rocket.type' => ['required', 'string', 'in:send_money,payment,cash_out'],
            'manual_payment_settings.rocket.instructions' => ['nullable', 'string', 'max:1000'],
            'manual_payment_settings.rocket.instructions_en' => ['nullable', 'string', 'max:1000'],
        ]);

        $settings = WebsiteSetting::current();
        $settings->update([
            'manual_payment_settings' => $validated['manual_payment_settings'],
        ]);

        AuditLog::log('manual_payment_settings_updated', 'WebsiteSetting', $settings->id, null, $validated);

        return response()->json([
            'message' => 'ম্যানুয়াল পেমেন্ট সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।',
            'settings' => $settings,
            'manual_payment_settings' => $settings->manual_payment_settings,
        ]);
    }
}
