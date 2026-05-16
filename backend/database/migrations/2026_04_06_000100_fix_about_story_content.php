<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ensure about_story_content has a non-null default value.
     */
    public function up(): void
    {
        $defaultContent = 'بدأت رحلتنا في عام 2010 بهدف واحد: تقديم أفضل التقنيات والأجهزة الإلكترونية لعملائنا في فلسطين. عبر السنوات، نمونا لنتحول من متجر صغير إلى واحدة من أكبر الشركات في مجال التكنولوجيا في المنطقة.';

        DB::table('site_settings')->updateOrInsert(
            ['key' => 'about_story_content'],
            [
                'value' => $defaultContent,
                'type' => 'text',
                'group' => 'about',
                'description' => 'محتوى قسم القصة',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Revert the fix (sets value to null only if it was the default we injected).
     */
    public function down(): void
    {
        $defaultValue = 'بدأت رحلتنا في عام 2010 بهدف واحد: تقديم أفضل التقنيات والأجهزة الإلكترونية لعملائنا في فلسطين. عبر السنوات، نمونا لنتحول من متجر صغير إلى واحدة من أكبر الشركات في مجال التكنولوجيا في المنطقة.';

        DB::table('site_settings')
            ->where('key', 'about_story_content')
            ->where('value', $defaultValue)
            ->update(['value' => null]);
    }
};
