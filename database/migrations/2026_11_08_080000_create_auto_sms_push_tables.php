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
        if (! Schema::hasTable('course_purchase_sms_settings')) {
            Schema::create('course_purchase_sms_settings', function (Blueprint $table) {
                $table->id();
                $table->boolean('enabled')->default(true);
                $table->text('general_template');
                $table->timestamps();
            });

            // Seed default general template
            DB::table('course_purchase_sms_settings')->insert([
                'enabled' => true,
                'general_template' => "Dear {student_name}, thank you for purchasing \"{course_title}\" at Monologue Edu! Log in to start learning: {login_url}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (! Schema::hasTable('course_sms_templates')) {
            Schema::create('course_sms_templates', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete()->unique();
                $table->text('template');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_sms_templates');
        Schema::dropIfExists('course_purchase_sms_settings');
    }
};
