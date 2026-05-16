<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$slider = \App\Models\SliderItem::find(4);
if ($slider) {
    $slider->button2_color = 'border-2 border-emerald-600 bg-white/90 backdrop-blur-md text-emerald-800 hover:bg-emerald-600 hover:text-white shadow-xl';
    $slider->save();
    echo "Updated button2_color to: " . $slider->button2_color . "\n";
} else {
    echo "Slider item 4 not found\n";
}
