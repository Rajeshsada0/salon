<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\MembershipPlan;
use App\Models\CustomerMembership;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

test('loyalty programs and memberships work end-to-end', function () {
    $tenantId = 'loyalty-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $tenantUrl = "http://{$tenantId}.localhost";
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);
    tenancy()->initialize($tenant);

    $owner = User::where('email', 'owner@salon.com')->first();

    $customer = Customer::create([
        'name' => 'Test Member',
        'mobile' => '9999999',
        'loyalty_points' => 100,
    ]);

    $category = ServiceCategory::create(['name' => 'Beauty', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Facial',
        'price' => 100.00,
        'duration_minutes' => 60,
    ]);

    tenancy()->end();

    // ─── Test 1: Create membership plan ────────────────────────────────────────
    $response = $this->actingAs($owner)
        ->post("{$tenantUrl}/memberships", [
            'name' => 'Gold',
            'price' => 49.99,
            'duration_months' => 3,
            'discount_percentage' => 20,
            'loyalty_points_bonus' => 500,
            'description' => 'Gold tier with 20% off all services.',
            'is_active' => true,
        ]);

    $response->assertRedirect("{$tenantUrl}/memberships");

    tenancy()->initialize($tenant);
    $plan = MembershipPlan::where('name', 'Gold')->first();
    expect($plan)->not->toBeNull();
    expect((float) $plan->discount_percentage)->toBe(20.0);
    expect($plan->loyalty_points_bonus)->toBe(500);
    tenancy()->end();

    // ─── Test 2: Assign plan to customer (calculates correct expiry date) ──────
    $response2 = $this->actingAs($owner)
        ->post("{$tenantUrl}/memberships/assign/{$customer->id}", [
            'membership_plan_id' => $plan->id,
        ]);

    $response2->assertRedirect();

    tenancy()->initialize($tenant);
    $membership = CustomerMembership::where('customer_id', $customer->id)->first();
    $expectedExpiry = now()->addMonths(3)->toDateString();
    expect($membership)->not->toBeNull();
    expect($membership->status)->toBe('active');
    expect($membership->expires_at->toDateString())->toBe($expectedExpiry);

    // Verify bonus points were awarded
    expect($customer->fresh()->loyalty_points)->toBe(600); // 100 + 500 bonus
    tenancy()->end();

    // ─── Test 3: Membership auto-discount applied at POS ───────────────────────
    tenancy()->initialize($tenant);
    $appointment = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => now()->format('Y-m-d'),
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'status' => 'confirmed',
    ]);
    $appointment->services()->attach($service->id, ['price' => 100.00]);
    tenancy()->end();

    $response3 = $this->actingAs($owner)
        ->post("{$tenantUrl}/pos/checkout/{$appointment->id}", [
            'payment_method' => 'cash',
            'discount_amount' => 0,
            'tax_amount' => 0,
        ]);

    tenancy()->initialize($tenant);
    $invoice = \App\Models\Invoice::where('appointment_id', $appointment->id)->first();
    tenancy()->end();

    $response3->assertRedirect("{$tenantUrl}/invoices/{$invoice->id}");

    tenancy()->initialize($tenant);
    // Service was $100, Gold 20% = $20 discount → total $80
    expect((float) $invoice->total_amount)->toBe(80.0);
    expect((float) $invoice->discount_amount)->toBe(20.0);
    tenancy()->end();

    // ─── Test 4: Points redemption reduces invoice total ───────────────────────
    tenancy()->initialize($tenant);
    $appointment2 = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => now()->format('Y-m-d'),
        'start_time' => '11:00:00',
        'end_time' => '12:00:00',
        'status' => 'confirmed',
    ]);
    $appointment2->services()->attach($service->id, ['price' => 100.00]);

    // Customer has 600 + points earned from invoice1 (floor(80/10)=8) = 608
    $currentPoints = $customer->fresh()->loyalty_points;
    tenancy()->end();

    // Redeem 50 points = $5.00 off
    $response4 = $this->actingAs($owner)
        ->post("{$tenantUrl}/pos/checkout/{$appointment2->id}", [
            'payment_method' => 'cash',
            'discount_amount' => 0,
            'tax_amount' => 0,
            'redeem_points' => 50,
        ]);

    tenancy()->initialize($tenant);
    $invoice2 = \App\Models\Invoice::where('appointment_id', $appointment2->id)->first();
    // Service $100, Gold 20% off = $20 discount, redeem 50pts = $5 more → total $75
    expect((float) $invoice2->total_amount)->toBe(75.0);
    expect((float) $invoice2->discount_amount)->toBe(25.0); // 20 membership + 5 points

    // Points should be decremented by 50 (and new earned added)
    $pointsAfter = $customer->fresh()->loyalty_points;
    expect($pointsAfter)->toBe($currentPoints - 50 + (int) floor(75 / 10));
    tenancy()->end();

    // ─── Test 5: Insufficient points blocks checkout ───────────────────────────
    tenancy()->initialize($tenant);
    $appointment3 = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => now()->format('Y-m-d'),
        'start_time' => '12:00:00',
        'end_time' => '13:00:00',
        'status' => 'confirmed',
    ]);
    $appointment3->services()->attach($service->id, ['price' => 100.00]);
    tenancy()->end();

    $response5 = $this->actingAs($owner)
        ->post("{$tenantUrl}/pos/checkout/{$appointment3->id}", [
            'payment_method' => 'cash',
            'discount_amount' => 0,
            'tax_amount' => 0,
            'redeem_points' => 99999, // way more than customer has
        ]);

    $response5->assertSessionHasErrors(['redeem_points']);

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
