<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

$envPath = __DIR__ . '/app/.env';
$prodEnv = "APP_NAME=\"Novonex Academy\"\n"
    . "APP_ENV=production\n"
    . "APP_KEY=\"base64:8LjiCD2092BjzTs8yKmtgJZYHBSxl9zzGD/zHToHmsI=\"\n"
    . "APP_DEBUG=false\n"
    . "APP_URL=\"https://novonexdelta.com\"\n\n"
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
    . "DB_DATABASE=\"u991362382_delta\"\n"
    . "DB_USERNAME=\"u991362382_delta\"\n"
    . "DB_PASSWORD=\"NovonexDelta_2026_SecuredDb\"\n\n"
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
    . "MAIL_FROM_ADDRESS=\"info@novonexdelta.com\"\n"
    . "MAIL_FROM_NAME=\"\${APP_NAME}\"\n\n"
    . "VITE_APP_NAME=\"\${APP_NAME}\"\n";

if (!file_exists($envPath) || strpos(@file_get_contents($envPath), 'NovonexDelta_2026_SecuredDb') === false) {
    @file_put_contents($envPath, $prodEnv);
}

if (file_exists($maintenance = __DIR__.'/app/storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/app/vendor/autoload.php';

/** @var Application $app */
$app = require_once __DIR__.'/app/bootstrap/app.php';
$app->usePublicPath(__DIR__);
$app->handleRequest(Request::capture());

