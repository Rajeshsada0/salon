<?php

use App\Models\Tenant;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

test('tenant RBAC seeder works and creates default roles', function () {
    $tenantId = 'rbac-salon-' . uniqid();

    // Create tenant
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);

    $dbPath = database_path("tenant{$tenantId}");

    // Seed the tenant database
    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    // Initialize context to inspect
    tenancy()->initialize($tenant);

    // Verify Spatie roles were seeded
    expect(Role::where('name', 'Salon Owner')->exists())->toBeTrue();
    expect(Role::where('name', 'Stylist')->exists())->toBeTrue();
    expect(Role::where('name', 'Customer')->exists())->toBeTrue();

    // Verify default owner was created
    $owner = User::where('email', 'owner@salon.com')->first();
    expect($owner)->not->toBeNull();
    expect($owner->hasRole('Salon Owner'))->toBeTrue();

    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});

test('tenant API login returns Sanctum token and me endpoint works', function () {
    $tenantId = 'api-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    // Seed tenant
    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    // 1. Send API login request
    $response = $this->postJson("http://{$tenantId}.localhost/api/login", [
        'email' => 'owner@salon.com',
        'password' => 'password',
        'device_name' => 'test-mobile',
    ]);

    $response->assertOk();
    $response->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'roles', 'permissions']]);

    $token = $response->json('token');

    // 2. Query the me endpoint with the token
    $meResponse = $this->getJson("http://{$tenantId}.localhost/api/me", [
        'Authorization' => "Bearer {$token}",
    ]);

    $meResponse->assertOk();
    $meResponse->assertJsonPath('user.email', 'owner@salon.com');
    expect($meResponse->json('user.roles'))->toContain('Salon Owner');

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});

test('tenant staff CRUD operations work', function () {
    $tenantId = 'crud-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    // Seed tenant
    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    // Retrieve default owner
    tenancy()->initialize($tenant);
    $owner = User::where('email', 'owner@salon.com')->first();
    tenancy()->end();

    // 1. Test listing staff via Inertia (should succeed for owner)
    $response = $this->actingAs($owner)
        ->get("http://{$tenantId}.localhost/staff");

    $response->assertOk();

    // 2. Create new staff member (Stylist)
    $createResponse = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/staff", [
            'name' => 'John Stylist',
            'email' => 'john@stylist.com',
            'password' => 'password123',
            'role' => 'Stylist',
            'joining_date' => '2026-06-19',
            'salary' => '1500.00',
            'commission_percentage' => '10.5',
        ]);

    $createResponse->assertRedirect("http://{$tenantId}.localhost/staff");

    // Verify staff exists in tenant database
    tenancy()->initialize($tenant);
    $stylist = User::where('email', 'john@stylist.com')->first();
    expect($stylist)->not->toBeNull();
    expect($stylist->hasRole('Stylist'))->toBeTrue();
    expect($stylist->salary)->toBe('1500.00');
    expect($stylist->commission_percentage)->toBe('10.50');
    tenancy()->end();

    // 3. Update staff member
    $updateResponse = $this->actingAs($owner)
        ->put("http://{$tenantId}.localhost/staff/{$stylist->id}", [
            'name' => 'John Senior Stylist',
            'email' => 'john@stylist.com',
            'role' => 'Stylist',
            'joining_date' => '2026-06-19',
            'salary' => '1800.00',
            'commission_percentage' => '12.0',
        ]);

    $updateResponse->assertRedirect("http://{$tenantId}.localhost/staff");

    // Verify update
    tenancy()->initialize($tenant);
    $stylist = $stylist->fresh();
    expect($stylist->name)->toBe('John Senior Stylist');
    expect($stylist->salary)->toBe('1800.00');
    expect($stylist->commission_percentage)->toBe('12.00');
    tenancy()->end();

    // 4. Delete staff member
    $deleteResponse = $this->actingAs($owner)
        ->delete("http://{$tenantId}.localhost/staff/{$stylist->id}");

    $deleteResponse->assertRedirect("http://{$tenantId}.localhost/staff");

    // Verify deletion
    tenancy()->initialize($tenant);
    expect(User::where('email', 'john@stylist.com')->exists())->toBeFalse();
    tenancy()->end();

    // Cleanup
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
