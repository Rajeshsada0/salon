<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Receipt #{{ $invoice->invoice_number }}</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #262626;
            padding: 30px;
            background: #ffffff;
        }
        .header {
            text-align: center;
            border-bottom: 2px dashed #e5e5e5;
            padding-bottom: 18px;
            margin-bottom: 18px;
        }
        .salon-name {
            font-size: 20px;
            font-weight: 800;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        .subtitle {
            font-size: 10px;
            color: #737373;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .meta-section {
            margin-bottom: 16px;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 12px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }
        .meta-table td {
            vertical-align: top;
            padding: 2px 0;
            font-size: 11px;
        }
        .meta-label {
            color: #737373;
            width: 35%;
        }
        .meta-value {
            font-weight: 600;
            color: #171717;
            text-align: right;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-paid {
            background-color: #dcfce7;
            color: #15803d;
        }
        .badge-pending {
            background-color: #fef9c3;
            color: #a16207;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 16px;
        }
        .items-table th {
            text-align: left;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #737373;
            border-bottom: 1px solid #d4d4d4;
            padding: 6px 0;
        }
        .items-table th.text-right,
        .items-table td.text-right {
            text-align: right;
        }
        .items-table td {
            padding: 8px 0;
            border-bottom: 1px solid #f5f5f5;
            font-size: 11px;
        }
        .totals-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .totals-table td {
            padding: 3px 0;
            font-size: 11px;
        }
        .totals-table .label {
            text-align: right;
            color: #737373;
            width: 70%;
            padding-right: 12px;
        }
        .totals-table .value {
            text-align: right;
            font-weight: 600;
            color: #171717;
        }
        .totals-table .discount-row td {
            color: #dc2626;
        }
        .grand-total-row td {
            font-size: 14px !important;
            font-weight: 800 !important;
            color: #111827 !important;
            border-top: 2px solid #171717;
            border-bottom: 2px solid #171717;
            padding: 8px 0 !important;
        }
        .payments-section {
            margin-top: 16px;
            background: #fafafa;
            border: 1px solid #eeeeee;
            border-radius: 6px;
            padding: 10px 12px;
        }
        .payments-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #737373;
            margin-bottom: 6px;
        }
        .payment-row {
            display: table;
            width: 100%;
            font-size: 11px;
            padding: 2px 0;
        }
        .payment-method {
            display: table-cell;
            text-transform: capitalize;
            color: #404040;
        }
        .payment-amount {
            display: table-cell;
            text-align: right;
            font-weight: 600;
        }
        .footer {
            margin-top: 28px;
            text-align: center;
            border-top: 1px dashed #e5e5e5;
            padding-top: 14px;
            font-size: 10px;
            color: #a3a3a3;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <div class="header">
        <div class="salon-name">Aura Salon Suite</div>
        <div class="subtitle">Official Service & Retail Receipt</div>
    </div>

    <!-- Invoice Details & Customer Info -->
    <div class="meta-section">
        <table class="meta-table">
            <tr>
                <td class="meta-label">Invoice Number</td>
                <td class="meta-value">{{ $invoice->invoice_number }}</td>
            </tr>
            <tr>
                <td class="meta-label">Issue Date</td>
                <td class="meta-value">{{ $invoice->created_at ? $invoice->created_at->format('M d, Y h:i A') : now()->format('M d, Y') }}</td>
            </tr>
            <tr>
                <td class="meta-label">Status</td>
                <td class="meta-value">
                    <span class="badge {{ $invoice->status === 'paid' ? 'badge-paid' : 'badge-pending' }}">
                        {{ strtoupper($invoice->status) }}
                    </span>
                </td>
            </tr>
            <tr>
                <td class="meta-label">Customer</td>
                <td class="meta-value">{{ $invoice->customer ? $invoice->customer->name : 'Walk-in Client' }}</td>
            </tr>
            @if($invoice->customer && $invoice->customer->mobile)
            <tr>
                <td class="meta-label">Customer Phone</td>
                <td class="meta-value">{{ $invoice->customer->mobile }}</td>
            </tr>
            @endif
            @if($invoice->appointment && $invoice->appointment->staff)
            <tr>
                <td class="meta-label">Stylist / Staff</td>
                <td class="meta-value">{{ $invoice->appointment->staff->name }}</td>
            </tr>
            @endif
        </table>
    </div>

    <!-- Itemized Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th>Item / Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $item)
            <tr>
                <td>{{ $item->item_name }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">${{ number_format((float) $item->unit_price, 2) }}</td>
                <td class="text-right">${{ number_format((float) $item->total, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals Summary -->
    <table class="totals-table">
        <tr>
            <td class="label">Subtotal</td>
            <td class="value">${{ number_format((float) $invoice->subtotal, 2) }}</td>
        </tr>
        @if((float) $invoice->discount_amount > 0)
        <tr class="discount-row">
            <td class="label">Total Discount</td>
            <td class="value">-${{ number_format((float) $invoice->discount_amount, 2) }}</td>
        </tr>
        @endif
        @if($invoice->couponCode)
        <tr class="discount-row">
            <td class="label">Coupon Applied ({{ $invoice->couponCode->code }})</td>
            <td class="value">Applied</td>
        </tr>
        @endif
        @if((float) $invoice->tax_amount > 0)
        <tr>
            <td class="label">Tax</td>
            <td class="value">+${{ number_format((float) $invoice->tax_amount, 2) }}</td>
        </tr>
        @endif
        <tr class="grand-total-row">
            <td class="label">Total Amount</td>
            <td class="value">${{ number_format((float) $invoice->total_amount, 2) }}</td>
        </tr>
        @if($invoice->due_amount !== null && (float) $invoice->due_amount > 0)
        <tr>
            <td class="label" style="color: #15803d;">Paid to Date</td>
            <td class="value" style="color: #15803d;">${{ number_format((float) $invoice->paid_amount, 2) }}</td>
        </tr>
        <tr>
            <td class="label" style="color: #b91c1c;">Outstanding Due</td>
            <td class="value" style="color: #b91c1c;">${{ number_format((float) $invoice->due_amount, 2) }}</td>
        </tr>
        @endif
    </table>

    <!-- Payment Breakdown Section -->
    <div class="payments-section">
        <div class="payments-title">Payment Breakdown</div>
        @if($invoice->payments && $invoice->payments->count() > 0)
            @foreach($invoice->payments as $payment)
            <div class="payment-row">
                <span class="payment-method">{{ $payment->payment_method }}</span>
                <span class="payment-amount">${{ number_format((float) $payment->amount, 2) }}</span>
            </div>
            @endforeach
        @else
            <div class="payment-row">
                <span class="payment-method">{{ $invoice->payment_method ?? 'Cash' }}</span>
                <span class="payment-amount">${{ number_format((float) $invoice->total_amount, 2) }}</span>
            </div>
        @endif
    </div>

    @if($invoice->notes)
    <div style="margin-top: 14px; font-size: 11px; color: #525252;">
        <strong>Notes:</strong> {{ $invoice->notes }}
    </div>
    @endif

    <!-- Footer -->
    <div class="footer">
        Thank you for choosing Aura Salon Suite!<br>
        We look forward to seeing you again.
    </div>

</body>
</html>
