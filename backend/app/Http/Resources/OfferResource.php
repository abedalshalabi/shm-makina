<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\MediaUrl;

class OfferResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Load products if products array exists
        $productsData = [];
        if ($this->products && is_array($this->products)) {
            /** @var \Illuminate\Database\Eloquent\Collection<\App\Models\Product> $products */
            $products = \App\Models\Product::whereIn('id', $this->products)
                ->where('is_active', true)
                ->get();
            
            foreach ($products as $product) {
                // Determine starting price from variants if available
                $displayPrice = (float) $product->price;
                $displayOriginalPrice = $product->original_price ? (float) $product->original_price : null;

                $hasDifferentPrices = false;
                if ($product->variants()->exists()) {
                    $variants = $product->variants()->where('price', '>', 0)->get();
                    if ($variants->isNotEmpty()) {
                        $bestVariant = $variants->sortBy('price')->first();
                        $displayPrice = (float) $bestVariant->price;
                        
                        // Check if there's any price variation
                        $uniquePricesCount = $variants->pluck('price')->unique()->count();
                        if ($uniquePricesCount > 1) {
                            $hasDifferentPrices = true;
                        }
                    }
                }

                $firstImage = null;
                if ($product->images && is_array($product->images) && count($product->images) > 0) {
                    $firstImageObj = $product->images[0];
                    if (is_string($firstImageObj)) {
                        $firstImage = MediaUrl::publicUrl($firstImageObj);
                    } elseif (is_array($firstImageObj) && isset($firstImageObj['image_url'])) {
                        $firstImage = MediaUrl::publicUrl($firstImageObj['image_url']);
                    } elseif (is_array($firstImageObj) && isset($firstImageObj['image_path'])) {
                        $firstImage = MediaUrl::publicUrl($firstImageObj['image_path']);
                    }
                }
                
                $productsData[] = [
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
                    'has_variants' => $product->variants()->exists(),
                    'filter_values' => $product->filter_values ?: [],
                ];
            }
        }

        // Load bundle items if bundle_items exists
        $bundleItemsData = [];
        if ($this->bundle_items && is_array($this->bundle_items)) {
            foreach ($this->bundle_items as $item) {
                $productId = is_array($item) ? ($item['product_id'] ?? $item['id'] ?? null) : $item;
                if ($productId) {
                    $product = \App\Models\Product::find($productId);
                    if ($product && $product->is_active) {
                        $firstImage = null;
                        if ($product->images && is_array($product->images) && count($product->images) > 0) {
                            $firstImageObj = $product->images[0];
                            if (is_string($firstImageObj)) {
                                $firstImage = MediaUrl::publicUrl($firstImageObj);
                            } elseif (is_array($firstImageObj) && isset($firstImageObj['image_url'])) {
                                $firstImage = MediaUrl::publicUrl($firstImageObj['image_url']);
                            } elseif (is_array($firstImageObj) && isset($firstImageObj['image_path'])) {
                                $firstImage = MediaUrl::publicUrl($firstImageObj['image_path']);
                            }
                        }
                        
                        $bundleItemsData[] = [
                            'product_id' => $product->id,
                            'product_name' => $product->name,
                            'product_slug' => $product->slug,
                            'quantity' => $item['quantity'] ?? 1,
                            'price' => (float) $product->price,
                            'image' => $firstImage,
                        ];
                    }
                }
            }
        }

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'image' => $this->image,
            'discount_percentage' => $this->discount_percentage ? (float) $this->discount_percentage : null,
            'fixed_discount' => $this->fixed_discount ? (float) $this->fixed_discount : null,
            'starts_at' => $this->starts_at->toIso8601String(),
            'ends_at' => $this->ends_at->toIso8601String(),
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'products' => $productsData,
            'bundle_items' => $bundleItemsData,
            'bundle_price' => $this->bundle_price ? (float) $this->bundle_price : null,
            'original_bundle_price' => $this->original_bundle_price ? (float) $this->original_bundle_price : null,
            'stock_limit' => $this->stock_limit,
            'sold_count' => $this->sold_count,
            'is_currently_active' => $this->isActive(),
            'remaining_time' => $this->getRemainingTime(),
            'progress_percentage' => $this->getProgressPercentage(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

