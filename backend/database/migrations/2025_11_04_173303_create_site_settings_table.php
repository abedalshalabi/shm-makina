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
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('text'); // text, image, json, etc.
            $table->string('group')->default('header'); // header, footer, general, etc.
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default header settings
        DB::table('site_settings')->insert([
            [
                'key' => 'header_phone',
                'value' => '966+ 11 456 7890',
                'type' => 'text',
                'group' => 'header',
                'description' => 'رقم الهاتف في Header',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'header_email',
                'value' => 'info@abu-zaina.com',
                'type' => 'text',
                'group' => 'header',
                'description' => 'البريد الإلكتروني في Header',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'header_welcome_text',
                'value' => 'مرحباً بكم في أبو زينة للتقنيات',
                'type' => 'text',
                'group' => 'header',
                'description' => 'نص الترحيب في Header',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'header_logo',
                'value' => '/logo.webp',
                'type' => 'image',
                'group' => 'header',
                'description' => 'رابط شعار الموقع',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'header_title',
                'value' => 'أبو زينة للتقنيات',
                'type' => 'text',
                'group' => 'header',
                'description' => 'عنوان الموقع في Header',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'header_subtitle',
                'value' => 'عالم التكنولوجيا والأجهزة الكهربائية',
                'type' => 'text',
                'group' => 'header',
                'description' => 'العنوان الفرعي في Header',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'header_search_placeholder',
                'value' => 'ابحث عن المنتجات والعلامات التجارية...',
                'type' => 'text',
                'group' => 'header',
                'description' => 'نص placeholder لحقل البحث',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'header_menu_items',
                'value' => json_encode([
                    'main_pages' => [
                        ['title' => 'الرئيسية', 'link' => '/'],
                        ['title' => 'المنتجات', 'link' => '/products'],
                        ['title' => 'العروض', 'link' => '/offers'],
                    ],
                    'customer_service' => [
                        ['title' => 'من نحن', 'link' => '/about'],
                        ['title' => 'اتصل بنا', 'link' => '/contact'],
                        ['title' => 'الشحن والتوصيل', 'link' => '/shipping'],
                        ['title' => 'الإرجاع والاستبدال', 'link' => '/returns'],
                        ['title' => 'الضمان', 'link' => '/warranty'],
                    ],
                    'account' => [
                        ['title' => 'تسجيل الدخول', 'link' => '/login'],
                        ['title' => 'إنشاء حساب', 'link' => '/register'],
                    ],
                ], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'header',
                'description' => 'عناصر القائمة في Header',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
