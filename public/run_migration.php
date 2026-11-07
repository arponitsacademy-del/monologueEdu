<?php
if (!isset($_GET['secret']) || $_GET['secret'] !== 'monologue_migrate_secret_2026') {
    http_response_code(403);
    die('Forbidden');
}

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$status = $kernel->call('migrate', ['--force' => true]);
echo "<pre>";
echo $kernel->output();
echo "\nMigration Status Code: " . $status;
echo "</pre>";
