<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$val = "أفران غاز";
$p = App\Models\Product::find(145);
$res = Illuminate\Support\Facades\DB::select("SELECT JSON_SEARCH(filter_values, 'one', ?) as path FROM products WHERE id = 145", [$val]);
echo "DETAILED PATH for 145: " . $res[0]->path . "\n";

$p148 = App\Models\Product::find(148);
$res148 = Illuminate\Support\Facades\DB::select("SELECT JSON_SEARCH(filter_values, 'one', ?) as path FROM products WHERE id = 148", [$val]);
echo "DETAILED PATH for 148: " . ($res148[0]->path ?? 'NULL') . "\n";

