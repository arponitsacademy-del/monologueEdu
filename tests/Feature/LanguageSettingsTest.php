<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WebsiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LanguageSettingsTest extends TestCase
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
    }

    public function test_public_can_fetch_settings_with_default_language(): void
    {
        $response = $this->getJson('/api/settings');

        $response->assertStatus(200)
            ->assertJsonPath('default_language', 'en');
    }

    public function test_admin_can_update_default_language_to_bengali_and_english(): void
    {
        Sanctum::actingAs($this->admin);

        // Update to 'bn'
        $response = $this->putJson('/api/admin/website-settings', [
            'site_name' => 'Novonex Academy',
            'site_tagline' => 'Learning Platform',
            'primary_color' => '#0284c7',
            'secondary_color' => '#0ea5e9',
            'default_language' => 'bn',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('settings.default_language', 'bn');

        $this->assertDatabaseHas('website_settings', [
            'default_language' => 'bn',
        ]);

        // Update back to 'en'
        $responseEn = $this->putJson('/api/admin/website-settings', [
            'site_name' => 'Novonex Academy',
            'site_tagline' => 'Learning Platform',
            'primary_color' => '#0284c7',
            'secondary_color' => '#0ea5e9',
            'default_language' => 'en',
        ]);

        $responseEn->assertStatus(200)
            ->assertJsonPath('settings.default_language', 'en');

        $this->assertDatabaseHas('website_settings', [
            'default_language' => 'en',
        ]);
    }

    public function test_invalid_language_is_rejected(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->putJson('/api/admin/website-settings', [
            'site_name' => 'Novonex Academy',
            'site_tagline' => 'Learning Platform',
            'primary_color' => '#0284c7',
            'secondary_color' => '#0ea5e9',
            'default_language' => 'fr',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['default_language']);
    }

    public function test_non_admin_cannot_update_language_settings(): void
    {
        Sanctum::actingAs($this->student);

        $response = $this->putJson('/api/admin/website-settings', [
            'site_name' => 'Hacked Name',
            'site_tagline' => 'Hacked Tagline',
            'primary_color' => '#0284c7',
            'secondary_color' => '#0ea5e9',
            'default_language' => 'bn',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_website_logo(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->putJson('/api/admin/website-settings', [
            'site_name' => 'Novonex Academy',
            'site_tagline' => 'Learning Platform',
            'primary_color' => '#0284c7',
            'secondary_color' => '#0ea5e9',
            'logo_url' => 'http://localhost:8000/storage/media/test_logo.png',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('settings.logo_url', 'http://localhost:8000/storage/media/test_logo.png');

        $this->assertDatabaseHas('website_settings', [
            'logo_url' => 'http://localhost:8000/storage/media/test_logo.png',
        ]);

        // Public settings endpoint returns the logo
        $publicRes = $this->getJson('/api/settings');
        $publicRes->assertStatus(200)
            ->assertJsonPath('logo_url', 'http://localhost:8000/storage/media/test_logo.png');
    }

    public function test_admin_can_update_header_settings(): void
    {
        Sanctum::actingAs($this->admin);

        $headerPayload = [
            'header_settings' => [
                'sticky' => true,
                'announcement_enabled' => true,
                'announcement_text' => 'Special Discount 50% Off!',
                'announcement_link' => '/courses',
                'menu_items' => [
                    ['id' => '1', 'label' => 'Home', 'url' => '/'],
                    ['id' => '2', 'label' => 'Courses', 'url' => '/courses', 'highlight' => true],
                ],
            ],
        ];

        $response = $this->putJson('/api/admin/website-settings/header', $headerPayload);
        $response->assertStatus(200)
            ->assertJsonPath('header_settings.announcement_text', 'Special Discount 50% Off!');

        $publicRes = $this->getJson('/api/settings');
        $publicRes->assertStatus(200)
            ->assertJsonPath('header_settings.announcement_text', 'Special Discount 50% Off!');
    }

    public function test_admin_can_update_footer_settings(): void
    {
        Sanctum::actingAs($this->admin);

        $footerPayload = [
            'footer_settings' => [
                'brand_title' => 'Novonex Plus',
                'description' => 'Custom footer description text',
                'phone' => '+8801999999999',
                'email' => 'hello@novonex.edu.bd',
                'column_2_title' => 'Important Links',
                'column_2_links' => [
                    ['id' => '1', 'label' => 'All Courses', 'url' => '/courses'],
                ],
            ],
        ];

        $response = $this->putJson('/api/admin/website-settings/footer', $footerPayload);
        $response->assertStatus(200)
            ->assertJsonPath('footer_settings.brand_title', 'Novonex Plus');

        $publicRes = $this->getJson('/api/settings');
        $publicRes->assertStatus(200)
            ->assertJsonPath('footer_settings.email', 'hello@novonex.edu.bd');
    }

    public function test_non_admin_cannot_update_header_or_footer_settings(): void
    {
        Sanctum::actingAs($this->student);

        $this->putJson('/api/admin/website-settings/header', ['header_settings' => []])
            ->assertStatus(403);

        $this->putJson('/api/admin/website-settings/footer', ['footer_settings' => []])
            ->assertStatus(403);
    }
}
