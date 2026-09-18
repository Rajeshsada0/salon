<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\Appointment;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

test('tenant appointment scheduling and overlap validation works', function () {
    $tenantId = 'apt-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    
    // Setup test data
    $owner = User::where('email', 'owner@salon.com')->first();
    $customer = Customer::create([
        'name' => 'John Doe',
        'mobile' => '+15550001111',
    ]);
    $category = ServiceCategory::create(['name' => 'Hair', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Haircut',
        'price' => 50.00,
        'duration_minutes' => 60,
    ]);
    
    tenancy()->end();

    $date = date('Y-m-d', strtotime('+1 day'));

    // 1. Create a valid appointment
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/appointments", [
            'customer_id' => $customer->id,
            'staff_id' => $owner->id,
            'date' => $date,
            'start_time' => '10:00',
            'services' => [$service->id],
            'notes' => 'First time client',
        ]);

    $response->assertRedirect("http://{$tenantId}.localhost/appointments?date={$date}");

    tenancy()->initialize($tenant);
    $appointment = Appointment::where('customer_id', $customer->id)->first();
    expect($appointment)->not->toBeNull();
    expect($appointment->start_time)->toBe('10:00:00');
    expect($appointment->end_time)->toBe('11:00:00'); // 60 mins added
    expect($appointment->total_amount)->toBe('50.00');
    expect($appointment->status)->toBe('pending');
    expect($appointment->services)->toHaveCount(1);
    expect((float) $appointment->services->first()->pivot->price)->toBe(50.00);
    tenancy()->end();

    // 2. Attempt to create overlapping appointment (should fail)
    $failResponse = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/appointments", [
            'customer_id' => $customer->id,
            'staff_id' => $owner->id,
            'date' => $date,
            'start_time' => '10:30', // Overlaps with 10:00 - 11:00
            'services' => [$service->id],
        ]);

    $failResponse->assertSessionHasErrors(['overlap']);

    // 3. Create non-overlapping appointment immediately after (should succeed)
    $successResponse = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/appointments", [
            'customer_id' => $customer->id,
            'staff_id' => $owner->id,
            'date' => $date,
            'start_time' => '11:00',
            'services' => [$service->id],
        ]);

    $successResponse->assertSessionHasNoErrors();
    $successResponse->assertRedirect();

    // 4. Update status
    $statusResponse = $this->actingAs($owner)
        ->patch("http://{$tenantId}.localhost/appointments/{$appointment->id}/status", [
            'status' => 'confirmed',
        ]);

    $statusResponse->assertRedirect();

    tenancy()->initialize($tenant);
    expect($appointment->fresh()->status)->toBe('confirmed');
    tenancy()->end();

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});

test('tenant appointment API endpoints work', function () {
    $tenantId = 'aptapi-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    $customer = Customer::create([
        'name' => 'Jane Doe',
        'mobile' => '+15550002222',
    ]);
    $category = ServiceCategory::create(['name' => 'Nails', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Manicure',
        'price' => 30.00,
        'duration_minutes' => 45,
    ]);
    $staff = User::where('email', 'owner@salon.com')->first();
    tenancy()->end();

    $loginResponse = $this->postJson("http://{$tenantId}.localhost/api/login", [
        'email' => 'owner@salon.com',
        'password' => 'password',
        'device_name' => 'test-device',
    ]);
    $token = $loginResponse->json('token');

    $date = date('Y-m-d', strtotime('+2 days'));

    // 1. Create appointment via API
    $createResponse = $this->postJson("http://{$tenantId}.localhost/api/appointments", [
        'customer_id' => $customer->id,
        'staff_id' => $staff->id,
        'date' => $date,
        'start_time' => '14:00',
        'services' => [$service->id],
    ], ['Authorization' => "Bearer {$token}"]);

    $createResponse->assertStatus(201);
    $createResponse->assertJsonPath('appointment.start_time', '14:00:00');
    $createResponse->assertJsonPath('appointment.end_time', '14:45:00');
    $createResponse->assertJsonPath('appointment.total_amount', '30.00');

    $appointmentId = $createResponse->json('appointment.id');

    // 2. List appointments via API
    $listResponse = $this->getJson("http://{$tenantId}.localhost/api/appointments", [
        'Authorization' => "Bearer {$token}",
    ]);

    $listResponse->assertOk();
    $listResponse->assertJsonStructure(['appointments']);

    // 3. Cancel appointment via API
    $cancelResponse = $this->patchJson("http://{$tenantId}.localhost/api/appointments/{$appointmentId}/cancel", [], [
        'Authorization' => "Bearer {$token}",
    ]);

    $cancelResponse->assertOk();
    $cancelResponse->assertJsonPath('appointment.status', 'cancelled');

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
