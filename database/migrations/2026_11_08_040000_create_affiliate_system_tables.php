<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. General Affiliate Settings
        Schema::create('affiliate_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_enabled')->default(true);
            $table->integer('cookie_days')->default(30);
            $table->enum('default_commission_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('default_commission_amount', 8, 2)->default(10.00); // 10% or 100 Tk
            $table->enum('default_discount_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('default_discount_amount', 8, 2)->default(0.00); // discount for buyer
            $table->decimal('min_payout_amount', 8, 2)->default(500.00);
            $table->boolean('require_course_purchase')->default(true);
            $table->text('terms_notice')->nullable();
            $table->timestamps();
        });

        // Insert initial default settings
        DB::table('affiliate_settings')->insert([
            'is_enabled' => true,
            'cookie_days' => 30,
            'default_commission_type' => 'percentage',
            'default_commission_amount' => 10.00,
            'default_discount_type' => 'percentage',
            'default_discount_amount' => 0.00,
            'min_payout_amount' => 500.00,
            'require_course_purchase' => true,
            'terms_notice' => 'আমাদের যেকোনো একটি কোর্স কেনা থাকলেই আপনি অ্যাফিলিয়েট পার্টনার হিসেবে কাজ করতে পারবেন। আপনার লিংকের মাধ্যমে কোনো শিক্ষার্থী কোর্স কিনলে আপনি নির্ধারিত কমিশন পেয়ে যাবেন।',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Affiliate Profiles
        Schema::create('affiliate_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('affiliate_code', 50)->unique();
            $table->string('status')->default('active'); // active, suspended
            $table->decimal('balance', 10, 2)->default(0.00);
            $table->decimal('total_earned', 10, 2)->default(0.00);
            $table->decimal('total_withdrawn', 10, 2)->default(0.00);
            $table->integer('clicks_count')->default(0);
            $table->string('payout_method')->nullable(); // bkash, nagad, rocket, bank
            $table->string('payout_account')->nullable();
            $table->timestamps();

            $table->index(['affiliate_code', 'status']);
        });

        // 3. Course Specific Affiliate Settings (Overrides general settings)
        Schema::create('course_affiliate_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->unique()->constrained('courses')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->enum('commission_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('commission_amount', 8, 2)->default(10.00);
            $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('discount_amount', 8, 2)->default(0.00);
            $table->timestamps();
        });

        // 4. Affiliate Commissions
        Schema::create('affiliate_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_id')->constrained('affiliate_profiles')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('order_amount', 10, 2);
            $table->decimal('discount_given', 8, 2)->default(0.00);
            $table->enum('commission_type', ['percentage', 'fixed']);
            $table->decimal('commission_rate', 8, 2);
            $table->decimal('commission_amount', 10, 2);
            $table->string('status')->default('approved'); // pending, approved, cancelled
            $table->timestamps();

            $table->index(['affiliate_id', 'status']);
        });

        // 5. Affiliate Payouts / Withdrawals
        Schema::create('affiliate_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_id')->constrained('affiliate_profiles')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('payment_method'); // bkash, nagad, rocket, bank
            $table->string('account_number');
            $table->string('transaction_ref')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->text('admin_notes')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['affiliate_id', 'status']);
        });

        // 6. Modify Orders table to store affiliate attribution
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'affiliate_id')) {
                    $table->foreignId('affiliate_id')->nullable()->after('user_id')->constrained('affiliate_profiles')->nullOnDelete();
                }
                if (!Schema::hasColumn('orders', 'affiliate_code')) {
                    $table->string('affiliate_code', 50)->nullable()->after('affiliate_id');
                }
                if (!Schema::hasColumn('orders', 'affiliate_discount')) {
                    $table->decimal('affiliate_discount', 8, 2)->default(0.00)->after('discount_amount');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'affiliate_id')) {
                    $table->dropForeign(['affiliate_id']);
                    $table->dropColumn(['affiliate_id', 'affiliate_code', 'affiliate_discount']);
                }
            });
        }

        Schema::dropIfExists('affiliate_payouts');
        Schema::dropIfExists('affiliate_commissions');
        Schema::dropIfExists('course_affiliate_settings');
        Schema::dropIfExists('affiliate_profiles');
        Schema::dropIfExists('affiliate_settings');
    }
};
