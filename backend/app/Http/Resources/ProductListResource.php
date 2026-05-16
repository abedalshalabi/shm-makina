<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\MediaUrl;

class ProductListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $normalizedImages = [];
        if (is_array($this->images) && count($this->images) > 0) {
            $firstImage = $this->images[0];
            if (is_object($firstImage)) {
                $firstImage = (array) $firstImage;
            }
            if (is_array($firstImage)) {
                $imagePath = $firstImage['image_path'] ?? $firstImage['path'] ?? '';
                $normalizedImages[] = MediaUrl::normalizeImageEntry($firstImage + ['image_path' => $imagePath]);
            } elseif (is_string($firstImage) && trim($firstImage) !== '') {
                $normalizedImages[] = [
                    'id' => null,
                    'image_path' => MediaUrl::normalizeStoredPath($firstImage) ?? '',
                    'image_url' => MediaUrl::publicUrl($firstImage) ?? '',
                    'alt_text' => null,
                    'is_primary' => true,
                    'sort_order' => 0,
                ];
            }
        }

        if (empty($normalizedImages) && is_string($this->cover_image) && trim($this->cover_image) !== '') {
            $normalizedImages[] = [
                'id' => null,
                'image_path' => MediaUrl::normalizeStoredPath($this->cover_image) ?? '',
                'image_url' => MediaUrl::publicUrl($this->cover_image) ?? '',
                'alt_text' => null,
                'is_primary' => true,
                'sort_order' => 0,
            ];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'price' => $this->price,
            'original_price' => $this->original_price,
            'compare_price' => $this->compare_price,
            'discount_percentage' => $this->discount_percentage,
            'stock_quantity' => $this->stock_quantity,
            'stock_status' => $this->stock_status,
            'in_stock' => $this->in_stock,
            'rating' => $this->rating ? (float) $this->rating : 0.0,
            'reviews_count' => $this->reviews_count,
            'views_count' => $this->views_count,
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'slug' => $this->category->slug,
                    'color' => $this->category->color,
                ] : null;
            }),
            'categories' => $this->whenLoaded('categories', function () {
                return $this->categories->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                        'color' => $category->color,
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
            'images' => $normalizedImages,
            'cover_image' => MediaUrl::publicUrl($this->cover_image),
            'filter_values' => $this->filter_values,
            'has_variants' => (bool) $this->has_variants,
            'has_price_range' => (bool) $this->has_price_range,
            'max_price' => (float) $this->max_price,
        ];
    }
}

