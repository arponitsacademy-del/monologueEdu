<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoursePurchaseSmsSetting extends Model
{
    protected $fillable = [
        'enabled',
        'general_template',
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    public static function current(): self
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'enabled' => true,
                'general_template' => "Dear {student_name}, thank you for purchasing \"{course_title}\" at Monologue Edu! Log in to start learning: {login_url}",
            ]
        );
    }
}

