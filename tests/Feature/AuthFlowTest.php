<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_register_and_login_with_phone_number(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Student',
            'phone' => '01712345678',
            'email' => 'student@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'student@example.com',
            'role' => User::ROLE_STUDENT,
        ]);

        $this->assertTrue(User::where('email', 'student@example.com')->first()->phone === '+8801712345678');

        $loginResponse = $this->postJson('/api/auth/login', [
            'phone' => '01712345678',
            'password' => 'secret123',
        ]);

        $loginResponse->assertStatus(200);
        $this->assertNotNull($loginResponse->json('token'));
    }

    public function test_duplicate_phone_number_is_rejected(): void
    {
        User::create([
            'name' => 'First Student',
            'phone' => '+8801712345678',
            'email' => 'first@example.com',
            'password' => 'secret123',
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Second Student',
            'phone' => '01712345678',
            'email' => 'second@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_and_teacher_roles_are_supported(): void
    {
        User::create([
            'name' => 'Admin User',
            'phone' => '+8801700000001',
            'email' => 'admin@example.com',
            'password' => 'password123',
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        User::create([
            'name' => 'Teacher User',
            'phone' => '+8801700000002',
            'email' => 'teacher@example.com',
            'password' => 'password123',
            'role' => User::ROLE_TEACHER,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->assertDatabaseHas('users', ['role' => User::ROLE_ADMIN]);
        $this->assertDatabaseHas('users', ['role' => User::ROLE_TEACHER]);
    }
}
