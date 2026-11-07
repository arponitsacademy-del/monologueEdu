<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Exam;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExamController extends Controller
{
    /**
     * Check if user is authorized to manage the exam
     */
    protected function authorizeExam(User $user, Exam $exam): void
    {
        if ($user->role === User::ROLE_ADMIN) {
            return;
        }

        if ($user->role === User::ROLE_TEACHER) {
            if ($exam->created_by === $user->id) {
                return;
            }

            if ($exam->course_id) {
                $isInstructor = Course::where('id', $exam->course_id)
                    ->where(function ($q) use ($user) {
                        $q->where('instructor_id', $user->id)
                          ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $user->id));
                    })
                    ->exists();

                if ($isInstructor) {
                    return;
                }
            }
        }

        abort(403, 'Unauthorized to manage this exam.');
    }

    /**
     * List all exams (Admin sees all; Teacher sees assigned course exams)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Exam::with(['course:id,title,slug', 'creator:id,name,email'])
            ->withCount(['questions', 'submissions']);

        // Teacher restriction
        if ($user->role === User::ROLE_TEACHER) {
            $courseIds = Course::where('instructor_id', $user->id)
                ->orWhereHas('instructors', fn($q) => $q->where('users.id', $user->id))
                ->pluck('id');

            $query->where(function ($q) use ($user, $courseIds) {
                $q->whereIn('course_id', $courseIds)
                  ->orWhere('created_by', $user->id);
            });
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('course', fn($cq) => $cq->where('title', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $exams = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($exams);
    }

    /**
     * Get eligible courses list for exam creation
     */
    public function coursesList(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Course::select('id', 'title', 'slug', 'status');

        if ($user->role === User::ROLE_TEACHER) {
            $query->where(function ($q) use ($user) {
                $q->where('instructor_id', $user->id)
                  ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $user->id));
            });
        }

        $courses = $query->orderBy('title')->get();

        return response()->json($courses);
    }

    /**
     * Store new Exam
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'course_id' => ['nullable', 'exists:courses,id'],
            'description' => ['nullable', 'string'],
            'total_marks' => ['nullable', 'numeric', 'min:0'],
            'pass_marks' => ['nullable', 'numeric', 'min:0'],
            'has_negative_marking' => ['nullable', 'boolean'],
            'negative_marks' => ['nullable', 'numeric', 'min:0'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'status' => ['nullable', 'in:draft,published,archived'],
            'start_time' => ['nullable', 'date'],
            'end_time' => ['nullable', 'date', 'after_or_equal:start_time'],
        ]);

        // Teacher check on course
        if ($user->role === User::ROLE_TEACHER && !empty($validated['course_id'])) {
            $isInstructor = Course::where('id', $validated['course_id'])
                ->where(function ($q) use ($user) {
                    $q->where('instructor_id', $user->id)
                      ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $user->id));
                })
                ->exists();

            if (!$isInstructor) {
                return response()->json(['message' => 'You are not assigned to this course.'], 403);
            }
        }

        $validated['created_by'] = $user->id;
        $validated['status'] = $validated['status'] ?? Exam::STATUS_PUBLISHED;
        $validated['has_negative_marking'] = (bool) ($validated['has_negative_marking'] ?? false);
        $validated['negative_marks'] = $validated['has_negative_marking'] ? ($validated['negative_marks'] ?? 0) : 0;
        $validated['total_marks'] = $validated['total_marks'] ?? 0;

        $exam = Exam::create($validated);
        $exam->load('course:id,title,slug');

        return response()->json([
            'message' => 'Exam created successfully!',
            'data' => $exam,
        ], 201);
    }

    /**
     * Show single Exam
     */
    public function show(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        $exam->load(['course:id,title,slug', 'creator:id,name,email'])
            ->loadCount(['questions', 'submissions']);

        return response()->json($exam);
    }

    /**
     * Update Exam
     */
    public function update(Request $request, Exam $exam): JsonResponse
    {
        $user = $request->user();
        $this->authorizeExam($user, $exam);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'course_id' => ['nullable', 'exists:courses,id'],
            'description' => ['nullable', 'string'],
            'total_marks' => ['nullable', 'numeric', 'min:0'],
            'pass_marks' => ['nullable', 'numeric', 'min:0'],
            'has_negative_marking' => ['nullable', 'boolean'],
            'negative_marks' => ['nullable', 'numeric', 'min:0'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'status' => ['nullable', 'in:draft,published,archived'],
            'start_time' => ['nullable', 'date'],
            'end_time' => ['nullable', 'date', 'after_or_equal:start_time'],
        ]);

        if ($user->role === User::ROLE_TEACHER && !empty($validated['course_id'])) {
            $isInstructor = Course::where('id', $validated['course_id'])
                ->where(function ($q) use ($user) {
                    $q->where('instructor_id', $user->id)
                      ->orWhereHas('instructors', fn($iq) => $iq->where('users.id', $user->id));
                })
                ->exists();

            if (!$isInstructor) {
                return response()->json(['message' => 'You are not assigned to this course.'], 403);
            }
        }

        $validated['has_negative_marking'] = (bool) ($validated['has_negative_marking'] ?? false);
        $validated['negative_marks'] = $validated['has_negative_marking'] ? ($validated['negative_marks'] ?? 0) : 0;

        $exam->update($validated);
        $exam->load('course:id,title,slug');

        return response()->json([
            'message' => 'Exam updated successfully!',
            'data' => $exam,
        ]);
    }

    /**
     * Delete Exam
     */
    public function destroy(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeExam($request->user(), $exam);

        $exam->delete();

        return response()->json([
            'message' => 'Exam deleted successfully.',
        ]);
    }
}
