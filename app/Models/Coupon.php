<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Coupon extends Model
{
    use HasFactory;

    public const TYPE_FIXED = 'fixed';
    public const TYPE_PERCENTAGE = 'percentage';

    public const SCOPE_ALL = 'all';
    public const SCOPE_COURSE = 'course';
    public const SCOPE_CATEGORY = 'category';

    public const USER_ALL = 'all';
    public const USER_SPECIFIC = 'specific';

    protected $fillable = [
        'code',
        'title',
        'description',
        'discount_type',
        'discount_amount',
        'max_discount_amount',
        'min_order_amount',
        'scope_type',
        'user_restriction_type',
        'restricted_user_id',
        'usage_limit',
        'usage_limit_per_user',
        'times_used',
        'start_date',
        'expiry_date',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'discount_amount' => 'float',
        'max_discount_amount' => 'float',
        'min_order_amount' => 'float',
        'usage_limit' => 'integer',
        'usage_limit_per_user' => 'integer',
        'times_used' => 'integer',
        'start_date' => 'datetime',
        'expiry_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'coupon_courses')->withTimestamps();
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'coupon_categories')->withTimestamps();
    }

    public function restrictedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restricted_user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function usages(): HasMany
    {
        return $this->hasMany(CouponUsage::class);
    }

    /**
     * Check whether coupon is currently active based on dates and status
     */
    public function isCurrentlyValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = Carbon::now();

        if ($this->start_date && $this->start_date->isFuture()) {
            return false;
        }

        if ($this->expiry_date && $this->expiry_date->isPast()) {
            return false;
        }

        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    /**
     * Calculate discount amount given a base course price
     */
    public function calculateDiscount(float $basePrice): float
    {
        if ($this->discount_type === self::TYPE_PERCENTAGE) {
            $discount = round(($basePrice * $this->discount_amount) / 100, 2);
            if ($this->max_discount_amount !== null && $this->max_discount_amount > 0) {
                $discount = min($discount, (float) $this->max_discount_amount);
            }
            return min($basePrice, max(0, $discount));
        }

        // Fixed / flat discount
        return min($basePrice, max(0, (float) $this->discount_amount));
    }

    /**
     * Fully validate coupon for a specific user and course
     */
    public function validateForCheckout(?User $user, Course $course, float $coursePrice): array
    {
        if (!$this->is_active) {
            return ['valid' => false, 'message' => 'This coupon is no longer active.'];
        }

        $now = Carbon::now();

        if ($this->start_date && $this->start_date->isFuture()) {
            return ['valid' => false, 'message' => 'This coupon offer has not started yet.'];
        }

        if ($this->expiry_date && $this->expiry_date->isPast()) {
            return ['valid' => false, 'message' => 'This coupon has expired.'];
        }

        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) {
            return ['valid' => false, 'message' => 'This coupon has reached its total usage limit.'];
        }

        // Minimum order amount check
        if ($this->min_order_amount !== null && $this->min_order_amount > 0 && $coursePrice < $this->min_order_amount) {
            return [
                'valid' => false,
                'message' => "This coupon requires a minimum course value of ৳{$this->min_order_amount}."
            ];
        }

        // User restriction check
        if ($this->user_restriction_type === self::USER_SPECIFIC) {
            if (!$user || $user->id !== $this->restricted_user_id) {
                return ['valid' => false, 'message' => 'This coupon is restricted to a specific user account.'];
            }
        }

        // Per-user usage limit check
        if ($user && $this->usage_limit_per_user > 0) {
            $userUsageCount = $this->usages()->where('user_id', $user->id)->count();
            if ($userUsageCount >= $this->usage_limit_per_user) {
                return ['valid' => false, 'message' => 'You have already reached the maximum usage limit for this coupon.'];
            }
        }

        // Scope check: specific course
        if ($this->scope_type === self::SCOPE_COURSE) {
            $isLinked = $this->courses()->where('courses.id', $course->id)->exists();
            if (!$isLinked) {
                return ['valid' => false, 'message' => 'This coupon is not valid for this specific course.'];
            }
        }

        // Scope check: specific category
        if ($this->scope_type === self::SCOPE_CATEGORY) {
            $categoryIds = $course->categories()->pluck('categories.id')->toArray();
            $isCategoryLinked = $this->categories()->whereIn('categories.id', $categoryIds)->exists();
            if (!$isCategoryLinked) {
                return ['valid' => false, 'message' => 'This coupon is only valid for selected course categories.'];
            }
        }

        $discount = $this->calculateDiscount($coursePrice);

        return [
            'valid' => true,
            'coupon_id' => $this->id,
            'code' => $this->code,
            'title' => $this->title,
            'discount_type' => $this->discount_type,
            'discount_amount' => $this->discount_amount,
            'calculated_discount' => $discount,
            'final_price' => max(0, $coursePrice - $discount),
            'message' => 'Coupon applied successfully!',
        ];
    }
}
