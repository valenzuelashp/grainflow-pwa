<?php

use App\Http\Controllers\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Artisan;

// COST CONTROL: Users can only ask 5 questions per minute!
Route::middleware(['auth:sanctum', 'throttle:5,1'])->post('/chat', [ChatController::class, 'ask']);

// This is the route you just built!
Route::post('/register', [AuthController::class, 'register']);
Route::post('/register/verify', [AuthController::class, 'verifySignup']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/google-login', [AuthController::class, 'googleLogin']);
Route::post('/forgot-password/send-code', [AuthController::class, 'forgotPasswordSendCode']);
Route::post('/forgot-password/reset', [AuthController::class, 'forgotPasswordReset']);

// Protect these routes so only logged-in users with a token can access them
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/reports/daily', [TransactionController::class, 'getDailyReport']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/reports/{type}', [TransactionController::class, 'getReportData']);
    Route::get('/trends', [TransactionController::class, 'getTrends']);
    Route::get('/dashboard-stats', [TransactionController::class, 'getDashboardData']);
    Route::get('/customers', [TransactionController::class, 'getCustomers']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    
    // NEW: Update and Delete
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::get('/products/archived', [ProductController::class, 'archived']);
    Route::patch('/products/{id}/unarchive', [ProductController::class, 'unarchive']);
    Route::put('/products/{id}/unarchive', [ProductController::class, 'unarchive']);
    Route::get('/customers', [TransactionController::class, 'getCustomers']);

    // NEW: Unpaid Balances Routes
    Route::get('/transactions/credit', [TransactionController::class, 'getUnpaidBalances']);
    Route::patch('/transactions/{id}/status', [TransactionController::class, 'updateStatus']);

    Route::patch('/products/{id}/archive', [App\Http\Controllers\ProductController::class, 'archive']);

    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile/update', [AuthController::class, 'updateProfile']);
    Route::put('/profile/store', [AuthController::class, 'updateStoreDetails']);
    Route::post('/profile/send-code', [AuthController::class, 'sendVerificationCode']);
    Route::post('/profile/update-password', [AuthController::class, 'updatePassword']);
    Route::get('/reports/filtered-export', [TransactionController::class, 'getFilteredReport']);

    Route::post('/profile/goal', [AuthController::class, 'updateMonthlyGoal']);
    Route::get('/profile/goal-suggestions', [AuthController::class, 'getGoalSuggestions']);
    Route::get('/recommend-tubo', [TransactionController::class, 'recommendTubo']);
    Route::post('/feedback', [AuthController::class, 'sendFeedback']);
});
// This is a default route Laravel includes to get the logged-in user's info.
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');