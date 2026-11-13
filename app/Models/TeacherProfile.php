<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'designation',
        'institution',
        'photo_url',
        'bio',
        'expertise',
        'social_links',
        'is_featured',
        'order',
    ];

    protected $casts = [
        'social_links' => 'array',
        'is_featured' => 'boolean',
        'order' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getPhotoUrlAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
        }
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, 'data:')) {
            return $value;
        }
        $path = ltrim($value, '/');
        if (! str_starts_with($path, 'storage/') && ! str_starts_with($path, 'images/')) {
            $path = 'storage/' . $path;
        }
        return asset($path);
    }
}

