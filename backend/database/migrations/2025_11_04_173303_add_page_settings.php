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
        // About Page Settings
        DB::table('site_settings')->insert([
            [
                'key' => 'about_hero_title',
                'value' => 'من نحن',
                'type' => 'text',
                'group' => 'about',
                'description' => 'عنوان قسم Hero في صفحة من نحن',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'about_hero_description',
                'value' => 'نحن شركة رائدة في مجال الأجهزة الكهربائية والإلكترونية، نسعى لتقديم أفضل المنتجات والخدمات لعملائنا في فلسطين',
                'type' => 'text',
                'group' => 'about',
                'description' => 'وصف قسم Hero في صفحة من نحن',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'about_story_title',
                'value' => 'قصتنا',
                'type' => 'text',
                'group' => 'about',
                'description' => 'عنوان قسم القصة',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'about_story_content',
                'value' => json_encode([
                    'title' => 'قصتنا',
                    'description' => 'بدأت رحلتنا في عام 2010 بهدف واحد: تقديم أفضل التقنيات والأجهزة الكهربائية لعملائنا في فلسطين. عبر السنوات، نمونا لنتحول من متجر صغير إلى واحدة من أكبر الشركات في مجال التكنولوجيا في المنطقة.',
                    'image' => 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop'
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'about',
                'description' => 'محتوى قسم القصة',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'about_values',
                'value' => json_encode([
                    ['title' => 'الجودة والتميز', 'description' => 'نلتزم بتقديم أفضل المنتجات والخدمات لعملائنا الكرام', 'icon' => 'target'],
                    ['title' => 'رضا العملاء', 'description' => 'رضاكم هو هدفنا الأول ونسعى دائماً لتجاوز توقعاتكم', 'icon' => 'heart'],
                    ['title' => 'الابتكار والتطوير', 'description' => 'نواكب أحدث التقنيات ونقدم الحلول المبتكرة', 'icon' => 'zap'],
                    ['title' => 'الثقة والأمان', 'description' => 'نبني علاقات طويلة الأمد مع عملائنا على أساس الثقة', 'icon' => 'shield']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'about',
                'description' => 'القيم والمبادئ',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'about_achievements',
                'value' => json_encode([
                    ['number' => '50,000+', 'label' => 'عميل راضٍ'],
                    ['number' => '15+', 'label' => 'سنة خبرة'],
                    ['number' => '1000+', 'label' => 'منتج متنوع'],
                    ['number' => '99%', 'label' => 'معدل الرضا']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'about',
                'description' => 'الإنجازات',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'about_team',
                'value' => json_encode([
                    ['name' => 'أحمد أبو زينة', 'position' => 'المؤسس والرئيس التنفيذي', 'description' => 'خبرة تزيد عن 20 عاماً في مجال التقنيات والأجهزة الكهربائية', 'image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'],
                    ['name' => 'فاطمة السالم', 'position' => 'مديرة المبيعات', 'description' => 'متخصصة في خدمة العملاء وإدارة المبيعات لأكثر من 15 عاماً', 'image' => 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face'],
                    ['name' => 'محمد العتيبي', 'position' => 'مدير التقنيات', 'description' => 'خبير في أحدث التقنيات والحلول الذكية للمنازل والمكاتب', 'image' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'],
                    ['name' => 'نورا الخالد', 'position' => 'مديرة خدمة العملاء', 'description' => 'متخصصة في تقديم أفضل تجربة عملاء وحل المشاكل التقنية', 'image' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'about',
                'description' => 'فريق العمل',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Contact Page Settings
        DB::table('site_settings')->insert([
            [
                'key' => 'contact_hero_title',
                'value' => 'اتصل بنا',
                'type' => 'text',
                'group' => 'contact',
                'description' => 'عنوان صفحة الاتصال',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'contact_info',
                'value' => json_encode([
                    ['type' => 'phone', 'title' => 'الهاتف', 'details' => ['+966 11 123 4567', '+966 50 123 4567']],
                    ['type' => 'email', 'title' => 'البريد الإلكتروني', 'details' => ['info@abuzaina.com', 'support@abuzaina.com']],
                    ['type' => 'address', 'title' => 'العنوان', 'details' => ['شارع الحرية، جنين', 'فلسطين']],
                    ['type' => 'hours', 'title' => 'ساعات العمل', 'details' => ['السبت - الخميس: 9:00 ص - 10:00 م', 'الجمعة: 2:00 م - 10:00 م']]
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'contact',
                'description' => 'معلومات الاتصال',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'contact_services',
                'value' => json_encode([
                    ['title' => 'دعم فني 24/7', 'description' => 'فريق الدعم الفني متاح على مدار الساعة لمساعدتك'],
                    ['title' => 'ضمان شامل', 'description' => 'نقدم ضمان شامل على جميع منتجاتنا وخدماتنا'],
                    ['title' => 'استشارة مجانية', 'description' => 'احصل على استشارة مجانية من خبرائنا المتخصصين']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'contact',
                'description' => 'خدمات الاتصال',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'contact_subjects',
                'value' => json_encode(['استفسار عام', 'شكوى أو اقتراح', 'دعم فني', 'طلب عرض سعر', 'خدمة ما بعد البيع', 'شراكة تجارية', 'أخرى']),
                'type' => 'json',
                'group' => 'contact',
                'description' => 'مواضيع الرسائل',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Shipping Page Settings
        DB::table('site_settings')->insert([
            [
                'key' => 'shipping_hero_title',
                'value' => 'سياسة الشحن والتوصيل',
                'type' => 'text',
                'group' => 'shipping',
                'description' => 'عنوان صفحة الشحن',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'shipping_options',
                'value' => json_encode([
                    ['title' => 'التوصيل العادي', 'duration' => '3-5 أيام عمل', 'cost' => 'مجاني للطلبات أكثر من 500 شيكل', 'description' => 'خدمة التوصيل العادية لجميع أنحاء فلسطين', 'features' => ['تتبع الشحنة', 'التأمين الأساسي', 'التوصيل للمنزل']],
                    ['title' => 'التوصيل السريع', 'duration' => '1-2 أيام عمل', 'cost' => '50 شيكل إضافي', 'description' => 'خدمة التوصيل السريع للمدن الرئيسية', 'features' => ['تتبع مباشر', 'تأمين شامل', 'أولوية في التوصيل']],
                    ['title' => 'التوصيل في نفس اليوم', 'duration' => 'خلال 6 ساعات', 'cost' => '100 شيكل إضافي', 'description' => 'متاح في جنين والمدن المجاورة فقط', 'features' => ['تتبع لحظي', 'تأمين كامل', 'خدمة VIP']]
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'shipping',
                'description' => 'خيارات الشحن',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Returns Page Settings
        DB::table('site_settings')->insert([
            [
                'key' => 'returns_hero_title',
                'value' => 'سياسة الإرجاع والاستبدال',
                'type' => 'text',
                'group' => 'returns',
                'description' => 'عنوان صفحة الإرجاع',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'returns_policy',
                'value' => json_encode([
                    ['title' => 'المنتج معيب أو تالف', 'description' => 'إذا وصل المنتج تالفاً أو به عيب تصنيع', 'eligible' => true],
                    ['title' => 'عدم الرضا عن المنتج', 'description' => 'إذا لم يلبي المنتج توقعاتك', 'eligible' => true],
                    ['title' => 'المنتج مختلف عن الوصف', 'description' => 'إذا كان المنتج مختلفاً عن الوصف في الموقع', 'eligible' => true],
                    ['title' => 'خطأ في الطلب', 'description' => 'إذا تم إرسال منتج خاطئ', 'eligible' => true]
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'returns',
                'description' => 'سياسة الإرجاع',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Warranty Page Settings
        DB::table('site_settings')->insert([
            [
                'key' => 'warranty_hero_title',
                'value' => 'سياسة الضمان',
                'type' => 'text',
                'group' => 'warranty',
                'description' => 'عنوان صفحة الضمان',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'warranty_types',
                'value' => json_encode([
                    ['title' => 'ضمان الشركة المصنعة', 'duration' => 'حسب نوع المنتج', 'coverage' => 'عيوب التصنيع والمواد', 'description' => 'ضمان أصلي من الشركة المصنعة يغطي جميع عيوب التصنيع', 'features' => ['إصلاح مجاني', 'استبدال القطع', 'دعم فني متخصص']],
                    ['title' => 'ضمان أبو زينة الممتد', 'duration' => 'سنة إضافية', 'coverage' => 'تغطية شاملة', 'description' => 'ضمان إضافي من أبو زينة للتقنيات يمتد لسنة كاملة', 'features' => ['خدمة منزلية', 'صيانة دورية', 'استشارة فنية']],
                    ['title' => 'ضمان التركيب', 'duration' => '6 أشهر', 'coverage' => 'أخطاء التركيب', 'description' => 'ضمان خاص على خدمة التركيب والتشغيل الأولي', 'features' => ['إعادة تركيب', 'ضبط الإعدادات', 'تدريب الاستخدام']]
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'warranty',
                'description' => 'أنواع الضمان',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('site_settings')->whereIn('group', ['about', 'contact', 'shipping', 'returns', 'warranty'])->delete();
    }
};

