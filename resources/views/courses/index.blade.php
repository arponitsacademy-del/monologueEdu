@extends('layouts.app')

@section('content')
<section class="mx-auto max-w-6xl px-4 py-16">
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Courses</p>
            <h1 class="mt-3 text-3xl font-bold text-slate-900">{{ $filterLabel ?? 'All Courses' }}</h1>
        </div>
        <div class="flex flex-wrap gap-2">
            <a href="{{ route('courses') }}" class="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">All</a>
            @if(isset($categories))
                @foreach($categories as $cat)
                    @if(!in_array($cat->slug, ['free-courses', 'paid-courses']))
                        <a href="{{ route('courses') }}?category={{ $cat->slug }}" class="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{{ $cat->name }}</a>
                    @endif
                @endforeach
            @endif
        </div>
    </div>

    <div class="grid gap-6 md:grid-cols-3">
        @forelse ($courses as $course)
            <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="flex h-40 items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 text-lg font-semibold text-slate-700">
                    {{ $course->title }}
                </div>
                <div class="p-5">
                    <div class="flex flex-wrap gap-2">
                        @foreach ($course->categories as $category)
                            <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{{ $category->name }}</span>
                        @endforeach
                    </div>
                    <h2 class="mt-4 text-xl font-bold text-slate-900">{{ $course->title }}</h2>
                    <p class="mt-3 text-sm text-slate-600">{{ Str::limit($course->short_description ?? $course->description ?? 'Explore the course details and learn with practical guidance.', 120) }}</p>
                    <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
                        <span>Instructor: {{ $course->instructor?->name ?? 'Expert Mentor' }}</span>
                        <span>{{ $course->lessons->count() }} lessons</span>
                    </div>
                    <div class="mt-5 flex items-center justify-between">
                        <div>
                            @if ($course->price > 0)
                                <span class="text-lg font-bold text-indigo-600">৳{{ number_format($course->sale_price ?? $course->price, 0) }}</span>
                            @else
                                <span class="text-lg font-bold text-indigo-600">Free</span>
                            @endif
                        </div>
                        <a href="{{ route('courses.show', $course) }}" class="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">View Details</a>
                    </div>
                </div>
            </article>
        @empty
            <div class="md:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                No courses are available in this category yet.
            </div>
        @endforelse
    </div>

    <div class="mt-8">
        {{ $courses->links() }}
    </div>
</section>
@endsection
