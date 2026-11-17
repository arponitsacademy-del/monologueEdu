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
        if (Schema::hasTable('enrollments') && !Schema::hasColumn('enrollments', 'access_key')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->string('access_key', 64)->nullable()->index()->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('enrollments') && Schema::hasColumn('enrollments', 'access_key')) {
            Schema::table('enrollments', function (Blueprint $table) {
                $table->dropColumn('access_key');
            });
        }
    }
};
