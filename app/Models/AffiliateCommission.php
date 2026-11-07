<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateCommission extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'affiliate_id',
        'order_id',
        'course_id',
        'buyer_id',
        'order_amount',
        'discount_given',
        'commission_type',
        'commission_rate',
        'commission_amount',
        'status',
    ];

    protected $casts = [
        'order_amount' => 'float',
        'discount_given' => 'float',
        'commission_rate' => 'float',
        'commission_amount' => 'float',
    ];

    public function affiliate(): BelongsTo
    {
        return $this->belongsTo(AffiliateProfile::class, 'affiliate_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }
}
