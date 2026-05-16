<?php
use Illuminate\Support\Facades\DB;

$tables = ['products', 'product_variants', 'categories', 'filters', 'product_images'];

foreach ($tables as $table) {
    echo "Converting table: $table\n";
    DB::statement("ALTER TABLE `$table` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
}

echo "Done!\n";
