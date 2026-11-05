<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function enrollFree(Course $course): JsonResponse
    {
        $user = auth()->user();

        if ($course->status !== Course::STATUS_PUBLISHED) {
            abort(404, 'কোর্সটি সক্রিয় নেই।');
        }

        if ($course->price > 0) {
            return response()->json([
                'message' => 'এটি একটি পেইড কোর্স। এনরোল করার জন্য চেকআউট সম্পন্ন করুন।',
            ], 422);
        }

        if ($user->isEnrolledIn($course->id)) {
            $enrollment = Enrollment::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();

            $pilot = $course->nexpilot;
            if ($enrollment && $pilot && $pilot->is_active && (float)$pilot->price <= 0 && !$enrollment->has_nexpilot) {
                $enrollment->update([
                    'has_nexpilot' => true,
                    'nexpilot_id' => $pilot->id,
                ]);
            }

            return response()->json([
                'message' => 'আপনি ইতিমধ্যে এই কোর্সে এনরোল করেছেন।',
                'enrollment' => $enrollment,
            ]);
        }

        $pilot = $course->nexpilot;
        $hasPilot = (bool) ($pilot && $pilot->is_active && (float)$pilot->price <= 0);

        $enrollment = Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'status' => Enrollment::STATUS_ACTIVE,
            'has_nexpilot' => $hasPilot,
            'nexpilot_id' => $hasPilot ? $pilot->id : null,
            'enrolled_at' => now(),
        ]);

        return response()->json([
            'message' => 'অভিনন্দন! ফ্রি কোর্সে সফলভাবে এনরোল সম্পন্ন হয়েছে।',
            'enrollment' => $enrollment,
        ], 201);
    }

    public function myCourses(Request $request): JsonResponse
    {
        $user = $request->user();

        $enrollments = $user->enrollments()
            ->with(['course' => function ($q) {
                $q->with(['instructors:id,name', 'instructor:id,name', 'nexpilot:id,course_id,title,price,is_active'])
                  ->withCount('lessons');
            }])
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->latest('enrolled_at')
            ->get();

        $coursesData = $enrollments->map(function ($enrollment) use ($user) {
            $course = $enrollment->course;
            $totalLessons = $course->lessons_count;

            $completedCount = LessonProgress::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->where('is_completed', true)
                ->count();

            $percentage = $totalLessons > 0 ? (int) round(($completedCount / $totalLessons) * 100) : 0;

            $lastAccessed = LessonProgress::where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->latest('last_accessed_at')
                ->first();

            $pilot = $course->nexpilot;
            $hasActivePilot = (bool) ($pilot && $pilot->is_active);
            $pilotPrice = $pilot ? (float) $pilot->price : 0;
            $hasPilotAccess = (bool) (
                $user->isAdmin() ||
                $user->isTeacher() ||
                ($hasActivePilot && ($pilotPrice <= 0 || $enrollment->has_nexpilot))
            );

            return [
                'course' => $course,
                'enrolled_at' => $enrollment->enrolled_at,
                'total_lessons' => $totalLessons,
                'completed_lessons' => $completedCount,
                'progress_percentage' => $percentage,
                'last_lesson_id' => $lastAccessed ? $lastAccessed->lesson_id : optional($course->lessons()->first())->id,
                'has_nexpilot' => $hasPilotAccess,
                'nexpilot_id' => $pilot ? $pilot->id : null,
                'has_active_pilot' => $hasActivePilot,
                'pilot_price' => $pilotPrice,
                'pilot_title' => $pilot ? $pilot->title : null,
            ];
        });

        return response()->json($coursesData);
    }

    public function getLesson(Course $course, Lesson $lesson): JsonResponse
    {
        $user = auth()->user();

        // Authorization check
        $canAccess = false;
        if ($user->isAdmin()) {
            $canAccess = true;
        } elseif ($user->isTeacher() && $course->isAssignedTeacher($user->id)) {
            $canAccess = true;
        } elseif ($lesson->is_preview) {
            $canAccess = true;
        } elseif ($user->isEnrolledIn($course->id)) {
            $canAccess = true;
        }

        if (! $canAccess) {
            abort(403, 'এই ক্লাসে প্রবেশ করার জন্য আপনাকে কোর্সে এনরোল হতে হবে।');
        }

        // Track last accessed
        if ($user->isEnrolledIn($course->id)) {
            LessonProgress::updateOrCreate(
                ['user_id' => $user->id, 'lesson_id' => $lesson->id],
                ['course_id' => $course->id, 'last_accessed_at' => now()]
            );
        }

        // Fetch curriculum structure for sidebar with completion markers
        $sections = $course->sections()
            ->with(['lessons' => function ($q) {
                $q->select('id', 'course_id', 'section_id', 'title', 'slug', 'duration_minutes', 'is_preview', 'sort_order')
                  ->orderBy('sort_order');
            }])
            ->orderBy('sort_order')
            ->get();

        $completedLessonIds = LessonProgress::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('is_completed', true)
            ->pluck('lesson_id')
            ->toArray();

        return response()->json([
            'lesson' => $lesson->load(['attachments', 'section']),
            'sections' => $sections,
            'completed_lesson_ids' => $completedLessonIds,
            'is_completed' => in_array($lesson->id, $completedLessonIds, true),
        ]);
    }

    public function toggleProgress(Request $request, Lesson $lesson): JsonResponse
    {
        $user = $request->user();

        $progress = LessonProgress::firstOrNew([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
        ]);

        $progress->course_id = $lesson->course_id;
        $progress->is_completed = ! $progress->is_completed;
        $progress->completed_at = $progress->is_completed ? now() : null;
        $progress->last_accessed_at = now();
        $progress->save();

        $totalLessons = Lesson::where('course_id', $lesson->course_id)->count();
        $completedLessons = LessonProgress::where('user_id', $user->id)
            ->where('course_id', $lesson->course_id)
            ->where('is_completed', true)
            ->count();

        $percentage = $totalLessons > 0 ? (int) round(($completedLessons / $totalLessons) * 100) : 0;

        return response()->json([
            'is_completed' => $progress->is_completed,
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'progress_percentage' => $percentage,
        ]);
    }
}
