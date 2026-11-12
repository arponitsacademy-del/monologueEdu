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
        'features',
        'thumbnail',
        'price',
        'sale_price',
        'fake_enrollment_count',
        'class_starts_at',
        'action_buttons',
        'coupon_code',
        'coupon_discount_text',
        'discount_deadline',
        'how_to_buy_url',
        'is_featured',
        'enable_manual_payment',
        'enable_shurjopay',
        'status',
    ];

    protected $casts = [
        'price' => 'float',
        'sale_price' => 'float',
        'features' => 'array',
        'fake_enrollment_count' => 'integer',
        'action_buttons' => 'array',
        'discount_deadline' => 'datetime',
        'is_featured' => 'boolean',
        'enable_manual_payment' => 'boolean',
        'enable_shurjopay' => 'boolean',
    ];

    protected $appends = [
        'effective_price',
        'discount_percent',
    ];

    public static function booted(): void
    {
        if (Schema::hasTable('courses')) {
            try {
                Schema::table('courses', function (Blueprint $table) {
                    if (!Schema::hasColumn('courses', 'enable_manual_payment')) {
                        $table->boolean('enable_manual_payment')->default(true)->after('is_featured');
                    }
                    if (!Schema::hasColumn('courses', 'enable_shurjopay')) {
                        $table->boolean('enable_shurjopay')->default(true)->after('enable_manual_payment');
                    }
                    if (!Schema::hasColumn('courses', 'features')) {
                        $table->json('features')->nullable()->after('description');
                    }
                    if (!Schema::hasColumn('courses', 'fake_enrollment_count')) {
                        $table->integer('fake_enrollment_count')->default(0)->after('price');
                    }
                    if (!Schema::hasColumn('courses', 'class_starts_at')) {
                        $table->string('class_starts_at', 100)->nullable()->after('fake_enrollment_count');
                    }
                    if (!Schema::hasColumn('courses', 'action_buttons')) {
                        $table->json('action_buttons')->nullable()->after('class_starts_at');
                    }
                    if (!Schema::hasColumn('courses', 'coupon_code')) {
                        $table->string('coupon_code', 100)->nullable()->after('action_buttons');
                    }
                    if (!Schema::hasColumn('courses', 'coupon_discount_text')) {
                        $table->string('coupon_discount_text', 100)->nullable()->after('coupon_code');
                    }
                    if (!Schema::hasColumn('courses', 'discount_deadline')) {
                        $table->timestamp('discount_deadline')->nullable()->after('coupon_discount_text');
                    }
                    if (!Schema::hasColumn('courses', 'how_to_buy_url')) {
                        $table->string('how_to_buy_url', 500)->nullable()->after('discount_deadline');
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

    public function getCategoryAttribute(): ?Category
    {
        return $this->relationLoaded('categories') ? $this->categories->first() : $this->categories()->first();
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
        if ($this->sale_price !== null && $this->sale_price >= 0 && $this->sale_price < $this->price) {
            return (float) $this->sale_price;
        }

        return (float) $this->price;
    }

    public function getDiscountPercentAttribute(): int
    {
        if (! $this->price || $this->sale_price === null || $this->price <= $this->sale_price) {
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
