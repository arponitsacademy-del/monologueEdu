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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'has_nexpilot')) {
                $table->boolean('has_nexpilot')->default(false)->after('final_amount');
            }
            if (!Schema::hasColumn('orders', 'nexpilot_id')) {
                $table->unsignedBigInteger('nexpilot_id')->nullable()->after('has_nexpilot');
            }
            if (!Schema::hasColumn('orders', 'nexpilot_price')) {
                $table->decimal('nexpilot_price', 10, 2)->default(0.00)->after('nexpilot_id');
            }
        });

        Schema::table('enrollments', function (Blueprint $table) {
            if (!Schema::hasColumn('enrollments', 'has_nexpilot')) {
                $table->boolean('has_nexpilot')->default(false)->after('status');
            }
            if (!Schema::hasColumn('enrollments', 'nexpilot_id')) {
                $table->unsignedBigInteger('nexpilot_id')->nullable()->after('has_nexpilot');
            }
        });

        Schema::table('website_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('website_settings', 'openai_settings')) {
                $table->json('openai_settings')->nullable()->after('vdocipher_settings');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['has_nexpilot', 'nexpilot_id', 'nexpilot_price']);
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['has_nexpilot', 'nexpilot_id']);
        });

        Schema::table('website_settings', function (Blueprint $table) {
            $table->dropColumn('openai_settings');
        });
    }
};

