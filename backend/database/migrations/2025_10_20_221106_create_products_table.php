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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('original_price', 10, 2)->nullable();
            $table->decimal('compare_price', 10, 2)->nullable();
            $table->decimal('cost_price', 10, 2)->nullable();
            $table->decimal('discount_percentage', 5, 2)->nullable();
            $table->string('sku')->unique();
            $table->integer('stock_quantity')->default(0);
            $table->boolean('manage_stock')->default(true);
            $table->string('stock_status')->default('in_stock');
            $table->boolean('in_stock')->default(true);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->decimal('weight', 8, 2)->nullable();
            $table->string('dimensions')->nullable();
            $table->string('warranty')->nullable();
            $table->string('delivery_time')->nullable();
            $table->json('features')->nullable();
            $table->json('specifications')->nullable();
            $table->json('images')->nullable();
            $table->decimal('rating', 3, 2)->default(0);
            $table->integer('reviews_count')->default(0);
            $table->integer('views_count')->default(0);
            $table->integer('sales_count')->default(0);
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('brand_id')->nullable()->constrained()->onDelete('set null');
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
