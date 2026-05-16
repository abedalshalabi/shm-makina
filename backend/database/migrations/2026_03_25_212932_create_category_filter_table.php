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
        Schema::create('category_filter', function (Blueprint $豊) {
            $豊->id();
            $豊->foreignId('category_id')->constrained()->onDelete('cascade');
            $豊->foreignId('filter_id')->constrained()->onDelete('cascade');
            $豊->integer('sort_order')->default(0);
            $豊->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('category_filter');
    }
};
