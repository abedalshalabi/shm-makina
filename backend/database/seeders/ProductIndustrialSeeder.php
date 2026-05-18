<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Support\Str;

class ProductIndustrialSeeder extends Seeder
{
    public function run()
    {
        $categories = Category::all()->keyBy('slug');
        $brands = Brand::all()->keyBy('slug');

        if ($categories->isEmpty() || $brands->isEmpty()) {
            $this->command->warn('Please ensure categories and brands exist.');
            return;
        }

        $dummyProducts = [
            [
                'name' => 'طقم مفاتيح 12 قطعة احترافي',
                'cat' => 'hand-tools',
                'brand' => 'king-tony',
                'price' => 120,
                'compare_price' => 150,
            ],
            [
                'name' => 'مفك براغي متطور عالي الجودة',
                'cat' => 'hand-tools',
                'brand' => 'total',
                'price' => 25,
                'compare_price' => null,
            ],
            [
                'name' => 'صاروخ جلخ كهربائي 800 واط',
                'cat' => 'power-tools',
                'brand' => 'ingco',
                'price' => 180,
                'compare_price' => 220,
            ],
            [
                'name' => 'دريل مطرقي قوي 1050 واط',
                'cat' => 'power-tools',
                'brand' => 'shm',
                'price' => 250,
                'compare_price' => 300,
            ],
            [
                'name' => 'مثقاب بطارية ليثيوم 20 فولت',
                'cat' => 'battery-tools',
                'brand' => 'total',
                'price' => 350,
                'compare_price' => 420,
            ],
            [
                'name' => 'مفتاح ربط صدمي لاسلكي للسيارات',
                'cat' => 'battery-tools',
                'brand' => 'ingco',
                'price' => 450,
                'compare_price' => 500,
            ],
            [
                'name' => 'منشار تقليم أشجار احترافي',
                'cat' => 'agriculture-tools',
                'brand' => 'revira',
                'price' => 85,
                'compare_price' => 110,
            ],
            [
                'name' => 'مقص زرع ياباني معدل',
                'cat' => 'agriculture-tools',
                'brand' => 'ingco',
                'price' => 45,
                'compare_price' => 60,
            ],
            [
                'name' => 'رافعة سيارة هيدروليكية 3 طن',
                'cat' => 'mechanic-tools',
                'brand' => 'shm',
                'price' => 550,
                'compare_price' => 650,
            ],
            [
                'name' => 'طقم بوكسات سيارات 108 قطعة',
                'cat' => 'mechanic-tools',
                'brand' => 'king-tony',
                'price' => 600,
                'compare_price' => null,
            ],
            [
                'name' => 'مضخة غسيل سيارات ضغط عالي',
                'cat' => 'carwash-tools',
                'brand' => 'gys',
                'price' => 850,
                'compare_price' => 1000,
            ],
            [
                'name' => 'ماكينة تلميع وبوليش سيارات',
                'cat' => 'carwash-tools',
                'brand' => 'revira',
                'price' => 320,
                'compare_price' => 400,
            ],
            [
                'name' => 'ماكينة لحام انفرتر 200 امبير',
                'cat' => 'power-tools',
                'brand' => 'gys',
                'price' => 950,
                'compare_price' => 1100,
            ]
        ];

        foreach ($dummyProducts as $dp) {
            $cat = $categories->get($dp['cat']);
            $brand = $brands->get($dp['brand']);

            if (!$cat || !$brand) continue;

            $product = Product::create([
                'name' => $dp['name'],
                'slug' => Str::slug($dp['name'] . '-' . rand(1000,9999)),
                'description' => '<p>منتج عالي الجودة ومصمم للاستخدام الشاق والاحترافي. يتوفر بضمان المصنع.</p>',
                'short_description' => 'أداء متميز وتصميم احترافي',
                'price' => $dp['price'],
                'compare_price' => $dp['compare_price'],
                'sku' => strtoupper(Str::random(8)),
                'stock_quantity' => rand(10, 50),
                'in_stock' => true,
                'manage_stock' => true,
                'is_active' => true,
                'category_id' => $cat->id,
                'brand_id' => $brand->id,
                'cover_image' => $cat->image, // Use the category image as a placeholder!
            ]);

            // Attach to categories many-to-many relationship
            $product->categories()->attach([$cat->id]);
        }
        
        $this->command->info('Industrial Products seeded successfully.');
    }
}
