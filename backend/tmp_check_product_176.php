<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$product = App\Models\Product::find(176);
var_export($product ? $product->only(['id','price','original_price','compare_price','discount_percentage','is_active']) : null);
