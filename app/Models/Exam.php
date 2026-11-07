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

    protected $fillable = [
        'course_id',
        'created_by',
        'title',
        'slug',
        'description',
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
}
