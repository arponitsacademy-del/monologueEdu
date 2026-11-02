<?php

use App\Http\Controllers\Api\AdminCategoryController;
use App\Http\Controllers\Api\AdminCourseController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseBuilderController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\LessonAttachmentController;
use App\Http\Controllers\Api\LessonCommentController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AdminPageController;
use App\Http\Controllers\Api\PublicPageController;
use App\Http\Controllers\Api\OtpController;
use App\Http\Controllers\Api\PublicCourseController;
use App\Http\Controllers\Api\SmsMarketingController;
use App\Http\Controllers\Api\SmsSettingsController;
use App\Http\Controllers\Api\VdoCipherController;
use App\Http\Controllers\Api\WebsiteSettingsController;
use App\Models\Course;
use App\Models\LessonComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/otp/verify', [OtpController::class, 'verify']);
Route::post('auth/otp/resend', [OtpController::class, 'resend']);

Route::get('courses', [PublicCourseController::class, 'index']);
Route::get('courses/{slug}', [PublicCourseController::class, 'show']);
Route::get('categories', [PublicCourseController::class, 'categories']);
Route::get('settings', [WebsiteSettingsController::class, 'getSettings']);
Route::get('pages/{slug}', [PublicPageController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Authenticated via Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth profile
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Enrollments & Learning
    Route::post('courses/{course}/enroll-free', [EnrollmentController::class, 'enrollFree']);
    Route::get('student/my-courses', [EnrollmentController::class, 'myCourses']);
    Route::get('learning/{course}/lessons/{lesson}', [EnrollmentController::class, 'getLesson']);
    Route::post('learning/lessons/{lesson}/progress', [EnrollmentController::class, 'toggleProgress']);
    Route::get('learning/attachments/{attachment}/download', [LessonAttachmentController::class, 'download']);

    // Lesson Discussion & Comments
    Route::get('learning/lessons/{lesson}/comments', [LessonCommentController::class, 'index']);
    Route::post('learning/lessons/{lesson}/comments', [LessonCommentController::class, 'store']);
    Route::post('learning/comments/{comment}/reply', [LessonCommentController::class, 'reply']);

    // Orders & Checkout
    Route::post('orders/checkout', [OrderController::class, 'checkout']);
    Route::get('orders/my-orders', [OrderController::class, 'myOrders']);

    // VdoCipher DRM OTP Playback
    Route::post('vdocipher/otp', [VdoCipherController::class, 'getOtp']);

    // Course Builder (Accessible to Admin & Assigned Teachers)
    Route::prefix('builder')->group(function () {
        Route::get('{course}/curriculum', [CourseBuilderController::class, 'getCurriculum']);
        Route::post('{course}/sections', [CourseBuilderController::class, 'storeSection']);
        Route::put('sections/{section}', [CourseBuilderController::class, 'updateSection']);
        Route::delete('sections/{section}', [CourseBuilderController::class, 'deleteSection']);
        Route::post('{course}/reorder-sections', [CourseBuilderController::class, 'reorderSections']);

        Route::post('sections/{section}/lessons', [CourseBuilderController::class, 'storeLesson']);
        Route::put('lessons/{lesson}', [CourseBuilderController::class, 'updateLesson']);
        Route::delete('lessons/{lesson}', [CourseBuilderController::class, 'deleteLesson']);
        Route::post('sections/{section}/reorder-lessons', [CourseBuilderController::class, 'reorderLessons']);
        Route::post('lessons/{lesson}/duplicate', [CourseBuilderController::class, 'duplicateLesson']);

        Route::post('lessons/{lesson}/attachments', [LessonAttachmentController::class, 'upload']);
        Route::delete('attachments/{attachment}', [LessonAttachmentController::class, 'delete']);

        Route::post('vdocipher/upload-credentials', [VdoCipherController::class, 'getUploadCredentials']);
    });

    // Teacher Specific Routes
    Route::prefix('teacher')->middleware('role:teacher,admin')->group(function () {
        Route::get('my-courses', function (Request $request) {
            $user = $request->user();
            $courses = Course::whereHas('instructors', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })
            ->orWhere('instructor_id', $user->id)
            ->withCount(['lessons', 'enrollments'])
            ->latest()
            ->get();

            return response()->json($courses);
        });

        Route::get('student-questions', function (Request $request) {
            $user = $request->user();
            $courseIds = Course::whereHas('instructors', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            })
            ->orWhere('instructor_id', $user->id)
            ->pluck('id');

            $questions = LessonComment::whereNull('parent_id')
                ->whereHas('lesson', function ($q) use ($courseIds) {
                    $q->whereIn('course_id', $courseIds);
                })
                ->with(['lesson:id,title,course_id', 'lesson.course:id,title', 'user:id,name', 'replies.user:id,name'])
                ->latest()
                ->paginate(15);

            return response()->json($questions);
        });
    });

    // Admin Specific Routes
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        // Course Management
        Route::get('courses', [AdminCourseController::class, 'index']);
        Route::post('courses', [AdminCourseController::class, 'store']);
        Route::get('courses/{course}', [AdminCourseController::class, 'show']);
        Route::put('courses/{course}', [AdminCourseController::class, 'update']);
        Route::delete('courses/{course}', [AdminCourseController::class, 'destroy']);
        Route::get('teachers-list', [AdminCourseController::class, 'teachersList']);

        // Course Category Management
        Route::get('categories', [AdminCategoryController::class, 'index']);
        Route::post('categories', [AdminCategoryController::class, 'store']);
        Route::put('categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('categories/{category}', [AdminCategoryController::class, 'destroy']);

        // User Management
        Route::get('users', [AdminUserController::class, 'index']);
        Route::get('users/{user}', [AdminUserController::class, 'show']);
        Route::post('users/{user}/role', [AdminUserController::class, 'changeRole']);
        Route::post('users/{user}/status', [AdminUserController::class, 'toggleStatus']);

        // Order Management
        Route::get('orders', [OrderController::class, 'index']);
        Route::post('orders/{order}/confirm-payment', [OrderController::class, 'confirmPayment']);
        Route::post('orders/{order}/reject-payment', [OrderController::class, 'rejectPayment']);

        // Analytics
        Route::get('analytics', [AnalyticsController::class, 'getStats']);

        // SMS Settings & Configuration
        Route::get('sms-settings', [SmsSettingsController::class, 'getSettings']);
        Route::put('sms-settings', [SmsSettingsController::class, 'updateSettings']);
        Route::post('sms-settings/test', [SmsSettingsController::class, 'testSms']);

        // SMS Marketing
        Route::get('sms-marketing/courses', [SmsMarketingController::class, 'getCourses']);
        Route::post('sms-marketing/preview', [SmsMarketingController::class, 'getPreview']);
        Route::post('sms-marketing/send', [SmsMarketingController::class, 'sendMarketingSms']);
        Route::get('sms-marketing/history', [SmsMarketingController::class, 'getHistory']);

        // Website Settings & Appearance (Header / Footer Builder / Manual Payment)
        Route::put('website-settings', [WebsiteSettingsController::class, 'updateSettings']);
        Route::put('website-settings/header', [WebsiteSettingsController::class, 'updateHeaderSettings']);
        Route::put('website-settings/footer', [WebsiteSettingsController::class, 'updateFooterSettings']);
        Route::put('website-settings/manual-payment', [WebsiteSettingsController::class, 'updateManualPaymentSettings']);

        // VdoCipher DRM Video Settings & Uploader
        Route::get('vdocipher/settings', [VdoCipherController::class, 'getSettings']);
        Route::put('vdocipher/settings', [VdoCipherController::class, 'updateSettings']);
        Route::post('vdocipher/test-connection', [VdoCipherController::class, 'testConnection']);
        Route::post('vdocipher/upload-credentials', [VdoCipherController::class, 'getUploadCredentials']);

        // Media Library
        Route::get('media', [MediaController::class, 'index']);
        Route::post('media', [MediaController::class, 'store']);
        Route::delete('media/{media}', [MediaController::class, 'destroy']);

        // Pages Management & Visual Page Builder
        Route::get('pages', [AdminPageController::class, 'index']);
        Route::post('pages', [AdminPageController::class, 'store']);
        Route::post('pages/sync-categories', [AdminPageController::class, 'syncCategories']);
        Route::get('pages/{id}', [AdminPageController::class, 'show']);
        Route::put('pages/{id}', [AdminPageController::class, 'update']);
        Route::delete('pages/{id}', [AdminPageController::class, 'destroy']);
        Route::post('pages/{id}/toggle-status', [AdminPageController::class, 'toggleStatus']);
        Route::post('pages/{id}/duplicate', [AdminPageController::class, 'duplicate']);
    });
});

/*
|--------------------------------------------------------------------------
| Automated Deployment Webhook (CI/CD)
|--------------------------------------------------------------------------
| Triggered by GitHub Actions post-deploy to run migrations and refresh caches.
*/
Route::post('deploy/post-update', function (Request $request) {
    $secret = env('DEPLOY_SECRET');
    if (!$secret || $request->header('X-Deploy-Secret') !== $secret) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();

        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        $clearOutput = \Illuminate\Support\Facades\Artisan::output();

        \Illuminate\Support\Facades\Artisan::call('config:cache');
        \Illuminate\Support\Facades\Artisan::call('route:cache');
        \Illuminate\Support\Facades\Artisan::call('view:cache');

        return response()->json([
            'status' => 'success',
            'message' => 'Migrations executed and cache optimized successfully',
            'migrate_output' => trim($migrateOutput),
            'clear_output' => trim($clearOutput),
            'timestamp' => now()->toIso8601String(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
});
