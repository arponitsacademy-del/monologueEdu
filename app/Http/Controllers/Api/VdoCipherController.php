<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\WebsiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VdoCipherController extends Controller
{
    /**
     * Get VdoCipher configuration (Admin only)
     */
    public function getSettings(): JsonResponse
    {
        try {
            $setting = WebsiteSetting::current();
            $vdoSettings = $setting->vdocipher_settings ?? WebsiteSetting::defaultVdocipherSettings();

            return response()->json([
                'enabled' => (bool) ($vdoSettings['enabled'] ?? false),
                'watermark_enabled' => (bool) ($vdoSettings['watermark_enabled'] ?? true),
                'has_api_secret' => ! empty($vdoSettings['api_secret']),
                'api_secret' => $vdoSettings['api_secret'] ?? '',
            ]);
        } catch (\Throwable $e) {
            Log::error('VdoCipher getSettings error: ' . $e->getMessage());
            return response()->json([
                'enabled' => false,
                'watermark_enabled' => true,
                'has_api_secret' => false,
                'api_secret' => '',
            ]);
        }
    }

    /**
     * Update VdoCipher configuration (Admin only)
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'enabled' => ['required', 'boolean'],
                'api_secret' => ['nullable', 'string', 'max:500'],
                'watermark_enabled' => ['required', 'boolean'],
            ]);

            $setting = WebsiteSetting::current();
            $existing = $setting->vdocipher_settings ?? WebsiteSetting::defaultVdocipherSettings();

            // If api_secret is blank or masked and existing had one, retain existing unless cleared intentionally
            $newSecret = trim($validated['api_secret'] ?? '');
            if ($newSecret === '' && ! empty($existing['api_secret']) && ! $request->has('clear_secret')) {
                $newSecret = $existing['api_secret'];
            }

            $vdoSettings = [
                'enabled' => (bool) $validated['enabled'],
                'api_secret' => $newSecret,
                'watermark_enabled' => (bool) $validated['watermark_enabled'],
            ];

            try {
                $setting->update([
                    'vdocipher_settings' => $vdoSettings,
                ]);
            } catch (\Throwable $dbErr) {
                // If column is missing in production DB, run migration automatically on-the-fly
                try {
                    Artisan::call('migrate', ['--force' => true]);
                    $setting->refresh();
                    $setting->update([
                        'vdocipher_settings' => $vdoSettings,
                    ]);
                } catch (\Throwable $innerErr) {
                    Log::error('VdoCipher auto-migrate failed: ' . $innerErr->getMessage());
                }
            }

            try {
                AuditLog::log('vdocipher_settings_updated', 'WebsiteSetting', $setting->id, null, [
                    'enabled' => $vdoSettings['enabled'],
                    'watermark_enabled' => $vdoSettings['watermark_enabled'],
                    'has_api_secret' => ! empty($vdoSettings['api_secret']),
                ]);
            } catch (\Throwable $_) {}

            return response()->json([
                'success' => true,
                'message' => 'VdoCipher কনফিগারেশন সফলভাবে সংরক্ষণ করা হয়েছে।',
                'settings' => [
                    'enabled' => $vdoSettings['enabled'],
                    'watermark_enabled' => $vdoSettings['watermark_enabled'],
                    'has_api_secret' => ! empty($vdoSettings['api_secret']),
                    'api_secret' => $vdoSettings['api_secret'],
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('VdoCipher updateSettings failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test VdoCipher connection (Admin only)
     */
    public function testConnection(Request $request): JsonResponse
    {
        $setting = WebsiteSetting::current();
        $existing = $setting->vdocipher_settings ?? [];

        $secret = trim($request->input('api_secret', ''));
        if (empty($secret)) {
            $secret = $existing['api_secret'] ?? '';
        }

        if (empty($secret)) {
            return response()->json([
                'success' => false,
                'message' => 'VdoCipher API Secret দেওয়া হয়নি। অনুগ্রহ করে Secret Key লিখুন।',
            ]);
        }

        try {
            // Call VdoCipher API to verify credentials
            $response = Http::withHeaders([
                'Authorization' => "Apisecret {$secret}",
                'Accept' => 'application/json',
            ])->timeout(12)->get('https://dev.vdocipher.com/api/videos/count');

            if ($response->successful()) {
                $count = $response->json('count', 0);
                return response()->json([
                    'success' => true,
                    'message' => "VdoCipher API Secret সফলভাবে সংযুক্ত হয়েছে! মোট ভিডিও: {$count}",
                    'video_count' => $count,
                ]);
            }

            if ($response->status() === 401) {
                return response()->json([
                    'success' => false,
                    'message' => 'VdoCipher API Secret সঠিক নয় (401 Unauthorized)। অনুগ্রহ করে VdoCipher ড্যাশবোর্ড থেকে সঠিক Secret Key কপি করুন।',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'VdoCipher সার্ভার রেসপন্স: ' . ($response->json('message') ?? 'HTTP ' . $response->status()),
            ]);
        } catch (\Throwable $e) {
            Log::error('VdoCipher test connection failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'কানেকশন এরর: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Generate VdoCipher Direct Upload Credentials (Admin / Teachers)
     */
    public function getUploadCredentials(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'folder_id' => ['nullable', 'string', 'max:100'],
        ]);

        $setting = WebsiteSetting::current();
        $vdoSettings = $setting->vdocipher_settings ?? [];
        $secret = $vdoSettings['api_secret'] ?? '';

        if (empty($secret)) {
            return response()->json([
                'message' => 'VdoCipher API Secret কনফিগার করা হয়নি। অ্যাডমিন সেটিংস থেকে VdoCipher Secret Key সেট করুন।',
            ], 400);
        }

        try {
            $queryParams = [
                'title' => $validated['title'],
            ];
            if (! empty($validated['folder_id'])) {
                $queryParams['folderId'] = $validated['folder_id'];
            }

            $response = Http::withHeaders([
                'Authorization' => "Apisecret {$secret}",
                'Accept' => 'application/json',
            ])->timeout(15)->put('https://dev.vdocipher.com/api/videos?' . http_build_query($queryParams));

            if (! $response->successful()) {
                Log::error('VdoCipher credentials request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json([
                    'message' => 'VdoCipher আপলোড ক্রেডেনশিয়াল পেতে সমস্যা হয়েছে: ' . ($response->json('message') ?? $response->body()),
                ], $response->status() ?: 500);
            }

            $data = $response->json();
            $clientPayload = $data['clientPayload'] ?? null;
            $videoId = $data['video']['id'] ?? ($data['videoId'] ?? null);

            if (! $clientPayload || ! $videoId) {
                return response()->json([
                    'message' => 'VdoCipher থেকে অসম্পূর্ণ আপলোড তথ্য পাওয়া গেছে।',
                ], 500);
            }

            // Ensure both uploadLink and upload_link are defined for backward/forward compatibility
            $uploadUrl = $clientPayload['uploadLink'] ?? ($clientPayload['upload_link'] ?? '');
            $clientPayload['uploadLink'] = $uploadUrl;
            $clientPayload['upload_link'] = $uploadUrl;

            return response()->json([
                'clientPayload' => $clientPayload,
                'videoId' => $videoId,
            ]);
        } catch (\Throwable $e) {
            Log::error('VdoCipher getUploadCredentials exception: ' . $e->getMessage());
            return response()->json([
                'message' => 'সার্ভার এরর: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate Playback OTP & PlaybackInfo with DRM Dynamic Student Watermark
     */
    public function getOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id' => ['required', 'string', 'max:100'],
        ]);

        $setting = WebsiteSetting::current();
        $vdoSettings = $setting->vdocipher_settings ?? [];
        $secret = $vdoSettings['api_secret'] ?? '';

        if (empty($secret)) {
            return response()->json([
                'message' => 'VdoCipher API Secret কনফিগার করা হয়নি।',
            ], 400);
        }

        $user = $request->user();
        $watermarkEnabled = (bool) ($vdoSettings['watermark_enabled'] ?? true);

        // Build dynamic watermark text (Phone / Email / Name)
        $watermarkText = 'Novonex Academy';
        if ($user) {
            $parts = [];
            if (! empty($user->phone)) {
                $parts[] = $user->phone;
            } elseif (! empty($user->email)) {
                $parts[] = $user->email;
            }
            if (! empty($user->name)) {
                $parts[] = $user->name;
            }
            if (! empty($parts)) {
                $watermarkText = implode(' • ', $parts);
            }
        }

        $payload = [
            'ttl' => 300, // 5 minutes validity
        ];

        if ($watermarkEnabled) {
            $payload['annotate'] = json_encode([
                [
                    'type' => 'rtext',
                    'text' => $watermarkText,
                    'alpha' => '0.65',
                    'color' => '0xFFFFFF',
                    'size' => '15',
                    'interval' => '5000',
                ],
            ]);
        }

        try {
            $videoId = $validated['video_id'];
            $response = Http::withHeaders([
                'Authorization' => "Apisecret {$secret}",
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(10)->post("https://dev.vdocipher.com/api/videos/{$videoId}/otp", $payload);

            if (! $response->successful()) {
                Log::error('VdoCipher OTP request failed', [
                    'videoId' => $videoId,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json([
                    'message' => 'ভিডিও প্লেব্যাক তৈরি করতে ব্যর্থ হয়েছে: ' . ($response->json('message') ?? 'VdoCipher Error'),
                ], $response->status() ?: 500);
            }

            $data = $response->json();
            return response()->json([
                'otp' => $data['otp'] ?? '',
                'playbackInfo' => $data['playbackInfo'] ?? '',
            ]);
        } catch (\Throwable $e) {
            Log::error('VdoCipher getOtp exception: ' . $e->getMessage());
            return response()->json([
                'message' => 'ভিডিও প্লেব্যাক এরর: ' . $e->getMessage(),
            ], 500);
        }
    }
}
