<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\SitemapController;
use App\Support\MediaUrl;
use App\Models\SiteSetting;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Product;
use App\Models\Order;
use App\Mail\OrderPlacedMail;

Route::get('/', function () {
    return view('welcome');
});

// Sitemap route
Route::get('/sitemap.xml', [SitemapController::class, 'index']);

// Fallback route to serve storage files directly (Bypasses cPanel symlink restrictions)
Route::get('storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);

    if (!file_exists($fullPath)) {
        return response('File not found at: ' . $fullPath, 404);
    }

    $mime = mime_content_type($fullPath) ?: 'application/octet-stream';
    
    return response()->file($fullPath, [
        'Content-Type' => $mime,
        'Cache-Control' => 'public, max-age=31536000'
    ]);
})->where('path', '.*');

/**
 * Temporary route to trigger specific migrations when CLI access is unavailable.
 * Secure it with an environment token: set MIGRATION_HTTP_TOKEN in .env (same as the ?token= value).
 * Example: /maintenance/run-migrations?token=SECRET123
 */
Route::post('/maintenance/run-migrations', function (Request $request) {
    $token = env('MIGRATION_HTTP_TOKEN');
    if (!$token || $request->query('token') !== $token) {
        abort(403, 'Unauthorized');
    }

    $paths = [
        'database/migrations/2026_04_06_000100_fix_about_story_content.php',
        'database/migrations/2026_04_06_120000_make_about_story_content_text.php',
        'database/migrations/2026_04_06_123000_add_about_story_image.php',
    ];

    $results = [];
    foreach ($paths as $path) {
        Artisan::call('migrate', [
            '--path'  => $path,
            '--force' => true,
        ]);
        $results[$path] = Artisan::output();
    }

    return response()->json([
        'message' => 'Migrations executed',
        'ran'     => $paths,
        'output'  => $results,
    ]);
});

/**
 * Temporary route to clear config cache when CLI access is unavailable.
 * Secure it with an environment token: set CONFIG_CLEAR_HTTP_TOKEN in .env (same as the ?token= value).
 * Example: /maintenance/clear-config?token=SECRET123
 */
Route::match(['GET', 'POST'], '/maintenance/clear-config', function (Request $request) {
    $token = env('CONFIG_CLEAR_HTTP_TOKEN');

    if (!$token || $request->query('token') !== $token) {
        abort(403, 'Unauthorized');
    }

    Artisan::call('config:clear');

    return response()->json([
        'message' => 'Config cache cleared successfully',
        'output' => trim(Artisan::output()),
    ]);
});

/**
 * Temporary route to run cache-related artisan commands when CLI access is unavailable.
 * Secure it with an environment token: set ARTISAN_CACHE_HTTP_TOKEN in .env (same as the ?token= value).
 * Example: /maintenance/cache-artisan?token=SECRET123
 *
 * Note: route:cache will fail while closure routes still exist in the application.
 */
Route::match(['GET', 'POST'], '/maintenance/cache-artisan', function (Request $request) {
    $token = env('ARTISAN_CACHE_HTTP_TOKEN');

    if (!$token || $request->query('token') !== $token) {
        abort(403, 'Unauthorized');
    }

    $commands = [
        'config:cache',
        'route:cache',
        'view:cache',
        'config:clear',
    ];

    $results = [];
    $hasFailures = false;

    foreach ($commands as $command) {
        try {
            $exitCode = Artisan::call($command);
            $output = trim(Artisan::output());

            $results[] = [
                'command' => $command,
                'ok' => $exitCode === 0,
                'exit_code' => $exitCode,
                'output' => $output,
            ];

            if ($exitCode !== 0) {
                $hasFailures = true;
            }
        } catch (\Throwable $e) {
            $hasFailures = true;

            $results[] = [
                'command' => $command,
                'ok' => false,
                'exit_code' => 1,
                'output' => $e->getMessage(),
            ];
        }
    }

    return response()->json([
        'message' => $hasFailures
            ? 'One or more artisan cache commands failed'
            : 'Artisan cache commands executed successfully',
        'results' => $results,
    ], $hasFailures ? 500 : 200);
});

