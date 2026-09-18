<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    /**
     * Main attendance dashboard — Daily Log, Leave Requests, Monthly Summary.
     */
    public function index(Request $request)
    {
        $date = $request->input('date', now()->toDateString());
        $month = $request->input('month', now()->format('Y-m'));

        // All staff (users with staff roles)
        $staff = User::role(['Salon Owner', 'Branch Manager', 'Receptionist', 'Stylist', 'Beautician', 'Accountant'])
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        // Daily attendance log for the selected date
        $dailyLogs = AttendanceLog::with('user')
            ->whereDate('date', $date)
            ->get()
            ->keyBy('user_id');

        // Merge staff with their log for the day
        $dailyAttendance = $staff->map(function ($user) use ($dailyLogs, $date) {
            $log = $dailyLogs->get($user->id);
            return [
                'user_id'   => $user->id,
                'name'      => $user->name,
                'log_id'    => $log?->id,
                'clock_in'  => $log?->clock_in,
                'clock_out' => $log?->clock_out,
                'status'    => $log?->status ?? 'not_marked',
                'notes'     => $log?->notes,
            ];
        });

        // Leave requests
        $leaveRequests = LeaveRequest::with(['user', 'approver'])
            ->orderByDesc('created_at')
            ->get();

        // Monthly summary
        [$year, $monthNum] = explode('-', $month);
        $startOfMonth = Carbon::create($year, $monthNum, 1)->startOfMonth();
        $endOfMonth   = $startOfMonth->copy()->endOfMonth();
        $workingDays  = CarbonPeriod::create($startOfMonth, $endOfMonth)
            ->filter(fn ($d) => !$d->isWeekend())
            ->count();

        $summary = $staff->map(function ($user) use ($startOfMonth, $endOfMonth, $workingDays) {
            $logs = AttendanceLog::where('user_id', $user->id)
                ->whereBetween('date', [$startOfMonth, $endOfMonth])
                ->get();

            $present  = $logs->whereIn('status', ['present', 'half_day'])->count();
            $absent   = $logs->where('status', 'absent')->count();
            $onLeave  = $logs->where('status', 'leave')->count();

            return [
                'user_id'      => $user->id,
                'name'         => $user->name,
                'working_days' => $workingDays,
                'present'      => $present,
                'absent'       => $absent,
                'on_leave'     => $onLeave,
                'not_marked'   => max(0, $workingDays - $present - $absent - $onLeave),
                'percentage'   => $workingDays > 0 ? round(($present / $workingDays) * 100, 1) : 0,
            ];
        });

        return Inertia::render('tenant/attendance/index', [
            'staff'           => $staff,
            'dailyAttendance' => $dailyAttendance,
            'leaveRequests'   => $leaveRequests,
            'summary'         => $summary,
            'selectedDate'    => $date,
            'selectedMonth'   => $month,
        ]);
    }

    /**
     * Record clock-in for the authenticated user (today).
     */
    public function clockIn(Request $request)
    {
        $userId = auth()->id();
        $today  = now()->toDateString();

        $existing = AttendanceLog::where('user_id', $userId)->whereDate('date', $today)->first();

        if ($existing && $existing->clock_in) {
            return back()->withErrors(['clock_in' => 'You have already clocked in today.']);
        }

        AttendanceLog::updateOrCreate(
            ['user_id' => $userId, 'date' => $today],
            ['clock_in' => now()->toTimeString(), 'status' => 'present']
        );

        return back()->with('success', 'Clock-in recorded at ' . now()->format('h:i A') . '.');
    }

    /**
     * Record clock-out for the authenticated user (today).
     */
    public function clockOut(Request $request)
    {
        $userId = auth()->id();
        $today  = now()->toDateString();

        $log = AttendanceLog::where('user_id', $userId)->whereDate('date', $today)->first();

        if (!$log || !$log->clock_in) {
            return back()->withErrors(['clock_out' => 'You must clock in before clocking out.']);
        }

        if ($log->clock_out) {
            return back()->withErrors(['clock_out' => 'You have already clocked out today.']);
        }

        $log->update(['clock_out' => now()->toTimeString()]);

        return back()->with('success', 'Clock-out recorded at ' . now()->format('h:i A') . '.');
    }

    /**
     * Bulk-mark attendance for all staff on a given date.
     */
    public function markBulk(Request $request)
    {
        $request->validate([
            'date'      => 'required|date',
            'logs'      => 'required|array',
            'logs.*.user_id' => 'required|exists:users,id',
            'logs.*.status'  => 'required|in:present,absent,half_day,leave',
            'logs.*.notes'   => 'nullable|string',
            'logs.*.clock_in'  => 'nullable|date_format:H:i',
            'logs.*.clock_out' => 'nullable|date_format:H:i',
        ]);

        foreach ($request->logs as $item) {
            AttendanceLog::updateOrCreate(
                ['user_id' => $item['user_id'], 'date' => $request->date],
                [
                    'status'    => $item['status'],
                    'notes'     => $item['notes'] ?? null,
                    'clock_in'  => $item['clock_in'] ?? null,
                    'clock_out' => $item['clock_out'] ?? null,
                ]
            );
        }

        return back()->with('success', 'Attendance marked for ' . count($request->logs) . ' staff members.');
    }
}
