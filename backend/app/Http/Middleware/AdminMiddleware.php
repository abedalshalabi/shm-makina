<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Check if user is an admin
        if (!$user instanceof \App\Models\Admin) {
            return response()->json(['message' => 'Access denied. Admin privileges required.'], 403);
        }

        // Check if admin is active
        if (!$user->is_active) {
            return response()->json(['message' => 'Account is deactivated'], 403);
        }

        return $next($request);
    }
}
