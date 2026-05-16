<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image',
        'color',
        'is_active',
        'show_in_slider',
        'sort_order',
        'meta_title',
        'meta_description',
        'parent_id',
        'level',
        'filters',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'show_in_slider' => 'boolean',
        'filters' => 'array',
    ];

    // Keep for backward compatibility (single category)
    public function productsOld(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    // Many-to-Many relationship with products
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'category_product')
                    ->withTimestamps();
    }

    // New Filter System: Many-to-Many
    public function filterEntities(): BelongsToMany
    {
        return $this->belongsToMany(Filter::class, 'category_filter')
                    ->withPivot('sort_order')
                    ->withTimestamps()
                    ->orderBy('category_filter.sort_order');
    }

    // Parent category
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // Child categories (subcategories)
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('sort_order');
    }

    // All descendants recursively
    public function descendants()
    {
        return $this->children()->with('descendants');
    }

    // Check if category has children
    public function hasChildren(): bool
    {
        return $this->children()->count() > 0;
    }

    // Get all parent categories (main categories)
    public static function mainCategories()
    {
        return static::whereNull('parent_id')->orderBy('sort_order')->get();
    }

    // Get full path (breadcrumb)
    public function getFullPath(): array
    {
        $path = [];
        $current = $this;
        
        while ($current) {
            array_unshift($path, [
                'id' => $current->id,
                'name' => $current->name,
                'slug' => $current->slug,
            ]);
            $current = $current->parent;
        }
        
        return $path;
    }

    /**
     * Get all category IDs including this category and all its descendants (subcategories)
     * This is useful for filtering products that belong to a category or any of its subcategories
     */
    public function getAllDescendantIds(): array
    {
        $ids = [$this->id];
        
        // Get all direct children
        $children = $this->children()->get();
        
        foreach ($children as $child) {
            // Recursively get all descendant IDs
            $ids = array_merge($ids, $child->getAllDescendantIds());
        }
        
        return $ids;
    }

    /**
     * Get total products count including descendants
     */
    public function getTotalProductsCount(): int
    {
        $ids = $this->getAllDescendantIds();
        
        return Product::where(function($q) use ($ids) {
            $q->whereIn('category_id', $ids)
              ->orWhereHas('categories', function($query) use ($ids) {
                  $query->whereIn('categories.id', $ids);
              });
        })->count();
    }

    /**
     * Static method to get all descendant IDs for a given category ID
     */
    public static function getAllDescendantIdsFor($categoryId): array
    {
        $category = static::find($categoryId);
        
        if (!$category) {
            return [$categoryId]; // Return the ID itself if category not found
        }
        
        return $category->getAllDescendantIds();
    }

    public function getRouteKeyName()
    {
        return 'id';
    }
}
