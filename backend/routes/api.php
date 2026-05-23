<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\SiteSettingController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\AdminCityController;
use App\Http\Controllers\Api\AdminSliderController;
use App\Http\Controllers\Api\FilterController;
use App\Http\Controllers\Api\AdminCustomerController;
use App\Http\Controllers\Api\NewsletterSubscriberController;
use App\Http\Controllers\Api\MediaController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes

Route::prefix('v1')->group(function () {
    // Utility route to link storage on cPanel
    Route::get('/link-storage', function () {
        $exitCode = \Illuminate\Support\Facades\Artisan::call('storage:link');
        return $exitCode === 0 
            ? '✅ Storage link created successfully!' 
            : '❌ Error creating storage link: ' . \Illuminate\Support\Facades\Artisan::output();
    });

    // Utility route to fix storage permissions and recreate symlink for cPanel 403 errors
    Route::get('/fix-storage-permissions', function () {
        $messages = [];
        
        // 1. Remove symlink so Apache falls back to Laravel for storage requests
        $publicStorage = public_path('storage');
        if (file_exists($publicStorage) || is_link($publicStorage)) {
            if (is_link($publicStorage)) {
                unlink($publicStorage);
                $messages[] = 'Removed existing storage symlink to bypass cPanel restrictions.';
            } else {
                $messages[] = 'Warning: public/storage exists but is not a symlink. Please rename or delete it manually via cPanel File Manager.';
            }
        } else {
            $messages[] = 'No symlink found. This is good.';
        }
        
        $messages[] = 'We are now serving images directly through Laravel routes.';
        
        return response()->json([
            'success' => true,
            'messages' => $messages,
            'instructions' => [
                '1. Check cPanel Hotlink Protection: Make sure it is disabled or that your site domain is in the allowed list.',
                '2. Check cPanel File Manager: Ensure the permissions for storage/app/public and its subfolders are set to 755.',
                '3. Check cPanel File Manager: Ensure the permissions for image files (.png, .webp) are set to 644.'
            ]
        ]);
    });

    // Authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

    // Admin Authentication routes
    Route::post('/admin/login', [AdminAuthController::class, 'login']);
    Route::post('/admin/logout', [AdminAuthController::class, 'logout'])->middleware('auth:sanctum');
    
    // Public product routes
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/featured', [ProductController::class, 'featured']);
    Route::get('/products/latest', [ProductController::class, 'latest']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/products/category/{category}', [ProductController::class, 'byCategory']);
    Route::get('/products/brand/{brand}', [ProductController::class, 'byBrand']);
    
    // Public category routes
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/main', [CategoryController::class, 'mainCategories']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::get('/categories/{category}/subcategories', [CategoryController::class, 'subcategories']);
    Route::get('/categories/{category}/filters', [CategoryController::class, 'filters']);
    
    // Public brand routes
    Route::get('/brands', [CategoryController::class, 'brands']);
    Route::get('/brands/{brand}', [CategoryController::class, 'showBrand']);
    
    // Public cities routes
    Route::get('/cities', function () {
        $cities = \App\Models\City::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();
        return response()->json(['data' => $cities]);
    });
    
    // Public site settings (for frontend)
    Route::get('/settings', [SiteSettingController::class, 'public']);
    Route::get('/analytics/visit', [SiteSettingController::class, 'trackVisit']);
    Route::get('/media/thumbnail', [MediaController::class, 'thumbnail']);
    
    // Public slider route (for frontend)
    Route::get('/slider', function () {
        $sliderItems = \App\Models\SliderItem::where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['data' => $sliderItems]);
    });
    
    // Contact form route
    Route::post('/contact', [ContactController::class, 'store']);
    Route::post('/newsletter/subscribe', [NewsletterSubscriberController::class, 'store']);
    
    // Cart routes (session-based for guests)
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{cart}', [CartController::class, 'update']);
    Route::delete('/cart/{cart}', [CartController::class, 'destroy']);
    Route::delete('/cart', [CartController::class, 'clear']);
    Route::get('/cart/summary', [CartController::class, 'summary']);
    
    // Review routes
    Route::get('/products/{product}/reviews', [ReviewController::class, 'index']);
    Route::post('/products/{product}/reviews', [ReviewController::class, 'store']);
    
    // Wishlist routes (session-based for guests)
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/{product}', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{product}', [WishlistController::class, 'destroy']);
    
    // Order routes (for checkout)
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    
    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        
        // User profile
        Route::get('/user', function (Request $request) {
            return $request->user();
        });
        Route::put('/user/profile', [AuthController::class, 'updateProfile']);
        
        // User orders
        Route::get('/user/orders', [OrderController::class, 'userOrders']);
        
        // User wishlist
        Route::get('/user/wishlist', [WishlistController::class, 'userWishlist']);
        Route::post('/user/wishlist/{product}', [WishlistController::class, 'addToWishlist']);
        Route::delete('/user/wishlist/{product}', [WishlistController::class, 'removeFromWishlist']);
        
        // User cart
        Route::get('/user/cart', [CartController::class, 'userCart']);
        Route::post('/user/cart', [CartController::class, 'addToCart']);
        Route::put('/user/cart/{cart}', [CartController::class, 'updateCartItem']);
        Route::delete('/user/cart/{cart}', [CartController::class, 'removeFromCart']);
        Route::delete('/user/cart', [CartController::class, 'clearUserCart']);
        
        // User reviews
        Route::get('/user/reviews', [ReviewController::class, 'userReviews']);
        Route::put('/reviews/{review}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
        
          // Admin routes
          Route::middleware('admin')->group(function () {

              // Dashboard
              Route::get('/admin/dashboard', [AdminDashboardController::class, 'dashboard']);
              Route::get('/admin/analytics', [AdminDashboardController::class, 'analytics']);

              // Admin Users Management (Admins)
              Route::get('/admin/users', [AdminUserController::class, 'index']);
              Route::post('/admin/users', [AdminUserController::class, 'store']);
              Route::get('/admin/users/{admin}', [AdminUserController::class, 'show']);
              Route::put('/admin/users/{admin}', [AdminUserController::class, 'update']);
              Route::delete('/admin/users/{admin}', [AdminUserController::class, 'destroy']);
              Route::get('/admin/roles', [AdminUserController::class, 'roles']);
              Route::get('/admin/permissions', [AdminUserController::class, 'permissions']);

              // Customer Management (Users)
              Route::get('/admin/customers', [AdminCustomerController::class, 'index']);
              Route::get('/admin/customers/{user}', [AdminCustomerController::class, 'show']);
              Route::post('/admin/customers/{user}/reset-password', [AdminCustomerController::class, 'resetPassword']);

              // Product management
              Route::get('/admin/products/import-template', [ProductController::class, 'exportImportTemplate']);
              Route::get('/admin/products/import-inbox', [ProductController::class, 'listImportInboxFiles']);
              Route::post('/admin/products/import-assets', [ProductController::class, 'uploadImportAssets']);
              Route::post('/admin/products/import/start', [ProductController::class, 'startImport']);
              Route::post('/admin/products/import/start-from-inbox', [ProductController::class, 'startImportFromInbox']);
              Route::post('/admin/products/import', [ProductController::class, 'importProducts']);
              Route::get('/admin/products/import/{productImport}', [ProductController::class, 'importStatus']);
              Route::post('/admin/products/bulk-discount', [ProductController::class, 'bulkApplyDiscount']);
              Route::post('/admin/products/bulk-status', [ProductController::class, 'bulkUpdateStatus']);
              Route::post('/admin/products/bulk-delete', [ProductController::class, 'bulkDestroy']);
              Route::post('/admin/products/bulk-offers', [ProductController::class, 'bulkUpdateOffers']);
              Route::get('/admin/products', [ProductController::class, 'adminIndex']);
              Route::get('/admin/products/{product}', [ProductController::class, 'adminShow']);
              Route::post('/admin/products', [ProductController::class, 'store']);
              Route::put('/admin/products/{product}', [ProductController::class, 'update']);
              Route::post('/admin/products/{product}', [ProductController::class, 'update']); // POST for file uploads with _method=PUT
              Route::delete('/admin/products/{product}', [ProductController::class, 'destroy']);
              Route::delete('/admin/variants/{variant}', [ProductController::class, 'destroyVariant']);

              // Category management
              Route::post('/admin/categories/bulk-delete', [CategoryController::class, 'bulkDestroy']);
              Route::get('/admin/categories', [CategoryController::class, 'adminIndex']);
              Route::get('/admin/categories/{category}', [CategoryController::class, 'adminShow']);
              Route::post('/admin/categories', [CategoryController::class, 'store']);
              Route::put('/admin/categories/{category}', [CategoryController::class, 'update']);
              Route::post('/admin/categories/{category}', [CategoryController::class, 'update']); // For FormData with _method=PUT
              Route::delete('/admin/categories/{category}', [CategoryController::class, 'destroy']);
              Route::put('/admin/categories/{category}/filters', [CategoryController::class, 'updateFilters']);
              Route::put('/admin/categories/{category}/filters-sync', [CategoryController::class, 'syncFilters']);
              Route::apiResource('/admin/filters', FilterController::class);

              // Brand management
              Route::get('/admin/brands', [AdminController::class, 'brands']);
              Route::get('/admin/brands/{brand}', [AdminController::class, 'showBrand']);
              Route::post('/admin/brands', [AdminController::class, 'storeBrand']);
              Route::post('/admin/brands/{brand}', [AdminController::class, 'updateBrand']); // For FormData with _method=PUT
              Route::put('/admin/brands/{brand}', [AdminController::class, 'updateBrand']);
              Route::delete('/admin/brands/{brand}', [AdminController::class, 'destroyBrand']);

              // City management
              Route::get('/admin/cities', [AdminCityController::class, 'index']);
              Route::post('/admin/cities', [AdminCityController::class, 'store']);
              Route::get('/admin/cities/{city}', [AdminCityController::class, 'show']);
              Route::put('/admin/cities/{city}', [AdminCityController::class, 'update']);
              Route::delete('/admin/cities/{city}', [AdminCityController::class, 'destroy']);

              // Slider management
              Route::get('/admin/slider', [AdminSliderController::class, 'index']);
              Route::post('/admin/slider', [AdminSliderController::class, 'store']);
              Route::get('/admin/slider/{sliderItem}', [AdminSliderController::class, 'show']);
              Route::post('/admin/slider/{sliderItem}', [AdminSliderController::class, 'update']); // For FormData with _method=PUT
              Route::put('/admin/slider/{sliderItem}', [AdminSliderController::class, 'update']);
              Route::delete('/admin/slider/{sliderItem}', [AdminSliderController::class, 'destroy']);

              // Order management
              Route::get('/admin/orders', [AdminController::class, 'orders']);
              Route::get('/admin/orders/export', [AdminController::class, 'exportOrders']);
              Route::get('/admin/orders/export-detailed', [AdminController::class, 'exportDetailedOrders']);
              Route::post('/admin/orders', [AdminController::class, 'createOrder']);
              Route::get('/admin/orders/new-count', [AdminController::class, 'newOrdersCount']);
              Route::get('/admin/orders/{order}', [AdminController::class, 'showOrder']);
              Route::post('/admin/orders/{order}/send-customer-email', [AdminController::class, 'sendOrderCustomerEmail']);
              Route::put('/admin/orders/{order}', [AdminController::class, 'updateOrder']);
              Route::delete('/admin/orders/{order}', [AdminController::class, 'deleteOrder']);

              // Site Settings management
              Route::get('/admin/settings', [SiteSettingController::class, 'index']);
              Route::post('/admin/settings/bulk-update', [SiteSettingController::class, 'bulkUpdate']);
              Route::post('/admin/settings/upload-image', [SiteSettingController::class, 'uploadImageGeneral']);
              Route::post('/admin/settings/{key}/upload-image', [SiteSettingController::class, 'uploadImage']);
              Route::get('/admin/settings/{key}', [SiteSettingController::class, 'show']);
              Route::put('/admin/settings/{key}', [SiteSettingController::class, 'update']);

              // Review management
              Route::get('/admin/reviews', [AdminController::class, 'reviews']);
              Route::put('/admin/reviews/{review}', [AdminController::class, 'updateReview']);
              Route::delete('/admin/reviews/{review}', [AdminController::class, 'destroyReview']);

              // Offer management
              Route::get('/admin/offers', [OfferController::class, 'adminIndex']);
              Route::post('/admin/offers', [OfferController::class, 'store']);
              Route::get('/admin/offers/{offer}', [OfferController::class, 'show']);
              Route::put('/admin/offers/{offer}', [OfferController::class, 'update']);
              Route::post('/admin/offers/{offer}', [OfferController::class, 'update']); // For FormData with _method=PUT
              Route::delete('/admin/offers/{offer}', [OfferController::class, 'destroy']);

              // Contact messages management
              Route::get('/admin/contact-messages', [ContactController::class, 'index']);
              Route::get('/admin/contact-messages/{id}', [ContactController::class, 'show']);
              Route::put('/admin/contact-messages/{id}/status', [ContactController::class, 'updateStatus']);
              Route::delete('/admin/contact-messages/{id}', [ContactController::class, 'destroy']);

              // Newsletter subscribers management
              Route::get('/admin/newsletter-subscribers', [NewsletterSubscriberController::class, 'index']);
              Route::get('/admin/newsletter-subscribers-export', [NewsletterSubscriberController::class, 'export']);
              Route::get('/admin/newsletter-subscribers/{id}', [NewsletterSubscriberController::class, 'show']);
              Route::put('/admin/newsletter-subscribers/{id}/status', [NewsletterSubscriberController::class, 'updateStatus']);
              Route::delete('/admin/newsletter-subscribers/{id}', [NewsletterSubscriberController::class, 'destroy']);
          });
    });

    // Public offers route
    Route::get('/offers', [OfferController::class, 'index']);
});
