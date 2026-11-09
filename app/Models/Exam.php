<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Exam extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    public const TYPE_PRACTICE = 'practice';
    public const TYPE_LIVE = 'live';

    protected $fillable = [
        'course_id',
        'created_by',
        'title',
        'slug',
        'description',
        'exam_type',
        'total_marks',
        'pass_marks',
        'has_negative_marking',
        'negative_marks',
        'duration_minutes',
        'status',
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'total_marks' => 'float',
        'pass_marks' => 'float',
        'has_negative_marking' => 'boolean',
        'negative_marks' => 'float',
        'duration_minutes' => 'integer',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    protected $appends = [
        'effective_type',
        'is_live_active',
        'is_live_upcoming',
        'is_live_expired',
    ];

    public static function booted(): void
    {
        static::creating(function (self $exam): void {
            if (empty($exam->slug)) {
                $exam->slug = Str::slug($exam->title) . '-' . Str::lower(Str::random(6));
            }
        });
    }

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_exams')->withPivot('order')->withTimestamps();
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class)->orderBy('order');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(ExamSubmission::class);
    }

    /**
     * Recalculate total marks from all questions
     */
    public function recalculateTotalMarks(): void
    {
        $this->total_marks = $this->questions()->sum('marks');
        $this->saveQuietly();
    }

    public function isLiveExam(): bool
    {
        return ($this->exam_type ?? self::TYPE_PRACTICE) === self::TYPE_LIVE;
    }

    public function isLiveActive(): bool
    {
        if (!$this->isLiveExam()) {
            return false;
        }
        $now = now();
        return $this->start_time && $this->end_time && $now->gte($this->start_time) && $now->lte($this->end_time);
    }

    public function isLiveUpcoming(): bool
    {
        if (!$this->isLiveExam()) {
            return false;
        }
        return $this->start_time && now()->lt($this->start_time);
    }

    public function isLiveExpired(): bool
    {
        if (!$this->isLiveExam()) {
            return false;
        }
        return $this->end_time && now()->gt($this->end_time);
    }

    /**
     * Effective type: if created as live, but end_time has passed, it automatically becomes practice!
     */
    public function getEffectiveTypeAttribute(): string
    {
        if ($this->isLiveExam() && $this->isLiveExpired()) {
            return self::TYPE_PRACTICE;
        }
        return $this->exam_type ?: self::TYPE_PRACTICE;
    }

    public function getIsLiveActiveAttribute(): bool
    {
        return $this->isLiveActive();
    }

    public function getIsLiveUpcomingAttribute(): bool
    {
        return $this->isLiveUpcoming();
    }

    public function getIsLiveExpiredAttribute(): bool
    {
        return $this->isLiveExpired();
    }
}
