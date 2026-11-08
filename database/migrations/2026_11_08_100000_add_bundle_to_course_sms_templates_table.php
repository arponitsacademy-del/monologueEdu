<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('course_sms_templates')) {
            Schema::table('course_sms_templates', function (Blueprint $table) {
                if (! Schema::hasColumn('course_sms_templates', 'type')) {
                    $table->string('type')->default('course')->after('id');
                }
                if (! Schema::hasColumn('course_sms_templates', 'bundle_id')) {
                    $table->foreignId('bundle_id')->nullable()->after('course_id')->constrained('course_bundles')->cascadeOnDelete();
                }
            });

            // Make course_id nullable if SQLite or MySQL allows
            try {
                DB::statement('ALTER TABLE course_sms_templates MODIFY course_id BIGINT UNSIGNED NULL');
            } catch (\Throwable $e) {}

            try {
                DB::statement('ALTER TABLE course_sms_templates DROP INDEX course_sms_templates_course_id_unique');
            } catch (\Throwable $e) {}
        } else {
            Schema::create('course_sms_templates', function (Blueprint $table) {
                $table->id();
                $table->string('type')->default('course');
                $table->foreignId('course_id')->nullable()->constrained('courses')->cascadeOnDelete();
                $table->foreignId('bundle_id')->nullable()->constrained('course_bundles')->cascadeOnDelete();
                $table->text('template');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (! Schema::hasColumn('orders', 'bundle_id')) {
                    $table->foreignId('bundle_id')->nullable()->after('course_id')->constrained('course_bundles')->nullOnDelete();
                }
            });

            try {
                DB::statement('ALTER TABLE orders MODIFY course_id BIGINT UNSIGNED NULL');
            } catch (\Throwable $e) {}
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
