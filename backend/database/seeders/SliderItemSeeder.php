<?php

namespace Database\Seeders;

use App\Models\SliderItem;
use Illuminate\Database\Seeder;

class SliderItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Slide 1: Welcome
        SliderItem::updateOrCreate(
            ['title' => 'مرحباً بكم في'],
            [
                'subtitle' => 'أبو زينة للتقنيات',
                'description' => 'وجهتكم الأولى للأجهزة الكهربائية والإلكترونية الحديثة. نوفر لكم أحدث التقنيات بأفضل الأسعار.',
                'image' => null,
                'background_color' => 'from-blue-900 via-blue-800 to-indigo-900',
                'text_color' => 'text-white',
                'button1_text' => 'تسوق الآن',
                'button1_link' => '/products',
                'button1_color' => 'bg-white text-blue-900',
                'button2_text' => 'العروض الخاصة',
                'button2_link' => '/offers',
                'button2_color' => 'border-2 border-white text-white',
                'sort_order' => 1,
                'is_active' => true,
            ]
        );

        // Slide 2: Home Appliances
        SliderItem::updateOrCreate(
            ['title' => 'أجهزة منزلية'],
            [
                'subtitle' => 'عصرية وذكية',
                'description' => 'اكتشف مجموعتنا الواسعة من الأجهزة المنزلية الذكية التي تجعل حياتك أسهل وأكثر راحة.',
                'image' => null,
                'background_color' => 'from-purple-900 via-purple-800 to-pink-900',
                'text_color' => 'text-white',
                'button1_text' => 'أجهزة المطبخ',
                'button1_link' => '/products?category_id=1',
                'button1_color' => 'bg-white text-purple-900',
                'button2_text' => 'التكييف والتبريد',
                'button2_link' => '/products?category_id=2',
                'button2_color' => 'border-2 border-white text-white',
                'sort_order' => 2,
                'is_active' => true,
            ]
        );

        // Slide 3: Special Offers
        SliderItem::updateOrCreate(
            ['title' => 'عروض حصرية'],
            [
                'subtitle' => 'وخصومات مذهلة',
                'description' => 'لا تفوت فرصة الحصول على أفضل الأجهزة بأسعار لا تُقاوم. عروض محدودة الوقت.',
                'image' => null,
                'background_color' => 'from-green-900 via-green-800 to-teal-900',
                'text_color' => 'text-white',
                'button1_text' => 'تصفح العروض',
                'button1_link' => '/offers',
                'button1_color' => 'bg-white text-green-900',
                'button2_text' => 'جميع المنتجات',
                'button2_link' => '/products',
                'button2_color' => 'border-2 border-white text-white',
                'sort_order' => 3,
                'is_active' => true,
            ]
        );
    }
}
