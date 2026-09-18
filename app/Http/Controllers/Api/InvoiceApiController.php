<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceApiController extends Controller
{
    /**
     * Display a listing of invoices for the mobile app.
     */
    public function index(Request $request)
    {
        $invoices = Invoice::with(['items', 'customer'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json(['invoices' => $invoices]);
    }

    /**
     * Display a specific invoice/receipt.
     */
    public function show(Invoice $invoice)
    {
        $invoice->load(['customer', 'items', 'appointment.staff']);

        return response()->json(['invoice' => $invoice]);
    }
}
