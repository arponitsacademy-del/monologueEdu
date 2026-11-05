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
        if (Schema::hasTable('nexpilots') && Schema::hasColumn('nexpilots', 'openai_model')) {
            Schema::table('nexpilots', function (Blueprint $table) {
                $table->string('openai_model')->nullable()->default('gpt-4o-mini')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('nexpilots') && Schema::hasColumn('nexpilots', 'openai_model')) {
            Schema::table('nexpilots', function (Blueprint $table) {
                $table->string('openai_model')->default('gpt-4o-mini')->change();
            });
        }
    }
};
