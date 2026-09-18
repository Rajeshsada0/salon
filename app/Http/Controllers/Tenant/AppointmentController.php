<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments for a specific date.
     */
    public function index(Request $request)
    {
        $date = $request->input('date', date('Y-m-d'));

        $appointments = Appointment::with(['customer', 'staff', 'services'])
            ->whereDate('date', $date)
            ->orderBy('start_time')
            ->get();

        return Inertia::render('tenant/appointments/index', [
            'appointments' => $appointments,
            'currentDate' => $date,
        ]);
    }

    /**
     * Show the form for creating a new appointment.
     */
    public function create()
    {
        $customers = Customer::orderBy('name')->get();
        // Assuming all users in tenant DB are staff
        $staff = User::role(['Salon Owner', 'Branch Manager', 'Stylist', 'Beautician'])->get();
        // Fallback if roles aren't perfectly seeded for the test
        if ($staff->isEmpty()) {
            $staff = User::all();
        }
        $services = Service::where('is_active', true)->get();

        return Inertia::render('tenant/appointments/create', [
            'customers' => $customers,
            'staff' => $staff,
            'services' => $services,
        ]);
    }

    /**
     * Store a newly created appointment.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'staff_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'services' => 'required|array|min:1',
            'services.*' => 'exists:services,id',
            'notes' => 'nullable|string',
        ]);

        $services = Service::whereIn('id', $request->services)->get();
        
        // Calculate duration and total
        $totalDuration = $services->sum('duration_minutes');
        $totalAmount = $services->sum('price');
        
        $startTime = Carbon::createFromFormat('H:i', $request->start_time);
        $endTime = $startTime->copy()->addMinutes($totalDuration)->format('H:i:s');
        
        // Overlap Check
        $overlap = Appointment::where('staff_id', $request->staff_id)
            ->whereDate('date', $request->date)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->where(function($query) use ($startTime, $endTime) {
                $startStr = $startTime->format('H:i:s');
                // New appointment overlaps if:
                // Existing starts before new ends AND existing ends after new starts
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startStr);
            })->exists();

        if ($overlap) {
            throw ValidationException::withMessages([
                'overlap' => ['The selected staff member already has an appointment during this time slot.'],
            ]);
        }

        $appointment = Appointment::create([
            'customer_id' => $request->customer_id,
            'staff_id' => $request->staff_id,
            'date' => $request->date,
            'start_time' => $startTime->format('H:i:s'),
            'end_time' => $endTime,
            'total_amount' => $totalAmount,
            'notes' => $request->notes,
            'status' => 'pending',
        ]);

        // Sync pivot with prices
        $syncData = [];
        foreach ($services as $service) {
            $syncData[$service->id] = ['price' => $service->price];
        }
        $appointment->services()->sync($syncData);

        return redirect()->route('tenant.appointments.index', ['tenant' => request()->getHost(), 'date' => $request->date])
            ->with('success', 'Appointment created successfully.');
    }

    /**
     * Display the specified appointment.
     */
    public function show($tenant, Appointment $appointment)
    {
        $appointment->load(['customer', 'staff', 'services']);

        return Inertia::render('tenant/appointments/show', [
            'appointment' => $appointment,
        ]);
    }

    /**
     * Update the appointment status.
     */
    public function updateStatus(Request $request, $tenant, Appointment $appointment)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,in_progress,completed,cancelled,no_show',
        ]);

        $appointment->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Appointment status updated.');
    }

    /**
     * Remove the specified appointment.
     */
    public function destroy($tenant, Appointment $appointment)
    {
        $appointment->delete();

        return redirect()->route('tenant.appointments.index', request()->getHost())
            ->with('success', 'Appointment deleted successfully.');
    }
}
