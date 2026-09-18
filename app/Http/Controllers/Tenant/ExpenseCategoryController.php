<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    /**
     * Display a listing of expense categories.
     */
    public function index()
    {
        $categories = ExpenseCategory::withCount('expenses')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Store a newly created expense category.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        ExpenseCategory::create($request->all());

        return redirect()->route('tenant.financials.index', request()->getHost())
            ->with('success', 'Expense category created successfully.');
    }

    /**
     * Update the specified expense category.
     */
    public function update(Request $request, $tenant, ExpenseCategory $expenseCategory)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $expenseCategory->update($request->all());

        return redirect()->route('tenant.financials.index', request()->getHost())
            ->with('success', 'Expense category updated successfully.');
    }

    /**
     * Remove the specified expense category.
     */
    public function destroy($tenant, ExpenseCategory $expenseCategory)
    {
        $expenseCategory->delete();

        return redirect()->route('tenant.financials.index', request()->getHost())
            ->with('success', 'Expense category deleted successfully.');
    }
}
