<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerMembership;
use App\Models\MembershipPlan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerMembershipController extends Controller
{
    /**
     * Assign a membership plan to a customer.
     */
    public function assign(Request $request, $tenant, Customer $customer)
    {
        $request->validate([
            'membership_plan_id' => 'required|exists:membership_plans,id',
        ]);

        DB::beginTransaction();

        try {
            $plan = MembershipPlan::findOrFail($request->membership_plan_id);

            // Cancel any existing active membership
            $customer->memberships()
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            $startedAt = Carbon::today();
            $expiresAt = $startedAt->copy()->addMonths($plan->duration_months);

            // Create new membership
            CustomerMembership::create([
                'customer_id' => $customer->id,
                'membership_plan_id' => $plan->id,
                'started_at' => $startedAt->toDateString(),
                'expires_at' => $expiresAt->toDateString(),
                'status' => 'active',
            ]);

            // Award bonus loyalty points if any
            if ($plan->loyalty_points_bonus > 0) {
                $customer->increment('loyalty_points', $plan->loyalty_points_bonus);
            }

            DB::commit();

            return redirect()->back()
                ->with('success', "Membership plan '{$plan->name}' assigned to {$customer->name}.");

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cancel a specific customer membership.
     */
    public function cancel(Request $request, $tenant, CustomerMembership $customerMembership)
    {
        $customerMembership->update(['status' => 'cancelled']);

        return redirect()->back()
            ->with('success', 'Membership cancelled successfully.');
    }
}
