<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Novonex Delta') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-slate-50 text-slate-900 antialiased">
    <header class="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <a href="{{ route('home') }}" class="text-xl font-black tracking-tight text-slate-900">Novonex Delta</a>
            <nav class="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
                <a href="{{ route('home') }}">Home</a>
                <a href="{{ route('courses') }}">Courses</a>
                @if (Auth::check())
                    <a href="{{ route('dashboard') }}">Dashboard</a>
                    <form method="POST" action="{{ route('logout') }}" class="inline">
                        @csrf
                        <button type="submit" class="text-slate-600">Logout</button>
                    </form>
                @else
                    <a href="{{ route('login') }}">Login</a>
                    <a href="{{ route('register') }}" class="rounded-full bg-indigo-600 px-4 py-2 text-white">Register</a>
                @endif
            </nav>
        </div>
    </header>

    <main>
        @yield('content')
    </main>
</body>
</html>
