<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\MembershipPlan;
use App\Models\CustomerMembership;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MembershipPlanController extends Controller
{
    /**
     * Display all membership plans with subscriber counts.
     */
    public function index()
    {
        $plans = MembershipPlan::withCount(['customerMemberships as active_subscribers_count' => function ($q) {
            $q->where('status', 'active')->where('expires_at', '>=', now()->toDateString());
        }])
        ->orderBy('price')
        ->get();

        $activeSubscriptions = CustomerMembership::with(['customer', 'plan'])
            ->where('status', 'active')
            ->where('expires_at', '>=', now()->toDateString())
            ->orderBy('expires_at')
            ->get();

        return Inertia::render('tenant/memberships/index', [
            'plans' => $plans,
            'activeSubscriptions' => $activeSubscriptions,
        ]);
    }

    /**
     * Store a newly created membership plan.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration_months' => 'required|integer|min:1',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'loyalty_points_bonus' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        MembershipPlan::create($request->all());

        return redirect()->route('tenant.memberships.index', request()->getHost())
            ->with('success', 'Membership plan created successfully.');
    }

    /**
     * Update the specified membership plan.
     */
    public function update(Request $request, $tenant, MembershipPlan $membershipPlan)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration_months' => 'required|integer|min:1',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'loyalty_points_bonus' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $membershipPlan->update($request->all());

        return redirect()->route('tenant.memberships.index', request()->getHost())
            ->with('success', 'Membership plan updated successfully.');
    }

    /**
     * Remove the specified membership plan.
     */
    public function destroy($tenant, MembershipPlan $membershipPlan)
    {
        // Cancel all active subscriptions first
        $membershipPlan->customerMemberships()->update(['status' => 'cancelled']);
        $membershipPlan->delete();

        return redirect()->route('tenant.memberships.index', request()->getHost())
            ->with('success', 'Membership plan deleted.');
    }
}
