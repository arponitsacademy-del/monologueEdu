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

$zipFile = __DIR__ . '/deploy.zip';

if (!file_exists($zipFile)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'deploy.zip not found on server']);
    exit;
}

$zip = new ZipArchive();
if ($zip->open($zipFile) === true) {
    // Extract everything to document root
    $zip->extractTo(__DIR__);
    $zip->close();
    @unlink($zipFile);

    // Clean up temporary domains directory if it was created during previous test runs
    if (is_dir(__DIR__ . '/domains')) {
        @exec('rm -rf ' . escapeshellarg(__DIR__ . '/domains'));
    }

    // Refresh Laravel caches and run migrations safely
    $artisan = __DIR__ . '/app/artisan';
    $artisanLog = [];
    if (file_exists($artisan)) {
        @exec("php $artisan optimize:clear 2>&1", $artisanLog);
        @exec("php $artisan migrate --force 2>&1", $artisanLog);
        @exec("php $artisan config:cache 2>&1", $artisanLog);
        @exec("php $artisan route:cache 2>&1", $artisanLog);
        @exec("php $artisan view:cache 2>&1", $artisanLog);
    }

    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Deployment package extracted and Laravel optimized successfully!',
        'artisan' => implode("\n", $artisanLog ?: []),
        'timestamp' => date('c')
    ]);
} else {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Failed to extract deploy.zip']);
}
