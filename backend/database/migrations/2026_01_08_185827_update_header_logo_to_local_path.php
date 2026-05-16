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
        DB::table('site_settings')
            ->where('key', 'header_logo')
            ->update([
                'value' => '/logo.webp',
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('site_settings')
            ->where('key', 'header_logo')
            ->update([
                'value' => 'https://cdn.builder.io/api/v1/image/assets%2F771ae719ebd54c27bd1a3d83e2201d6c%2Ff677e03217fa4fb894a0ecba683c6cb5?format=webp&width=800',
                'updated_at' => now(),
            ]);
    }
};
