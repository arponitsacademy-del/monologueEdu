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
                if (! Schema::hasColumn('courses', 'enrolled_action_buttons')) {
                    $table->json('enrolled_action_buttons')->nullable()->after('action_buttons');
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
                if (Schema::hasColumn('courses', 'enrolled_action_buttons')) {
                    $table->dropColumn('enrolled_action_buttons');
                }
            });
        }
    }
};
