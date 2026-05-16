<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use Illuminate\Support\Facades\DB;

echo "Diagnostic Start\n";

try {
    echo "Eloquent + select:\n";
    $p = Product::where('is_active', 1)->select('id')->first();
    echo "  Eloquent + select OK: " . ($p ? $p->id : 'none') . "\n";
} catch (\Exception $e) {
    echo "  Eloquent + select FAILED: " . $e->getMessage() . "\n";
}

try {
    echo "Eloquent + select + get:\n";
    $p = Product::where('is_active', 1)->select('id')->get();
    echo "  Eloquent + select + get OK, count: " . count($p) . "\n";
} catch (\Exception $e) {
    echo "  Eloquent + select + get FAILED: " . $e->getMessage() . "\n";
}

try {
    echo "Raw SQL via DB::select:\n";
    $res = DB::select("select id from products where is_active = 1");
    echo "  DB::select OK, count: " . count($res) . "\n";
} catch (\Exception $e) {
    echo "  DB::select FAILED: " . $e->getMessage() . "\n";
}
