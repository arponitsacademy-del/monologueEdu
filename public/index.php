<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Auto-generate .env on production server if missing
$envFile = __DIR__ . '/../.env';
if (!file_exists($envFile)) {
    $prodEnv = "APP_NAME=\"Monologue Edu\"\n"
        . "APP_ENV=production\n"
        . "APP_KEY=\"base64:8LjiCD2092BjzTs8yKmtgJZYHBSxl9zzGD/zHToHmsI=\"\n"
        . "APP_DEBUG=false\n"
        . "APP_URL=\"https://monologueedu.com\"\n\n"
        . "APP_LOCALE=bn\n"
        . "APP_FALLBACK_LOCALE=en\n"
        . "APP_FAKER_LOCALE=en_US\n\n"
        . "APP_MAINTENANCE_DRIVER=file\n"
        . "BCRYPT_ROUNDS=12\n\n"
        . "LOG_CHANNEL=stack\n"
        . "LOG_STACK=single\n"
        . "LOG_DEPRECATIONS_CHANNEL=null\n"
        . "LOG_LEVEL=error\n\n"
        . "DB_CONNECTION=mysql\n"
        . "DB_HOST=\"127.0.0.1\"\n"
        . "DB_PORT=\"3306\"\n"
        . "DB_DATABASE=\"u808707287_monologue\"\n"
        . "DB_USERNAME=\"u808707287_monouser\"\n"
        . "DB_PASSWORD=\"Monologue2026_EduSecure!\"\n\n"
        . "SESSION_DRIVER=database\n"
        . "SESSION_LIFETIME=120\n"
        . "SESSION_ENCRYPT=false\n"
        . "SESSION_PATH=/\n"
        . "SESSION_DOMAIN=null\n\n"
        . "BROADCAST_CONNECTION=log\n"
        . "FILESYSTEM_DISK=public\n"
        . "QUEUE_CONNECTION=database\n"
        . "CACHE_STORE=database\n"
        . "MEMCACHED_HOST=127.0.0.1\n\n"
        . "REDIS_CLIENT=phpredis\n"
        . "REDIS_HOST=127.0.0.1\n"
        . "REDIS_PASSWORD=null\n"
        . "REDIS_PORT=6379\n\n"
        . "MAIL_MAILER=log\n"
        . "MAIL_SCHEME=null\n"
        . "MAIL_HOST=127.0.0.1\n"
        . "MAIL_PORT=2525\n"
        . "MAIL_USERNAME=null\n"
        . "MAIL_PASSWORD=null\n"
        . "MAIL_FROM_ADDRESS=\"info@monologueedu.com\"\n"
        . "MAIL_FROM_NAME=\"\${APP_NAME}\"\n\n"
        . "VITE_APP_NAME=\"\${APP_NAME}\"\n";
    @file_put_contents($envFile, $prodEnv);
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
