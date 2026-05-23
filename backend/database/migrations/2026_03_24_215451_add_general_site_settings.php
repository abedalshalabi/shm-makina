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
        $settings = [
            [
                'key' => 'site_name',
                'value' => $appName,
                'type' => 'text',
                'group' => 'general',
                'description' => 'اسم الموقع الرسمي',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'site_tagline',
                'value' => 'متجر إلكتروني متكامل',
                'type' => 'text',
                'group' => 'general',
                'description' => 'شعار الموقع (Tagline)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'footer_copyright',
                'value' => '© ' . date('Y') . ' ' . $appName . '. جميع الحقوق محفوظة.',
                'type' => 'text',
                'group' => 'footer',
                'description' => 'نص حقوق النشر في التذييل',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'footer_about_text',
                'value' => 'يقدم لكم متجر ' . $appName . ' أفضل المنتجات والخدمات بجودة عالية وأسعار منافسة.',
                'type' => 'textarea',
                'group' => 'footer',
                'description' => 'نص "عن المتجر" في التذييل',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'seo_meta_title',
                'value' => $appName . ' - متجر إلكتروني',
                'type' => 'text',
                'group' => 'seo',
                'description' => 'عنوان SEO الرئيسي',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'seo_meta_description',
                'value' => 'تسوق أفضل المنتجات في متجر ' . $appName . '. جودة عالية وتوصيل سريع.',
                'type' => 'textarea',
                'group' => 'seo',
                'description' => 'وصف SEO للمحركات',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'seo_meta_keywords',
                'value' => $appName . ', تسوق, متجر إلكتروني',
                'type' => 'text',
                'group' => 'seo',
                'description' => 'كلمات SEO المفتاحية',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($settings as $setting) {
            if (!DB::table('site_settings')->where('key', $setting['key'])->exists()) {
                DB::table('site_settings')->insert($setting);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to delete in case of rollback to avoid data loss
    }
};
