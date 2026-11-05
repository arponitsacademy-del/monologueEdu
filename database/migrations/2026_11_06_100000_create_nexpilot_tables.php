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
        if (!Schema::hasTable('nexpilots')) {
            Schema::create('nexpilots', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->string('title')->nullable();
                $table->decimal('price', 10, 2)->default(0.00);
                $table->text('short_description')->nullable();
                $table->longText('long_description')->nullable();
                $table->decimal('max_usd_limit', 8, 4)->default(2.0000);
                $table->string('openai_model')->default('gpt-4o-mini');
                $table->text('openai_api_key')->nullable();
                $table->longText('system_prompt')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique('course_id');
            });
        }

        if (!Schema::hasTable('nexpilot_topics')) {
            Schema::create('nexpilot_topics', function (Blueprint $table) {
                $table->id();
                $table->foreignId('nexpilot_id')->constrained('nexpilots')->cascadeOnDelete();
                $table->enum('type', ['theory', 'practice'])->default('theory');
                $table->string('title');
                $table->text('description')->nullable();
                $table->longText('prompt')->nullable();
                $table->longText('materials_text')->nullable();
                $table->json('attachments')->nullable();
                $table->integer('order_index')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['nexpilot_id', 'type']);
            });
        }

        if (!Schema::hasTable('nexpilot_student_usages')) {
            Schema::create('nexpilot_student_usages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('nexpilot_id')->constrained('nexpilots')->cascadeOnDelete();
                $table->foreignId('enrollment_id')->nullable()->constrained('enrollments')->nullOnDelete();
                $table->unsignedBigInteger('prompt_tokens')->default(0);
                $table->unsignedBigInteger('completion_tokens')->default(0);
                $table->unsignedBigInteger('total_tokens')->default(0);
                $table->decimal('total_usd_spent', 10, 6)->default(0.000000);
                $table->boolean('is_blocked')->default(false);
                $table->timestamps();

                $table->unique(['user_id', 'nexpilot_id']);
            });
        }

        if (!Schema::hasTable('nexpilot_chat_messages')) {
            Schema::create('nexpilot_chat_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('nexpilot_topic_id')->constrained('nexpilot_topics')->cascadeOnDelete();
                $table->string('session_id')->nullable();
                $table->enum('role', ['user', 'assistant', 'system'])->default('user');
                $table->longText('content');
                $table->unsignedInteger('prompt_tokens')->default(0);
                $table->unsignedInteger('completion_tokens')->default(0);
                $table->decimal('usd_cost', 10, 6)->default(0.000000);
                $table->timestamps();

                $table->index(['user_id', 'nexpilot_topic_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nexpilot_chat_messages');
        Schema::dropIfExists('nexpilot_student_usages');
        Schema::dropIfExists('nexpilot_topics');
        Schema::dropIfExists('nexpilots');
    }
};

