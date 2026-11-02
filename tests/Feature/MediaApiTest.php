<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaApiTest extends TestCase
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
            'phone' => '+8801700000004',
            'email' => 'student@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);
    }

    public function test_admin_can_upload_media_file(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin);

        $file = UploadedFile::fake()->create('course_banner.png', 100, 'image/png');

        $response = $this->postJson('/api/admin/media', [
            'file' => $file,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('media.file_name', 'course_banner.png')
            ->assertJsonPath('media.file_type', 'image');

        $mediaId = $response->json('media.id');
        $this->assertDatabaseHas('media', [
            'id' => $mediaId,
            'file_name' => 'course_banner.png',
            'file_type' => 'image',
        ]);

        $media = Media::find($mediaId);
        Storage::disk('public')->assertExists($media->file_path);
    }

    public function test_admin_can_list_and_filter_media(): void
    {
        Sanctum::actingAs($this->admin);

        Media::create([
            'user_id' => $this->admin->id,
            'file_name' => 'physics_note.pdf',
            'file_path' => 'media/physics_note.pdf',
            'file_type' => 'document',
            'mime_type' => 'application/pdf',
            'file_size' => 2048,
            'url' => 'http://localhost/storage/media/physics_note.pdf',
        ]);

        Media::create([
            'user_id' => $this->admin->id,
            'file_name' => 'thumbnail_math.jpg',
            'file_path' => 'media/thumbnail_math.jpg',
            'file_type' => 'image',
            'mime_type' => 'image/jpeg',
            'file_size' => 4096,
            'url' => 'http://localhost/storage/media/thumbnail_math.jpg',
        ]);

        // Filter by image
        $resImage = $this->getJson('/api/admin/media?type=image');
        $resImage->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.file_name', 'thumbnail_math.jpg');

        // Search by name
        $resSearch = $this->getJson('/api/admin/media?search=physics');
        $resSearch->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.file_name', 'physics_note.pdf');
    }

    public function test_admin_can_delete_media_file(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin);

        $file = UploadedFile::fake()->create('delete_me.png', 50, 'image/png');
        $path = $file->store('media', 'public');

        $media = Media::create([
            'user_id' => $this->admin->id,
            'file_name' => 'delete_me.png',
            'file_path' => $path,
            'file_type' => 'image',
            'mime_type' => 'image/png',
            'file_size' => 1024,
            'url' => 'http://localhost/storage/' . $path,
        ]);

        Storage::disk('public')->assertExists($path);

        $response = $this->deleteJson("/api/admin/media/{$media->id}");
        $response->assertStatus(200);

        $this->assertDatabaseMissing('media', ['id' => $media->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_student_cannot_access_or_upload_admin_media(): void
    {
        Sanctum::actingAs($this->student);

        $file = UploadedFile::fake()->create('hacker.jpg', 50, 'image/jpeg');

        $response = $this->postJson('/api/admin/media', [
            'file' => $file,
        ]);

        $response->assertStatus(403);
    }
}
