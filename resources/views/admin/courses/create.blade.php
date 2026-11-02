@extends('layouts.app')

@section('content')
<div class="mx-auto max-w-4xl px-4 py-12">
    <div class="mb-8">
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Admin</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900">Create Course</h1>
    </div>

    @if ($errors->any())
        <div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {{ $errors->first() }}
        </div>
    @endif

    <form method="POST" action="{{ route('admin.courses.store') }}" class="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        @csrf

        <div class="grid gap-6 md:grid-cols-2">
            <div class="md:col-span-2">
                <label class="mb-2 block text-sm font-medium text-slate-700">Course Title</label>
                <input type="text" name="title" value="{{ old('title') }}" required class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            </div>

            <div class="md:col-span-2">
                <label class="mb-2 block text-sm font-medium text-slate-700">Short description</label>
                <textarea name="short_description" rows="3" class="w-full rounded-xl border border-slate-300 px-4 py-3">{{ old('short_description') }}</textarea>
            </div>

            <div class="md:col-span-2">
                <label class="mb-2 block text-sm font-medium text-slate-700">Full description</label>
                <textarea name="description" rows="6" class="w-full rounded-xl border border-slate-300 px-4 py-3">{{ old('description') }}</textarea>
            </div>

            <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Regular price</label>
                <input type="number" name="price" value="{{ old('price', 0) }}" step="0.01" min="0" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            </div>

            <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Sale price</label>
                <input type="number" name="sale_price" value="{{ old('sale_price') }}" step="0.01" min="0" class="w-full rounded-xl border border-slate-300 px-4 py-3" />
            </div>

            <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Instructor</label>
                <select name="instructor_id" class="w-full rounded-xl border border-slate-300 px-4 py-3">
                    <option value="">Select instructor</option>
                    @foreach ($teachers as $teacher)
                        <option value="{{ $teacher->id }}" {{ old('instructor_id') == $teacher->id ? 'selected' : '' }}>{{ $teacher->name }}</option>
                    @endforeach
                </select>
            </div>

            <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select name="status" class="w-full rounded-xl border border-slate-300 px-4 py-3">
                    <option value="draft" {{ old('status') === 'draft' ? 'selected' : '' }}>Draft</option>
                    <option value="published" {{ old('status') === 'published' ? 'selected' : '' }}>Published</option>
                </select>
            </div>

            <div class="md:col-span-2">
                <label class="mb-2 block text-sm font-medium text-slate-700">Categories</label>
                <div class="grid gap-3 md:grid-cols-3">
                    @foreach ($categories as $category)
                        <label class="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                            <input type="checkbox" name="category_ids[]" value="{{ $category->id }}">
                            {{ $category->name }}
                        </label>
                    @endforeach
                </div>
            </div>
        </div>

        <div class="flex items-center justify-end gap-3">
            <a href="{{ route('admin.courses.index') }}" class="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700">Cancel</a>
            <button type="submit" class="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white">Save course</button>
        </div>
    </form>
</div>
@endsection
