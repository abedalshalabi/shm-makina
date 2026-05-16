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
        DB::table('site_settings')->updateOrInsert(
            ['key' => 'homepage_features'],
            [
                'value' => json_encode([
                    [
                        'icon' => 'gem',
                        'title' => 'جودة عالية',
                        'description' => 'منتجاتنا أصلية وذات جودة عالية',
                    ],
                    [
                        'icon' => 'smile',
                        'title' => 'خدمة عملاء',
                        'description' => 'على مدار الساعة',
                    ],
                    [
                        'icon' => 'truck',
                        'title' => 'توصيل',
                        'description' => 'لكافة أنحاء البلاد',
                    ],
                    [
                        'icon' => 'map',
                        'title' => 'عنواننا',
                        'description' => 'فلسطين، رام الله',
                    ],
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'general',
                'description' => 'بطاقات مزايا الصفحة الرئيسية',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('site_settings')->where('key', 'homepage_features')->delete();
    }
};
