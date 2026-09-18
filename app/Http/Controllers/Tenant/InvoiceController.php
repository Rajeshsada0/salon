<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    /**
     * Display a listing of historical invoices.
     */
    public function index()
    {
        $invoices = Invoice::with(['customer', 'appointment'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('tenant/invoices/index', [
            'invoices' => $invoices,
        ]);
    }

    /**
     * Show the printable receipt view.
     */
    public function show($tenant, Invoice $invoice)
    {
        $invoice->load(['customer', 'items', 'appointment.staff']);

        return Inertia::render('tenant/invoices/show', [
            'invoice' => $invoice,
        ]);
    }
}
