<?php
ini_set('display_errors', '1');
error_reporting(E_ALL);

$secret = 'MonologueEdu_2026_SetupKey';
if (($_GET['key'] ?? '') !== $secret) {
    http_response_code(403);
    die("Access Denied");
}

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain; charset=utf-8');
echo "Running migrate...\n";
\Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
echo \Illuminate\Support\Facades\Artisan::output();

\Illuminate\Support\Facades\Artisan::call('optimize:clear');
echo "Cache cleared!\n";
