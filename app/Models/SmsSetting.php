<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsSetting extends Model
{
    protected $fillable = [
        'provider',
        'api_token',
        'sender_id',
        'sms_enabled',
        'otp_enabled',
        'otp_expiration_minutes',
        'otp_resend_cooldown_seconds',
    ];

    protected $casts = [
        'api_token' => 'encrypted',
        'sms_enabled' => 'boolean',
        'otp_enabled' => 'boolean',
        'otp_expiration_minutes' => 'integer',
        'otp_resend_cooldown_seconds' => 'integer',
    ];

    public static function current(): self
    {
        return static::firstOrCreate(
            ['provider' => 'greenweb'],
            [
                'sms_enabled' => false,
                'otp_enabled' => false,
                'otp_expiration_minutes' => 5,
                'otp_resend_cooldown_seconds' => 60,
            ]
        );
    }

    public function getMaskedTokenAttribute(): string
    {
        if (empty($this->api_token)) {
            return '';
        }

        $length = strlen($this->api_token);
        if ($length <= 8) {
            return '********';
        }

        return substr($this->api_token, 0, 4) . str_repeat('*', $length - 8) . substr($this->api_token, -4);
    }
}
