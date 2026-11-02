@extends('layouts.app')

@section('content')
<section class="mx-auto max-w-6xl px-4 py-16">
    <div class="grid gap-10 lg:grid-cols-[1.5fr,0.8fr]">
        <div>
            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div class="mb-4 flex flex-wrap gap-2">
                    @foreach ($course->categories as $category)
                        <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{{ $category->name }}</span>
                    @endforeach
                </div>
                <h1 class="text-4xl font-bold text-slate-900">{{ $course->title }}</h1>
                <p class="mt-4 text-lg text-slate-600">{{ $course->short_description }}</p>
                <div class="mt-6 flex items-center gap-3 text-sm text-slate-500">
                    <span>Instructor: {{ $course->instructor?->name ?? 'Expert Mentor' }}</span>
                    <span>•</span>
                    <span>{{ $course->lessons->count() }} lessons</span>
                </div>
                <div class="mt-8 rounded-2xl bg-slate-50 p-5">
                    <h2 class="text-xl font-bold text-slate-900">Course Overview</h2>
                    <div class="mt-4 prose prose-slate max-w-none">
                        {!! $course->description !!}
                    </div>
                </div>
            </div>

            <div class="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 class="text-2xl font-bold text-slate-900">Curriculum Preview</h2>
                <div class="mt-6 space-y-4">
                    @forelse ($course->lessons as $lesson)
                        <div class="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                            <div>
                                <p class="font-semibold text-slate-800">{{ $lesson->title }}</p>
                                <p class="text-sm text-slate-500">{{ $lesson->duration_minutes }} minutes</p>
                            </div>
                            <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">Lesson {{ $loop->iteration }}</span>
                        </div>
                    @empty
                        <div class="rounded-xl border border-dashed border-slate-300 p-4 text-slate-600">No lessons have been added to this course yet.</div>
                    @endforelse
                </div>
            </div>
        </div>

        <aside class="lg:sticky lg:top-8">
            <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div class="flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-slate-100 text-lg font-semibold text-slate-700">
                    {{ $course->title }}
                </div>
                <div class="mt-6">
                    @if ($course->price > 0)
                        <div class="flex items-end gap-2">
                            <span class="text-3xl font-black text-slate-900">৳{{ number_format($course->sale_price ?? $course->price, 0) }}</span>
                            @if ($course->sale_price && $course->sale_price < $course->price)
                                <span class="text-lg text-slate-400 line-through">৳{{ number_format($course->price, 0) }}</span>
                            @endif
                        </div>
                    @else
                        <div class="text-3xl font-black text-slate-900">Free</div>
                    @endif
                </div>
                <ul class="mt-6 space-y-3 text-sm text-slate-600">
                    <li>• {{ $course->lessons->count() }} total lessons</li>
                    <li>• Full lifetime access</li>
                    <li>• Certificate of completion</li>
                </ul>
                <button class="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white">Enroll Now</button>
            </div>
        </aside>
    </div>
</section>
@endsection
