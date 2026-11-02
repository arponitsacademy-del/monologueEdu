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
                if (! Schema::hasColumn('website_settings', 'default_language')) {
                    $table->string('default_language', 10)->default('en')->after('site_tagline');
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
                if (Schema::hasColumn('website_settings', 'default_language')) {
                    $table->dropColumn('default_language');
                }
            });
        }
    }
};
