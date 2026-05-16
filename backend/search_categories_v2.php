<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$keywords = ['غسال', 'إضاء', 'عدد', 'أدوات', 'تنظيف', 'منزلية', 'شخصية', 'إلكترونيات'];

foreach ($keywords as $kw) {
    echo "Keyword: $kw\n";
    $cats = App\Models\Category::where('name', 'like', "%$kw%")->get(['id', 'name']);
    foreach ($cats as $cat) {
        echo "  " . $cat->id . ": " . $cat->name . "\n";
    }
}