/**
 * Temporary route to verify writing to the dedicated order email log file.
 * Example: /maintenance/test-order-email-log
 */
Route::match(['GET', 'POST'], '/maintenance/test-order-email-log', function (Request $request) {
    $logDirectory = storage_path('logs');
    $logPath = storage_path('logs/order-email.log');

    try {
        Log::build([
            'driver' => 'single',
            'path' => $logPath,
            'level' => 'debug',
            'replace_placeholders' => true,
        ])->info('Order email log write test', [
            'timestamp' => now()->toDateTimeString(),
            'route' => $request->path(),
            'ip' => $request->ip(),
        ]);

        clearstatcache(true, $logPath);

        return response()->json([
            'message' => 'Order email log write test completed successfully',
            'log_directory' => $logDirectory,
            'log_directory_exists' => is_dir($logDirectory),
            'log_directory_writable' => is_writable($logDirectory),
            'log_file' => $logPath,
            'log_file_exists' => file_exists($logPath),
            'log_file_writable' => file_exists($logPath) ? is_writable($logPath) : null,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'message' => 'Failed to write to order email log',
            'log_directory' => $logDirectory,
            'log_directory_exists' => is_dir($logDirectory),
            'log_directory_writable' => is_writable($logDirectory),
            'log_file' => $logPath,
            'log_file_exists' => file_exists($logPath),
            'error' => $e->getMessage(),
        ], 500);
    }
});

/**
 * Temporary route to send a simple test email when CLI access is unavailable.
 * Secure it with an environment token: set MAIL_TEST_HTTP_TOKEN in .env (same as the ?token= value).
 * Example: /maintenance/test-mail?token=SECRET123&to=name@example.com
 */
Route::match(['GET', 'POST'], '/maintenance/test-mail', function (Request $request) {
    $token = env('MAIL_TEST_HTTP_TOKEN');

    if (!$token || $request->query('token') !== $token) {
        abort(403, 'Unauthorized');
    }

    $to = $request->query('to', env('MAIL_FROM_ADDRESS'));

    if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return response()->json([
            'message' => 'A valid recipient email is required',
        ], 422);
    }

    try {
        Mail::raw(
            "This is a test email from Ropita.\nSent at: " . now()->toDateTimeString() . "\nMailer: " . config('mail.default'),
            function ($message) use ($to) {
                $message
                    ->to($to)
                    ->subject('Ropita Test Email');
            }
        );

        return response()->json([
            'message' => 'Test email sent successfully',
            'to' => $to,
            'mail' => [
                'default' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'scheme' => config('mail.mailers.smtp.scheme'),
                'username' => config('mail.mailers.smtp.username'),
                'from' => config('mail.from.address'),
            ],
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'message' => 'Failed to send test email',
            'to' => $to,
            'error' => $e->getMessage(),
            'mail' => [
                'default' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'scheme' => config('mail.mailers.smtp.scheme'),
                'username' => config('mail.mailers.smtp.username'),
                'from' => config('mail.from.address'),
            ],
        ], 500);
    }
});

/**
 * Temporary route to send the real order mailable for diagnostics.
 * Secure it with an environment token: set ORDER_MAIL_TEST_HTTP_TOKEN in .env.
 * Example: /maintenance/test-order-mail?token=SECRET123&order_id=27&to=name@example.com&type=customer
 */
