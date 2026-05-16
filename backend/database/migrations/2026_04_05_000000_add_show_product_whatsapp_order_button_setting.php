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
            ['key' => 'show_product_whatsapp_order_button'],
            [
                'value' => '1',
                'type' => 'toggle',
                'group' => 'analytics',
                'description' => 'إظهار زر الطلب عبر واتساب في صفحة المنتج',
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
        DB::table('site_settings')
            ->where('key', 'show_product_whatsapp_order_button')
            ->delete();
    }
};

