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
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // عنوان العرض
            $table->text('description')->nullable(); // وصف العرض
            $table->enum('type', ['flash_deal', 'weekly_deal', 'bundle']); // نوع العرض
            $table->string('image')->nullable(); // صورة العرض
            $table->decimal('discount_percentage', 5, 2)->nullable(); // نسبة الخصم
            $table->decimal('fixed_discount', 10, 2)->nullable(); // خصم ثابت
            $table->datetime('starts_at'); // تاريخ البدء
            $table->datetime('ends_at'); // تاريخ الانتهاء
            $table->boolean('is_active')->default(true); // حالة النشاط
            $table->integer('sort_order')->default(0); // ترتيب العرض
            $table->json('products')->nullable(); // المنتجات المرتبطة (array of product IDs)
            $table->json('bundle_items')->nullable(); // عناصر الباقة (array of objects with product_id, quantity)
            $table->decimal('bundle_price', 10, 2)->nullable(); // سعر الباقة
            $table->decimal('original_bundle_price', 10, 2)->nullable(); // السعر الأصلي للباقة
            $table->integer('stock_limit')->nullable(); // حد الكمية المتاحة
            $table->integer('sold_count')->default(0); // عدد المنتجات المباعة
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};

