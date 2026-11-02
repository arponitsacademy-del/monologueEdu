<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
}