Route::match(['GET', 'POST'], '/maintenance/test-order-mail', function (Request $request) {
    $token = env('ORDER_MAIL_TEST_HTTP_TOKEN');

    if (!$token || $request->query('token') !== $token) {
        abort(403, 'Unauthorized');
    }

    $orderId = (int) $request->query('order_id');
    $to = $request->query('to');
    $type = $request->query('type', 'customer');

    if (!$orderId) {
        return response()->json([
            'message' => 'order_id is required',
        ], 422);
    }

    if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return response()->json([
            'message' => 'A valid recipient email is required',
        ], 422);
    }

    if (!in_array($type, ['customer', 'admin'], true)) {
        return response()->json([
            'message' => 'type must be customer or admin',
        ], 422);
    }

    $order = Order::with(['items.product.images', 'items.productVariant'])->find($orderId);

    if (!$order) {
        return response()->json([
            'message' => 'Order not found',
        ], 404);
    }

    try {
        Mail::to($to)->send(new OrderPlacedMail($order, $type));

        return response()->json([
            'message' => 'Order mailable sent successfully',
            'to' => $to,
            'type' => $type,
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'customer_email' => $order->customer_email,
            'mail' => [
                'default' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'scheme' => config('mail.mailers.smtp.scheme'),
                'username' => config('mail.mailers.smtp.username'),
                'from' => config('mail.from.address'),
            ],
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'message' => 'Failed to send order mailable',
            'to' => $to,
            'type' => $type,
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'customer_email' => $order->customer_email,
            'error' => $e->getMessage(),
            'mail' => [
                'default' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'scheme' => config('mail.mailers.smtp.scheme'),
                'username' => config('mail.mailers.smtp.username'),
                'from' => config('mail.from.address'),
            ],
        ], 500);
    }
});

/**
 * Temporary route to normalize image paths stored in the database.
 * Secure it with an environment token: set MEDIA_NORMALIZE_HTTP_TOKEN in .env (same as the ?token= value).
 * Example: /maintenance/normalize-media-paths?token=SECRET123
 */
