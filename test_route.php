<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$request = Illuminate\Http\Request::create('http://foo.localhost/customers');
try {
    $route = app('router')->getRoutes()->match($request);
    echo "Matched: " . $route->getName() . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
