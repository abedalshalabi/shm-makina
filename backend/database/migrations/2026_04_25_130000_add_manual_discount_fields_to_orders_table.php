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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'discount_type')) {
                $table->string('discount_type', 20)->nullable()->after('shipping_cost');
            }
            if (!Schema::hasColumn('orders', 'discount_value')) {
                $table->decimal('discount_value', 10, 2)->default(0)->after('discount_type');
            }
            if (!Schema::hasColumn('orders', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)->default(0)->after('discount_value');
            }
            if (!Schema::hasColumn('orders', 'force_free_shipping')) {
                $table->boolean('force_free_shipping')->default(false)->after('discount_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            foreach (['discount_type', 'discount_value', 'discount_amount', 'force_free_shipping'] as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

