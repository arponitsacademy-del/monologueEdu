<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_TEACHER = 'teacher';
    public const ROLE_STUDENT = 'student';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'name',
        'phone',
        'registration_number',
        'email',
        'password',
        'role',
        'custom_role_id',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'photo_url',
        'designation',
        'institution',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public static function booted(): void
    {
        if (Schema::hasTable('users')) {
            try {
                if (! Schema::hasColumn('users', 'registration_number')) {
                    Schema::table('users', function (Blueprint $table) {
                        $table->string('registration_number', 50)->nullable()->unique()->after('phone');
                    });
                }
            } catch (\Throwable $e) {
                // Column exists or lacked DDL privileges
            }
        }

        static::creating(function (User $user) {
            if (empty($user->registration_number)) {
                $user->registration_number = self::generateUniqueRegistrationNumber();
            }
        });
    }

    public static function generateUniqueRegistrationNumber(): string
    {
        $year = date('Y');
        $prefix = "ME-{$year}-";

        // Find the latest user with this prefix
        $latest = static::where('registration_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->value('registration_number');

        if ($latest && preg_match('/' . preg_quote($prefix, '/') . '(\d+)/', $latest, $matches)) {
            $nextSeq = (int) $matches[1] + 1;
        } else {
            $count = static::count();
            $nextSeq = max(1, $count + 1);
        }

        $regNo = $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        while (static::where('registration_number', $regNo)->exists()) {
            $nextSeq++;
            $regNo = $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
        }

        return $regNo;
    }

    public function getRegistrationNumberAttribute($value): ?string
    {
        if (! empty($value)) {
            return $value;
        }

        if ($this->exists && empty($value)) {
            $newRegNo = self::generateUniqueRegistrationNumber();
            $this->forceFill(['registration_number' => $newRegNo])->saveQuietly();
            return $newRegNo;
        }

        return null;
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isTeacher(): bool
    {
        return $this->role === self::ROLE_TEACHER;
    }

    public function isStudent(): bool
    {
        return $this->role === self::ROLE_STUDENT;
    }

    public function customRole(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Role::class, 'custom_role_id');
    }

    public function canAccessAdminDashboard(): bool
    {
        if ($this->role === self::ROLE_ADMIN) {
            return true;
        }

        if ($this->custom_role_id && $this->status === self::STATUS_ACTIVE) {
            return true;
        }

        return false;
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->role === self::ROLE_ADMIN) {
            return true;
        }

        if ($this->custom_role_id && $this->relationLoaded('customRole') ? $this->customRole : $this->customRole()->first()) {
            $role = $this->relationLoaded('customRole') ? $this->customRole : $this->customRole()->first();
            return $role ? $role->hasPermission($permission) : false;
        }

        return false;
    }

    public static function normalizePhone(?string $phone): ?string
    {
        if (blank($phone)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if ($digits === null || $digits === '') {
            return null;
        }

        if (strlen($digits) === 11 && str_starts_with($digits, '01')) {
            return '+88'.$digits;
        }

        if (strlen($digits) === 13 && str_starts_with($digits, '8801')) {
            return '+'.$digits;
        }

        if (strlen($digits) === 10 && str_starts_with($digits, '1')) {
            return '+88'.$digits;
        }

        return null;
    }

    public static function isValidPhoneNumber(?string $phone): bool
    {
        $normalized = self::normalizePhone($phone);

        return is_string($normalized) && preg_match('/^\+8801[3-9]\d{8}$/', $normalized) === 1;
    }

    // Courses taught by this user (Many-to-Many)
    public function instructedCourses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_instructors', 'user_id', 'course_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    // Backward compatibility for legacy single-instructor column
    public function legacyCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'instructor_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function enrolledCourses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'enrollments')
            ->withPivot(['id', 'status', 'enrolled_at', 'expires_at'])
            ->withTimestamps();
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(LessonComment::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    public function isEnrolledIn(int $courseId): bool
    {
        return $this->enrollments()
            ->where('course_id', $courseId)
            ->where('status', 'active')
            ->exists();
    }

    public function hasCompletedLesson(int $lessonId): bool
    {
        return $this->progress()
            ->where('lesson_id', $lessonId)
            ->where('is_completed', true)
            ->exists();
    }

    public function teacherProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TeacherProfile::class);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->teacherProfile?->photo_url;
    }

    public function getDesignationAttribute(): ?string
    {
        return $this->teacherProfile?->designation;
    }

    public function getInstitutionAttribute(): ?string
    {
        return $this->teacherProfile?->institution;
    }

    public function affiliateProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(AffiliateProfile::class);
    }

    public function examSubmissions(): HasMany
    {
        return $this->hasMany(ExamSubmission::class);
    }

    public function hasPurchasedAnyCourse(): bool
    {
        return $this->enrollments()->where('status', 'active')->exists()
            || $this->orders()->where('payment_status', 'paid')->exists();
    }
}
