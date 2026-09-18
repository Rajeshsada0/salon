<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\ServicePackage;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

test('tenant service category CRUD works', function () {
    $tenantId = 'svccat-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    $owner = User::where('email', 'owner@salon.com')->first();
    tenancy()->end();

    // 1. Create category
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/services/categories", [
            'name' => 'Hair Care',
            'description' => 'All hair services',
            'sort_order' => '1',
        ]);

    $response->assertRedirect("http://{$tenantId}.localhost/services");

    tenancy()->initialize($tenant);
    $category = ServiceCategory::where('name', 'Hair Care')->first();
    expect($category)->not->toBeNull();
    expect($category->description)->toBe('All hair services');
    expect($category->sort_order)->toBe(1);
    expect($category->is_active)->toBeTrue();
    tenancy()->end();

    // 2. Update category
    $updateResponse = $this->actingAs($owner)
        ->put("http://{$tenantId}.localhost/services/categories/{$category->id}", [
            'name' => 'Hair & Scalp Care',
            'description' => 'Updated description',
            'sort_order' => '2',
        ]);

    $updateResponse->assertRedirect("http://{$tenantId}.localhost/services");

    tenancy()->initialize($tenant);
    $category = $category->fresh();
    expect($category->name)->toBe('Hair & Scalp Care');
    expect($category->sort_order)->toBe(2);
    tenancy()->end();

    // 3. Delete category
    $deleteResponse = $this->actingAs($owner)
        ->delete("http://{$tenantId}.localhost/services/categories/{$category->id}");

    $deleteResponse->assertRedirect("http://{$tenantId}.localhost/services");

    tenancy()->initialize($tenant);
    expect(ServiceCategory::where('name', 'Hair & Scalp Care')->exists())->toBeFalse();
    tenancy()->end();

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});

test('tenant service CRUD with category works', function () {
    $tenantId = 'svc-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    $owner = User::where('email', 'owner@salon.com')->first();

    // Create a category in the tenant DB context
    $category = ServiceCategory::create([
        'name' => 'Skin Care',
        'sort_order' => 1,
    ]);
    tenancy()->end();

    // 1. Create service
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/services", [
            'service_category_id' => $category->id,
            'name' => 'Facial Treatment',
            'description' => 'Deep cleansing facial',
            'price' => '75.00',
            'duration_minutes' => '60',
            'commission_percentage' => '15',
        ]);

    $response->assertRedirect("http://{$tenantId}.localhost/services");

    tenancy()->initialize($tenant);
    $service = Service::where('name', 'Facial Treatment')->first();
    expect($service)->not->toBeNull();
    expect($service->price)->toBe('75.00');
    expect($service->duration_minutes)->toBe(60);
    expect($service->commission_percentage)->toBe('15.00');
    expect($service->is_active)->toBeTrue();
    expect($service->service_category_id)->toBe($category->id);
    tenancy()->end();

    // 2. Update service
    $updateResponse = $this->actingAs($owner)
        ->put("http://{$tenantId}.localhost/services/{$service->id}", [
            'service_category_id' => $category->id,
            'name' => 'Premium Facial Treatment',
            'price' => '95.00',
            'duration_minutes' => '90',
            'commission_percentage' => '20',
        ]);

    $updateResponse->assertRedirect("http://{$tenantId}.localhost/services");

    tenancy()->initialize($tenant);
    $service = $service->fresh();
    expect($service->name)->toBe('Premium Facial Treatment');
    expect($service->price)->toBe('95.00');
    expect($service->duration_minutes)->toBe(90);
    expect($service->commission_percentage)->toBe('20.00');
    tenancy()->end();

    // 3. List services page
    $indexResponse = $this->actingAs($owner)
        ->get("http://{$tenantId}.localhost/services");

    $indexResponse->assertOk();

    // 4. Delete service
    $deleteResponse = $this->actingAs($owner)
        ->delete("http://{$tenantId}.localhost/services/{$service->id}");

    $deleteResponse->assertRedirect("http://{$tenantId}.localhost/services");

    tenancy()->initialize($tenant);
    expect(Service::where('name', 'Premium Facial Treatment')->exists())->toBeFalse();
    tenancy()->end();

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});

