<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\MediaUrl;

class CartResource extends JsonResource
{
    private function getProductFallbackImageUrl(): ?string
    {
        $coverImage = MediaUrl::publicUrl($this->product->cover_image);
        if ($coverImage) {
            return $coverImage;
        }

        $images = $this->product->images ?? [];
        if (!is_array($images) || empty($images)) {
            return null;
        }

        $first = $images[0] ?? null;
        if (is_string($first)) {
            return MediaUrl::publicUrl($first);
        }

        if (is_array($first)) {
            return MediaUrl::publicUrl($first['image_url'] ?? $first['image_path'] ?? null);
        }

        if (is_object($first)) {
            return MediaUrl::publicUrl($first->image_url ?? $first->image_path ?? null);
        }

        return null;
    }

    private function getVariantPrimaryImageUrl(): ?string
    {
        if (!$this->product_variant_id || !$this->variant) {
            return null;
        }

        $variantImages = $this->variant->images;
        if (empty($variantImages) || !is_array($variantImages)) {
            return null;
        }

        $firstImage = $variantImages[0] ?? null;
        if (is_string($firstImage)) {
            return MediaUrl::publicUrl($firstImage);
        }

        if (is_array($firstImage)) {
            return MediaUrl::publicUrl($firstImage['image_url'] ?? $firstImage['image_path'] ?? null);
        }

        return null;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quantity' => $this->quantity,
            'price' => $this->price,
            'total' => $this->total,
            'stock_status' => $this->product->stock_status ?? 'always_in_stock',
            'stock_quantity' => $this->product_variant_id && $this->variant ? $this->variant->stock_quantity : $this->product->stock_quantity,
            'manage_stock' => ($this->product->stock_status ?? '') === 'stock_based',
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
                'price' => $this->product->price,
                'original_price' => $this->product->original_price,
                'discount_percentage' => $this->product->discount_percentage,
                'sku' => $this->product->sku,
                'in_stock' => $this->product->in_stock,
                'stock_quantity' => $this->product->stock_quantity,
                'category' => $this->product->category ? [
                    'id' => $this->product->category->id,
                    'name' => $this->product->category->name,
                    'slug' => $this->product->category->slug,
                ] : null,
                'brand' => $this->product->brand ? [
                    'id' => $this->product->brand->id,
                    'name' => $this->product->brand->name,
                    'slug' => $this->product->brand->slug,
                ] : null,
                'images' => collect($this->product->images ?? [])->map(function ($image) {
                    $imageArray = is_object($image) ? [
                        'id' => $image->id ?? null,
                        'image_path' => $image->image_path ?? '',
                        'image_url' => $image->image_url ?? ($image->image_path ?? ''),
                        'alt_text' => $image->alt_text ?? null,
                        'is_primary' => $image->is_primary ?? false,
                    ] : (array) $image;

                    return MediaUrl::normalizeImageEntry($imageArray);
                }),
                'cover_image' => MediaUrl::publicUrl($this->product->cover_image),
                'image' => $this->getVariantPrimaryImageUrl() ?: $this->getProductFallbackImageUrl(),
            ],
            'product_variant_id' => $this->product_variant_id,
            'variant_values' => $this->variant_values,
            'variant' => $this->variant ? [
                'id' => $this->variant->id,
                'images' => $this->variant->images,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
