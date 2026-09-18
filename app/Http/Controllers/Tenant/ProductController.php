<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\InventoryLog;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Display a listing of products, categories, brands, and logs.
     */
    public function index()
    {
        $products = Product::with(['category', 'brand'])
            ->orderBy('name')
            ->get();

        $categories = ProductCategory::withCount('products')
            ->orderBy('name')
            ->get();

        $brands = Brand::withCount('products')
            ->orderBy('name')
            ->get();

        $inventoryLogs = InventoryLog::with(['product', 'user'])
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        return Inertia::render('tenant/inventory/index', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'inventoryLogs' => $inventoryLogs,
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'product_category_id' => 'nullable|exists:product_categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'description' => 'nullable|string',
            'sku' => 'nullable|string|unique:products,sku',
            'cost_price' => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
            'stock_quantity' => 'nullable|integer|min:0',
            'alert_quantity' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $data = $request->all();
        $data['stock_quantity'] = $request->input('stock_quantity', 0);
        $data['alert_quantity'] = $request->input('alert_quantity', 5);
        $data['is_active'] = $request->input('is_active', true);

        $product = Product::create($data);

        // Audit log if initial stock > 0
        if ($product->stock_quantity > 0) {
            $product->logs()->create([
                'user_id' => auth()->id(),
                'quantity' => $product->stock_quantity,
                'type' => 'stock_in',
                'notes' => 'Initial stock on product registration.',
            ]);
        }

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Product registered successfully.');
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, $tenant, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'product_category_id' => 'nullable|exists:product_categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'description' => 'nullable|string',
            'sku' => 'nullable|string|unique:products,sku,' . $product->id,
            'cost_price' => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
            'alert_quantity' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $product->update($request->all());

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified product.
     */
    public function destroy($tenant, Product $product)
    {
        $product->delete();

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Product deleted successfully.');
    }
}
