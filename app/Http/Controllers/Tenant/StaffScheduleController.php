<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\StaffSchedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StaffScheduleController extends Controller
{
    /**
     * Display the weekly schedule editor for all staff.
     */
    public function index()
    {
        $staff = User::role(['Salon Owner', 'Branch Manager', 'Receptionist', 'Stylist', 'Beautician', 'Accountant'])
            ->with('schedule')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('tenant/attendance/schedules', [
            'staff' => $staff,
        ]);
    }

    /**
     * Upsert the 7-day schedule for a specific staff member.
     */
    public function upsert(Request $request, $tenant, User $user)
    {
        $request->validate([
            'schedule'   => 'required|array|size:7',
            'schedule.*.day_of_week' => 'required|integer|between:0,6',
            'schedule.*.is_off_day'  => 'required|boolean',
            'schedule.*.start_time'  => 'nullable|date_format:H:i',
            'schedule.*.end_time'    => 'nullable|date_format:H:i',
        ]);

        DB::transaction(function () use ($request, $user) {
            foreach ($request->schedule as $day) {
                StaffSchedule::updateOrCreate(
                    ['user_id' => $user->id, 'day_of_week' => $day['day_of_week']],
                    [
                        'is_off_day' => $day['is_off_day'],
                        'start_time' => $day['is_off_day'] ? null : ($day['start_time'] ?? null),
                        'end_time'   => $day['is_off_day'] ? null : ($day['end_time'] ?? null),
                    ]
                );
            }
        });

        return back()->with('success', "{$user->name}'s weekly schedule has been updated.");
    }
}
