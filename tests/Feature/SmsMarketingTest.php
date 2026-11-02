<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\SmsCampaign;
use App\Models\SmsLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SmsMarketingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $student1;
    protected User $student2;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'phone' => '+8801700000001',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->student1 = User::create([
            'name' => 'Rahim Ahmed',
            'phone' => '+8801711111111',
            'email' => 'rahim@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->student2 = User::create([
            'name' => 'Karim Hasan',
            'phone' => '+8801722222222',
            'email' => 'karim@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->course = Course::create([
            'title' => 'এইচএসসি ফিজিক্স ১ম পত্র',
            'slug' => 'hsc-physics-1st',
            'price' => 2000,
            'status' => 'published',
            'is_featured' => true,
        ]);

        // Enroll student1 only
        Enrollment::create([
            'user_id' => $this->student1->id,
            'course_id' => $this->course->id,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_preview_course_recipients(): void
    {
        Sanctum::actingAs($this->admin);

        // Preview course audience
        $response = $this->postJson('/api/admin/sms-marketing/preview', [
            'target_type' => 'course',
            'course_id' => $this->course->id,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('total_recipients', 1)
            ->assertJsonPath('course.id', $this->course->id);

        // Preview all students
        $resAll = $this->postJson('/api/admin/sms-marketing/preview', [
            'target_type' => 'students',
        ]);

        $resAll->assertStatus(200)
            ->assertJsonPath('total_recipients', 2);
    }

    public function test_admin_can_send_marketing_sms_to_course(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/admin/sms-marketing/send', [
            'target_type' => 'course',
            'course_id' => $this->course->id,
            'message' => 'প্রিয় {name}, আপনার {course_title} কোর্সের লাইভ ক্লাস শুরু হয়েছে।',
            'title' => 'ক্লাস শুরু নোটিশ',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('campaign.total_recipients', 1)
            ->assertJsonPath('campaign.sent_count', 1);

        $campaignId = $response->json('campaign.id');

        $this->assertDatabaseHas('sms_campaigns', [
            'id' => $campaignId,
            'course_id' => $this->course->id,
            'sent_count' => 1,
        ]);

        // Check SMS log created with campaign reference and personalized message
        $this->assertDatabaseHas('sms_logs', [
            'campaign_id' => $campaignId,
            'phone' => '+8801711111111',
            'type' => 'marketing',
        ]);

        $log = SmsLog::where('campaign_id', $campaignId)->first();
        $this->assertStringContainsString('Rahim Ahmed', $log->message);
        $this->assertStringContainsString('এইচএসসি ফিজিক্স ১ম পত্র', $log->message);
    }

    public function test_admin_can_fetch_campaign_history(): void
    {
        Sanctum::actingAs($this->admin);

        SmsCampaign::create([
            'user_id' => $this->admin->id,
            'title' => 'টেস্ট ক্যাম্পেইন',
            'target_type' => 'all',
            'message' => 'নোটিশ টেস্ট',
            'total_recipients' => 5,
            'sent_count' => 5,
            'status' => 'completed',
        ]);

        $response = $this->getJson('/api/admin/sms-marketing/history');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.title', 'টেস্ট ক্যাম্পেইন');
    }

    public function test_student_cannot_send_marketing_sms(): void
    {
        Sanctum::actingAs($this->student1);

        $response = $this->postJson('/api/admin/sms-marketing/send', [
            'target_type' => 'all',
            'message' => 'হ্যাকড',
        ]);

        $response->assertStatus(403);
    }
}
