<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('teacher_profiles')) {
            Schema::create('teacher_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('designation')->nullable();
                $table->string('institution')->nullable();
                $table->string('photo_url')->nullable();
                $table->text('bio')->nullable();
                $table->string('expertise')->nullable();
                $table->json('social_links')->nullable();
                $table->boolean('is_featured')->default(true);
                $table->integer('order')->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_profiles');
    }
};
