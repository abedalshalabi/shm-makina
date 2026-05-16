<?php

namespace App\Support;

class MediaUrl
{
    public static function normalizeStoredPath(?string $value): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $value = trim($value);

        if (str_contains($value, '/storage/')) {
            $relative = explode('/storage/', $value, 2)[1] ?? '';
            return ltrim($relative, '/');
        }

        if (str_starts_with($value, '/storage/')) {
            return ltrim(substr($value, strlen('/storage/')), '/');
        }

        if (str_starts_with($value, 'storage/')) {
            return ltrim(substr($value, strlen('storage/')), '/');
        }

        return $value;
    }

    public static function publicUrl(?string $value): ?string
    {
        $normalized = static::normalizeStoredPath($value);

        if (!is_string($normalized) || $normalized === '') {
            return null;
        }

        if (str_starts_with($normalized, 'http://') || str_starts_with($normalized, 'https://')) {
            return $normalized;
        }

        $base = AppUrl::backendPublic();

        if ($base === '') {
            return null;
        }

        if (str_starts_with($normalized, '/')) {
            return $base . $normalized;
        }

        if ($normalized === 'logo.webp') {
            return $base . '/logo.webp';
        }

        return $base . '/storage/' . ltrim($normalized, '/');
    }

    public static function normalizeImageEntry(array $image): array
    {
        $imagePath = static::normalizeStoredPath($image['image_path'] ?? $image['path'] ?? null);
        $imageUrl = static::publicUrl($image['image_url'] ?? $imagePath);

        return [
            'id' => $image['id'] ?? null,
            'image_path' => $imagePath ?? '',
            'image_url' => $imageUrl ?? '',
            'alt_text' => $image['alt_text'] ?? null,
            'is_primary' => (bool) ($image['is_primary'] ?? false),
            'sort_order' => (int) ($image['sort_order'] ?? 0),
        ];
    }
}
