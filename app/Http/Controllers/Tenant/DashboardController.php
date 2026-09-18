<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the tenant dashboard with real-time metrics.
     */
    public function index()
    {
        $today = Carbon::today();

        // Metric 1: Active Staff
        // Assuming anyone with the 'Stylist' or 'Beautician' role, or just count all non-customer users
        $staffCount = User::count();

        // Metric 2: Today's Bookings
        $todaysAppointments = Appointment::whereDate('date', $today)->get();
        $totalBookingsToday = $todaysAppointments->count();
        $pendingBookingsToday = $todaysAppointments->where('status', 'pending')->count();

        // Metric 3: Daily Revenue
        $dailyRevenue = Invoice::whereDate('created_at', $today)
            ->where('status', 'paid')
            ->sum('total_amount');

        // Metric 4: Customers / Loyalty Members
        $totalCustomers = Customer::count();
        $newCustomersToday = Customer::whereDate('created_at', $today)->count();

        // Load today's schedule for the scheduler widget
        $recentAppointments = Appointment::with(['customer', 'services', 'staff'])
            ->whereDate('date', $today)
            ->orderBy('start_time', 'asc')
            ->take(5)
            ->get();

        // Load recent activity/invoices
        $recentInvoices = Invoice::with('customer')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return Inertia::render('tenant/dashboard', [
            'metrics' => [
                'staffCount' => $staffCount,
                'bookings' => [
                    'total' => $totalBookingsToday,
                    'pending' => $pendingBookingsToday,
                ],
                'revenue' => [
                    'daily' => $dailyRevenue,
                ],
                'customers' => [
                    'total' => $totalCustomers,
                    'newToday' => $newCustomersToday,
                ],
            ],
            'recentAppointments' => $recentAppointments,
            'recentInvoices' => $recentInvoices,
        ]);
    }
}
