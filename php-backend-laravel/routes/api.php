<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\ledgerController;
use App\Http\Controllers\ClientPaymentController;

// Handle CORS preflight requests
Route::options('{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
})->where('any', '.*');

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Test authentication endpoint
Route::get('/test-auth', function (Request $request) {
    $user = $request->user();
    return response()->json([
        'authenticated' => $user ? true : false,
        'user' => $user ? [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role
        ] : null
    ]);
})->middleware('api.auth');

Route::middleware('api.auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/verify', [AuthController::class, 'verify'])->middleware('throttle:10,1');

    // Admin-only routes
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::delete('/admin/users/{id}', [AdminUserController::class, 'destroy']);

    // Order routes (admin, client, sales, office)
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);

    // Task routes (admin, office, sales, client)
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/users', [TaskController::class, 'getUsers']);
    Route::post('/tasks', [TaskController::class, 'store']);

    // Attendance routes (all authenticated users)
    Route::prefix('attendance')->group(function () {
        Route::post('/start', [AttendanceController::class, 'start']);
        Route::post('/end', [AttendanceController::class, 'end']);
        Route::get('/status', [AttendanceController::class, 'status']);
        Route::get('/history', [AttendanceController::class, 'history']);
        Route::get('/all', [AttendanceController::class, 'all']);
        Route::get('/office-location', [AttendanceController::class, 'officeLocation']);
    });

    // Sales routes (admin, manager, sales, office)
    Route::prefix('sales')->group(function () {
        Route::get('/reports', [SalesController::class, 'index']);
        Route::post('/reports', [SalesController::class, 'store']);
        Route::get('/reports/{id}', [SalesController::class, 'show']);
        Route::put('/reports/{id}', [SalesController::class, 'update']);
        Route::delete('/reports/{id}', [SalesController::class, 'destroy']);
        Route::post('/upload-photo', [SalesController::class, 'uploadPhoto']);
    });

    // Ledger routes (all authenticated users with role-based access)
    Route::prefix('ledgers')->group(function () {
        Route::get('/', [ledgerController::class, 'index']);
        Route::post('/', [ledgerController::class, 'store']);
        Route::get('/{id}', [ledgerController::class, 'show']);
        Route::put('/{id}', [ledgerController::class, 'update']);
        Route::delete('/{id}', [ledgerController::class, 'destroy']);
        Route::post('/{id}/upload', [ledgerController::class, 'upload']);
        Route::get('/{id}/download', [ledgerController::class, 'download']);
    });

    // Client Payment routes (role-based access)
    Route::prefix('client-payments')->group(function () {
        Route::get('/', [ClientPaymentController::class, 'index']);
        Route::post('/', [ClientPaymentController::class, 'store']);
        Route::put('/{id}/status', [ClientPaymentController::class, 'updateStatus']);
        Route::get('/sales-persons', [ClientPaymentController::class, 'getSalesPersons']);
    });
});



