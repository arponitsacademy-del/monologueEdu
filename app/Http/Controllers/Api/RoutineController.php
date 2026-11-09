<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseRoutine;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\LiveClass;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class RoutineController extends Controller
{
    /**
     * Get routine events for student (Live Classes, Live Exams, Class Uploads, Materials, Book/Parcel Deliveries)
     * Automatically merges all items from all courses the student is enrolled in!
     */
    public function studentRoutine(Request $request): JsonResponse
    {
        CourseRoutine::ensureTableExists();

        $user = $request->user();

        // 1. Get enrolled courses of the student
        $enrolledCourseIds = Enrollment::where('user_id', $user->id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->pluck('course_id')
            ->toArray();

        // If admin or teacher or user has no enrolled courses yet, preview published courses
        if (empty($enrolledCourseIds)) {
            $enrolledCourseIds = Course::where('status', Course::STATUS_PUBLISHED)->pluck('id')->toArray();
        }

        // Fetch enrolled courses info for the course filter dropdown/pills
        $enrolledCourses = Course::whereIn('id', $enrolledCourseIds)
            ->select('id', 'title', 'slug', 'thumbnail')
            ->get();

        // Filter by course if specified
        $selectedCourseId = $request->input('course_id');
        $targetCourseIds = $enrolledCourseIds;
        if (!empty($selectedCourseId) && $selectedCourseId !== 'all') {
            $targetCourseIds = array_values(array_intersect($enrolledCourseIds, [(int) $selectedCourseId]));
        }

        $typeFilter = $request->input('type', 'all');

        $events = [];

        // 2. Fetch Live Classes
        if (Schema::hasTable('live_classes') && ($typeFilter === 'all' || $typeFilter === 'live_class')) {
            $liveClasses = LiveClass::whereIn('course_id', $targetCourseIds)
                ->where('status', '!=', LiveClass::STATUS_CANCELLED)
                ->whereNotNull('start_time')
                ->with(['course:id,title,slug,instructor_id', 'course.instructor:id,name'])
                ->orderBy('start_time')
                ->get();

            foreach ($liveClasses as $class) {
                $start = $class->start_time;
                $end = $class->end_time;
                $now = now();

                $isLive = $start && $end ? $now->between($start, $end) : false;
                $isUpcoming = $start ? $start->isFuture() : false;
                $isCompleted = $end ? $end->isPast() : false;

                $timeInfo = $this->formatBengaliTimeParts($start);
                $subjectInfo = $this->detectSubjectAndTheme($class->title, $class->course?->title);

                $events[] = [
                    'id' => $class->id,
                    'type' => 'live_class',
                    'type_label' => 'লাইভ ক্লাস',
                    'title' => $class->title,
                    'description' => $class->description,
                    'start_time' => $start ? $start->toISOString() : null,
                    'end_time' => $end ? $end->toISOString() : null,
                    'date' => $start ? $start->format('Y-m-d') : null,
                    'time_time' => $timeInfo['time'],
                    'time_period' => $timeInfo['period'],
                    'time_display' => $timeInfo['full'],
                    'subject' => $subjectInfo['name'],
                    'subject_theme' => $subjectInfo['theme'],
                    'course_id' => $class->course_id,
                    'course_title' => $class->course?->title ?? 'কোর্স',
                    'instructor_name' => $class->course?->instructor?->name ?? 'শিক্ষক',
                    'is_live' => $isLive,
                    'is_upcoming' => $isUpcoming,
                    'is_completed' => $isCompleted,
                    'action_url' => "/student/live-classes/{$class->id}/room",
                    'action_text' => $isLive ? 'ক্লাসে যুক্ত হন' : 'রিমাইন্ডার',
                    'status' => $class->status,
                ];
            }
        }

        // 3. Fetch Live Exams
        if (Schema::hasTable('exams') && ($typeFilter === 'all' || $typeFilter === 'live_exam')) {
            $liveExams = Exam::where('exam_type', Exam::TYPE_LIVE)
                ->where('status', Exam::STATUS_PUBLISHED)
                ->where(function ($q) use ($targetCourseIds) {
                    $q->whereIn('course_id', $targetCourseIds)
                      ->orWhereHas('courses', fn($cq) => $cq->whereIn('courses.id', $targetCourseIds));
                })
                ->whereNotNull('start_time')
                ->with(['course:id,title,slug,instructor_id', 'course.instructor:id,name', 'courses:id,title,slug'])
                ->orderBy('start_time')
                ->get();

            foreach ($liveExams as $exam) {
                $start = $exam->start_time;
                $end = $exam->end_time;

                $isLive = $exam->isLiveActive();
                $isUpcoming = $exam->isLiveUpcoming();
                $isCompleted = $exam->isLiveExpired();

                $timeInfo = $this->formatBengaliTimeParts($start);
                $course = $exam->course ?? $exam->courses->first();

                $events[] = [
                    'id' => $exam->id,
                    'type' => 'live_exam',
                    'type_label' => 'লাইভ এক্সাম',
                    'title' => $exam->title,
                    'description' => $exam->description,
                    'start_time' => $start ? $start->toISOString() : null,
                    'end_time' => $end ? $end->toISOString() : null,
                    'date' => $start ? $start->format('Y-m-d') : null,
                    'time_time' => $timeInfo['time'],
                    'time_period' => $timeInfo['period'],
                    'time_display' => $timeInfo['full'],
                    'subject' => 'লাইভ এক্সাম',
                    'subject_theme' => 'rose',
                    'course_id' => $course?->id,
                    'course_title' => $course?->title ?? 'লাইভ এক্সাম',
                    'instructor_name' => $course?->instructor?->name ?? 'পরীক্ষক',
                    'is_live' => $isLive,
                    'is_upcoming' => $isUpcoming,
                    'is_completed' => $isCompleted,
                    'action_url' => "/exams/{$exam->id}/take",
                    'action_text' => $isLive ? 'পরীক্ষায় অংশ নিন' : ($isCompleted ? 'ফলাফল দেখুন' : 'সিডিউল'),
                    'duration_minutes' => $exam->duration_minutes,
                    'total_marks' => $exam->total_marks,
                    'status' => $isLive ? 'live' : ($isUpcoming ? 'upcoming' : 'completed'),
                ];
            }
        }

        // 4. Fetch Custom Course Routines (Class Upload, Study Materials, Book/Parcel Delivery, General Notices)
        if (Schema::hasTable('course_routines')) {
            $query = CourseRoutine::whereIn('course_id', $targetCourseIds)
                ->whereNotNull('start_time')
                ->with(['course:id,title,slug,instructor_id', 'course.instructor:id,name']);

            if ($typeFilter !== 'all' && in_array($typeFilter, ['class_upload', 'material', 'book_parcel', 'general'])) {
                $query->where('type', $typeFilter);
            }

            $routines = $query->orderBy('start_time')->get();

            foreach ($routines as $cr) {
                $start = $cr->start_time;
                $end = $cr->end_time;

                $timeInfo = $this->formatBengaliTimeParts($start);
                
                // Determine styling and labels based on type
                $typeConfig = $this->getTypeConfig($cr->type, $cr->subject, $cr->title, $cr->course?->title);

                $events[] = [
                    'id' => $cr->id,
                    'type' => $cr->type,
                    'type_label' => $typeConfig['label'],
                    'title' => $cr->title,
                    'description' => $cr->description,
                    'start_time' => $start ? $start->toISOString() : null,
                    'end_time' => $end ? $end->toISOString() : null,
                    'date' => $start ? $start->format('Y-m-d') : null,
                    'time_time' => $timeInfo['time'],
                    'time_period' => $timeInfo['period'],
                    'time_display' => $timeInfo['full'],
                    'subject' => $cr->subject ?: $typeConfig['default_subject'],
                    'subject_theme' => $typeConfig['theme'],
                    'course_id' => $cr->course_id,
                    'course_title' => $cr->course?->title ?? 'কোর্স',
                    'instructor_name' => $cr->course?->instructor?->name ?? 'শিক্ষক',
                    'is_live' => false,
                    'is_upcoming' => $start ? $start->isFuture() : false,
                    'is_completed' => $start ? $start->isPast() : false,
                    'action_url' => $cr->link_url ?: "/student/courses/{$cr->course_id}",
                    'action_text' => $cr->action_text ?: $typeConfig['default_action'],
                    'meta' => $cr->meta,
                    'status' => $cr->status,
                ];
            }
        }

        // 5. Sort all events chronologically by start_time ascending
        usort($events, function ($a, $b) {
            return strcmp($a['start_time'] ?? '', $b['start_time'] ?? '');
        });

        // 6. Unique dates that have events
        $datesWithEvents = array_values(array_unique(array_filter(array_column($events, 'date'))));

        return response()->json([
            'events' => $events,
            'dates_with_events' => $datesWithEvents,
            'enrolled_courses' => $enrolledCourses,
            'selected_course_id' => $selectedCourseId ?: 'all',
            'server_today' => now()->format('Y-m-d'),
        ]);
    }

    /**
     * Get Course Builder routine items for a single course
     */
    public function getCourseRoutine(Course $course): JsonResponse
    {
        CourseRoutine::ensureTableExists();

        $user = auth()->user();
        if (!$user->isAdmin() && !$course->isAssignedTeacher($user->id)) {
            abort(403, 'অনুমতি নেই।');
        }

        $items = [];

        // 1. Live Classes of this course
        if (Schema::hasTable('live_classes')) {
            $liveClasses = LiveClass::where('course_id', $course->id)
                ->orderBy('start_time')
                ->get();

            foreach ($liveClasses as $lc) {
                $start = $lc->start_time;
                $end = $lc->end_time;
                $timeInfo = $this->formatBengaliTimeParts($start);

                $items[] = [
                    'id' => $lc->id,
                    'type' => 'live_class',
                    'type_label' => 'লাইভ ক্লাস',
                    'title' => $lc->title,
                    'description' => $lc->description,
                    'live_url' => $lc->live_url,
                    'start_time' => $start ? $start->toISOString() : null,
                    'end_time' => $end ? $end->toISOString() : null,
                    'date' => $start ? $start->format('Y-m-d') : null,
                    'time_display' => $timeInfo['full'],
                    'status' => $lc->status,
                    'is_live' => $lc->isCurrentlyLive(),
                    'is_upcoming' => $start ? $start->isFuture() : false,
                    'is_completed' => $end ? $end->isPast() : false,
                ];
            }
        }

        // 2. Live Exams of this course
        if (Schema::hasTable('exams')) {
            $liveExams = $course->exams()
                ->where('exam_type', Exam::TYPE_LIVE)
                ->withCount(['questions', 'submissions'])
                ->get();

            foreach ($liveExams as $exam) {
                $start = $exam->start_time;
                $end = $exam->end_time;
                $timeInfo = $this->formatBengaliTimeParts($start);

                $items[] = [
                    'id' => $exam->id,
                    'type' => 'live_exam',
                    'type_label' => 'লাইভ এক্সাম',
                    'title' => $exam->title,
                    'description' => $exam->description,
                    'duration_minutes' => $exam->duration_minutes,
                    'total_marks' => $exam->total_marks,
                    'start_time' => $start ? $start->toISOString() : null,
                    'end_time' => $end ? $end->toISOString() : null,
                    'date' => $start ? $start->format('Y-m-d') : null,
                    'time_display' => $timeInfo['full'],
                    'status' => $exam->status,
                    'is_live' => $exam->isLiveActive(),
                    'is_upcoming' => $exam->isLiveUpcoming(),
                    'is_completed' => $exam->isLiveExpired(),
                    'questions_count' => $exam->questions_count ?? 0,
                    'submissions_count' => $exam->submissions_count ?? 0,
                ];
            }
        }

        // 3. Custom Routines of this course (Class Upload, Materials, Book/Parcel, General)
        if (Schema::hasTable('course_routines')) {
            $customRoutines = CourseRoutine::where('course_id', $course->id)
                ->orderBy('start_time')
                ->get();

            foreach ($customRoutines as $cr) {
                $start = $cr->start_time;
                $end = $cr->end_time;
                $timeInfo = $this->formatBengaliTimeParts($start);
                $typeConfig = $this->getTypeConfig($cr->type, $cr->subject, $cr->title, $course->title);

                $items[] = [
                    'id' => $cr->id,
                    'is_custom_routine' => true,
                    'type' => $cr->type,
                    'type_label' => $typeConfig['label'],
                    'title' => $cr->title,
                    'description' => $cr->description,
                    'subject' => $cr->subject ?: $typeConfig['default_subject'],
                    'start_time' => $start ? $start->toISOString() : null,
                    'end_time' => $end ? $end->toISOString() : null,
                    'date' => $start ? $start->format('Y-m-d') : null,
                    'time_display' => $timeInfo['full'],
                    'link_url' => $cr->link_url,
                    'action_text' => $cr->action_text ?: $typeConfig['default_action'],
                    'status' => $cr->status,
                    'meta' => $cr->meta,
                    'is_upcoming' => $start ? $start->isFuture() : false,
                    'is_completed' => $start ? $start->isPast() : false,
                ];
            }
        }

        usort($items, function ($a, $b) {
            return strcmp($a['start_time'] ?? '', $b['start_time'] ?? '');
        });

        return response()->json([
            'routine_items' => $items,
            'total_items' => count($items),
        ]);
    }

    /**
     * Store custom routine item for course (Class Upload, Material, Book/Parcel Delivery, General)
     */
    public function storeRoutineItem(Request $request, Course $course): JsonResponse
    {
        CourseRoutine::ensureTableExists();

        $user = auth()->user();
        if (!$user->isAdmin() && !$course->isAssignedTeacher($user->id)) {
            abort(403, 'অনুমতি নেই।');
        }

        $validated = $request->validate([
            'type' => 'required|string|in:class_upload,material,book_parcel,general',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject' => 'nullable|string|max:100',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date',
            'link_url' => 'nullable|string|max:500',
            'action_text' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:30',
            'meta' => 'nullable|array',
        ]);

        $validated['course_id'] = $course->id;
        $validated['created_by'] = $user->id;
        if (empty($validated['status'])) {
            $validated['status'] = 'upcoming';
        }

        $routine = CourseRoutine::create($validated);

        return response()->json([
            'message' => 'রুটিন সূচী সফলভাবে তৈরি করা হয়েছে।',
            'item' => $routine,
        ], 201);
    }

    /**
     * Update custom routine item
     */
    public function updateRoutineItem(Request $request, Course $course, CourseRoutine $routine): JsonResponse
    {
        CourseRoutine::ensureTableExists();

        $user = auth()->user();
        if (!$user->isAdmin() && !$course->isAssignedTeacher($user->id)) {
            abort(403, 'অনুমতি নেই।');
        }

        if ($routine->course_id !== $course->id) {
            abort(404, 'রুটিন সূচীটি এই কোর্সের সাথে সম্পর্কিত নয়।');
        }

        $validated = $request->validate([
            'type' => 'required|string|in:class_upload,material,book_parcel,general',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject' => 'nullable|string|max:100',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date',
            'link_url' => 'nullable|string|max:500',
            'action_text' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:30',
            'meta' => 'nullable|array',
        ]);

        $routine->update($validated);

        return response()->json([
            'message' => 'রুটিন সূচী সফলভাবে আপডেট করা হয়েছে।',
            'item' => $routine,
        ]);
    }

    /**
     * Delete custom routine item
     */
    public function deleteRoutineItem(Course $course, CourseRoutine $routine): JsonResponse
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$course->isAssignedTeacher($user->id)) {
            abort(403, 'অনুমতি নেই।');
        }

        if ($routine->course_id !== $course->id) {
            abort(404, 'রুটিন সূচীটি এই কোর্সের সাথে সম্পর্কিত নয়।');
        }

        $routine->delete();

        return response()->json([
            'message' => 'রুটিন সূচী সফলভাবে মুছে ফেলা হয়েছে।',
        ]);
    }

    /**
     * Get label, theme, and default values based on routine type
     */
    protected function getTypeConfig(string $type, ?string $subject, string $title, ?string $courseTitle): array
    {
        switch ($type) {
            case CourseRoutine::TYPE_CLASS_UPLOAD:
                return [
                    'label' => 'ক্লাস আপলোড',
                    'theme' => 'blue',
                    'default_subject' => 'রেকর্ডেড ক্লাস',
                    'default_action' => 'ক্লাস দেখুন',
                ];
            case CourseRoutine::TYPE_MATERIAL:
                return [
                    'label' => 'স্টাডি ম্যাটেরিয়াল',
                    'theme' => 'teal',
                    'default_subject' => 'নোট ও শিট',
                    'default_action' => 'ডাউনলোড করুন',
                ];
            case CourseRoutine::TYPE_BOOK_PARCEL:
                return [
                    'label' => 'বই / পার্সেল ডেলিভারি',
                    'theme' => 'amber',
                    'default_subject' => 'বই ও কুরিয়ার',
                    'default_action' => 'ট্র্যাকিং দেখুন',
                ];
            case CourseRoutine::TYPE_GENERAL:
            default:
                $detected = $this->detectSubjectAndTheme($title, $courseTitle);
                return [
                    'label' => 'সাধারণ সূচী',
                    'theme' => $detected['theme'] ?? 'emerald',
                    'default_subject' => $detected['name'] ?? 'নোটিশ',
                    'default_action' => 'বিস্তারিত',
                ];
        }
    }

    /**
     * Format time into Bengali time and period (e.g. 4:00, বিকাল)
     */
    protected function formatBengaliTimeParts(?Carbon $date): array
    {
        if (!$date) {
            return ['time' => '', 'period' => '', 'full' => ''];
        }

        $hour = (int) $date->format('g');
        $minute = $date->format('i');
        $hour24 = (int) $date->format('G');

        $bengaliDigits = ['0' => '০', '1' => '১', '2' => '২', '3' => '৩', '4' => '৪', '5' => '৫', '6' => '৬', '7' => '৭', '8' => '৮', '9' => '৯'];
        $bengaliTime = strtr("{$hour}:{$minute}", $bengaliDigits);

        if ($hour24 >= 4 && $hour24 < 6) {
            $period = 'ভোর';
        } elseif ($hour24 >= 6 && $hour24 < 12) {
            $period = 'সকাল';
        } elseif ($hour24 >= 12 && $hour24 < 15) {
            $period = 'দুপুর';
        } elseif ($hour24 >= 15 && $hour24 < 18) {
            $period = 'বিকাল';
        } elseif ($hour24 >= 18 && $hour24 < 20) {
            $period = 'সন্ধ্যা';
        } else {
            $period = 'রাত';
        }

        return [
            'time' => $bengaliTime,
            'period' => $period,
            'full' => "{$period} {$bengaliTime}",
        ];
    }

    /**
     * Detect subject name and accent theme color
     */
    protected function detectSubjectAndTheme(string $title, ?string $courseTitle): array
    {
        $combined = mb_strtolower("{$title} {$courseTitle}");

        if (str_contains($combined, 'bangla') || str_contains($combined, 'বাংলা') || str_contains($combined, 'ব্যাকরণ')) {
            return ['name' => 'বাংলা', 'theme' => 'amber'];
        }
        if (str_contains($combined, 'english') || str_contains($combined, 'ইংরেজি') || str_contains($combined, 'grammar')) {
            return ['name' => 'ইংরেজি', 'theme' => 'blue'];
        }
        if (str_contains($combined, 'physics') || str_contains($combined, 'পদার্থ')) {
            return ['name' => 'পদার্থবিজ্ঞান', 'theme' => 'violet'];
        }
        if (str_contains($combined, 'chem') || str_contains($combined, 'রসায়ন') || str_contains($combined, 'রসায়ন')) {
            return ['name' => 'রসায়ন', 'theme' => 'emerald'];
        }
        if (str_contains($combined, 'math') || str_contains($combined, 'গণিত')) {
            return ['name' => 'উচ্চতর গণিত', 'theme' => 'teal'];
        }
        if (str_contains($combined, 'bio') || str_contains($combined, 'জীববিজ্ঞান')) {
            return ['name' => 'জীববিজ্ঞান', 'theme' => 'green'];
        }
        if (str_contains($combined, 'ict') || str_contains($combined, 'তথ্য')) {
            return ['name' => 'আইসিটি', 'theme' => 'indigo'];
        }

        return [
            'name' => $courseTitle ? mb_substr($courseTitle, 0, 15) : 'সাধারণ',
            'theme' => 'emerald',
        ];
    }
}
