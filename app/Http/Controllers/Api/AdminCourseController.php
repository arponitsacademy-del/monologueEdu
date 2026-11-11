<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Course::query()
            ->with(['instructors:id,name,email', 'categories:id,name'])
            ->withCount(['lessons', 'enrollments']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        $courses = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json($courses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:courses,slug'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lte:price'],
            'thumbnail' => ['nullable', 'string'],
            'is_featured' => ['nullable', 'boolean'],
            'enable_manual_payment' => ['nullable', 'boolean'],
            'enable_shurjopay' => ['nullable', 'boolean'],
            'status' => ['required', 'in:draft,published,archived'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'instructor_ids' => ['nullable', 'array'],
            'instructor_ids.*' => ['exists:users,id'],
        ], [
            'sale_price.lte' => 'অফার মূল্য অবশ্যই রেগুলার মূল্যের সমান বা কম হতে হবে।',
        ]);

        $slug = ! empty($validated['slug']) ? Str::slug($validated['slug']) : Str::slug($validated['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (Course::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        $course = Course::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'short_description' => $validated['short_description'] ?? null,
            'description' => $validated['description'] ?? null,
            'price' => (float) $validated['price'],
            'sale_price' => isset($validated['sale_price']) && $validated['sale_price'] !== '' ? (float) $validated['sale_price'] : null,
            'thumbnail' => $validated['thumbnail'] ?? null,
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'enable_manual_payment' => array_key_exists('enable_manual_payment', $validated) ? (bool) $validated['enable_manual_payment'] : true,
            'enable_shurjopay' => array_key_exists('enable_shurjopay', $validated) ? (bool) $validated['enable_shurjopay'] : true,
            'status' => $validated['status'],
        ]);

        if (! empty($validated['category_ids'])) {
            $course->categories()->sync($validated['category_ids']);
        }

        if (! empty($validated['instructor_ids'])) {
            $course->instructors()->sync($validated['instructor_ids']);
            $course->update(['instructor_id' => $validated['instructor_ids'][0]]);
        }

        AuditLog::log('course_created', 'Course', $course->id, null, $course->toArray());

        return response()->json([
            'message' => 'কোর্স সফলভাবে তৈরি হয়েছে।',
            'course' => $course->load(['instructors', 'categories']),
        ], 201);
    }

    public function show(Course $course): JsonResponse
    {
        return response()->json([
            'course' => $course->load(['instructors:id,name,email', 'categories:id,name', 'sections.lessons.attachments']),
        ]);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:courses,slug,' . $course->id],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lte:price'],
            'thumbnail' => ['nullable', 'string'],
            'is_featured' => ['nullable', 'boolean'],
            'enable_manual_payment' => ['nullable', 'boolean'],
            'enable_shurjopay' => ['nullable', 'boolean'],
            'status' => ['required', 'in:draft,published,archived'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'instructor_ids' => ['nullable', 'array'],
            'instructor_ids.*' => ['exists:users,id'],
        ], [
            'sale_price.lte' => 'অফার মূল্য অবশ্যই রেগুলার মূল্যের সমান বা কম হতে হবে।',
        ]);

        $oldValues = $course->toArray();

        $course->update([
            'title' => $validated['title'],
            'slug' => ! empty($validated['slug']) ? Str::slug($validated['slug']) : $course->slug,
            'short_description' => $validated['short_description'] ?? null,
            'description' => $validated['description'] ?? null,
            'price' => (float) $validated['price'],
            'sale_price' => isset($validated['sale_price']) && $validated['sale_price'] !== '' ? (float) $validated['sale_price'] : null,
            'thumbnail' => $validated['thumbnail'] ?? $course->thumbnail,
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'enable_manual_payment' => array_key_exists('enable_manual_payment', $validated) ? (bool) $validated['enable_manual_payment'] : ($course->enable_manual_payment ?? true),
            'enable_shurjopay' => array_key_exists('enable_shurjopay', $validated) ? (bool) $validated['enable_shurjopay'] : ($course->enable_shurjopay ?? true),
            'status' => $validated['status'],
        ]);

        if (isset($validated['category_ids'])) {
            $course->categories()->sync($validated['category_ids']);
        }

        if (isset($validated['instructor_ids'])) {
            $course->instructors()->sync($validated['instructor_ids']);
            if (! empty($validated['instructor_ids'])) {
                $course->update(['instructor_id' => $validated['instructor_ids'][0]]);
            }
        }

        AuditLog::log('course_updated', 'Course', $course->id, $oldValues, $course->toArray());

        return response()->json([
            'message' => 'কোর্স সফলভাবে আপডেট করা হয়েছে।',
            'course' => $course->fresh(['instructors', 'categories']),
        ]);
    }

    public function destroy(Course $course): JsonResponse
    {
        $oldValues = $course->toArray();
        $course->delete();

        AuditLog::log('course_deleted', 'Course', $course->id, $oldValues, null);

        return response()->json([
            'message' => 'কোর্স মুছে ফেলা হয়েছে।',
        ]);
    }

    public function teachersList(): JsonResponse
    {
        $teachers = User::where('role', User::ROLE_TEACHER)
            ->where('status', User::STATUS_ACTIVE)
            ->select('id', 'name', 'phone', 'email')
            ->get();

        return response()->json($teachers);
    }
}
