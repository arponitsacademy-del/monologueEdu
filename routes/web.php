<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

/*
|--------------------------------------------------------------------------
| Storage Asset Streaming Fallback Route
|--------------------------------------------------------------------------
| Ensures that any uploaded media or file in storage/app/public can always be
| downloaded and displayed, even if symlink or static alias is missing on shared hosting.
*/
Route::get('/storage/{path}', function ($path) {
    // 1. Try public disk
    if (Storage::disk('public')->exists($path)) {
        return Storage::disk('public')->response($path);
    }

    // 2. Try raw storage/app/public path
    $storagePath = storage_path('app/public/' . $path);
    if (file_exists($storagePath)) {
        return response()->file($storagePath);
    }

    // 3. Try public_path
    $publicPath = public_path('storage/' . $path);
    if (file_exists($publicPath)) {
        return response()->file($publicPath);
    }

    abort(404);
})->where('path', '.*');

/*
|--------------------------------------------------------------------------
| Web Routes - Single Page Application (React)
|--------------------------------------------------------------------------
| All web navigation is routed to the React single-page application view.
| API requests are handled by routes/api.php under /api.
*/
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!(api|storage)).*$');
