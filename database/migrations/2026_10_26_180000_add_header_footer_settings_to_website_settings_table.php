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
                if (! Schema::hasColumn('website_settings', 'header_settings')) {
                    $table->json('header_settings')->nullable()->after('copyright_text');
                }
                if (! Schema::hasColumn('website_settings', 'footer_settings')) {
                    $table->json('footer_settings')->nullable()->after('header_settings');
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
                if (Schema::hasColumn('website_settings', 'header_settings')) {
                    $table->dropColumn('header_settings');
                }
                if (Schema::hasColumn('website_settings', 'footer_settings')) {
                    $table->dropColumn('footer_settings');
                }
            });
        }
    }
};
