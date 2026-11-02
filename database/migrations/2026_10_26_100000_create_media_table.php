<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('media')) {
            Schema::create('media', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('file_name');
                $table->string('file_path');
                $table->string('file_type', 50);
                $table->string('mime_type', 100)->nullable();
                $table->unsignedBigInteger('file_size')->default(0);
                $table->string('url');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
