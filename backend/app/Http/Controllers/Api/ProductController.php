<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductListResource;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use App\Models\Filter;
use App\Models\ProductImage;
use App\Models\ProductImport;
use App\Support\MediaUrl;
use App\Support\ImageUploadOptimizer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProductImportTemplate;
use App\Jobs\ProcessProductImport;

class ProductController extends Controller
{
    /**
     * Transform FormData string values to appropriate types
     */
    private function transformFormData(array $data): array
    {
        // Convert boolean strings to actual booleans
        $booleanFields = ['manage_stock', 'in_stock', 'is_active', 'is_featured', 'show_in_offers', 'show_description', 'show_specifications'];
        foreach ($booleanFields as $field) {
            if (isset($data[$field])) {
                // Convert string 'true'/'false' to boolean
                $data[$field] = filter_var($data[$field], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                // If null (invalid), default to false
                if ($data[$field] === null) {
                    $data[$field] = false;
                }
            }
        }

        $arrayFields = ['features', 'specifications', 'filter_values', 'variants', 'size_guide_images'];
        foreach ($arrayFields as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                $decoded = json_decode($data[$field], true);
                $data[$field] = is_array($decoded) ? $decoded : [];
            }
        }

        return $data;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        // Start with base query - only show active products (including out of stock)
        $query = Product::query()
            ->where('is_active', true)
            ->with(['category', 'categories', 'brand']);

        // Apply search filter FIRST (before QueryBuilder)
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('description', 'like', '%' . $searchTerm . '%')
                    ->orWhere('short_description', 'like', '%' . $searchTerm . '%')
                    ->orWhere('sku', 'like', '%' . $searchTerm . '%')
                    ->orWhereHas('brand', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', '%' . $searchTerm . '%');
                    })
                    ->orWhereHas('variants', function ($q) use ($searchTerm) {
                        $q->where('sku', 'like', '%' . $searchTerm . '%')
                            ->orWhere('variant_values', 'like', '%' . $searchTerm . '%');
                    });

