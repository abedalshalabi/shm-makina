<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\MediaUrl;

class OrderResource extends JsonResource
{
    private function getVariantPrimaryImage($variant)
    {
        if (!$variant) {
            return null;
        }

        $images = $variant->images ?? [];
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

    /**
     * Get primary image from product images (handles both array and Collection)
     */
    private function getProductPrimaryImage($images)
    {
        if (empty($images)) {
            return null;
        }

        // Convert to array if it's a Collection
        $imagesArray = is_array($images) ? $images : $images->toArray();

        // Find primary image
        foreach ($imagesArray as $image) {
            $imageData = is_array($image) ? $image : (array) $image;
            if (isset($imageData['is_primary']) && $imageData['is_primary']) {
                return MediaUrl::publicUrl($imageData['image_url'] ?? $imageData['image_path'] ?? null);
            }
        }

        // If no primary image found, return first image
        if (!empty($imagesArray)) {
            $firstImage = is_array($imagesArray[0]) ? $imagesArray[0] : (array) $imagesArray[0];
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
            'order_number' => $this->order_number,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'customer_phone' => $this->customer_phone,
            'customer_city' => $this->customer_city,
            'customer_district' => $this->customer_district,
            'customer_street' => $this->customer_street,
            'customer_building' => $this->customer_building,
            'customer_additional_info' => $this->customer_additional_info,
            'subtotal' => $this->subtotal,
            'shipping_cost' => $this->shipping_cost,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'discount_amount' => $this->discount_amount,
            'force_free_shipping' => (bool) $this->force_free_shipping,
            'total' => $this->total,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'order_status' => $this->order_status,
            'notes' => $this->notes,
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'product_variant_id' => $item->product_variant_id,
                        'product_name' => $item->product_name,
                        'product_sku' => $item->product_sku,
                        'variant_values' => $item->variant_values,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'original_price' => $item->original_price,
                        'discount_amount' => $item->discount_amount,
                        'total' => $item->total,
                        'product' => $item->product ? [
                            'id' => $item->product->id,
                            'name' => $item->product->name,
                            'slug' => $item->product->slug,
                            'image' => $this->getVariantPrimaryImage($item->productVariant)
                                ?: $this->getProductPrimaryImage($item->product->images),
                        ] : null,
                    ];
                });
            }),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
