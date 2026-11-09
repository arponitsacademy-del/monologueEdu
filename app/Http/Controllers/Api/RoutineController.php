<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
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
     * Get routine events for student (live classes and live exams)
     */
    public function studentRoutine(Request $request): JsonResponse
    {
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

        $events = [];

        // 2. Fetch Live Classes
        if (Schema::hasTable('live_classes')) {
            $liveClasses = LiveClass::whereIn('course_id', $enrolledCourseIds)
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
                    'status' => $class->status,
                ];
            }
        }

        // 3. Fetch Live Exams
        if (Schema::hasTable('exams')) {
            $liveExams = Exam::where('exam_type', Exam::TYPE_LIVE)
                ->where('status', Exam::STATUS_PUBLISHED)
                ->where(function ($q) use ($enrolledCourseIds) {
                    $q->whereIn('course_id', $enrolledCourseIds)
                      ->orWhereHas('courses', fn($cq) => $cq->whereIn('courses.id', $enrolledCourseIds));
                })
                ->whereNotNull('start_time')
                ->with(['course:id,title,slug,instructor_id', 'course.instructor:id,name', 'courses:id,title,slug'])
                ->orderBy('start_time')
                ->get();

            foreach ($liveExams as $exam) {
                $start = $exam->start_time;
                $end = $exam->end_time;
                $now = now();

                $isLive = $exam->isLiveActive();
                $isUpcoming = $exam->isLiveUpcoming();
                $isCompleted = $exam->isLiveExpired();

                $timeInfo = $this->formatBengaliTimeParts($start);
                $course = $exam->course ?? $exam->courses->first();

                $events[] = [
                    'id' => $exam->id,
                    'type' => 'live_exam',
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
                    'duration_minutes' => $exam->duration_minutes,
                    'total_marks' => $exam->total_marks,
                    'status' => $isLive ? 'live' : ($isUpcoming ? 'upcoming' : 'completed'),
                ];
            }
        }

        // 4. Sort all events by start_time ascending
        usort($events, function ($a, $b) {
            return strcmp($a['start_time'] ?? '', $b['start_time'] ?? '');
        });

        // 5. Unique dates that have events
        $datesWithEvents = array_values(array_unique(array_filter(array_column($events, 'date'))));

        return response()->json([
            'events' => $events,
            'dates_with_events' => $datesWithEvents,
            'server_today' => now()->format('Y-m-d'),
        ]);
    }

    /**
     * Get Course Builder routine items for a single course
     */
    public function getCourseRoutine(Course $course): JsonResponse
    {
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

        usort($items, function ($a, $b) {
            return strcmp($a['start_time'] ?? '', $b['start_time'] ?? '');
        });

        return response()->json([
            'routine_items' => $items,
            'total_items' => count($items),
        ]);
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
            'name' => $courseTitle ? mb_substr($courseTitle, 0, 15) : 'লাইভ ক্লাস',
            'theme' => 'emerald',
        ];
    }
}
