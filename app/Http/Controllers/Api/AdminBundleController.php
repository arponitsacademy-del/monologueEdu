<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseBundle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminBundleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CourseBundle::with(['courses:id,title,price,sale_price,thumbnail', 'courses.categories:id,name']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $bundles = $query->latest()->paginate($request->integer('per_page', 50));

        return response()->json($bundles);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:course_bundles,slug'],
            'thumbnail' => ['nullable', 'string', 'max:1000'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string'],
            'regular_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:draft,published'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
        ]);

        if (empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['title']) ?: 'bundle';
            $slug = $baseSlug;
            $counter = 1;
            while (CourseBundle::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter++;
            }
            $validated['slug'] = $slug;
        }

        $bundle = CourseBundle::create([
            'title' => $validated['title'],
            'slug' => $validated['slug'],
            'thumbnail' => $validated['thumbnail'] ?? null,
            'short_description' => $validated['short_description'] ?? null,
            'description' => $validated['description'] ?? null,
            'regular_price' => $validated['regular_price'],
            'sale_price' => $validated['sale_price'],
            'status' => $validated['status'],
        ]);

        if (! empty($validated['course_ids'])) {
            $syncData = [];
            foreach ($validated['course_ids'] as $idx => $cid) {
                $syncData[$cid] = ['sort_order' => $idx + 1];
            }
            $bundle->courses()->sync($syncData);
        }

        $bundle->load(['courses:id,title,price,sale_price,thumbnail', 'courses.categories:id,name']);

        return response()->json([
            'message' => 'Course bundle created successfully.',
            'bundle' => $bundle,
        ], 201);
    }

    public function show(CourseBundle $bundle): JsonResponse
    {
        $bundle->load(['courses:id,title,price,sale_price,thumbnail', 'courses.categories:id,name']);

        return response()->json($bundle);
    }

    public function update(Request $request, CourseBundle $bundle): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:course_bundles,slug,' . $bundle->id],
            'thumbnail' => ['nullable', 'string', 'max:1000'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string'],
            'regular_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'status' => ['required', 'in:draft,published'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
        ]);

        $bundle->update([
            'title' => $validated['title'],
            'slug' => $validated['slug'] ?? $bundle->slug,
            'thumbnail' => $validated['thumbnail'] ?? null,
            'short_description' => $validated['short_description'] ?? null,
            'description' => $validated['description'] ?? null,
            'regular_price' => $validated['regular_price'],
            'sale_price' => $validated['sale_price'],
            'status' => $validated['status'],
        ]);

        if (array_key_exists('course_ids', $validated)) {
            $syncData = [];
            foreach ($validated['course_ids'] ?? [] as $idx => $cid) {
                $syncData[$cid] = ['sort_order' => $idx + 1];
            }
            $bundle->courses()->sync($syncData);
        }

        $bundle->load(['courses:id,title,price,sale_price,thumbnail', 'courses.categories:id,name']);

        return response()->json([
            'message' => 'Course bundle updated successfully.',
            'bundle' => $bundle,
        ]);
    }

    public function destroy(CourseBundle $bundle): JsonResponse
    {
        $bundle->delete();

        return response()->json([
            'message' => 'Course bundle deleted successfully.',
        ]);
    }

    /**
     * Bundle Builder: Add course to bundle in real time.
     */
    public function addCourse(Request $request, CourseBundle $bundle): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
        ]);

        $courseId = $validated['course_id'];
        if (! $bundle->courses()->where('courses.id', $courseId)->exists()) {
            $maxOrder = (int) $bundle->courses()->max('bundle_courses.sort_order');
            $bundle->courses()->attach($courseId, ['sort_order' => $maxOrder + 1]);
        }

        $bundle->load(['courses:id,title,price,sale_price,thumbnail', 'courses.categories:id,name']);

        return response()->json([
            'message' => 'Course added to bundle successfully.',
            'bundle' => $bundle,
        ]);
    }

    /**
     * Bundle Builder: Remove course from bundle in real time.
     */
    public function removeCourse(CourseBundle $bundle, Course $course): JsonResponse
    {
        $bundle->courses()->detach($course->id);
        $bundle->load(['courses:id,title,price,sale_price,thumbnail', 'courses.categories:id,name']);

        return response()->json([
            'message' => 'Course removed from bundle.',
            'bundle' => $bundle,
        ]);
    }

    /**
     * Bundle Builder: Reorder courses inside bundle.
     */
    public function reorderCourses(Request $request, CourseBundle $bundle): JsonResponse
    {
        $validated = $request->validate([
            'course_ids' => ['required', 'array'],
            'course_ids.*' => ['exists:courses,id'],
        ]);

        foreach ($validated['course_ids'] as $index => $courseId) {
            $bundle->courses()->updateExistingPivot($courseId, ['sort_order' => $index + 1]);
        }

        $bundle->load(['courses:id,title,price,sale_price,thumbnail', 'courses.categories:id,name']);

        return response()->json([
            'message' => 'Bundle courses reordered successfully.',
            'bundle' => $bundle,
        ]);
    }

    /**
     * Get courses available to be added to this bundle (excluding already included ones).
     */
    public function availableCourses(Request $request, CourseBundle $bundle): JsonResponse
    {
        $existingCourseIds = $bundle->courses()->pluck('courses.id')->toArray();

        $query = Course::query()
            ->whereNotIn('id', $existingCourseIds)
            ->with('categories:id,name');

        if ($request->filled('search')) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $courses = $query->select('id', 'title', 'price', 'sale_price', 'thumbnail', 'status')
            ->orderBy('title')
            ->limit(30)
            ->get();

        return response()->json($courses);
    }

    /**
     * Get published bundles for public homepage showcase
     */
    public function publicBundles(Request $request): JsonResponse
    {
        $bundles = CourseBundle::where('status', 'published')
            ->with(['courses:id,title,price,sale_price,thumbnail'])
            ->withCount('courses')
            ->latest()
            ->take(6)
            ->get();

        return response()->json(['bundles' => $bundles]);
    }
}

