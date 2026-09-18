<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\MembershipPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /**
     * Display a listing of the customers.
     */
    public function index()
    {
        $customers = Customer::all();
        $membershipPlans = MembershipPlan::where('is_active', true)->orderBy('price')->get();

        return Inertia::render('tenant/customers/index', [
            'customers' => $customers,
            'membershipPlans' => $membershipPlans,
        ]);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'mobile' => 'nullable|unique:customers',
            'email' => 'nullable|email',
            'gender' => 'nullable|in:male,female,other',
            'dob' => 'nullable|date',
            'address' => 'nullable',
            'notes' => 'nullable',
            'group' => 'nullable',
            'loyalty_points' => 'nullable|integer',
            'wallet_balance' => 'nullable|numeric',
        ]);

        Customer::create($request->all());

        return redirect()->route('tenant.customers.index', request()->getHost())
            ->with('success', 'Customer created successfully.');
    }

    /**
     * Display the specified customer.
     */
    public function show($tenant, Customer $customer)
    {
        return Inertia::render('tenant/customers/show', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, $tenant, Customer $customer)
    {
        $request->validate([
            'name' => 'required',
            'mobile' => 'nullable|unique:customers,mobile,' . $customer->id,
            'email' => 'nullable|email',
            'gender' => 'nullable|in:male,female,other',
            'dob' => 'nullable|date',
            'address' => 'nullable',
            'notes' => 'nullable',
            'group' => 'nullable',
            'loyalty_points' => 'nullable|integer',
            'wallet_balance' => 'nullable|numeric',
        ]);

        $customer->update($request->all());

        return redirect()->route('tenant.customers.index', request()->getHost())
            ->with('success', 'Customer updated successfully.');
    }

    /**
     * Remove the specified customer.
     */
    public function destroy($tenant, Customer $customer)
    {
        $customer->delete();

        return redirect()->route('tenant.customers.index', request()->getHost())
            ->with('success', 'Customer deleted successfully.');
    }
}
