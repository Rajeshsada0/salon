<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use App\Models\ServiceCategory;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\ProductCategory;
use App\Models\Brand;
use App\Models\Product;
use App\Models\InventoryLog;
use App\Models\Invoice;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

test('tenant inventory operations and mixed POS checkout work', function () {
    $tenantId = 'inventory-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);

    tenancy()->initialize($tenant);

    $owner = User::where('email', 'owner@salon.com')->first();

    tenancy()->end();

    // 1. Create Category
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/product-categories", [
            'name' => 'Hair Gels',
            'description' => 'Styling hold products',
        ]);

    $response->assertRedirect("http://{$tenantId}.localhost/inventory");

    tenancy()->initialize($tenant);
    $category = ProductCategory::where('name', 'Hair Gels')->first();
    expect($category)->not->toBeNull();
    expect($category->description)->toBe('Styling hold products');
    tenancy()->end();

    // 2. Create Brand
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/brands", [
            'name' => 'L\'Oreal Professional',
            'description' => 'Salon brand L\'Oreal',
        ]);

    $response->assertRedirect("http://{$tenantId}.localhost/inventory");

    tenancy()->initialize($tenant);
    $brand = Brand::where('name', 'L\'Oreal Professional')->first();
    expect($brand)->not->toBeNull();
    tenancy()->end();

    // 3. Create Product with initial stock
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/inventory", [
            'name' => 'Extreme Gel 150ml',
            'product_category_id' => $category->id,
            'brand_id' => $brand->id,
            'sku' => 'GEL150',
            'cost_price' => '10.00',
            'retail_price' => '20.00',
            'stock_quantity' => '10',
            'alert_quantity' => '3',
            'is_active' => true,
        ]);

    $response->assertRedirect("http://{$tenantId}.localhost/inventory");

    tenancy()->initialize($tenant);
    $product = Product::where('sku', 'GEL150')->first();
    expect($product)->not->toBeNull();
    expect($product->stock_quantity)->toBe(10);
    expect($product->alert_quantity)->toBe(3);

    // Verify initial stock log
    $log = InventoryLog::where('product_id', $product->id)->first();
    expect($log)->not->toBeNull();
    expect($log->quantity)->toBe(10);
    expect($log->type)->toBe('stock_in');
    tenancy()->end();

    // 4. Update Product
    $response = $this->actingAs($owner)
        ->put("http://{$tenantId}.localhost/inventory/{$product->id}", [
            'name' => 'Extreme Gel 150ml Gold Edition',
            'product_category_id' => $category->id,
            'brand_id' => $brand->id,
            'sku' => 'GEL150',
            'cost_price' => '12.00',
            'retail_price' => '24.00',
            'alert_quantity' => '2',
            'is_active' => true,
        ]);

    $response->assertRedirect("http://{$tenantId}.localhost/inventory");

    tenancy()->initialize($tenant);
    $product->refresh();
    expect($product->retail_price)->toBe('24.00');
    expect($product->alert_quantity)->toBe(2);
    tenancy()->end();

    // 5. Adjust Stock Manual Audit (Overwrite to 15)
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/inventory/{$product->id}/adjust", [
            'quantity' => '15',
            'type' => 'adjustment',
            'notes' => 'Manual audit correction',
        ]);

    $response->assertRedirect("http://{$tenantId}.localhost/inventory");

    tenancy()->initialize($tenant);
    $product->refresh();
    expect($product->stock_quantity)->toBe(15);
    // Log change was +5
    $latestLog = InventoryLog::orderBy('id', 'desc')->first();
    expect($latestLog->quantity)->toBe(5);
    expect($latestLog->type)->toBe('adjustment');
    tenancy()->end();

    // 6. Test mixed POS Checkout decrementing stock
    tenancy()->initialize($tenant);
    // Create customer, service, appointment
    $customer = Customer::create([
        'name' => 'Client Inventory',
        'mobile' => '+15551112222',
        'wallet_balance' => 0.00,
        'loyalty_points' => 0,
    ]);
    $serviceCategory = ServiceCategory::create(['name' => 'Hair', 'sort_order' => 1]);
    $service = Service::create([
        'service_category_id' => $serviceCategory->id,
        'name' => 'Trim',
        'price' => 30.00,
        'duration_minutes' => 30,
    ]);
    $appointment = Appointment::create([
        'customer_id' => $customer->id,
        'staff_id' => $owner->id,
        'date' => date('Y-m-d'),
        'start_time' => '14:00:00',
        'end_time' => '14:30:00',
        'total_amount' => 30.00,
        'status' => 'confirmed',
    ]);
    $appointment->services()->attach($service->id, ['price' => 30.00]);
    tenancy()->end();

    // Checkout service (30) + 2x products (2x 24 = 48) -> subtotal = 78
    $response = $this->actingAs($owner)
        ->post("http://{$tenantId}.localhost/pos/checkout/{$appointment->id}", [
            'discount_amount' => 8.00, // total = 70.00
            'tax_amount' => 7.00,      // grand total = 77.00
            'payment_method' => 'cash',
            'products' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                ]
            ],
            'notes' => 'POS mixed checkout sales',
        ]);

    tenancy()->initialize($tenant);
    $invoice = Invoice::with('items')->latest()->first();
    expect($invoice)->not->toBeNull();
    // Subtotal = 30 (service) + 48 (product) = 78
    expect((float) $invoice->subtotal)->toBe(78.00);
    expect((float) $invoice->total_amount)->toBe(77.00);

    // Verify invoice items count (1 service + 1 product)
    expect($invoice->items->count())->toBe(2);

    $productItem = $invoice->items->where('product_id', $product->id)->first();
    expect($productItem)->not->toBeNull();
    expect($productItem->quantity)->toBe(2);
    expect((float) $productItem->total)->toBe(48.00);

    // Verify stock decrement (15 - 2 = 13)
    $product->refresh();
    expect($product->stock_quantity)->toBe(13);

    // Verify stock_out log was created
    $outLog = InventoryLog::orderBy('id', 'desc')->first();
    expect($outLog->product_id)->toBe($product->id);
    expect($outLog->quantity)->toBe(-2);
    expect($outLog->type)->toBe('stock_out');

    tenancy()->end();

    // Cleanup
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
