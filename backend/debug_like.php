<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$filterKey = "نوع الأفران";
$value = "أفران غاز";

// Try various LIKE patterns
$patterns = [
    '%"' . $filterKey . '":%"' . $value . '"%', // exact key, quoted value
    '%"' . str_replace("أ", "ا", $filterKey) . '":%"' . $value . '"%', // normalized key, quoted value
    '%"' . $filterKey . '"%'. $value . '%', // very loose
];

foreach ($patterns as $pattern) {
    $count = App\Models\Product::where('filter_values', 'LIKE', $pattern)->count();
    printf("PATTERN:[%s] COUNT:%d\n", $pattern, $count);
}

// Check 148 specifically
$p = App\Models\Product::find(148);
echo "148 filter_values: " . json_encode($p->filter_values, JSON_UNESCAPED_UNICODE) . "\n";
