<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LiveClass;
use App\Models\LiveClassComment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

class LiveClassController extends Controller
{
    public function __construct()
    {
        $this->ensureTablesExist();
    }

    /**
     * Auto-migrate helper for production
     */
    protected function ensureTablesExist(): void
    {
        if (!Schema::hasTable('live_classes') || !Schema::hasTable('live_class_comments')) {
            try {
                Artisan::call('migrate', ['--force' => true]);
            } catch (\Throwable $e) {
                // log or ignore
            }
        }
    }

    /**
     * Course access check for admin or assigned teacher
     */
    protected function authorizeCourseAccess(Course $course): void
    {
        $user = auth()->user();
        if (! $user->isAdmin() && ! $course->isAssignedTeacher($user->id)) {
            abort(403, 'এই কোর্সের লাইভ ক্লাস পরিচালনার অনুমতি আপনার নেই।');
        }
    }

    /**
     * BUILDER: List all live classes for a course
     */
    public function index(Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $liveClasses = $course->liveClasses()
            ->with(['creator:id,name,email'])
            ->withCount('comments')
            ->get();

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
            ],
            'live_classes' => $liveClasses,
        ]);
    }

    /**
     * BUILDER: Create a new live class
     */
    public function store(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'live_url' => ['required', 'string', 'max:500'],
            'start_time' => ['required', 'date'],
            'end_time' => ['nullable', 'date', 'after_or_equal:start_time'],
            'status' => ['nullable', 'string', 'in:upcoming,live,completed,cancelled'],
        ]);

        $liveClass = $course->liveClasses()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'live_url' => $validated['live_url'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'] ?? null,
            'status' => $validated['status'] ?? LiveClass::STATUS_UPCOMING,
            'created_by' => auth()->id(),
        ]);

        $liveClass->load('creator:id,name,email');
        $liveClass->comments_count = 0;

        return response()->json([
            'message' => 'লাইভ ক্লাস সফলভাবে তৈরি করা হয়েছে।',
            'live_class' => $liveClass,
        ], 201);
    }

    /**
     * BUILDER: Update an existing live class
     */
    public function update(Request $request, Course $course, LiveClass $liveClass): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        if ($liveClass->course_id !== $course->id) {
            abort(404, 'লাইভ ক্লাসটি এই কোর্সের অন্তর্ভুক্ত নয়।');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'live_url' => ['required', 'string', 'max:500'],
            'start_time' => ['required', 'date'],
            'end_time' => ['nullable', 'date', 'after_or_equal:start_time'],
            'status' => ['required', 'string', 'in:upcoming,live,completed,cancelled'],
        ]);

        $liveClass->update($validated);
        $liveClass->load('creator:id,name,email');
        $liveClass->loadCount('comments');

        return response()->json([
            'message' => 'লাইভ ক্লাস সফলভাবে আপডেট করা হয়েছে।',
            'live_class' => $liveClass,
        ]);
    }

    /**
     * BUILDER: Delete a live class
     */
    public function destroy(Course $course, LiveClass $liveClass): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        if ($liveClass->course_id !== $course->id) {
            abort(404, 'লাইভ ক্লাসটি এই কোর্সের অন্তর্ভুক্ত নয়।');
        }

        $liveClass->delete();

        return response()->json([
            'message' => 'লাইভ ক্লাসটি সফলভাবে মুছে ফেলা হয়েছে।',
        ]);
    }

    /**
     * BUILDER: Toggle status (e.g. start live or end live)
     */
    public function toggleStatus(Request $request, Course $course, LiveClass $liveClass): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        if ($liveClass->course_id !== $course->id) {
            abort(404, 'লাইভ ক্লাসটি এই কোর্সের অন্তর্ভুক্ত নয়।');
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:upcoming,live,completed,cancelled'],
        ]);

        $liveClass->update(['status' => $validated['status']]);
        $liveClass->loadCount('comments');

        return response()->json([
            'message' => 'লাইভ ক্লাসের স্ট্যাটাস আপডেট হয়েছে।',
            'live_class' => $liveClass,
        ]);
    }

    /**
     * STUDENT: List live classes for enrolled courses
     */
    public function studentLiveClasses(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get enrolled course IDs
        $enrolledCourseIds = Enrollment::where('user_id', $user->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->pluck('course_id')
            ->toArray();

        // If admin or teacher, allow seeing all published course live classes for preview
        if (empty($enrolledCourseIds) && ($user->isAdmin() || $user->isTeacher())) {
            $enrolledCourseIds = Course::where('status', Course::STATUS_PUBLISHED)->pluck('id')->toArray();
        }

        $query = LiveClass::whereIn('course_id', $enrolledCourseIds)
            ->with(['course:id,title,slug,thumbnail', 'creator:id,name,email'])
            ->withCount('comments');

        // Order: Live classes first, then upcoming by start_time asc, then completed by start_time desc
        $liveClasses = $query->orderByRaw("
            CASE 
                WHEN status = 'live' THEN 1
                WHEN status = 'upcoming' THEN 2
                WHEN status = 'completed' THEN 3
                ELSE 4
            END ASC
        ")
        ->orderBy('start_time', 'asc')
        ->get();

        // Separate running live class if any for dashboard highlight
        $activeLive = $liveClasses->first(fn($c) => $c->is_currently_live || $c->status === LiveClass::STATUS_LIVE);
        $upcomingClasses = $liveClasses->filter(fn($c) => $c->status === LiveClass::STATUS_UPCOMING && !$c->is_currently_live)->values();

        return response()->json([
            'live_classes' => $liveClasses,
            'active_live' => $activeLive,
            'upcoming_count' => $upcomingClasses->count(),
            'total_count' => $liveClasses->count(),
        ]);
    }

    /**
     * STUDENT: Live Class Room details
     */
    public function studentShow(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();
        $course = $liveClass->course;

        // Check enrollment or admin/teacher
        $isEnrolled = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->exists();

        if (!$isEnrolled && !$user->isAdmin() && !$course->isAssignedTeacher($user->id)) {
            return response()->json([
                'message' => 'এই লাইভ ক্লাসে অংশ নিতে হলে আপনাকে সংশ্লিষ্ট কোর্সে এনরোল করতে হবে।',
            ], 403);
        }

        $liveClass->load([
            'course:id,title,slug,thumbnail',
            'creator:id,name,email',
            'comments.user:id,name,email,role'
        ]);

        return response()->json([
            'live_class' => $liveClass,
            'is_enrolled' => true,
        ]);
    }

    /**
     * COMMENTS: Get all comments for a live class
     */
    public function getComments(Request $request, LiveClass $liveClass): JsonResponse
    {
        $comments = $liveClass->comments()
            ->with(['user:id,name,email,role'])
            ->latest('id')
            ->take(50)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'comments' => $comments,
        ]);
    }

    /**
     * COMMENTS: Store comment
     */
    public function storeComment(Request $request, LiveClass $liveClass): JsonResponse
    {
        $user = $request->user();
        $course = $liveClass->course;

        $isEnrolled = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->exists();

        if (!$isEnrolled && !$user->isAdmin() && !$course->isAssignedTeacher($user->id)) {
            return response()->json([
                'message' => 'মন্তব্য করার জন্য কোর্সে এনরোলমেন্ট প্রয়োজন।',
            ], 403);
        }

        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $comment = $liveClass->comments()->create([
            'user_id' => $user->id,
            'comment' => trim($validated['comment']),
        ]);

        $comment->load('user:id,name,email,role');

        return response()->json([
            'message' => 'মন্তব্য সফলভাবে প্রকাশ করা হয়েছে।',
            'comment' => $comment,
        ], 201);
    }
}
