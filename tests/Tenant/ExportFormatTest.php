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

test('invoice pdf download and reports csv exports work end-to-end', function () {
    $tenantId = 'export-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $tenantUrl = "http://{$tenantId}.localhost";
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);
    tenancy()->initialize($tenant);

    $owner = User::where('email', 'owner@salon.com')->first();

    $customer = Customer::create([
        'name' => 'Alice Wonder',
        'mobile' => '7777777',
        'wallet_balance' => 50.00,
        'credit_limit' => 300.00,
        'outstanding_balance' => 50.00,
    ]);

    $category = ServiceCategory::create(['name' => 'Hair Styling', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $category->id,
        'name' => 'Deluxe Blowdry',
        'price' => 75.00,
        'duration_minutes' => 45,
    ]);

    $appointment = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => now()->format('Y-m-d'),
        'start_time' => '14:00:00',
        'end_time' => '15:00:00',
        'status' => 'completed',
    ]);
    $appointment->services()->attach($service->id, ['price' => 75.00]);

    // Create Invoice with items & payments
    $invoice = Invoice::create([
        'appointment_id' => $appointment->id,
        'customer_id' => $customer->id,
        'invoice_number' => 'INV-TEST999',
        'subtotal' => 75.00,
        'discount_amount' => 5.00,
        'tax_amount' => 3.50,
        'total_amount' => 73.50,
        'paid_amount' => 73.50,
        'due_amount' => 0.00,
        'payment_method' => 'card',
        'status' => 'paid',
        'notes' => 'Customer was thrilled with the service.',
    ]);

    $invoice->items()->create([
        'service_id' => $service->id,
        'item_name' => $service->name,
        'unit_price' => 75.00,
        'quantity' => 1,
        'total' => 75.00,
    ]);

    $invoice->payments()->create([
        'payment_method' => 'card',
        'amount' => 73.50,
    ]);

    // Create Expense Category and Expense
    $expCat = ExpenseCategory::create([
        'name' => 'Salon Supplies',
        'description' => 'Shampoos and conditioners',
    ]);

    Expense::create([
        'expense_category_id' => $expCat->id,
        'user_id' => $owner->id,
        'ref_number' => 'REF-EXP-001',
        'amount' => 120.00,
        'expense_date' => now()->toDateString(),
        'notes' => 'Organic Conditioner Stock restock for stylists',
    ]);

    // Create Credit Payment
    CreditPayment::create([
        'customer_id' => $customer->id,
        'user_id' => $owner->id,
        'amount' => 25.00,
        'payment_method' => 'cash',
        'notes' => 'Partial dues clearance',
    ]);

    tenancy()->end();

    // ─── Test 1: Download Invoice PDF ──────────────────────────────────────────
    $pdfResponse = $this->actingAs($owner)
        ->get("{$tenantUrl}/invoices/{$invoice->id}/pdf");

    $pdfResponse->assertStatus(200);
    $pdfResponse->assertHeader('content-type', 'application/pdf');
    expect($pdfResponse->headers->get('content-disposition'))->toContain('invoice-INV-TEST999.pdf');
    
    // Check that binary content starts with PDF magic header
    $content = $pdfResponse->getContent();
    expect(str_starts_with($content, '%PDF-'))->toBeTrue();

    // ─── Test 2: Financials CSV Export ─────────────────────────────────────────
    $startDate = now()->startOfMonth()->format('Y-m-d');
    $endDate = now()->endOfMonth()->format('Y-m-d');

    $finResponse = $this->actingAs($owner)
        ->get("{$tenantUrl}/financials/export?start_date={$startDate}&end_date={$endDate}");

    $finResponse->assertStatus(200);
    expect($finResponse->headers->get('content-type'))->toContain('text/csv');
    expect($finResponse->headers->get('content-disposition'))->toContain('financial-report-');

    $finCsv = $finResponse->streamedContent();
    expect($finCsv)->toContain('AURA SALON SUITE - FINANCIAL REPORT & LEDGER');
    expect($finCsv)->toContain('--- PROFIT & LOSS SUMMARY ---');
    expect($finCsv)->toContain('Gross Sales (Accrual)');
    expect($finCsv)->toContain('Organic Conditioner Stock');
    expect($finCsv)->toContain('Alice Wonder');

    // ─── Test 3: Analytics Reports CSV Export ──────────────────────────────────
    $repResponse = $this->actingAs($owner)
        ->get("{$tenantUrl}/reports/export?start_date={$startDate}&end_date={$endDate}");

    $repResponse->assertStatus(200);
    expect($repResponse->headers->get('content-type'))->toContain('text/csv');
    expect($repResponse->headers->get('content-disposition'))->toContain('analytics-report-');

    $repCsv = $repResponse->streamedContent();
    expect($repCsv)->toContain('AURA SALON SUITE - ANALYTICS REPORT');
    expect($repCsv)->toContain('--- REVENUE BY PAYMENT METHOD ---');
    expect($repCsv)->toContain('--- STAFF PERFORMANCE ---');
    expect($repCsv)->toContain('--- SERVICES BOOKED RANKING ---');
    expect($repCsv)->toContain('Deluxe Blowdry');

    // Cleanup
    tenancy()->end();
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
