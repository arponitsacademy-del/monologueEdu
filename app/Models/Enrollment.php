<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'user_id',
        'course_id',
        'order_id',
        'has_nexpilot',
        'nexpilot_id',
        'status',
        'enrolled_at',
        'expires_at',
    ];

    protected $casts = [
        'has_nexpilot' => 'boolean',
        'enrolled_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function nexpilot(): BelongsTo
    {
        return $this->belongsTo(NexPilot::class, 'nexpilot_id');
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE &&
            ($this->expires_at === null || $this->expires_at->isFuture());
    }
}
