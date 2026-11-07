<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSubmission extends Model
{
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_EVALUATED = 'evaluated';

    protected $fillable = [
        'exam_id',
        'user_id',
        'started_at',
        'submitted_at',
        'total_marks',
        'obtained_marks',
        'total_questions',
        'total_answered',
        'total_skipped',
        'total_correct',
        'total_wrong',
        'negative_marks_deducted',
        'status',
        'evaluated_by',
        'evaluation_notes',
        'evaluated_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'evaluated_at' => 'datetime',
        'total_marks' => 'float',
        'obtained_marks' => 'float',
        'total_questions' => 'integer',
        'total_answered' => 'integer',
        'total_skipped' => 'integer',
        'total_correct' => 'integer',
        'total_wrong' => 'integer',
        'negative_marks_deducted' => 'float',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(ExamSubmissionAnswer::class, 'submission_id');
    }

    /**
     * Calculate student's merit position among all submitted/evaluated submissions for this exam
     */
    public function getMeritPosition(): int
    {
        return static::where('exam_id', $this->exam_id)
            ->whereIn('status', [self::STATUS_SUBMITTED, self::STATUS_EVALUATED])
            ->where(function ($query) {
                $query->where('obtained_marks', '>', $this->obtained_marks)
                    ->orWhere(function ($q) {
                        $q->where('obtained_marks', '=', $this->obtained_marks)
                          ->where('submitted_at', '<', $this->submitted_at);
                    });
            })
            ->count() + 1;
    }
}
