<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Force about_story_content to be a plain text field (not JSON).
     */
    public function up(): void
    {
        // Try to preserve any existing description if the current value is JSON.
        $current = DB::table('site_settings')->where('key', 'about_story_content')->first();

        $textValue = null;

        if ($current && $current->value) {
            $decoded = json_decode($current->value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                // Prefer description field if present
                $textValue = $decoded['description'] ?? $decoded['title'] ?? null;
            }
        }

        // Fallback to existing value or a default paragraph
        if (!$textValue) {
            $textValue = $current->value ?? 'بدأت رحلتنا في عام 2010 بهدف واحد: تقديم أفضل التقنيات والأجهزة الإلكترونية لعملائنا في فلسطين. عبر السنوات، نمونا لنتحول من متجر صغير إلى واحدة من أكبر الشركات في مجال التكنولوجيا في المنطقة.';
        }

        DB::table('site_settings')->updateOrInsert(
            ['key' => 'about_story_content'],
            [
                'value' => $textValue,
                'type' => 'text',
                'group' => 'about',
                'description' => 'محتوى قسم القصة',
                'created_at' => $current->created_at ?? now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Revert to null to avoid reintroducing JSON.
     */
    public function down(): void
    {
        DB::table('site_settings')
            ->where('key', 'about_story_content')
            ->update([
                'value' => null,
                'type' => 'text',
                'updated_at' => now(),
            ]);
    }
};
