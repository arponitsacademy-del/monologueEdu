<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Course extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    protected $fillable = [
        'instructor_id', // legacy support
        'title',
        'slug',
        'short_description',
        'description',
        'thumbnail',
        'price',
        'sale_price',
        'is_featured',
        'status',
    ];

    protected $casts = [
        'price' => 'float',
        'sale_price' => 'float',
        'is_featured' => 'boolean',
    ];

    public static function booted(): void
    {
        static::creating(function (self $course): void {
            if (empty($course->slug)) {
                $course->slug = Str::slug($course->title);
            }
        });
    }

    public function instructors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'course_instructors', 'course_id', 'user_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    // Fallback for single instructor relationship
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('sort_order');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('sort_order');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'enrollments')
            ->withPivot(['id', 'status', 'enrolled_at'])
            ->withTimestamps();
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)->published();
    }

    public function scopeFree($query)
    {
        return $query->where('price', 0)->published();
    }

    public function scopePaid($query)
    {
        return $query->where('price', '>', 0)->published();
    }

    public function getEffectivePriceAttribute(): float
    {
        if ($this->sale_price !== null && $this->sale_price > 0 && $this->sale_price < $this->price) {
            return (float) $this->sale_price;
        }

        return (float) $this->price;
    }

    public function getDiscountPercentAttribute(): int
    {
        if (! $this->price || ! $this->sale_price || $this->price <= $this->sale_price) {
            return 0;
        }

        return (int) round((($this->price - $this->sale_price) / $this->price) * 100);
    }

    public function isAssignedTeacher(int $userId): bool
    {
        return $this->instructors()->where('users.id', $userId)->exists()
            || $this->instructor_id === $userId;
    }
}
