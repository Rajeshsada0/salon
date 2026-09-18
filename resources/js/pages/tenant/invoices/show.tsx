import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Scissors } from 'lucide-react';

interface InvoiceItem {
    id: number;
    item_name: string;
    unit_price: string;
    quantity: number;
    total: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    subtotal: string;
    discount_amount: string;
    tax_amount: string;
    total_amount: string;
    payment_method: string;
    status: string;
    created_at: string;
    customer?: { name: string; mobile: string | null; loyalty_points: number; wallet_balance: string; };
    appointment?: { staff: { name: string } };
    items: InvoiceItem[];
}

interface Props {
    invoice: Invoice;
}

export default function InvoiceShow({ invoice }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title={`Receipt - ${invoice.invoice_number}`} />
            
            {/* Non-printable UI Actions */}
            <div className="flex flex-col gap-6 p-6 print:hidden">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => router.get('/invoices')}>
                        <ArrowLeft className="h-4 w-4" /> Back to Invoices
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" /> Print Receipt
                    </Button>
                </div>
            </div>

            {/* Printable Area */}
            <div className="flex items-center justify-center p-6 print:p-0 print:m-0">
                <div className="w-full max-w-md bg-white text-black p-8 shadow-sm print:shadow-none border border-neutral-200">
                    
                    {/* Header */}
                    <div className="text-center border-b border-dashed border-neutral-300 pb-6 mb-6">
                        <div className="flex justify-center mb-2 text-emerald-600">
                            <Scissors className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tighter uppercase mb-1">SALON RECEIPT</h1>
                        <p className="text-xs text-neutral-500 uppercase tracking-widest">{invoice.invoice_number}</p>
                        <p className="text-xs text-neutral-500 mt-2">
                            {new Date(invoice.created_at).toLocaleString()}
                        </p>
                    </div>

                    {/* Details */}
                    <div className="text-sm space-y-2 mb-6">
                        {invoice.customer && (
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Customer:</span>
                                <span className="font-medium">{invoice.customer.name}</span>
                            </div>
                        )}
                        {invoice.appointment?.staff && (
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Stylist:</span>
                                <span className="font-medium">{invoice.appointment.staff.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="border-b border-dashed border-neutral-300 pb-4 mb-4">
                        <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-wide mb-3">
                            <span>Item</span>
                            <span>Amount</span>
                        </div>
                        <div className="space-y-3 text-sm">
                            {invoice.items.map(item => (
                                <div key={item.id} className="flex justify-between items-start">
                                    <div className="flex-1 pr-4">
                                        <p className="font-medium">{item.item_name}</p>
                                        {item.quantity > 1 && <p className="text-xs text-neutral-500">{item.quantity} x ${parseFloat(item.unit_price).toFixed(2)}</p>}
                                    </div>
                                    <div className="font-medium">
                                        ${parseFloat(item.total).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="space-y-2 text-sm border-b border-dashed border-neutral-300 pb-6 mb-6">
                        <div className="flex justify-between text-neutral-600">
                            <span>Subtotal</span>
                            <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
                        </div>
                        {parseFloat(invoice.discount_amount) > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>Discount</span>
                                <span>-${parseFloat(invoice.discount_amount).toFixed(2)}</span>
                            </div>
                        )}
                        {parseFloat(invoice.tax_amount) > 0 && (
                            <div className="flex justify-between text-neutral-600">
                                <span>Tax</span>
                                <span>${parseFloat(invoice.tax_amount).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold pt-4">
                            <span>TOTAL</span>
                            <span>${parseFloat(invoice.total_amount).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-sm space-y-2">
                        <p className="text-neutral-500">Paid via <span className="font-semibold uppercase text-black">{invoice.payment_method}</span></p>
                        
                        {invoice.customer && (
                            <div className="mt-4 bg-neutral-50 p-3 rounded text-xs text-neutral-600">
                                <p>Wallet Balance: ${parseFloat(invoice.customer.wallet_balance).toFixed(2)}</p>
                                <p>Loyalty Points: {invoice.customer.loyalty_points}</p>
                            </div>
                        )}
                        
                        <p className="mt-6 font-semibold tracking-wide">THANK YOU!</p>
                    </div>

                </div>
            </div>
        </>
    );
}
