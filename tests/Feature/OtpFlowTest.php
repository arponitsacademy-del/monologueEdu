<?php

namespace Tests\Feature;

use App\Models\OtpVerification;
use App\Models\SmsSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OtpFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_when_otp_enabled_no_inactive_user_is_created_until_verification(): void
    {
        // 1. Turn OTP verification ON
        $smsSetting = SmsSetting::current();
        $smsSetting->update(['otp_enabled' => true, 'sms_enabled' => false]);

        // 2. Submit registration form
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Tanjim Rahman',
            'phone' => '01799887766',
            'email' => 'tanjim@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'requires_otp' => true,
            'phone' => '+8801799887766',
        ]);

        // 3. CRITICAL: Assert NO user record exists in users table (neither active nor inactive!)
        $this->assertDatabaseMissing('users', [
            'phone' => '+8801799887766',
        ]);
        $this->assertDatabaseMissing('users', [
            'email' => 'tanjim@example.com',
        ]);

        // 4. Assert OTP verification record exists with payload
        $otpRecord = OtpVerification::where('phone', '+8801799887766')->first();
        $this->assertNotNull($otpRecord);
        $this->assertNotNull($otpRecord->payload);
        $this->assertEquals('Tanjim Rahman', $otpRecord->payload['name']);
        $this->assertEquals('tanjim@example.com', $otpRecord->payload['email']);

        // 5. Attempt login with unverified phone number - should fail (user does not exist)
        $loginRes = $this->postJson('/api/auth/login', [
            'phone' => '01799887766',
            'password' => 'secret1234',
        ]);
        $loginRes->assertStatus(401);

        // 6. Attempt OTP verification with wrong code - should fail and STILL not create user
        $wrongOtpRes = $this->postJson('/api/auth/otp/verify', [
            'phone' => '01799887766',
            'otp' => '000000',
        ]);
        $wrongOtpRes->assertStatus(422);
        $this->assertDatabaseMissing('users', ['phone' => '+8801799887766']);

        // 7. Verify with the correct OTP code
        // Set known OTP hash for testing
        $otpRecord->update(['otp_hash' => Hash::make('123456')]);

        $verifyRes = $this->postJson('/api/auth/otp/verify', [
            'phone' => '01799887766',
            'otp' => '123456',
        ]);

        $verifyRes->assertStatus(200);
        $verifyRes->assertJsonStructure(['token', 'user']);
        $this->assertEquals('active', $verifyRes->json('user.status'));
        $this->assertEquals('+8801799887766', $verifyRes->json('user.phone'));

        // 8. Assert user record is now created as ACTIVE in database
        $this->assertDatabaseHas('users', [
            'phone' => '+8801799887766',
            'email' => 'tanjim@example.com',
            'status' => User::STATUS_ACTIVE,
            'role' => User::ROLE_STUDENT,
        ]);

        // 9. Now login succeeds
        $loginSuccessRes = $this->postJson('/api/auth/login', [
            'phone' => '01799887766',
            'password' => 'secret1234',
        ]);
        $loginSuccessRes->assertStatus(200);
    }

    public function test_when_otp_disabled_user_is_created_directly_as_active(): void
    {
        $smsSetting = SmsSetting::current();
        $smsSetting->update(['otp_enabled' => false]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Direct Active User',
            'phone' => '01811223344',
            'email' => 'direct@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['token', 'user']);
        $this->assertEquals('active', $response->json('user.status'));

        $this->assertDatabaseHas('users', [
            'phone' => '+8801811223344',
            'status' => User::STATUS_ACTIVE,
        ]);
    }

    public function test_resend_otp_preserves_registration_payload(): void
    {
        $smsSetting = SmsSetting::current();
        $smsSetting->update(['otp_enabled' => true, 'sms_enabled' => false, 'otp_resend_cooldown_seconds' => 10]);

        $this->postJson('/api/auth/register', [
            'name' => 'Resend Test User',
            'phone' => '01511223344',
            'email' => 'resend@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ])->assertStatus(200);

        // Advance time to pass cooldown
        $this->travel(15)->seconds();

        $resendRes = $this->postJson('/api/auth/otp/resend', [
            'phone' => '01511223344',
        ]);
        $resendRes->assertStatus(200);

        // Verify latest OTP record retained registration payload
        $latestOtp = OtpVerification::where('phone', '+8801511223344')->latest()->first();
        $this->assertNotNull($latestOtp->payload);
        $this->assertEquals('Resend Test User', $latestOtp->payload['name']);
        $this->assertEquals('resend@example.com', $latestOtp->payload['email']);
    }
}
