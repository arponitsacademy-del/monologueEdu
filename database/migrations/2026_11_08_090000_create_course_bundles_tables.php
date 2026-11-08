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
        if (! Schema::hasTable('course_bundles')) {
            Schema::create('course_bundles', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->string('thumbnail', 1000)->nullable();
                $table->text('short_description')->nullable();
                $table->longText('description')->nullable();
                $table->decimal('regular_price', 10, 2)->default(0);
                $table->decimal('sale_price', 10, 2)->default(0);
                $table->enum('status', ['draft', 'published'])->default('published');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('bundle_courses')) {
            Schema::create('bundle_courses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('bundle_id')->constrained('course_bundles')->cascadeOnDelete();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->unique(['bundle_id', 'course_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bundle_courses');
        Schema::dropIfExists('course_bundles');
    }
};

