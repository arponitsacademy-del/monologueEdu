<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('live_classes')) {
            Schema::create('live_classes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('live_url');
                $table->dateTime('start_time');
                $table->dateTime('end_time')->nullable();
                $table->string('status', 30)->default('upcoming');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('live_class_comments')) {
            Schema::create('live_class_comments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('live_class_id')->constrained('live_classes')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->text('comment');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('live_class_comments');
        Schema::dropIfExists('live_classes');
    }
};
