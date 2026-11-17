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
        if (Schema::hasTable('courses') && !Schema::hasColumn('courses', 'deleted_at')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('course_bundles') && !Schema::hasColumn('course_bundles', 'deleted_at')) {
            Schema::table('course_bundles', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('exams') && !Schema::hasColumn('exams', 'deleted_at')) {
            Schema::table('exams', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('coupons') && !Schema::hasColumn('coupons', 'deleted_at')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('courses') && Schema::hasColumn('courses', 'deleted_at')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('course_bundles') && Schema::hasColumn('course_bundles', 'deleted_at')) {
            Schema::table('course_bundles', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('exams') && Schema::hasColumn('exams', 'deleted_at')) {
            Schema::table('exams', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('coupons') && Schema::hasColumn('coupons', 'deleted_at')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
