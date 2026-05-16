<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $settings = [
            [
                'key' => 'shipping_hero_description',
                'value' => 'نقدم خدمات شحن وتوصيل متنوعة لضمان وصول منتجاتك بأمان وفي الوقت المناسب',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'وصف مقدمة صفحة الشحن',
            ],
            [
                'key' => 'shipping_options_title',
                'value' => 'خيارات الشحن',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'عنوان قسم خيارات الشحن',
            ],
            [
                'key' => 'shipping_options_description',
                'value' => 'اختر الخيار الأنسب لك',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'وصف قسم خيارات الشحن',
            ],
            [
                'key' => 'shipping_steps_title',
                'value' => 'مراحل الشحن',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'عنوان قسم مراحل الشحن',
            ],
            [
                'key' => 'shipping_steps_description',
                'value' => 'كيف نضمن وصول طلبك بأمان',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'وصف قسم مراحل الشحن',
            ],
            [
                'key' => 'shipping_steps',
                'value' => json_encode([
                    ['step' => 1, 'title' => 'تأكيد الطلب', 'description' => 'نراجع طلبك ونتأكد من توفر المنتجات'],
                    ['step' => 2, 'title' => 'التحضير والتغليف', 'description' => 'نحضر منتجاتك ونغلفها بعناية فائقة'],
                    ['step' => 3, 'title' => 'الشحن', 'description' => 'نرسل الطلب مع شركة الشحن المختارة'],
                    ['step' => 4, 'title' => 'التسليم', 'description' => 'يصلك الطلب في الموعد المحدد'],
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'shipping',
                'description' => 'خطوات الشحن',
            ],
            [
                'key' => 'shipping_coverage_title',
                'value' => 'التغطية الجغرافية',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'عنوان قسم التغطية الجغرافية',
            ],
            [
                'key' => 'shipping_coverage_description',
                'value' => 'نصل إلى جميع مدن فلسطين',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'وصف قسم التغطية الجغرافية',
            ],
            [
                'key' => 'shipping_cities',
                'value' => json_encode([
                    ['name' => 'جنين', 'duration' => '1-2 أيام', 'cost' => 'مجاني', 'sameDay' => true],
                    ['name' => 'نابلس', 'duration' => '2-3 أيام', 'cost' => 'مجاني', 'sameDay' => true],
                    ['name' => 'طولكرم', 'duration' => '2-3 أيام', 'cost' => 'مجاني', 'sameDay' => true],
                    ['name' => 'رام الله', 'duration' => '2-3 أيام', 'cost' => 'مجاني', 'sameDay' => false],
                    ['name' => 'الخليل', 'duration' => '3-4 أيام', 'cost' => 'مجاني', 'sameDay' => false],
                    ['name' => 'بيت لحم', 'duration' => '3-4 أيام', 'cost' => 'مجاني', 'sameDay' => false],
                    ['name' => 'قلقيلية', 'duration' => '3-4 أيام', 'cost' => 'مجاني', 'sameDay' => false],
                    ['name' => 'أريحا', 'duration' => '4-5 أيام', 'cost' => 'مجاني', 'sameDay' => false],
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'shipping',
                'description' => 'قائمة المدن ومواعيد التوصيل',
            ],
            [
                'key' => 'shipping_policies_title',
                'value' => 'ضماناتنا',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'عنوان قسم ضمانات الشحن',
            ],
            [
                'key' => 'shipping_policies_description',
                'value' => 'التزامنا تجاه عملائنا',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'وصف قسم ضمانات الشحن',
            ],
            [
                'key' => 'shipping_policies',
                'value' => json_encode([
                    ['title' => 'ضمان الوصول الآمن', 'description' => 'نضمن وصول منتجاتك بحالة ممتازة أو نستبدلها مجانا'],
                    ['title' => 'التسليم في الوقت المحدد', 'description' => 'نلتزم بمواعيد التسليم المحددة أو نقدم تعويضا'],
                    ['title' => 'تغليف احترافي', 'description' => 'نستخدم مواد تغليف عالية الجودة لحماية منتجاتك'],
                    ['title' => 'تتبع مباشر', 'description' => 'تابع شحنتك لحظة بلحظة عبر رقم التتبع'],
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'shipping',
                'description' => 'ضمانات وسياسات الشحن',
            ],
            [
                'key' => 'shipping_notes_title',
                'value' => 'ملاحظات مهمة',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'عنوان قسم ملاحظات الشحن',
            ],
            [
                'key' => 'shipping_notes',
                'value' => json_encode([
                    ['title' => 'شروط الشحن المجاني', 'description' => 'الشحن مجاني للطلبات التي تزيد قيمتها عن 500 شيكل داخل المدن الرئيسية في فلسطين.', 'type' => 'info'],
                    ['title' => 'الأجهزة الكبيرة', 'description' => 'الأجهزة الكبيرة مثل الثلاجات والغسالات تحتاج موعد مسبق للتوصيل والتركيب.', 'type' => 'warning'],
                    ['title' => 'خدمة التركيب', 'description' => 'نقدم خدمة التركيب المجاني للأجهزة الكبيرة مع ضمان على التركيب لمدة 6 أشهر.', 'type' => 'success'],
                    ['title' => 'المناطق النائية', 'description' => 'قد تحتاج المناطق النائية وقتا إضافيا للتوصيل (5-7 أيام عمل) مع رسوم شحن إضافية.', 'type' => 'danger'],
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'shipping',
                'description' => 'ملاحظات هامة في صفحة الشحن',
            ],
            [
                'key' => 'shipping_cta_title',
                'value' => 'هل لديك استفسار حول الشحن؟',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'عنوان دعوة التواصل في صفحة الشحن',
            ],
            [
                'key' => 'shipping_cta_description',
                'value' => 'فريق خدمة العملاء جاهز لمساعدتك في أي وقت',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'وصف دعوة التواصل في صفحة الشحن',
            ],
            [
                'key' => 'shipping_cta_phone',
                'value' => '',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'رقم الهاتف في دعوة التواصل بصفحة الشحن',
            ],
        ];

        foreach ($settings as $setting) {
            $exists = DB::table('site_settings')->where('key', $setting['key'])->exists();

            if ($exists) {
                DB::table('site_settings')
                    ->where('key', $setting['key'])
                    ->update(array_merge($setting, [
                        'updated_at' => now(),
                    ]));
            } else {
                DB::table('site_settings')->insert(array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    public function down(): void
    {
        DB::table('site_settings')->whereIn('key', [
            'shipping_hero_description',
            'shipping_options_title',
            'shipping_options_description',
            'shipping_steps_title',
            'shipping_steps_description',
            'shipping_steps',
            'shipping_coverage_title',
            'shipping_coverage_description',
            'shipping_cities',
            'shipping_policies_title',
            'shipping_policies_description',
            'shipping_policies',
            'shipping_notes_title',
            'shipping_notes',
            'shipping_cta_title',
            'shipping_cta_description',
            'shipping_cta_phone',
        ])->delete();
    }
};
