<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Course Instructors (many-to-many)
        if (! Schema::hasTable('course_instructors')) {
            Schema::create('course_instructors', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->boolean('is_primary')->default(false);
                $table->timestamps();
                $table->unique(['course_id', 'user_id']);
            });
        }

        // 2. Course Sections (Topics)
        if (! Schema::hasTable('course_sections')) {
            Schema::create('course_sections', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // 3. Extend lessons table
        Schema::table('lessons', function (Blueprint $table) {
            if (! Schema::hasColumn('lessons', 'section_id')) {
                $table->foreignId('section_id')->nullable()->after('course_id')->constrained('course_sections')->nullOnDelete();
            }
            if (! Schema::hasColumn('lessons', 'slug')) {
                $table->string('slug')->nullable()->after('title');
            }
            if (! Schema::hasColumn('lessons', 'video_url')) {
                $table->string('video_url')->nullable()->after('content');
            }
            if (! Schema::hasColumn('lessons', 'is_preview')) {
                $table->boolean('is_preview')->default(false)->after('duration_minutes');
            }
            if (! Schema::hasColumn('lessons', 'status')) {
                $table->string('status')->default('published')->after('is_preview');
            }
        });

        // 4. Lesson Attachments
        if (! Schema::hasTable('lesson_attachments')) {
            Schema::create('lesson_attachments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
                $table->string('file_name');
                $table->string('file_type', 50)->default('pdf');
                $table->unsignedBigInteger('file_size')->default(0);
                $table->string('file_path');
                $table->boolean('is_private')->default(true);
                $table->timestamps();
            });
        }

        // 5. Lesson Comments (Threaded)
        if (! Schema::hasTable('lesson_comments')) {
            Schema::create('lesson_comments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('parent_id')->nullable()->constrained('lesson_comments')->cascadeOnDelete();
                $table->text('content');
                $table->timestamps();
            });
        }

        // 6. Orders
        if (! Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
                $table->id();
                $table->string('order_number')->unique();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->decimal('original_price', 10, 2)->default(0);
                $table->decimal('discount_amount', 10, 2)->default(0);
                $table->decimal('final_amount', 10, 2)->default(0);
                $table->string('payment_status')->default('pending'); // pending, paid, failed, cancelled, refunded
                $table->string('order_status')->default('processing'); // processing, completed, cancelled
                $table->string('payment_method')->default('manual'); // bkash, nagad, rocket, bank, free, manual
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 7. Order Items
        if (! Schema::hasTable('order_items')) {
            Schema::create('order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->decimal('price', 10, 2)->default(0);
                $table->timestamps();
            });
        }

        // 8. Payments
        if (! Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
                $table->string('transaction_ref')->nullable();
                $table->string('sender_phone')->nullable();
                $table->decimal('amount', 10, 2);
                $table->string('payment_method');
                $table->string('status')->default('pending'); // pending, approved, rejected
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('verified_at')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 9. Enrollments
        if (! Schema::hasTable('enrollments')) {
            Schema::create('enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
                $table->string('status')->default('active'); // active, suspended, expired
                $table->timestamp('enrolled_at')->useCurrent();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'course_id']);
            });
        }

        // 10. Lesson Progress
        if (! Schema::hasTable('lesson_progress')) {
            Schema::create('lesson_progress', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
                $table->boolean('is_completed')->default(false);
                $table->timestamp('completed_at')->nullable();
                $table->timestamp('last_accessed_at')->nullable();
                $table->timestamps();
                $table->unique(['user_id', 'lesson_id']);
            });
        }

        // 11. SMS Settings
        if (! Schema::hasTable('sms_settings')) {
            Schema::create('sms_settings', function (Blueprint $table) {
                $table->id();
                $table->string('provider')->default('greenweb');
                $table->text('api_token')->nullable(); // encrypted
                $table->string('sender_id')->nullable();
                $table->boolean('sms_enabled')->default(false);
                $table->boolean('otp_enabled')->default(false);
                $table->integer('otp_expiration_minutes')->default(5);
                $table->integer('otp_resend_cooldown_seconds')->default(60);
                $table->timestamps();
            });
        }

        // 12. SMS Logs
        if (! Schema::hasTable('sms_logs')) {
            Schema::create('sms_logs', function (Blueprint $table) {
                $table->id();
                $table->string('phone');
                $table->text('message');
                $table->string('status')->default('sent'); // sent, failed, simulated
                $table->text('response_payload')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // 13. OTP Verifications
        if (! Schema::hasTable('otp_verifications')) {
            Schema::create('otp_verifications', function (Blueprint $table) {
                $table->id();
                $table->string('phone')->index();
                $table->string('otp_hash');
                $table->timestamp('expires_at');
                $table->integer('attempts')->default(0);
                $table->timestamp('verified_at')->nullable();
                $table->timestamps();
            });
        }

        // 14. Website Settings
        if (! Schema::hasTable('website_settings')) {
            Schema::create('website_settings', function (Blueprint $table) {
                $table->id();
                $table->string('site_name')->default('Novonex Academy');
                $table->string('site_tagline')->nullable()->default('Bangladesh’s Premier EdTech Platform');
                $table->string('logo_url')->nullable();
                $table->string('favicon_url')->nullable();
                $table->string('contact_email')->nullable()->default('support@novonex.edu.bd');
                $table->string('contact_phone')->nullable()->default('+880 1700 000000');
                $table->string('primary_color')->default('#0ea5e9');
                $table->string('secondary_color')->default('#0f172a');
                $table->text('copyright_text')->nullable()->default('© 2026 Novonex Academy. All rights reserved.');
                $table->timestamps();
            });
        }

        // 15. Audit Logs
        if (! Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action');
                $table->string('entity_type')->nullable();
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                $table->string('ip_address')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('website_settings');
        Schema::dropIfExists('otp_verifications');
        Schema::dropIfExists('sms_logs');
        Schema::dropIfExists('sms_settings');
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('lesson_comments');
        Schema::dropIfExists('lesson_attachments');

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropColumn(['section_id', 'slug', 'video_url', 'is_preview', 'status']);
        });

        Schema::dropIfExists('course_sections');
        Schema::dropIfExists('course_instructors');
    }
};
