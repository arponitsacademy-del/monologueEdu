<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class CourseBundle extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'thumbnail',
        'short_description',
        'description',
        'regular_price',
        'sale_price',
        'status',
    ];

    protected $casts = [
        'regular_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
    ];

    protected $appends = [
        'courses_count',
        'total_regular_value',
        'discount_percentage',
    ];

    public static function boot()
    {
        parent::boot();

        static::creating(function ($bundle) {
            if (empty($bundle->slug)) {
                $baseSlug = Str::slug($bundle->title) ?: 'bundle';
                $slug = $baseSlug;
                $counter = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }
                $bundle->slug = $slug;
            }
        });
    }

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'bundle_courses', 'bundle_id', 'course_id')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order', 'asc')
            ->withTimestamps();
    }

    public function getCoursesCountAttribute(): int
    {
        return $this->courses()->count();
    }

    public function getTotalRegularValueAttribute(): float
    {
        return (float) $this->courses()->sum('price');
    }

    public function getDiscountPercentageAttribute(): int
    {
        $reg = (float) ($this->regular_price > 0 ? $this->regular_price : $this->total_regular_value);
        $sale = (float) $this->sale_price;
        if ($reg <= 0 || $sale >= $reg) {
            return 0;
        }
        return (int) round((($reg - $sale) / $reg) * 100);
    }
}

