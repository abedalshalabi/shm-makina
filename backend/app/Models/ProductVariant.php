<?php

namespace App\Models;

use App\Models\Concerns\DeletesLocalMedia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use DeletesLocalMedia;

    protected static function booted(): void
    {
        static::deleting(function (ProductVariant $variant): void {
            $paths = [];

            $paths = array_merge($paths, $variant->collectLocalStoragePaths($variant->getAttribute('images')));

            $legacyImagePaths = $variant->images()->pluck('image_path');
            foreach ($legacyImagePaths as $legacyImagePath) {
                $paths = array_merge($paths, $variant->collectLocalStoragePaths($legacyImagePath));
            }

            $variant->deleteLocalStoragePaths($paths);
        });
    }

    protected $fillable = [
        'product_id',
        'variant_values',
        'price',
        'stock_quantity',
        'sku',
        'images',
    ];

    protected $casts = [
        'variant_values' => 'array',
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'images' => 'array',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }
}
