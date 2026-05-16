<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\App\Models\SiteSetting::updateOrCreate(
  ['key' => 'header_announcement_text', 'group' => 'header'],
  ['value' => 'مرحباً بكم في متجرنا! شحن مجاني للطلبات أكثر من 500 شيكل', 'type' => 'text', 'description' => 'شريط الإعلانات العلوي (فوق الهيدر)']
);
echo "Done";
