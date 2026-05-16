<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('site_settings')->updateOrInsert(
            ['key' => 'order_notification_admin_emails'],
            [
                'value' => json_encode([], JSON_UNESCAPED_UNICODE),
                'type' => 'json',
                'group' => 'notifications',
                'description' => 'إيميلات الأدمنز المستلمة لإشعارات الطلبات الجديدة',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('site_settings')
            ->where('key', 'order_notification_admin_emails')
            ->delete();
    }
};
