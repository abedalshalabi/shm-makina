<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\MediaUrl;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'short_description' => $this->short_description,
            'price' => $this->price,
            'original_price' => $this->original_price,
            'compare_price' => $this->compare_price,
            'cost_price' => $this->cost_price,
            'discount_percentage' => $this->discount_percentage,
            'sku' => $this->sku,
            'stock_quantity' => $this->stock_quantity,
            'manage_stock' => $this->manage_stock,
            'stock_status' => $this->stock_status,
            'in_stock' => $this->in_stock,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'show_in_offers' => (bool)$this->show_in_offers,
            'sort_order' => $this->sort_order,
            'weight' => $this->weight,
            'dimensions' => $this->dimensions,
            'warranty' => $this->warranty,
            'delivery_time' => $this->delivery_time,
            'features' => $this->features,
            'specifications' => $this->specifications,
            'filter_values' => $this->filter_values,
            'variants' => $this->whenLoaded('variants', function () {
                return $this->variants->map(function ($variant) {
                    $variantImages = $variant->images;
                    if (is_array($variantImages)) {
                        $variantImages = array_map(function ($image) {
                            if (is_object($image)) {
                                $image = (array) $image;
                            }
                            if (is_array($image)) {
                                $imagePath = $image['image_path'] ?? $image['path'] ?? '';
                                return MediaUrl::normalizeImageEntry($image + ['image_path' => $imagePath]);
                            }
                            return $image;
                        }, $variantImages);
                    }

                    return [
                        'id' => $variant->id,
                        'product_id' => $variant->product_id,
                        'variant_values' => $variant->variant_values,
                        'price' => $variant->price,
                        'stock_quantity' => $variant->stock_quantity,
                        'sku' => $variant->sku,
                        'images' => $variantImages,
                    ];
                });
            }, []),
            'rating' => $this->rating ? (float) $this->rating : 0.0,
            'reviews_count' => $this->reviews_count,
            'views_count' => $this->views_count,
            'sales_count' => $this->sales_count,
            'category_id' => $this->category_id, // Keep for backward compatibility
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'slug' => $this->category->slug,
                    'color' => $this->category->color,
                    'parent' => $this->category->parent ? [
                        'id' => $this->category->parent->id,
                        'name' => $this->category->parent->name,
                    ] : null,
                ] : null;
            }),
            'categories' => $this->whenLoaded('categories', function () {
                return $this->categories->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                        'color' => $category->color,
                        'parent' => $category->parent ? [
                            'id' => $category->parent->id,
                            'name' => $category->parent->name,
                        ] : null,
                    ];
                });
            }, []),
            'brand_id' => $this->brand_id,
            'brand' => $this->brand ? [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
                'logo' => $this->brand->logo,
            ] : null,
            'images' => $this->when($this->images, function () {
                $images = $this->images;
                
                // Handle array (from JSON column)
                if (is_array($images)) {
                    $result = [];
                    foreach ($images as $image) {
                        // Skip null or empty values
                        if (empty($image) || (!is_array($image) && !is_object($image))) {
                            continue;
                        }
                        
                        // Convert object to array if needed
                        if (is_object($image)) {
                            $image = (array) $image;
                        }
                        
                        // Ensure we have an array
                        if (!is_array($image)) {
                            continue;
                        }
                        
                        // Extract values with safe defaults
                        $imagePath = $image['image_path'] ?? $image['path'] ?? '';
                        $result[] = MediaUrl::normalizeImageEntry($image + ['image_path' => $imagePath]);
                    }
                    return $result;
                }
                
                // Handle Collection (from relationship - backward compatibility)
                if ($images instanceof \Illuminate\Database\Eloquent\Collection) {
                    return $images->map(function ($image) {
                        if (is_array($image)) {
                            return MediaUrl::normalizeImageEntry($image);
                        }
                        if (!is_object($image) || !isset($image->id)) {
                            return null;
                        }
                        return MediaUrl::normalizeImageEntry([
                            'id' => $image->id,
                            'image_path' => $image->image_path ?? '',
                            'image_url' => $image->image_url ?? ($image->image_path ?? ''),
                            'alt_text' => $image->alt_text ?? null,
                            'is_primary' => (bool) ($image->is_primary ?? false),
                            'sort_order' => (int) ($image->sort_order ?? 0),
                        ]);
                    })->filter()->values()->toArray();
                }
                
                return [];
            }, []),
            'size_guide_images' => $this->when($this->size_guide_images, function () {
                $images = $this->size_guide_images;

                if (!is_array($images)) {
                    return [];
                }

                $result = [];
                foreach ($images as $image) {
                    if (empty($image)) {
                        continue;
                    }

                    if (is_string($image)) {
                        $result[] = [
                            'image_path' => MediaUrl::normalizeStoredPath($image) ?? '',
                            'image_url' => MediaUrl::publicUrl($image) ?? '',
                        ];
                        continue;
                    }

                    if (is_object($image)) {
                        $image = (array) $image;
                    }

                    if (!is_array($image)) {
                        continue;
                    }

                    $imagePath = $image['image_path'] ?? $image['path'] ?? '';
                    $imageUrl = MediaUrl::publicUrl($image['image_url'] ?? $imagePath) ?? '';

                    if (!empty($imageUrl)) {
                        $result[] = [
                            'image_path' => MediaUrl::normalizeStoredPath($imagePath) ?? '',
                            'image_url' => $imageUrl,
                        ];
                    }
                }

                return $result;
            }, []),
            'reviews' => $this->whenLoaded('reviews', function () {
                return $this->reviews->map(function ($review) {
                    return [
                        'id' => $review->id,
                        'rating' => $review->rating,
                        'comment' => $review->comment,
                        'customer_name' => $review->customer_name,
                        'created_at' => $review->created_at,
                        'user' => $review->user ? [
                            'id' => $review->user->id,
                            'name' => $review->user->name,
                        ] : null,
                    ];
                });
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'cover_image' => MediaUrl::publicUrl($this->cover_image),
            'has_variants' => (bool)$this->has_variants,
            'has_price_range' => (bool)$this->has_price_range,
            'max_price' => (float)$this->max_price,
            'show_description' => (bool)$this->show_description,
            'show_specifications' => (bool)$this->show_specifications,
        ];
    }
}
