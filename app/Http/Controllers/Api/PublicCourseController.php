<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Course::query()
            ->with(['instructors.teacherProfile', 'instructor.teacherProfile', 'categories:id,name,slug'])
            ->withCount(['lessons', 'enrollments'])
            ->published();

        // Type filter: free, paid, or all
        if ($request->filled('type')) {
            if ($request->type === 'free') {
                $query->free();
            } elseif ($request->type === 'paid') {
                $query->paid();
            }
        }

        // Category filter
        if ($request->filled('category')) {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        // Featured filter
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Search query
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        $courses = $query->latest()->paginate($request->integer('per_page', 12));

        return response()->json($courses);
    }

    public function show(string $slug): JsonResponse
    {
        $course = Course::where('slug', $slug)
            ->with([
                'instructors.teacherProfile',
                'instructor.teacherProfile',
                'categories:id,name,slug',
                'nexpilot' => function ($q) {
                    $q->select('id', 'course_id', 'title', 'price', 'short_description', 'is_active')
                      ->where('is_active', true);
                },
                'sections.lessons' => function ($q) {
                    $q->select('id', 'course_id', 'section_id', 'title', 'slug', 'duration_minutes', 'is_preview', 'sort_order')
                      ->orderBy('sort_order');
                },
            ])
            ->withCount(['lessons', 'enrollments'])
            ->published()
            ->firstOrFail();

        return response()->json([
            'course' => $course,
            'is_enrolled' => auth('sanctum')->check() && auth('sanctum')->user()->isEnrolledIn($course->id),
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::withCount(['courses' => function ($q) {
            $q->published();
        }])->get();

        return response()->json($categories);
    }
}
