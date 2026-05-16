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
            ['key' => 'show_whatsapp_float'],
            [
                'value' => '1',
                'type' => 'toggle',
                'group' => 'analytics',
                'description' => 'إظهار أيقونة واتساب العائمة في الموقع',
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
            ->where('key', 'show_whatsapp_float')
            ->delete();
    }
};
