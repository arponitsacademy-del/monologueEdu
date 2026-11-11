<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
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
        'enable_manual_payment',
        'enable_shurjopay',
        'status',
    ];

    protected $casts = [
        'price' => 'float',
        'sale_price' => 'float',
        'is_featured' => 'boolean',
        'enable_manual_payment' => 'boolean',
        'enable_shurjopay' => 'boolean',
    ];

    public static function booted(): void
    {
        if (Schema::hasTable('courses') && !Schema::hasColumn('courses', 'enable_manual_payment')) {
            try {
                Schema::table('courses', function (Blueprint $table) {
                    if (!Schema::hasColumn('courses', 'enable_manual_payment')) {
                        $table->boolean('enable_manual_payment')->default(true)->after('is_featured');
                    }
                    if (!Schema::hasColumn('courses', 'enable_shurjopay')) {
                        $table->boolean('enable_shurjopay')->default(true)->after('enable_manual_payment');
                    }
                });
            } catch (\Throwable $e) {
                // columns already exist
            }
        }

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

    public function exams(): BelongsToMany
    {
        return $this->belongsToMany(Exam::class, 'course_exams')->withPivot('order')->withTimestamps()->orderBy('course_exams.order');
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

    public function nexpilot(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(NexPilot::class);
    }

    public function liveClasses(): HasMany
    {
        return $this->hasMany(LiveClass::class)->orderBy('start_time', 'desc');
    }

    public function routines(): HasMany
    {
        return $this->hasMany(CourseRoutine::class)->orderBy('start_time', 'asc');
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

    public function affiliateSetting(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(CourseAffiliateSetting::class);
    }

    public function bundles(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(CourseBundle::class, 'bundle_courses', 'course_id', 'bundle_id')
            ->withPivot('sort_order')
            ->withTimestamps();
    }
}
