<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->unique(['course_id', 'exam_id']);
        });

        // Migrate any existing exams that had a direct course_id
        if (Schema::hasTable('exams')) {
            $existing = DB::table('exams')->whereNotNull('course_id')->get();
            foreach ($existing as $row) {
                DB::table('course_exams')->insertOrIgnore([
                    'course_id' => $row->course_id,
                    'exam_id' => $row->id,
                    'order' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('course_exams');
    }
};