Route::match(['GET', 'POST'], '/maintenance/normalize-media-paths', function (Request $request) {
    $token = env('MEDIA_NORMALIZE_HTTP_TOKEN');

    if (!$token || $request->query('token') !== $token) {
        abort(403, 'Unauthorized');
    }

    $updated = [
        'site_settings' => 0,
        'brands' => 0,
        'categories' => 0,
        'products_cover_image' => 0,
        'products_images' => 0,
        'products_size_guide_images' => 0,
        'product_variants_images' => 0,
    ];

    DB::transaction(function () use (&$updated) {
        $siteSettings = DB::table('site_settings')->whereIn('key', ['header_logo'])->get();
        foreach ($siteSettings as $setting) {
            $normalized = MediaUrl::normalizeStoredPath($setting->value);
            if ($normalized !== $setting->value && $normalized !== null) {
                DB::table('site_settings')->where('id', $setting->id)->update(['value' => '/storage/' . ltrim($normalized, '/')]);
                $updated['site_settings']++;
            }
        }

        $brands = DB::table('brands')->select('id', 'logo')->get();
        foreach ($brands as $brand) {
            $normalized = MediaUrl::normalizeStoredPath($brand->logo);
            if ($normalized !== $brand->logo && $normalized !== null) {
                DB::table('brands')->where('id', $brand->id)->update(['logo' => '/storage/' . ltrim($normalized, '/')]);
                $updated['brands']++;
            }
        }

        $categories = DB::table('categories')->select('id', 'image')->get();
        foreach ($categories as $category) {
            $normalized = MediaUrl::normalizeStoredPath($category->image);
            if ($normalized !== $category->image && $normalized !== null) {
                DB::table('categories')->where('id', $category->id)->update(['image' => '/storage/' . ltrim($normalized, '/')]);
                $updated['categories']++;
            }
        }

        $products = DB::table('products')->select('id', 'cover_image', 'images', 'size_guide_images')->get();
        foreach ($products as $product) {
            $changes = [];

            $normalizedCover = MediaUrl::normalizeStoredPath($product->cover_image);
            if ($normalizedCover !== null && $normalizedCover !== $product->cover_image) {
                $changes['cover_image'] = '/storage/' . ltrim($normalizedCover, '/');
                $updated['products_cover_image']++;
            }

            $images = json_decode((string) $product->images, true);
            if (is_array($images)) {
                $newImages = array_map(function ($image) {
                    if (is_string($image)) {
                        $normalized = MediaUrl::normalizeStoredPath($image);
                        return $normalized ? '/storage/' . ltrim($normalized, '/') : $image;
                    }

                    if (is_array($image)) {
                        if (isset($image['image_path'])) {
                            $normalizedPath = MediaUrl::normalizeStoredPath($image['image_path']);
                            if ($normalizedPath) {
                                $image['image_path'] = $normalizedPath;
                            }
                        }
                        if (isset($image['image_url'])) {
                            $normalizedUrl = MediaUrl::normalizeStoredPath($image['image_url']);
                            if ($normalizedUrl) {
                                $image['image_url'] = '/storage/' . ltrim($normalizedUrl, '/');
                            }
                        }
                    }

                    return $image;
                }, $images);

                if ($newImages !== $images) {
                    $changes['images'] = json_encode($newImages, JSON_UNESCAPED_UNICODE);
                    $updated['products_images']++;
                }
            }

            $sizeGuideImages = json_decode((string) $product->size_guide_images, true);
            if (is_array($sizeGuideImages)) {
                $newSizeGuideImages = array_map(function ($image) {
                    if (is_string($image)) {
                        $normalized = MediaUrl::normalizeStoredPath($image);
                        return $normalized ? '/storage/' . ltrim($normalized, '/') : $image;
                    }

                    if (is_array($image)) {
                        if (isset($image['image_path'])) {
                            $normalizedPath = MediaUrl::normalizeStoredPath($image['image_path']);
                            if ($normalizedPath) {
                                $image['image_path'] = $normalizedPath;
                            }
                        }
                        if (isset($image['image_url'])) {
                            $normalizedUrl = MediaUrl::normalizeStoredPath($image['image_url']);
                            if ($normalizedUrl) {
                                $image['image_url'] = '/storage/' . ltrim($normalizedUrl, '/');
                            }
                        }
                    }

                    return $image;
                }, $sizeGuideImages);

                if ($newSizeGuideImages !== $sizeGuideImages) {
                    $changes['size_guide_images'] = json_encode($newSizeGuideImages, JSON_UNESCAPED_UNICODE);
                    $updated['products_size_guide_images']++;
                }
            }

            if (!empty($changes)) {
                DB::table('products')->where('id', $product->id)->update($changes);
            }
        }

        $variants = DB::table('product_variants')->select('id', 'images')->get();
        foreach ($variants as $variant) {
            $images = json_decode((string) $variant->images, true);
            if (!is_array($images)) {
                continue;
            }

            $newImages = array_map(function ($image) {
                if (is_string($image)) {
                    $normalized = MediaUrl::normalizeStoredPath($image);
                    return $normalized ? '/storage/' . ltrim($normalized, '/') : $image;
                }

                if (is_array($image) && isset($image['image_url'])) {
                    $normalized = MediaUrl::normalizeStoredPath($image['image_url']);
                    if ($normalized) {
                        $image['image_url'] = '/storage/' . ltrim($normalized, '/');
                    }
                }

                return $image;
            }, $images);

            if ($newImages !== $images) {
                DB::table('product_variants')->where('id', $variant->id)->update([
                    'images' => json_encode($newImages, JSON_UNESCAPED_UNICODE),
                ]);
                $updated['product_variants_images']++;
            }
        }
    });

    return response()->json([
        'message' => 'Media paths normalized successfully',
        'updated' => $updated,
    ]);
});

/**
 * Temporary route to inspect normalized media URLs from DB/API perspective.
 * Secure it with an environment token: set MEDIA_INSPECT_HTTP_TOKEN in .env (same as the ?token= value).
 * Example: /maintenance/inspect-media-links?token=SECRET123
 */
