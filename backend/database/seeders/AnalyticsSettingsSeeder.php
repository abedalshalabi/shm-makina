<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class AnalyticsSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Analytics & Counters Settings
        $settings = [
            [
                'key' => 'show_visitor_counter',
                'value' => '1',
                'type' => 'toggle',
                'group' => 'analytics',
                'description' => 'إظهار عداد الزوار في الموقع'
            ],
            [
                'key' => 'show_product_views',
                'value' => '1',
                'type' => 'toggle',
                'group' => 'analytics',
                'description' => 'إظهار عدد مشاهدات المنتج في صفحة المنتج'
            ],
            [
                'key' => 'show_whatsapp_float',
                'value' => '1',
                'type' => 'toggle',
                'group' => 'analytics',
                'description' => 'إظهار أيقونة واتساب العائمة في الموقع'
            ],
            [
                'key' => 'total_visits',
                'value' => '0',
                'type' => 'number',
                'group' => 'analytics',
                'description' => 'إجمالي عدد الزيارات'
            ],
        ];

        foreach ($settings as $setting) {
            SiteSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}