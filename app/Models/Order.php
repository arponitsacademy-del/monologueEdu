<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Order extends Model
{
    public const PAYMENT_PENDING = 'pending';
    public const PAYMENT_PAID = 'paid';
    public const PAYMENT_FAILED = 'failed';
    public const PAYMENT_CANCELLED = 'cancelled';
    public const PAYMENT_REFUNDED = 'refunded';

    public const ORDER_PROCESSING = 'processing';
    public const ORDER_COMPLETED = 'completed';
    public const ORDER_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_number',
        'user_id',
        'course_id',
        'original_price',
        'discount_amount',
        'final_amount',
        'has_nexpilot',
        'nexpilot_id',
        'nexpilot_price',
        'payment_status',
        'order_status',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'original_price' => 'float',
        'discount_amount' => 'float',
        'final_amount' => 'float',
        'has_nexpilot' => 'boolean',
        'nexpilot_price' => 'float',
    ];

    public static function generateOrderNumber(): string
    {
        return 'ORD-'.strtoupper(date('ymd')).'-'.strtoupper(Str::random(5));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function nexpilot(): BelongsTo
    {
        return $this->belongsTo(NexPilot::class, 'nexpilot_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function enrollment(): HasOne
    {
        return $this->hasOne(Enrollment::class);
    }

    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', self::PAYMENT_PAID);
    }

    public function scopePending($query)
    {
        return $query->where('payment_status', self::PAYMENT_PENDING);
    }
}
