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
                if (! Schema::hasColumn('courses', 'features')) {
                    $table->json('features')->nullable()->after('description');
                }
                if (! Schema::hasColumn('courses', 'fake_enrollment_count')) {
                    $table->integer('fake_enrollment_count')->default(0)->after('price');
                }
                if (! Schema::hasColumn('courses', 'class_starts_at')) {
                    $table->string('class_starts_at', 100)->nullable()->after('fake_enrollment_count');
                }
                if (! Schema::hasColumn('courses', 'action_buttons')) {
                    $table->json('action_buttons')->nullable()->after('class_starts_at');
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
                if (Schema::hasColumn('courses', 'features')) {
                    $table->dropColumn('features');
                }
                if (Schema::hasColumn('courses', 'fake_enrollment_count')) {
                    $table->dropColumn('fake_enrollment_count');
                }
                if (Schema::hasColumn('courses', 'class_starts_at')) {
                    $table->dropColumn('class_starts_at');
                }
                if (Schema::hasColumn('courses', 'action_buttons')) {
                    $table->dropColumn('action_buttons');
                }
            });
        }
    }
};

