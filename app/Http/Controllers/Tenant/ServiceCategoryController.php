<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ServiceCategory;
use Illuminate\Http\Request;

class ServiceCategoryController extends Controller
{
    /**
     * Display a listing of the service categories.
     */
    public function index()
    {
        $categories = ServiceCategory::withCount('services')
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }

    /**
     * Store a newly created service category.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        ServiceCategory::create($request->all());

        return redirect()->route('tenant.services.index', request()->getHost())
            ->with('success', 'Service category created successfully.');
    }

    /**
     * Update the specified service category.
     */
    public function update(Request $request, $tenant, ServiceCategory $serviceCategory)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $serviceCategory->update($request->all());

        return redirect()->route('tenant.services.index', request()->getHost())
            ->with('success', 'Service category updated successfully.');
    }

    /**
     * Remove the specified service category.
     */
    public function destroy($tenant, ServiceCategory $serviceCategory)
    {
        $serviceCategory->delete();

        return redirect()->route('tenant.services.index', request()->getHost())
            ->with('success', 'Service category deleted successfully.');
    }
}
