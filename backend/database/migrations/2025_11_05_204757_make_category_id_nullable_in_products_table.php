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
        // First, migrate existing category_id data to category_product pivot table
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });
        
        // Migrate existing data to pivot table
        DB::statement('
            INSERT INTO category_product (category_id, product_id, created_at, updated_at)
            SELECT category_id, id, NOW(), NOW()
            FROM products
            WHERE category_id IS NOT NULL
            ON DUPLICATE KEY UPDATE updated_at = NOW()
        ');
        
        // Make category_id nullable (keep for backward compatibility)
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedBigInteger('category_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable(false)->change();
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
        });
    }
};
