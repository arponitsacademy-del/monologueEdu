@extends('layouts.app')

@section('content')
<div class="mx-auto max-w-6xl px-4 py-12">
    <div class="mb-8 flex items-center justify-between gap-4">
        <div>
            <p class="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Admin</p>
            <h1 class="mt-2 text-3xl font-bold text-slate-900">Course Management</h1>
        </div>
        <a href="{{ route('admin.courses.create') }}" class="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white">Create course</a>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Course</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Instructor</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Price</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
                @forelse ($courses as $course)
                    <tr>
                        <td class="px-4 py-4">
                            <div class="font-semibold text-slate-900">{{ $course->title }}</div>
                        </td>
                        <td class="px-4 py-4 text-slate-600">{{ $course->instructor?->name ?? 'Unassigned' }}</td>
                        <td class="px-4 py-4 text-slate-600">
                            @if ($course->price > 0)
                                ৳{{ number_format($course->sale_price ?? $course->price, 0) }}
                            @else
                                Free
                            @endif
                        </td>
                        <td class="px-4 py-4">
                            <span class="rounded-full {{ $course->status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700' }} px-2.5 py-1 text-xs font-semibold uppercase">
                                {{ $course->status }}
                            </span>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" class="px-4 py-8 text-center text-slate-600">No courses available yet.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-6">
        {{ $courses->links() }}
    </div>
</div>
@endsection
