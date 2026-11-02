<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_fetch_users_list(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'phone',
                    'email',
                    'role',
                    'status',
                    'created_at',
                ],
            ],
            'current_page',
            'last_page',
            'total',
        ]);
    }

    public function test_admin_can_filter_users_by_role_and_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        User::factory()->create(['role' => 'student', 'status' => 'active', 'name' => 'Active Student']);
        User::factory()->create(['role' => 'teacher', 'status' => 'inactive', 'name' => 'Inactive Teacher']);
        Sanctum::actingAs($admin);

        // Filter by role=student
        $studentRes = $this->getJson('/api/admin/users?role=student');
        $studentRes->assertStatus(200);
        $this->assertCount(1, $studentRes->json('data'));
        $this->assertEquals('student', $studentRes->json('data.0.role'));

        // Filter by status=inactive
        $inactiveRes = $this->getJson('/api/admin/users?status=inactive');
        $inactiveRes->assertStatus(200);
        $this->assertCount(1, $inactiveRes->json('data'));
        $this->assertEquals('inactive', $inactiveRes->json('data.0.status'));
    }

    public function test_admin_can_search_users_by_name_and_phone(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        User::factory()->create(['name' => 'Farhan Ahmed', 'phone' => '+8801711223344', 'role' => 'student']);
        Sanctum::actingAs($admin);

        // Search by name
        $nameRes = $this->getJson('/api/admin/users?search=Farhan');
        $nameRes->assertStatus(200);
        $this->assertCount(1, $nameRes->json('data'));
        $this->assertEquals('Farhan Ahmed', $nameRes->json('data.0.name'));

        // Search by phone digits
        $phoneRes = $this->getJson('/api/admin/users?search=01711223344');
        $phoneRes->assertStatus(200);
        $this->assertCount(1, $phoneRes->json('data'));
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $student = User::factory()->create(['role' => 'student', 'status' => 'active']);
        Sanctum::actingAs($student);

        $this->getJson('/api/admin/users')->assertStatus(403);
    }
}
