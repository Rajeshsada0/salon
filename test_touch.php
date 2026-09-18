<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = App\Models\Tenant::create(['id' => 'report-salon-' . uniqid()]);
$path = database_path('tenant' . $tenant->id);
echo "DB Path: $path\n";
echo "Exists: " . (file_exists($path) ? 'Yes' : 'No') . "\n";
