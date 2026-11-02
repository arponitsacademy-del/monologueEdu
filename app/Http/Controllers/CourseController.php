<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\View\View;

class CourseController extends Controller
{
    public function index(): View
    {
        $courses = Course::with(['instructor', 'categories'])->published()->latest()->paginate(12);

        return view('courses.index', [
            'courses' => $courses,
            'categories' => Category::all(),
        ]);
    }

    public function free(): View
    {
        $courses = Course::with(['instructor', 'categories'])->free()->latest()->paginate(12);

        return view('courses.index', [
            'courses' => $courses,
            'categories' => Category::all(),
            'filterLabel' => 'Free Courses',
        ]);
    }

    public function paid(): View
    {
        $courses = Course::with(['instructor', 'categories'])->paid()->latest()->paginate(12);

        return view('courses.index', [
            'courses' => $courses,
            'categories' => Category::all(),
            'filterLabel' => 'Paid Courses',
        ]);
    }

    public function show(Course $course): View
    {
        abort_unless($course->status === Course::STATUS_PUBLISHED, 404);

        $course->load(['instructor', 'categories', 'lessons']);

        return view('courses.show', compact('course'));
    }

    public function adminIndex(): View
    {
        $courses = Course::with(['instructor', 'categories'])->latest()->paginate(20);

        return view('admin.courses.index', [
            'courses' => $courses,
        ]);
    }

    public function create(): View
    {
        return view('admin.courses.create', [
            'categories' => Category::all(),
            'teachers' => \App\Models\User::where('role', \App\Models\User::ROLE_TEACHER)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'thumbnail' => ['nullable', 'string', 'max:255'],
            'is_featured' => ['nullable', 'boolean'],
            'status' => ['required', 'in:draft,published'],
            'category_ids' => ['nullable', 'array'],
            'instructor_id' => ['nullable', 'exists:users,id'],
        ]);

        $course = Course::create([
            'instructor_id' => $validated['instructor_id'] ?? Auth::id(),
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']),
            'short_description' => $validated['short_description'] ?? null,
            'description' => $validated['description'] ?? null,
            'price' => (float) ($validated['price'] ?? 0),
            'sale_price' => isset($validated['sale_price']) ? (float) $validated['sale_price'] : null,
            'thumbnail' => $validated['thumbnail'] ?? null,
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'status' => $validated['status'],
        ]);

        if (! empty($validated['category_ids'])) {
            $course->categories()->sync($validated['category_ids']);
        }

        return redirect()->route('admin.courses.index')->with('success', 'Course created successfully.');
    }
}
