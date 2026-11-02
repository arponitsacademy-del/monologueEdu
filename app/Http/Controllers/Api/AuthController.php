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
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
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

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'সফলভাবে লগইন হয়েছে।',
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

        // If OTP verification is enabled:
        // Do NOT create any inactive user record. Either active on verification or nothing.
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

            $smsMessage = "Novonex Academy-তে আপনার OTP কোড হল: {$otpCode}। এটি {$smsSettings->otp_expiration_minutes} মিনিট কার্যকর থাকবে।";
            $smsService->sendSms($normalizedPhone, $smsMessage);

            return response()->json([
                'message' => 'আপনার ফোনে ৬ ডিজিটের একটি ওটিপি কোড পাঠানো হয়েছে। নম্বর যাচাই করার পর অ্যাকাউন্ট চালু হবে।',
                'requires_otp' => true,
                'phone' => $normalizedPhone,
            ]);
        }

        // Direct registration when OTP is disabled
        $user = User::create([
            'name' => $validated['name'],
            'phone' => $normalizedPhone,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে।',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
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
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'enrolled_courses_count' => $user->enrolledCourses()->count(),
                'unread_notifications_count' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'সফলভাবে লগআউট করা হয়েছে।',
        ]);
    }
}
