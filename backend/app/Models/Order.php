<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'customer_city',
        'customer_district',
        'customer_street',
        'customer_building',
        'customer_additional_info',
        'subtotal',
        'shipping_cost',
        'discount_type',
        'discount_value',
        'discount_amount',
        'force_free_shipping',
        'total',
        'payment_method',
        'payment_status',
        'order_status',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'discount_value' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'force_free_shipping' => 'boolean',
        'total' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = 'ORD-' . strtoupper(uniqid());
            }
        });
    }
    public function scopeDateRange($query, ...$dates)
    {
        if (empty($dates)) return $query;
        
        $from = null;
        $to = null;
        
        if (is_array($dates[0])) {
            $from = $dates[0][0] ?? null;
            $to = $dates[0][1] ?? null;
        } else {
            $from = $dates[0] ?? null;
            $to = $dates[1] ?? null;
        }

        if (!empty($from)) {
            $query->whereDate('created_at', '>=', $from);
        }
        if (!empty($to)) {
            $query->whereDate('created_at', '<=', $to);
        }
        
        return $query;
    }
}
