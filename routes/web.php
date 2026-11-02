<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Single Page Application (React)
|--------------------------------------------------------------------------
| All web navigation is routed to the React single-page application view.
| API requests are handled by routes/api.php under /api.
*/

Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
