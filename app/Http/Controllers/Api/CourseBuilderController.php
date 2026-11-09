<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Exam;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CourseBuilderController extends Controller
{
    protected function authorizeCourseAccess(Course $course): void
    {
        $user = auth()->user();
        if (! $user->isAdmin() && ! $course->isAssignedTeacher($user->id)) {
            abort(403, 'এই কোর্সের কারিকুলাম পরিচালনার অনুমতি আপনার নেই।');
        }
    }

    public function getCurriculum(Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $sections = $course->sections()
            ->with(['lessons.attachments'])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'status' => $course->status,
                'price' => $course->price,
                'sale_price' => $course->sale_price,
            ],
            'sections' => $sections,
        ]);
    }

    public function storeSection(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $maxSort = $course->sections()->max('sort_order') ?? 0;

        $section = $course->sections()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'sort_order' => $maxSort + 1,
        ]);

        return response()->json([
            'message' => 'নতুন সেকশন যুক্ত করা হয়েছে।',
            'section' => $section->load('lessons'),
        ], 201);
    }

    public function updateSection(Request $request, CourseSection $section): JsonResponse
    {
        $this->authorizeCourseAccess($section->course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $section->update($validated);

        return response()->json([
            'message' => 'সেকশন আপডেট করা হয়েছে।',
            'section' => $section,
        ]);
    }

    public function deleteSection(CourseSection $section): JsonResponse
    {
        $this->authorizeCourseAccess($section->course);

        $section->delete();

        return response()->json([
            'message' => 'সেকশন এবং এর ভেতরের সকল লেসন মুছে ফেলা হয়েছে।',
        ]);
    }

    public function reorderSections(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $validated = $request->validate([
            'section_ids' => ['required', 'array'],
            'section_ids.*' => ['exists:course_sections,id'],
        ]);

        foreach ($validated['section_ids'] as $index => $id) {
            CourseSection::where('id', $id)
                ->where('course_id', $course->id)
                ->update(['sort_order' => $index + 1]);
        }

        return response()->json(['message' => 'সেকশনের ক্রম আপডেট করা হয়েছে।']);
    }

    public function storeLesson(Request $request, CourseSection $section): JsonResponse
    {
        $this->authorizeCourseAccess($section->course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:500'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'is_preview' => ['nullable', 'boolean'],
            'status' => ['required', 'in:draft,published'],
        ]);

        $maxSort = $section->lessons()->max('sort_order') ?? 0;

        $lesson = Lesson::create([
            'course_id' => $section->course_id,
            'section_id' => $section->id,
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']) . '-' . Str::random(4),
            'content' => $validated['content'] ?? null,
            'video_url' => $validated['video_url'] ?? null,
            'duration_minutes' => (int) ($validated['duration_minutes'] ?? 0),
            'is_preview' => (bool) ($validated['is_preview'] ?? false),
            'status' => $validated['status'],
            'sort_order' => $maxSort + 1,
        ]);

        return response()->json([
            'message' => 'নতুন লেসন যুক্ত হয়েছে।',
            'lesson' => $lesson->load('attachments'),
        ], 201);
    }

    public function updateLesson(Request $request, Lesson $lesson): JsonResponse
    {
        $this->authorizeCourseAccess($lesson->course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:500'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'is_preview' => ['nullable', 'boolean'],
            'status' => ['required', 'in:draft,published'],
            'section_id' => ['nullable', 'exists:course_sections,id'],
        ]);

        $lesson->update([
            'title' => $validated['title'],
            'content' => $validated['content'] ?? null,
            'video_url' => $validated['video_url'] ?? null,
            'duration_minutes' => (int) ($validated['duration_minutes'] ?? 0),
            'is_preview' => (bool) ($validated['is_preview'] ?? false),
            'status' => $validated['status'],
            'section_id' => $validated['section_id'] ?? $lesson->section_id,
        ]);

        return response()->json([
            'message' => 'লেসন সফলভাবে আপডেট করা হয়েছে।',
            'lesson' => $lesson->fresh('attachments'),
        ]);
    }

    public function deleteLesson(Lesson $lesson): JsonResponse
    {
        $this->authorizeCourseAccess($lesson->course);

        $lesson->delete();

        return response()->json([
            'message' => 'লেসন মুছে ফেলা হয়েছে।',
        ]);
    }

    public function reorderLessons(Request $request, CourseSection $section): JsonResponse
    {
        $this->authorizeCourseAccess($section->course);

        $validated = $request->validate([
            'lesson_ids' => ['required', 'array'],
            'lesson_ids.*' => ['exists:lessons,id'],
        ]);

        foreach ($validated['lesson_ids'] as $index => $id) {
            Lesson::where('id', $id)
                ->where('section_id', $section->id)
                ->update(['sort_order' => $index + 1]);
        }

        return response()->json(['message' => 'লেসনের ক্রম পরিবর্তন সফল হয়েছে।']);
    }

    public function duplicateLesson(Lesson $lesson): JsonResponse
    {
        $this->authorizeCourseAccess($lesson->course);

        $clone = $lesson->replicate();
        $clone->title = $lesson->title . ' (কপি)';
        $clone->slug = Str::slug($clone->title) . '-' . Str::random(4);
        $clone->sort_order = $lesson->sort_order + 1;
        $clone->save();

        foreach ($lesson->attachments as $attachment) {
            $attClone = $attachment->replicate();
            $attClone->lesson_id = $clone->id;
            $attClone->save();
        }

        return response()->json([
            'message' => 'লেসন ক্লোন করা হয়েছে।',
            'lesson' => $clone->load('attachments'),
        ]);
    }

    protected function ensureExamTypeColumn(): void
    {
        if (Schema::hasTable('exams') && !Schema::hasColumn('exams', 'exam_type')) {
            Schema::table('exams', function ($table) {
                $table->string('exam_type', 20)->default('practice')->after('duration_minutes');
                $table->index('exam_type');
            });
        }
    }

    public function getCourseExams(Course $course): JsonResponse
    {
        $this->ensureExamTypeColumn();
        $this->authorizeCourseAccess($course);
        $user = auth()->user();

        $attachedExams = $course->exams()
            ->with(['creator:id,name,email'])
            ->withCount(['questions', 'submissions'])
            ->get();

        // Categorize attached exams:
        // Practice exams list: native practice exams + live exams whose time has expired (auto-transitioned to practice)
        $practiceExams = $attachedExams->filter(function ($e) {
            return ($e->exam_type ?? Exam::TYPE_PRACTICE) === Exam::TYPE_PRACTICE || ($e->isLiveExam() && $e->isLiveExpired());
        })->values();

        // Live exams list: all exams created as live
        $liveExams = $attachedExams->filter(function ($e) {
            return ($e->exam_type ?? Exam::TYPE_PRACTICE) === Exam::TYPE_LIVE;
        })->values();

        $attachedIds = $attachedExams->pluck('id')->toArray();

        // Available exams query (exams not attached to this course)
        $availableQuery = Exam::whereNotIn('id', $attachedIds);

        if (!$user->isAdmin()) {
            $teacherCourseIds = Course::where('instructor_id', $user->id)
                ->orWhereHas('instructors', fn($q) => $q->where('users.id', $user->id))
                ->pluck('id');

            $availableQuery->where(function ($q) use ($user, $teacherCourseIds) {
                $q->where('created_by', $user->id)
                  ->orWhereHas('courses', fn($cq) => $cq->whereIn('courses.id', $teacherCourseIds))
                  ->orWhereIn('course_id', $teacherCourseIds);
            });
        }

        $availableExams = $availableQuery->latest()->get([
            'id', 'title', 'exam_type', 'duration_minutes', 'total_marks', 'pass_marks', 'status', 'start_time', 'end_time'
        ]);

        return response()->json([
            'attached_exams' => $attachedExams,
            'practice_exams' => $practiceExams,
            'live_exams' => $liveExams,
            'available_exams' => $availableExams,
        ]);
    }

    public function storeCourseExam(Request $request, Course $course): JsonResponse
    {
        $this->ensureExamTypeColumn();
        $this->authorizeCourseAccess($course);
        $user = auth()->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'exam_type' => ['required', 'in:practice,live'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'start_time' => ['nullable', 'date'],
            'end_time' => ['nullable', 'date'],
            'total_marks' => ['nullable', 'numeric', 'min:0'],
            'pass_marks' => ['nullable', 'numeric', 'min:0'],
            'has_negative_marking' => ['nullable', 'boolean'],
            'negative_marks' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:draft,published,archived'],
        ]);

        if ($validated['exam_type'] === Exam::TYPE_LIVE) {
            if (empty($validated['start_time']) || empty($validated['end_time'])) {
                return response()->json(['message' => 'লাইভ পরীক্ষার জন্য শুরুর সময় ও শেষের সময় দেওয়া আবশ্যক।'], 422);
            }
            if (strtotime($validated['end_time']) < strtotime($validated['start_time'])) {
                return response()->json(['message' => 'শেষের সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে।'], 422);
            }
        }

        $validated['created_by'] = $user->id;
        $validated['course_id'] = $course->id;
        $validated['status'] = $validated['status'] ?? Exam::STATUS_PUBLISHED;
        $validated['has_negative_marking'] = (bool) ($validated['has_negative_marking'] ?? false);
        $validated['negative_marks'] = $validated['has_negative_marking'] ? ($validated['negative_marks'] ?? 0) : 0;
        $validated['total_marks'] = $validated['total_marks'] ?? 0;

        $exam = Exam::create($validated);

        // Attach to course
        $nextOrder = $course->exams()->count() + 1;
        $course->exams()->syncWithoutDetaching([
            $exam->id => ['order' => $nextOrder],
        ]);

        return response()->json([
            'message' => $exam->exam_type === Exam::TYPE_LIVE 
                ? 'লাইভ পরীক্ষা সফলভাবে তৈরি করা হয়েছে।' 
                : 'প্র্যাকটিস পরীক্ষা সফলভাবে তৈরি করা হয়েছে।',
            'exam' => $exam->load(['creator:id,name,email'])->loadCount(['questions', 'submissions']),
        ], 201);
    }

    public function updateCourseExam(Request $request, Course $course, Exam $exam): JsonResponse
    {
        $this->ensureExamTypeColumn();
        $this->authorizeCourseAccess($course);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'exam_type' => ['required', 'in:practice,live'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'start_time' => ['nullable', 'date'],
            'end_time' => ['nullable', 'date'],
            'total_marks' => ['nullable', 'numeric', 'min:0'],
            'pass_marks' => ['nullable', 'numeric', 'min:0'],
            'has_negative_marking' => ['nullable', 'boolean'],
            'negative_marks' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:draft,published,archived'],
        ]);

        if ($validated['exam_type'] === Exam::TYPE_LIVE) {
            if (empty($validated['start_time']) || empty($validated['end_time'])) {
                return response()->json(['message' => 'লাইভ পরীক্ষার জন্য শুরুর সময় ও শেষের সময় দেওয়া আবশ্যক।'], 422);
            }
            if (strtotime($validated['end_time']) < strtotime($validated['start_time'])) {
                return response()->json(['message' => 'শেষের সময় অবশ্যই শুরুর সময়ের পরবর্তী হতে হবে।'], 422);
            }
        }

        $validated['has_negative_marking'] = (bool) ($validated['has_negative_marking'] ?? false);
        $validated['negative_marks'] = $validated['has_negative_marking'] ? ($validated['negative_marks'] ?? 0) : 0;

        $exam->update($validated);

        return response()->json([
            'message' => 'পরীক্ষা সফলভাবে আপডেট করা হয়েছে।',
            'exam' => $exam->load(['creator:id,name,email'])->loadCount(['questions', 'submissions']),
        ]);
    }

    public function attachExam(Request $request, Course $course): JsonResponse
    {
        $this->ensureExamTypeColumn();
        $this->authorizeCourseAccess($course);
        $user = auth()->user();

        $validated = $request->validate([
            'exam_id' => ['required', 'exists:exams,id'],
            'exam_type' => ['nullable', 'in:practice,live'],
            'start_time' => ['nullable', 'date'],
            'end_time' => ['nullable', 'date'],
        ]);

        $exam = Exam::findOrFail($validated['exam_id']);

        if (!$user->isAdmin() && $exam->created_by !== $user->id) {
            $hasAccess = $exam->courses()
                ->where(function ($q) use ($user) {
                    $q->where('instructor_id', $user->id)
                      ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $user->id));
                })
                ->exists();

            if (!$hasAccess && $exam->course_id) {
                $hasAccess = Course::where('id', $exam->course_id)
                    ->where(function ($q) use ($user) {
                        $q->where('instructor_id', $user->id)
                          ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $user->id));
                    })
                    ->exists();
            }

            if (!$hasAccess) {
                return response()->json(['message' => 'এই পরীক্ষাটি যুক্ত করার অনুমতি আপনার নেই।'], 403);
            }
        }

        if (!empty($validated['exam_type'])) {
            $exam->exam_type = $validated['exam_type'];
            if ($validated['exam_type'] === Exam::TYPE_LIVE) {
                if (!empty($validated['start_time'])) $exam->start_time = $validated['start_time'];
                if (!empty($validated['end_time'])) $exam->end_time = $validated['end_time'];
            }
            $exam->save();
        }

        $nextOrder = $course->exams()->count() + 1;
        $course->exams()->syncWithoutDetaching([
            $exam->id => ['order' => $nextOrder],
        ]);

        return response()->json([
            'message' => 'কোর্সে পরীক্ষাটি সফলভাবে যুক্ত করা হয়েছে।',
            'attached_exams' => $course->exams()
                ->with(['creator:id,name,email'])
                ->withCount(['questions', 'submissions'])
                ->get(),
        ]);
    }

    public function detachExam(Course $course, Exam $exam): JsonResponse
    {
        $this->authorizeCourseAccess($course);

        $course->exams()->detach($exam->id);

        return response()->json([
            'message' => 'কোর্স থেকে পরীক্ষাটি অপসারণ করা হয়েছে।',
        ]);
    }
}
