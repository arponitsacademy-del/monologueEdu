<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('sms_campaigns')) {
            Schema::create('sms_campaigns', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('title');
                $table->string('target_type', 50); // all, students, course, custom
                $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
                $table->text('message');
                $table->unsignedInteger('total_recipients')->default(0);
                $table->unsignedInteger('sent_count')->default(0);
                $table->unsignedInteger('failed_count')->default(0);
                $table->string('status', 30)->default('completed');
                $table->timestamps();
            });
        }

        if (Schema::hasTable('sms_logs') && ! Schema::hasColumn('sms_logs', 'campaign_id')) {
            Schema::table('sms_logs', function (Blueprint $table) {
                $table->foreignId('campaign_id')->nullable()->after('id')->constrained('sms_campaigns')->nullOnDelete();
                $table->string('type', 30)->default('transactional')->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sms_logs') && Schema::hasColumn('sms_logs', 'campaign_id')) {
            Schema::table('sms_logs', function (Blueprint $table) {
                $table->dropForeign(['campaign_id']);
                $table->dropColumn(['campaign_id', 'type']);
            });
        }

        Schema::dropIfExists('sms_campaigns');
    }
};
