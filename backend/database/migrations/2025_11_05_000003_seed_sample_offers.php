<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get some product IDs (assuming products exist)
        $productIds = DB::table('products')
            ->where('is_active', true)
            ->limit(10)
            ->pluck('id')
            ->toArray();

        if (empty($productIds)) {
            return; // No products available
        }

        $offers = [
            // Flash Deal 1
            [
                'title' => 'عرض البرق - ثلاجات سامسونج',
                'description' => 'خصم كبير على مجموعة من الثلاجات سامسونج - العرض محدود الوقت والكمية!',
                'type' => 'flash_deal',
                'image' => null,
                'discount_percentage' => 30,
                'fixed_discount' => null,
                'starts_at' => now(),
                'ends_at' => now()->addDays(2),
                'is_active' => true,
                'sort_order' => 1,
                'products' => json_encode(array_slice($productIds, 0, 3)),
                'bundle_items' => null,
                'bundle_price' => null,
                'original_bundle_price' => null,
                'stock_limit' => 50,
                'sold_count' => 15,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Flash Deal 2
            [
                'title' => 'عرض البرق - تلفزيونات إل جي',
                'description' => 'خصومات هائلة على أفضل تلفزيونات إل جي - اسرع قبل انتهاء الكمية!',
                'type' => 'flash_deal',
                'image' => null,
                'discount_percentage' => 35,
                'fixed_discount' => null,
                'starts_at' => now(),
                'ends_at' => now()->addDays(3),
                'is_active' => true,
                'sort_order' => 2,
                'products' => json_encode(array_slice($productIds, 3, 2)),
                'bundle_items' => null,
                'bundle_price' => null,
                'original_bundle_price' => null,
                'stock_limit' => 30,
                'sold_count' => 8,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Weekly Deal 1
            [
                'title' => 'عرض الأسبوع - أجهزة المطبخ',
                'description' => 'خصم 25% على جميع أجهزة المطبخ - العرض يستمر طوال الأسبوع',
                'type' => 'weekly_deal',
                'image' => null,
                'discount_percentage' => 25,
                'fixed_discount' => null,
                'starts_at' => now(),
                'ends_at' => now()->addWeek(),
                'is_active' => true,
                'sort_order' => 3,
                'products' => json_encode(array_slice($productIds, 5, 4)),
                'bundle_items' => null,
                'bundle_price' => null,
                'original_bundle_price' => null,
                'stock_limit' => null,
                'sold_count' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Weekly Deal 2
            [
                'title' => 'عرض الأسبوع - المكيفات',
                'description' => 'خصم حصري 20% على جميع المكيفات - وفر الآن!',
                'type' => 'weekly_deal',
                'image' => null,
                'discount_percentage' => 20,
                'fixed_discount' => null,
                'starts_at' => now(),
                'ends_at' => now()->addWeek(),
                'is_active' => true,
                'sort_order' => 4,
                'products' => json_encode(array_slice($productIds, 0, 2)),
                'bundle_items' => null,
                'bundle_price' => null,
                'original_bundle_price' => null,
                'stock_limit' => null,
                'sold_count' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Bundle 1
            [
                'title' => 'باقة المطبخ الذكي',
                'description' => 'باقة متكاملة تشمل ثلاجة، مايكروويف، وخلاط - وفر أكثر من 1000 شيكل!',
                'type' => 'bundle',
                'image' => null,
                'discount_percentage' => null,
                'fixed_discount' => null,
                'starts_at' => now(),
                'ends_at' => now()->addMonth(),
                'is_active' => true,
                'sort_order' => 5,
                'products' => null,
                'bundle_items' => json_encode([
                    ['product_id' => $productIds[0] ?? 1, 'quantity' => 1],
                    ['product_id' => $productIds[1] ?? 2, 'quantity' => 1],
                    ['product_id' => $productIds[2] ?? 3, 'quantity' => 1],
                ]),
                'bundle_price' => 3299.00,
                'original_bundle_price' => 4599.00,
                'stock_limit' => 20,
                'sold_count' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Bundle 2
            [
                'title' => 'باقة التنظيف الشاملة',
                'description' => 'باقة متكاملة للتنظيف تشمل مكنسة كهربائية، مكنسة بخار، ومنظف نوافذ',
                'type' => 'bundle',
                'image' => null,
                'discount_percentage' => null,
                'fixed_discount' => null,
                'starts_at' => now(),
                'ends_at' => now()->addMonth(),
                'is_active' => true,
                'sort_order' => 6,
                'products' => null,
                'bundle_items' => json_encode([
                    ['product_id' => $productIds[3] ?? 4, 'quantity' => 1],
                    ['product_id' => $productIds[4] ?? 5, 'quantity' => 1],
                    ['product_id' => $productIds[5] ?? 6, 'quantity' => 1],
                ]),
                'bundle_price' => 899.00,
                'original_bundle_price' => 1399.00,
                'stock_limit' => 15,
                'sold_count' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Flash Deal 3
            [
                'title' => 'عرض البرق - غسالات بوش',
                'description' => 'خصم 28% على غسالات بوش - العرض محدود!',
                'type' => 'flash_deal',
                'image' => null,
                'discount_percentage' => 28,
                'fixed_discount' => null,
                'starts_at' => now(),
                'ends_at' => now()->addDays(4),
                'is_active' => true,
                'sort_order' => 7,
                'products' => json_encode(array_slice($productIds, 6, 2)),
                'bundle_items' => null,
                'bundle_price' => null,
                'original_bundle_price' => null,
                'stock_limit' => 40,
                'sold_count' => 12,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('offers')->insert($offers);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('offers')->whereIn('title', [
            'عرض البرق - ثلاجات سامسونج',
            'عرض البرق - تلفزيونات إل جي',
            'عرض الأسبوع - أجهزة المطبخ',
            'عرض الأسبوع - المكيفات',
            'باقة المطبخ الذكي',
            'باقة التنظيف الشاملة',
            'عرض البرق - غسالات بوش',
        ])->delete();
    }
};

