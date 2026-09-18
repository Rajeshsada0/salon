<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePackage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceController extends Controller
{
    /**
     * Display a listing of the services.
     */
    public function index()
    {
        $services = Service::with('serviceCategory')->get();

        $categories = ServiceCategory::orderBy('sort_order')->get();

        $packages = ServicePackage::with('services')->get();

        return Inertia::render('tenant/services/index', [
            'services' => $services,
            'categories' => $categories,
            'packages' => $packages,
        ]);
    }

    /**
     * Store a newly created service.
     */
    public function store(Request $request)
    {
        $request->validate([
            'service_category_id' => 'required|exists:service_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'commission_percentage' => 'nullable|numeric|between:0,100',
            'is_active' => 'nullable|boolean',
        ]);

        Service::create($request->all());

        return redirect()->route('tenant.services.index', request()->getHost())
            ->with('success', 'Service created successfully.');
    }

    /**
     * Update the specified service.
     */
    public function update(Request $request, $tenant, Service $service)
    {
        $request->validate([
            'service_category_id' => 'required|exists:service_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'commission_percentage' => 'nullable|numeric|between:0,100',
            'is_active' => 'nullable|boolean',
        ]);

        $service->update($request->all());

        return redirect()->route('tenant.services.index', request()->getHost())
            ->with('success', 'Service updated successfully.');
    }

    /**
     * Remove the specified service.
     */
    public function destroy($tenant, Service $service)
    {
        $service->delete();

        return redirect()->route('tenant.services.index', request()->getHost())
            ->with('success', 'Service deleted successfully.');
    }
}
