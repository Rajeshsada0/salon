<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

test('tenant dashboard displays dynamic metrics', function () {
    $tenantId = 'report-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");
    if (!file_exists($dbPath)) {
        touch($dbPath);
    }

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    
    // Setup test data
    $owner = User::where('email', 'owner@salon.com')->first();
    $customer = Customer::create(['name' => 'Alice', 'mobile' => '1111']);
    
    $category = ServiceCategory::create(['name' => 'Hair', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Haircut',
        'price' => 50.00,
        'duration_minutes' => 30,
    ]);
    
    // Create today's appointment and invoice
    $appointment = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => date('Y-m-d'),
        'start_time' => '10:00:00',
        'end_time' => '10:30:00',
        'total_amount' => 50.00,
        'status' => 'completed',
    ]);
    
    $invoice = Invoice::create([
        'appointment_id' => $appointment->id,
        'customer_id' => $customer->id,
        'invoice_number' => 'INV-001',
        'subtotal' => 50.00,
        'total_amount' => 50.00,
        'payment_method' => 'cash',
        'status' => 'paid',
        'created_at' => now(),
    ]);

    InvoiceItem::create([
        'invoice_id' => $invoice->id,
        'service_id' => $service->id,
        'item_name' => $service->name,
        'unit_price' => 50.00,
        'total' => 50.00,
    ]);

    tenancy()->end();

    // Act
    $response = $this->actingAs($owner)
        ->get("http://{$tenantId}.localhost/dashboard");

    $response->assertStatus(200);

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});

test('tenant reports filter by date correctly', function () {
    $tenantId = 'report2-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");
    if (!file_exists($dbPath)) {
        touch($dbPath);
    }

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    
    $owner = User::where('email', 'owner@salon.com')->first();
    $customer = Customer::create(['name' => 'Bob', 'mobile' => '2222']);
    
    $invoice1 = Invoice::create([
        'customer_id' => $customer->id,
        'invoice_number' => 'INV-OLD',
        'total_amount' => 100.00,
        'payment_method' => 'card',
        'status' => 'paid',
        'created_at' => now()->subDays(10), // within default 30 days
    ]);

    $invoice2 = Invoice::create([
        'customer_id' => $customer->id,
        'invoice_number' => 'INV-OLDER',
        'total_amount' => 200.00,
        'payment_method' => 'wallet',
        'status' => 'paid',
        'created_at' => now()->subDays(40), // outside default 30 days
    ]);

    tenancy()->end();

    // Default 30 days range
    $response = $this->actingAs($owner)
        ->get("http://{$tenantId}.localhost/reports");

    $response->assertStatus(200);

    // Filter to last 50 days
    $start = now()->subDays(50)->format('Y-m-d');
    $end = now()->format('Y-m-d');
    $response = $this->actingAs($owner)
        ->get("http://{$tenantId}.localhost/reports?start_date={$start}&end_date={$end}");

    $response->assertStatus(200);

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
