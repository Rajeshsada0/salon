<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\CouponCode;
use App\Models\InvoicePayment;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

test('pos coupon application and split payments checkout work end-to-end', function () {
    $tenantId = 'posup-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $tenantUrl = "http://{$tenantId}.localhost";
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);
    tenancy()->initialize($tenant);

    $owner = User::where('email', 'owner@salon.com')->first();

    $customer = Customer::create([
        'name' => 'John Client',
        'mobile' => '8888888',
        'wallet_balance' => 100.00,
        'credit_limit' => 200.00,
        'outstanding_balance' => 0.00,
    ]);

    $category = ServiceCategory::create(['name' => 'Hair Care', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Hair Styling',
        'price' => 100.00,
        'duration_minutes' => 45,
    ]);

    // Create test coupon codes
    $percentCoupon = CouponCode::create([
        'code' => 'SAVE15',
        'type' => 'percentage',
        'value' => 15.00,
        'is_active' => true,
    ]);

    $fixedCoupon = CouponCode::create([
        'code' => 'FLAT10',
        'type' => 'fixed',
        'value' => 10.00,
        'is_active' => true,
    ]);

    $inactiveCoupon = CouponCode::create([
        'code' => 'EXPIRED',
        'type' => 'percentage',
        'value' => 20.00,
        'is_active' => false,
    ]);

    tenancy()->end();

    // ─── Test 1: Validate coupon code API endpoint ──────────────────────────
    $response = $this->actingAs($owner)
        ->post("{$tenantUrl}/coupons/validate", ['code' => 'SAVE15']);
    $response->assertJson([
        'valid' => true,
        'coupon' => [
            'code' => 'SAVE15',
            'type' => 'percentage',
        ],
    ]);

    // ─── Test 2: Inactive coupon returns validation failure ──────────────────
    $response2 = $this->actingAs($owner)
        ->post("{$tenantUrl}/coupons/validate", ['code' => 'EXPIRED']);
    $response2->assertStatus(422);

    // ─── Test 3: Checkout with percentage coupon code ──────────────────────
    tenancy()->initialize($tenant);
    $apt1 = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => now()->format('Y-m-d'),
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'status' => 'confirmed',
    ]);
    $apt1->services()->attach($service->id, ['price' => 100.00]);
    tenancy()->end();

    // subtotal 100, coupon SAVE15 (15% = 15.00) -> total 85.00
    $response3 = $this->actingAs($owner)
        ->post("{$tenantUrl}/pos/checkout/{$apt1->id}", [
            'payment_method' => 'cash',
            'discount_amount' => 0,
            'tax_amount' => 0,
            'coupon_code' => 'SAVE15',
        ]);

    tenancy()->initialize($tenant);
    $invoice1 = Invoice::where('appointment_id', $apt1->id)->first();
    tenancy()->end();

    $response3->assertRedirect("{$tenantUrl}/invoices/{$invoice1->id}");

    tenancy()->initialize($tenant);
    expect((float) $invoice1->discount_amount)->toBe(15.00);
    expect((float) $invoice1->total_amount)->toBe(85.00);
    expect($invoice1->coupon_code_id)->toBe($percentCoupon->id);
    expect($percentCoupon->fresh()->uses_count)->toBe(1);
    tenancy()->end();

    // ─── Test 4: Split payments checkout ─────────────────────────────────────
    tenancy()->initialize($tenant);
    $apt2 = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => now()->format('Y-m-d'),
        'start_time' => '11:00:00',
        'end_time' => '12:00:00',
        'status' => 'confirmed',
    ]);
    $apt2->services()->attach($service->id, ['price' => 100.00]);
    tenancy()->end();

    // subtotal 100, coupon FLAT10 ($10) -> total 90.00
    // split: $40 cash, $30 card, $20 wallet
    $response4 = $this->actingAs($owner)
        ->post("{$tenantUrl}/pos/checkout/{$apt2->id}", [
            'payment_method' => 'split',
            'discount_amount' => 0,
            'tax_amount' => 0,
            'coupon_code' => 'FLAT10',
            'split_payments' => [
                ['method' => 'cash', 'amount' => 40.00],
                ['method' => 'card', 'amount' => 30.00],
                ['method' => 'wallet', 'amount' => 20.00],
            ],
        ]);

    tenancy()->initialize($tenant);
    $invoice2 = Invoice::where('appointment_id', $apt2->id)->first();
    tenancy()->end();

    $response4->assertRedirect("{$tenantUrl}/invoices/{$invoice2->id}");

    tenancy()->initialize($tenant);
    expect((float) $invoice2->total_amount)->toBe(90.00);
    expect($invoice2->payments)->toHaveCount(3);
    
    // Check wallet balance got decremented by $20 (100 -> 80)
    expect((float) $customer->fresh()->wallet_balance)->toBe(80.00);

    // Verify segments totals
    $paymentCash = $invoice2->payments->firstWhere('payment_method', 'cash');
    $paymentCard = $invoice2->payments->firstWhere('payment_method', 'card');
    $paymentWallet = $invoice2->payments->firstWhere('payment_method', 'wallet');
    expect((float) $paymentCash->amount)->toBe(40.00);
    expect((float) $paymentCard->amount)->toBe(30.00);
    expect((float) $paymentWallet->amount)->toBe(20.00);
    tenancy()->end();

    // ─── Test 5: Mismatched split payments amount fails validation ───────────
    tenancy()->initialize($tenant);
    $apt3 = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => now()->format('Y-m-d'),
        'start_time' => '12:00:00',
        'end_time' => '13:00:00',
        'status' => 'confirmed',
    ]);
    $apt3->services()->attach($service->id, ['price' => 100.00]);
    tenancy()->end();

    $response5 = $this->actingAs($owner)
        ->post("{$tenantUrl}/pos/checkout/{$apt3->id}", [
            'payment_method' => 'split',
            'discount_amount' => 0,
            'tax_amount' => 0,
            'split_payments' => [
                ['method' => 'cash', 'amount' => 50.00],
                ['method' => 'card', 'amount' => 10.00], // Sum = 60, subtotal = 100 (fails)
            ],
        ]);

    $response5->assertSessionHasErrors(['payment_method']);

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
