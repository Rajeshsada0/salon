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

    /**
     * Export Financials & Ledger data as a CSV file.
     */
    public function export(Request $request)
    {
        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->startOfMonth()->startOfDay();

        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();

        $grossSales = Invoice::whereBetween('created_at', [$startDate, $endDate])->sum('total_amount');
        $cashSales = Invoice::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_method', '!=', 'credit')
            ->sum('total_amount');
        $collectedCredits = CreditPayment::whereBetween('created_at', [$startDate, $endDate])->sum('amount');
        $grossCashInflow = $cashSales + $collectedCredits;
        $totalExpenses = Expense::whereBetween('expense_date', [$startDate, $endDate])->sum('amount');

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

        $netIncomeAccrual = max(-999999, $grossSales - $totalExpenses - $totalCommissions);
        $netCashFlow = max(-999999, $grossCashInflow - $totalExpenses - $totalCommissions);

        $filename = 'financial-report-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use (
            $startDate, $endDate, $grossSales, $cashSales, $collectedCredits,
            $grossCashInflow, $totalExpenses, $totalCommissions, $netIncomeAccrual, $netCashFlow
        ) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['AURA SALON SUITE - FINANCIAL REPORT & LEDGER']);
            fputcsv($handle, ['Period:', $startDate->format('Y-m-d') . ' to ' . $endDate->format('Y-m-d')]);
            fputcsv($handle, []);

            // P&L Summary
            fputcsv($handle, ['--- PROFIT & LOSS SUMMARY ---']);
            fputcsv($handle, ['Metric', 'Amount ($)']);
            fputcsv($handle, ['Gross Sales (Accrual)', number_format($grossSales, 2, '.', '')]);
            fputcsv($handle, ['Cash Sales (POS Inflow)', number_format($cashSales, 2, '.', '')]);
            fputcsv($handle, ['Collected Credit Payments', number_format($collectedCredits, 2, '.', '')]);
            fputcsv($handle, ['Gross Cash Inflow', number_format($grossCashInflow, 2, '.', '')]);
            fputcsv($handle, ['Total Expenses', number_format($totalExpenses, 2, '.', '')]);
            fputcsv($handle, ['Staff Commissions', number_format($totalCommissions, 2, '.', '')]);
            fputcsv($handle, ['Net Income (Accrual)', number_format($netIncomeAccrual, 2, '.', '')]);
            fputcsv($handle, ['Net Cash Flow', number_format($netCashFlow, 2, '.', '')]);
            fputcsv($handle, []);

            // Expenses Breakdown
            fputcsv($handle, ['--- EXPENSES IN PERIOD ---']);
            fputcsv($handle, ['Date', 'Category', 'Reference #', 'Logged By', 'Amount ($)', 'Notes']);
            $periodExpenses = Expense::with(['category', 'user'])
                ->whereBetween('expense_date', [$startDate, $endDate])
                ->orderBy('expense_date', 'desc')
                ->get();
            foreach ($periodExpenses as $exp) {
                fputcsv($handle, [
                    $exp->expense_date ? $exp->expense_date->format('Y-m-d') : '',
                    $exp->category ? $exp->category->name : 'Uncategorized',
                    $exp->ref_number ?? 'N/A',
                    $exp->user ? $exp->user->name : 'System',
                    number_format((float) $exp->amount, 2, '.', ''),
                    $exp->notes ?? '',
                ]);
            }
            fputcsv($handle, []);

            // Credit Collections
            fputcsv($handle, ['--- CREDIT COLLECTIONS IN PERIOD ---']);
            fputcsv($handle, ['Date', 'Customer', 'Received By', 'Method', 'Amount ($)', 'Notes']);
            $periodCredits = CreditPayment::with(['customer', 'user'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'desc')
                ->get();
            foreach ($periodCredits as $cp) {
                fputcsv($handle, [
                    $cp->created_at->format('Y-m-d H:i'),
                    $cp->customer ? $cp->customer->name : 'N/A',
                    $cp->user ? $cp->user->name : 'Staff',
                    $cp->payment_method,
                    number_format((float) $cp->amount, 2, '.', ''),
                    $cp->notes ?? '',
                ]);
            }
            fputcsv($handle, []);

            // Outstanding Dues
            fputcsv($handle, ['--- CURRENT OUTSTANDING DUES ---']);
            fputcsv($handle, ['Customer', 'Mobile', 'Credit Limit ($)', 'Outstanding Balance ($)']);
            $dues = Customer::where('outstanding_balance', '>', 0)->get();
            foreach ($dues as $c) {
                fputcsv($handle, [
                    $c->name,
                    $c->mobile ?? '',
                    number_format((float) $c->credit_limit, 2, '.', ''),
                    number_format((float) $c->outstanding_balance, 2, '.', ''),
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
