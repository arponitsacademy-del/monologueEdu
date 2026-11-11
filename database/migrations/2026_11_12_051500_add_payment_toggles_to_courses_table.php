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
                if (! Schema::hasColumn('courses', 'enable_manual_payment')) {
                    $table->boolean('enable_manual_payment')->default(true)->after('is_featured');
                }
                if (! Schema::hasColumn('courses', 'enable_shurjopay')) {
                    $table->boolean('enable_shurjopay')->default(true)->after('enable_manual_payment');
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
                if (Schema::hasColumn('courses', 'enable_shurjopay')) {
                    $table->dropColumn('enable_shurjopay');
                }
                if (Schema::hasColumn('courses', 'enable_manual_payment')) {
                    $table->dropColumn('enable_manual_payment');
                }
            });
        }
    }
};
