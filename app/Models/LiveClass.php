<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LiveClass extends Model
{
    use HasFactory;

    public const STATUS_UPCOMING = 'upcoming';
    public const STATUS_LIVE = 'live';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'course_id',
        'created_by',
        'title',
        'description',
        'live_url',
        'start_time',
        'end_time',
        'status',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    protected $appends = [
        'youtube_video_id',
        'embed_url',
        'is_currently_live',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(LiveClassComment::class)->orderBy('created_at', 'asc');
    }

    /**
     * Extract YouTube video ID from various YouTube URL formats
     */
    public function getYoutubeVideoIdAttribute(): ?string
    {
        $url = trim((string)$this->live_url);
        if (empty($url)) {
            return null;
        }

        // Standard watch URL: youtube.com/watch?v=XXXXX
        if (preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/live\/)([^"&?\/\s]{11})/i', $url, $matches)) {
            return $matches[1];
        }

        // If it's already an 11-char ID
        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $url)) {
            return $url;
        }

        return null;
    }

    /**
     * Embed URL for the YouTube player
     */
    public function getEmbedUrlAttribute(): ?string
    {
        $id = $this->youtube_video_id;
        if ($id) {
            return "https://www.youtube-nocookie.com/embed/{$id}?autoplay=1&rel=0";
        }
        return $this->live_url;
    }

    /**
     * Determine if class is currently running
     */
    public function getIsCurrentlyLiveAttribute(): bool
    {
        if ($this->status === self::STATUS_LIVE) {
            return true;
        }

        if ($this->status === self::STATUS_UPCOMING && $this->start_time) {
            $now = now();
            // If started within last 3 hours and not completed
            return $now->gte($this->start_time) && (!$this->end_time || $now->lte($this->end_time));
        }

        return false;
    }
}

