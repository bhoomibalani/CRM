<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiAuthenticate
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Debug authentication
        $authHeader = $request->header('Authorization');
        $hasAuth = !empty($authHeader);
        $isSanctumAuth = Auth::guard('sanctum')->check();
        $user = Auth::guard('sanctum')->user();
        
        \Log::info('API Authentication Debug', [
            'has_auth_header' => $hasAuth,
            'auth_header' => $authHeader ? 'Present' : 'Missing',
            'sanctum_check' => $isSanctumAuth,
            'user_id' => $user ? $user->id : null,
            'user_email' => $user ? $user->email : null,
            'user_role' => $user ? $user->role : null,
            'url' => $request->url(),
            'method' => $request->method()
        ]);

        if (!$isSanctumAuth) {
            \Log::warning('Authentication failed', [
                'has_auth_header' => $hasAuth,
                'auth_header' => $authHeader,
                'url' => $request->url()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Set the user in the request so $request->user() works in controllers
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $next($request);
    }
}
