@extends('layouts.app')

@section('content')
<div class="mx-auto max-w-md px-4 py-16">
    <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div class="mb-6 text-center">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Welcome back</p>
            <h1 class="mt-2 text-3xl font-bold text-slate-900">Student Login</h1>
        </div>

        @if ($errors->any())
            <div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="{{ route('login') }}" class="space-y-5">
            @csrf

            <div>
                <label for="phone" class="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                <input id="phone" name="phone" type="tel" value="{{ old('phone') }}" required
                    class="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" placeholder="e.g. 01712345678" />
            </div>

            <div>
                <label for="password" class="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input id="password" name="password" type="password" required
                    class="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>

            <button type="submit" class="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500">
                Login
            </button>
        </form>

        <div class="mt-6 text-center text-sm text-slate-600">
            Need an account? <a href="{{ route('register') }}" class="font-semibold text-indigo-600">Register here</a>
        </div>
    </div>
</div>
@endsection
