<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\ExpenseCategory;
use App\Models\Expense;
use App\Models\CreditPayment;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

test('tenant credit checkouts, payments, expenses, and P&L ledger work', function () {
    $tenantId = 'fin-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");
    $tenantUrl = "http://{$tenantId}.localhost";

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);
    $owner = User::where('email', 'owner@salon.com')->first();
    
    $customer = Customer::create([
        'name' => 'Alice Cooper',
        'mobile' => '5551234',
        'credit_limit' => 100.00,
        'outstanding_balance' => 0.00,
    ]);

    $category = ServiceCategory::create(['name' => 'Hair', 'sort_order' => 1]);

    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Haircut',
        'price' => 60.00,
        'duration_minutes' => 30,
    ]);

    $expensiveService = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Full Keratin Therapy',
        'price' => 120.00,
        'duration_minutes' => 60,
    ]);
    tenancy()->end();

    // 1. Test credit validation blocks checkout exceeding limit
    tenancy()->initialize($tenant);
    $appointment1 = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => now()->format('Y-m-d'),
        'start_time' => '10:00:00',
        'end_time' => '11:00:00',
        'status' => 'confirmed',
    ]);
    $appointment1->services()->attach($expensiveService->id, ['price' => 120.00]);
    tenancy()->end();

    $response = $this->actingAs($owner)
        ->post("{$tenantUrl}/pos/checkout/{$appointment1->id}", [
            'payment_method' => 'credit',
            'discount_amount' => 0,
            'tax_amount' => 0,
            'paid_amount' => 0,
        ]);

    $response->assertSessionHasErrors(['payment_method']);
    
    tenancy()->initialize($tenant);
    expect($customer->fresh()->outstanding_balance)->toBe('0.00');
    tenancy()->end();

    // 2. Test credit checkout succeeds under limit
    tenancy()->initialize($tenant);
    $appointment2 = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => now()->format('Y-m-d'),
        'start_time' => '11:00:00',
        'end_time' => '11:30:00',
        'status' => 'confirmed',
    ]);
    $appointment2->services()->attach($service->id, ['price' => 60.00]);
    tenancy()->end();

    $response2 = $this->actingAs($owner)
        ->post("{$tenantUrl}/pos/checkout/{$appointment2->id}", [
            'payment_method' => 'credit',
            'discount_amount' => 0,
            'tax_amount' => 0,
            'paid_amount' => 20.00, // debt 40
        ]);

    tenancy()->initialize($tenant);
    $invoice = Invoice::first();
    tenancy()->end();

    $response2->assertRedirect("{$tenantUrl}/invoices/{$invoice->id}");

    tenancy()->initialize($tenant);
    expect($customer->fresh()->outstanding_balance)->toBe('40.00');
    expect($invoice->fresh()->paid_amount)->toBe('20.00');
    expect($invoice->fresh()->due_amount)->toBe('40.00');
    expect($invoice->fresh()->status)->toBe('pending');
    tenancy()->end();

    // 3. Test collecting dues payments
    $response3 = $this->actingAs($owner)
        ->post("{$tenantUrl}/credits/pay", [
            'customer_id' => $customer->id,
            'amount' => 40.00,
            'payment_method' => 'cash',
            'notes' => 'Settled partial amount',
        ]);

    $response3->assertRedirect("{$tenantUrl}/financials");

    tenancy()->initialize($tenant);
    expect($customer->fresh()->outstanding_balance)->toBe('0.00');
    expect(CreditPayment::count())->toBe(1);
    tenancy()->end();

    // 4. Test logging expenses
    tenancy()->initialize($tenant);
    $category = ExpenseCategory::create(['name' => 'Electricity']);
    tenancy()->end();

    $response4 = $this->actingAs($owner)
        ->post("{$tenantUrl}/expenses", [
            'expense_category_id' => $category->id,
            'amount' => 15.00,
            'ref_number' => 'ELEC-2026',
            'notes' => 'Month utilities',
            'expense_date' => now()->format('Y-m-d'),
        ]);

    $response4->assertRedirect("{$tenantUrl}/financials");

    tenancy()->initialize($tenant);
    expect(Expense::count())->toBe(1);
    tenancy()->end();

    // 5. Test Profit & Loss dashboard summaries
    $response5 = $this->actingAs($owner)
        ->get("{$tenantUrl}/financials");

    $response5->assertStatus(200);
    $response5->assertInertia(fn ($page) => $page
        ->has('plReport')
        ->where('plReport.gross_sales', 60)
        ->where('plReport.total_expenses', 15)
        ->where('plReport.net_income_accrual', 45)
    );

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
