<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NexPilotStudentUsage extends Model
{
    use HasFactory;

    protected $table = 'nexpilot_student_usages';

    protected $fillable = [
        'user_id',
        'nexpilot_id',
        'enrollment_id',
        'prompt_tokens',
        'completion_tokens',
        'total_tokens',
        'total_usd_spent',
        'is_blocked',
    ];

    protected $casts = [
        'prompt_tokens' => 'integer',
        'completion_tokens' => 'integer',
        'total_tokens' => 'integer',
        'total_usd_spent' => 'float',
        'is_blocked' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pilot(): BelongsTo
    {
        return $this->belongsTo(NexPilot::class, 'nexpilot_id');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }
}

