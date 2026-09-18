<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AttendanceLog;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    /**
     * List all leave requests (handled in AttendanceController@index).
     * This method can be used for API/JSON responses.
     */
    public function index(Request $request)
    {
        return redirect()->route('tenant.attendance.index', request()->getHost());
    }

    /**
     * Staff submits a new leave request.
     */
    public function store(Request $request)
    {
        $request->validate([
            'leave_type' => 'required|in:sick,casual,annual,other',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'reason'     => 'nullable|string|max:500',
        ]);

        LeaveRequest::create([
            'user_id'    => auth()->id(),
            'leave_type' => $request->leave_type,
            'start_date' => $request->start_date,
            'end_date'   => $request->end_date,
            'reason'     => $request->reason,
            'status'     => 'pending',
        ]);

        return back()->with('success', 'Leave request submitted successfully.');
    }

    /**
     * Manager approves a leave request — auto-marks attendance logs for the range.
     */
    public function approve(Request $request, $tenant, LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->status !== 'pending') {
            return back()->withErrors(['leave' => 'This request has already been processed.']);
        }

        $leaveRequest->update([
            'status'      => 'approved',
            'approved_by' => auth()->id(),
        ]);

        // Auto-mark attendance logs for each day in the leave range
        $period = CarbonPeriod::create($leaveRequest->start_date, $leaveRequest->end_date);
        foreach ($period as $date) {
            AttendanceLog::updateOrCreate(
                ['user_id' => $leaveRequest->user_id, 'date' => $date->toDateString()],
                ['status' => 'leave', 'notes' => "Approved leave: {$leaveRequest->leave_type}"]
            );
        }

        return back()->with('success', "Leave approved for {$leaveRequest->user->name}.");
    }

    /**
     * Manager rejects a leave request.
     */
    public function reject(Request $request, $tenant, LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->status !== 'pending') {
            return back()->withErrors(['leave' => 'This request has already been processed.']);
        }

        $leaveRequest->update([
            'status'      => 'rejected',
            'approved_by' => auth()->id(),
        ]);

        return back()->with('success', "Leave rejected for {$leaveRequest->user->name}.");
    }
}