test('tenant service package CRUD with pivot works', function () {
    $tenantId = 'pkg-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    $owner = User::where('email', 'owner@salon.com')->first();

    // Setup: create category and services
    $category = ServiceCategory::create(['name' => 'Bridal', 'sort_order' => 1]);
    $service1 = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Bridal Makeup',
        'price' => 200.00,
        'duration_minutes' => 120,
    ]);
    $service2 = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Bridal Hair',
        'price' => 150.00,
        'duration_minutes' => 90,
    ]);
    tenancy()->end();

    // 1. Create package with services
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/services/packages", [
            'name' => 'Complete Bridal Package',
            'description' => 'Full bridal experience',
            'price' => '300.00',
            'services' => [$service1->id, $service2->id],
        ]);

    $response->assertRedirect("http://{$tenantId}.localhost/services");

    tenancy()->initialize($tenant);
    $package = ServicePackage::where('name', 'Complete Bridal Package')->first();
    expect($package)->not->toBeNull();
    expect($package->price)->toBe('300.00');
    expect($package->services)->toHaveCount(2);
    expect($package->services->pluck('name')->toArray())->toContain('Bridal Makeup', 'Bridal Hair');
    tenancy()->end();

    // 2. Update package — remove one service
    $updateResponse = $this->actingAs($owner)
        ->put("http://{$tenantId}.localhost/services/packages/{$package->id}", [
            'name' => 'Bridal Package Lite',
            'price' => '180.00',
            'services' => [$service1->id],
        ]);

    $updateResponse->assertRedirect("http://{$tenantId}.localhost/services");

    tenancy()->initialize($tenant);
    $package = $package->fresh();
    $package->load('services');
    expect($package->name)->toBe('Bridal Package Lite');
    expect($package->price)->toBe('180.00');
    expect($package->services)->toHaveCount(1);
    expect($package->services->first()->name)->toBe('Bridal Makeup');
    tenancy()->end();

    // 3. Delete package
    $deleteResponse = $this->actingAs($owner)
        ->delete("http://{$tenantId}.localhost/services/packages/{$package->id}");

    $deleteResponse->assertRedirect("http://{$tenantId}.localhost/services");

    tenancy()->initialize($tenant);
    expect(ServicePackage::where('name', 'Bridal Package Lite')->exists())->toBeFalse();
    tenancy()->end();

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});

test('tenant service API endpoints return correct data', function () {
    $tenantId = 'svcapi-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    // Create test data
    tenancy()->initialize($tenant);
    $category = ServiceCategory::create(['name' => 'Nails', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Gel Manicure',
        'price' => 45.00,
        'duration_minutes' => 45,
    ]);
    $package = ServicePackage::create(['name' => 'Nail Combo', 'price' => 80.00]);
    $package->services()->attach($service->id);
    tenancy()->end();

    // Get API token
    $loginResponse = $this->postJson("http://{$tenantId}.localhost/api/login", [
        'email' => 'owner@salon.com',
        'password' => 'password',
        'device_name' => 'test-device',
    ]);
    $token = $loginResponse->json('token');

    // 1. GET /api/services
    $servicesResponse = $this->getJson("http://{$tenantId}.localhost/api/services", [
        'Authorization' => "Bearer {$token}",
    ]);
    $servicesResponse->assertOk();
    $servicesResponse->assertJsonStructure(['services']);

    // 2. GET /api/service-categories
    $categoriesResponse = $this->getJson("http://{$tenantId}.localhost/api/service-categories", [
        'Authorization' => "Bearer {$token}",
    ]);
    $categoriesResponse->assertOk();
    $categoriesResponse->assertJsonStructure(['categories']);

    // 3. GET /api/service-packages
    $packagesResponse = $this->getJson("http://{$tenantId}.localhost/api/service-packages", [
        'Authorization' => "Bearer {$token}",
    ]);
    $packagesResponse->assertOk();
    $packagesResponse->assertJsonStructure(['packages']);

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
