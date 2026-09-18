<?php

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

test('a tenant can be created with a domain and database', function () {
    $tenantId = 'test-salon-' . uniqid();
    $domainName = $tenantId . '.localhost';

    // 1. Create the tenant
    $tenant = Tenant::create([
        'id' => $tenantId,
        'name' => 'Test Salon',
        'plan' => 'professional',
    ]);

    expect($tenant->id)->toBe($tenantId);
    expect($tenant->name)->toBe('Test Salon');
    expect($tenant->plan)->toBe('professional');

    // 2. Create the domain
    $tenant->domains()->create([
        'domain' => $domainName,
    ]);

    // Verify the database file exists
    // SQLiteDatabaseManager usually creates it at database_path("tenant{id}")
    $dbPath = database_path("tenant{$tenantId}");
    expect(file_exists($dbPath))->toBeTrue();

    // 3. Make a request to the tenant domain
    $response = $this->get("http://{$domainName}/login");

    $response->assertOk();

    // 4. Verify we can run queries on the tenant database context
    tenancy()->initialize($tenant);

    // Create a user in the tenant database
    $user = \App\Models\User::create([
        'name' => 'Tenant Staff',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
    ]);

    expect(DB::connection()->getDatabaseName())->toBe($dbPath);
    expect(\App\Models\User::count())->toBe(1);

    tenancy()->end();

    // Disconnect tenant connection to release SQLite file locks on Windows
    DB::disconnect('tenant');

    // Clean up
    $tenant->delete();
    if (file_exists($dbPath)) {
        @unlink($dbPath);
    }
});
