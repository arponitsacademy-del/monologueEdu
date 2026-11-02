<?php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

$secret = 'NovonexDeploy_2026_DeltaSecretKey';
$providedSecret = $_GET['secret'] ?? $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? '';

if (!hash_equals($secret, (string)$providedSecret)) {
    http_response_code(403);
    echo "Unauthorized";
    exit;
}

echo "Diagnostic Start\n";
echo "PHP Version: " . phpversion() . "\n";
echo "ZipArchive available: " . (class_exists('ZipArchive') ? 'YES' : 'NO') . "\n";
echo "exec available: " . (function_exists('exec') ? 'YES' : 'NO') . "\n";

$zipFile = __DIR__ . '/deploy.zip';
echo "deploy.zip exists: " . (file_exists($zipFile) ? 'YES' : 'NO') . "\n";

if (file_exists($zipFile)) {
    echo "deploy.zip size: " . filesize($zipFile) . " bytes\n";
    if (class_exists('ZipArchive')) {
        $zip = new ZipArchive();
        $res = $zip->open($zipFile);
        if ($res === true) {
            $zip->extractTo(__DIR__);
            $zip->close();
            @unlink($zipFile);
            echo "ZipArchive extraction successful!\n";
        } else {
            echo "ZipArchive open failed with code: " . $res . "\n";
        }
    } else {
        // Fallback to system unzip command if available
        if (function_exists('exec')) {
            @exec('unzip -o -q ' . escapeshellarg($zipFile) . ' -d ' . escapeshellarg(__DIR__), $unzipLog, $unzipCode);
            echo "System unzip code: $unzipCode\n";
        }
        @unlink($zipFile);
    }
}

// Clean stale dev caches
@unlink(__DIR__ . '/app/bootstrap/cache/packages.php');
@unlink(__DIR__ . '/app/bootstrap/cache/services.php');
@unlink(__DIR__ . '/app/bootstrap/cache/config.php');
@unlink(__DIR__ . '/app/bootstrap/cache/routes-v7.php');

if (is_dir(__DIR__ . '/domains') && function_exists('exec')) {
    @exec('rm -rf ' . escapeshellarg(__DIR__ . '/domains'));
}

// Run Laravel migrations and cache optimization
if (file_exists(__DIR__ . '/app/vendor/autoload.php') && file_exists(__DIR__ . '/app/bootstrap/app.php')) {
    try {
        require_once __DIR__ . '/app/vendor/autoload.php';
        $app = require_once __DIR__ . '/app/bootstrap/app.php';
        $app->usePublicPath(__DIR__);

        $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();

        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $migrateLog = \Illuminate\Support\Facades\Artisan::output();
        echo "Artisan migrate:\n" . trim($migrateLog) . "\n";

        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        echo "Artisan optimize:clear executed.\n";
    } catch (\Throwable $e) {
        echo "Artisan error: " . $e->getMessage() . "\n";
    }
}

echo "status: success\n";
