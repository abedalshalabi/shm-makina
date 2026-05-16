<?php

namespace App\Models\Concerns;

use App\Support\MediaUrl;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

trait DeletesLocalMedia
{
    /**
     * @return string[]
     */
    protected function collectLocalStoragePaths(mixed $value): array
    {
        if ($value === null) {
            return [];
        }

        if (is_string($value)) {
            $normalized = $this->normalizeLocalStoragePath($value);
            return $normalized ? [$normalized] : [];
        }

        if (is_object($value)) {
            return $this->collectLocalStoragePaths((array) $value);
        }

        if (!is_array($value)) {
            return [];
        }

        $paths = [];
        foreach ($value as $item) {
            $paths = array_merge($paths, $this->collectLocalStoragePaths($item));
        }

        // Common image payload formats: ['image_path' => ..., 'image_url' => ...]
        foreach (['image_path', 'image_url', 'path', 'url', 'src', 'image', 'cover_image'] as $key) {
            if (isset($value[$key]) && is_string($value[$key])) {
                $paths = array_merge($paths, $this->collectLocalStoragePaths($value[$key]));
            }
        }

        return array_values(array_unique(array_filter($paths)));
    }

    protected function deleteLocalStoragePaths(array $paths): void
    {
        $cleanPaths = array_values(array_unique(array_filter($paths)));
        foreach ($cleanPaths as $path) {
            try {
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to delete local media file', [
                    'path' => $path,
                    'model' => static::class,
                    'model_id' => $this->id ?? null,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    protected function normalizeLocalStoragePath(string $value): ?string
    {
        $normalized = MediaUrl::normalizeStoredPath($value);
        if (!is_string($normalized) || trim($normalized) === '') {
            return null;
        }

        $normalized = str_replace('\\', '/', trim($normalized));
        if ($normalized === '') {
            return null;
        }

        if (
            str_starts_with($normalized, 'http://') ||
            str_starts_with($normalized, 'https://') ||
            str_starts_with($normalized, '//')
        ) {
            return null;
        }

        $normalized = ltrim($normalized, '/');
        if (str_starts_with($normalized, 'storage/')) {
            $normalized = substr($normalized, strlen('storage/'));
        }

        if ($normalized === '' || str_contains($normalized, '..')) {
            return null;
        }

        return $normalized;
    }
}

