<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Coupons master table
        if (!Schema::hasTable('coupons')) {
            Schema::create('coupons', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->string('title');
                $table->text('description')->nullable();
                $table->enum('discount_type', ['fixed', 'percentage'])->default('fixed');
                $table->decimal('discount_amount', 10, 2);
                $table->decimal('max_discount_amount', 10, 2)->nullable();
                $table->decimal('min_order_amount', 10, 2)->nullable();
                $table->enum('scope_type', ['all', 'course', 'category'])->default('all');
                $table->enum('user_restriction_type', ['all', 'specific'])->default('all');
                $table->foreignId('restricted_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->unsignedInteger('usage_limit')->nullable(); // Total times coupon can be used overall (null = unlimited)
                $table->unsignedInteger('usage_limit_per_user')->default(1);
                $table->unsignedInteger('times_used')->default(0);
                $table->dateTime('start_date')->nullable();
                $table->dateTime('expiry_date')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['code', 'is_active']);
                $table->index('restricted_user_id');
            });
        }

        // 2. Pivot table: Coupon Courses
        if (!Schema::hasTable('coupon_courses')) {
            Schema::create('coupon_courses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('coupon_id')->constrained('coupons')->cascadeOnDelete();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['coupon_id', 'course_id']);
            });
        }

        // 3. Pivot table: Coupon Categories
        if (!Schema::hasTable('coupon_categories')) {
            Schema::create('coupon_categories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('coupon_id')->constrained('coupons')->cascadeOnDelete();
                $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['coupon_id', 'category_id']);
            });
        }

        // 4. Coupon Usages tracking table
        if (!Schema::hasTable('coupon_usages')) {
            Schema::create('coupon_usages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('coupon_id')->constrained('coupons')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
                $table->decimal('discount_amount', 10, 2)->default(0);
                $table->timestamps();

                $table->index(['coupon_id', 'user_id']);
            });
        }

        // 5. Add coupon columns to orders table if not present
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'coupon_id')) {
                    $table->foreignId('coupon_id')->nullable()->after('affiliate_discount')->constrained('coupons')->nullOnDelete();
                }
                if (!Schema::hasColumn('orders', 'coupon_code')) {
                    $table->string('coupon_code', 50)->nullable()->after('coupon_id');
                }
                if (!Schema::hasColumn('orders', 'coupon_discount')) {
                    $table->decimal('coupon_discount', 10, 2)->default(0)->after('coupon_code');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'coupon_id')) {
                    $table->dropForeign(['coupon_id']);
                    $table->dropColumn(['coupon_id', 'coupon_code', 'coupon_discount']);
                }
            });
        }

        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupon_categories');
        Schema::dropIfExists('coupon_courses');
        Schema::dropIfExists('coupons');
    }
};

