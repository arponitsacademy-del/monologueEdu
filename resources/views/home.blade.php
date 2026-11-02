@extends('layouts.app')

@section('content')
<section class="bg-slate-950 text-white">
    <div class="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
        <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">Premium LMS</p>
            <h1 class="mt-4 text-4xl font-black leading-tight md:text-6xl">Learn smarter, teach better.</h1>
            <p class="mt-5 max-w-xl text-lg text-slate-300">
                Build future-ready skills with professional courses, guided learning paths, and a premium student experience.
            </p>
            <div class="mt-8 flex flex-wrap gap-4">
                <a href="{{ route('register') }}" class="rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white hover:bg-indigo-400">Get Started</a>
                <a href="{{ route('courses') }}" class="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-semibold text-white hover:border-slate-500">Explore Courses</a>
            </div>
        </div>

        <div class="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div class="grid gap-4 sm:grid-cols-2">
                <div class="rounded-2xl bg-indigo-500/20 p-5">
                    <p class="text-sm text-indigo-200">Active learners</p>
                    <p class="mt-3 text-3xl font-bold">12K+</p>
                </div>
                <div class="rounded-2xl bg-emerald-500/20 p-5">
                    <p class="text-sm text-emerald-200">Courses</p>
                    <p class="mt-3 text-3xl font-bold">180+</p>
                </div>
                <div class="rounded-2xl bg-cyan-500/20 p-5 sm:col-span-2">
                    <p class="text-sm text-cyan-200">Weekly learning goals</p>
                    <p class="mt-3 text-3xl font-bold">96% completion</p>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="mx-auto max-w-6xl px-4 py-16">
    <div class="mb-8 text-center">
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Featured courses</p>
        <h2 class="mt-3 text-3xl font-bold text-slate-900">Learning paths for every stage</h2>
    </div>

    <div class="grid gap-6 md:grid-cols-3">
        @forelse ($featuredCourses as $course)
            <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="flex h-40 items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-100 text-lg font-semibold text-slate-700">
                    {{ $course->title }}
                </div>
                <div class="p-5">
                    <div class="flex flex-wrap gap-2">
                        @foreach ($course->categories as $category)
                            <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{{ $category->name }}</span>
                        @endforeach
                    </div>
                    <h3 class="mt-4 text-xl font-bold text-slate-900">{{ $course->title }}</h3>
                    <p class="mt-3 text-slate-600">{{ Str::limit($course->short_description ?? $course->description ?? 'Learn practical skills with guided lessons and expert design.', 120) }}</p>
                    <div class="mt-5 flex items-center justify-between">
                        <div>
                            @if ($course->price > 0)
                                <span class="text-lg font-bold text-indigo-600">৳{{ number_format($course->sale_price ?? $course->price, 0) }}</span>
                                @if ($course->sale_price && $course->sale_price < $course->price)
                                    <span class="ml-2 text-sm text-slate-400 line-through">৳{{ number_format($course->price, 0) }}</span>
                                @endif
                            @else
                                <span class="text-lg font-bold text-indigo-600">Free</span>
                            @endif
                        </div>
                        <a href="{{ route('courses.show', $course) }}" class="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">View</a>
                    </div>
                </div>
            </article>
        @empty
            <div class="md:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                No featured courses are available right now.
            </div>
        @endforelse
    </div>
</section>
@endsection
