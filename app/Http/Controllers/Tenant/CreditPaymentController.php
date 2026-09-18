<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CreditPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CreditPaymentController extends Controller
{
    /**
     * Store a collected customer credit payment.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:cash,card,bank',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $customer = Customer::findOrFail($request->customer_id);
            $amount = (float) $request->amount;

            // Log payment
            CreditPayment::create([
                'customer_id' => $customer->id,
                'user_id' => auth()->id(),
                'amount' => $amount,
                'payment_method' => $request->payment_method,
                'notes' => $request->notes,
            ]);

            // Decrement outstanding balance
            $customer->decrement('outstanding_balance', $amount);

            DB::commit();

            return redirect()->route('tenant.financials.index', request()->getHost())
                ->with('success', 'Outstanding balance payment logged successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
