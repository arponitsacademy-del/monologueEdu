<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('otp_verifications', function (Blueprint $table) {
            if (! Schema::hasColumn('otp_verifications', 'payload')) {
                $table->json('payload')->nullable()->after('verified_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('otp_verifications', function (Blueprint $table) {
            if (Schema::hasColumn('otp_verifications', 'payload')) {
                $table->dropColumn('payload');
            }
        });
    }
};
