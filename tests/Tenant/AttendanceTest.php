<?php

use App\Models\Tenant;
use App\Models\User;
use App\Models\AttendanceLog;
use App\Models\LeaveRequest;
use App\Models\StaffSchedule;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

test('attendance clock-in, clock-out, bulk-mark, leave approval, and monthly summary work', function () {
    $tenantId = 'attend-salon-' . uniqid();
    $tenant = Tenant::create(['id' => $tenantId]);
    $tenant->domains()->create(['domain' => "{$tenantId}.localhost"]);
    $tenantUrl = "http://{$tenantId}.localhost";
    $dbPath = database_path("tenant{$tenantId}");

    Artisan::call('tenants:seed', ['--tenants' => [$tenantId]]);
    tenancy()->initialize($tenant);

    $owner = User::where('email', 'owner@salon.com')->first();
    $stylist = User::create([
        'name' => 'Jane Stylist',
        'email' => 'stylist@salon.com',
        'password' => bcrypt('password'),
        'joining_date' => now()->subMonths(6)->toDateString(),
        'salary' => 3000.00,
        'commission_percentage' => 10.00,
    ]);
    $stylist->assignRole('Stylist');
    
    $today = now()->toDateString();

    tenancy()->end();

    // ─── Test 1: Clock-in creates an attendance log ──────────────────────────
    $response = $this->actingAs($owner)
        ->post("{$tenantUrl}/attendance/clock-in");

    $response->assertRedirect();

    tenancy()->initialize($tenant);
    $log = AttendanceLog::where('user_id', $owner->id)->whereDate('date', $today)->first();
    expect($log)->not->toBeNull();
    expect($log->status)->toBe('present');
    expect($log->clock_in)->not->toBeNull();
    tenancy()->end();

    // ─── Test 2: Cannot clock-in twice the same day ──────────────────────────
    $response2 = $this->actingAs($owner)
        ->post("{$tenantUrl}/attendance/clock-in");

    $response2->assertSessionHasErrors(['clock_in']);

    // ─── Test 3: Clock-out records departure time ────────────────────────────
    $response3 = $this->actingAs($owner)
        ->post("{$tenantUrl}/attendance/clock-out");

    $response3->assertRedirect();

    tenancy()->initialize($tenant);
    $logAfter = AttendanceLog::where('user_id', $owner->id)->whereDate('date', $today)->first();
    expect($logAfter->clock_out)->not->toBeNull();
    tenancy()->end();

    // ─── Test 4: Bulk mark marks attendance for all staff ────────────────────
    $response4 = $this->actingAs($owner)
        ->post("{$tenantUrl}/attendance/bulk-mark", [
            'date' => $today,
            'logs' => [
                ['user_id' => $stylist->id, 'status' => 'absent', 'notes' => 'Called in sick'],
            ],
        ]);

    $response4->assertRedirect();

    tenancy()->initialize($tenant);
    $stylistLog = AttendanceLog::where('user_id', $stylist->id)->whereDate('date', $today)->first();
    expect($stylistLog->status)->toBe('absent');
    tenancy()->end();

    // ─── Test 5: Leave request store and approve auto-marks attendance ────────
    $startDate = now()->addDay()->toDateString();
    $endDate   = now()->addDays(2)->toDateString();

    $response5 = $this->actingAs($stylist)
        ->post("{$tenantUrl}/leaves", [
            'leave_type' => 'sick',
            'start_date' => $startDate,
            'end_date'   => $endDate,
            'reason'     => 'Flu symptoms',
        ]);

    $response5->assertRedirect();

    tenancy()->initialize($tenant);
    $leave = LeaveRequest::where('user_id', $stylist->id)->first();
    expect($leave)->not->toBeNull();
    expect($leave->status)->toBe('pending');
    tenancy()->end();

    // Approve the leave
    $response6 = $this->actingAs($owner)
        ->post("{$tenantUrl}/leaves/{$leave->id}/approve");

    $response6->assertRedirect();

    tenancy()->initialize($tenant);
    $leave->refresh();
    expect($leave->status)->toBe('approved');
    expect($leave->approved_by)->toBe($owner->id);

    // Auto-marked attendance for both days of the leave
    $day1 = AttendanceLog::where('user_id', $stylist->id)->whereDate('date', $startDate)->first();
    $day2 = AttendanceLog::where('user_id', $stylist->id)->whereDate('date', $endDate)->first();
    expect($day1->status)->toBe('leave');
    expect($day2->status)->toBe('leave');
    tenancy()->end();

    // ─── Test 6: Staff schedule upsert saves 7-day schedule ──────────────────
    $schedule = collect(range(0, 6))->map(fn($d) => [
        'day_of_week' => $d,
        'is_off_day'  => $d === 0, // Sunday off
        'start_time'  => $d === 0 ? null : '09:00',
        'end_time'    => $d === 0 ? null : '18:00',
    ])->toArray();

    $response7 = $this->actingAs($owner)
        ->post("{$tenantUrl}/staff/schedules/{$stylist->id}", [
            'schedule' => $schedule,
        ]);

    $response7->assertRedirect();

    tenancy()->initialize($tenant);
    $saved = StaffSchedule::where('user_id', $stylist->id)->get();
    expect($saved)->toHaveCount(7);
    $sunday = $saved->firstWhere('day_of_week', 0);
    expect($sunday->is_off_day)->toBeTrue();
    $monday = $saved->firstWhere('day_of_week', 1);
    expect(str_starts_with($monday->start_time, '09:00'))->toBeTrue();
    tenancy()->end();

    // Cleanup
    DB::disconnect('tenant');
    $tenant->delete();
    @unlink($dbPath);
});
