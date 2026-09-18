<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class StaffController extends Controller
{
    /**
     * Display a listing of the staff.
     */
    public function index()
    {
        // Get all users who are not customers and not super admins
        $staff = User::with('roles')
            ->whereHas('roles', function ($query) {
                $query->where('name', '!=', 'Customer');
            })
            ->get();

        $roles = Role::where('name', '!=', 'Customer')
            ->where('name', '!=', 'Super Admin')
            ->pluck('name');

        return Inertia::render('tenant/staff/index', [
            'staff' => $staff,
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created staff member.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
            'joining_date' => 'nullable|date',
            'salary' => 'nullable|numeric|min:0',
            'commission_percentage' => 'nullable|numeric|between:0,100',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'joining_date' => $request->joining_date,
            'salary' => $request->salary,
            'commission_percentage' => $request->commission_percentage ?? 0.00,
        ]);

        $user->assignRole($request->role);

        return redirect()->route('tenant.staff.index', request()->getHost())
            ->with('success', 'Staff member created successfully.');
    }

    /**
     * Update the specified staff member.
     */
    public function update(Request $request, $tenant, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|exists:roles,name',
            'joining_date' => 'nullable|date',
            'salary' => 'nullable|numeric|min:0',
            'commission_percentage' => 'nullable|numeric|between:0,100',
        ]);

        $userData = [
            'name' => $request->name,
            'email' => $request->email,
            'joining_date' => $request->joining_date,
            'salary' => $request->salary,
            'commission_percentage' => $request->commission_percentage ?? 0.00,
        ];

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        // Sync Spatie role
        $user->syncRoles([$request->role]);

        return redirect()->route('tenant.staff.index', request()->getHost())
            ->with('success', 'Staff member updated successfully.');
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy($tenant, User $user)
    {
        // Prevent self-deletion
        if (auth()->id() === $user->id) {
            return redirect()->route('tenant.staff.index', request()->getHost())
                ->with('error', 'You cannot delete yourself.');
        }

        $user->delete();

        return redirect()->route('tenant.staff.index', request()->getHost())
            ->with('success', 'Staff member deleted successfully.');
    }
}
