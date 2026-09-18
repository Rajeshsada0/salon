<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerApiController extends Controller
{
    /**
     * Display a paginated listing of customers.
     */
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        $customers = $query->paginate(15);

        return response()->json($customers);
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'mobile' => 'nullable|unique:customers',
            'email' => 'nullable|email',
            'gender' => 'nullable|in:male,female,other',
            'dob' => 'nullable|date',
            'address' => 'nullable',
            'notes' => 'nullable',
            'group' => 'nullable',
            'loyalty_points' => 'nullable|integer',
            'wallet_balance' => 'nullable|numeric',
        ]);

        $customer = Customer::create($request->all());

        return response()->json(['customer' => $customer], 201);
    }

    /**
     * Display the specified customer.
     */
    public function show($tenant, Customer $customer)
    {
        return response()->json(['customer' => $customer]);
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, $tenant, Customer $customer)
    {
        $request->validate([
            'name' => 'required',
            'mobile' => 'nullable|unique:customers,mobile,' . $customer->id,
            'email' => 'nullable|email',
            'gender' => 'nullable|in:male,female,other',
            'dob' => 'nullable|date',
            'address' => 'nullable',
            'notes' => 'nullable',
            'group' => 'nullable',
            'loyalty_points' => 'nullable|integer',
            'wallet_balance' => 'nullable|numeric',
        ]);

        $customer->update($request->all());

        return response()->json(['customer' => $customer]);
    }
}
