<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class MediaController extends Controller
{
    public function thumbnail(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'path' => 'required|string|max:2048',
            'w' => 'nullable|integer|min:40|max:2400',
            'h' => 'nullable|integer|min:40|max:2400',
            'q' => 'nullable|integer|min:35|max:95',
        ]);

        $normalizedPath = MediaUrl::normalizeStoredPath($validated['path'] ?? null);
        abort_if(!$normalizedPath, 422, 'Invalid image path.');
        abort_if(str_contains($normalizedPath, '..'), 422, 'Invalid image path.');
        abort_if(Str::startsWith($normalizedPath, ['http://', 'https://']), 422, 'External URLs are not supported.');

        $disk = Storage::disk('public');
        abort_unless($disk->exists($normalizedPath), 404, 'Image not found.');

        $sourceAbsolutePath = $disk->path($normalizedPath);
        $extension = strtolower(pathinfo($normalizedPath, PATHINFO_EXTENSION));
        abort_unless(in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true), 415, 'Unsupported image format.');

        $width = isset($validated['w']) ? (int) $validated['w'] : null;
        $height = isset($validated['h']) ? (int) $validated['h'] : null;
        $quality = isset($validated['q']) ? (int) $validated['q'] : 78;
        $quality = max(35, min(95, $quality));

        $mtime = @filemtime($sourceAbsolutePath) ?: time();
        $cacheKey = sha1($normalizedPath . '|' . ($width ?? 'auto') . '|' . ($height ?? 'auto') . '|' . $quality . '|' . $mtime);
        $cacheRelativePath = 'cache/thumbs/' . substr($cacheKey, 0, 2) . '/' . $cacheKey . '.webp';
        $cacheAbsolutePath = $disk->path($cacheRelativePath);

        if (!function_exists('imagecreatetruecolor') || !function_exists('imagecopyresampled') || !function_exists('imagewebp')) {
            return response()->file($sourceAbsolutePath, [
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }

        if (!$disk->exists($cacheRelativePath)) {
            try {
                $this->createThumbnail($sourceAbsolutePath, $cacheAbsolutePath, $extension, $width, $height, $quality);
            } catch (\Throwable $e) {
                return response()->file($sourceAbsolutePath, [
                    'Cache-Control' => 'public, max-age=86400',
                ]);
            }
        }

        return response()->file($cacheAbsolutePath, [
            'Content-Type' => 'image/webp',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    private function createThumbnail(
        string $sourcePath,
        string $targetPath,
        string $extension,
        ?int $targetWidth,
        ?int $targetHeight,
        int $quality
    ): void {
        $sourceImage = match ($extension) {
            'jpg', 'jpeg' => @imagecreatefromjpeg($sourcePath),
            'png' => @imagecreatefrompng($sourcePath),
            'webp' => @imagecreatefromwebp($sourcePath),
            default => false,
        };

        abort_unless($sourceImage !== false, 415, 'Image decode failed.');

        $originalWidth = imagesx($sourceImage);
        $originalHeight = imagesy($sourceImage);

        if ($targetWidth === null && $targetHeight === null) {
            $targetWidth = 900;
        }

        if ($targetWidth !== null && $targetHeight === null) {
            $targetHeight = max(1, (int) round(($targetWidth / $originalWidth) * $originalHeight));
        } elseif ($targetHeight !== null && $targetWidth === null) {
            $targetWidth = max(1, (int) round(($targetHeight / $originalHeight) * $originalWidth));
        }

        $targetWidth = max(1, min($targetWidth ?? $originalWidth, $originalWidth));
        $targetHeight = max(1, min($targetHeight ?? $originalHeight, $originalHeight));

        $destination = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($destination, false);
        imagesavealpha($destination, true);

        imagecopyresampled(
            $destination,
            $sourceImage,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $originalWidth,
            $originalHeight
        );

        $targetDir = dirname($targetPath);
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0775, true);
        }

        imagewebp($destination, $targetPath, $quality);

        imagedestroy($destination);
        imagedestroy($sourceImage);
    }
}