                // Only search in category names if we are NOT already filtering by a specific category
                // This prevents "Baby" search from pulling in everything when a specific category is selected
                if (!request()->has('category_id')) {
                    $q->orWhereHas('category', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', '%' . $searchTerm . '%');
                    })
                    ->orWhereHas('categories', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', '%' . $searchTerm . '%');
                    });
                }
            });
        }

        // Apply category filter - include products from this category and all its subcategories
        if ($request->has('category_id') && $request->category_id) {
            $categoryId = $request->category_id;
            $categoryIds = Category::getAllDescendantIdsFor($categoryId);

            $query->where(function ($q) use ($categoryIds) {
                // Check direct category_id column
                $q->whereIn('category_id', $categoryIds)
                    // OR check many-to-many categories relationship
                    ->orWhereHas('categories', function ($categoryQuery) use ($categoryIds) {
                        $categoryQuery->whereIn('categories.id', $categoryIds);
                    });
            });
        }

        // Apply brand filter
        if ($request->has('brand_id') && $request->brand_id) {
            $query->where('brand_id', $request->brand_id);
        }

        // Apply price range filter
        if ($request->has('price_min') || $request->has('price_max')) {
            $query->whereBetween('price', [
                $request->price_min ?? 0,
                $request->price_max ?? 999999
            ]);
        }

        // Apply dynamic filter values (category-specific attributes)
        // filter_values in DB can be:
        //   Old format: {"الحجم": "كبير", "اللون": "أحمر"} (string per filter)
        //   New format: {"الحجم": ["كبير", "متوسط"], "اللون": ["أحمر", "أزرق"]} (array per filter)

        // Collect all filters from both possible sources
        $allFilters = [];

        // Source 1: filters parameter (array format)
        if ($request->has('filters') && is_array($request->input('filters'))) {
            $allFilters = array_merge($allFilters, $request->input('filters'));
        }

        // Source 2: filter_values parameter (JSON string format)
        if ($request->has('filter_values')) {
            $filterValues = is_string($request->filter_values)
                ? json_decode($request->filter_values, true)
                : $request->filter_values;

            if (is_array($filterValues)) {
                $allFilters = array_merge($allFilters, $filterValues);
            }
        }

        // Debug: Log what we're receiving
        Log::info('Filter request data:', [
            'has_filters' => $request->has('filters'),
            'has_filter_values' => $request->has('filter_values'),
            'merged_filters' => $allFilters,
            'filter_count' => count($allFilters)
        ]);

        // Apply all collected filters
        if (!empty($allFilters)) {
            foreach ($allFilters as $filterKey => $filterValue) {
                if (empty($filterValue))
                    continue;

                // Handle incoming filter value - can be string or array
                if (is_array($filterValue)) {
                    $values = array_map('trim', $filterValue);
                } else {
                    $filterValue = trim($filterValue);
                    // Handle multiple values separated by comma (for checkbox filters)
                    $values = explode(',', $filterValue);
                    $values = array_map('trim', $values);
                }
                $values = array_filter($values); // Remove empty values

                if (empty($values))
                    continue;

                // Each filter must match (AND between different filters)
                // BUT within one filter, any of the selected values can match (OR between values)
                // We use JSON_SEARCH which is much more robust for Arabic characters/Hamzas
                // as it can match values regardless of the specific JSON path or key encoding.
                $query->where(function ($q) use ($filterKey, $values) {
                    foreach ($values as $value) {
                        // 1. Search in main product filter_values
                        $q->orWhereRaw("JSON_SEARCH(filter_values, 'one', ?) IS NOT NULL", [$value]);

                        // Try with normalized value (Alif without Hamza) to be extra safe
                        $normalizedValue = preg_replace('/[أإآ]/u', 'ا', $value);
                        if ($value !== $normalizedValue) {
                            $q->orWhereRaw("JSON_SEARCH(filter_values, 'one', ?) IS NOT NULL", [$normalizedValue]);
                        }

                        // 2. OR search in any of its variants
                        $q->orWhereHas('variants', function ($variantQ) use ($value, $normalizedValue) {
                            $variantQ->where(function ($valQ) use ($value, $normalizedValue) {
                                $valQ->whereRaw("JSON_SEARCH(variant_values, 'one', ?) IS NOT NULL", [$value]);
                                if ($value !== $normalizedValue) {
                                    $valQ->orWhereRaw("JSON_SEARCH(variant_values, 'one', ?) IS NOT NULL", [$normalizedValue]);
                                }
                            });
                        });
                    }
                });
            }
        }

        // Apply sorting
        $sortBy = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');

        // Ensure sortOrder is valid
        $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';

        if ($sortBy === 'price') {
            // Calculate effective price: (MIN(variant_price) or products.price) * (1 - discount/100)
            $effectivePriceSql = "COALESCE(
                (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = products.id),
                products.price
            ) * (1 - COALESCE(products.discount_percentage, 0) / 100)";

            $query->orderByRaw($effectivePriceSql . ' ' . $sortOrder);
        } else {
            $sortMap = [
                'name' => 'name',
                'price' => 'price', // Base column for direct sort if subquery fails
                'created_at' => 'created_at',
                'rating' => 'rating',
                'sales_count' => 'sales_count',
                'views_count' => 'views_count'
            ];
            $sortField = $sortMap[$sortBy] ?? 'created_at';
            $query->orderBy($sortField, $sortOrder);
        }

        // Eager load everything needed to avoid N+1 queries
        $query->with([
            'variants:id,product_id,variant_values,price,stock_quantity,sku',
            'categories.parent',
            'category.parent',
            'brand',
            'images'
        ]);

        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        // Recalculate "In Stock" status AND price based on variants
        foreach ($products as $product) {
            $this->prepareProductForFrontend($product, $allFilters);
        }

        return response()->json([
            'data' => ProductListResource::collection($products),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        // Handle categories from FormData (may come as JSON string)
        if ($request->has('categories')) {
            $categoriesInput = $request->input('categories');
            if (is_string($categoriesInput)) {
                $decoded = json_decode($categoriesInput, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $request->merge(['categories' => $decoded]);
                }
            }
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'sku' => 'required|string|unique:products,sku',
            'stock_quantity' => 'required|integer',
            'manage_stock' => 'nullable|string|in:true,false,1,0',
            'stock_status' => 'nullable|string',
            'in_stock' => 'nullable|string|in:true,false,1,0',
            'category_id' => 'nullable|exists:categories,id', // Keep for backward compatibility
            'categories' => 'nullable|array', // New: multiple categories
            'categories.*' => 'exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|string',
            'warranty' => 'nullable|string',
            'delivery_time' => 'nullable|string',
            'features' => 'nullable|string',
            'specifications' => 'nullable|string',
            'filter_values' => 'nullable|string',
            'variants' => 'nullable|string',
            'size_guide_images' => 'nullable',
            // Note: images validation is handled separately after main validation
            'rating' => 'nullable|numeric|min:0|max:5',
            'reviews_count' => 'nullable|integer|min:0',
            'views_count' => 'nullable|integer|min:0',
            'sales_count' => 'nullable|integer|min:0',
            'is_active' => 'nullable|string|in:true,false,1,0',
            'is_featured' => 'nullable|string|in:true,false,1,0',
            'show_in_offers' => 'nullable|string|in:true,false,1,0',
            'sort_order' => 'nullable|integer',
            'meta_title' => 'nullable|string',
            'meta_description' => 'nullable|string',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'cover_image_url' => 'nullable|string|url',
            'show_description' => 'nullable|string|in:true,false,1,0',
            'show_specifications' => 'nullable|string|in:true,false,1,0',
        ]);

        // Transform string values to appropriate types
        $validated = $this->transformFormData($validated);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $slug = Str::slug($validated['name']);
            $originalSlug = $slug;
            $counter = 1;
            while (Product::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }
            $validated['slug'] = $slug;
        }

        // Extract categories from validated data
        $categories = [];
        if (isset($validated['categories']) && is_array($validated['categories'])) {
            $categories = $validated['categories'];
            unset($validated['categories']);
        } elseif (isset($validated['category_id'])) {
            // Backward compatibility: if only category_id is provided, use it
            $categories = [$validated['category_id']];
        }

        // If stock_status is 'stock_based', update in_stock based on stock_quantity
        if (isset($validated['stock_status']) && $validated['stock_status'] === 'stock_based') {
            $validated['in_stock'] = ($validated['stock_quantity'] ?? 0) > 0;
        }

        // Handle cover image
        if ($request->hasFile('cover_image')) {
            $coverImage = $request->file('cover_image');
            $path = ImageUploadOptimizer::storeUploaded($coverImage, 'products/covers', 'cover');
            $validated['cover_image'] = '/storage/' . $path;
        } elseif ($request->has('cover_image_url')) {
            $validated['cover_image'] = $request->input('cover_image_url');
        }

        $product = Product::create($validated);

        // Attach categories to product
        if (!empty($categories)) {
            $product->categories()->sync($categories);
        }

        // Handle images: new image URLs and new image file uploads
        Log::info('Checking for images in request for new product');

        // Get new image URLs (direct URLs)
        $newImageUrls = [];
        if ($request->has('image_urls')) {
            $imageUrlsJson = $request->input('image_urls');
            if (is_string($imageUrlsJson)) {
                $imageUrlsJson = json_decode($imageUrlsJson, true);
            }
            if (is_array($imageUrlsJson)) {
                $newImageUrls = $imageUrlsJson;
            }
            Log::info('New image URLs: ' . count($newImageUrls));
        }

        // Process new image URLs
        $urlImages = [];
        if (!empty($newImageUrls)) {
            foreach ($newImageUrls as $index => $url) {
                if (filter_var($url, FILTER_VALIDATE_URL)) {
                    $urlImages[] = [
                        'image_path' => $url,
                        'image_url' => $url,
                        'alt_text' => null,
                        'is_primary' => $index === 0,
                        'sort_order' => $index,
                    ];
                }
            }
        }

        // Check for new image file uploads
        $imageFiles = [];
        if ($request->hasFile('images')) {
            $imageFiles = $request->file('images');
            if (!is_array($imageFiles)) {
                $imageFiles = [$imageFiles];
            }
            Log::info('Found images via hasFile(images): ' . count($imageFiles));
        } else {
            // Try to get images[0], images[1], etc. (bracket notation)
            $index = 0;
            while ($request->hasFile("images[{$index}]")) {
                $imageFiles[] = $request->file("images[{$index}]");
                $index++;
            }
            // If no images found with bracket notation, try dot notation
            if (count($imageFiles) === 0) {
                $index = 0;
                while ($request->hasFile("images.{$index}")) {
                    $imageFiles[] = $request->file("images.{$index}");
                    $index++;
                }
                Log::info('Found images via images.X (dot notation): ' . count($imageFiles));
            } else {
                Log::info('Found images via images[X] (bracket notation): ' . count($imageFiles));
            }
        }

        // Process new image file uploads
        $uploadedImages = [];
        if (count($imageFiles) > 0) {
            // Validate each image file
            foreach ($imageFiles as $index => $imageFile) {
                if (!$imageFile || !$imageFile->isValid()) {
                    Log::warning('Invalid image file at index ' . $index);
                    continue;
                }

                // Validate file type and size
                $validator = Validator::make(
                    ['image' => $imageFile],
                    [
                        'image' => 'required|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240', // 10MB max
                    ]
                );

                if ($validator->fails()) {
                    Log::warning('Image validation failed at index ' . $index . ': ' . json_encode($validator->errors()));
                    continue;
                }
            }

            Log::info('Received ' . count($imageFiles) . ' image file(s) for new product');

            // Process new images
            foreach ($imageFiles as $index => $imageFile) {
                if (!$imageFile || !$imageFile->isValid()) {
                    continue; // Skip invalid files (already logged above)
                }

                // Generate unique filename
                $filename = time() . '_' . $index . '_' . Str::random(10) . '.' . $imageFile->getClientOriginalExtension();

                Log::info('Processing image ' . ($index + 1) . ': ' . $imageFile->getClientOriginalName() . ' -> ' . $filename);

                // Store optimized file
                $path = ImageUploadOptimizer::storeUploaded($imageFile, 'products', 'product');

                // Create image data array
                $imageData = [
                    'image_path' => $path,
                    'image_url' => '/storage/' . $path,
                    'alt_text' => null,
                    'is_primary' => false, // Will be set based on total images
                    'sort_order' => count($urlImages) + $index, // Continue from URL images
                ];

                $uploadedImages[] = $imageData;

                Log::info('Prepared image data for product ' . $product->id . ': ' . $path . ' (sort_order: ' . $imageData['sort_order'] . ')');
            }
        } else {
            Log::info('No image files received for new product');
            Log::info('Request all files: ' . json_encode($request->allFiles()));
        }

        // Merge all images: URL images + uploaded images
        $allImages = array_merge($urlImages, $uploadedImages);

        // Set is_primary for the first image
        if (count($allImages) > 0) {
            $allImages[0]['is_primary'] = true;
        }

        // Update product images column
        if (count($allImages) > 0) {
            $product->images = $allImages;
            $product->save();
            Log::info('Total images for product ' . $product->id . ': ' . count($allImages) . ' (URLs: ' . count($urlImages) . ', uploaded: ' . count($uploadedImages) . ')');
        } else {
            Log::info('No images to save for product ' . $product->id);
        }

        // Handle size guide images (urls/files)
        $this->syncSizeGuideImages($request, $product);

        // Save variants if provided
        if (isset($validated['variants']) && is_array($validated['variants'])) {
            foreach ($validated['variants'] as $index => $variantData) {
                // Determine stock quantity for variant (fall back to 0 if not provided)
                $varStock = isset($variantData['stock_quantity']) ? (int) $variantData['stock_quantity'] : 0;
                // If variant has its own price, use it, else null
                $varPrice = isset($variantData['price']) && $variantData['price'] !== '' ? (float) $variantData['price'] : null;

                // Handle variant images
                $variantImages = [];

                // 1. Get variant image URLs if provided in JSON
                if (isset($variantData['image_urls']) && is_array($variantData['image_urls'])) {
                    foreach ($variantData['image_urls'] as $idx => $url) {
                        if (filter_var($url, FILTER_VALIDATE_URL)) {
                            $variantImages[] = [
                                'image_path' => $url,
                                'image_url' => $url,
                                'alt_text' => null,
                                'is_primary' => $idx === 0,
                                'sort_order' => $idx,
                            ];
                        }
                    }
                }

                // 2. Handle uploaded variant images: check for variant_images_{index}[]
                $variantIndex = $index;
                $variantFiles = $request->file("variant_images_{$variantIndex}");
                if ($variantFiles) {
                    if (!is_array($variantFiles)) {
                        $variantFiles = [$variantFiles];
                    }

                    foreach ($variantFiles as $vIdx => $vFile) {
                        if ($vFile && $vFile->isValid()) {
                            $path = ImageUploadOptimizer::storeUploaded(
                                $vFile,
                                'products/variants',
                                "variant_{$variantIndex}_{$vIdx}"
                            );

                            $variantImages[] = [
                                'image_path' => $path,
                                'image_url' => '/storage/' . $path,
                                'alt_text' => null,
                                'is_primary' => count($variantImages) === 0,
                                'sort_order' => count($variantImages),
                            ];
                        }
                    }
                }

                $product->variants()->create([
                    'variant_values' => $variantData['variant_values'] ?? [],
                    'price' => $varPrice,
                    'stock_quantity' => $varStock,
                    'sku' => $variantData['sku'] ?? null,
                    'images' => $variantImages,
                ]);
            }
        }

        return response()->json([
            'message' => 'Product created successfully',
            'data' => new ProductResource($product->load(['category', 'categories', 'brand', 'variants']))
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Product $product): JsonResponse
    {
        // Prevent double increment in same session/refresh
        $viewedProducts = session()->get('viewed_products', []);

        if (!in_array($product->id, $viewedProducts) && !$request->has('no_increment')) {
            $product->increment('views_count');
            $viewedProducts[] = $product->id;
            session()->put('viewed_products', $viewedProducts);
        }

        return response()->json([
            'data' => new ProductResource($product->load(['category', 'categories', 'brand', 'reviews.user', 'variants']))
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        // Handle categories from FormData (may come as JSON string)
        if ($request->has('categories')) {
            $categoriesInput = $request->input('categories');
            if (is_string($categoriesInput)) {
                $decoded = json_decode($categoriesInput, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $request->merge(['categories' => $decoded]);
                }
            }
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'compare_price' => 'nullable|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'sku' => 'sometimes|string|unique:products,sku,' . $product->id,
            'stock_quantity' => 'sometimes|integer',
            'manage_stock' => 'nullable|string|in:true,false,1,0',
            'stock_status' => 'nullable|string',
            'in_stock' => 'nullable|string|in:true,false,1,0',
            'category_id' => 'nullable|integer|exists:categories,id', // Keep for backward compatibility
            'categories' => 'nullable|array', // New: multiple categories
            'categories.*' => 'exists:categories,id',
            'brand_id' => 'nullable|integer|min:0',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|string',
            'warranty' => 'nullable|string',
            'delivery_time' => 'nullable|string',

            'cover_image' => 'nullable', // Allow separate validation for file or string or null
            // Note: images validation is handled separately after main validation
            'is_active' => 'sometimes|string|in:true,false,1,0',
            'is_featured' => 'sometimes|string|in:true,false,1,0',
            'show_in_offers' => 'sometimes|string|in:true,false,1,0',
            'sort_order' => 'nullable|integer',
            'rating' => 'nullable|numeric|min:0|max:5',
            'reviews_count' => 'nullable|integer|min:0',
            'views_count' => 'nullable|integer|min:0',
            'sales_count' => 'nullable|integer|min:0',
            'meta_title' => 'nullable|string',
            'meta_description' => 'nullable|string',
            'features' => 'nullable|string',
            'specifications' => 'nullable|string',
            'filter_values' => 'nullable|string',
            'variants' => 'nullable|string',
            'size_guide_images' => 'nullable',
            'show_description' => 'sometimes|string|in:true,false,1,0',
            'show_specifications' => 'sometimes|string|in:true,false,1,0',
            'created_at' => 'nullable|date',
        ]);

        // Transform string values to appropriate types
        $validated = $this->transformFormData($validated);

        // Handle brand_id = 0 by setting to null
        if (isset($validated['brand_id']) && $validated['brand_id'] == 0) {
            $validated['brand_id'] = null;
        }

        // Extract categories from validated data
        $categories = null;
        if (isset($validated['categories']) && is_array($validated['categories'])) {
            $categories = $validated['categories'];
            unset($validated['categories']);
        } elseif (isset($validated['category_id'])) {
            // Backward compatibility: if only category_id is provided, use it
            $categories = [$validated['category_id']];
        }

        // If stock_status is 'stock_based', update in_stock based on stock_quantity
        if (isset($validated['stock_status']) && $validated['stock_status'] === 'stock_based') {
            $stockQuantity = $validated['stock_quantity'] ?? $product->stock_quantity;
            $validated['in_stock'] = $stockQuantity > 0;
        }

        // Update product
        // Handle cover image
        if ($request->hasFile('cover_image')) {
            // Delete old cover if exists locally
            if ($product->cover_image) {
                $oldPath = MediaUrl::normalizeStoredPath($product->cover_image);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $coverImage = $request->file('cover_image');
            $path = ImageUploadOptimizer::storeUploaded($coverImage, 'products/covers', 'cover');
            $validated['cover_image'] = '/storage/' . $path;
        } elseif ($request->input('cover_image') === 'null' || ($request->has('cover_image') && $request->input('cover_image') === '')) {
            // Delete old cover if exists locally
            if ($product->cover_image) {
                $oldPath = MediaUrl::normalizeStoredPath($product->cover_image);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }
            $validated['cover_image'] = null;
        } elseif ($request->has('cover_image_url')) {
            $validated['cover_image'] = $request->input('cover_image_url');
        }

        Log::info('Validated data for product update:', [
            'has_filter_values' => isset($validated['filter_values']),
            'filter_values_type' => isset($validated['filter_values']) ? gettype($validated['filter_values']) : 'null',
        ]);

        $product->update($validated);

        // Explicitly set filter_values if and only if it was present in validated data
        // This ensures JSON fields are saved correctly even when passed as arrays via FormData logic
        if (isset($validated['filter_values'])) {
            $product->filter_values = $validated['filter_values'];
        }
        if (isset($validated['specifications'])) {
            $product->specifications = $validated['specifications'];
        }
        if (isset($validated['features'])) {
            $product->features = $validated['features'];
        }

        $product->save();

        // Sync categories if provided
        if ($categories !== null) {
            $product->categories()->sync($categories);
        }

        // Handle images: existing images to keep, new image URLs, and new image file uploads
        Log::info('Checking for images in request for product ' . $product->id);

        // Get existing images that should be kept (sent from frontend)
        $imagesToKeep = [];
        if ($request->has('existing_images')) {
            $existingImagesJson = $request->input('existing_images');
            if (is_string($existingImagesJson)) {
                $existingImagesJson = json_decode($existingImagesJson, true);
            }
            if (is_array($existingImagesJson)) {
                $imagesToKeep = $existingImagesJson;
            }
            Log::info('Existing images to keep: ' . count($imagesToKeep));
        } else {
            // If no existing_images sent, keep all current images
            $imagesToKeep = $product->images ?? [];
            if (!is_array($imagesToKeep)) {
                $imagesToKeep = [];
            }
            Log::info('No existing_images sent, keeping all current images: ' . count($imagesToKeep));
        }

        // Get new image URLs (direct URLs)
        $newImageUrls = [];
        if ($request->has('image_urls')) {
            $imageUrlsJson = $request->input('image_urls');
            if (is_string($imageUrlsJson)) {
                $imageUrlsJson = json_decode($imageUrlsJson, true);
            }
            if (is_array($imageUrlsJson)) {
                $newImageUrls = $imageUrlsJson;
            }
            Log::info('New image URLs: ' . count($newImageUrls));
        }

        // Process new image URLs
        $urlImages = [];
        if (!empty($newImageUrls)) {
            $maxSortOrder = -1;
            if (!empty($imagesToKeep)) {
                $maxSortOrder = max(array_column($imagesToKeep, 'sort_order')) ?? -1;
            }

            foreach ($newImageUrls as $index => $urlData) {
                $url = is_array($urlData) ? ($urlData['url'] ?? $urlData['image_url'] ?? '') : $urlData;
                $providedSortOrder = is_array($urlData) && isset($urlData['sort_order']) ? (int)$urlData['sort_order'] : null;

                if (filter_var($url, FILTER_VALIDATE_URL)) {
                    $sortOrder = $providedSortOrder ?? ($maxSortOrder + 1 + $index);
                    $isPrimary = (count($imagesToKeep) === 0 && $index === 0 && $providedSortOrder === null);

                    $urlImages[] = [
                        'image_path' => $url,
                        'image_url' => $url,
                        'alt_text' => null,
                        'is_primary' => $isPrimary,
                        'sort_order' => $sortOrder,
                    ];
                }
            }
        }

        // Check for new image file uploads
        $imageFiles = [];
        if ($request->hasFile('images')) {
            $imageFiles = $request->file('images');
            if (!is_array($imageFiles)) {
                $imageFiles = [$imageFiles];
            }
            Log::info('Found images via hasFile(images): ' . count($imageFiles));
        } else {
            // Try to get images[0], images[1], etc. (bracket notation)
            $index = 0;
            while ($request->hasFile("images[{$index}]")) {
                $imageFiles[] = $request->file("images[{$index}]");
                $index++;
            }
            // If no images found with bracket notation, try dot notation
            if (count($imageFiles) === 0) {
                $index = 0;
                while ($request->hasFile("images.{$index}")) {
                    $imageFiles[] = $request->file("images.{$index}");
                    $index++;
                }
                Log::info('Found images via images.X (dot notation): ' . count($imageFiles));
            } else {
                Log::info('Found images via images[X] (bracket notation): ' . count($imageFiles));
            }
        }

        // Process new image file uploads
        $uploadedImages = [];
        if (!empty($imageFiles)) {
            // Get images metadata if provided
            $imagesMetadata = [];
            if ($request->has('images_metadata')) {
                $metadataJson = $request->input('images_metadata');
                if (is_string($metadataJson)) {
                    $metadataJson = json_decode($metadataJson, true);
                }
                if (is_array($metadataJson)) {
                    $imagesMetadata = $metadataJson;
                }
            }

            // Validate each image file
            foreach ($imageFiles as $index => $imageFile) {
                if (!$imageFile || !$imageFile->isValid()) {
                    Log::warning('Invalid image file at index ' . $index);
                    continue;
                }

                // Validate file type and size
                $validator = Validator::make(
                    ['image' => $imageFile],
                    [
                        'image' => 'required|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240', // 10MB max
                    ]
                );

                if ($validator->fails()) {
                    Log::warning('Image validation failed at index ' . $index . ': ' . json_encode($validator->errors()));
                    continue;
                }
            }

            Log::info('Received ' . count($imageFiles) . ' image file(s) for product ' . $product->id);

            // Get the highest sort_order
            $maxSortOrder = -1;
            $allCurrentImages = array_merge($imagesToKeep, $urlImages);
            if (!empty($allCurrentImages)) {
                $maxSortOrder = max(array_column($allCurrentImages, 'sort_order')) ?? -1;
            }

            // Process new uploaded images
            foreach ($imageFiles as $index => $imageFile) {
                if (!$imageFile || !$imageFile->isValid()) {
                    continue;
                }

                // Generate unique filename
                $filename = time() . '_' . $index . '_' . Str::random(10) . '.' . $imageFile->getClientOriginalExtension();

                Log::info('Processing image ' . ($index + 1) . ': ' . $imageFile->getClientOriginalName() . ' -> ' . $filename);

                // Store optimized file
                $path = ImageUploadOptimizer::storeUploaded($imageFile, 'products', 'product');

                // Calculate sort_order: use metadata if provided, else maxSortOrder + 1
                $providedSortOrder = isset($imagesMetadata[$index]['sort_order']) ? (int)$imagesMetadata[$index]['sort_order'] : null;
                $sortOrder = $providedSortOrder ?? ($maxSortOrder + 1 + $index);

                // Only set as primary if this is the first image AND there are no other images
                $isPrimary = (count($allCurrentImages) === 0 && $index === 0 && $providedSortOrder === null);

                // Create image data array
                $imageData = [
                    'image_path' => $path,
                    'image_url' => '/storage/' . $path,
                    'alt_text' => null,
                    'is_primary' => $isPrimary,
                    'sort_order' => $sortOrder,
                ];

                $uploadedImages[] = $imageData;

                Log::info('Prepared image data for product ' . $product->id . ': ' . $path . ' (sort_order: ' . $sortOrder . ', is_primary: ' . ($isPrimary ? 'true' : 'false') . ')');
            }
        }

        // Merge all images: kept images + URL images + uploaded images
        $allImages = array_merge($imagesToKeep, $urlImages, $uploadedImages);

        // Sort all images by sort_order to respect user's custom ordering
        usort($allImages, function($a, $b) {
            $orderA = isset($a['sort_order']) ? (int)$a['sort_order'] : 999;
            $orderB = isset($b['sort_order']) ? (int)$b['sort_order'] : 999;
            return $orderA <=> $orderB;
        });

        // Ensure exactly one primary image (the first one after sorting)
        foreach ($allImages as $index => &$img) {
            $img['is_primary'] = ($index === 0);
            $img['sort_order'] = $index;
        }

        // Update product images column
        $product->images = $allImages;
        $product->save();

        $finalImagesCount = count($allImages);
        Log::info('Total images for product ' . $product->id . ' after update: ' . $finalImagesCount . ' (kept: ' . count($imagesToKeep) . ', URLs: ' . count($urlImages) . ', uploaded: ' . count($uploadedImages) . ')');

        // Handle size guide images (existing/urls/files)
        $this->syncSizeGuideImages($request, $product);

        // Update variants if provided
        if (isset($validated['variants']) && is_array($validated['variants'])) {
            // Delete existing variants
            $product->variants()->delete();

            // Create new variants
            foreach ($validated['variants'] as $index => $variantData) {
                // Determine stock quantity for variant (fall back to 0 if not provided)
                $varStock = isset($variantData['stock_quantity']) ? (int) $variantData['stock_quantity'] : 0;
                // If variant has its own price, use it, else null
                $varPrice = isset($variantData['price']) && $variantData['price'] !== '' ? (float) $variantData['price'] : null;

                // Handle variant images
                $variantImages = [];

                // 1. Get existing variant images if provided
                if (isset($variantData['existing_images']) && is_array($variantData['existing_images'])) {
                    $variantImages = $variantData['existing_images'];
                }

                // 2. Get new variant image URLs if provided
                if (isset($variantData['image_urls']) && is_array($variantData['image_urls'])) {
                    $maxIdx = count($variantImages);
                    foreach ($variantData['image_urls'] as $idx => $url) {
                        if (filter_var($url, FILTER_VALIDATE_URL)) {
                            $variantImages[] = [
                                'image_path' => $url,
                                'image_url' => $url,
                                'alt_text' => null,
                                'is_primary' => count($variantImages) === 0,
                                'sort_order' => $maxIdx + $idx,
                            ];
                        }
                    }
                }

                // 3. Handle uploaded variant images: check for variant_images_{index}[]
                $variantIndex = $index;
                $variantFiles = $request->file("variant_images_{$variantIndex}");
                if ($variantFiles) {
                    if (!is_array($variantFiles)) {
                        $variantFiles = [$variantFiles];
                    }

                    foreach ($variantFiles as $vIdx => $vFile) {
                        if ($vFile && $vFile->isValid()) {
                            $path = ImageUploadOptimizer::storeUploaded(
                                $vFile,
                                'products/variants',
                                "variant_{$variantIndex}_{$vIdx}"
                            );

                            $variantImages[] = [
                                'image_path' => $path,
                                'image_url' => '/storage/' . $path,
                                'alt_text' => null,
                                'is_primary' => count($variantImages) === 0,
                                'sort_order' => count($variantImages),
                            ];
                        }
                    }
                }

                // Sort variant images by sort_order if provided
                usort($variantImages, function($a, $b) {
                    $orderA = isset($a['sort_order']) ? (int)$a['sort_order'] : 999;
                    $orderB = isset($b['sort_order']) ? (int)$b['sort_order'] : 999;
                    return $orderA <=> $orderB;
                });

                // Ensure exactly one primary image (the first one after sorting)
                foreach ($variantImages as $vIdx => &$vImg) {
                    $vImg['is_primary'] = ($vIdx === 0);
                    $vImg['sort_order'] = $vIdx;
                }

                $product->variants()->create([
                    'variant_values' => $variantData['variant_values'] ?? [],
                    'price' => $varPrice,
                    'stock_quantity' => $varStock,
                    'sku' => $variantData['sku'] ?? null,
                    'images' => $variantImages,
                ]);
            }
        }

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => new ProductResource($product->load(['category', 'categories', 'brand', 'variants']))
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully'
        ]);
    }

    /**
     * Remove multiple products from storage.
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'integer|exists:products,id'
        ]);

        Product::whereIn('id', $request->product_ids)
            ->orderBy('id')
            ->chunkById(100, function ($products) {
                foreach ($products as $product) {
                    $product->delete();
                }
            });

        return response()->json([
            'message' => 'Products deleted successfully'
        ]);
    }

    /**
     * Get featured products
     */
    public function featured(): JsonResponse
    {
        $products = Product::with(['category', 'brand', 'images', 'variants'])
            ->where('is_featured', true)
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->limit(12)
            ->get();

        foreach ($products as $product) {
            $this->prepareProductForFrontend($product);
        }

        return response()->json([
            'data' => ProductListResource::collection($products)
        ]);
    }

    /**
     * Get latest products
     */
    public function latest(): JsonResponse
    {
        $products = Product::with(['category', 'brand', 'images', 'variants'])
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->limit(12)
            ->get();

        foreach ($products as $product) {
            $this->prepareProductForFrontend($product);
        }

        return response()->json([
            'data' => ProductListResource::collection($products)
        ]);
    }

    /**
     * Get products by category
     */
    public function byCategory(Category $category): JsonResponse
    {
        // Get all category IDs including subcategories
        $categoryIds = $category->getAllDescendantIds();

        $products = Product::with(['category', 'brand'])
            ->where(function ($q) use ($categoryIds) {
                $q->whereIn('category_id', $categoryIds)
                    ->orWhereHas('categories', function ($categoryQuery) use ($categoryIds) {
                        $categoryQuery->whereIn('categories.id', $categoryIds);
                    });
            })
            ->where('is_active', true)
            ->where('in_stock', true)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'data' => ProductListResource::collection($products),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }

    /**
     * Get products by brand
     */
    public function byBrand(Brand $brand): JsonResponse
    {
        $products = Product::with(['category', 'brand'])
            ->where('brand_id', $brand->id)
            ->where('is_active', true)
            ->where('in_stock', true)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'data' => ProductListResource::collection($products),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }

    /**
     * Admin: Display a listing of all products (including inactive)
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Product::query()->with(['category', 'brand']);

        // Apply search filter FIRST (before QueryBuilder)
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('description', 'like', '%' . $searchTerm . '%')
                    ->orWhere('short_description', 'like', '%' . $searchTerm . '%')
                    ->orWhere('sku', 'like', '%' . $searchTerm . '%')
                    ->orWhere('features', 'like', '%' . $searchTerm . '%')
                    ->orWhere('specifications', 'like', '%' . $searchTerm . '%')
                    ->orWhere('filter_values', 'like', '%' . $searchTerm . '%')
                    ->orWhereHas('category', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', '%' . $searchTerm . '%');
                    })
                    ->orWhereHas('categories', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', '%' . $searchTerm . '%');
                    })
                    ->orWhereHas('brand', function ($q) use ($searchTerm) {
                        $q->where('name', 'like', '%' . $searchTerm . '%');
                    })
                    ->orWhereHas('variants', function ($q) use ($searchTerm) {
                        $q->where('sku', 'like', '%' . $searchTerm . '%')
                            ->orWhere('variant_values', 'like', '%' . $searchTerm . '%');
                    });
            });
        }

        // Apply other filters
        $query = QueryBuilder::for($query)
            ->allowedFilters([
                'name',
                'price',
                'category_id',
                'brand_id',
                'is_featured',
                'in_stock',
                'is_active',
                AllowedFilter::exact('category_id'),
                AllowedFilter::exact('brand_id'),
                AllowedFilter::scope('price_range'),
            ])
            ->allowedSorts(['name', 'price', 'created_at', 'rating', 'sales_count', 'views_count'])
            ->defaultSort('-created_at');

        // Apply category filter - include products from this category and all its subcategories
        if ($request->has('category_id') && $request->category_id) {
            $categoryIds = Category::getAllDescendantIdsFor($request->category_id);
            $query->where(function ($q) use ($categoryIds) {
                $q->whereIn('category_id', $categoryIds)
                    ->orWhereHas('categories', function ($categoryQuery) use ($categoryIds) {
                        $categoryQuery->whereIn('categories.id', $categoryIds);
                    });
            });
        }

        // Apply brand filter
        if ($request->has('brand_id') && $request->brand_id) {
            $query->where('brand_id', $request->brand_id);
        }

        // Apply stock status filter
        if ($request->has('stock_status') && $request->stock_status !== 'all') {
            if ($request->stock_status === 'in_stock') {
                $query->where('in_stock', true);
            } elseif ($request->stock_status === 'out_of_stock') {
                $query->where('in_stock', false);
            } elseif ($request->stock_status === 'low_stock') {
                $query->where('stock_quantity', '<=', 5);
            }
        }

        // Apply status filter
        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Apply featured filter
        if ($request->has('featured') && $request->featured !== 'all') {
            if ($request->featured === 'featured') {
                $query->where('is_featured', true);
            } elseif ($request->featured === 'not_featured') {
                $query->where('is_featured', false);
            }
        }

        // Apply price range filter
        if ($request->has('price_min') || $request->has('price_max')) {
            $query->whereBetween('price', [
                $request->price_min ?? 0,
                $request->price_max ?? 999999
            ]);
        }

        // Apply discount filter
        if ($request->has('has_discount') && $request->has_discount === 'true') {
            $query->where('discount_percentage', '>', 0);
        }

        if ($request->has('discount_min') || $request->has('discount_max')) {
            $query->whereBetween('discount_percentage', [
                $request->discount_min ?? 0,
                $request->discount_max ?? 100
            ]);
        }

        $products = $query->with(['category', 'brand'])->paginate($request->get('per_page', 12));

        return response()->json([
            'data' => ProductResource::collection($products),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ]
        ]);
    }

    /**
     * Admin: Display the specified product
     */
    public function adminShow(Product $product): JsonResponse
    {
        return response()->json([
            'data' => new ProductResource($product->load(['category', 'categories', 'brand', 'reviews.user', 'variants']))
        ]);
    }

    /**
     * Admin: Delete specific variant
     */
    public function destroyVariant(ProductVariant $variant): JsonResponse
    {
        $variant->delete();

        return response()->json([
            'message' => 'Variant deleted successfully'
        ]);
    }
    /**
     * Bulk apply discount to selected products
     */
    public function bulkApplyDiscount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'discount_percentage' => 'required|numeric|min:0|max:100',
        ]);

        $productIds = $validated['product_ids'];
        $percentage = $validated['discount_percentage'];

        Product::whereIn('id', $productIds)
            ->update(['discount_percentage' => $percentage]);

        return response()->json([
            'message' => 'Bulk discount applied successfully',
            'count' => count($productIds)
        ]);
    }

    /**
     * Bulk update active status for selected products
     */
    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'is_active' => 'required|boolean',
        ]);

        $productIds = $validated['product_ids'];
        $isActive = $validated['is_active'];

        Product::whereIn('id', $productIds)->update([
            'is_active' => $isActive,
        ]);

        return response()->json([
            'message' => 'Bulk status updated successfully',
            'count' => count($productIds),
            'is_active' => $isActive,
        ]);
    }

    /**
     * Bulk update show_in_offers status for selected products
     */
    public function bulkUpdateOffers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'show_in_offers' => 'required|boolean',
        ]);

        $productIds = $validated['product_ids'];
        $showInOffers = $validated['show_in_offers'];

        Product::whereIn('id', $productIds)->update([
            'show_in_offers' => $showInOffers,
        ]);

        return response()->json([
            'message' => 'Bulk offers status updated successfully',
            'count' => count($productIds),
            'show_in_offers' => $showInOffers,
        ]);
    }
    /**
     * Export an Excel template for product import with dynamic filter columns and dropdowns.
     */
    public function exportImportTemplate()
    {
        return Excel::download(new ProductImportTemplate, 'products_template.xlsx');
    }

    /**
     * Upload import assets before starting the queued import.
     */
    public function uploadImportAssets(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
            'images_zip' => 'nullable|file|mimes:zip|max:3145728',
        ]);

        $file = $request->file('file');
        $zipFile = $request->file('images_zip');

        $storedFilePath = $file->storeAs(
            'imports/products',
            Str::uuid() . '.' . $file->getClientOriginalExtension()
        );

        $storedZipPath = $zipFile?->storeAs(
            'imports/products',
            Str::uuid() . '.zip'
        );

        return response()->json([
            'message' => 'تم رفع ملفات الاستيراد بنجاح.',
            'assets' => [
                'file_path' => $storedFilePath,
                'file_name' => $file->getClientOriginalName(),
                'images_zip_path' => $storedZipPath,
                'images_zip_name' => $zipFile?->getClientOriginalName(),
            ],
        ]);
    }

    /**
     * List import files uploaded to the FTP inbox.
     */
    public function listImportInboxFiles(): JsonResponse
    {
        $fileDirectory = 'imports/products/inbox/files';
        $zipDirectory = 'imports/products/inbox/zips';

        Storage::makeDirectory($fileDirectory);
        Storage::makeDirectory($zipDirectory);

        $files = collect(Storage::files($fileDirectory))
            ->filter(fn ($path) => in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), ['csv', 'txt', 'xlsx', 'xls'], true))
            ->map(fn ($path) => $this->formatInboxAsset($path))
            ->sortByDesc('modified_at')
            ->values();

        $zips = collect(Storage::files($zipDirectory))
            ->filter(fn ($path) => strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'zip')
            ->map(fn ($path) => $this->formatInboxAsset($path))
            ->sortByDesc('modified_at')
            ->values();

        return response()->json([
            'inbox' => [
                'files' => $files,
                'zips' => $zips,
                'file_directory' => $fileDirectory,
                'zip_directory' => $zipDirectory,
            ],
        ]);
    }

    /**
     * Start queued import using pre-uploaded assets.
     */
    public function startImport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file_path' => 'required|string',
            'file_name' => 'required|string',
            'images_zip_path' => 'nullable|string',
            'images_zip_name' => 'nullable|string',
        ]);

        if (!Storage::exists($validated['file_path'])) {
            return response()->json([
                'message' => 'ملف المنتجات المرفوع غير موجود.',
            ], 422);
        }

        if (!empty($validated['images_zip_path']) && !Storage::exists($validated['images_zip_path'])) {
            return response()->json([
                'message' => 'ملف الصور المضغوط المرفوع غير موجود.',
            ], 422);
        }

        $productImport = ProductImport::create([
            'uuid' => (string) Str::uuid(),
            'admin_id' => $request->user()?->id,
            'status' => 'queued',
            'stage' => 'queued',
            'progress' => 0,
            'message' => 'تمت إضافة الاستيراد إلى قائمة المعالجة.',
            'file_path' => $validated['file_path'],
            'file_name' => $validated['file_name'],
            'images_zip_path' => $validated['images_zip_path'] ?? null,
            'images_zip_name' => $validated['images_zip_name'] ?? null,
        ]);

        ProcessProductImport::dispatch($productImport->id);

        return response()->json([
            'message' => 'تم بدء المعالجة في الخلفية.',
            'import' => [
                'id' => $productImport->id,
                'uuid' => $productImport->uuid,
                'status' => $productImport->status,
                'stage' => $productImport->stage,
                'progress' => $productImport->progress,
                'message' => $productImport->message,
            ],
        ], 202);
    }

    /**
     * Start queued import from files that already exist in the FTP inbox.
     */
    public function startImportFromInbox(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file_path' => 'required|string',
            'images_zip_path' => 'nullable|string',
        ]);

        $filePath = $this->resolveInboxAssetPath($validated['file_path'], 'imports/products/inbox/files');
        $zipPath = !empty($validated['images_zip_path'])
            ? $this->resolveInboxAssetPath($validated['images_zip_path'], 'imports/products/inbox/zips')
            : null;

        $payload = [
            'file_path' => $filePath,
            'file_name' => basename($filePath),
            'images_zip_path' => $zipPath,
            'images_zip_name' => $zipPath ? basename($zipPath) : null,
        ];

        $proxyRequest = $request->duplicate($payload);
        $proxyRequest->setUserResolver(fn () => $request->user());

        return $this->startImport($proxyRequest);
    }

    /**
     * Import products from CSV
     */
    public function importProducts(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
            'images.*' => 'nullable|file|image|max:10240',
            'images_zip' => 'nullable|file|mimes:zip|max:3145728',
        ]);

        $file = $request->file('file');
        $uploadedFiles = $request->file('images') ?? [];
        $tempImportDir = null;
        $importId = (string) Str::uuid();
        $currentRowNumber = null;
        $currentSku = null;
        $zipFile = $request->file('images_zip');

        $storedFilePath = $file->storeAs(
            'imports/products',
            Str::uuid() . '.' . $file->getClientOriginalExtension()
        );

        $storedZipPath = $zipFile?->storeAs(
            'imports/products',
            Str::uuid() . '.zip'
        );

        $productImport = ProductImport::create([
            'uuid' => (string) Str::uuid(),
            'admin_id' => $request->user()?->id,
            'status' => 'queued',
            'stage' => 'queued',
            'progress' => 0,
            'message' => 'تم رفع الملفات وإضافة الاستيراد إلى قائمة المعالجة.',
            'file_path' => $storedFilePath,
            'file_name' => $file->getClientOriginalName(),
            'images_zip_path' => $storedZipPath,
            'images_zip_name' => $zipFile?->getClientOriginalName(),
        ]);

        ProcessProductImport::dispatch($productImport->id);

        return response()->json([
            'message' => 'تم رفع الملفات وبدء المعالجة في الخلفية.',
            'import' => [
                'id' => $productImport->id,
                'uuid' => $productImport->uuid,
                'status' => $productImport->status,
                'stage' => $productImport->stage,
                'progress' => $productImport->progress,
                'message' => $productImport->message,
            ],
        ], 202);

        Log::info('Bulk import started', [
            'import_id' => $importId,
            'file_name' => $file?->getClientOriginalName(),
            'file_size' => $file?->getSize(),
            'file_extension' => $file?->getClientOriginalExtension(),
            'uploaded_images_count' => is_array($uploadedFiles) ? count($uploadedFiles) : 0,
            'has_images_zip' => $request->hasFile('images_zip'),
            'images_zip_name' => $zipFile?->getClientOriginalName(),
            'images_zip_size' => $zipFile?->getSize(),
        ]);

        $fileMap = [];
        foreach ($uploadedFiles as $uFile) {
            $fileMap[$uFile->getClientOriginalName()] = [
                'source' => 'upload',
                'file' => $uFile,
                'original_name' => $uFile->getClientOriginalName(),
            ];
        }

        if ($request->hasFile('images_zip')) {
            Log::info('Bulk import extracting zip', [
                'import_id' => $importId,
                'zip_name' => $zipFile?->getClientOriginalName(),
                'zip_size' => $zipFile?->getSize(),
            ]);
            ['map' => $zipFileMap, 'temp_dir' => $tempImportDir] = $this->extractBulkImportZip($request->file('images_zip'));
            $fileMap = array_merge($fileMap, $zipFileMap);
            Log::info('Bulk import zip extracted', [
                'import_id' => $importId,
                'extracted_files_count' => count($zipFileMap),
                'temp_dir' => $tempImportDir,
            ]);
        }

        // Use Excel::toArray to handle both CSV and XLSX
        Log::info('Bulk import reading spreadsheet', [
            'import_id' => $importId,
            'file_name' => $file?->getClientOriginalName(),
        ]);
        $rows = Excel::toArray(new \stdClass(), $file)[0];
        Log::info('Bulk import spreadsheet loaded', [
            'import_id' => $importId,
            'total_raw_rows' => count($rows),
        ]);

        Log::info('Bulk import checking spreadsheet content', [
            'import_id' => $importId,
            'is_empty' => empty($rows),
        ]);
        if (empty($rows)) {
            return response()->json(['message' => 'ملف فارغ'], 422);
        }

        $headers = array_shift($rows);
        Log::info('Bulk import headers parsed', [
            'import_id' => $importId,
            'headers_count' => count($headers),
        ]);

        $rowCount = 0;
        $createdCount = 0;
        $updatedCount = 0;
        $errors = [];

        // Helper to normalize Arabic strings for better matching
        $normalize = function ($str) {
            $str = trim($str);
            $str = preg_replace('/[أإآ]/u', 'ا', $str);
            $str = str_replace('ة', 'ه', $str);
            $str = preg_replace('/\s+/', '', $str);
            return mb_strtolower($str);
        };

        // Cache filters for faster and smarter lookup
        $allFilters = Filter::all();
        $filterMap = [];
        foreach ($allFilters as $f) {
            $filterMap[$normalize($f->name)] = $f->name;
        }

        DB::beginTransaction();
        try {
            $currentProduct = null;
            $lastSku = null;

            foreach ($rows as $rowIndex => $row) {
                $currentRowNumber = $rowIndex + 3;
                // Safe mapping of headers to row data
                $data = [];
                foreach ($headers as $index => $header) {
                    $cleanHeader = trim($header);
                    if ($cleanHeader === '')
                        continue;
                    $data[$cleanHeader] = $row[$index] ?? null;
                }

                $sku = trim($data['sku'] ?? '');
                $currentSku = $sku !== '' ? $sku : null;

                // Skip empty rows or guidance rows
                if (!$sku || str_contains($sku, 'GUIDE'))
                    continue;

                $rowCount++;
                Log::info('Bulk import processing row', [
                    'import_id' => $importId,
                    'row_number' => $currentRowNumber,
                    'sku' => $sku,
                    'is_variant_row' => $sku === $lastSku && $currentProduct !== null,
                ]);

                // If SKU matches last row, it's a variant for the SAME product
                if ($sku === $lastSku && $currentProduct) {
                    // This is a Variant Row ($sku === $lastSku)
                    $this->processVariantRow($currentProduct, $data, $fileMap);

                    // --- Filter Aggregation for Parent ---
                    $parentFilters = $currentProduct->filter_values ?: [];
                    $rowFilters = $this->extractFiltersFromRow($data, $normalize, $filterMap);

                    $updated = false;
                    foreach ($rowFilters as $name => $val) {
                        if (!isset($parentFilters[$name])) {
                            $parentFilters[$name] = [trim($val)];
                            $updated = true;
                        } else {
                            $currentVals = (array) $parentFilters[$name];
                            if (!in_array(trim($val), $currentVals)) {
                                $currentVals[] = trim($val);
                                $parentFilters[$name] = $currentVals;
                                $updated = true;
                            }
                        }
                    }
                    if ($updated) {
                        $currentProduct->filter_values = $parentFilters;
                        $currentProduct->save();
                    }
                    continue;
                }

                // New Product Row
                $lastSku = $sku;

                // Identify Categories (can be multiple separated by comma)
                $categoryIds = [];
                $catInput = trim($data['categories'] ?? '');
                if ($catInput) {
                    $catNames = explode(',', $catInput);
                    foreach ($catNames as $catName) {
                        $catName = trim($catName);
                        if (!$catName)
                            continue;

                        if (is_numeric($catName)) {
                            $categoryIds[] = (int) $catName;
                        } else {
                            // Find by name or path
                            if (str_contains($catName, ' > ')) {
                                $parts = explode(' > ', $catName);
                                $childName = array_pop($parts);
                                $parentName = array_pop($parts);
                                $category = Category::where('name', $childName)
                                    ->whereHas('parent', function ($q) use ($parentName) {
                                        $q->where('name', $parentName);
                                    })->first();
                            } else {
                                $category = Category::where('name', $catName)->first();
                            }

                            if ($category) {
                                $categoryIds[] = $category->id;
                            }
                        }
                    }
                }
                $categoryIds = array_unique($categoryIds);
                $primaryCategoryId = !empty($categoryIds) ? $categoryIds[0] : null;

                // Identify Brand
                $brandId = null;
                $brandInput = trim($data['brand_name_or_id'] ?? '');
                if ($brandInput) {
                    if (is_numeric($brandInput)) {
                        $brandId = (int) $brandInput;
                    } else {
                        $normBrand = $normalize($brandInput);
                        $brand = Brand::all()->first(fn($b) => $normalize($b->name) === $normBrand);
                        $brandId = $brand ? $brand->id : null;
                    }
                }

                // Process Filters (columns starting with "Filter: ")
                $filterValues = [];
                foreach ($data as $key => $value) {
                    $keyString = (string) $key;
                    if (str_starts_with($keyString, 'Filter: ') && trim($value) !== '') {
                        $rawName = str_replace('Filter: ', '', $keyString);
                        $normName = $normalize($rawName);
                        // Use the official name from DB if matched
                        $officialName = $filterMap[$normName] ?? $rawName;
                        // Always store as array for consistency
                        $filterValues[$officialName] = [trim($value)];
                    }
                }

                $productData = [
                    'sku' => $sku,
                    'name' => trim($data['name'] ?? ''),
                    'slug' => trim($data['slug'] ?? Str::slug($data['name'] ?? '')),
                    'description' => $data['description'] ?? null,
                    'short_description' => $data['short_description'] ?? null,
                    'price' => (float) ($data['price'] ?? 0),
                    'original_price' => isset($data['original_price']) ? (float) $data['original_price'] : null,
                    'cost_price' => isset($data['cost_price']) ? (float) $data['cost_price'] : null,
                    'stock_quantity' => (int) ($data['stock_quantity'] ?? 0),
                    'category_id' => $primaryCategoryId,
                    'brand_id' => $brandId,
                    'is_active' => filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'is_featured' => filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'show_description' => filter_var($data['show_description'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'show_specifications' => filter_var($data['show_specifications'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    'filter_values' => $filterValues,
                    'stock_status' => !empty($data['stock_status']) ? $data['stock_status'] : ((int) ($data['stock_quantity'] ?? 0) > 0 ? 'in_stock' : 'out_of_stock'),
                    'in_stock' => (int) ($data['stock_quantity'] ?? 0) > 0,
                ];

                // Update or Create Product
                $product = Product::updateOrCreate(['sku' => $sku], $productData);

                // Aggregation Logic
                $currentProduct = $product;

                if ($product->wasRecentlyCreated) {
                    $createdCount++;
                } else {
                    $updatedCount++;
                }

                Log::info('Bulk import product saved', [
                    'import_id' => $importId,
                    'row_number' => $currentRowNumber,
                    'sku' => $sku,
                    'product_id' => $product->id,
                    'was_recently_created' => $product->wasRecentlyCreated,
                    'category_ids' => $categoryIds,
                    'brand_id' => $brandId,
                ]);

                if (!empty($categoryIds)) {
                    $product->categories()->sync($categoryIds);
                }

                // Handle Images for the product
                $this->processProductImages($product, $data, $fileMap);
                $this->handleBulkSizeGuideImages($product, $data, $fileMap);

                // Handle initial variant if provided in the same row
                if (!empty($data['variant_sku']) || !empty($filterValues)) {
                    $this->processVariantRow($product, $data, $fileMap);
                }
            }

            DB::commit();
            Log::info('Bulk import completed', [
                'import_id' => $importId,
                'rows_processed' => $rowCount,
                'created' => $createdCount,
                'updated' => $updatedCount,
                'file_map_count' => count($fileMap),
            ]);

            return response()->json([
                'message' => 'تم استيراد المنتجات بنجاح',
                'summary' => [
                    'rows_processed' => $rowCount,
                    'created' => $createdCount,
                    'updated' => $updatedCount,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk import failed', [
                'import_id' => $importId,
                'row_number' => $currentRowNumber,
                'sku' => $currentSku,
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'فشل الاستيراد: ' . $e->getMessage(),
                'line' => $e->getLine(),
                'import_id' => $importId,
                'row_number' => $currentRowNumber,
                'sku' => $currentSku
            ], 500);
        } finally {
            if ($tempImportDir) {
                Log::info('Bulk import cleaning temp dir', [
                    'import_id' => $importId,
                    'temp_dir' => $tempImportDir,
                ]);
                $this->cleanupBulkImportTempDir($tempImportDir);
            }
        }
    }

    public function importStatus(ProductImport $productImport): JsonResponse
    {
        return response()->json([
            'import' => [
                'id' => $productImport->id,
                'uuid' => $productImport->uuid,
                'status' => $productImport->status,
                'stage' => $productImport->stage,
                'progress' => $productImport->progress,
                'message' => $productImport->message,
                'total_rows' => $productImport->total_rows,
                'processed_rows' => $productImport->processed_rows,
                'created_count' => $productImport->created_count,
                'updated_count' => $productImport->updated_count,
                'row_number' => $productImport->row_number,
                'sku' => $productImport->sku,
                'summary' => $productImport->summary,
                'error_message' => $productImport->error_message,
                'started_at' => $productImport->started_at,
                'completed_at' => $productImport->completed_at,
            ],
        ]);
    }

    private function formatInboxAsset(string $path): array
    {
        return [
            'path' => $path,
            'name' => basename($path),
            'size' => Storage::size($path),
            'modified_at' => Storage::lastModified($path),
        ];
    }

    private function resolveInboxAssetPath(string $path, string $directory): string
    {
        $normalized = trim(str_replace('\\', '/', $path), '/');
        $expectedPrefix = trim($directory, '/');

        if (!str_starts_with($normalized, $expectedPrefix . '/')) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'file_path' => ['المسار المحدد خارج مجلد الاستيراد المسموح.'],
            ]);
        }

        if (!Storage::exists($normalized)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'file_path' => ['الملف المحدد غير موجود داخل مجلد الاستيراد.'],
            ]);
        }

        return $normalized;
    }

    private function extractFiltersFromRow(array $data, callable $normalize, array $filterMap)
    {
        $filters = [];
        foreach ($data as $key => $value) {
            $keyString = (string) $key;
            if (str_starts_with($keyString, 'Filter: ') && trim($value) !== '') {
                $rawName = str_replace('Filter: ', '', $keyString);
                $normName = $normalize($rawName);
                $officialName = $filterMap[$normName] ?? $rawName;
                $filters[$officialName] = trim($value);
            }
        }
        return $filters;
    }

    private function processVariantRow(Product $product, array $data, array $fileMap = [])
    {
        $variantValues = [];
        foreach ($data as $key => $value) {
            $keyString = (string) $key;
            if (str_starts_with($keyString, 'Filter: ') && trim($value) !== '') {
                $filterName = str_replace('Filter: ', '', $keyString);
                $variantValues[$filterName] = trim($value);
            }
        }

        if (empty($variantValues) && empty($data['variant_sku']))
            return;

        $variantImages = [];
        // 1. Variant image URLs
        $vUrls = explode(',', $data['variant_image_urls'] ?? '');
        foreach ($vUrls as $vUrl) {
            $vUrl = trim($vUrl);
            if (filter_var($vUrl, FILTER_VALIDATE_URL)) {
                $variantImages[] = [
                    'image_url' => $vUrl,
                ];
            }
        }

        // 2. Variant image filenames
        $vFilenames = explode(',', $data['variant_image_filenames'] ?? '');
        foreach ($vFilenames as $vfName) {
            $vfName = trim($vfName);
            if (isset($fileMap[$vfName])) {
                $path = $this->storeBulkImportFile($fileMap[$vfName], 'products/variants', 'variant');
                $variantImages[] = [
                    'image_url' => '/storage/' . $path,
                ];
            }
        }

        $product->variants()->updateOrCreate(
            ['sku' => $data['variant_sku'] ?? ($product->sku . '-' . Str::random(5))],
            [
                'variant_values' => $variantValues,
                'price' => (isset($data['variant_price']) && trim($data['variant_price']) !== '') ? (float) $data['variant_price'] : $product->price,
                'stock_quantity' => isset($data['variant_stock']) ? (int) $data['variant_stock'] : 0,
                'images' => !empty($variantImages) ? $variantImages : null,
            ]
        );
    }

    private function processProductImages(Product $product, array $data, array $fileMap)
    {
        $allImages = [];

        // 1. URLs
        $urls = explode(',', $data['image_urls'] ?? '');
        foreach ($urls as $url) {
            $url = trim($url);
            if (filter_var($url, FILTER_VALIDATE_URL)) {
                $allImages[] = [
                    'image_path' => $url,
                    'image_url' => $url,
                    'is_primary' => count($allImages) === 0,
                    'sort_order' => count($allImages)
                ];
            }
        }

        // 2. Filenames (from manual upload)
        $filenames = explode(',', $data['image_filenames'] ?? '');
        foreach ($filenames as $index => $fname) {
            $fname = trim($fname);
            if (isset($fileMap[$fname])) {
                $path = $this->storeBulkImportFile($fileMap[$fname], 'products', 'bulk');

                $allImages[] = [
                    'image_path' => $path,
                    'image_url' => '/storage/' . $path,
                    'is_primary' => count($allImages) === 0,
                    'sort_order' => count($allImages)
                ];
            }
        }

        if (!empty($allImages)) {
            $product->images = $allImages;
            // Set first image as cover_image
            if (isset($allImages[0]['image_url'])) {
                $product->cover_image = $allImages[0]['image_url'];
            }
            $product->save();
        }
    }

    private function handleBulkSizeGuideImages(Product $product, array $data, array $fileMap)
    {
        $allGuideImages = [];

        // 1. URLs
        $urls = explode(',', $data['size_guide_image_urls'] ?? '');
        foreach ($urls as $url) {
            $url = trim($url);
            if (filter_var($url, FILTER_VALIDATE_URL)) {
                $allGuideImages[] = [
                    'image_path' => $url,
                    'image_url' => $url,
                ];
            }
        }

        // 2. Filenames
        $filenames = explode(',', $data['size_guide_image_filenames'] ?? '');
        foreach ($filenames as $fname) {
            $fname = trim($fname);
            if (isset($fileMap[$fname])) {
                $path = $this->storeBulkImportFile($fileMap[$fname], 'products/size-guides', 'bulk_sg');
                $allGuideImages[] = [
                    'image_path' => $path,
                    'image_url' => '/storage/' . $path,
                ];
            }
        }

        if (!empty($allGuideImages)) {
            $product->size_guide_images = $allGuideImages;
            $product->save();
        }
    }

    private function syncSizeGuideImages(Request $request, Product $product): void
    {
        $hasExisting = $request->has('size_guide_existing_images');
        $hasUrls = $request->has('size_guide_image_urls');
        $files = $this->extractUploadedFiles($request, 'size_guide_images');
        $hasFiles = count($files) > 0;

        // Do not modify if request doesn't include any size guide payload.
        if (!$hasExisting && !$hasUrls && !$hasFiles) {
            return;
        }

        $imagesToKeep = [];
        if ($hasExisting) {
            $existing = $request->input('size_guide_existing_images');
            if (is_string($existing)) {
                $existing = json_decode($existing, true);
            }
            if (is_array($existing)) {
                $imagesToKeep = $existing;
            }
        }

        $newUrlImages = [];
        if ($hasUrls) {
            $urls = $request->input('size_guide_image_urls');
            if (is_string($urls)) {
                $urls = json_decode($urls, true);
            }
            if (is_array($urls)) {
                foreach ($urls as $url) {
                    if (is_string($url) && filter_var($url, FILTER_VALIDATE_URL)) {
                        $newUrlImages[] = [
                            'image_path' => $url,
                            'image_url' => $url,
                        ];
                    }
                }
            }
        }

        $uploadedImages = [];
        foreach ($files as $index => $file) {
            if (!$file || !$file->isValid()) {
                continue;
            }

            $validator = Validator::make(
                ['image' => $file],
                ['image' => 'required|file|image|mimes:jpeg,png,jpg,gif,webp|max:10240']
            );

            if ($validator->fails()) {
                continue;
            }

            $path = ImageUploadOptimizer::storeUploaded($file, 'products/size-guides', "size_guide_{$index}");

            $uploadedImages[] = [
                'image_path' => $path,
                    'image_url' => '/storage/' . $path,
            ];
        }

        $product->size_guide_images = array_values(array_merge($imagesToKeep, $newUrlImages, $uploadedImages));
        $product->save();
    }

    private function extractUploadedFiles(Request $request, string $field): array
    {
        $files = [];
        if ($request->hasFile($field)) {
            $files = $request->file($field);
            if (!is_array($files)) {
                $files = [$files];
            }
            return $files;
        }

        $index = 0;
        while ($request->hasFile("{$field}[{$index}]")) {
            $files[] = $request->file("{$field}[{$index}]");
            $index++;
        }

        if (count($files) === 0) {
            $index = 0;
            while ($request->hasFile("{$field}.{$index}")) {
                $files[] = $request->file("{$field}.{$index}");
                $index++;
            }
        }

        return $files;
    }

    /**
     * Prepare product with frontend-specific requirements (variants, stock, price range)
     */
    private function prepareProductForFrontend($product, $allFilters = [])
    {
        $hasVariants = $product->variants && $product->variants->count() > 0;
        $product->has_variants = $hasVariants;

        // Critical check: If the manual status is "out_of_stock", it should OVERRIDE everything
        $manualOutStock = ($product->stock_status === 'out_of_stock');

        if ($hasVariants) {
            $variantsToConsider = $product->variants;

            // If filters are active, only consider variants that match selected filters
            if (!empty($allFilters)) {
                $variantsToConsider = $product->variants->filter(function ($variant) use ($allFilters) {
                    foreach ($allFilters as $filterKey => $filterValue) {
                        $values = is_array($filterValue) ? $filterValue : explode(',', $filterValue);
                        $values = array_map('trim', array_filter($values));
                        if (empty($values))
                            continue;

                        $match = false;
                        $variantJson = json_encode($variant->variant_values, JSON_UNESCAPED_UNICODE);

                        foreach ($values as $val) {
                            $normalizedVal = preg_replace('/[أإآ]/u', 'ا', $val);
                            if (
                                mb_strpos($variantJson, '"' . $val . '"') !== false ||
                                mb_strpos($variantJson, '"' . $normalizedVal . '"') !== false
                            ) {
                                $match = true;
                                break;
                            }
                        }
                        if (!$match)
                            return false;
                    }
                    return true;
                });
            }

            // Update product effective stock status and quantities
            if ($variantsToConsider->count() > 0) {
                $totalStock = $variantsToConsider->sum('stock_quantity');
                $product->stock_quantity = $totalStock;

                // Manual status overrides
                if ($manualOutStock) {
                    $product->in_stock = false;
                    $product->stock_status = 'out_of_stock';
                } elseif ($product->stock_status === 'in_stock') {
                    $product->in_stock = true;
                    $product->stock_status = 'in_stock';
                } else {
                    // stock_based logic: in_stock if totalStock > 0
                    $product->in_stock = $totalStock > 0;
                    $product->stock_status = $totalStock > 0 ? 'in_stock' : 'out_of_stock';
                }

                // Update price to use variant price (Lowest price of considered variants)
                $minPrice = $variantsToConsider->min('price');
                $maxPrice = $variantsToConsider->max('price');
                if ($minPrice > 0) {
                    $product->price = (float) $minPrice;
                    if ($minPrice != $maxPrice) {
                        $product->has_price_range = true;
                        $product->max_price = (float) $maxPrice;
                    }
                }
            } else if (!empty($allFilters)) {
                // If no variants match at all for these filters, it's effectively out of stock
                $product->in_stock = false;
                $product->stock_status = 'out_of_stock';
                $product->stock_quantity = 0;
            }
        } else {
            // If no variants, just ensure manual status overrides are respected
            if ($manualOutStock) {
                $product->in_stock = false;
            } elseif ($product->stock_status === 'in_stock') {
                $product->in_stock = true;
            }
        }
    }

    private function extractBulkImportZip($zipFile): array
    {
        $zip = new \ZipArchive();
        $opened = $zip->open($zipFile->getRealPath());

        if ($opened !== true) {
            throw new \RuntimeException('تعذر فتح ملف الصور المضغوط.');
        }

        $tempDir = storage_path('app/tmp/product-import-' . Str::uuid());
        File::ensureDirectoryExists($tempDir);

        $fileMap = [];
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $skippedEntries = 0;

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entryName = $zip->getNameIndex($i);
            if (!$entryName || str_ends_with($entryName, '/')) {
                $skippedEntries++;
                continue;
            }

            $basename = basename($entryName);
            if ($basename === '' || str_starts_with($basename, '.')) {
                $skippedEntries++;
                continue;
            }

            $extension = strtolower(pathinfo($basename, PATHINFO_EXTENSION));
            if (!in_array($extension, $allowedExtensions, true)) {
                $skippedEntries++;
                continue;
            }

            $stream = $zip->getStream($entryName);
            if (!$stream) {
                Log::warning('Bulk import zip entry stream could not be opened', [
                    'zip_name' => $zipFile->getClientOriginalName(),
                    'entry_name' => $entryName,
                ]);
                continue;
            }

            $tempPath = $tempDir . DIRECTORY_SEPARATOR . Str::random(12) . '_' . $basename;
            $target = fopen($tempPath, 'wb');
            stream_copy_to_stream($stream, $target);
            fclose($stream);
            fclose($target);

            $fileMap[$basename] = [
                'source' => 'zip',
                'path' => $tempPath,
                'original_name' => $basename,
            ];
        }

        $zip->close();
        Log::info('Bulk import zip summary', [
            'zip_name' => $zipFile->getClientOriginalName(),
            'zip_entries_total' => $zip->numFiles,
            'extracted_files_count' => count($fileMap),
            'skipped_entries_count' => $skippedEntries,
            'temp_dir' => $tempDir,
        ]);

        return ['map' => $fileMap, 'temp_dir' => $tempDir];
    }

    private function storeBulkImportFile(array $fileRef, string $directory, string $prefix): string
    {
        $originalName = $fileRef['original_name'] ?? 'image';

        if (($fileRef['source'] ?? null) === 'upload') {
            return ImageUploadOptimizer::storeUploaded($fileRef['file'], $directory, $prefix);
        }

        $sourcePath = $fileRef['path'] ?? null;
        if (!$sourcePath || !is_file($sourcePath)) {
            Log::error('Bulk import source file missing during store', [
                'original_name' => $originalName,
                'directory' => $directory,
                'prefix' => $prefix,
                'source' => $fileRef['source'] ?? null,
                'source_path' => $sourcePath,
            ]);
            throw new \RuntimeException("ملف الصورة {$originalName} غير موجود بعد فك الضغط.");
        }

        return ImageUploadOptimizer::storeFromLocalPath($sourcePath, (string) $originalName, $directory, $prefix);
    }

    private function cleanupBulkImportTempDir(string $tempDir): void
    {
        if (is_dir($tempDir)) {
            File::deleteDirectory($tempDir);
        }
    }
}
