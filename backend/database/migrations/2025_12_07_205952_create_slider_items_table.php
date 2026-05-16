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
        Schema::create('slider_items', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable(); // العنوان الرئيسي
            $table->string('subtitle')->nullable(); // العنوان الفرعي
            $table->text('description')->nullable(); // الوصف
            $table->string('image')->nullable(); // صورة الخلفية
            $table->string('background_color')->nullable(); // لون الخلفية (gradient) - اختياري إذا كان هناك صورة
            $table->string('text_color')->default('text-white'); // لون النص
            $table->string('button1_text')->nullable(); // نص الزر الأول
            $table->string('button1_link')->nullable(); // رابط الزر الأول
            $table->string('button1_color')->default('bg-white text-blue-900'); // لون الزر الأول
            $table->string('button2_text')->nullable(); // نص الزر الثاني
            $table->string('button2_link')->nullable(); // رابط الزر الثاني
            $table->string('button2_color')->default('border-2 border-white text-white'); // لون الزر الثاني
            $table->integer('sort_order')->default(0); // ترتيب العرض
            $table->boolean('is_active')->default(true); // نشط/غير نشط
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('slider_items');
    }
};
