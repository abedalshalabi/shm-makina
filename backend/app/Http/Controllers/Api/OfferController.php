<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OfferResource;
use App\Models\Offer;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OfferController extends Controller
{
    /**
     * Get all active offers (for public)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Offer::query();

            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Only get active offers
            $now = now();
            $query->where('is_active', true)
                  ->where('starts_at', '<=', $now)
                  ->where('ends_at', '>=', $now);

            // Order by sort_order and created_at
            $query->orderBy('sort_order', 'asc')
                  ->orderBy('created_at', 'desc');

            $offers = $query->get();
            $offerData = OfferResource::collection($offers)->toArray($request);

            $specialProducts = Product::where('show_in_offers', true)
                ->where('is_active', true)
                ->with(['brand', 'categories', 'variants' => function($q) {
                    $q->where(function($sq) {
                        $sq->whereNotNull('price')->orWhere('price', '>', 0);
                    });
                }])
                ->get();

            foreach ($specialProducts as $product) {
                // Determine starting price and stock from variants if available
                $displayPrice = (float) $product->price;
                $displayOriginalPrice = $product->original_price ? (float) $product->original_price : null;
                $displayStock = $product->manage_stock ? $product->stock_quantity : null;

                $hasDifferentPrices = false;
                if ($product->variants && $product->variants->isNotEmpty()) {
                    $bestVariant = $product->variants->sortBy('price')->first();
                    if ($bestVariant) {
                        $displayPrice = (float) $bestVariant->price;
                        // For variants, we usually compare against base original_price if variant doesn't have its own
                        $displayStock = (int) $bestVariant->stock_quantity;

                        // Check for price variation
                        $uniquePricesCount = $product->variants->where('price', '>', 0)->pluck('price')->unique()->count();
                        if ($uniquePricesCount > 1) {
                            $hasDifferentPrices = true;
                        }
                    }
                }

                // Determine image
                $firstImage = null;
                if ($product->cover_image) {
                    $firstImage = $product->cover_image;
                } elseif ($product->images && is_array($product->images) && count($product->images) > 0) {
                    $firstImageObj = $product->images[0];
                    if (is_string($firstImageObj)) {
                        $firstImage = $firstImageObj;
                    } elseif (is_array($firstImageObj) && isset($firstImageObj['image_url'])) {
                        $firstImage = $firstImageObj['image_url'];
                    }
                }

                // Append virtual offer
                $offerData[] = [
                    'id' => 1000000 + $product->id, // Offset ID to avoid conflicts
                    'title' => $product->name,
                    'description' => $product->short_description ?: $product->name,
                    'type' => 'weekly_deal',
                    'image' => $firstImage,
                    'discount_percentage' => $product->discount_percentage ? (float) $product->discount_percentage : null,
                    'fixed_discount' => null,
                    'starts_at' => now()->toIso8601String(),
                    'ends_at' => now()->addYears(1)->toIso8601String(),
                    'is_active' => true,
                    'sort_order' => 100,
                    'products' => [
                        [
                            'id' => $product->id,
                            'name' => $product->name,
                            'slug' => $product->slug,
                            'price' => $displayPrice,
                            'original_price' => $displayOriginalPrice,
                            'image' => $firstImage,
                            'brand' => $product->brand ? $product->brand->name : null,
                            'rating' => (float) $product->rating,
                            'reviews_count' => $product->reviews_count,
                            'has_different_prices' => $hasDifferentPrices,
                            'has_variants' => $product->variants && $product->variants->isNotEmpty(),
                            'filter_values' => $product->filter_values ?: [],
                        ]
                    ],
                    'bundle_items' => [],
                    'bundle_price' => null,
                    'original_bundle_price' => null,
                    'stock_limit' => $displayStock,
                    'sold_count' => $product->sales_count ?? 0,
                    'is_currently_active' => true,
                    'remaining_time' => 3600 * 24 * 365, // 1 year
                    'progress_percentage' => 0,
                    'created_at' => $product->created_at,
                    'updated_at' => $product->updated_at,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $offerData,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching offers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'فشل في جلب العروض',
            ], 500);
        }
    }

    /**
     * Get all offers (for admin)
     */
    public function adminIndex(Request $request): JsonResponse
    {
        try {
            $query = Offer::query();

            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // Filter by active status
            if ($request->has('is_active')) {
                $query->where('is_active', $request->is_active);
            }

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Order by sort_order and created_at
            $query->orderBy('sort_order', 'asc')
                  ->orderBy('created_at', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 15);
            $offers = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => OfferResource::collection($offers->items()),
                'pagination' => [
                    'current_page' => $offers->currentPage(),
                    'last_page' => $offers->lastPage(),
                    'per_page' => $offers->perPage(),
                    'total' => $offers->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching offers (admin): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'فشل في جلب العروض',
            ], 500);
        }
    }

    /**
     * Get single offer
     */
    public function show($id): JsonResponse
    {
        try {
            $offer = Offer::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => new OfferResource($offer),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'العرض غير موجود',
            ], 404);
        }
    }

    /**
     * Create new offer
     */
    public function store(Request $request): JsonResponse
    {
        // Prepare data for validation - decode JSON strings if present
        $requestData = $request->all();
        
        // Convert boolean strings to actual booleans
        if (isset($requestData['is_active'])) {
            if (is_string($requestData['is_active'])) {
                $boolValue = strtolower($requestData['is_active']);
                $requestData['is_active'] = ($boolValue === 'true' || $boolValue === '1' || $boolValue === 'on');
            }
        }
        
        // Decode JSON strings for products and bundle_items
        if ($request->has('products') && is_string($request->products)) {
            $decoded = json_decode($request->products, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $requestData['products'] = $decoded;
            }
        }
        
        if ($request->has('bundle_items') && is_string($request->bundle_items)) {
            $decoded = json_decode($request->bundle_items, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $requestData['bundle_items'] = $decoded;
            }
        }

        $validator = Validator::make($requestData, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:flash_deal,weekly_deal,bundle',
            'image' => 'nullable|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'fixed_discount' => 'nullable|numeric|min:0',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after_or_equal:starts_at',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'products' => 'nullable|array',
            'products.*' => 'integer|exists:products,id',
            'bundle_items' => 'nullable|array',
            'bundle_items.*.product_id' => 'required_with:bundle_items|integer|exists:products,id',
            'bundle_items.*.quantity' => 'required_with:bundle_items|integer|min:1',
            'bundle_price' => 'nullable|numeric|min:0',
            'original_bundle_price' => 'nullable|numeric|min:0',
            'stock_limit' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في البيانات المدخلة',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $validator->validated();

            // Handle image upload
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('offers', $filename, 'public');
                $data['image'] = asset('storage/' . $path);
            }

            // is_active is already converted to boolean during validation preparation
            
            // Ensure JSON fields are properly formatted
            // Laravel will automatically encode to JSON via $casts in Model
            // No need to manually encode - Laravel handles it cleanly without escaping
            if (isset($data['products'])) {
                if (is_string($data['products'])) {
                    // Decode JSON string to array (from FormData)
                    $data['products'] = json_decode($data['products'], true);
                }
                // Keep as array - Laravel will encode automatically
            }
            
            if (isset($data['bundle_items'])) {
                if (is_string($data['bundle_items'])) {
                    // Decode JSON string to array (from FormData)
                    $data['bundle_items'] = json_decode($data['bundle_items'], true);
                }
                // Keep as array - Laravel will encode automatically
            }

            $offer = Offer::create($data);

            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء العرض بنجاح',
                'data' => new OfferResource($offer),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating offer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'فشل في إنشاء العرض',
            ], 500);
        }
    }

    /**
     * Update offer
     */
    public function update(Request $request, $id): JsonResponse
    {
        $offer = Offer::findOrFail($id);

        // Prepare data for validation - decode JSON strings if present
        $requestData = $request->all();
        
        // Convert boolean strings to actual booleans
        if (isset($requestData['is_active'])) {
            if (is_string($requestData['is_active'])) {
                $boolValue = strtolower($requestData['is_active']);
                $requestData['is_active'] = ($boolValue === 'true' || $boolValue === '1' || $boolValue === 'on');
            }
        }
        
        // Decode JSON strings for products and bundle_items
        if ($request->has('products') && is_string($request->products)) {
            $decoded = json_decode($request->products, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $requestData['products'] = $decoded;
            }
        }
        
        if ($request->has('bundle_items') && is_string($request->bundle_items)) {
            $decoded = json_decode($request->bundle_items, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $requestData['bundle_items'] = $decoded;
            }
        }

        // Build validation rules dynamically based on type
        $rules = [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|required|in:flash_deal,weekly_deal,bundle',
            'image' => 'nullable|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'fixed_discount' => 'nullable|numeric|min:0',
            'starts_at' => 'sometimes|required|date',
            'ends_at' => 'sometimes|required|date|after_or_equal:starts_at',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'stock_limit' => 'nullable|integer|min:0',
        ];
        
        // Add type-specific rules
        $type = $requestData['type'] ?? $offer->type;
        if ($type === 'bundle') {
            // For bundle, bundle_items is optional on update (to preserve existing items)
            $rules['bundle_items'] = 'nullable|array';
            $rules['bundle_items.*.product_id'] = 'required_with:bundle_items|integer|exists:products,id';
            $rules['bundle_items.*.quantity'] = 'required_with:bundle_items|integer|min:1';
            $rules['bundle_price'] = 'nullable|numeric|min:0';
            $rules['original_bundle_price'] = 'nullable|numeric|min:0';
        } else {
            // For non-bundle, products is optional on update (to preserve existing products)
            $rules['products'] = 'nullable|array';
            $rules['products.*'] = 'integer|exists:products,id';
        }

        $validator = Validator::make($requestData, $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في البيانات المدخلة',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $validator->validated();

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($offer->image && strpos($offer->image, 'storage/') !== false) {
                    $oldPath = str_replace(asset('storage/'), '', $offer->image);
                    Storage::disk('public')->delete($oldPath);
                }

                $file = $request->file('image');
                $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('offers', $filename, 'public');
                $data['image'] = asset('storage/' . $path);
            }

            // is_active is already converted to boolean during validation preparation
            
            // Ensure JSON fields are properly formatted based on type
            // Laravel will automatically encode to JSON via $casts in Model
            $finalType = $data['type'] ?? $offer->type;
            $isTypeChanging = isset($data['type']) && $data['type'] !== $offer->type;
            
            if ($finalType === 'bundle') {
                // For bundle, process bundle_items
                if (isset($data['bundle_items'])) {
                    if (is_string($data['bundle_items'])) {
                        // Decode JSON string to array
                        $data['bundle_items'] = json_decode($data['bundle_items'], true);
                    }
                    if (is_array($data['bundle_items']) && count($data['bundle_items']) > 0) {
                        // Has items, keep as array (Laravel will encode automatically)
                        // No need to encode manually
                    } else {
                        // Empty array - preserve existing items (don't update)
                        unset($data['bundle_items']);
                    }
                } else {
                    // Not provided - preserve existing items (don't update)
                    unset($data['bundle_items']);
                }
                
                // Handle products based on type change
                if ($isTypeChanging && $offer->type !== 'bundle') {
                    // Changing to bundle from non-bundle - clear products
                    $data['products'] = null;
                } else {
                    // Not changing type or already bundle - don't touch products
                    unset($data['products']);
                }
            } else {
                // For flash_deal or weekly_deal, process products
                if (isset($data['products'])) {
                    if (is_string($data['products'])) {
                        // Decode JSON string to array
                        $data['products'] = json_decode($data['products'], true);
                    }
                    if (is_array($data['products']) && count($data['products']) > 0) {
                        // Has products, keep as array (Laravel will encode automatically)
                        // No need to encode manually
                    } else {
                        // Empty array - preserve existing products (don't update)
                        unset($data['products']);
                    }
                } else {
                    // Not provided - preserve existing products (don't update)
                    unset($data['products']);
                }
                
                // Handle bundle fields based on type change
                if ($isTypeChanging && $offer->type === 'bundle') {
                    // Changing from bundle to non-bundle - clear bundle fields
                    $data['bundle_items'] = null;
                    $data['bundle_price'] = null;
                    $data['original_bundle_price'] = null;
                } else {
                    // Not changing type or not bundle - don't touch bundle fields
                    unset($data['bundle_items']);
                    unset($data['bundle_price']);
                    unset($data['original_bundle_price']);
                }
            }

            $offer->update($data);

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث العرض بنجاح',
                'data' => new OfferResource($offer),
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating offer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'فشل في تحديث العرض',
            ], 500);
        }
    }

    /**
     * Delete offer
     */
    public function destroy($id): JsonResponse
    {
        try {
            $offer = Offer::findOrFail($id);

            // Delete image if exists
            if ($offer->image && strpos($offer->image, 'storage/') !== false) {
                $oldPath = str_replace(asset('storage/'), '', $offer->image);
                Storage::disk('public')->delete($oldPath);
            }

            $offer->delete();

            return response()->json([
                'success' => true,
                'message' => 'تم حذف العرض بنجاح',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting offer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'فشل في حذف العرض',
            ], 500);
        }
    }
}

