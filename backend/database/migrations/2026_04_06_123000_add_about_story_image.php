<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add a dedicated image setting for the story section.
     */
    public function up(): void
    {
        DB::table('site_settings')->updateOrInsert(
            ['key' => 'about_story_image'],
            [
                'value' => 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
                'type' => 'image',
                'group' => 'about',
                'description' => 'صورة قسم القصة',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Remove the image setting if it matches the default we added.
     */
    public function down(): void
    {
        DB::table('site_settings')
            ->where('key', 'about_story_image')
            ->where('value', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop')
            ->delete();
    }
};
