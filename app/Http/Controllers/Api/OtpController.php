<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpVerification;
use App\Models\SmsSetting;
use App\Models\User;
use App\Services\GreenWebSmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OtpController extends Controller
{
    public function verify(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $normalizedPhone = User::normalizePhone($validated['phone']);

        $verification = OtpVerification::where('phone', $normalizedPhone)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (! $verification) {
            return response()->json([
                'message' => 'কোনো সক্রিয় ওটিপি অনুরোধ পাওয়া যায়নি। নতুন ওটিপি পাঠান।',
            ], 404);
        }

        if ($verification->expires_at->isPast()) {
            return response()->json([
                'message' => 'ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন ওটিপি পাঠান।',
            ], 422);
        }

        if ($verification->attempts >= 5) {
            return response()->json([
                'message' => 'সর্বোচ্চ সংখ্যক ভুল চেষ্টার সীমা অতিক্রম হয়েছে। নতুন ওটিপি পাঠান।',
            ], 429);
        }

        if (! Hash::check($validated['otp'], $verification->otp_hash)) {
            $verification->increment('attempts');

            return response()->json([
                'message' => 'ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক কোড দিন।',
                'remaining_attempts' => max(0, 5 - $verification->attempts),
            ], 422);
        }

        // Mark OTP as verified
        $verification->update(['verified_at' => now()]);

        // Check for existing user or create active account from registration payload
        $user = User::where('phone', $normalizedPhone)->first();

        if (! $user && ! empty($verification->payload)) {
            $payload = $verification->payload;

            // Prevent collision if email was registered concurrently
            if (User::where('email', $payload['email'])->exists()) {
                return response()->json([
                    'message' => 'এই ইমেইল ঠিকানাটি ইতিমধ্যে অন্য অ্যাকাউন্টে নিবন্ধিত হয়েছে।',
                ], 422);
            }

            // Create active user directly
            $user = User::create([
                'name' => $payload['name'],
                'phone' => $payload['phone'],
                'email' => $payload['email'],
                'password' => $payload['password'],
                'role' => $payload['role'] ?? User::ROLE_STUDENT,
                'status' => User::STATUS_ACTIVE,
            ]);

            // Clear payload after successful account activation
            $verification->update(['payload' => null]);
        }

        if ($user) {
            if ($user->status !== User::STATUS_ACTIVE) {
                $user->update(['status' => User::STATUS_ACTIVE]);
            }

            $token = AuthController::issueDeviceToken($user, $request);

            return response()->json([
                'message' => 'ওটিপি সফলভাবে যাচাই হয়েছে এবং অ্যাকাউন্ট সক্রিয় হয়েছে।',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ],
            ]);
        }

        return response()->json([
            'message' => 'ওটিপি সফলভাবে যাচাই হয়েছে।',
        ]);
    }

    public function resend(Request $request, GreenWebSmsService $smsService): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $normalizedPhone = User::normalizePhone($validated['phone']);
        $smsSettings = SmsSetting::current();

        $lastOtp = OtpVerification::where('phone', $normalizedPhone)->latest()->first();

        if ($lastOtp && $lastOtp->created_at->addSeconds($smsSettings->otp_resend_cooldown_seconds)->isFuture()) {
            $secondsRemaining = now()->diffInSeconds($lastOtp->created_at->addSeconds($smsSettings->otp_resend_cooldown_seconds));

            return response()->json([
                'message' => "পুনরায় ওটিপি পাঠাতে {$secondsRemaining} সেকেন্ড অপেক্ষা করুন।",
                'seconds_remaining' => $secondsRemaining,
            ], 429);
        }

        $otpCode = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes($smsSettings->otp_expiration_minutes ?: 5);

        // Preserve pending registration payload if present
        $existingPayload = $lastOtp ? $lastOtp->payload : null;

        OtpVerification::create([
            'phone' => $normalizedPhone,
            'otp_hash' => Hash::make($otpCode),
            'expires_at' => $expiresAt,
            'attempts' => 0,
            'verified_at' => null,
            'payload' => $existingPayload,
        ]);

        $smsMessage = "Novonex Academy-তে আপনার নতুন OTP কোড হল: {$otpCode}। এটি {$smsSettings->otp_expiration_minutes} মিনিট কার্যকর থাকবে।";
        $smsService->sendSms($normalizedPhone, $smsMessage);

        return response()->json([
            'message' => 'নতুন ওটিপি কোড পাঠানো হয়েছে।',
        ]);
    }
}
