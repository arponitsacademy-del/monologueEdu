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
                if (! Schema::hasColumn('website_settings', 'manual_payment_settings')) {
                    $table->json('manual_payment_settings')->nullable()->after('footer_settings');
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
                if (Schema::hasColumn('website_settings', 'manual_payment_settings')) {
                    $table->dropColumn('manual_payment_settings');
                }
            });
        }
    }
};
