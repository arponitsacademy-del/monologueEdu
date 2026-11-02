<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Lesson extends Model
{
    protected $fillable = [
        'course_id',
        'section_id',
        'title',
        'slug',
        'content',
        'video_url',
        'duration_minutes',
        'is_preview',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'duration_minutes' => 'integer',
        'is_preview' => 'boolean',
        'sort_order' => 'integer',
    ];

    public static function booted(): void
    {
        static::creating(function (self $lesson): void {
            if (empty($lesson->slug)) {
                $lesson->slug = Str::slug($lesson->title);
            }
        });
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'section_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(LessonAttachment::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(LessonComment::class)->whereNull('parent_id')->with('replies.user', 'user')->latest();
    }

    public function allComments(): HasMany
    {
        return $this->hasMany(LessonComment::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }
}
