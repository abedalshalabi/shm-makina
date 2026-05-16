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
            ['key' => 'homepage_section_visibility'],
            [
                'value' => json_encode([
                    'hero_slider' => true,
                    'main_categories' => true,
                    'brand_categories' => true,
                    'featured_offers' => true,
                    'latest_products' => true,
                    'newsletter' => true,
                    'homepage_features' => true,
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'general',
                'description' => 'التحكم في ظهور أقسام الصفحة الرئيسية',
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
        DB::table('site_settings')->where('key', 'homepage_section_visibility')->delete();
    }
};
