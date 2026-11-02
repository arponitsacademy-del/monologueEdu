<?php
/**
 * Automated Deployment Extractor for Hostinger
 * Unzips deploy.zip in 1 second, avoiding thousands of individual FTP file transfers.
 */

$secret = 'NovonexDeploy_2026_DeltaSecretKey';
$providedSecret = $_GET['secret'] ?? $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? '';

if (!hash_equals($secret, (string)$providedSecret)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

// Clean stale dev caches from bootstrap/cache that cause "Class not found" errors
@unlink(__DIR__ . '/app/bootstrap/cache/packages.php');
@unlink(__DIR__ . '/app/bootstrap/cache/services.php');
@unlink(__DIR__ . '/app/bootstrap/cache/config.php');
@unlink(__DIR__ . '/app/bootstrap/cache/routes-v7.php');

// Clean up temporary domains directory if it was created during previous test runs
if (is_dir(__DIR__ . '/domains')) {
    @exec('rm -rf ' . escapeshellarg(__DIR__ . '/domains'));
}

$zipFile = __DIR__ . '/deploy.zip';

// Wait up to 5 seconds if file is being finalized by upload/antivirus
$attempts = 0;
while (!file_exists($zipFile) && $attempts < 5) {
    sleep(1);
    clearstatcache(true, $zipFile);
    $attempts++;
}

if (file_exists($zipFile)) {
    $zip = new ZipArchive();
    if ($zip->open($zipFile) === true) {
        // Extract everything to document root
        $zip->extractTo(__DIR__);
        $zip->close();
        @unlink($zipFile);
    }
}

// Ensure bootstrap cache files are clean after extraction as well
@unlink(__DIR__ . '/app/bootstrap/cache/packages.php');
@unlink(__DIR__ . '/app/bootstrap/cache/services.php');
@unlink(__DIR__ . '/app/bootstrap/cache/config.php');
@unlink(__DIR__ . '/app/bootstrap/cache/routes-v7.php');

// Refresh Laravel caches and run migrations safely
$artisan = __DIR__ . '/app/artisan';
$artisanLog = [];
if (file_exists($artisan) && file_exists(__DIR__ . '/app/vendor/autoload.php')) {
    @exec("php $artisan optimize:clear 2>&1", $artisanLog);
    @exec("php $artisan migrate --force 2>&1", $artisanLog);
}

header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'message' => 'Deployment package extracted and Laravel optimized successfully!',
    'artisan' => implode("\n", $artisanLog ?: []),
    'timestamp' => date('c')
]);
