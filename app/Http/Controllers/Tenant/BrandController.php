<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    /**
     * Display a listing of the brands.
     */
    public function index()
    {
        $brands = Brand::withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json($brands);
    }

    /**
     * Store a newly created brand.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Brand::create($request->all());

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Brand created successfully.');
    }

    /**
     * Update the specified brand.
     */
    public function update(Request $request, $tenant, Brand $brand)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $brand->update($request->all());

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Brand updated successfully.');
    }

    /**
     * Remove the specified brand.
     */
    public function destroy($tenant, Brand $brand)
    {
        $brand->delete();

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Brand deleted successfully.');
    }
}
