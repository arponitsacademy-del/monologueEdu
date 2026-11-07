<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$token = $_GET['secret'] ?? '';
if ($token !== 'monologue_migrate_secret_2026') {
    http_response_code(403);
    echo "Forbidden";
    exit;
}

try {
    echo "<h1>Running Migrations</h1><pre>";
    $status = $kernel->call('migrate', ['--force' => true]);
    echo $kernel->output();
    echo "</pre>";

    echo "<h1>Migration Status: Success</h1>";
} catch (Exception $e) {
    http_response_code(500);
    echo "<h1>Error</h1><pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}
