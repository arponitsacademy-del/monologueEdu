<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AffiliateProfile extends Model
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';

    protected $fillable = [
        'user_id',
        'affiliate_code',
        'status',
        'balance',
        'total_earned',
        'total_withdrawn',
        'clicks_count',
        'payout_method',
        'payout_account',
    ];

    protected $casts = [
        'balance' => 'float',
        'total_earned' => 'float',
        'total_withdrawn' => 'float',
        'clicks_count' => 'integer',
    ];

    public static function generateCodeForUser(User $user): string
    {
        $base = Str::slug($user->name);
        if (empty($base)) {
            $base = 'aff';
        }
        $code = Str::lower(substr($base, 0, 10)) . rand(100, 999);

        while (static::where('affiliate_code', $code)->exists()) {
            $code = Str::lower(substr($base, 0, 8)) . rand(1000, 9999);
        }

        return $code;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(AffiliateCommission::class, 'affiliate_id');
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(AffiliatePayout::class, 'affiliate_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'affiliate_id');
    }
}
