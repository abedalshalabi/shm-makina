<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\SiteSetting;
use App\Support\AppUrl;
use App\Support\MediaUrl;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Collection;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;

class OrderPlacedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public string $recipientType = 'customer'
    ) {
    }

    public function build(): static
    {
        $this->order->loadMissing(['items.product.images', 'items.productVariant']);

        $siteName = SiteSetting::getValue('site_name', config('app.name'));
        $frontendUrl = AppUrl::frontend();
        $backendUrl = AppUrl::backendPublic();
        $headerLogo = SiteSetting::getValue('header_logo', '/logo.webp');
        $headerPhone = SiteSetting::getValue('header_phone', '');
        $logoUrl = $this->resolveMailLogoUrl($headerLogo, $frontendUrl, $backendUrl);
        $logoPath = $this->resolveLocalImagePath($headerLogo);
        $successUrl = $frontendUrl . '/order-success';

        return $this
            ->subject($this->recipientType === 'admin'
                ? "طلب جديد {$this->order->order_number} - {$siteName}"
                : "تم استلام طلبك {$this->order->order_number} - {$siteName}")
            ->view('emails.orders.placed')
            ->with([
                'order' => $this->order,
                'siteName' => $siteName,
                'recipientType' => $this->recipientType,
                'frontendUrl' => $frontendUrl,
                'successUrl' => $successUrl,
                'logoUrl' => $logoUrl,
                'logoPath' => $logoPath,
                'headerPhone' => $headerPhone,
                'paymentMethodLabel' => $this->getPaymentMethodLabel(),
                'orderStatusLabel' => $this->getOrderStatusLabel(),
                'customerAddress' => $this->getCustomerAddress(),
                'orderItems' => $this->buildOrderItems($frontendUrl, $backendUrl),
                'discountSummary' => $this->buildDiscountSummary(),
            ]);
    }

    private function getPaymentMethodLabel(): string
    {
        return match ($this->order->payment_method) {
            'cod' => 'الدفع عند الاستلام',
            'credit_card' => 'بطاقة ائتمان',
            'paypal' => 'PayPal',
            default => (string) $this->order->payment_method,
        };
    }

    private function getOrderStatusLabel(): string
    {
        return match ($this->order->order_status) {
            'pending' => 'قيد التحضير',
            'processing' => 'قيد المعالجة',
            'shipped' => 'تم الشحن',
            'delivered' => 'تم التسليم',
            'cancelled' => 'ملغي',
            default => (string) $this->order->order_status,
        };
    }

    private function getCustomerAddress(): string
    {
        $parts = array_filter([
            $this->order->customer_city,
            $this->order->customer_district,
            $this->order->customer_street,
            $this->order->customer_building,
        ], fn ($value) => filled($value));

        return implode('، ', $parts);
    }

    private function buildOrderItems(string $frontendUrl, string $backendUrl): Collection
    {
        return $this->order->items->map(function ($item) use ($frontendUrl, $backendUrl) {
            $product = $item->product;

            $imagePath = null;
            $variant = $item->productVariant;

            if ($variant) {
                $imagePath = $this->getVariantPrimaryImagePath($variant);
            }

            if ($product) {
                $productImages = $this->resolveProductImages($product);

                $primaryImage = $productImages
                    ->sortBy([
                        ['is_primary', 'desc'],
                        ['sort_order', 'asc'],
                    ])
                    ->first();

                if (!$imagePath) {
                    $imagePath = $product->cover_image
                        ?: ($primaryImage?->image_path);
                }
            }

            $unitPrice = (float) $item->price;
            $originalPrice = (float) ($item->original_price ?? 0);
            $quantity = (int) $item->quantity;
            $storedDiscountAmount = (float) ($item->discount_amount ?? 0);
            $computedLineDiscount = ($originalPrice > $unitPrice)
                ? max(0, ($originalPrice - $unitPrice) * $quantity)
                : 0.0;
            $lineDiscount = $storedDiscountAmount > 0 ? $storedDiscountAmount : $computedLineDiscount;
            $unitDiscount = $quantity > 0 ? ($lineDiscount / $quantity) : 0.0;
            $discountPercentage = ($originalPrice > 0 && $originalPrice > $unitPrice)
                ? round((($originalPrice - $unitPrice) / $originalPrice) * 100, 2)
                : 0.0;

            return [
                'name' => $item->product_name,
                'sku' => $item->product_sku,
                'quantity' => $quantity,
                'price' => $unitPrice,
                'original_price' => $originalPrice,
                'total' => (float) $item->total,
                'unit_discount' => $unitDiscount,
                'line_discount' => $lineDiscount,
                'discount_percentage' => $discountPercentage,
                'variant_values' => is_array($item->variant_values) ? $item->variant_values : [],
                'image_url' => MediaUrl::publicUrl($imagePath),
                'image_path' => $this->resolveLocalImagePath($imagePath),
                'product_url' => $product ? $frontendUrl . '/product/' . $product->id : null,
            ];
        });
    }

    private function getVariantPrimaryImagePath($variant): ?string
    {
        if (!$variant) {
            return null;
        }

        $images = $variant->relationLoaded('images') 
            ? $variant->getRelation('images') 
            : $variant->getAttribute('images');

        if ($images instanceof \Illuminate\Support\Collection) {
            $images = $images->toArray();
        }

        if (!is_array($images) || empty($images)) {
            return null;
        }

        $first = $images[0] ?? null;
        if (is_string($first) && $first !== '') {
            return $first;
        }

        if (is_array($first)) {
            return $first['image_path'] ?? $first['image_url'] ?? null;
        }

        if (is_object($first)) {
            return $first->image_path ?? $first->image_url ?? null;
        }

        return null;
    }

    private function buildDiscountSummary(): array
    {
        $itemsDiscountTotal = $this->order->items->sum(function ($item) {
            $unitPrice = (float) $item->price;
            $originalPrice = (float) ($item->original_price ?? 0);
            $quantity = (int) $item->quantity;
            $storedDiscountAmount = (float) ($item->discount_amount ?? 0);

            if ($storedDiscountAmount > 0) {
                return $storedDiscountAmount;
            }

            if ($originalPrice > $unitPrice) {
                return max(0, ($originalPrice - $unitPrice) * $quantity);
            }

            return 0.0;
        });

        $orderLevelDiscount = max(
            0,
            ((float) $this->order->subtotal + (float) $this->order->shipping_cost) - (float) $this->order->total
        );

        return [
            'items_discount_total' => (float) $itemsDiscountTotal,
            'order_level_discount' => (float) $orderLevelDiscount,
            'total_discount' => (float) ($itemsDiscountTotal + $orderLevelDiscount),
            'has_discount' => (float) ($itemsDiscountTotal + $orderLevelDiscount) > 0,
        ];
    }

    private function resolveProductImages($product): Collection
    {
        if (!$product) {
            return collect();
        }

        // Product has both an "images" casted attribute and an "images()" relation.
        // Always normalize to a Collection so mail rendering does not break checkout.
        if ($product->relationLoaded('images')) {
            $images = $product->getRelation('images');
            return $images instanceof Collection ? $images : collect($images);
        }

        try {
            return $product->images()->get();
        } catch (\Throwable) {
            $images = $product->images ?? [];
            return collect(is_array($images) ? $images : []);
        }
    }

    private function makeFrontendAssetUrl(?string $path, string $frontendUrl, string $backendUrl): string
    {
        if (blank($path)) {
            return $this->extractUrlOrigin($frontendUrl) . '/logo.webp';
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if ($path === '/logo.webp' || $path === 'logo.webp') {
            return $this->extractUrlOrigin($frontendUrl) . '/logo.webp';
        }

        return MediaUrl::publicUrl($path) ?? $this->makeStorageAwareUrl($path, $frontendUrl, $backendUrl);
    }

    private function makeStorageAwareUrl(?string $path, string $frontendUrl, string $backendUrl): ?string
    {
        if (blank($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return MediaUrl::publicUrl($path);
        }

        if (str_contains($path, '/storage/')) {
            $relativePath = explode('/storage/', $path, 2)[1];
            return $backendUrl . '/storage/' . ltrim($relativePath, '/');
        }

        if (str_starts_with($path, '/storage')) {
            return $backendUrl . $path;
        }

        if (str_starts_with($path, 'storage/')) {
            return $backendUrl . '/' . $path;
        }

        if (str_starts_with($path, '/')) {
            return $frontendUrl . $path;
        }

        return $backendUrl . '/storage/' . ltrim($path, '/');
    }

    private function extractUrlOrigin(string $url): string
    {
        return AppUrl::origin($url);
    }

    private function resolveMailLogoUrl(?string $headerLogo, string $frontendUrl, string $backendUrl): string
    {
        $mailLogoUrl = trim((string) env('MAIL_LOGO_URL', ''));
        if ($mailLogoUrl !== '') {
            return $mailLogoUrl;
        }

        // Email clients are stricter than browsers. Prefer a stable public logo
        // outside /storage unless the user explicitly provides MAIL_LOGO_URL.
        $origin = $this->extractUrlOrigin($frontendUrl);

        if ($headerLogo === '/logo.webp' || $headerLogo === 'logo.webp' || blank($headerLogo)) {
            return $origin . '/logo.webp';
        }

        return $this->makeFrontendAssetUrl($headerLogo, $frontendUrl, $backendUrl);
    }

    private function resolveLocalImagePath(?string $path): ?string
    {
        if (blank($path)) {
            $defaultLogo = public_path('logo.webp');
            return File::exists($defaultLogo) ? $defaultLogo : null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $normalized = MediaUrl::normalizeStoredPath($path);
            if ($normalized === null || str_starts_with($normalized, 'http://') || str_starts_with($normalized, 'https://')) {
                return null;
            }
            $path = $normalized;
        }

        if ($path === '/logo.webp' || $path === 'logo.webp') {
            $logoPath = public_path('logo.webp');
            return File::exists($logoPath) ? $logoPath : null;
        }

        $normalized = MediaUrl::normalizeStoredPath($path);
        if (!$normalized) {
            return null;
        }

        $storagePath = storage_path('app/public/' . ltrim($normalized, '/'));
        if (File::exists($storagePath)) {
            return $storagePath;
        }

        $publicStoragePath = public_path('storage/' . ltrim($normalized, '/'));
        if (File::exists($publicStoragePath)) {
            return $publicStoragePath;
        }

        $publicPath = public_path(ltrim($normalized, '/'));
        if (File::exists($publicPath)) {
            return $publicPath;
        }

        return null;
    }
}
