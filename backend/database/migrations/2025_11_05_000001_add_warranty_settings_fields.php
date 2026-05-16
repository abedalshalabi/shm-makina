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
        // Add missing warranty settings fields
        $existingKeys = DB::table('site_settings')
            ->where('group', 'warranty')
            ->pluck('key')
            ->toArray();

        $newSettings = [];

        if (!in_array('warranty_hero_description', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_hero_description',
                'value' => 'نقدم ضمان شامل على جميع منتجاتنا لضمان راحة بالكم وثقتكم في مشترياتكم',
                'type' => 'text',
                'group' => 'warranty',
                'description' => 'وصف صفحة الضمان',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('warranty_periods', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_periods',
                'value' => json_encode([
                    ['category' => 'الأجهزة الكبيرة', 'items' => ['الثلاجات', 'الغسالات', 'المكيفات', 'الأفران'], 'period' => '2-5 سنوات'],
                    ['category' => 'الأجهزة الصغيرة', 'items' => ['الخلاطات', 'المكانس', 'أجهزة القهوة', 'المكاوي'], 'period' => '1-2 سنة'],
                    ['category' => 'الإلكترونيات', 'items' => ['التلفزيونات', 'أجهزة الصوت', 'الحاسوب', 'الهواتف'], 'period' => '1-3 سنوات'],
                    ['category' => 'الإكسسوارات', 'items' => ['الكابلات', 'الشواحن', 'السماعات', 'الحقائب'], 'period' => '6 أشهر - 1 سنة']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'warranty',
                'description' => 'فترات الضمان',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('warranty_process', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_process',
                'value' => json_encode([
                    ['step' => 1, 'title' => 'الإبلاغ عن المشكلة', 'description' => 'تواصل معنا عبر الهاتف أو الموقع الإلكتروني'],
                    ['step' => 2, 'title' => 'التشخيص الأولي', 'description' => 'نقوم بتشخيص المشكلة وتحديد نوع الخدمة المطلوبة'],
                    ['step' => 3, 'title' => 'جدولة الخدمة', 'description' => 'نحدد موعد مناسب للصيانة أو الاستبدال'],
                    ['step' => 4, 'title' => 'تنفيذ الخدمة', 'description' => 'نقوم بالإصلاح أو الاستبدال حسب شروط الضمان']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'warranty',
                'description' => 'إجراءات الضمان',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('warranty_conditions', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_conditions',
                'value' => json_encode([
                    ['title' => 'الاحتفاظ بالفاتورة', 'description' => 'يجب الاحتفاظ بالفاتورة الأصلية كإثبات للشراء', 'important' => true],
                    ['title' => 'الاستخدام الصحيح', 'description' => 'يجب استخدام المنتج وفقاً لتعليمات الشركة المصنعة', 'important' => true],
                    ['title' => 'عدم التلاعب', 'description' => 'عدم فتح أو إصلاح المنتج من قبل أشخاص غير مخولين', 'important' => true],
                    ['title' => 'الإبلاغ المبكر', 'description' => 'الإبلاغ عن المشاكل فور اكتشافها وعدم التأخير', 'important' => false]
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'warranty',
                'description' => 'شروط الضمان',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('warranty_excluded', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_excluded',
                'value' => json_encode([
                    'الأضرار الناتجة عن سوء الاستخدام أو الإهمال',
                    'الأضرار الناتجة عن الكوارث الطبيعية',
                    'البلى الطبيعي والاستهلاك العادي',
                    'الأضرار الناتجة عن التيار الكهربائي غير المستقر',
                    'الخدش أو الكسر الناتج عن الحوادث',
                    'الأضرار الناتجة عن استخدام قطع غيار غير أصلية'
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'warranty',
                'description' => 'ما لا يشمله الضمان (مصفوفة)',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('warranty_services', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_services',
                'value' => json_encode([
                    ['title' => 'صيانة منزلية', 'description' => 'نأتي إلى منزلك لإصلاح الأجهزة الكبيرة', 'availability' => 'متاح في المدن الرئيسية'],
                    ['title' => 'مركز الصيانة', 'description' => 'أحضر جهازك إلى مركز الصيانة المعتمد', 'availability' => 'متاح في جميع الفروع'],
                    ['title' => 'دعم فني هاتفي', 'description' => 'احصل على مساعدة فنية عبر الهاتف', 'availability' => '24/7 متاح'],
                    ['title' => 'استبدال فوري', 'description' => 'استبدال المنتج في حالة العيوب الجوهرية', 'availability' => 'حسب توفر المخزون']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'warranty',
                'description' => 'خدمات الضمان',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('warranty_notes', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_notes',
                'value' => json_encode([
                    ['title' => 'تسجيل الضمان', 'description' => 'يُنصح بتسجيل المنتج لدى الشركة المصنعة لضمان أفضل خدمة.', 'type' => 'blue'],
                    ['title' => 'الصيانة الدورية', 'description' => 'الصيانة الدورية تساعد في الحفاظ على الضمان وإطالة عمر المنتج.', 'type' => 'green'],
                    ['title' => 'انتهاء الضمان', 'description' => 'بعد انتهاء الضمان، نقدم خدمات الصيانة بأسعار تفضيلية لعملائنا.', 'type' => 'yellow']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'warranty',
                'description' => 'ملاحظات مهمة',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('warranty_cta_title', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_cta_title',
                'value' => 'تحتاج خدمة ضمان؟',
                'type' => 'text',
                'group' => 'warranty',
                'description' => 'عنوان قسم CTA',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('warranty_cta_description', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_cta_description',
                'value' => 'تواصل معنا الآن للحصول على خدمة الضمان',
                'type' => 'text',
                'group' => 'warranty',
                'description' => 'وصف قسم CTA',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('warranty_cta_phone', $existingKeys)) {
            $newSettings[] = [
                'key' => 'warranty_cta_phone',
                'value' => '+966111234567',
                'type' => 'text',
                'group' => 'warranty',
                'description' => 'رقم الهاتف في قسم CTA',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($newSettings)) {
            DB::table('site_settings')->insert($newSettings);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('site_settings')
            ->where('group', 'warranty')
            ->whereIn('key', [
                'warranty_hero_description',
                'warranty_periods',
                'warranty_process',
                'warranty_conditions',
                'warranty_excluded',
                'warranty_services',
                'warranty_notes',
                'warranty_cta_title',
                'warranty_cta_description',
                'warranty_cta_phone'
            ])
            ->delete();
    }
};

