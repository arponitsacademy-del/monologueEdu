<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
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

        try {
            if (! Schema::hasTable('course_bundles')) {
                Schema::create('course_bundles', function (Blueprint $table) {
                    $table->id();
                    $table->string('title');
                    $table->string('slug')->unique();
                    $table->string('thumbnail', 1000)->nullable();
                    $table->text('short_description')->nullable();
                    $table->longText('description')->nullable();
                    $table->decimal('regular_price', 10, 2)->default(0);
                    $table->decimal('sale_price', 10, 2)->default(0);
                    $table->enum('status', ['draft', 'published'])->default('published');
                    $table->timestamps();
                });
            }

            if (! Schema::hasTable('bundle_courses')) {
                Schema::create('bundle_courses', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('bundle_id');
                    $table->unsignedBigInteger('course_id');
                    $table->integer('sort_order')->default(0);
                    $table->timestamps();

                    $table->unique(['bundle_id', 'course_id']);
                });
            }
        } catch (\Throwable $e) {
            // Self-healing schema already exists or permission issues
        }

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
        return $this->relationLoaded('courses') ? $this->courses->count() : $this->courses()->count();
    }

    public function getTotalRegularValueAttribute(): float
    {
        return (float) ($this->relationLoaded('courses')
            ? $this->courses->sum('price')
            : $this->courses()->sum('price'));
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

