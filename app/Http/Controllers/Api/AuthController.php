<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpVerification;
use App\Models\SmsSetting;
use App\Models\User;
use App\Services\GreenWebSmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Parse User-Agent into a clean human-readable device name
     */
    public static function parseDeviceName(?string $userAgent): string
    {
        if (empty($userAgent)) {
            return 'অজানা ডিভাইস (Device)';
        }

        $platform = 'Device';
        if (preg_match('/windows nt 10/i', $userAgent)) {
            $platform = 'Windows 10/11';
        } elseif (preg_match('/windows nt/i', $userAgent)) {
            $platform = 'Windows';
        } elseif (preg_match('/iphone/i', $userAgent)) {
            $platform = 'iPhone';
        } elseif (preg_match('/ipad/i', $userAgent)) {
            $platform = 'iPad';
        } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
            $platform = 'macOS';
        } elseif (preg_match('/android/i', $userAgent)) {
            $platform = 'Android';
        } elseif (preg_match('/linux/i', $userAgent)) {
            $platform = 'Linux';
        }

        $browser = 'Browser';
        if (preg_match('/edg/i', $userAgent)) {
            $browser = 'Edge';
        } elseif (preg_match('/chrome|crios/i', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/firefox|fxios/i', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/safari/i', $userAgent) && ! preg_match('/chrome/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/opera|opr/i', $userAgent)) {
            $browser = 'Opera';
        }

        return "{$browser} on {$platform}";
    }

    /**
     * Issue an access token for user while strictly enforcing max 2 simultaneous devices
     */
    public static function issueDeviceToken(User $user, Request $request): string
    {
        try {
            if (! Schema::hasColumn('personal_access_tokens', 'ip_address')) {
                Artisan::call('migrate', ['--force' => true]);
            }
        } catch (\Throwable $e) {
        }

        // Enforce max 2 simultaneous active devices:
        // Retrieve existing active tokens ordered from newest to oldest
        $existingTokens = $user->tokens()
            ->orderByRaw('COALESCE(last_used_at, created_at) DESC')
            ->get();

        // If user already has 2 or more devices, revoke the oldest ones so that adding this new token keeps total <= 2
        if ($existingTokens->count() >= 2) {
            $tokensToDelete = $existingTokens->slice(1);
            foreach ($tokensToDelete as $oldToken) {
                $oldToken->delete();
            }
        }

        $deviceName = self::parseDeviceName($request->userAgent());
        $newAccessToken = $user->createToken($deviceName);
        $plainToken = $newAccessToken->plainTextToken;

        try {
            $tokenId = $newAccessToken->accessToken->id;
            DB::table('personal_access_tokens')->where('id', $tokenId)->update([
                'ip_address' => $request->ip(),
                'user_agent' => substr($request->userAgent() ?: '', 0, 500),
                'last_used_at' => now(),
            ]);
        } catch (\Throwable $e) {
        }

        return $plainToken;
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $normalizedPhone = User::normalizePhone($validated['phone']);

        if (! $normalizedPhone) {
            return response()->json([
                'message' => 'সঠিক বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 017xxxxxxxx)।',
                'errors' => ['phone' => ['সঠিক বাংলাদেশি মোবাইল নম্বর দিন।']],
            ], 422);
        }

        $user = User::where('phone', $normalizedPhone)->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়।',
                'errors' => ['phone' => ['মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়।']],
            ], 401);
        }

        if ($user->status !== User::STATUS_ACTIVE) {
            return response()->json([
                'message' => 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা আছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।',
            ], 403);
        }

        $token = self::issueDeviceToken($user, $request);

        return response()->json([
            'message' => 'সফলভাবে লগইন হয়েছে।',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'custom_role_id' => $user->custom_role_id,
                'custom_role' => $user->customRole,
                'status' => $user->status,
            ],
        ]);
    }

    public function register(Request $request, GreenWebSmsService $smsService): JsonResponse
    {
        $normalizedPhone = User::normalizePhone($request->input('phone'));

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! $normalizedPhone || ! User::isValidPhoneNumber($normalizedPhone)) {
            return response()->json([
                'message' => 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।',
                'errors' => ['phone' => ['সঠিক বাংলাদেশি মোবাইল নম্বর প্রদান করুন।']],
            ], 422);
        }

        if (User::where('phone', $normalizedPhone)->exists()) {
            return response()->json([
                'message' => 'এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত রয়েছে।',
                'errors' => ['phone' => ['এই মোবাইল নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে।']],
            ], 422);
        }

        $smsSettings = SmsSetting::current();

        if ($smsSettings->otp_enabled) {
            $otpCode = (string) random_int(100000, 999999);
            $expiresAt = now()->addMinutes($smsSettings->otp_expiration_minutes ?: 5);

            OtpVerification::updateOrCreate(
                ['phone' => $normalizedPhone],
                [
                    'otp_hash' => Hash::make($otpCode),
                    'expires_at' => $expiresAt,
                    'attempts' => 0,
                    'verified_at' => null,
                    'payload' => [
                        'name' => $validated['name'],
                        'phone' => $normalizedPhone,
                        'email' => $validated['email'],
                        'password' => $validated['password'],
                        'role' => User::ROLE_STUDENT,
                    ],
                ]
            );

            $smsMessage = "Monologue Edu-তে আপনার OTP কোড হল: {$otpCode}। এটি {$smsSettings->otp_expiration_minutes} মিনিট কার্যকর থাকবে।";
            $smsService->sendSms($normalizedPhone, $smsMessage);

            return response()->json([
                'message' => 'আপনার ফোনে ৬ ডিজিটের একটি ওটিপি কোড পাঠানো হয়েছে। নম্বর যাচাই করার পর অ্যাকাউন্ট চালু হবে।',
                'requires_otp' => true,
                'phone' => $normalizedPhone,
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $normalizedPhone,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $token = self::issueDeviceToken($user, $request);

        return response()->json([
            'message' => 'রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে।',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
        ], 201);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'custom_role_id' => $user->custom_role_id,
                'custom_role' => $user->customRole,
                'status' => $user->status,
                'enrolled_courses_count' => $user->enrolledCourses()->count(),
                'unread_notifications_count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'সফলভাবে লগআউট করা হয়েছে।',
        ]);
    }

    /**
     * FORGOT PASSWORD: Send OTP
     */
    public function forgotPasswordSendOtp(Request $request, GreenWebSmsService $smsService): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $normalizedPhone = User::normalizePhone($validated['phone']);

        if (! $normalizedPhone) {
            return response()->json([
                'message' => 'সঠিক বাংলাদেশি মোবাইল নম্বর প্রদান করুন।',
            ], 422);
        }

        $user = User::where('phone', $normalizedPhone)->first();

        if (! $user) {
            return response()->json([
                'message' => 'এই মোবাইল নম্বরের সাথে নিবন্ধিত কোনো অ্যাকাউন্ট পাওয়া যায়নি।',
            ], 404);
        }

        $lastOtp = OtpVerification::where('phone', $normalizedPhone)->latest()->first();
        if ($lastOtp && $lastOtp->created_at->addSeconds(60)->isFuture()) {
            $secondsRemaining = now()->diffInSeconds($lastOtp->created_at->addSeconds(60));
            return response()->json([
                'message' => "পুনরায় ওটিপি পাঠাতে {$secondsRemaining} সেকেন্ড অপেক্ষা করুন।",
                'seconds_remaining' => $secondsRemaining,
            ], 429);
        }

        $otpCode = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(10);

        OtpVerification::create([
            'phone' => $normalizedPhone,
            'otp_hash' => Hash::make($otpCode),
            'expires_at' => $expiresAt,
            'attempts' => 0,
            'verified_at' => null,
            'payload' => [
                'action' => 'password_reset',
                'user_id' => $user->id,
            ],
        ]);

        $smsMessage = "Monologue Edu-তে আপনার পাসওয়ার্ড রিসেট OTP কোড হল: {$otpCode}। এটি ১০ মিনিট কার্যকর থাকবে।";
        $smsService->sendSms($normalizedPhone, $smsMessage);

        return response()->json([
            'message' => 'আপনার মোবাইল নম্বরে ৬ ডিজিটের একটি ওটিপি কোড পাঠানো হয়েছে।',
            'phone' => $normalizedPhone,
        ]);
    }

    /**
     * FORGOT PASSWORD: Verify OTP
     */
    public function forgotPasswordVerifyOtp(Request $request): JsonResponse
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
                'message' => 'কোনো ওটিপি অনুরোধ পাওয়া যায়নি। নতুন ওটিপি পাঠান।',
            ], 404);
        }

        if ($verification->expires_at->isPast()) {
            return response()->json([
                'message' => 'ওটিপি কোডের মেয়াদ শেষ হয়ে গেছে। নতুন ওটিপি পাঠান।',
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

        $verification->update(['verified_at' => now()]);

        return response()->json([
            'message' => 'ওটিপি সফলভাবে যাচাই হয়েছে। এবার আপনার নতুন পাসওয়ার্ড সেট করুন।',
            'verified' => true,
        ]);
    }

    /**
     * FORGOT PASSWORD: Reset password and auto-login
     */
    public function forgotPasswordReset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'otp' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $normalizedPhone = User::normalizePhone($validated['phone']);

        // Check verification was marked within last 15 minutes
        $verification = OtpVerification::where('phone', $normalizedPhone)
            ->whereNotNull('verified_at')
            ->where('verified_at', '>=', now()->subMinutes(15))
            ->latest()
            ->first();

        if (! $verification) {
            return response()->json([
                'message' => 'যাচাইকরণের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় ওটিপি দিয়ে শুরু করুন।',
            ], 422);
        }

        $user = User::where('phone', $normalizedPhone)->firstOrFail();
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Auto login user
        $token = self::issueDeviceToken($user, $request);

        return response()->json([
            'message' => 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। স্বাগতম!',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
        ]);
    }

    /**
     * DEVICE MANAGEMENT: List active devices for authenticated user
     */
    public function getDevices(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()?->id;

        $tokens = $user->tokens()
            ->orderByRaw('COALESCE(last_used_at, created_at) DESC')
            ->get();

        $devices = $tokens->map(function ($token) use ($currentTokenId) {
            return [
                'id' => $token->id,
                'name' => $token->name ?: 'Unknown Device',
                'ip_address' => $token->ip_address,
                'user_agent' => $token->user_agent,
                'is_current' => $token->id === $currentTokenId,
                'last_used_at' => $token->last_used_at ? $token->last_used_at->toIso8601String() : $token->created_at->toIso8601String(),
                'created_at' => $token->created_at ? $token->created_at->toIso8601String() : null,
            ];
        });

        return response()->json([
            'devices' => $devices,
            'max_allowed' => 2,
            'active_count' => $devices->count(),
        ]);
    }

    /**
     * DEVICE MANAGEMENT: Revoke a specific device session
     */
    public function revokeDevice(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->where('id', $id)->first();

        if ($token) {
            $token->delete();
        }

        return response()->json([
            'message' => 'ডিভাইসটি সফলভাবে লগআউট করা হয়েছে।',
        ]);
    }

    /**
     * DEVICE MANAGEMENT: Logout from all other devices
     */
    public function logoutOtherDevices(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()?->id;

        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json([
            'message' => 'অন্যান্য সকল ডিভাইস থেকে সফলভাবে লগআউট সম্পন্ন হয়েছে।',
        ]);
    }

    /**
     * USER PROFILE: Update profile details
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        return response()->json([
            'message' => 'প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে।',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'registration_number' => $user->registration_number,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
            ],
        ]);
    }

    /**
     * USER PROFILE: Change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'বর্তমান পাসওয়ার্ডটি সঠিক নয়।',
                'errors' => ['current_password' => ['বর্তমান পাসওয়ার্ড সঠিক নয়।']],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।',
        ]);
    }
}
