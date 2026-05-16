<?php

namespace App\Models;

use App\Models\Concerns\DeletesLocalMedia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Scout\Searchable;

class Product extends Model
{
    use HasFactory, Searchable, DeletesLocalMedia;

    protected static function booted(): void
    {
        static::deleting(function (Product $product): void {
            $paths = [];

            $paths = array_merge($paths, $product->collectLocalStoragePaths($product->getAttribute('cover_image')));
            $paths = array_merge($paths, $product->collectLocalStoragePaths($product->getAttribute('images')));
            $paths = array_merge($paths, $product->collectLocalStoragePaths($product->getAttribute('size_guide_images')));

            $variantImagePayloads = $product->variants()->pluck('images');
            foreach ($variantImagePayloads as $variantPayload) {
                $paths = array_merge($paths, $product->collectLocalStoragePaths($variantPayload));
            }

            $legacyImagePaths = $product->images()->pluck('image_path');
            foreach ($legacyImagePaths as $legacyImagePath) {
                $paths = array_merge($paths, $product->collectLocalStoragePaths($legacyImagePath));
            }

            $product->deleteLocalStoragePaths($paths);
        });
    }

    protected $fillable = [
        'name',
        'slug',
        'description',
        'short_description',
        'price',
        'original_price',
        'compare_price',
        'cost_price',
        'discount_percentage',
        'sku',
        'stock_quantity',
        'manage_stock',
        'stock_status',
        'in_stock',
        'is_active',
        'is_featured',
        'show_in_offers',
        'sort_order',
        'weight',
        'dimensions',
        'images',
        'size_guide_images',
        'warranty',
        'delivery_time',
        'features',
        'specifications',
        'filter_values',
        'rating',
        'reviews_count',
        'views_count',
        'sales_count',
        'category_id',
        'brand_id',
        'meta_title',
        'meta_description',
        'cover_image',
        'show_description',
        'show_specifications',
        'created_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'compare_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'weight' => 'decimal:2',
        'rating' => 'decimal:2',
        'manage_stock' => 'boolean',
        'in_stock' => 'boolean',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'show_in_offers' => 'boolean',
        'features' => 'array',
        'specifications' => 'array',
        'filter_values' => 'array',
        'images' => 'array',
        'size_guide_images' => 'array',
        'cover_image' => 'string',
        'show_description' => 'boolean',
        'show_specifications' => 'boolean',
    ];

    // Keep for backward compatibility (single category)
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // Many-to-Many relationship with categories
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_product')
                    ->withTimestamps();
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(Cart::class);
    }

    public function wishlistItems(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getRouteKeyName()
    {
        return 'id';
    }

    public function toSearchableArray()
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category->name,
            'brand' => $this->brand->name,
        ];
    }
}
