<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Main Categories
        $homeAppliances = Category::create([
            'name' => 'الأجهزة المنزلية',
            'slug' => 'home-appliances',
            'description' => 'جميع الأجهزة المنزلية الحديثة',
            'color' => 'bg-blue-500',
            'is_active' => true,
            'sort_order' => 1,
            'level' => 0,
            'parent_id' => null,
        ]);

        $electronics = Category::create([
            'name' => 'الإلكترونيات',
            'slug' => 'electronics',
            'description' => 'الأجهزة الإلكترونية الحديثة',
            'color' => 'bg-purple-500',
            'is_active' => true,
            'sort_order' => 2,
            'level' => 0,
            'parent_id' => null,
        ]);

        $personalCare = Category::create([
            'name' => 'العناية الشخصية',
            'slug' => 'personal-care',
            'description' => 'منتجات العناية الشخصية والجمال',
            'color' => 'bg-pink-500',
            'is_active' => true,
            'sort_order' => 3,
            'level' => 0,
            'parent_id' => null,
        ]);

        // Subcategories for الأجهزة المنزلية
        $refrigerators = Category::create([
            'name' => 'ثلاجات',
            'slug' => 'refrigerators',
            'description' => 'ثلاجات بجميع الأحجام والأنواع',
            'color' => 'bg-blue-400',
            'is_active' => true,
            'sort_order' => 1,
            'level' => 1,
            'parent_id' => $homeAppliances->id,
            'filters' => [
                [
                    'name' => 'السعة',
                    'type' => 'select',
                    'options' => ['أقل من 10 قدم', '10-15 قدم', '15-20 قدم', 'أكثر من 20 قدم']
                ],
                [
                    'name' => 'نوع الفريزر',
                    'type' => 'select',
                    'options' => ['علوي', 'سفلي', 'جانبي', 'بدون فريزر']
                ],
                [
                    'name' => 'عدد الأبواب',
                    'type' => 'select',
                    'options' => ['باب واحد', 'بابان', 'ثلاثة أبواب', 'أربعة أبواب']
                ],
                [
                    'name' => 'تقنية No Frost',
                    'type' => 'checkbox',
                    'options' => []
                ]
            ]
        ]);

        $washingMachines = Category::create([
            'name' => 'غسالات',
            'slug' => 'washing-machines',
            'description' => 'غسالات أتوماتيك ونصف أتوماتيك',
            'color' => 'bg-blue-400',
            'is_active' => true,
            'sort_order' => 2,
            'level' => 1,
            'parent_id' => $homeAppliances->id,
            'filters' => [
                [
                    'name' => 'السعة',
                    'type' => 'select',
                    'options' => ['5 كيلو', '6 كيلو', '7 كيلو', '8 كيلو', '9 كيلو', '10 كيلو وأكثر']
                ],
                [
                    'name' => 'النوع',
                    'type' => 'select',
                    'options' => ['أتوماتيك', 'نصف أتوماتيك', 'غسالة ونشافة']
                ],
                [
                    'name' => 'التحميل',
                    'type' => 'select',
                    'options' => ['تحميل أمامي', 'تحميل علوي']
                ],
                [
                    'name' => 'سرعة العصر',
                    'type' => 'select',
                    'options' => ['800 لفة', '1000 لفة', '1200 لفة', '1400 لفة وأكثر']
                ]
            ]
        ]);

        $airConditioners = Category::create([
            'name' => 'مكيفات',
            'slug' => 'air-conditioners',
            'description' => 'مكيفات هواء بأنواعها',
            'color' => 'bg-blue-400',
            'is_active' => true,
            'sort_order' => 3,
            'level' => 1,
            'parent_id' => $homeAppliances->id,
            'filters' => [
                [
                    'name' => 'القدرة',
                    'type' => 'select',
                    'options' => ['9 وحدة', '12 وحدة', '18 وحدة', '24 وحدة', '30 وحدة وأكثر']
                ],
                [
                    'name' => 'النوع',
                    'type' => 'select',
                    'options' => ['سبليت', 'شباك', 'كونسيلد', 'كاسيت', 'محمول']
                ],
                [
                    'name' => 'التبريد',
                    'type' => 'select',
                    'options' => ['بارد فقط', 'بارد وحار']
                ],
                [
                    'name' => 'إنفرتر',
                    'type' => 'checkbox',
                    'options' => []
                ]
            ]
        ]);

        // Subcategories for الإلكترونيات
        $televisions = Category::create([
            'name' => 'تلفزيونات',
            'slug' => 'televisions',
            'description' => 'تلفزيونات ذكية وعادية',
            'color' => 'bg-purple-400',
            'is_active' => true,
            'sort_order' => 1,
            'level' => 1,
            'parent_id' => $electronics->id,
            'filters' => [
                [
                    'name' => 'الحجم',
                    'type' => 'select',
                    'options' => ['32 بوصة', '40 بوصة', '43 بوصة', '50 بوصة', '55 بوصة', '65 بوصة', '75 بوصة وأكثر']
                ],
                [
                    'name' => 'الدقة',
                    'type' => 'select',
                    'options' => ['HD', 'Full HD', '4K', '8K']
                ],
                [
                    'name' => 'التقنية',
                    'type' => 'select',
                    'options' => ['LED', 'OLED', 'QLED', 'NanoCell']
                ],
                [
                    'name' => 'تلفزيون ذكي',
                    'type' => 'checkbox',
                    'options' => []
                ]
            ]
        ]);

        $mobiles = Category::create([
            'name' => 'هواتف ذكية',
            'slug' => 'smartphones',
            'description' => 'أحدث الهواتف الذكية',
            'color' => 'bg-purple-400',
            'is_active' => true,
            'sort_order' => 2,
            'level' => 1,
            'parent_id' => $electronics->id,
            'filters' => [
                [
                    'name' => 'الذاكرة الداخلية',
                    'type' => 'select',
                    'options' => ['64 جيجا', '128 جيجا', '256 جيجا', '512 جيجا', '1 تيرا']
                ],
                [
                    'name' => 'الرام',
                    'type' => 'select',
                    'options' => ['4 جيجا', '6 جيجا', '8 جيجا', '12 جيجا', '16 جيجا']
                ],
                [
                    'name' => 'حجم الشاشة',
                    'type' => 'select',
                    'options' => ['أقل من 6 بوصة', '6-6.5 بوصة', '6.5-7 بوصة', 'أكثر من 7 بوصة']
                ],
                [
                    'name' => 'نظام التشغيل',
                    'type' => 'select',
                    'options' => ['Android', 'iOS']
                ],
                [
                    'name' => '5G',
                    'type' => 'checkbox',
                    'options' => []
                ]
            ]
        ]);

        $laptops = Category::create([
            'name' => 'حواسيب محمولة',
            'slug' => 'laptops',
            'description' => 'حواسيب محمولة وأجهزة لوحية',
            'color' => 'bg-purple-400',
            'is_active' => true,
            'sort_order' => 3,
            'level' => 1,
            'parent_id' => $electronics->id,
            'filters' => [
                [
                    'name' => 'المعالج',
                    'type' => 'select',
                    'options' => ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9']
                ],
                [
                    'name' => 'الرام',
                    'type' => 'select',
                    'options' => ['4 جيجا', '8 جيجا', '16 جيجا', '32 جيجا', '64 جيجا']
                ],
                [
                    'name' => 'التخزين',
                    'type' => 'select',
                    'options' => ['256 جيجا SSD', '512 جيجا SSD', '1 تيرا SSD', '2 تيرا SSD']
                ],
                [
                    'name' => 'حجم الشاشة',
                    'type' => 'select',
                    'options' => ['13 بوصة', '14 بوصة', '15.6 بوصة', '17 بوصة']
                ],
                [
                    'name' => 'كرت شاشة منفصل',
                    'type' => 'checkbox',
                    'options' => []
                ]
            ]
        ]);

        // Subcategories for العناية الشخصية
        $hairCare = Category::create([
            'name' => 'العناية بالشعر',
            'slug' => 'hair-care',
            'description' => 'أجهزة العناية بالشعر',
            'color' => 'bg-pink-400',
            'is_active' => true,
            'sort_order' => 1,
            'level' => 1,
            'parent_id' => $personalCare->id,
            'filters' => [
                [
                    'name' => 'النوع',
                    'type' => 'select',
                    'options' => ['مجفف شعر', 'مكواة شعر', 'مكواة كيرلي', 'ماكينة حلاقة']
                ],
                [
                    'name' => 'القدرة',
                    'type' => 'select',
                    'options' => ['أقل من 1000 واط', '1000-1500 واط', '1500-2000 واط', 'أكثر من 2000 واط']
                ],
                [
                    'name' => 'أيوني',
                    'type' => 'checkbox',
                    'options' => []
                ]
            ]
        ]);

        $shavers = Category::create([
            'name' => 'ماكينات الحلاقة',
            'slug' => 'shavers',
            'description' => 'ماكينات حلاقة كهربائية',
            'color' => 'bg-pink-400',
            'is_active' => true,
            'sort_order' => 2,
            'level' => 1,
            'parent_id' => $personalCare->id,
            'filters' => [
                [
                    'name' => 'النوع',
                    'type' => 'select',
                    'options' => ['رجالي', 'نسائي', 'للجنسين']
                ],
                [
                    'name' => 'الاستخدام',
                    'type' => 'select',
                    'options' => ['جاف فقط', 'رطب وجاف']
                ],
                [
                    'name' => 'عدد الشفرات',
                    'type' => 'select',
                    'options' => ['3 شفرات', '4 شفرات', '5 شفرات']
                ],
                [
                    'name' => 'قابلة للشحن',
                    'type' => 'checkbox',
                    'options' => []
                ]
            ]
        ]);
    }
}
