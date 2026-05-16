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
            ['key' => 'header_bottom_nav_links'],
            [
                'value' => json_encode([
                    ['title' => 'المنتجات', 'link' => '/products', 'show' => '1'],
                    ['title' => 'التصنيفات', 'link' => '/categories', 'show' => '1'],
                    ['title' => 'الماركات', 'link' => '/brands', 'show' => '1'],
                    ['title' => 'العروض', 'link' => '/offers', 'show' => '1'],
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'header',
                'description' => 'روابط الهيدر السفلية (show: 1 للإظهار، 0 للإخفاء)',
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
        DB::table('site_settings')->where('key', 'header_bottom_nav_links')->delete();
    }
};
