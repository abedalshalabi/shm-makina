<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_imports', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->string('status')->default('queued')->index();
            $table->string('stage')->default('queued');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->string('message')->nullable();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('images_zip_path')->nullable();
            $table->string('images_zip_name')->nullable();
            $table->unsignedInteger('total_rows')->nullable();
            $table->unsignedInteger('processed_rows')->default(0);
            $table->unsignedInteger('created_count')->default(0);
            $table->unsignedInteger('updated_count')->default(0);
            $table->unsignedInteger('row_number')->nullable();
            $table->string('sku')->nullable();
            $table->json('summary')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_imports');
    }
};
