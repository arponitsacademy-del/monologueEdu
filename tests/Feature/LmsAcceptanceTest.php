<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonComment;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SmsSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LmsAcceptanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $teacher1;
    protected User $teacher2;
    protected User $student;

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

        $this->teacher1 = User::create([
            'name' => 'Teacher One',
            'phone' => '+8801700000002',
            'email' => 'teacher1@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->teacher2 = User::create([
            'name' => 'Teacher Two',
            'phone' => '+8801700000003',
            'email' => 'teacher2@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->student = User::create([
            'name' => 'Student User',
            'phone' => '+8801700000010',
            'email' => 'student@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);
    }

    /**
     * Test Scenario A — Student Registration & Phone Authentication
     */
    public function test_student_registration_and_phone_login_flow(): void
    {
        // 1. Register with BD phone number
        $regResponse = $this->postJson('/api/auth/register', [
            'name' => 'Karim Student',
            'phone' => '01711223344',
            'email' => 'karim@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);

        $regResponse->assertStatus(201)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'phone', 'role']]);

        $this->assertDatabaseHas('users', [
            'phone' => '+8801711223344',
            'role' => User::ROLE_STUDENT,
        ]);

        // 2. Prevent duplicate phone registration
        $dupResponse = $this->postJson('/api/auth/register', [
            'name' => 'Another Student',
            'phone' => '01711223344',
            'email' => 'another@example.com',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ]);
        $dupResponse->assertStatus(422);

        // 3. Login with Phone + Password
        $loginResponse = $this->postJson('/api/auth/login', [
            'phone' => '01711223344',
            'password' => 'secret1234',
        ]);
        $loginResponse->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    /**
     * Test Scenario B — Teacher Promotion & User Management
     */
    public function test_admin_can_promote_student_to_teacher(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/admin/users/{$this->student->id}/role", [
            'role' => User::ROLE_TEACHER,
        ]);

        $response->assertStatus(200);
        $this->assertEquals(User::ROLE_TEACHER, $this->student->fresh()->role);

        // Now newly promoted teacher can access teacher endpoints
        Sanctum::actingAs($this->student->fresh());
        $this->getJson('/api/teacher/my-courses')->assertStatus(200);

        // Teacher cannot access admin endpoints
        $this->getJson('/api/admin/users')->assertStatus(403);
    }

    /**
     * Test Scenario C & D — Multi-Instructor Course Management & Builder Access
     */
    public function test_multi_instructor_course_creation_and_builder_access(): void
    {
        Sanctum::actingAs($this->admin);

        // Create course assigned to Teacher 1 and Teacher 2
        $createRes = $this->postJson('/api/admin/courses', [
            'title' => 'HSC Physics Masterclass',
            'price' => 3000,
            'sale_price' => 2500,
            'status' => 'published',
            'instructor_ids' => [$this->teacher1->id, $this->teacher2->id],
        ]);

        $createRes->assertStatus(201);
        $courseId = $createRes->json('course.id');
        $course = Course::find($courseId);

        $this->assertTrue($course->instructors()->where('users.id', $this->teacher1->id)->exists());
        $this->assertTrue($course->instructors()->where('users.id', $this->teacher2->id)->exists());

        // Teacher 1 can access builder and add section
        Sanctum::actingAs($this->teacher1);
        $secRes = $this->postJson("/api/builder/{$course->id}/sections", [
            'title' => 'Section 01: Vector',
        ]);
        $secRes->assertStatus(201);
        $sectionId = $secRes->json('section.id');

        // Teacher 2 can add lesson to that section
        Sanctum::actingAs($this->teacher2);
        $lessonRes = $this->postJson("/api/builder/sections/{$sectionId}/lessons", [
            'title' => 'Lesson 01: Vector Basics',
            'video_url' => 'https://www.youtube.com/watch?v=test',
            'duration_minutes' => 30,
            'is_preview' => false,
            'status' => 'published',
        ]);
        $lessonRes->assertStatus(201);

        // An unrelated teacher (e.g. newly created Teacher 3) cannot access this course builder
        $teacher3 = User::create([
            'name' => 'Teacher Three',
            'phone' => '+8801700000009',
            'email' => 'teacher3@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);
        Sanctum::actingAs($teacher3);
        $this->getJson("/api/builder/{$course->id}/curriculum")->assertStatus(403);
    }

    /**
     * Test Scenario E — Order Placement, Manual Payment Confirmation & Enrollment
     */
    public function test_purchase_manual_approval_and_enrollment_activation(): void
    {
        $course = Course::create([
            'title' => 'Paid Math Course',
            'price' => 2000,
            'sale_price' => 1500,
            'status' => Course::STATUS_PUBLISHED,
        ]);

        $section = CourseSection::create([
            'course_id' => $course->id,
            'title' => 'Calculus',
            'sort_order' => 1,
        ]);

        $lesson = Lesson::create([
            'course_id' => $course->id,
            'section_id' => $section->id,
            'title' => 'Limit and Continuity',
            'is_preview' => false,
            'status' => 'published',
            'duration_minutes' => 20,
        ]);

        // Student tries to access protected lesson before purchasing -> 403
        Sanctum::actingAs($this->student);
        $this->getJson("/api/learning/{$course->id}/lessons/{$lesson->id}")->assertStatus(403);

        // Student places an order (pending)
        $orderRes = $this->postJson('/api/orders/checkout', [
            'course_id' => $course->id,
            'payment_method' => 'manual_bkash',
            'transaction_ref' => 'TRX12345678',
            'sender_phone' => '01700000010',
        ]);
        $orderRes->assertStatus(201);
        $orderId = $orderRes->json('order.id');

        // Order is pending, student STILL cannot access
        $this->getJson("/api/learning/{$course->id}/lessons/{$lesson->id}")->assertStatus(403);

        // Admin confirms payment
        Sanctum::actingAs($this->admin);
        $confirmRes = $this->postJson("/api/admin/orders/{$orderId}/confirm-payment");
        $confirmRes->assertStatus(200);

        // Now student has active enrollment and can access protected lesson
        Sanctum::actingAs($this->student);
        $learnRes = $this->getJson("/api/learning/{$course->id}/lessons/{$lesson->id}");
        $learnRes->assertStatus(200);

        // Student marks lesson as complete
        $progRes = $this->postJson("/api/learning/lessons/{$lesson->id}/progress");
        $progRes->assertStatus(200)->assertJson(['is_completed' => true]);
    }

    /**
     * Test Scenario F — Lesson Discussion & Notification System
     */
    public function test_lesson_comments_and_bidirectional_notifications(): void
    {
        $course = Course::create([
            'title' => 'Physics Discussion Course',
            'price' => 0,
            'status' => Course::STATUS_PUBLISHED,
        ]);
        $course->instructors()->sync([$this->teacher1->id]);

        $section = CourseSection::create([
            'course_id' => $course->id,
            'title' => 'Topic 1',
            'sort_order' => 1,
        ]);

        $lesson = Lesson::create([
            'course_id' => $course->id,
            'section_id' => $section->id,
            'title' => 'Newton First Law',
            'is_preview' => true,
            'status' => 'published',
            'duration_minutes' => 15,
        ]);

        // Student posts a question
        Sanctum::actingAs($this->student);
        $commRes = $this->postJson("/api/learning/lessons/{$lesson->id}/comments", [
            'content' => 'Sir, please explain the inertial frame example again.',
        ]);
        $commRes->assertStatus(201);
        $commentId = $commRes->json('comment.id');

        // Assigned Teacher receives database notification
        $this->assertCount(1, $this->teacher1->fresh()->unreadNotifications);

        // Teacher replies to student's comment
        Sanctum::actingAs($this->teacher1);
        $replyRes = $this->postJson("/api/learning/comments/{$commentId}/reply", [
            'content' => 'An inertial frame is one in which Newton first law holds true.',
        ]);
        $replyRes->assertStatus(201);

        // Student receives reply notification
        $this->assertCount(1, $this->student->fresh()->unreadNotifications);
    }

    /**
     * Test Scenario G — Revenue Analytics Calculation
     */
    public function test_revenue_analytics_calculation_rules(): void
    {
        $course = Course::create([
            'title' => 'Analytics Test Course',
            'price' => 1000,
            'status' => Course::STATUS_PUBLISHED,
        ]);

        // 1. Pending order: should NOT count as revenue
        Order::create([
            'order_number' => 'ORD-PEND-01',
            'user_id' => $this->student->id,
            'course_id' => $course->id,
            'original_price' => 1000,
            'final_amount' => 1000,
            'payment_status' => Order::PAYMENT_PENDING,
            'order_status' => Order::ORDER_PROCESSING,
            'payment_method' => 'manual',
        ]);

        // 2. Paid order: should count as revenue
        Order::create([
            'order_number' => 'ORD-PAID-01',
            'user_id' => $this->student->id,
            'course_id' => $course->id,
            'original_price' => 1000,
            'final_amount' => 1000,
            'payment_status' => Order::PAYMENT_PAID,
            'order_status' => Order::ORDER_COMPLETED,
            'payment_method' => 'manual',
        ]);

        Sanctum::actingAs($this->admin);
        $analyticsRes = $this->getJson('/api/admin/analytics?period=today');

        $analyticsRes->assertStatus(200);
        $summary = $analyticsRes->json('summary');

        // Total revenue must be exactly 1000 (pending order excluded)
        $this->assertEquals(1000, $summary['total_revenue']);
        $this->assertEquals(1, $summary['total_paid_orders']);
        $this->assertEquals(1, $summary['total_pending_orders']);
    }

    /**
     * Test Scenario H — GreenWeb SMS Token Security & Phone Validation
     */
    public function test_sms_settings_encryption_and_phone_normalization(): void
    {
        Sanctum::actingAs($this->admin);

        // Update GreenWeb SMS settings
        $response = $this->putJson('/api/admin/sms-settings', [
            'api_token' => 'SECRET_GREENWEB_API_TOKEN_9999',
            'sender_id' => 'Novonex',
            'sms_enabled' => true,
            'otp_enabled' => true,
            'otp_expiration_minutes' => 5,
            'otp_resend_cooldown_seconds' => 60,
        ]);

        $response->assertStatus(200);

        $settings = SmsSetting::current();
        // Token must be stored encrypted in DB
        $this->assertNotEquals('SECRET_GREENWEB_API_TOKEN_9999', \DB::table('sms_settings')->where('id', $settings->id)->value('api_token'));
        // Decrypted model accessor returns raw token
        $this->assertEquals('SECRET_GREENWEB_API_TOKEN_9999', $settings->api_token);

        // API response masks the token
        $getRes = $this->getJson('/api/admin/sms-settings');
        $getRes->assertStatus(200);
        $this->assertStringContainsString('****', $getRes->json('api_token_masked'));

        // Test phone number normalizer
        $this->assertEquals('+8801712345678', User::normalizePhone('01712345678'));
        $this->assertEquals('+8801712345678', User::normalizePhone('8801712345678'));
        $this->assertTrue(User::isValidPhoneNumber('+8801712345678'));
        $this->assertFalse(User::isValidPhoneNumber('012345'));
    }
}
