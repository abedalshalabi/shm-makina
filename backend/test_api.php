<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::create('/api/v1/products?page=1&per_page=5', 'GET');
$response = $kernel->handle($request);
$status = $response->getStatusCode();
echo "Status: $status\n";
$content = $response->getContent();
$data = json_decode($content, true);
if (isset($data['message'])) {
    echo "Error: " . $data['message'] . "\n";
    if (isset($data['exception'])) echo "Exception: " . $data['exception'] . "\n";
    if (isset($data['trace'])) {
        foreach (array_slice($data['trace'], 0, 5) as $t) {
            echo "  - " . ($t['file'] ?? '') . ":" . ($t['line'] ?? '') . "\n";
        }
    }
} else {
    echo "OK - count: " . count($data['data'] ?? []) . "\n";
}
