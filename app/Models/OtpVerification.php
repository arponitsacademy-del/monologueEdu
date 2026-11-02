<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    protected $fillable = [
        'phone',
        'otp_hash',
        'expires_at',
        'attempts',
        'verified_at',
        'payload',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'attempts' => 'integer',
        'payload' => 'array',
    ];

    public function isValid(): bool
    {
        return $this->verified_at === null && $this->expires_at->isFuture();
    }
}
