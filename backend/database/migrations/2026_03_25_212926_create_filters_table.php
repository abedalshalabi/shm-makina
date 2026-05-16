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
        Schema::create('filters', function (Blueprint $豊) {
            $豊->id();
            $豊->string('name');
            $豊->string('type')->default('select'); // select, checkbox, range, text
            $豊->json('options')->nullable();
            $豊->boolean('required')->default(false);
            $豊->integer('sort_order')->default(0);
            $豊->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('filters');
    }
};
