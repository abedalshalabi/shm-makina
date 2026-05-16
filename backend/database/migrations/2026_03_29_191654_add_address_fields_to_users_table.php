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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 20)->nullable()->after('email');
            $table->string('city', 100)->nullable()->after('phone');
            $table->string('district', 100)->nullable()->after('city');
            $table->string('street', 255)->nullable()->after('district');
            $table->string('building', 100)->nullable()->after('street');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'city', 'district', 'street', 'building']);
        });
    }
};
