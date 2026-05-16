<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('slider_items', function (Blueprint $table) {
            $table->string('background_color')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('slider_items', function (Blueprint $table) {
            $table->string('background_color')->default('from-blue-900 via-blue-800 to-indigo-900')->change();
        });
    }
};
