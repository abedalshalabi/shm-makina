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
        $appName = config('app.name', 'My Store');
        
        // Update all settings dynamically using $appName if they still contain "أبو زينة" or "Abu Zaina"
        $settingsToUpdate = [
            'site_name' => $appName,
            'site_tagline' => 'متجر إلكتروني متكامل',
            'footer_copyright' => '© ' . date('Y') . ' ' . $appName . '. جميع الحقوق محفوظة.',
            'footer_about_text' => 'يقدم لكم متجر ' . $appName . ' أفضل المنتجات والخدمات بجودة عالية وأسعار منافسة.',
            'seo_meta_title' => $appName,
            'seo_meta_description' => 'تسوق أفضل المنتجات في متجر ' . $appName . '. جودة عالية وتوصيل سريع.',
            'seo_meta_keywords' => $appName . ', تسوق, متجر إلكتروني',
        ];

        foreach ($settingsToUpdate as $key => $value) {
            $current = DB::table('site_settings')->where('key', $key)->first();
            if (!$current || empty($current->value) || 
                str_contains(strtolower($current->value), 'ropita') || 
                str_contains($current->value, 'روبيتا') ||
                str_contains($current->value, 'أبو زينة') ||
                str_contains(strtolower($current->value), 'abu zaina')) {
                DB::table('site_settings')->where('key', $key)->update(['value' => $value]);
            }
        }

        // Update about page settings dynamically
        $aboutStory = [
            'title' => 'قصتنا',
            'description' => 'بدأت رحلتنا لتقديم أفضل الخدمات والمنتجات لعملائنا في فلسطين...',
            'image' => 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop'
        ];
        
        $aboutTeam = [
            ['name' => 'فريق العمل', 'position' => 'خدمة العملاء', 'description' => 'فريقنا مكرس لتقديم أفضل خدمة ودعم فني لكم', 'image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'],
        ];

        $aboutSettings = [
            'about_hero_description' => 'نحن شركة رائدة نسعى لتقديم أفضل المنتجات والخدمات لعملائنا في فلسطين',
            'about_story_content' => json_encode($aboutStory, JSON_UNESCAPED_UNICODE),
            'about_team' => json_encode($aboutTeam, JSON_UNESCAPED_UNICODE),
        ];

        foreach ($aboutSettings as $key => $value) {
            $current = DB::table('site_settings')->where('key', $key)->first();
            if (!$current || empty($current->value) || 
                str_contains(strtolower($current->value), 'ropita') || 
                str_contains($current->value, 'روبيتا') ||
                str_contains($current->value, 'أبو زينة') ||
                str_contains(strtolower($current->value), 'abu zaina')) {
                DB::table('site_settings')->where('key', $key)->update(['value' => $value]);
            }
        }

        // Update contact settings dynamically
        $contactInfo = [
            ['type' => 'phone', 'title' => 'الهاتف', 'details' => ['0599000000']],
            ['type' => 'email', 'title' => 'البريد الإلكتروني', 'details' => ['info@shm-makina.ps']],
            ['type' => 'address', 'title' => 'العنوان', 'details' => ['فلسطين']],
            ['type' => 'hours', 'title' => 'ساعات العمل', 'details' => ['السبت - الخميس: 9:00 ص - 10:00 م']]
        ];

        $currentContact = DB::table('site_settings')->where('key', 'contact_info')->first();
        if (!$currentContact || empty($currentContact->value) || 
            str_contains(strtolower($currentContact->value), 'ropita') || 
            str_contains($currentContact->value, 'روبيتا') ||
            str_contains($currentContact->value, 'أبو زينة') ||
            str_contains(strtolower($currentContact->value), 'abu zaina')) {
            DB::table('site_settings')->where('key', 'contact_info')->update([
                'value' => json_encode($contactInfo, JSON_UNESCAPED_UNICODE)
            ]);
        }

        // Update warranty settings dynamically
        $warrantyTypes = [
            ['title' => 'ضمان الشركة المصنعة', 'duration' => 'حسب نوع المنتج', 'coverage' => 'عيوب التصنيع والمواد', 'description' => 'ضمان أصلي من الشركة المصنعة يغطي جميع عيوب التصنيع', 'features' => ['إصلاح مجاني', 'استبدال القطع', 'دعم فني متخصص']],
            ['title' => 'ضمان المتجر الممتد', 'duration' => 'سنة إضافية', 'coverage' => 'تغطية شاملة', 'description' => 'ضمان إضافي يمتد لسنة كاملة', 'features' => ['خدمة منزلية', 'صيانة دورية', 'استشارة فنية']],
            ['title' => 'ضمان الجودة', 'duration' => '6 أشهر', 'coverage' => 'أخطاء التصنيع', 'description' => 'ضمان خاص على جودة الخامات والتصنيع', 'features' => ['إعادة فحص', 'تبديل فوري', 'ضمان استلام']]
        ];

        $currentWarranty = DB::table('site_settings')->where('key', 'warranty_types')->first();
        if (!$currentWarranty || empty($currentWarranty->value) || 
            str_contains(strtolower($currentWarranty->value), 'ropita') || 
            str_contains($currentWarranty->value, 'روبيتا') ||
            str_contains($currentWarranty->value, 'أبو زينة') ||
            str_contains(strtolower($currentWarranty->value), 'abu zaina')) {
            DB::table('site_settings')->where('key', 'warranty_types')->update([
                'value' => json_encode($warrantyTypes, JSON_UNESCAPED_UNICODE)
            ]);
        }

        // Update any other fields containing "أبو زينة" or "Abu Zaina"
        DB::table('site_settings')->where('value', 'like', '%أبو زينة%')->orWhere('value', 'like', '%Abu Zaina%')->orWhere('value', 'like', '%abuzaina%')->get()->each(function ($setting) use ($appName) {
            $newValue = str_replace(
                ['أبو زينة', 'Abu Zaina', 'abuzaina'],
                [$appName, strtoupper($appName), strtolower($appName)],
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
