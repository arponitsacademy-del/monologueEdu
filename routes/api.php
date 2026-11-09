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
use App\Http\Controllers\Api\WebsiteSettingsController;
use App\Http\Controllers\Api\NexPilotAdminController;
use App\Http\Controllers\Api\NexPilotStudentController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\ExamBuilderController;
use App\Http\Controllers\Api\ExamSubmissionController;
use App\Http\Controllers\Api\AffiliateAdminController;
use App\Http\Controllers\Api\AffiliateStudentController;
use App\Http\Controllers\Api\TeacherPublicController;
use App\Http\Controllers\Api\AutoSmsPushController;
use App\Http\Controllers\Api\AdminBundleController;
use App\Http\Controllers\Api\AiExamQuestionController;
use App\Http\Controllers\Api\AdminCouponController;
use App\Http\Controllers\Api\CouponValidationController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\RoutineController;
use App\Http\Controllers\Api\LiveClassController;
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
Route::post('auth/forgot-password/send-otp', [AuthController::class, 'forgotPasswordSendOtp']);
Route::post('auth/forgot-password/verify-otp', [AuthController::class, 'forgotPasswordVerifyOtp']);
Route::post('auth/forgot-password/reset', [AuthController::class, 'forgotPasswordReset']);

Route::get('courses', [PublicCourseController::class, 'index']);
Route::get('courses/{slug}', [PublicCourseController::class, 'show']);
Route::get('categories', [PublicCourseController::class, 'categories']);
Route::get('bundles/featured', [AdminBundleController::class, 'publicBundles']);
Route::get('settings', [WebsiteSettingsController::class, 'getSettings']);
Route::get('pages/{slug}', [PublicPageController::class, 'show']);
Route::get('affiliate/check-code/{code}', [AffiliateStudentController::class, 'checkCode']);
Route::get('teachers/featured', [TeacherPublicController::class, 'getFeaturedTeachers']);
Route::get('teachers/{id}', [TeacherPublicController::class, 'getTeacherProfile']);
Route::get('instructors/{id}', [TeacherPublicController::class, 'getTeacherProfile']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Authenticated via Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth profile & devices
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::put('user/profile', [AuthController::class, 'updateProfile']);
    Route::put('user/change-password', [AuthController::class, 'changePassword']);
    Route::get('user/devices', [AuthController::class, 'getDevices']);
    Route::delete('user/devices/{id}', [AuthController::class, 'revokeDevice']);
    Route::post('user/devices/logout-others', [AuthController::class, 'logoutOtherDevices']);

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
    Route::post('coupons/validate', [CouponValidationController::class, 'validateCoupon']);

    // NexPilot Student Learning Room & Chatbot
    Route::prefix('student/nexpilot')->group(function () {
        Route::get('courses/{courseId}', [NexPilotStudentController::class, 'getPilotForCourse']);
        Route::get('topics/{topicId}/history', [NexPilotStudentController::class, 'getTopicChatHistory']);
        Route::post('topics/{topicId}/chat', [NexPilotStudentController::class, 'sendMessage']);
        Route::post('courses/{courseId}/unlock', [NexPilotStudentController::class, 'unlockPilotForEnrolledCourse']);
    });

    // Student Exam Taking & Review Routes
    Route::get('student/leaderboard', [ExamSubmissionController::class, 'studentLeaderboard']);
    Route::prefix('student/exams')->group(function () {
        Route::get('available', [ExamSubmissionController::class, 'studentAvailableExams']);
        Route::get('my-exams', [ExamSubmissionController::class, 'studentMyExams']);
        Route::get('leaderboard', [ExamSubmissionController::class, 'studentLeaderboard']);
        Route::get('submissions/{submission}', [ExamSubmissionController::class, 'studentSubmissionReview']);
        Route::get('{exam}/start', [ExamSubmissionController::class, 'studentStartExam']);
        Route::post('{exam}/submit', [ExamSubmissionController::class, 'studentSubmitExam']);
        Route::post('upload-attachment', [ExamSubmissionController::class, 'uploadAnswerAttachment']);
    });

    // Student Live Classes & Real-Time Q&A
    Route::prefix('student/live-classes')->group(function () {
        Route::get('/', [LiveClassController::class, 'studentLiveClasses']);
        Route::get('{liveClass}', [LiveClassController::class, 'studentShow']);
        Route::get('{liveClass}/comments', [LiveClassController::class, 'getComments']);
        Route::post('{liveClass}/comments', [LiveClassController::class, 'storeComment']);
    });

    // Student Unified Routine (Live Classes & Live Exams)
    Route::get('student/routine', [RoutineController::class, 'studentRoutine']);

    // Student Affiliate Program
    Route::prefix('student/affiliate')->group(function () {
        Route::get('status', [AffiliateStudentController::class, 'getStatus']);
        Route::post('apply', [AffiliateStudentController::class, 'apply']);
        Route::post('payout-account', [AffiliateStudentController::class, 'updatePayoutAccount']);
        Route::post('request-payout', [AffiliateStudentController::class, 'requestPayout']);
    });

    // Exam Management (Admin & Teacher)
    Route::prefix('exams')->middleware('role:teacher,admin')->group(function () {
        Route::get('/', [ExamController::class, 'index']);
        Route::get('/courses-list', [ExamController::class, 'coursesList']);
        Route::post('/', [ExamController::class, 'store']);
        Route::get('/{exam}', [ExamController::class, 'show']);
        Route::put('/{exam}', [ExamController::class, 'update']);
        Route::delete('/{exam}', [ExamController::class, 'destroy']);

        // Exam Builder
        Route::get('/{exam}/questions', [ExamBuilderController::class, 'getQuestions']);
        Route::post('/{exam}/questions', [ExamBuilderController::class, 'storeQuestion']);
        Route::put('/{exam}/questions/{question}', [ExamBuilderController::class, 'updateQuestion']);
        Route::delete('/{exam}/questions/{question}', [ExamBuilderController::class, 'deleteQuestion']);
        Route::post('/{exam}/questions/reorder', [ExamBuilderController::class, 'reorderQuestions']);
        Route::post('/questions/upload-attachment', [ExamBuilderController::class, 'uploadAttachment']);

        // AI Question Generation & Import
        Route::post('/{exam}/ai/generate-questions', [AiExamQuestionController::class, 'generateQuestions']);
        Route::post('/{exam}/ai/import-questions', [AiExamQuestionController::class, 'importQuestions']);

        // Submissions & Evaluation
        Route::get('/{exam}/submissions', [ExamSubmissionController::class, 'getSubmissions']);
        Route::get('/{exam}/submissions/{submission}', [ExamSubmissionController::class, 'getSubmissionDetails']);
        Route::post('/{exam}/submissions/{submission}/evaluate', [ExamSubmissionController::class, 'evaluateSubmission']);
    });

    // Announcements & Student Notifications (Admin & Teacher)
    Route::prefix('announcements')->middleware('role:teacher,admin')->group(function () {
        Route::get('options', [AnnouncementController::class, 'options']);
        Route::post('notify-students', [AnnouncementController::class, 'notifyStudents']);
        Route::get('history', [AnnouncementController::class, 'history']);
    });

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

        // Course Attached Exams
        Route::get('{course}/exams', [CourseBuilderController::class, 'getCourseExams']);
        Route::post('{course}/exams', [CourseBuilderController::class, 'attachExam']);
        Route::post('{course}/exams/create', [CourseBuilderController::class, 'storeCourseExam']);
        Route::put('{course}/exams/{exam}', [CourseBuilderController::class, 'updateCourseExam']);
        Route::delete('{course}/exams/{exam}', [CourseBuilderController::class, 'detachExam']);

        // Course Live Classes
        Route::get('{course}/live-classes', [LiveClassController::class, 'index']);
        Route::post('{course}/live-classes', [LiveClassController::class, 'store']);
        Route::put('{course}/live-classes/{liveClass}', [LiveClassController::class, 'update']);
        Route::delete('{course}/live-classes/{liveClass}', [LiveClassController::class, 'destroy']);
        Route::patch('{course}/live-classes/{liveClass}/status', [LiveClassController::class, 'toggleStatus']);

        // Course Unified Routine
        Route::get('{course}/routine', [RoutineController::class, 'getCourseRoutine']);
        Route::post('{course}/routine/items', [RoutineController::class, 'storeRoutineItem']);
        Route::put('{course}/routine/items/{routine}', [RoutineController::class, 'updateRoutineItem']);
        Route::delete('{course}/routine/items/{routine}', [RoutineController::class, 'deleteRoutineItem']);
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
        Route::post('users', [AdminUserController::class, 'store']);
        Route::get('users/{user}', [AdminUserController::class, 'show']);
        Route::post('users/{user}/role', [AdminUserController::class, 'changeRole']);
        Route::post('users/{user}/status', [AdminUserController::class, 'toggleStatus']);
        Route::put('users/{user}/teacher-profile', [AdminUserController::class, 'updateTeacherProfile']);
        Route::delete('users/{user}', [AdminUserController::class, 'destroy']);

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

        // Auto SMS Push on Course Purchase
        Route::get('sms/auto-push', [AutoSmsPushController::class, 'getSettings']);
        Route::put('sms/auto-push/settings', [AutoSmsPushController::class, 'updateGeneralSettings']);
        Route::post('sms/auto-push/courses', [AutoSmsPushController::class, 'saveCourseTemplate']);
        Route::delete('sms/auto-push/courses/{template}', [AutoSmsPushController::class, 'deleteCourseTemplate']);
        Route::post('sms/auto-push/test', [AutoSmsPushController::class, 'sendTestSms']);

        // Course Bundles & Bundle Builder
        Route::get('bundles', [AdminBundleController::class, 'index']);
        Route::post('bundles', [AdminBundleController::class, 'store']);
        Route::get('bundles/{bundle}', [AdminBundleController::class, 'show']);
        Route::put('bundles/{bundle}', [AdminBundleController::class, 'update']);
        Route::delete('bundles/{bundle}', [AdminBundleController::class, 'destroy']);
        Route::post('bundles/{bundle}/courses', [AdminBundleController::class, 'addCourse']);
        Route::delete('bundles/{bundle}/courses/{course}', [AdminBundleController::class, 'removeCourse']);
        Route::post('bundles/{bundle}/courses/reorder', [AdminBundleController::class, 'reorderCourses']);
        Route::get('bundles/{bundle}/available-courses', [AdminBundleController::class, 'availableCourses']);

        // SMS Marketing
        Route::get('sms-marketing/courses', [SmsMarketingController::class, 'getCourses']);
        Route::post('sms-marketing/preview', [SmsMarketingController::class, 'getPreview']);
        Route::post('sms-marketing/send', [SmsMarketingController::class, 'sendMarketingSms']);
        Route::get('sms-marketing/history', [SmsMarketingController::class, 'getHistory']);

        // Marketing: Coupons Management
        Route::get('coupons', [AdminCouponController::class, 'index']);
        Route::post('coupons', [AdminCouponController::class, 'store']);
        Route::get('coupons/search-users', [AdminCouponController::class, 'searchUsers']);
        Route::get('coupons/courses-and-categories', [AdminCouponController::class, 'getCoursesAndCategories']);
        Route::get('coupons/{id}', [AdminCouponController::class, 'show']);
        Route::put('coupons/{id}', [AdminCouponController::class, 'update']);
        Route::delete('coupons/{id}', [AdminCouponController::class, 'destroy']);
        Route::post('coupons/{id}/toggle-status', [AdminCouponController::class, 'toggleStatus']);

        // Website Settings & Appearance (Header / Footer Builder / Manual Payment)
        Route::put('website-settings', [WebsiteSettingsController::class, 'updateSettings']);
        Route::put('website-settings/header', [WebsiteSettingsController::class, 'updateHeaderSettings']);
        Route::put('website-settings/footer', [WebsiteSettingsController::class, 'updateFooterSettings']);
        Route::put('website-settings/manual-payment', [WebsiteSettingsController::class, 'updateManualPaymentSettings']);

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

        // AI Configuration (OpenAI Model Settings)
        Route::prefix('ai')->group(function () {
            Route::get('settings', [NexPilotAdminController::class, 'getSettings']);
            Route::match(['post', 'put'], 'settings', [NexPilotAdminController::class, 'updateSettings']);
            Route::post('test-connection', [NexPilotAdminController::class, 'testConnection']);
        });

        // NexPilot AI Management
        Route::prefix('nexpilot')->group(function () {
            Route::get('/', [NexPilotAdminController::class, 'index']);
            Route::get('courses', [NexPilotAdminController::class, 'getEligibleCourses']);
            Route::post('/', [NexPilotAdminController::class, 'store']);
            Route::get('settings', [NexPilotAdminController::class, 'getSettings']);
            Route::match(['post', 'put'], 'settings', [NexPilotAdminController::class, 'updateSettings']);
            Route::post('test-connection', [NexPilotAdminController::class, 'testConnection']);
            Route::post('upload-material', [NexPilotAdminController::class, 'uploadAttachment']);
            Route::get('{id}', [NexPilotAdminController::class, 'show']);
            Route::put('{id}', [NexPilotAdminController::class, 'update']);
            Route::delete('{id}', [NexPilotAdminController::class, 'destroy']);
            Route::get('{id}/builder', [NexPilotAdminController::class, 'getBuilderData']);
            Route::post('{id}/topics', [NexPilotAdminController::class, 'storeTopic']);
            Route::put('topics/{topicId}', [NexPilotAdminController::class, 'updateTopic']);
            Route::delete('topics/{topicId}', [NexPilotAdminController::class, 'destroyTopic']);
            Route::post('{id}/reorder-topics', [NexPilotAdminController::class, 'reorderTopics']);
            Route::get('{id}/students', [NexPilotAdminController::class, 'getEnrolledStudents']);
            Route::post('{id}/students/{enrollmentId}/toggle', [NexPilotAdminController::class, 'toggleStudentAccess']);
            Route::post('{id}/grant-all', [NexPilotAdminController::class, 'grantToAllStudents']);
        });

        // Affiliate Management
        Route::prefix('affiliate')->group(function () {
            Route::get('settings', [AffiliateAdminController::class, 'getGeneralSettings']);
            Route::put('settings', [AffiliateAdminController::class, 'updateGeneralSettings']);
            Route::get('courses', [AffiliateAdminController::class, 'getCourseSettings']);
            Route::put('courses/{course}', [AffiliateAdminController::class, 'updateCourseSetting']);
            Route::delete('courses/{course}', [AffiliateAdminController::class, 'deleteCourseSetting']);
            Route::get('affiliates', [AffiliateAdminController::class, 'getAffiliates']);
            Route::get('commissions', [AffiliateAdminController::class, 'getCommissions']);
            Route::get('payouts', [AffiliateAdminController::class, 'getPayouts']);
            Route::put('payouts/{payout}', [AffiliateAdminController::class, 'updatePayoutStatus']);
        });
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
