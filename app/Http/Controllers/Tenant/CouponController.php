<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\CouponCode;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CouponController extends Controller
{
    /**
     * Display a listing of coupon codes.
     */
    public function index()
    {
        $coupons = CouponCode::orderByDesc('created_at')->get();

        return Inertia::render('tenant/pos/coupons', [
            'coupons' => $coupons,
        ]);
    }

    /**
     * Store a newly created coupon code.
     */
    public function store(Request $request)
    {
        $request->validate([
            'code'        => 'required|string|unique:coupon_codes,code|max:50',
            'type'        => 'required|in:percentage,fixed',
            'value'       => 'required|numeric|min:0.01',
            'expires_at'  => 'nullable|date|after_or_equal:today',
            'max_uses'    => 'nullable|integer|min:1',
            'is_active'   => 'boolean',
        ]);

        CouponCode::create([
            'code'       => strtoupper($request->code),
            'type'       => $request->type,
            'value'      => $request->value,
            'expires_at' => $request->expires_at,
            'max_uses'   => $request->max_uses,
            'is_active'  => $request->is_active ?? true,
        ]);

        return redirect()->route('tenant.coupons.index', request()->getHost())
            ->with('success', 'Coupon code created successfully.');
    }

    /**
     * Update the specified coupon code.
     */
    public function update(Request $request, $tenant, CouponCode $coupon)
    {
        $request->validate([
            'code'        => 'required|string|max:50|unique:coupon_codes,code,' . $coupon->id,
            'type'        => 'required|in:percentage,fixed',
            'value'       => 'required|numeric|min:0.01',
            'expires_at'  => 'nullable|date',
            'max_uses'    => 'nullable|integer|min:1',
            'is_active'   => 'boolean',
        ]);

        $coupon->update([
            'code'       => strtoupper($request->code),
            'type'       => $request->type,
            'value'      => $request->value,
            'expires_at' => $request->expires_at,
            'max_uses'   => $request->max_uses,
            'is_active'  => $request->is_active ?? true,
        ]);

        return redirect()->route('tenant.coupons.index', request()->getHost())
            ->with('success', 'Coupon code updated successfully.');
    }

    /**
     * Remove the specified coupon code.
     */
    public function destroy($tenant, CouponCode $coupon)
    {
        $coupon->delete();

        return redirect()->route('tenant.coupons.index', request()->getHost())
            ->with('success', 'Coupon code deleted.');
    }

    /**
     * Validate a coupon code at POS checkout.
     */
    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $coupon = CouponCode::where('code', strtoupper($request->code))->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon code does not exist.',
            ], 422);
        }

        if (!$coupon->isValid()) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon is inactive, expired, or has reached its usage limit.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'coupon' => [
                'id'    => $coupon->id,
                'code'  => $coupon->code,
                'type'  => $coupon->type,
                'value' => $coupon->value,
            ]
        ]);
    }
}