Route::match(['GET', 'POST'], '/maintenance/inspect-media-links', function (Request $request) {
    $token = env('MEDIA_INSPECT_HTTP_TOKEN');

    if (!$token || $request->query('token') !== $token) {
        abort(403, 'Unauthorized');
    }

    $headerLogo = SiteSetting::where('key', 'header_logo')->value('value');

    $category = Category::query()
        ->whereNotNull('image')
        ->where('image', '!=', '')
        ->first();

    $brand = Brand::query()
        ->whereNotNull('logo')
        ->where('logo', '!=', '')
        ->first();

    $requestedProductId = $request->query('product_id');
    $productQuery = Product::query();

    if ($requestedProductId) {
        $productQuery->where('id', $requestedProductId);
    } else {
        $productQuery->where(function ($query) {
            $query->whereNotNull('cover_image')
                ->orWhereNotNull('images');
        });
    }

    $product = $productQuery->first();

    $order = Order::query()
        ->with(['items.product'])
        ->latest()
        ->first();

    $productImages = [];
    if ($product && is_array($product->images)) {
        $productImages = collect($product->images)->map(function ($image) {
            if (is_string($image)) {
                return [
                    'stored' => $image,
                    'normalized' => MediaUrl::normalizeStoredPath($image),
                    'public' => MediaUrl::publicUrl($image),
                ];
            }

            if (is_array($image)) {
                $source = $image['image_url'] ?? $image['image_path'] ?? null;
                return [
                    'stored' => $source,
                    'normalized' => MediaUrl::normalizeStoredPath($source),
                    'public' => MediaUrl::publicUrl($source),
                ];
            }

            return null;
        })->filter()->values()->all();
    }

    $orderItemImages = [];
    if ($order) {
        $orderItemImages = $order->items->map(function ($item) {
            $source = null;

            if ($item->product) {
                $source = $item->product->cover_image;
                if (!$source && is_array($item->product->images) && !empty($item->product->images[0])) {
                    $first = $item->product->images[0];
                    $source = is_array($first)
                        ? ($first['image_url'] ?? $first['image_path'] ?? null)
                        : $first;
                }
            }

            return [
                'order_item_id' => $item->id,
                'product_name' => $item->product_name,
                'stored' => $source,
                'normalized' => MediaUrl::normalizeStoredPath($source),
                'public' => MediaUrl::publicUrl($source),
            ];
        })->values()->all();
    }

    return response()->json([
        'message' => 'Media link inspection generated successfully',
        'env' => [
            'frontend_url' => env('FRONTEND_URL'),
            'backend_public_url' => env('BACKEND_PUBLIC_URL'),
            'app_url' => config('app.url'),
        ],
        'site_logo' => [
            'stored' => $headerLogo,
            'normalized' => MediaUrl::normalizeStoredPath($headerLogo),
            'public' => MediaUrl::publicUrl($headerLogo),
        ],
        'category' => $category ? [
            'id' => $category->id,
            'name' => $category->name,
            'stored' => $category->image,
            'normalized' => MediaUrl::normalizeStoredPath($category->image),
            'public' => MediaUrl::publicUrl($category->image),
        ] : null,
        'brand' => $brand ? [
            'id' => $brand->id,
            'name' => $brand->name,
            'stored' => $brand->logo,
            'normalized' => MediaUrl::normalizeStoredPath($brand->logo),
            'public' => MediaUrl::publicUrl($brand->logo),
        ] : null,
        'product' => $product ? [
            'id' => $product->id,
            'name' => $product->name,
            'cover_image' => [
                'stored' => $product->cover_image,
                'normalized' => MediaUrl::normalizeStoredPath($product->cover_image),
                'public' => MediaUrl::publicUrl($product->cover_image),
            ],
            'images' => $productImages,
        ] : null,
        'latest_order' => $order ? [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'items' => $orderItemImages,
        ] : null,
    ]);
});

// Debug fallback route to see what path Laravel is trying to match
Route::fallback(function () {
    return response("Laravel 404 Debug. Requested Path: " . request()->path(), 404);
});
