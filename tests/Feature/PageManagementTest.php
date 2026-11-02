<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PageManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
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

        $this->student = User::create([
            'name' => 'Student User',
            'phone' => '+8801711111111',
            'email' => 'student@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);

        Page::query()->delete();
    }

    public function test_admin_can_list_pages_and_stats(): void
    {
        Page::create([
            'title' => 'Home Page',
            'slug' => 'home',
            'status' => 'published',
            'is_system' => true,
            'blocks' => Page::defaultHomeBlocks(),
        ]);

        Page::create([
            'title' => 'About Us',
            'slug' => 'about-us',
            'status' => 'draft',
            'is_system' => false,
            'blocks' => [],
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/pages');

        $response->assertStatus(200)
            ->assertJsonPath('stats.total', 2)
            ->assertJsonPath('stats.published', 1)
            ->assertJsonPath('stats.draft', 1)
            ->assertJsonFragment(['slug' => 'home'])
            ->assertJsonFragment(['slug' => 'about-us']);
    }

    public function test_admin_can_create_new_page_with_template(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/admin/pages', [
            'title' => 'Special Landing Page',
            'slug' => 'special-landing',
            'template' => 'content',
            'status' => 'published',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('page.title', 'Special Landing Page')
            ->assertJsonPath('page.slug', 'special-landing')
            ->assertJsonPath('page.status', 'published');

        $this->assertDatabaseHas('pages', [
            'slug' => 'special-landing',
        ]);
    }

    public function test_admin_can_update_page_blocks_and_custom_css(): void
    {
        $page = Page::create([
            'title' => 'Test Page',
            'slug' => 'test-page',
            'status' => 'published',
            'blocks' => [],
        ]);

        Sanctum::actingAs($this->admin);

        $blocks = [
            [
                'id' => 'block_html_1',
                'type' => 'html_widget',
                'title' => 'Custom Promo Box',
                'settings' => [
                    'html' => '<div class="custom-card">Special Discount</div>',
                    'css' => '.custom-card { color: red; font-size: 20px; }',
                ],
            ],
        ];

        $response = $this->putJson("/api/admin/pages/{$page->id}", [
            'title' => 'Updated Test Page',
            'slug' => 'test-page',
            'status' => 'published',
            'blocks' => $blocks,
            'custom_css' => '.page-bg { background-color: #fafafa; }',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('page.title', 'Updated Test Page')
            ->assertJsonPath('page.custom_css', '.page-bg { background-color: #fafafa; }');

        $this->assertDatabaseHas('pages', [
            'id' => $page->id,
            'title' => 'Updated Test Page',
        ]);
    }

    public function test_system_page_cannot_be_deleted(): void
    {
        $systemPage = Page::create([
            'title' => 'Home Page',
            'slug' => 'home',
            'status' => 'published',
            'is_system' => true,
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->deleteJson("/api/admin/pages/{$systemPage->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('pages', ['id' => $systemPage->id]);
    }

    public function test_admin_can_delete_non_system_page(): void
    {
        $page = Page::create([
            'title' => 'Temporary Page',
            'slug' => 'temporary-page',
            'status' => 'draft',
            'is_system' => false,
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->deleteJson("/api/admin/pages/{$page->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('pages', ['id' => $page->id]);
    }

    public function test_admin_can_toggle_page_status(): void
    {
        $page = Page::create([
            'title' => 'Toggle Test',
            'slug' => 'toggle-test',
            'status' => 'published',
            'is_system' => false,
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/admin/pages/{$page->id}/toggle-status");

        $response->assertStatus(200)
            ->assertJsonPath('page.status', 'draft');

        $this->assertDatabaseHas('pages', ['id' => $page->id, 'status' => 'draft']);
    }

    public function test_admin_can_duplicate_page(): void
    {
        $page = Page::create([
            'title' => 'Original Page',
            'slug' => 'original-page',
            'status' => 'published',
            'is_system' => false,
            'blocks' => [['id' => '1', 'type' => 'rich_text']],
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->postJson("/api/admin/pages/{$page->id}/duplicate");

        $response->assertStatus(200)
            ->assertJsonPath('page.title', 'Original Page (Copy)')
            ->assertJsonPath('page.status', 'draft');

        $this->assertDatabaseCount('pages', 2);
    }

    public function test_public_can_view_published_page(): void
    {
        Page::create([
            'title' => 'FAQ Page',
            'slug' => 'faq',
            'status' => 'published',
            'blocks' => [['id' => '1', 'type' => 'rich_text']],
        ]);

        $response = $this->getJson('/api/pages/faq');

        $response->assertStatus(200)
            ->assertJsonPath('page.slug', 'faq');
    }

    public function test_public_cannot_view_draft_page(): void
    {
        Page::create([
            'title' => 'Secret Page',
            'slug' => 'secret-page',
            'status' => 'draft',
            'blocks' => [],
        ]);

        $response = $this->getJson('/api/pages/secret-page');

        $response->assertStatus(404);
    }

    public function test_student_cannot_access_admin_pages_api(): void
    {
        Sanctum::actingAs($this->student);

        $response = $this->getJson('/api/admin/pages');
        $response->assertStatus(403);

        $postResponse = $this->postJson('/api/admin/pages', [
            'title' => 'Hacker Page',
            'slug' => 'hacker-page',
        ]);
        $postResponse->assertStatus(403);
    }

    public function test_admin_can_sync_category_pages(): void
    {
        Sanctum::actingAs($this->admin);

        \App\Models\Category::firstOrCreate(
            ['slug' => 'hsc-physics'],
            ['name' => 'এইচএসসি পদার্থবিজ্ঞান', 'description' => 'পদার্থবিজ্ঞান ১ম ও ২য় পত্র']
        );
        \App\Models\Category::firstOrCreate(
            ['slug' => 'hsc-chemistry'],
            ['name' => 'এইচএসসি রসায়ন', 'description' => 'রসায়ন ১ম ও ২য় পত্র']
        );

        $response = $this->postJson('/api/admin/pages/sync-categories');

        $response->assertStatus(200)
            ->assertJsonPath('message', 'সকল কোর্স ও ক্যাটাগরি পেজ সফলভাবে সিঙ্ক করা হয়েছে।');

        $this->assertDatabaseHas('pages', ['slug' => 'courses']);
        $this->assertDatabaseHas('pages', ['slug' => 'category-hsc-physics']);
        $this->assertDatabaseHas('pages', ['slug' => 'category-hsc-chemistry']);
    }

    public function test_admin_can_configure_selected_categories_in_page_edit(): void
    {
        Sanctum::actingAs($this->admin);

        \App\Models\Category::firstOrCreate(
            ['slug' => 'hsc-physics'],
            ['name' => 'এইচএসসি পদার্থবিজ্ঞান']
        );
        \App\Models\Category::firstOrCreate(
            ['slug' => 'hsc-chemistry'],
            ['name' => 'এইচএসসি রসায়ন']
        );

        $coursesPage = Page::create([
            'title' => 'সকল কোর্সসমূহ',
            'slug' => 'courses',
            'status' => 'published',
            'is_system' => true,
            'blocks' => Page::defaultCoursesBlocks(),
        ]);

        $response = $this->putJson("/api/admin/pages/{$coursesPage->id}", [
            'title' => 'সকল কোর্সসমূহ',
            'slug' => 'courses',
            'status' => 'published',
            'selected_categories' => ['hsc-physics'],
        ]);

        $response->assertStatus(200);

        $updated = Page::find($coursesPage->id);
        $tabBlock = collect($updated->blocks)->firstWhere('type', 'course_tabs');
        $this->assertNotNull($tabBlock);
        $this->assertEquals(['hsc-physics'], $tabBlock['settings']['selectedCategorySlugs']);
    }

    public function test_public_can_fetch_courses_page_fallback(): void
    {
        Page::where('slug', 'courses')->delete();

        $response = $this->getJson('/api/pages/courses');

        $response->assertStatus(200)
            ->assertJsonPath('page.slug', 'courses')
            ->assertJsonPath('page.title', 'সকল কোর্সসমূহ');
    }
}
