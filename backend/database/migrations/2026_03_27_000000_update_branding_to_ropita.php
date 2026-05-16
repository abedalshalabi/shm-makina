<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all settings that contain "أبو زينة" or "Abu Zaina"
        $settingsToUpdate = [
            'site_name' => 'Ropita',
            'site_tagline' => 'متجر ملابس وألعاب الأطفال',
            'footer_copyright' => '© 2025 Ropita. جميع الحقوق محفوظة.',
            'footer_about_text' => 'روبيتا هو متجر متخصص في ملابس وألعاب الأطفال، نسعى لتقديم أفضل المنتجات بجودة عالية وأسعار منافسة.',
            'seo_meta_title' => 'Ropita - متجر ملابس وألعاب الأطفال',
            'seo_meta_description' => 'تسوق أفضل ملابس وألعاب الأطفال في متجر Ropita. جودة عالية وتوصيل سريع.',
            'seo_meta_keywords' => 'ملابس أطفال, ألعاب أطفال, تسوق, Ropita',
        ];

        foreach ($settingsToUpdate as $key => $value) {
            DB::table('site_settings')->where('key', $key)->update(['value' => $value]);
        }

        // Update about page settings
        $aboutSettingsToUpdate = [
            'about_hero_description' => 'نحن شركة رائدة في مجال ملابس وألعاب الأطفال، نسعى لتقديم أفضل المنتجات والخدمات لعملائنا في فلسطين',
            'about_story_content' => json_encode([
                'title' => 'قصتنا',
                'description' => 'بدأت رحلتنا في عام 2010 بهدف واحد: تقديم أفضل ملابس وألعاب الأطفال لعملائنا في فلسطين. عبر السنوات، نمونا لنتحول من متجر صغير إلى واحدة من أكبر الشركات في مجال الأطفال في المنطقة.',
                'image' => 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop'
            ], JSON_UNESCAPED_UNICODE),
            'about_team' => json_encode([
                ['name' => 'فريق روبيتا', 'position' => 'خدمة العملاء', 'description' => 'فريقنا مكرس لتقديم أفضل خدمة لكم ولأطفالكم', 'image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'],
                ['name' => 'فاطمة السالم', 'position' => 'مديرة المبيعات', 'description' => 'متخصصة في خدمة العملاء وإدارة المبيعات لأكثر من 15 عاماً', 'image' => 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face'],
                ['name' => 'محمد العتيبي', 'position' => 'مدير العمليات', 'description' => 'خبير في إدارة العمليات والتوريد لضمان جودة منتجاتنا', 'image' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'],
                ['name' => 'نورا الخالد', 'position' => 'مديرة خدمة العملاء', 'description' => 'متخصصة في تقديم أفضل تجربة عملاء وحل أي استفسارات', 'image' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face']
            ], JSON_UNESCAPED_UNICODE),
        ];

        foreach ($aboutSettingsToUpdate as $key => $value) {
            DB::table('site_settings')->where('key', $key)->update(['value' => $value]);
        }

        // Update contact settings
        $contactSettingsToUpdate = [
            'contact_info' => json_encode([
                ['type' => 'phone', 'title' => 'الهاتف', 'details' => ['+970 599 000 000', '+970 568 000 000']],
                ['type' => 'email', 'title' => 'البريد الإلكتروني', 'details' => ['info@ropita.com', 'support@ropita.com']],
                ['type' => 'address', 'title' => 'العنوان', 'details' => ['شارع الحرية، جنين', 'فلسطين']],
                ['type' => 'hours', 'title' => 'ساعات العمل', 'details' => ['السبت - الخميس: 9:00 ص - 10:00 م', 'الجمعة: 2:00 م - 10:00 م']]
            ], JSON_UNESCAPED_UNICODE),
        ];

        foreach ($contactSettingsToUpdate as $key => $value) {
            DB::table('site_settings')->where('key', $key)->update(['value' => $value]);
        }

        // Update warranty settings
        $warrantySettingsToUpdate = [
            'warranty_types' => json_encode([
                ['title' => 'ضمان الشركة المصنعة', 'duration' => 'حسب نوع المنتج', 'coverage' => 'عيوب التصنيع والمواد', 'description' => 'ضمان أصلي من الشركة المصنعة يغطي جميع عيوب التصنيع', 'features' => ['إصلاح مجاني', 'استبدال القطع', 'دعم فني متخصص']],
                ['title' => 'ضمان روبيتا الممتد', 'duration' => 'سنة إضافية', 'coverage' => 'تغطية شاملة', 'description' => 'ضمان إضافي من روبيتا يمتد لسنة كاملة', 'features' => ['خدمة منزلية', 'صيانة دورية', 'استشارة فنية']],
                ['title' => 'ضمان الجودة', 'duration' => '6 أشهر', 'coverage' => 'أخطاء التصنيع', 'description' => 'ضمان خاص على جودة الخامات والتصنيع', 'features' => ['إعادة فحص', 'تبديل فوري', 'ضمان استلام']]
            ], JSON_UNESCAPED_UNICODE),
        ];

        foreach ($warrantySettingsToUpdate as $key => $value) {
            DB::table('site_settings')->where('key', $key)->update(['value' => $value]);
        }

        // Update any other fields containing "أبو زينة" or "Abu Zaina"
        DB::table('site_settings')->where('value', 'like', '%أبو زينة%')->orWhere('value', 'like', '%Abu Zaina%')->orWhere('value', 'like', '%abuzaina%')->get()->each(function ($setting) {
            $newValue = str_replace(
                ['أبو زينة', 'Abu Zaina', 'abuzaina'],
                ['روبيتا', 'Ropita', 'ropita'],
                $setting->value
            );
            DB::table('site_settings')->where('id', $setting->id)->update(['value' => $newValue]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse as it's just updating data
    }
};
