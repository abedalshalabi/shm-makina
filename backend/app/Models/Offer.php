<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Offer extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'type',
        'image',
        'discount_percentage',
        'fixed_discount',
        'starts_at',
        'ends_at',
        'is_active',
        'sort_order',
        'products',
        'bundle_items',
        'bundle_price',
        'original_bundle_price',
        'stock_limit',
        'sold_count',
    ];

    protected $casts = [
        'discount_percentage' => 'decimal:2',
        'fixed_discount' => 'decimal:2',
        'bundle_price' => 'decimal:2',
        'original_bundle_price' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
        'products' => 'array',
        'bundle_items' => 'array',
    ];

    // Check if offer is currently active
    public function isActive(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = now();
        return $now >= $this->starts_at && $now <= $this->ends_at;
    }

    // Get remaining time in seconds
    public function getRemainingTime(): int
    {
        $now = now();
        if ($now > $this->ends_at) {
            return 0;
        }
        return $this->ends_at->diffInSeconds($now);
    }

    // Get progress percentage (for flash deals)
    public function getProgressPercentage(): float
    {
        if (!$this->stock_limit || $this->stock_limit == 0) {
            return 0;
        }
        return ($this->sold_count / $this->stock_limit) * 100;
    }
}

