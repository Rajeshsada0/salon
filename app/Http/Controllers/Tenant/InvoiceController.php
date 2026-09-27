<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
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
        $invoice->load(['customer', 'items', 'appointment.staff', 'payments', 'couponCode']);

        return Inertia::render('tenant/invoices/show', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Download a print-ready PDF copy of the receipt.
     */
    public function downloadPdf($tenant, Invoice $invoice)
    {
        $invoice->load(['customer', 'items', 'appointment.staff', 'payments', 'couponCode']);

        $pdf = Pdf::loadView('tenant.pdf.invoice', ['invoice' => $invoice]);

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }
}
