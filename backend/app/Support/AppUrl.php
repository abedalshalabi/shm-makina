<?php

namespace App\Support;

class AppUrl
{
    public static function frontend(): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', ''), '/');

        if ($frontendUrl !== '') {
            return $frontendUrl;
        }

        return static::backendPublic();
    }

    public static function backendPublic(): string
    {
        $configuredUrl = rtrim((string) env('BACKEND_PUBLIC_URL', ''), '/');

        if ($configuredUrl !== '') {
            return $configuredUrl;
        }

        return rtrim((string) config('app.url', ''), '/');
    }

    public static function origin(?string $url): string
    {
        $parts = parse_url((string) $url);

        $scheme = $parts['scheme'] ?? 'https';
        $host = $parts['host'] ?? 'localhost';
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';

        return "{$scheme}://{$host}{$port}";
    }
}
