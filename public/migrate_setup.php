<?php
ini_set('display_errors', '1');
ini_set('max_execution_time', '300');
error_reporting(E_ALL);

// Security secret key
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

echo "=== 1. Running Database Migrations ===\n";
try {
    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    echo \Illuminate\Support\Facades\Artisan::output();
} catch (\Throwable $e) {
    echo "Migration Exception: " . $e->getMessage() . "\n";
}

echo "\n=== 2. Running Database Seeders ===\n";
try {
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
    echo \Illuminate\Support\Facades\Artisan::output();
} catch (\Throwable $e) {
    echo "Seed Exception: " . $e->getMessage() . "\n";
}

echo "\n=== 3. Storage Link ===\n";
try {
    \Illuminate\Support\Facades\Artisan::call('storage:link');
    echo \Illuminate\Support\Facades\Artisan::output();
} catch (\Throwable $e) {
    echo "Storage Link Exception: " . $e->getMessage() . "\n";
}

echo "\n=== 4. Clearing and Optimizing Caches ===\n";
try {
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    echo \Illuminate\Support\Facades\Artisan::output();
} catch (\Throwable $e) {
    echo "Optimize Exception: " . $e->getMessage() . "\n";
}

echo "\n=== Setup Completed! ===\n";
