<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Header Phone and Email (Contact Info)
        SiteSetting::updateOrCreate(
            ['key' => 'header_phone'],
            [
                'value' => '',
                'type' => 'text',
                'group' => 'header',
                'description' => 'رقم الهاتف في الـ Header العلوي'
            ]
        );

        SiteSetting::updateOrCreate(
            ['key' => 'header_email'],
            [
                'value' => '',
                'type' => 'text',
                'group' => 'header',
                'description' => 'البريد الإلكتروني في الـ Header العلوي'
            ]
        );

        // Social Media Links
        SiteSetting::updateOrCreate(
            ['key' => 'social_media_facebook'],
            [
                'value' => '',
                'type' => 'text',
                'group' => 'header',
                'description' => 'رابط صفحة Facebook'
            ]
        );

        SiteSetting::updateOrCreate(
            ['key' => 'social_media_twitter'],
            [
                'value' => '',
                'type' => 'text',
                'group' => 'header',
                'description' => 'رابط حساب Twitter'
            ]
        );

        SiteSetting::updateOrCreate(
            ['key' => 'social_media_instagram'],
            [
                'value' => '',
                'type' => 'text',
                'group' => 'header',
                'description' => 'رابط حساب Instagram'
            ]
        );

        SiteSetting::updateOrCreate(
            ['key' => 'social_media_linkedin'],
            [
                'value' => '',
                'type' => 'text',
                'group' => 'header',
                'description' => 'رابط حساب LinkedIn'
            ]
        );

        SiteSetting::updateOrCreate(
            ['key' => 'social_media_youtube'],
            [
                'value' => '',
                'type' => 'text',
                'group' => 'header',
                'description' => 'رابط قناة YouTube'
            ]
        );

        SiteSetting::updateOrCreate(
            ['key' => 'social_media_telegram'],
            [
                'value' => '',
                'type' => 'text',
                'group' => 'header',
                'description' => 'رابط قناة Telegram'
            ]
        );

        // WhatsApp Number
        SiteSetting::updateOrCreate(
            ['key' => 'whatsapp_number'],
            [
                'value' => '',
                'type' => 'text',
                'group' => 'header',
                'description' => 'رقم WhatsApp (مثال: 966501234567)'
            ]
        );
    }
}

