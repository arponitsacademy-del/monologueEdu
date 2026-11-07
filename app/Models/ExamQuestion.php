<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamQuestion extends Model
{
    public const TYPE_SINGLE_CHOICE = 'single_choice';
    public const TYPE_MULTIPLE_CHOICE = 'multiple_choice';
    public const TYPE_WRITTEN_PAPER = 'written_paper';

    protected $fillable = [
        'exam_id',
        'question_text',
        'question_type',
        'marks',
        'attachment_url',
        'explanation',
        'order',
        'options',
        'correct_answers',
    ];

    protected $casts = [
        'marks' => 'float',
        'order' => 'integer',
        'options' => 'array',
        'correct_answers' => 'array',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
