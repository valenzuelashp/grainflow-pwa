<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
Route::get('/', function () {
    return view('welcome');
});
Route::get('/clear-cache', function () {
    try {
        Artisan::call('config:clear');
        Artisan::call('cache:clear');
        Artisan::call('route:clear');
        return "Memory flushed! Laravel is now using your newest Render settings.";
    } catch (\Exception $e) {
        return "Failed to clear cache: " . $e->getMessage();
    }
});