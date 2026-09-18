<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Service;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AppointmentApiController extends Controller
{
    /**
     * Display a listing of appointments.
     */
    public function index(Request $request)
    {
        $appointments = Appointment::with(['customer', 'staff', 'services'])
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->paginate(15);

        return response()->json(['appointments' => $appointments]);
    }

    /**
     * Store a newly created appointment via mobile app.
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
        ]);

        $services = Service::whereIn('id', $request->services)->get();
        
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
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startStr);
            })->exists();

        if ($overlap) {
            return response()->json([
                'message' => 'The selected staff member is not available at this time.'
            ], 422);
        }

        $appointment = Appointment::create([
            'customer_id' => $request->customer_id,
            'staff_id' => $request->staff_id,
            'date' => $request->date,
            'start_time' => $startTime->format('H:i:s'),
            'end_time' => $endTime,
            'total_amount' => $totalAmount,
            'notes' => $request->notes ?? null,
            'status' => 'pending',
        ]);

        $syncData = [];
        foreach ($services as $service) {
            $syncData[$service->id] = ['price' => $service->price];
        }
        $appointment->services()->sync($syncData);

        return response()->json(['appointment' => $appointment->load('services')], 201);
    }

    /**
     * Cancel an appointment.
     */
    public function cancel(Request $request, $tenant, Appointment $appointment)
    {
        $appointment->update(['status' => 'cancelled']);

        return response()->json(['appointment' => $appointment]);
    }

    /**
     * Get available time slots for a given date and staff member.
     */
    public function availableTimeSlots(Request $request)
    {
        $request->validate([
            'staff_id' => 'required|exists:users,id',
            'date' => 'required|date',
        ]);

        // Basic implementation: returning a fixed array of slots for now
        // A complete implementation would subtract booked slots from business hours
        $slots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

        return response()->json(['slots' => $slots]);
    }
}
