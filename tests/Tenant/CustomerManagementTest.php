<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

test('tenant customer CRUD operations work', function () {
    $tenantId = 'cust-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    // Seed tenant
    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    // Get owner
    tenancy()->initialize($tenant);
    $owner = User::where('email', 'owner@salon.com')->first();
    tenancy()->end();

    // 1. Create a customer
    $createResponse = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/customers", [
            'name' => 'Sarah Johnson',
            'mobile' => '+1555123456',
            'email' => 'sarah@example.com',
            'gender' => 'female',
            'dob' => '1990-05-15',
            'address' => '123 Main St',
            'notes' => 'Prefers organic products',
            'group' => 'VIP',
        ]);

    $createResponse->assertRedirect("http://{$tenantId}.localhost/customers");

    // Verify customer exists
    tenancy()->initialize($tenant);
    $customer = Customer::where('email', 'sarah@example.com')->first();
    expect($customer)->not->toBeNull();
    expect($customer->name)->toBe('Sarah Johnson');
    expect($customer->mobile)->toBe('+1555123456');
    expect($customer->gender)->toBe('female');
    expect($customer->group)->toBe('VIP');
    expect($customer->loyalty_points)->toBe(0);
    expect($customer->wallet_balance)->toBe('0.00');
    tenancy()->end();

    // 2. Update customer
    $updateResponse = $this->actingAs($owner)
        ->put("http://{$tenantId}.localhost/customers/{$customer->id}", [
            'name' => 'Sarah M. Johnson',
            'mobile' => '+1555123456',
            'email' => 'sarah@example.com',
            'gender' => 'female',
            'group' => 'Premium',
            'loyalty_points' => '50',
            'wallet_balance' => '25.00',
        ]);

    $updateResponse->assertRedirect("http://{$tenantId}.localhost/customers");

    tenancy()->initialize($tenant);
    $customer = $customer->fresh();
    expect($customer->name)->toBe('Sarah M. Johnson');
    expect($customer->group)->toBe('Premium');
    expect($customer->loyalty_points)->toBe(50);
    expect($customer->wallet_balance)->toBe('25.00');
    tenancy()->end();

    // 3. View customer profile
    $showResponse = $this->actingAs($owner)
        ->get("http://{$tenantId}.localhost/customers/{$customer->id}");

    $showResponse->assertOk();

    // 4. List customers
    $indexResponse = $this->actingAs($owner)
        ->get("http://{$tenantId}.localhost/customers");

    $indexResponse->assertOk();

    // 5. Delete customer
    $deleteResponse = $this->actingAs($owner)
        ->delete("http://{$tenantId}.localhost/customers/{$customer->id}");

    $deleteResponse->assertRedirect("http://{$tenantId}.localhost/customers");

    tenancy()->initialize($tenant);
    expect(Customer::where('email', 'sarah@example.com')->exists())->toBeFalse();
    tenancy()->end();

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});

test('tenant customer API endpoints work', function () {
    $tenantId = 'custapi-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    // Seed tenant
    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    // Get token for owner
    $loginResponse = $this->postJson("http://{$tenantId}.localhost/api/login", [
        'email' => 'owner@salon.com',
        'password' => 'password',
        'device_name' => 'test-device',
    ]);

    $loginResponse->assertOk();
    $token = $loginResponse->json('token');

    // 1. Create customer via API
    $createResponse = $this->postJson("http://{$tenantId}.localhost/api/customers", [
        'name' => 'API Customer',
        'mobile' => '+1999888777',
        'email' => 'api@customer.com',
        'gender' => 'male',
    ], ['Authorization' => "Bearer {$token}"]);

    $createResponse->assertStatus(201);
    $createResponse->assertJsonPath('customer.name', 'API Customer');

    $customerId = $createResponse->json('customer.id');

    // 2. List customers via API
    $listResponse = $this->getJson("http://{$tenantId}.localhost/api/customers", [
        'Authorization' => "Bearer {$token}",
    ]);

    $listResponse->assertOk();
    $listResponse->assertJsonStructure(['data']);

    // 3. Search customers via API
    $searchResponse = $this->getJson("http://{$tenantId}.localhost/api/customers?search=API", [
        'Authorization' => "Bearer {$token}",
    ]);

    $searchResponse->assertOk();

    // 4. Get single customer via API
    $showResponse = $this->getJson("http://{$tenantId}.localhost/api/customers/{$customerId}", [
        'Authorization' => "Bearer {$token}",
    ]);

    $showResponse->assertOk();
    $showResponse->assertJsonPath('customer.email', 'api@customer.com');

    // 5. Update customer via API
    $updateResponse = $this->putJson("http://{$tenantId}.localhost/api/customers/{$customerId}", [
        'name' => 'API Customer Updated',
        'mobile' => '+1999888777',
    ], ['Authorization' => "Bearer {$token}"]);

    $updateResponse->assertOk();
    $updateResponse->assertJsonPath('customer.name', 'API Customer Updated');

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
