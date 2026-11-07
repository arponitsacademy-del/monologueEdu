<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @php
        $siteSettings = \App\Models\WebsiteSetting::current();
        $siteFavicon = $siteSettings->favicon_url ?? null;
        $siteTitle = $siteSettings->site_name ?? 'Novonex Academy';
        $siteTagline = $siteSettings->site_tagline ?? 'Premier Online Learning & EdTech Platform';
        $headerSettings = $siteSettings->header_settings ?? [];
        $siteLogo = $headerSettings['logo_url'] ?? $siteSettings->logo_url ?? null;
    @endphp
    <title>{{ $siteTitle }} | {{ $siteTagline }}</title>
    @if($siteFavicon)
        <link rel="icon" id="dynamic-favicon" href="{{ $siteFavicon }}">
        <link rel="shortcut icon" href="{{ $siteFavicon }}">
        <link rel="apple-touch-icon" href="{{ $siteFavicon }}">
    @else
        <link rel="icon" id="dynamic-favicon" href="/favicon.ico" type="image/x-icon">
    @endif
    @if($siteLogo)
        <link rel="preload" as="image" href="{{ $siteLogo }}">
    @endif
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet">
    <script>
        window.__INITIAL_SETTINGS__ = {!! json_encode($siteSettings) !!};
        (function() {
            try {
                var theme = localStorage.getItem('novonex_theme');
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (_) {}
        })();
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white">
    <div id="root"></div>
</body>
</html>
