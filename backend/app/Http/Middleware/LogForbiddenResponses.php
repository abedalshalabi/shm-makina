<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class LogForbiddenResponses
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($response->getStatusCode() === 403) {
            Log::warning('403 Forbidden Error Detected', [
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_id' => $request->user()?->id,
                'agent' => $request->userAgent(),
                'method' => $request->method(),
                'response_content' => substr($response->getContent(), 0, 500) // Log first part of response to see if it's HTML or JSON
            ]);
        }

        return $response;
    }
}
