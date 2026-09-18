<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    /**
     * Display a listing of the product categories.
     */
    public function index()
    {
        $categories = ProductCategory::withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Store a newly created product category.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        ProductCategory::create($request->all());

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Product category created successfully.');
    }

    /**
     * Update the specified product category.
     */
    public function update(Request $request, $tenant, ProductCategory $productCategory)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $productCategory->update($request->all());

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Product category updated successfully.');
    }

    /**
     * Remove the specified product category.
     */
    public function destroy($tenant, ProductCategory $productCategory)
    {
        $productCategory->delete();

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Product category deleted successfully.');
    }
}
