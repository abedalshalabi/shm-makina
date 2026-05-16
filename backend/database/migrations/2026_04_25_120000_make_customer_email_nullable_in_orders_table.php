<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('customer_email')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('orders')
            ->whereNull('customer_email')
            ->update(['customer_email' => 'no-email@example.local']);

        Schema::table('orders', function (Blueprint $table) {
            $table->string('customer_email')->nullable(false)->change();
        });
    }
};

