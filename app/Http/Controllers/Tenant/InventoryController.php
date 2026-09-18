<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * Adjust product stock levels and log audit trail.
     */
    public function adjust(Request $request, $tenant, Product $product)
    {
        $request->validate([
            'quantity' => 'required|integer',
            'type' => 'required|string|in:purchase,stock_in,stock_out,adjustment,transfer',
            'notes' => 'nullable|string',
        ]);

        $quantity = (int) $request->quantity;
        $type = $request->type;

        // If it's a direct override adjustment, quantity is the target stock level
        if ($type === 'adjustment') {
            $diff = $quantity - $product->stock_quantity;
            $product->stock_quantity = $quantity;
            $logQty = $diff;
        } else {
            // Otherwise, it's a relative offset adjustment
            $product->stock_quantity += $quantity;
            $logQty = $quantity;
        }

        // Ensure stock doesn't drop below 0
        if ($product->stock_quantity < 0) {
            $product->stock_quantity = 0;
        }

        $product->save();

        // Create log entry
        if ($logQty !== 0) {
            $product->logs()->create([
                'user_id' => auth()->id(),
                'quantity' => $logQty,
                'type' => $type,
                'notes' => $request->notes,
            ]);
        }

        return redirect()->route('tenant.inventory.index', request()->getHost())
            ->with('success', 'Stock level adjusted successfully.');
    }
}
