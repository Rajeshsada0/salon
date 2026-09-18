<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\CouponCode;
use App\Models\InvoicePayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PosController extends Controller
{
    /**
     * Show the POS register interface.
     */
    public function index()
    {
        // Load today's or past appointments that are confirmed/in_progress/completed but not billed yet
        $appointments = Appointment::with(['customer.activeMembership.plan', 'services'])
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->whereDoesntHave('invoice')
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();

        $products = Product::where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('tenant/pos/index', [
            'appointments' => $appointments,
            'products' => $products,
        ]);
    }

    /**
     * Process checkout and create an invoice.
     */
    public function checkout(Request $request, $tenant, Appointment $appointment)
    {
        $request->validate([
            'discount_amount' => 'numeric|min:0',
            'tax_amount' => 'numeric|min:0',
            'payment_method' => 'required|in:cash,card,wallet,credit,split',
            'notes' => 'nullable|string',
            'products' => 'nullable|array',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.quantity' => 'required|integer|min:1',
            'paid_amount' => 'nullable|numeric|min:0',
            'redeem_points' => 'nullable|integer|min:0',
            'coupon_code' => 'nullable|string',
            'split_payments' => 'nullable|array',
            'split_payments.*.method' => 'required|in:cash,card,wallet,credit',
            'split_payments.*.amount' => 'required|numeric|min:0.01',
        ]);

        // 1. Calculate services subtotal
        $appointment->load(['services', 'customer']);
        $servicesSubtotal = $appointment->services->sum('pivot.price');

        // 2. Validate and calculate products subtotal
        $productsSubtotal = 0.00;
        $productItems = [];
        if ($request->has('products') && is_array($request->products)) {
            $productIds = collect($request->products)->pluck('product_id')->all();
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($request->products as $item) {
                $product = $products->get($item['product_id']);
                if ($product) {
                    $qty = (int) $item['quantity'];
                    if ($product->stock_quantity < $qty) {
                        throw ValidationException::withMessages([
                            'products' => ["Insufficient stock for product: {$product->name} (Available: {$product->stock_quantity})."],
                        ]);
                    }
                    $itemTotal = $product->retail_price * $qty;
                    $productsSubtotal += $itemTotal;

                    $productItems[] = [
                        'product_id' => $product->id,
                        'product' => $product,
                        'quantity' => $qty,
                        'unit_price' => $product->retail_price,
                        'total' => $itemTotal,
                    ];
                }
            }
        }

        $subtotal = $servicesSubtotal + $productsSubtotal;
        $discountAmount = (float) $request->input('discount_amount', 0);
        $taxAmount = (float) $request->input('tax_amount', 0);

        // Auto-apply active membership discount
        $appointment->load('customer.activeMembership');
        $membershipDiscount = 0.00;
        $membershipCustomer = $appointment->customer;
        if ($membershipCustomer) {
            $activeMembership = $membershipCustomer->activeMembership;
            if ($activeMembership && $activeMembership->plan) {
                $membershipDiscount = round($subtotal * ((float) $activeMembership->plan->discount_percentage / 100), 2);
                $discountAmount += $membershipDiscount;
            }
        }

        // Apply coupon code discount if provided
        $couponCodeId = null;
        if ($request->filled('coupon_code')) {
            $coupon = CouponCode::where('code', strtoupper($request->coupon_code))->first();
            if (!$coupon || !$coupon->isValid()) {
                throw ValidationException::withMessages([
                    'coupon_code' => ['The coupon code is invalid, inactive, or has expired.'],
                ]);
            }
            $couponDiscount = $coupon->calculateDiscount($subtotal);
            $discountAmount += $couponDiscount;
            $couponCodeId = $coupon->id;
        }

        // Apply loyalty points redemption (10 points = $1.00)
        $redeemPoints = (int) $request->input('redeem_points', 0);
        $pointsDiscount = 0.00;
        if ($redeemPoints > 0 && $membershipCustomer) {
            if ($membershipCustomer->loyalty_points < $redeemPoints) {
                throw ValidationException::withMessages([
                    'redeem_points' => ['Insufficient loyalty points. Customer has ' . $membershipCustomer->loyalty_points . ' points.'],
                ]);
            }
            $pointsDiscount = round($redeemPoints / 10, 2);
            $discountAmount += $pointsDiscount;
        }

        $totalAmount = max(0, $subtotal - $discountAmount + $taxAmount);

        DB::beginTransaction();

        try {
            $customer = $appointment->customer;

            // Compile and validate payment segments
            $payments = [];
            $paidAmount = 0.00;
            $dueAmount = 0.00;

            if ($request->payment_method === 'split') {
                $splitPayments = $request->input('split_payments', []);
                if (empty($splitPayments)) {
                    throw ValidationException::withMessages([
                        'payment_method' => ['Split payments array cannot be empty.'],
                    ]);
                }

                $sum = collect($splitPayments)->sum('amount');
                if (abs($sum - $totalAmount) > 0.01) {
                    throw ValidationException::withMessages([
                        'payment_method' => ["The sum of split payments (\${$sum}) must match the total invoice amount (\${$totalAmount})."],
                    ]);
                }

                foreach ($splitPayments as $p) {
                    $method = $p['method'];
                    $amount = (float) $p['amount'];

                    if ($method === 'wallet') {
                        if (!$customer || $customer->wallet_balance < $amount) {
                            throw ValidationException::withMessages([
                                'payment_method' => ["Insufficient wallet balance (Required: \${$amount}, Available: \${$customer?->wallet_balance})."],
                            ]);
                        }
                        $customer->decrement('wallet_balance', $amount);
                        $paidAmount += $amount;
                    } elseif ($method === 'credit') {
                        if (!$customer) {
                            throw ValidationException::withMessages([
                                'payment_method' => ['Walk-in clients cannot purchase on credit.'],
                            ]);
                        }
                        if (($customer->outstanding_balance + $amount) > $customer->credit_limit) {
                            $remaining = max(0.00, $customer->credit_limit - $customer->outstanding_balance);
                            throw ValidationException::withMessages([
                                'payment_method' => ["Credit limit exceeded. Outstanding: \${$customer->outstanding_balance}, Limit: \${$customer->credit_limit} (Remaining: \${$remaining})."],
                            ]);
                        }
                        $customer->increment('outstanding_balance', $amount);
                        $dueAmount += $amount;
                    } else {
                        $paidAmount += $amount;
                    }

                    $payments[] = [
                        'payment_method' => $method,
                        'amount' => $amount,
                    ];
                }
            } else {
                // Single payment method processing
                $method = $request->payment_method;

                if ($method === 'wallet') {
                    if (!$customer || $customer->wallet_balance < $totalAmount) {
                        throw ValidationException::withMessages([
                            'payment_method' => ['Insufficient wallet balance.'],
                        ]);
                    }
                    $customer->decrement('wallet_balance', $totalAmount);
                    $paidAmount = $totalAmount;
                    $payments[] = [
                        'payment_method' => 'wallet',
                        'amount' => $totalAmount,
                    ];
                } elseif ($method === 'credit') {
                    if (!$customer) {
                        throw ValidationException::withMessages([
                            'payment_method' => ['Walk-in clients cannot purchase on credit.'],
                        ]);
                    }
                    $inputPaid = (float) $request->input('paid_amount', 0.00);
                    $creditAmount = max(0.00, $totalAmount - $inputPaid);
                    
                    if (($customer->outstanding_balance + $creditAmount) > $customer->credit_limit) {
                        $remaining = max(0.00, $customer->credit_limit - $customer->outstanding_balance);
                        throw ValidationException::withMessages([
                            'payment_method' => ["Transaction exceeds customer's credit limit of \${$customer->credit_limit} (Remaining limit: \${$remaining})."],
                        ]);
                    }
                    if ($creditAmount > 0) {
                        $customer->increment('outstanding_balance', $creditAmount);
                        $dueAmount = $creditAmount;
                        $payments[] = [
                            'payment_method' => 'credit',
                            'amount' => $creditAmount,
                        ];
                    }
                    if ($inputPaid > 0) {
                        $paidAmount = $inputPaid;
                        $payments[] = [
                            'payment_method' => 'cash',
                            'amount' => $inputPaid,
                        ];
                    }
                } else {
                    $paidAmount = $totalAmount;
                    $payments[] = [
                        'payment_method' => $method,
                        'amount' => $totalAmount,
                    ];
                }
            }

            // Award loyalty points (1 point per $10 spent on final total)
            $pointsEarned = floor($totalAmount / 10);
            if ($customer && $pointsEarned > 0) {
                $customer->increment('loyalty_points', $pointsEarned);
            }

            // Decrement redeemed points
            if ($redeemPoints > 0 && $customer) {
                $customer->decrement('loyalty_points', $redeemPoints);
            }

            // Increment coupon uses if coupon code was applied
            if ($couponCodeId) {
                $coupon = CouponCode::find($couponCodeId);
                $coupon->increment('uses_count');
            }

            // Create Invoice
            $invoice = Invoice::create([
                'appointment_id' => $appointment->id,
                'customer_id' => $customer ? $customer->id : null,
                'coupon_code_id' => $couponCodeId,
                'invoice_number' => 'INV-' . strtoupper(Str::random(6)),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_method' => $request->payment_method,
                'status' => $dueAmount > 0 ? 'pending' : 'paid',
                'notes' => $request->notes,
            ]);

            // Save individual segments to invoice_payments table
            foreach ($payments as $pay) {
                $invoice->payments()->create([
                    'payment_method' => $pay['payment_method'],
                    'amount' => $pay['amount'],
                ]);
            }

            // Create Service Invoice Items
            foreach ($appointment->services as $service) {
                $invoice->items()->create([
                    'service_id' => $service->id,
                    'item_name' => $service->name,
                    'unit_price' => $service->pivot->price,
                    'quantity' => 1,
                    'total' => $service->pivot->price,
                ]);
            }

            // Create Product Invoice Items, decrement stock, and log inventory movements
            foreach ($productItems as $item) {
                $product = $item['product'];
                
                // Save item
                $invoice->items()->create([
                    'product_id' => $product->id,
                    'item_name' => $product->name,
                    'unit_price' => $item['unit_price'],
                    'quantity' => $item['quantity'],
                    'total' => $item['total'],
                ]);

                // Decrement stock
                $product->decrement('stock_quantity', $item['quantity']);

                // Create stock audit log
                $product->logs()->create([
                    'user_id' => auth()->id(),
                    'quantity' => -$item['quantity'],
                    'type' => 'stock_out',
                    'notes' => "Sold at POS on Invoice: {$invoice->invoice_number}",
                ]);
            }

            // Mark appointment as completed
            if ($appointment->status !== 'completed') {
                $appointment->update(['status' => 'completed']);
            }

            DB::commit();

            return redirect()->route('tenant.invoices.show', ['tenant' => request()->getHost(), 'invoice' => $invoice->id])
                ->with('success', 'Payment processed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
