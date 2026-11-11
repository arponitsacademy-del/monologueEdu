<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    use HasFactory;

    protected $table = 'media';

    protected $fillable = [
        'user_id',
        'file_name',
        'file_path',
        'file_type',
        'mime_type',
        'file_size',
        'url',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    protected $appends = [
        'formatted_size',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 1) . ' KB';
        }

        return $bytes . ' B';
    }

    /**
     * Dynamically resolve media URL to ensure HTTPS and prevent domain/symlink mismatches
     */
    public function getUrlAttribute($value): string
    {
        $filePath = $this->file_path;
        if ($filePath) {
            $path = ltrim(str_replace('public/', '', $filePath), '/');
            $assetUrl = asset('storage/' . $path);
            if ((request()->isSecure() || str_contains(request()->getHost(), 'monologueedu.com') || request()->server('HTTP_X_FORWARDED_PROTO') === 'https') && str_starts_with($assetUrl, 'http://')) {
                return 'https://' . substr($assetUrl, 7);
            }
            return $assetUrl;
        }

        if ($value) {
            if ((request()->isSecure() || str_contains(request()->getHost(), 'monologueedu.com') || request()->server('HTTP_X_FORWARDED_PROTO') === 'https') && str_starts_with($value, 'http://')) {
                return 'https://' . substr($value, 7);
            }
            return $value;
        }

        return '';
    }
}
