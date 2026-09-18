<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use Illuminate\Support\Facades\Artisan;

$t = Tenant::find('test');
if (!$t) {
    $t = Tenant::create(['id' => 'test']);
    $t->domains()->create(['domain' => 'test.localhost']);
    Artisan::call('tenants:seed', ['--tenants' => ['test']]);
    echo "Tenant created successfully!\n";
} else {
    echo "Tenant already exists.\n";
}
