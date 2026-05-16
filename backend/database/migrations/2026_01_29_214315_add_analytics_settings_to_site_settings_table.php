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
                'key' => 'show_visitor_counter',
                'value' => '1',
                'type' => 'toggle',
                'group' => 'analytics',
                'description' => 'إظهار عداد الزوار في الموقع',
            ],
            [
                'key' => 'show_product_views',
                'value' => '1',
                'type' => 'toggle',
                'group' => 'analytics',
                'description' => 'إظهار عدد مشاهدات المنتج في صفحة المنتج',
            ],
            [
                'key' => 'total_visits',
                'value' => '0',
                'type' => 'number',
                'group' => 'analytics',
                'description' => 'إجمالي عدد الزيارات',
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('site_settings')->updateOrInsert(
                ['key' => $setting['key']],
                array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('site_settings')
            ->whereIn('key', ['show_visitor_counter', 'show_product_views', 'total_visits'])
            ->delete();
    }
};
