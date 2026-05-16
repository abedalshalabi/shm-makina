<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ImageUploadOptimizer
{
    /**
     * Store an uploaded image with optional compression/conversion.
     */
    public static function storeUploaded(UploadedFile $file, string $directory, string $prefix = 'image'): string
    {
        $sourcePath = $file->getRealPath();
        if (!$sourcePath || !is_file($sourcePath)) {
            throw new RuntimeException('Uploaded image temporary path is not available.');
        }

        $originalName = $file->getClientOriginalName();
        if (!is_string($originalName) || trim($originalName) === '') {
            $originalName = 'upload.' . ($file->getClientOriginalExtension() ?: 'jpg');
        }

        return static::storeFromLocalPath($sourcePath, $originalName, $directory, $prefix);
    }

    /**
     * Store an image from a local source path with optional compression/conversion.
     */
    public static function storeFromLocalPath(
        string $sourcePath,
        string $originalName,
        string $directory,
        string $prefix = 'image'
    ): string {
        if (!is_file($sourcePath)) {
            throw new RuntimeException('Source image file not found.');
        }

        $directory = trim($directory, '/');
        if ($directory === '') {
            $directory = 'products';
        }

        $config = static::config();
        $sourceExtension = static::normalizeExtension(
            pathinfo($originalName, PATHINFO_EXTENSION) ?: pathinfo($sourcePath, PATHINFO_EXTENSION)
        );
        if ($sourceExtension === '') {
            $sourceExtension = 'jpg';
        }

        $targetExtension = $sourceExtension === 'jpeg' ? 'jpg' : $sourceExtension;
        $supportedForOptimization = in_array($sourceExtension, ['jpg', 'jpeg', 'png', 'webp'], true);
        $canOptimize = $config['enabled'] && static::gdCanOptimize() && $supportedForOptimization;

        if ($canOptimize) {
            $optimizedTempPath = static::optimizeToTempFile(
                $sourcePath,
                $sourceExtension,
                $config['force_webp'],
                $config['quality'],
                $config['max_dimension'],
                $config['max_megapixels']
            );

            if ($optimizedTempPath !== null) {
                $targetExtension = $config['force_webp'] ? 'webp' : $targetExtension;
                $relativePath = static::buildTargetRelativePath($directory, $prefix, $targetExtension);

                $stream = fopen($optimizedTempPath, 'rb');
                Storage::disk('public')->put($relativePath, $stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
                @unlink($optimizedTempPath);

                return $relativePath;
            }
        }

        $relativePath = static::buildTargetRelativePath($directory, $prefix, $targetExtension);
        $stream = fopen($sourcePath, 'rb');
        Storage::disk('public')->put($relativePath, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return $relativePath;
    }

    private static function optimizeToTempFile(
        string $sourcePath,
        string $sourceExtension,
        bool $forceWebp,
        int $quality,
        int $maxDimension,
        int $maxMegaPixels
    ): ?string {
        $imageInfo = @getimagesize($sourcePath);
        if (!is_array($imageInfo)) {
            return null;
        }

        $originalWidth = (int) ($imageInfo[0] ?? 0);
        $originalHeight = (int) ($imageInfo[1] ?? 0);
        $mime = strtolower((string) ($imageInfo['mime'] ?? ''));
        if ($originalWidth <= 0 || $originalHeight <= 0) {
            return null;
        }

        if (($originalWidth * $originalHeight) > ($maxMegaPixels * 1000000)) {
            return null;
        }

        $sourceImage = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($sourcePath),
            'image/png' => @imagecreatefrompng($sourcePath),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($sourcePath) : false,
            default => false,
        };

        if ($sourceImage === false) {
            // Fall back to extension-based decode if mime detection is missing/incorrect.
            $sourceImage = match ($sourceExtension) {
                'jpg', 'jpeg' => @imagecreatefromjpeg($sourcePath),
                'png' => @imagecreatefrompng($sourcePath),
                'webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($sourcePath) : false,
                default => false,
            };
        }

        if ($sourceImage === false) {
            return null;
        }

        $scale = 1.0;
        $largestSide = max($originalWidth, $originalHeight);
        if ($largestSide > $maxDimension && $maxDimension > 0) {
            $scale = $maxDimension / $largestSide;
        }

        $targetWidth = max(1, (int) round($originalWidth * $scale));
        $targetHeight = max(1, (int) round($originalHeight * $scale));

        $targetImage = imagecreatetruecolor($targetWidth, $targetHeight);
        if ($targetImage === false) {
            imagedestroy($sourceImage);
            return null;
        }

        imagealphablending($targetImage, false);
        imagesavealpha($targetImage, true);
        $transparent = imagecolorallocatealpha($targetImage, 0, 0, 0, 127);
        imagefilledrectangle($targetImage, 0, 0, $targetWidth, $targetHeight, $transparent);

        imagecopyresampled(
            $targetImage,
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

        $tempBasePath = tempnam(sys_get_temp_dir(), 'imgopt_');
        if (!$tempBasePath) {
            imagedestroy($targetImage);
            imagedestroy($sourceImage);
            return null;
        }
        @unlink($tempBasePath);

        $outputExtension = $forceWebp ? 'webp' : ($sourceExtension === 'jpeg' ? 'jpg' : $sourceExtension);
        $tempOutputPath = $tempBasePath . '.' . $outputExtension;

        $saved = false;
        if ($outputExtension === 'webp') {
            $saved = @imagewebp($targetImage, $tempOutputPath, $quality);
        } elseif ($outputExtension === 'png') {
            $pngCompression = max(0, min(9, (int) round((100 - $quality) / 11)));
            $saved = @imagepng($targetImage, $tempOutputPath, $pngCompression);
        } else {
            $saved = @imagejpeg($targetImage, $tempOutputPath, $quality);
        }

        imagedestroy($targetImage);
        imagedestroy($sourceImage);

        if (!$saved || !is_file($tempOutputPath) || filesize($tempOutputPath) === 0) {
            @unlink($tempOutputPath);
            return null;
        }

        return $tempOutputPath;
    }

    private static function buildTargetRelativePath(string $directory, string $prefix, string $extension): string
    {
        $safeExtension = static::normalizeExtension($extension);
        if ($safeExtension === '') {
            $safeExtension = 'jpg';
        }

        $safePrefix = preg_replace('/[^A-Za-z0-9_-]/', '_', $prefix);
        $safePrefix = is_string($safePrefix) && $safePrefix !== '' ? $safePrefix : 'image';

        $filename = time() . '_' . $safePrefix . '_' . Str::random(12) . '.' . $safeExtension;

        return trim($directory, '/') . '/' . $filename;
    }

    private static function normalizeExtension(?string $extension): string
    {
        if (!is_string($extension)) {
            return '';
        }

        $normalized = strtolower(trim($extension));
        $normalized = preg_replace('/[^a-z0-9]/', '', $normalized);

        return is_string($normalized) ? $normalized : '';
    }

    private static function gdCanOptimize(): bool
    {
        return extension_loaded('gd')
            && function_exists('imagecreatetruecolor')
            && function_exists('imagecopyresampled')
            && function_exists('imagejpeg')
            && function_exists('imagepng')
            && function_exists('imagewebp');
    }

    private static function config(): array
    {
        return [
            'enabled' => static::envBool('PRODUCT_IMAGE_OPTIMIZE_UPLOADS', true),
            'force_webp' => static::envBool('PRODUCT_IMAGE_FORCE_WEBP', true),
            'quality' => static::envInt('PRODUCT_IMAGE_QUALITY', 80, 40, 95),
            'max_dimension' => static::envInt('PRODUCT_IMAGE_MAX_DIMENSION', 1800, 500, 5000),
            'max_megapixels' => static::envInt('PRODUCT_IMAGE_MAX_MEGAPIXELS', 24, 4, 120),
        ];
    }

    private static function envBool(string $key, bool $default): bool
    {
        $raw = env($key, $default);
        if (is_bool($raw)) {
            return $raw;
        }

        $normalized = strtolower((string) $raw);
        if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
            return true;
        }
        if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
            return false;
        }

        return $default;
    }

    private static function envInt(string $key, int $default, int $min, int $max): int
    {
        $raw = env($key, $default);
        $parsed = is_numeric($raw) ? (int) $raw : $default;
        if ($parsed < $min) {
            return $min;
        }
        if ($parsed > $max) {
            return $max;
        }

        return $parsed;
    }
}

