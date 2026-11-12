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
        if (Schema::hasTable('lesson_attachments')) {
            Schema::table('lesson_attachments', function (Blueprint $table) {
                $table->text('file_path')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('lesson_attachments')) {
            Schema::table('lesson_attachments', function (Blueprint $table) {
                $table->string('file_path', 255)->change();
            });
        }
    }
};
