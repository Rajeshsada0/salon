<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ServicePackage;
use Illuminate\Http\Request;

class ServicePackageController extends Controller
{
    /**
     * Display a listing of the service packages.
     */
    public function index()
    {
        $packages = ServicePackage::with('services')->get();

        return response()->json($packages);
    }

    /**
     * Store a newly created service package.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable',
            'price' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'services' => 'required|array',
            'services.*' => 'exists:services,id',
        ]);

        $package = ServicePackage::create($request->except('services'));
        $package->services()->sync($request->services);

        return redirect()->route('tenant.services.index', request()->getHost())
            ->with('success', 'Service package created successfully.');
    }

    /**
     * Update the specified service package.
     */
    public function update(Request $request, $tenant, ServicePackage $servicePackage)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable',
            'price' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'services' => 'required|array',
            'services.*' => 'exists:services,id',
        ]);

        $servicePackage->update($request->except('services'));
        $servicePackage->services()->sync($request->services);

        return redirect()->route('tenant.services.index', request()->getHost())
            ->with('success', 'Service package updated successfully.');
    }

    /**
     * Remove the specified service package.
     */
    public function destroy($tenant, ServicePackage $servicePackage)
    {
        $servicePackage->delete();

        return redirect()->route('tenant.services.index', request()->getHost())
            ->with('success', 'Service package deleted successfully.');
    }
}
