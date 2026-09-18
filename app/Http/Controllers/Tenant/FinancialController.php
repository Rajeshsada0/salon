<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CreditPayment;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinancialController extends Controller
{
    /**
     * Display the financials dashboard view.
     */
    public function index(Request $request)
    {
        // Date filters for P&L reporting
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfMonth()->startOfDay();

        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();

        // 1. Load Expenses
        $expenses = Expense::with(['category', 'user'])
            ->orderBy('expense_date', 'desc')
            ->get();

        $expenseCategories = ExpenseCategory::withCount('expenses')
            ->orderBy('name')
            ->get();

        // 2. Load Outstanding Credits & Collected Payments
        $outstandingCustomers = Customer::where('outstanding_balance', '>', 0)
            ->orderBy('outstanding_balance', 'desc')
            ->get();

        $creditPayments = CreditPayment::with(['customer', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();

        // 3. Profit & Loss Calculations
        // Gross sales is total amount of all invoices generated in the period
        $grossSales = Invoice::whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');

        // Cash collections from POS (non-credit checkouts)
        $cashSales = Invoice::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_method', '!=', 'credit')
            ->sum('total_amount');

        // Collected credit payments in this period
        $collectedCredits = CreditPayment::whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        // Total cash inflow = Cash POS Sales + Collected Debt
        $grossCashInflow = $cashSales + $collectedCredits;

        // Total Period Expenses
        $totalExpenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        // Total Stylist Commissions in period
        // Calculate based on completed appointments
        $appointments = Appointment::with(['staff', 'services'])
            ->join('invoices', 'appointments.id', '=', 'invoices.appointment_id')
            ->whereBetween('invoices.created_at', [$startDate, $endDate])
            ->where('invoices.status', 'paid')
            ->select('appointments.*')
            ->get();

        $totalCommissions = 0.00;
        foreach ($appointments as $apt) {
            $staff = $apt->staff;
            if ($staff && $staff->commission_percentage > 0) {
                $servicesSum = $apt->services->sum('pivot.price');
                $totalCommissions += $servicesSum * ($staff->commission_percentage / 100);
            }
        }

        // Net income calculations
        $netIncomeAccrual = max(-999999, $grossSales - $totalExpenses - $totalCommissions);
        $netCashFlow = max(-999999, $grossCashInflow - $totalExpenses - $totalCommissions);

        return Inertia::render('tenant/financials/index', [
            'expenses' => $expenses,
            'expenseCategories' => $expenseCategories,
            'outstandingCustomers' => $outstandingCustomers,
            'creditPayments' => $creditPayments,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'plReport' => [
                'gross_sales' => (float) $grossSales,
                'cash_sales' => (float) $cashSales,
                'collected_credits' => (float) $collectedCredits,
                'gross_cash_inflow' => (float) $grossCashInflow,
                'total_expenses' => (float) $totalExpenses,
                'total_commissions' => (float) $totalCommissions,
                'net_income_accrual' => (float) $netIncomeAccrual,
                'net_cash_flow' => (float) $netCashFlow,
            ],
        ]);
    }
}
