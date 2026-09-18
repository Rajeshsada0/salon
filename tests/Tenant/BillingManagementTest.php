<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\Invoice;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

test('tenant billing checkout and wallet deductions work', function () {
    $tenantId = 'billing-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    
    // Setup test data
    $owner = User::where('email', 'owner@salon.com')->first();
    $customer = Customer::create([
        'name' => 'John Wallet',
        'mobile' => '+15550005555',
        'wallet_balance' => 100.00,
        'loyalty_points' => 0,
    ]);
    $category = ServiceCategory::create(['name' => 'Spa', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Massage',
        'price' => 80.00,
        'duration_minutes' => 60,
    ]);
    
    $appointment = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => date('Y-m-d'),
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'total_amount' => 80.00,
        'status' => 'pending',
    ]);
    $appointment->services()->attach($service->id, ['price' => 80.00]);

    tenancy()->end();

    // 1. Checkout using Wallet with discount
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/pos/checkout/{$appointment->id}", [
            'discount_amount' => 10.00,
            'tax_amount' => 5.00,
            'payment_method' => 'wallet',
        ]);

    tenancy()->initialize($tenant);
    $invoice = Invoice::first();
    expect($invoice)->not->toBeNull();
    
    // Check totals
    // subtotal = 80, discount = 10, tax = 5 -> total = 75
    expect((float) $invoice->total_amount)->toBe(75.00);
    expect($invoice->payment_method)->toBe('wallet');
    expect($invoice->status)->toBe('paid');

    $response->assertRedirect("http://{$tenantId}.localhost/invoices/{$invoice->id}");

    // Check Wallet Deduction
    $customer->refresh();
    expect((float) $customer->wallet_balance)->toBe(25.00); // 100 - 75
    
    // Check Loyalty Points (75 / 10 = 7 points)
    expect((int) $customer->loyalty_points)->toBe(7);

    // Check Appointment Status
    expect($appointment->fresh()->status)->toBe('completed');

    tenancy()->end();

    // Cleanup
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});

test('tenant billing fails on insufficient wallet funds', function () {
    $tenantId = 'billingfail-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    
    $owner = User::where('email', 'owner@salon.com')->first();
    $customer = Customer::create([
        'name' => 'Poor Wallet',
        'wallet_balance' => 10.00,
    ]);
    $category = ServiceCategory::create(['name' => 'Spa', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Massage',
        'price' => 50.00,
        'duration_minutes' => 60,
    ]);
    
    $appointment = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => date('Y-m-d'),
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'total_amount' => 50.00,
        'status' => 'pending',
    ]);
    $appointment->services()->attach($service->id, ['price' => 50.00]);

    tenancy()->end();

    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/pos/checkout/{$appointment->id}", [
            'discount_amount' => 0,
            'tax_amount' => 0,
            'payment_method' => 'wallet',
        ]);

    $response->assertSessionHasErrors(['payment_method']);

    tenancy()->initialize($tenant);
    expect(Invoice::count())->toBe(0);
    expect((float) $customer->fresh()->wallet_balance)->toBe(10.00);
    tenancy()->end();

    // Cleanup
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
