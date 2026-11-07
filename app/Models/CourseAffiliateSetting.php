<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseAffiliateSetting extends Model
{
    protected $fillable = [
        'course_id',
        'is_active',
        'commission_type',
        'commission_amount',
        'discount_type',
        'discount_amount',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'commission_amount' => 'float',
        'discount_amount' => 'float',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}

