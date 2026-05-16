<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$settings = App\Models\SiteSetting::where('group', 'analytics')->get();
if ($settings->isEmpty()) {
    echo "No settings found in group analytics\n";
} else {
    foreach ($settings as $s) {
        echo "Key: {$s->key}, Value: {$s->value}, Type: {$s->type}\n";
    }
}
