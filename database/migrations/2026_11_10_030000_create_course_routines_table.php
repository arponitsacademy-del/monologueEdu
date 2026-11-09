<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('course_routines')) {
            Schema::create('course_routines', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('type', 40)->default('general'); // class_upload, material, book_parcel, general, live_class, live_exam
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('subject', 100)->nullable();
                $table->dateTime('start_time');
                $table->dateTime('end_time')->nullable();
                $table->string('link_url', 500)->nullable();
                $table->string('action_text', 100)->nullable();
                $table->string('status', 30)->default('upcoming'); // upcoming, published, shipped, delivered, completed
                $table->json('meta')->nullable(); // courier name, tracking code, parcel recipient info, etc.
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('course_routines');
    }
};

