<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('total_marks', 8, 2)->default(0);
            $table->decimal('pass_marks', 8, 2)->nullable()->default(0);
            $table->boolean('has_negative_marking')->default(false);
            $table->decimal('negative_marks', 8, 2)->default(0);
            $table->integer('duration_minutes')->default(30);
            $table->string('status')->default('published'); // draft, published, archived
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->timestamps();

            $table->index(['course_id', 'status']);
        });

        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->text('question_text');
            $table->string('question_type'); // single_choice, multiple_choice, written_paper
            $table->decimal('marks', 8, 2)->default(1.00);
            $table->string('attachment_url')->nullable();
            $table->text('explanation')->nullable();
            $table->integer('order')->default(0);
            $table->json('options')->nullable(); // [{"id":"1","text":"Option A"}]
            $table->json('correct_answers')->nullable(); // ["1"] or ["1","3"]
            $table->timestamps();

            $table->index(['exam_id', 'order']);
        });

        Schema::create('exam_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('total_marks', 8, 2)->default(0);
            $table->decimal('obtained_marks', 8, 2)->default(0);
            $table->integer('total_questions')->default(0);
            $table->integer('total_answered')->default(0);
            $table->integer('total_skipped')->default(0);
            $table->integer('total_correct')->default(0);
            $table->integer('total_wrong')->default(0);
            $table->decimal('negative_marks_deducted', 8, 2)->default(0);
            $table->string('status')->default('in_progress'); // in_progress, submitted, evaluated
            $table->foreignId('evaluated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('evaluation_notes')->nullable();
            $table->timestamp('evaluated_at')->nullable();
            $table->timestamps();

            $table->index(['exam_id', 'user_id']);
            $table->index(['exam_id', 'obtained_marks']);
        });

        Schema::create('exam_submission_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('exam_submissions')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('exam_questions')->cascadeOnDelete();
            $table->json('student_answer')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->decimal('marks_obtained', 8, 2)->default(0);
            $table->json('attachments')->nullable(); // [{"url":"...","name":"page1.jpg"}]
            $table->text('teacher_feedback')->nullable();
            $table->timestamps();

            $table->index(['submission_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_submission_answers');
        Schema::dropIfExists('exam_submissions');
        Schema::dropIfExists('exam_questions');
        Schema::dropIfExists('exams');
    }
};
