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
        $settings = [
            [
                'key' => 'site_name',
                'value' => 'Ropita',
                'type' => 'text',
                'group' => 'general',
                'description' => 'اسم الموقع الرسمي',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'site_tagline',
                'value' => 'متجر ملابس وألعاب الأطفال',
                'type' => 'text',
                'group' => 'general',
                'description' => 'شعار الموقع (Tagline)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'footer_copyright',
                'value' => '© 2025 Ropita. جميع الحقوق محفوظة.',
                'type' => 'text',
                'group' => 'footer',
                'description' => 'نص حقوق النشر في التذييل',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'footer_about_text',
                'value' => 'روحيتا هو متجر متخصص في ملابس وألعاب الأطفال، نسعى لتقديم أفضل المنتجات بجودة عالية وأسعار منافسة.',
                'type' => 'textarea',
                'group' => 'footer',
                'description' => 'نص "عن المتجر" في التذييل',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'seo_meta_title',
                'value' => 'Ropita - متجر ملابس وألعاب الأطفال',
                'type' => 'text',
                'group' => 'seo',
                'description' => 'عنوان SEO الرئيسي',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'seo_meta_description',
                'value' => 'تسوق أفضل ملابس وألعاب الأطفال في متجر Ropita. جودة عالية وتوصيل سريع.',
                'type' => 'textarea',
                'group' => 'seo',
                'description' => 'وصف SEO للمحركات',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'seo_meta_keywords',
                'value' => 'ملابس أطفال, ألعاب أطفال, تسوق, Ropita',
                'type' => 'text',
                'group' => 'seo',
                'description' => 'كلمات SEO المفتاحية',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('site_settings')->updateOrInsert(
                ['key' => $setting['key']],
                $setting
            );
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
