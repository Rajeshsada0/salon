<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * Display the analytics reports.
     */
    public function index(Request $request)
    {
        // Default to last 30 days if no range provided
        $startDate = $request->input('start_date') 
            ? Carbon::parse($request->input('start_date'))->startOfDay() 
            : Carbon::now()->subDays(30)->startOfDay();
            
        $endDate = $request->input('end_date') 
            ? Carbon::parse($request->input('end_date'))->endOfDay() 
            : Carbon::now()->endOfDay();

        // 1. Total Revenue in period
        $totalRevenue = Invoice::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'paid')
            ->sum('total_amount');

        // 2. Revenue Breakdown by Payment Method
        $revenueByMethod = Invoice::select('payment_method', DB::raw('SUM(total_amount) as total'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'paid')
            ->groupBy('payment_method')
            ->get();

        // 3. Top Performing Staff
        // Staff revenue is derived from completed appointments connected to invoices
        $staffPerformance = Appointment::with('staff')
            ->join('invoices', 'appointments.id', '=', 'invoices.appointment_id')
            ->whereBetween('invoices.created_at', [$startDate, $endDate])
            ->where('invoices.status', 'paid')
            ->select('appointments.staff_id', DB::raw('SUM(invoices.total_amount) as total_revenue'), DB::raw('COUNT(appointments.id) as total_appointments'))
            ->groupBy('appointments.staff_id')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(function ($apt) {
                return [
                    'staff_name' => $apt->staff ? $apt->staff->name : 'Unknown',
                    'revenue' => $apt->total_revenue,
                    'appointments' => $apt->total_appointments,
                ];
            });

        // 4. Popular Services
        $popularServices = InvoiceItem::join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->whereBetween('invoices.created_at', [$startDate, $endDate])
            ->where('invoices.status', 'paid')
            ->select('invoice_items.item_name', DB::raw('COUNT(invoice_items.id) as times_booked'), DB::raw('SUM(invoice_items.total) as revenue_generated'))
            ->groupBy('invoice_items.item_name')
            ->orderByDesc('times_booked')
            ->limit(5)
            ->get();

        return Inertia::render('tenant/reports/index', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'metrics' => [
                'total_revenue' => $totalRevenue,
                'revenue_by_method' => $revenueByMethod,
                'staff_performance' => $staffPerformance,
                'popular_services' => $popularServices,
            ],
        ]);
    }
}
