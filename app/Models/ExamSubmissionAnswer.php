<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamSubmissionAnswer extends Model
{
    protected $fillable = [
        'submission_id',
        'question_id',
        'student_answer',
        'is_correct',
        'marks_obtained',
        'attachments',
        'teacher_feedback',
    ];

    protected $casts = [
        'student_answer' => 'array',
        'is_correct' => 'boolean',
        'marks_obtained' => 'float',
        'attachments' => 'array',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(ExamSubmission::class, 'submission_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(ExamQuestion::class, 'question_id');
    }
}
