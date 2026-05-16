<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\ProductImage;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'ثلاجة LG 18 قدم مع فريزر علوي',
                'slug' => 'lg-refrigerator-18ft',
                'description' => 'ثلاجة حديثة بتقنية التبريد الذكي من LG، سعة 18 قدم مع فريزر علوي',
                'short_description' => 'ثلاجة LG 18 قدم بتقنية التبريد الذكي',
                'price' => 2500.00,
                'original_price' => 3000.00,
                'discount_percentage' => 16.67,
                'sku' => 'LG-REF-18',
                'stock_quantity' => 10,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 85.5,
                'dimensions' => '60x65x180 cm',
                'warranty' => '3 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية التبريد الذكي',
                    'مقاوم للصقيع',
                    'مؤشر درجة الحرارة',
                    'أدراج قابلة للفصل'
                ],
                'specifications' => [
                    'السعة' => '18 قدم',
                    'اللون' => 'فضي',
                    'الطاقة' => 'A++',
                    'الضمان' => '3 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '15-20 قدم',
                    'نوع الفريزر' => 'علوي',
                    'عدد الأبواب' => 'بابان',
                    'تقنية No Frost' => 'true'
                ],
                'category_name' => 'ثلاجات',
                'brand_name' => 'LG',
                'images' => [
                    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'تلفزيون Samsung 55 بوصة 4K Smart',
                'slug' => 'samsung-tv-55-4k',
                'description' => 'تلفزيون Samsung 55 بوصة بدقة 4K مع تقنية Smart TV',
                'short_description' => 'تلفزيون Samsung 55 بوصة 4K Smart',
                'price' => 3500.00,
                'original_price' => 4000.00,
                'discount_percentage' => 12.5,
                'sku' => 'SAM-TV-55',
                'stock_quantity' => 8,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 25.2,
                'dimensions' => '123x71x8 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'دقة 4K Ultra HD',
                    'Smart TV',
                    'HDR10+',
                    'صوت Dolby Atmos'
                ],
                'specifications' => [
                    'الحجم' => '55 بوصة',
                    'الدقة' => '4K Ultra HD',
                    'نظام التشغيل' => 'Tizen',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'الحجم' => '55 بوصة',
                    'الدقة' => '4K',
                    'التقنية' => 'QLED',
                    'تلفزيون ذكي' => 'true'
                ],
                'category_name' => 'تلفزيونات',
                'brand_name' => 'Samsung',
                'images' => [
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'لابتوب Dell Inspiron 15 3000',
                'slug' => 'dell-inspiron-15-3000',
                'description' => 'لابتوب Dell Inspiron 15 3000 مع معالج Intel Core i5',
                'short_description' => 'لابتوب Dell Inspiron 15 3000',
                'price' => 2800.00,
                'original_price' => 3200.00,
                'discount_percentage' => 12.5,
                'sku' => 'DELL-INS-15',
                'stock_quantity' => 12,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 2.1,
                'dimensions' => '36x24x2 cm',
                'warranty' => '1 سنة',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'معالج Intel Core i5',
                    'ذاكرة 8GB RAM',
                    'قرص صلب 512GB SSD',
                    'شاشة 15.6 بوصة'
                ],
                'specifications' => [
                    'المعالج' => 'Intel Core i5',
                    'الذاكرة' => '8GB RAM',
                    'التخزين' => '512GB SSD',
                    'الشاشة' => '15.6 بوصة'
                ],
                'filter_values' => [
                    'المعالج' => 'Intel Core i5',
                    'الذاكرة' => '8GB',
                    'التخزين' => '512GB SSD',
                    'حجم الشاشة' => '15.6 بوصة',
                    'نظام التشغيل' => 'Windows'
                ],
                'category_name' => 'حواسيب محمولة',
                'brand_name' => 'Dell',
                'images' => [
                    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'هاتف iPhone 14 Pro',
                'slug' => 'iphone-14-pro',
                'description' => 'هاتف iPhone 14 Pro مع كاميرا 48 ميجابكسل',
                'short_description' => 'هاتف iPhone 14 Pro',
                'price' => 4500.00,
                'original_price' => 5000.00,
                'discount_percentage' => 10.0,
                'sku' => 'APPLE-IP14P',
                'stock_quantity' => 15,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 0.206,
                'dimensions' => '14.8x7.2x0.8 cm',
                'warranty' => '1 سنة',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'كاميرا 48 ميجابكسل',
                    'شاشة Super Retina XDR',
                    'معالج A16 Bionic',
                    'Face ID'
                ],
                'specifications' => [
                    'الشاشة' => '6.1 بوصة',
                    'الكاميرا' => '48 ميجابكسل',
                    'المعالج' => 'A16 Bionic',
                    'التخزين' => '128GB'
                ],
                'category_name' => 'الهواتف المحمولة',
                'brand_name' => 'Apple',
                'images' => [
                    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'غسالة Samsung 8 كيلو',
                'slug' => 'samsung-washing-machine-8kg',
                'description' => 'غسالة Samsung 8 كيلو مع تقنية EcoBubble',
                'short_description' => 'غسالة Samsung 8 كيلو',
                'price' => 1800.00,
                'original_price' => 2200.00,
                'discount_percentage' => 18.18,
                'sku' => 'SAM-WM-8KG',
                'stock_quantity' => 6,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 75.0,
                'dimensions' => '60x60x85 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '3-4 أيام',
                'features' => [
                    'سعة 8 كيلو',
                    'تقنية EcoBubble',
                    'برامج متعددة',
                    'موفر للطاقة'
                ],
                'specifications' => [
                    'السعة' => '8 كيلو',
                    'الطاقة' => 'A+++',
                    'البرامج' => '15 برنامج',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '8 كيلو',
                    'نوع التحميل' => 'أمامي',
                    'الطاقة' => 'A+++',
                    'البرامج' => '15 برنامج'
                ],
                'category_name' => 'غسالات',
                'brand_name' => 'Samsung',
                'images' => [
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            // منتجات جديدة متنوعة
            [
                'name' => 'ثلاجة Samsung 22 قدم No Frost',
                'slug' => 'samsung-refrigerator-22ft',
                'description' => 'ثلاجة Samsung 22 قدم بتقنية No Frost مع فريزر سفلي',
                'short_description' => 'ثلاجة Samsung 22 قدم No Frost',
                'price' => 3200.00,
                'original_price' => 3800.00,
                'discount_percentage' => 15.79,
                'sku' => 'SAM-REF-22',
                'stock_quantity' => 8,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 95.0,
                'dimensions' => '65x70x185 cm',
                'warranty' => '3 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية No Frost',
                    'فريزر سفلي',
                    'مؤشر درجة الحرارة الرقمي',
                    'رفوف قابلة للتعديل'
                ],
                'specifications' => [
                    'السعة' => '22 قدم',
                    'اللون' => 'أبيض',
                    'الطاقة' => 'A++',
                    'الضمان' => '3 سنوات'
                ],
                'filter_values' => [
                    'السعة' => 'أكثر من 20 قدم',
                    'نوع الفريزر' => 'سفلي',
                    'عدد الأبواب' => 'ثلاثة أبواب',
                    'تقنية No Frost' => 'true'
                ],
                'category_name' => 'ثلاجات',
                'brand_name' => 'Samsung',
                'images' => [
                    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'تلفزيون LG 65 بوصة OLED 4K',
                'slug' => 'lg-tv-65-oled-4k',
                'description' => 'تلفزيون LG 65 بوصة بتقنية OLED ودقة 4K مع نظام WebOS',
                'short_description' => 'تلفزيون LG 65 بوصة OLED 4K',
                'price' => 5500.00,
                'original_price' => 6500.00,
                'discount_percentage' => 15.38,
                'sku' => 'LG-TV-65',
                'stock_quantity' => 6,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 35.5,
                'dimensions' => '145x83x5 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'تقنية OLED',
                    'دقة 4K Ultra HD',
                    'نظام WebOS',
                    'صوت Dolby Atmos'
                ],
                'specifications' => [
                    'الحجم' => '65 بوصة',
                    'الدقة' => '4K Ultra HD',
                    'نظام التشغيل' => 'WebOS',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'الحجم' => '65 بوصة',
                    'الدقة' => '4K',
                    'التقنية' => 'OLED',
                    'تلفزيون ذكي' => 'true'
                ],
                'category_name' => 'تلفزيونات',
                'brand_name' => 'LG',
                'images' => [
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'هاتف Samsung Galaxy S23 Ultra',
                'slug' => 'samsung-galaxy-s23-ultra',
                'description' => 'هاتف Samsung Galaxy S23 Ultra مع كاميرا 200 ميجابكسل وشاشة 6.8 بوصة',
                'short_description' => 'هاتف Samsung Galaxy S23 Ultra',
                'price' => 4200.00,
                'original_price' => 4800.00,
                'discount_percentage' => 12.5,
                'sku' => 'SAM-S23U',
                'stock_quantity' => 10,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 0.234,
                'dimensions' => '16.3x7.8x0.9 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'كاميرا 200 ميجابكسل',
                    'شاشة 6.8 بوصة',
                    'معالج Snapdragon 8 Gen 2',
                    'بطارية 5000mAh'
                ],
                'specifications' => [
                    'الشاشة' => '6.8 بوصة',
                    'الكاميرا' => '200 ميجابكسل',
                    'المعالج' => 'Snapdragon 8 Gen 2',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'حجم الشاشة' => '6.8 بوصة',
                    'دقة الكاميرا' => '200 ميجابكسل',
                    'المعالج' => 'Snapdragon 8 Gen 2',
                    'نظام التشغيل' => 'Android',
                    'شحن لاسلكي' => 'true'
                ],
                'category_name' => 'هواتف ذكية',
                'brand_name' => 'Samsung',
                'images' => [
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'لابتوب MacBook Pro 14 بوصة',
                'slug' => 'macbook-pro-14',
                'description' => 'لابتوب MacBook Pro 14 بوصة مع معالج M2 Pro وشاشة Liquid Retina XDR',
                'short_description' => 'لابتوب MacBook Pro 14 بوصة',
                'price' => 8500.00,
                'original_price' => 9500.00,
                'discount_percentage' => 10.53,
                'sku' => 'APPLE-MBP14',
                'stock_quantity' => 5,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 1.6,
                'dimensions' => '31.3x22.1x1.6 cm',
                'warranty' => '1 سنة',
                'delivery_time' => '3-5 أيام',
                'features' => [
                    'معالج M2 Pro',
                    'شاشة Liquid Retina XDR',
                    'ذاكرة 16GB',
                    'تخزين 512GB SSD'
                ],
                'specifications' => [
                    'المعالج' => 'M2 Pro',
                    'الذاكرة' => '16GB',
                    'التخزين' => '512GB SSD',
                    'الشاشة' => '14 بوصة'
                ],
                'filter_values' => [
                    'المعالج' => 'M2 Pro',
                    'الذاكرة' => '16GB',
                    'التخزين' => '512GB SSD',
                    'حجم الشاشة' => '14 بوصة',
                    'نظام التشغيل' => 'macOS'
                ],
                'category_name' => 'حواسيب محمولة',
                'brand_name' => 'Apple',
                'images' => [
                    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'مكيف Gree 1.5 طن',
                'slug' => 'gree-ac-1-5-ton',
                'description' => 'مكيف Gree 1.5 طن بتقنية Inverter وفلتر HEPA',
                'short_description' => 'مكيف Gree 1.5 طن Inverter',
                'price' => 1800.00,
                'original_price' => 2200.00,
                'discount_percentage' => 18.18,
                'sku' => 'GREE-AC-1.5',
                'stock_quantity' => 15,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 45.0,
                'dimensions' => '85x30x20 cm',
                'warranty' => '5 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية Inverter',
                    'فلتر HEPA',
                    'تحكم عن بعد',
                    'وضع النوم'
                ],
                'specifications' => [
                    'السعة' => '1.5 طن',
                    'الطاقة' => 'A++',
                    'الفلتر' => 'HEPA',
                    'الضمان' => '5 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '1.5 طن',
                    'نوع المكيف' => 'سبليت',
                    'تقنية Inverter' => 'true',
                    'فلتر HEPA' => 'true'
                ],
                'category_name' => 'مكيفات',
                'brand_name' => 'Gree',
                'images' => [
                    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'ماكينة حلاقة Philips Series 7000',
                'slug' => 'philips-shaver-7000',
                'description' => 'ماكينة حلاقة Philips Series 7000 مع تقنية NanoTech وقطع ذاتية الشحذ',
                'short_description' => 'ماكينة حلاقة Philips Series 7000',
                'price' => 450.00,
                'original_price' => 550.00,
                'discount_percentage' => 18.18,
                'sku' => 'PHIL-SHAV-7000',
                'stock_quantity' => 20,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 0.8,
                'dimensions' => '20x8x5 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'تقنية NanoTech',
                    'قطع ذاتية الشحذ',
                    'مقاوم للماء',
                    'شحن سريع'
                ],
                'specifications' => [
                    'النوع' => 'كهربائية',
                    'التقنية' => 'NanoTech',
                    'المقاومة للماء' => 'IPX7',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'النوع' => 'كهربائية',
                    'التقنية' => 'NanoTech',
                    'مقاوم للماء' => 'true',
                    'شحن لاسلكي' => 'true'
                ],
                'category_name' => 'ماكينات الحلاقة',
                'brand_name' => 'Philips',
                'images' => [
                    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'مجفف شعر Dyson Supersonic',
                'slug' => 'dyson-supersonic-hair-dryer',
                'description' => 'مجفف شعر Dyson Supersonic مع تقنية Air Multiplier وحماية الحرارة الذكية',
                'short_description' => 'مجفف شعر Dyson Supersonic',
                'price' => 1200.00,
                'original_price' => 1500.00,
                'discount_percentage' => 20.0,
                'sku' => 'DYSON-SUPER',
                'stock_quantity' => 8,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 0.56,
                'dimensions' => '25x8x8 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية Air Multiplier',
                    'حماية الحرارة الذكية',
                    '3 سرعات',
                    '3 درجات حرارة'
                ],
                'specifications' => [
                    'القوة' => '1600 واط',
                    'السرعة' => '3 سرعات',
                    'درجة الحرارة' => '3 درجات',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'القوة' => '1600 واط',
                    'السرعة' => '3 سرعات',
                    'درجة الحرارة' => '3 درجات',
                    'حماية الحرارة' => 'true'
                ],
                'category_name' => 'العناية بالشعر',
                'brand_name' => 'Dyson',
                'images' => [
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            // 20 منتج جديد متنوع
            [
                'name' => 'ثلاجة Whirlpool 16 قدم فريزر علوي',
                'slug' => 'whirlpool-refrigerator-16ft',
                'description' => 'ثلاجة Whirlpool 16 قدم مع فريزر علوي وتقنية التبريد المتقدم',
                'short_description' => 'ثلاجة Whirlpool 16 قدم فريزر علوي',
                'price' => 1800.00,
                'original_price' => 2200.00,
                'discount_percentage' => 18.18,
                'sku' => 'WHIRL-REF-16',
                'stock_quantity' => 12,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 75.0,
                'dimensions' => '55x60x170 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تبريد متقدم',
                    'فريزر علوي',
                    'رفوف قابلة للتعديل',
                    'مؤشر درجة الحرارة'
                ],
                'specifications' => [
                    'السعة' => '16 قدم',
                    'اللون' => 'أبيض',
                    'الطاقة' => 'A+',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '10-15 قدم',
                    'نوع الفريزر' => 'علوي',
                    'عدد الأبواب' => 'بابان',
                    'تقنية No Frost' => 'false'
                ],
                'category_name' => 'ثلاجات',
                'brand_name' => 'Whirlpool',
                'images' => [
                    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'غسالة LG 10 كيلو تحميل أمامي',
                'slug' => 'lg-washer-10kg-front-load',
                'description' => 'غسالة LG 10 كيلو تحميل أمامي مع تقنية Direct Drive',
                'short_description' => 'غسالة LG 10 كيلو تحميل أمامي',
                'price' => 2200.00,
                'original_price' => 2800.00,
                'discount_percentage' => 21.43,
                'sku' => 'LG-WASH-10',
                'stock_quantity' => 8,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 70.0,
                'dimensions' => '60x60x85 cm',
                'warranty' => '3 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية Direct Drive',
                    'تحميل أمامي',
                    '20 برنامج غسيل',
                    'شاشة LED'
                ],
                'specifications' => [
                    'السعة' => '10 كيلو',
                    'الطاقة' => 'A+++',
                    'البرامج' => '20 برنامج',
                    'الضمان' => '3 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '10 كيلو',
                    'نوع التحميل' => 'أمامي',
                    'الطاقة' => 'A+++',
                    'البرامج' => '20 برنامج'
                ],
                'category_name' => 'غسالات',
                'brand_name' => 'LG',
                'images' => [
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'تلفزيون Sony 43 بوصة 4K Android',
                'slug' => 'sony-tv-43-4k-android',
                'description' => 'تلفزيون Sony 43 بوصة بدقة 4K مع نظام Android TV',
                'short_description' => 'تلفزيون Sony 43 بوصة 4K Android',
                'price' => 2800.00,
                'original_price' => 3500.00,
                'discount_percentage' => 20.0,
                'sku' => 'SONY-TV-43',
                'stock_quantity' => 10,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 12.5,
                'dimensions' => '97x57x6 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'دقة 4K Ultra HD',
                    'نظام Android TV',
                    'HDR10',
                    'صوت Dolby Digital'
                ],
                'specifications' => [
                    'الحجم' => '43 بوصة',
                    'الدقة' => '4K Ultra HD',
                    'نظام التشغيل' => 'Android TV',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'الحجم' => '43 بوصة',
                    'الدقة' => '4K',
                    'التقنية' => 'LED',
                    'تلفزيون ذكي' => 'true'
                ],
                'category_name' => 'تلفزيونات',
                'brand_name' => 'Sony',
                'images' => [
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'هاتف iPhone 15 Pro Max',
                'slug' => 'iphone-15-pro-max',
                'description' => 'هاتف iPhone 15 Pro Max مع كاميرا 48 ميجابكسل ومعالج A17 Pro',
                'short_description' => 'هاتف iPhone 15 Pro Max',
                'price' => 5500.00,
                'original_price' => 6200.00,
                'discount_percentage' => 11.29,
                'sku' => 'APPLE-IP15PM',
                'stock_quantity' => 6,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 0.221,
                'dimensions' => '16.9x7.7x0.8 cm',
                'warranty' => '1 سنة',
                'delivery_time' => '3-5 أيام',
                'features' => [
                    'كاميرا 48 ميجابكسل',
                    'شاشة 6.7 بوصة',
                    'معالج A17 Pro',
                    'بطارية 4422mAh'
                ],
                'specifications' => [
                    'الشاشة' => '6.7 بوصة',
                    'الكاميرا' => '48 ميجابكسل',
                    'المعالج' => 'A17 Pro',
                    'الضمان' => '1 سنة'
                ],
                'filter_values' => [
                    'حجم الشاشة' => '6.7 بوصة',
                    'دقة الكاميرا' => '48 ميجابكسل',
                    'المعالج' => 'A17 Pro',
                    'نظام التشغيل' => 'iOS',
                    'شحن لاسلكي' => 'true'
                ],
                'category_name' => 'هواتف ذكية',
                'brand_name' => 'Apple',
                'images' => [
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'لابتوب HP Pavilion 15 بوصة',
                'slug' => 'hp-pavilion-15-laptop',
                'description' => 'لابتوب HP Pavilion 15 بوصة مع معالج Intel Core i7 وذاكرة 16GB',
                'short_description' => 'لابتوب HP Pavilion 15 بوصة',
                'price' => 3200.00,
                'original_price' => 3800.00,
                'discount_percentage' => 15.79,
                'sku' => 'HP-PAV-15',
                'stock_quantity' => 15,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 1.75,
                'dimensions' => '35.8x24.2x1.8 cm',
                'warranty' => '1 سنة',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'معالج Intel Core i7',
                    'ذاكرة 16GB RAM',
                    'قرص صلب 1TB HDD',
                    'شاشة 15.6 بوصة'
                ],
                'specifications' => [
                    'المعالج' => 'Intel Core i7',
                    'الذاكرة' => '16GB RAM',
                    'التخزين' => '1TB HDD',
                    'الشاشة' => '15.6 بوصة'
                ],
                'filter_values' => [
                    'المعالج' => 'Intel Core i7',
                    'الذاكرة' => '16GB',
                    'التخزين' => '1TB HDD',
                    'حجم الشاشة' => '15.6 بوصة',
                    'نظام التشغيل' => 'Windows'
                ],
                'category_name' => 'حواسيب محمولة',
                'brand_name' => 'HP',
                'images' => [
                    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'مكيف Carrier 2 طن سبليت',
                'slug' => 'carrier-ac-2-ton-split',
                'description' => 'مكيف Carrier 2 طن سبليت مع تقنية Inverter وفلتر مضاد للبكتيريا',
                'short_description' => 'مكيف Carrier 2 طن سبليت',
                'price' => 2500.00,
                'original_price' => 3200.00,
                'discount_percentage' => 21.88,
                'sku' => 'CARR-AC-2T',
                'stock_quantity' => 12,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 55.0,
                'dimensions' => '90x35x25 cm',
                'warranty' => '5 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية Inverter',
                    'فلتر مضاد للبكتيريا',
                    'تحكم عن بعد',
                    'وضع النوم'
                ],
                'specifications' => [
                    'السعة' => '2 طن',
                    'الطاقة' => 'A++',
                    'الفلتر' => 'مضاد للبكتيريا',
                    'الضمان' => '5 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '2 طن',
                    'نوع المكيف' => 'سبليت',
                    'تقنية Inverter' => 'true',
                    'فلتر HEPA' => 'false'
                ],
                'category_name' => 'مكيفات',
                'brand_name' => 'Carrier',
                'images' => [
                    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'ماكينة حلاقة Braun Series 9',
                'slug' => 'braun-shaver-series-9',
                'description' => 'ماكينة حلاقة Braun Series 9 مع تقنية SyncroSonic وقطع ذاتية الشحذ',
                'short_description' => 'ماكينة حلاقة Braun Series 9',
                'price' => 380.00,
                'original_price' => 480.00,
                'discount_percentage' => 20.83,
                'sku' => 'BRAUN-S9',
                'stock_quantity' => 25,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 0.6,
                'dimensions' => '18x7x4 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'تقنية SyncroSonic',
                    'قطع ذاتية الشحذ',
                    'مقاوم للماء',
                    'شحن سريع'
                ],
                'specifications' => [
                    'النوع' => 'كهربائية',
                    'التقنية' => 'SyncroSonic',
                    'المقاومة للماء' => 'IPX7',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'النوع' => 'كهربائية',
                    'التقنية' => 'SyncroSonic',
                    'مقاوم للماء' => 'true',
                    'شحن لاسلكي' => 'true'
                ],
                'category_name' => 'ماكينات الحلاقة',
                'brand_name' => 'Braun',
                'images' => [
                    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'مجفف شعر Panasonic Nanoe',
                'slug' => 'panasonic-hair-dryer-nanoe',
                'description' => 'مجفف شعر Panasonic Nanoe مع تقنية Nanoe وحماية الحرارة الذكية',
                'short_description' => 'مجفف شعر Panasonic Nanoe',
                'price' => 280.00,
                'original_price' => 350.00,
                'discount_percentage' => 20.0,
                'sku' => 'PANA-NANOE',
                'stock_quantity' => 18,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 0.45,
                'dimensions' => '22x7x7 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'تقنية Nanoe',
                    'حماية الحرارة الذكية',
                    '2 سرعات',
                    '2 درجات حرارة'
                ],
                'specifications' => [
                    'القوة' => '1200 واط',
                    'السرعة' => '2 سرعات',
                    'درجة الحرارة' => '2 درجات',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'القوة' => '1200 واط',
                    'السرعة' => '2 سرعات',
                    'درجة الحرارة' => '2 درجات',
                    'حماية الحرارة' => 'true'
                ],
                'category_name' => 'العناية بالشعر',
                'brand_name' => 'Panasonic',
                'images' => [
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'ثلاجة Toshiba 20 قدم No Frost',
                'slug' => 'toshiba-refrigerator-20ft',
                'description' => 'ثلاجة Toshiba 20 قدم بتقنية No Frost مع فريزر جانبي',
                'short_description' => 'ثلاجة Toshiba 20 قدم No Frost',
                'price' => 2800.00,
                'original_price' => 3400.00,
                'discount_percentage' => 17.65,
                'sku' => 'TOSH-REF-20',
                'stock_quantity' => 6,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 88.0,
                'dimensions' => '60x68x180 cm',
                'warranty' => '3 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية No Frost',
                    'فريزر جانبي',
                    'مؤشر درجة الحرارة الرقمي',
                    'رفوف قابلة للتعديل'
                ],
                'specifications' => [
                    'السعة' => '20 قدم',
                    'اللون' => 'فضي',
                    'الطاقة' => 'A++',
                    'الضمان' => '3 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '15-20 قدم',
                    'نوع الفريزر' => 'جانبي',
                    'عدد الأبواب' => 'أربعة أبواب',
                    'تقنية No Frost' => 'true'
                ],
                'category_name' => 'ثلاجات',
                'brand_name' => 'Toshiba',
                'images' => [
                    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'غسالة Electrolux 12 كيلو تحميل علوي',
                'slug' => 'electrolux-washer-12kg-top-load',
                'description' => 'غسالة Electrolux 12 كيلو تحميل علوي مع تقنية EcoInverter',
                'short_description' => 'غسالة Electrolux 12 كيلو تحميل علوي',
                'price' => 1900.00,
                'original_price' => 2400.00,
                'discount_percentage' => 20.83,
                'sku' => 'ELEC-WASH-12',
                'stock_quantity' => 9,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 65.0,
                'dimensions' => '60x60x90 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية EcoInverter',
                    'تحميل علوي',
                    '15 برنامج غسيل',
                    'شاشة LED'
                ],
                'specifications' => [
                    'السعة' => '12 كيلو',
                    'الطاقة' => 'A++',
                    'البرامج' => '15 برنامج',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '12 كيلو',
                    'نوع التحميل' => 'علوي',
                    'الطاقة' => 'A++',
                    'البرامج' => '15 برنامج'
                ],
                'category_name' => 'غسالات',
                'brand_name' => 'Electrolux',
                'images' => [
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'تلفزيون TCL 50 بوصة 4K Roku',
                'slug' => 'tcl-tv-50-4k-roku',
                'description' => 'تلفزيون TCL 50 بوصة بدقة 4K مع نظام Roku TV',
                'short_description' => 'تلفزيون TCL 50 بوصة 4K Roku',
                'price' => 2200.00,
                'original_price' => 2800.00,
                'discount_percentage' => 21.43,
                'sku' => 'TCL-TV-50',
                'stock_quantity' => 14,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 18.5,
                'dimensions' => '112x65x8 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'دقة 4K Ultra HD',
                    'نظام Roku TV',
                    'HDR10',
                    'صوت Dolby Digital'
                ],
                'specifications' => [
                    'الحجم' => '50 بوصة',
                    'الدقة' => '4K Ultra HD',
                    'نظام التشغيل' => 'Roku TV',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'الحجم' => '50 بوصة',
                    'الدقة' => '4K',
                    'التقنية' => 'LED',
                    'تلفزيون ذكي' => 'true'
                ],
                'category_name' => 'تلفزيونات',
                'brand_name' => 'TCL',
                'images' => [
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'هاتف Xiaomi Redmi Note 12',
                'slug' => 'xiaomi-redmi-note-12',
                'description' => 'هاتف Xiaomi Redmi Note 12 مع كاميرا 108 ميجابكسل وشاشة 6.67 بوصة',
                'short_description' => 'هاتف Xiaomi Redmi Note 12',
                'price' => 1200.00,
                'original_price' => 1500.00,
                'discount_percentage' => 20.0,
                'sku' => 'XIAOMI-RN12',
                'stock_quantity' => 20,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 0.188,
                'dimensions' => '16.5x7.6x0.8 cm',
                'warranty' => '1 سنة',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'كاميرا 108 ميجابكسل',
                    'شاشة 6.67 بوصة',
                    'معالج Snapdragon 685',
                    'بطارية 5000mAh'
                ],
                'specifications' => [
                    'الشاشة' => '6.67 بوصة',
                    'الكاميرا' => '108 ميجابكسل',
                    'المعالج' => 'Snapdragon 685',
                    'الضمان' => '1 سنة'
                ],
                'filter_values' => [
                    'حجم الشاشة' => '6.67 بوصة',
                    'دقة الكاميرا' => '108 ميجابكسل',
                    'المعالج' => 'Snapdragon 685',
                    'نظام التشغيل' => 'Android',
                    'شحن لاسلكي' => 'false'
                ],
                'category_name' => 'هواتف ذكية',
                'brand_name' => 'Xiaomi',
                'images' => [
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'لابتوب ASUS VivoBook 14 بوصة',
                'slug' => 'asus-vivobook-14-laptop',
                'description' => 'لابتوب ASUS VivoBook 14 بوصة مع معالج AMD Ryzen 5 وذاكرة 8GB',
                'short_description' => 'لابتوب ASUS VivoBook 14 بوصة',
                'price' => 2400.00,
                'original_price' => 3000.00,
                'discount_percentage' => 20.0,
                'sku' => 'ASUS-VB14',
                'stock_quantity' => 12,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 1.4,
                'dimensions' => '32.4x21.2x1.9 cm',
                'warranty' => '1 سنة',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'معالج AMD Ryzen 5',
                    'ذاكرة 8GB RAM',
                    'قرص صلب 256GB SSD',
                    'شاشة 14 بوصة'
                ],
                'specifications' => [
                    'المعالج' => 'AMD Ryzen 5',
                    'الذاكرة' => '8GB RAM',
                    'التخزين' => '256GB SSD',
                    'الشاشة' => '14 بوصة'
                ],
                'filter_values' => [
                    'المعالج' => 'AMD Ryzen 5',
                    'الذاكرة' => '8GB',
                    'التخزين' => '256GB SSD',
                    'حجم الشاشة' => '14 بوصة',
                    'نظام التشغيل' => 'Windows'
                ],
                'category_name' => 'حواسيب محمولة',
                'brand_name' => 'ASUS',
                'images' => [
                    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'مكيف Daikin 1 طن سبليت',
                'slug' => 'daikin-ac-1-ton-split',
                'description' => 'مكيف Daikin 1 طن سبليت مع تقنية Inverter وفلتر Blueair',
                'short_description' => 'مكيف Daikin 1 طن سبليت',
                'price' => 1600.00,
                'original_price' => 2000.00,
                'discount_percentage' => 20.0,
                'sku' => 'DAIKIN-AC-1T',
                'stock_quantity' => 18,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 40.0,
                'dimensions' => '80x30x20 cm',
                'warranty' => '5 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية Inverter',
                    'فلتر Blueair',
                    'تحكم عن بعد',
                    'وضع النوم'
                ],
                'specifications' => [
                    'السعة' => '1 طن',
                    'الطاقة' => 'A+++',
                    'الفلتر' => 'Blueair',
                    'الضمان' => '5 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '1 طن',
                    'نوع المكيف' => 'سبليت',
                    'تقنية Inverter' => 'true',
                    'فلتر HEPA' => 'false'
                ],
                'category_name' => 'مكيفات',
                'brand_name' => 'Daikin',
                'images' => [
                    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'ماكينة حلاقة Wahl Professional',
                'slug' => 'wahl-professional-shaver',
                'description' => 'ماكينة حلاقة Wahl Professional مع تقنية Precision Blade وقطع فولاذية',
                'short_description' => 'ماكينة حلاقة Wahl Professional',
                'price' => 320.00,
                'original_price' => 400.00,
                'discount_percentage' => 20.0,
                'sku' => 'WAHL-PRO',
                'stock_quantity' => 22,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 0.7,
                'dimensions' => '19x8x5 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'تقنية Precision Blade',
                    'قطع فولاذية',
                    'مقاوم للماء',
                    'شحن سريع'
                ],
                'specifications' => [
                    'النوع' => 'كهربائية',
                    'التقنية' => 'Precision Blade',
                    'المقاومة للماء' => 'IPX6',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'النوع' => 'كهربائية',
                    'التقنية' => 'Precision Blade',
                    'مقاوم للماء' => 'true',
                    'شحن لاسلكي' => 'false'
                ],
                'category_name' => 'ماكينات الحلاقة',
                'brand_name' => 'Wahl',
                'images' => [
                    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'مجفف شعر Remington Pro',
                'slug' => 'remington-pro-hair-dryer',
                'description' => 'مجفف شعر Remington Pro مع تقنية Ionic Technology وحماية الحرارة الذكية',
                'short_description' => 'مجفف شعر Remington Pro',
                'price' => 180.00,
                'original_price' => 230.00,
                'discount_percentage' => 21.74,
                'sku' => 'REM-PRO',
                'stock_quantity' => 30,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 0.35,
                'dimensions' => '20x6x6 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'تقنية Ionic Technology',
                    'حماية الحرارة الذكية',
                    '2 سرعات',
                    '2 درجات حرارة'
                ],
                'specifications' => [
                    'القوة' => '1000 واط',
                    'السرعة' => '2 سرعات',
                    'درجة الحرارة' => '2 درجات',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'القوة' => '1000 واط',
                    'السرعة' => '2 سرعات',
                    'درجة الحرارة' => '2 درجات',
                    'حماية الحرارة' => 'true'
                ],
                'category_name' => 'العناية بالشعر',
                'brand_name' => 'Remington',
                'images' => [
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'ثلاجة Haier 14 قدم فريزر علوي',
                'slug' => 'haier-refrigerator-14ft',
                'description' => 'ثلاجة Haier 14 قدم مع فريزر علوي وتقنية التبريد المتقدم',
                'short_description' => 'ثلاجة Haier 14 قدم فريزر علوي',
                'price' => 1500.00,
                'original_price' => 1800.00,
                'discount_percentage' => 16.67,
                'sku' => 'HAIER-REF-14',
                'stock_quantity' => 16,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 70.0,
                'dimensions' => '55x58x165 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تبريد متقدم',
                    'فريزر علوي',
                    'رفوف قابلة للتعديل',
                    'مؤشر درجة الحرارة'
                ],
                'specifications' => [
                    'السعة' => '14 قدم',
                    'اللون' => 'أبيض',
                    'الطاقة' => 'A+',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '10-15 قدم',
                    'نوع الفريزر' => 'علوي',
                    'عدد الأبواب' => 'بابان',
                    'تقنية No Frost' => 'false'
                ],
                'category_name' => 'ثلاجات',
                'brand_name' => 'Haier',
                'images' => [
                    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'غسالة Beko 9 كيلو تحميل أمامي',
                'slug' => 'beko-washer-9kg-front-load',
                'description' => 'غسالة Beko 9 كيلو تحميل أمامي مع تقنية ProSmart Inverter',
                'short_description' => 'غسالة Beko 9 كيلو تحميل أمامي',
                'price' => 1700.00,
                'original_price' => 2100.00,
                'discount_percentage' => 19.05,
                'sku' => 'BEKO-WASH-9',
                'stock_quantity' => 11,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 68.0,
                'dimensions' => '60x60x85 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية ProSmart Inverter',
                    'تحميل أمامي',
                    '18 برنامج غسيل',
                    'شاشة LED'
                ],
                'specifications' => [
                    'السعة' => '9 كيلو',
                    'الطاقة' => 'A+++',
                    'البرامج' => '18 برنامج',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '9 كيلو',
                    'نوع التحميل' => 'أمامي',
                    'الطاقة' => 'A+++',
                    'البرامج' => '18 برنامج'
                ],
                'category_name' => 'غسالات',
                'brand_name' => 'Beko',
                'images' => [
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'تلفزيون Hisense 32 بوصة HD Smart',
                'slug' => 'hisense-tv-32-hd-smart',
                'description' => 'تلفزيون Hisense 32 بوصة بدقة HD مع نظام Smart TV',
                'short_description' => 'تلفزيون Hisense 32 بوصة HD Smart',
                'price' => 1200.00,
                'original_price' => 1500.00,
                'discount_percentage' => 20.0,
                'sku' => 'HISENSE-TV-32',
                'stock_quantity' => 25,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 8.5,
                'dimensions' => '73x43x8 cm',
                'warranty' => '2 سنوات',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'دقة HD',
                    'نظام Smart TV',
                    'HDR',
                    'صوت Dolby Digital'
                ],
                'specifications' => [
                    'الحجم' => '32 بوصة',
                    'الدقة' => 'HD',
                    'نظام التشغيل' => 'Smart TV',
                    'الضمان' => '2 سنوات'
                ],
                'filter_values' => [
                    'الحجم' => '32 بوصة',
                    'الدقة' => 'HD',
                    'التقنية' => 'LED',
                    'تلفزيون ذكي' => 'true'
                ],
                'category_name' => 'تلفزيونات',
                'brand_name' => 'Hisense',
                'images' => [
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'هاتف Oppo A78 5G',
                'slug' => 'oppo-a78-5g',
                'description' => 'هاتف Oppo A78 5G مع كاميرا 50 ميجابكسل وشاشة 6.56 بوصة',
                'short_description' => 'هاتف Oppo A78 5G',
                'price' => 900.00,
                'original_price' => 1100.00,
                'discount_percentage' => 18.18,
                'sku' => 'OPPO-A78',
                'stock_quantity' => 28,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 0.188,
                'dimensions' => '16.3x7.5x0.8 cm',
                'warranty' => '1 سنة',
                'delivery_time' => '1-2 أيام',
                'features' => [
                    'كاميرا 50 ميجابكسل',
                    'شاشة 6.56 بوصة',
                    'معالج MediaTek Dimensity 700',
                    'بطارية 5000mAh'
                ],
                'specifications' => [
                    'الشاشة' => '6.56 بوصة',
                    'الكاميرا' => '50 ميجابكسل',
                    'المعالج' => 'MediaTek Dimensity 700',
                    'الضمان' => '1 سنة'
                ],
                'filter_values' => [
                    'حجم الشاشة' => '6.56 بوصة',
                    'دقة الكاميرا' => '50 ميجابكسل',
                    'المعالج' => 'MediaTek Dimensity 700',
                    'نظام التشغيل' => 'Android',
                    'شحن لاسلكي' => 'false'
                ],
                'category_name' => 'هواتف ذكية',
                'brand_name' => 'Oppo',
                'images' => [
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'لابتوب Lenovo IdeaPad 13 بوصة',
                'slug' => 'lenovo-ideapad-13-laptop',
                'description' => 'لابتوب Lenovo IdeaPad 13 بوصة مع معالج Intel Core i3 وذاكرة 4GB',
                'short_description' => 'لابتوب Lenovo IdeaPad 13 بوصة',
                'price' => 1800.00,
                'original_price' => 2200.00,
                'discount_percentage' => 18.18,
                'sku' => 'LENOVO-IP13',
                'stock_quantity' => 20,
                'in_stock' => true,
                'is_featured' => false,
                'weight' => 1.2,
                'dimensions' => '30.5x21.5x1.6 cm',
                'warranty' => '1 سنة',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'معالج Intel Core i3',
                    'ذاكرة 4GB RAM',
                    'قرص صلب 128GB SSD',
                    'شاشة 13.3 بوصة'
                ],
                'specifications' => [
                    'المعالج' => 'Intel Core i3',
                    'الذاكرة' => '4GB RAM',
                    'التخزين' => '128GB SSD',
                    'الشاشة' => '13.3 بوصة'
                ],
                'filter_values' => [
                    'المعالج' => 'Intel Core i3',
                    'الذاكرة' => '4GB',
                    'التخزين' => '128GB SSD',
                    'حجم الشاشة' => '13.3 بوصة',
                    'نظام التشغيل' => 'Windows'
                ],
                'category_name' => 'حواسيب محمولة',
                'brand_name' => 'Lenovo',
                'images' => [
                    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ],
            [
                'name' => 'مكيف Mitsubishi 3 طن سبليت',
                'slug' => 'mitsubishi-ac-3-ton-split',
                'description' => 'مكيف Mitsubishi 3 طن سبليت مع تقنية Inverter وفلتر Plasma Quad',
                'short_description' => 'مكيف Mitsubishi 3 طن سبليت',
                'price' => 3500.00,
                'original_price' => 4500.00,
                'discount_percentage' => 22.22,
                'sku' => 'MITSUBISHI-AC-3T',
                'stock_quantity' => 7,
                'in_stock' => true,
                'is_featured' => true,
                'weight' => 75.0,
                'dimensions' => '100x40x30 cm',
                'warranty' => '5 سنوات',
                'delivery_time' => '2-3 أيام',
                'features' => [
                    'تقنية Inverter',
                    'فلتر Plasma Quad',
                    'تحكم عن بعد',
                    'وضع النوم'
                ],
                'specifications' => [
                    'السعة' => '3 طن',
                    'الطاقة' => 'A+++',
                    'الفلتر' => 'Plasma Quad',
                    'الضمان' => '5 سنوات'
                ],
                'filter_values' => [
                    'السعة' => '3 طن',
                    'نوع المكيف' => 'سبليت',
                    'تقنية Inverter' => 'true',
                    'فلتر HEPA' => 'false'
                ],
                'category_name' => 'مكيفات',
                'brand_name' => 'Mitsubishi',
                'images' => [
                    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format&q=80',
                    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop&auto=format&q=80'
                ]
            ]
        ];

        foreach ($products as $productData) {
            // Find category and brand
            $category = Category::where('name', $productData['category_name'])->first();
            $brand = Brand::where('name', $productData['brand_name'])->first();
            
            if (!$category || !$brand) {
                continue; // Skip if category or brand not found
            }

            // Create product
            $product = Product::create([
                'name' => $productData['name'],
                'slug' => $productData['slug'],
                'description' => $productData['description'],
                'short_description' => $productData['short_description'],
                'price' => $productData['price'],
                'original_price' => $productData['original_price'],
                'discount_percentage' => $productData['discount_percentage'],
                'sku' => $productData['sku'],
                'stock_quantity' => $productData['stock_quantity'],
                'in_stock' => $productData['in_stock'],
                'is_featured' => $productData['is_featured'],
                'weight' => $productData['weight'],
                'dimensions' => $productData['dimensions'],
                'warranty' => $productData['warranty'],
                'delivery_time' => $productData['delivery_time'],
                'features' => $productData['features'],
                'specifications' => $productData['specifications'],
                'filter_values' => $productData['filter_values'] ?? [],
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'rating' => rand(35, 50) / 10, // Random rating between 3.5 and 5.0
                'reviews_count' => rand(10, 100),
                'views_count' => rand(50, 500),
                'sales_count' => rand(5, 50),
            ]);

            // Create product images
            foreach ($productData['images'] as $index => $imageUrl) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $imageUrl,
                    'is_primary' => $index === 0,
                    'sort_order' => $index,
                ]);
            }
        }
    }
}
