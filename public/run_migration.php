<?php

if (!isset($_GET['secret']) || $_GET['secret'] !== 'monologue_migrate_secret_2026') {
    http_response_code(403);
    die('Forbidden: Invalid secret');
}

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$status = $kernel->call('migrate', ['--force' => true]);
$output = Illuminate\Support\Facades\Artisan::output();

header('Content-Type: text/plain');
echo "Status: " . $status . "\n";
echo "Output:\n" . $output;
