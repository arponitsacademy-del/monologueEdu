<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AffiliateSetting extends Model
{
    protected $fillable = [
        'is_enabled',
        'cookie_days',
        'default_commission_type',
        'default_commission_amount',
        'default_discount_type',
        'default_discount_amount',
        'min_payout_amount',
        'require_course_purchase',
        'terms_notice',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'cookie_days' => 'integer',
        'default_commission_amount' => 'float',
        'default_discount_amount' => 'float',
        'min_payout_amount' => 'float',
        'require_course_purchase' => 'boolean',
    ];

    /**
     * Get or create singleton affiliate settings
     */
    public static function current(): self
    {
        return static::firstOrCreate([], [
            'is_enabled' => true,
            'cookie_days' => 30,
            'default_commission_type' => 'percentage',
            'default_commission_amount' => 10.00,
            'default_discount_type' => 'percentage',
            'default_discount_amount' => 0.00,
            'min_payout_amount' => 500.00,
            'require_course_purchase' => true,
        ]);
    }
}

