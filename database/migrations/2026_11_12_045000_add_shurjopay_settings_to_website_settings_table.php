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
        if (Schema::hasTable('website_settings')) {
            Schema::table('website_settings', function (Blueprint $table) {
                if (! Schema::hasColumn('website_settings', 'shurjopay_settings')) {
                    $table->json('shurjopay_settings')->nullable()->after('manual_payment_settings');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('website_settings')) {
            Schema::table('website_settings', function (Blueprint $table) {
                if (Schema::hasColumn('website_settings', 'shurjopay_settings')) {
                    $table->dropColumn('shurjopay_settings');
                }
            });
        }
    }
};

