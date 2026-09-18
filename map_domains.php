<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;

$t = Tenant::find('test');
if ($t) {
    $t->domains()->firstOrCreate(['domain' => 'localhost']);
    $t->domains()->firstOrCreate(['domain' => '127.0.0.1']);
    echo "Domains mapped successfully.\n";
} else {
    echo "Tenant 'test' not found.\n";
}
