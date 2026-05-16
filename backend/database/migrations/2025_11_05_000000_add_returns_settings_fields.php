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
        // Add missing returns settings fields
        $existingKeys = DB::table('site_settings')
            ->where('group', 'returns')
            ->pluck('key')
            ->toArray();

        $newSettings = [];

        if (!in_array('returns_hero_description', $existingKeys)) {
            $newSettings[] = [
                'key' => 'returns_hero_description',
                'value' => 'نحن ملتزمون برضاكم التام. إذا لم تكونوا راضين عن مشترياتكم، يمكنكم إرجاعها أو استبدالها بسهولة',
                'type' => 'text',
                'group' => 'returns',
                'description' => 'وصف صفحة الإرجاع',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('returns_steps', $existingKeys)) {
            $newSettings[] = [
                'key' => 'returns_steps',
                'value' => json_encode([
                    ['step' => 1, 'title' => 'تقديم طلب الإرجاع', 'description' => 'تواصل معنا خلال 14 يوم من تاريخ الاستلام'],
                    ['step' => 2, 'title' => 'مراجعة الطلب', 'description' => 'نراجع طلبك ونرسل تعليمات الإرجاع'],
                    ['step' => 3, 'title' => 'إرسال المنتج', 'description' => 'أرسل المنتج في العبوة الأصلية'],
                    ['step' => 4, 'title' => 'الفحص والاسترداد', 'description' => 'نفحص المنتج ونسترد المبلغ خلال 7 أيام']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'returns',
                'description' => 'خطوات الإرجاع',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('returns_conditions', $existingKeys)) {
            $newSettings[] = [
                'key' => 'returns_conditions',
                'value' => json_encode([
                    ['title' => 'المدة الزمنية', 'description' => 'يجب تقديم طلب الإرجاع خلال 14 يوم من تاريخ الاستلام', 'important' => true],
                    ['title' => 'حالة المنتج', 'description' => 'يجب أن يكون المنتج في حالته الأصلية وغير مستخدم', 'important' => true],
                    ['title' => 'الفاتورة الأصلية', 'description' => 'يجب الاحتفاظ بالفاتورة الأصلية أو إيصال الشراء', 'important' => true],
                    ['title' => 'العبوة الأصلية', 'description' => 'يجب إرجاع المنتج في عبوته الأصلية مع جميع الملحقات', 'important' => true]
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'returns',
                'description' => 'شروط الإرجاع',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('returns_non_returnable', $existingKeys)) {
            $newSettings[] = [
                'key' => 'returns_non_returnable',
                'value' => json_encode([
                    'المنتجات المخصصة أو المصنوعة حسب الطلب',
                    'المنتجات الصحية والشخصية',
                    'البرمجيات والألعاب الرقمية المفتوحة',
                    'المنتجات القابلة للتلف أو سريعة الانتهاء',
                    'المنتجات المستخدمة أو التالفة بسبب سوء الاستخدام'
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'returns',
                'description' => 'المنتجات غير القابلة للإرجاع (مصفوفة)',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('returns_refund_methods', $existingKeys)) {
            $newSettings[] = [
                'key' => 'returns_refund_methods',
                'value' => json_encode([
                    ['method' => 'البطاقة الائتمانية', 'duration' => '3-5 أيام عمل', 'description' => 'يتم الاسترداد إلى نفس البطاقة المستخدمة في الدفع'],
                    ['method' => 'التحويل البنكي', 'duration' => '5-7 أيام عمل', 'description' => 'يتم التحويل إلى الحساب البنكي المحدد'],
                    ['method' => 'المحفظة الإلكترونية', 'duration' => '1-3 أيام عمل', 'description' => 'يتم الاسترداد إلى المحفظة الإلكترونية المستخدمة'],
                    ['method' => 'رصيد المتجر', 'duration' => 'فوري', 'description' => 'يمكن استخدامه في أي عملية شراء مستقبلية']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'returns',
                'description' => 'طرق الاسترداد',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('returns_notes', $existingKeys)) {
            $newSettings[] = [
                'key' => 'returns_notes',
                'value' => json_encode([
                    ['title' => 'الاستبدال', 'description' => 'يمكن استبدال المنتج بآخر من نفس القيمة أو أعلى مع دفع الفرق.', 'type' => 'blue'],
                    ['title' => 'الضمان', 'description' => 'المنتجات المعيبة تحت الضمان يتم إصلاحها أو استبدالها مجاناً.', 'type' => 'green'],
                    ['title' => 'رسوم الشحن', 'description' => 'في حالة الإرجاع بسبب عيب في المنتج، نتحمل رسوم الشحن. في الحالات الأخرى، يتحمل العميل رسوم الإرجاع.', 'type' => 'yellow'],
                    ['title' => 'الأجهزة الكبيرة', 'description' => 'الأجهزة الكبيرة مثل الثلاجات والغسالات تحتاج ترتيب موعد مسبق لاستلامها من منزلكم.', 'type' => 'purple']
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'returns',
                'description' => 'ملاحظات مهمة',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('returns_cta_title', $existingKeys)) {
            $newSettings[] = [
                'key' => 'returns_cta_title',
                'value' => 'تحتاج مساعدة في الإرجاع؟',
                'type' => 'text',
                'group' => 'returns',
                'description' => 'عنوان قسم CTA',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('returns_cta_description', $existingKeys)) {
            $newSettings[] = [
                'key' => 'returns_cta_description',
                'value' => 'فريق خدمة العملاء جاهز لمساعدتك في عملية الإرجاع',
                'type' => 'text',
                'group' => 'returns',
                'description' => 'وصف قسم CTA',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!in_array('returns_cta_phone', $existingKeys)) {
            $newSettings[] = [
                'key' => 'returns_cta_phone',
                'value' => '+966111234567',
                'type' => 'text',
                'group' => 'returns',
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
            ->where('group', 'returns')
            ->whereIn('key', [
                'returns_hero_description',
                'returns_steps',
                'returns_conditions',
                'returns_non_returnable',
                'returns_refund_methods',
                'returns_notes',
                'returns_cta_title',
                'returns_cta_description',
                'returns_cta_phone'
            ])
            ->delete();
    }
};

