@extends('layouts.app')

@section('content')
<div class="mx-auto max-w-6xl px-4 py-12">
    <div class="mb-8 flex items-center justify-between">
        <div>
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Dashboard</p>
            <h1 class="mt-2 text-3xl font-bold text-slate-900">Welcome, {{ $user->name }}</h1>
        </div>
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit" class="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:border-slate-400">
                Logout
            </button>
        </form>
    </div>

    <div class="grid gap-6 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-sm text-slate-500">Role</p>
            <p class="mt-3 text-2xl font-bold capitalize text-slate-900">{{ $user->role }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-sm text-slate-500">Phone</p>
            <p class="mt-3 text-2xl font-bold text-slate-900">{{ $user->phone }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-sm text-slate-500">Status</p>
            <p class="mt-3 text-2xl font-bold capitalize text-emerald-600">{{ $user->status }}</p>
        </div>
    </div>

    <div class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-xl font-bold text-slate-900">Quick overview</h2>
        <ul class="mt-4 space-y-3 text-slate-600">
            <li>• Role-based dashboard structure is ready for admin, teacher, and student access.</li>
            <li>• Public registration only creates Student accounts.</li>
            <li>• Phone-based authentication is enabled for secure login.</li>
        </ul>
    </div>
</div>
@endsection
