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
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                if (! Schema::hasColumn('courses', 'coupon_code')) {
                    $table->string('coupon_code', 100)->nullable()->after('action_buttons');
                }
                if (! Schema::hasColumn('courses', 'coupon_discount_text')) {
                    $table->string('coupon_discount_text', 100)->nullable()->after('coupon_code');
                }
                if (! Schema::hasColumn('courses', 'discount_deadline')) {
                    $table->timestamp('discount_deadline')->nullable()->after('coupon_discount_text');
                }
                if (! Schema::hasColumn('courses', 'how_to_buy_url')) {
                    $table->string('how_to_buy_url', 500)->nullable()->after('discount_deadline');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                if (Schema::hasColumn('courses', 'coupon_code')) {
                    $table->dropColumn('coupon_code');
                }
                if (Schema::hasColumn('courses', 'coupon_discount_text')) {
                    $table->dropColumn('coupon_discount_text');
                }
                if (Schema::hasColumn('courses', 'discount_deadline')) {
                    $table->dropColumn('discount_deadline');
                }
                if (Schema::hasColumn('courses', 'how_to_buy_url')) {
                    $table->dropColumn('how_to_buy_url');
                }
            });
        }
    }
};

