<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class CourseRoutine extends Model
{
    use HasFactory;

    protected $table = 'course_routines';

    const TYPE_CLASS_UPLOAD = 'class_upload';
    const TYPE_MATERIAL = 'material';
    const TYPE_BOOK_PARCEL = 'book_parcel';
    const TYPE_LIVE_CLASS = 'live_class';
    const TYPE_LIVE_EXAM = 'live_exam';
    const TYPE_GENERAL = 'general';

    protected $fillable = [
        'course_id',
        'created_by',
        'type',
        'title',
        'description',
        'subject',
        'start_time',
        'end_time',
        'link_url',
        'action_text',
        'status',
        'meta',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'meta' => 'array',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Helper to auto-ensure table exists if accessed before migration command
     */
    public static function ensureTableExists(): void
    {
        if (!Schema::hasTable('course_routines')) {
            Schema::create('course_routines', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('type', 40)->default('general');
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('subject', 100)->nullable();
                $table->dateTime('start_time');
                $table->dateTime('end_time')->nullable();
                $table->string('link_url', 500)->nullable();
                $table->string('action_text', 100)->nullable();
                $table->string('status', 30)->default('upcoming');
                $table->json('meta')->nullable();
                $table->timestamps();
            });
        }
    }
}

