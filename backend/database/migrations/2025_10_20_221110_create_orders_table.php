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
        if (!Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
                $table->id();
                $table->string('order_number')->unique();
                $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
                $table->string('customer_name');
                $table->string('customer_email');
                $table->string('customer_phone');
                $table->string('customer_city');
                $table->string('customer_district');
                $table->string('customer_street')->nullable();
                $table->string('customer_building')->nullable();
                $table->text('customer_additional_info')->nullable();
                $table->decimal('subtotal', 10, 2);
                $table->decimal('shipping_cost', 10, 2)->default(0);
                $table->decimal('total', 10, 2);
                $table->string('payment_method')->default('cod');
                $table->string('payment_status')->default('pending');
                $table->string('order_status')->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
