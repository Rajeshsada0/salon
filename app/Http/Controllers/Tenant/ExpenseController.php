<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * Store a newly created expense.
     */
    public function store(Request $request)
    {
        $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'ref_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'expense_date' => 'required|date',
        ]);

        $data = $request->all();
        $data['user_id'] = auth()->id();

        Expense::create($data);

        return redirect()->route('tenant.financials.index', request()->getHost())
            ->with('success', 'Expense logged successfully.');
    }

    /**
     * Update the specified expense in storage.
     */
    public function update(Request $request, $tenant, Expense $expense)
    {
        $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'ref_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'expense_date' => 'required|date',
        ]);

        $expense->update($request->all());

        return redirect()->route('tenant.financials.index', request()->getHost())
            ->with('success', 'Expense updated successfully.');
    }

    /**
     * Remove the specified expense from storage.
     */
    public function destroy($tenant, Expense $expense)
    {
        $expense->delete();

        return redirect()->route('tenant.financials.index', request()->getHost())
            ->with('success', 'Expense deleted successfully.');
    }
}
