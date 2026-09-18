import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Eye, FileText, ArrowLeft } from 'lucide-react';

interface Invoice {
    id: number;
    invoice_number: string;
    total_amount: string;
    payment_method: string;
    status: string;
    created_at: string;
    customer?: { name: string };
}

interface Props {
    invoices: { data: Invoice[], links: any[] };
}

export default function InvoicesIndex({ invoices }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <>
            <Head title="Billing & Invoices" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-6">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
                        <p className="text-sm text-muted-foreground">View all past transactions and receipts.</p>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border bg-muted/50 dark:border-neutral-800">
                                    <th className="p-4 font-semibold text-muted-foreground">Invoice #</th>
                                    <th className="p-4 font-semibold text-muted-foreground">Date</th>
                                    <th className="p-4 font-semibold text-muted-foreground">Customer</th>
                                    <th className="p-4 font-semibold text-muted-foreground">Amount</th>
                                    <th className="p-4 font-semibold text-muted-foreground">Method</th>
                                    <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border dark:divide-neutral-800">
                                {invoices.data.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-muted/30">
                                        <td className="p-4 font-medium">{inv.invoice_number}</td>
                                        <td className="p-4 text-muted-foreground">{formatDate(inv.created_at)}</td>
                                        <td className="p-4">{inv.customer?.name || 'Walk-in'}</td>
                                        <td className="p-4 font-semibold text-emerald-600">${parseFloat(inv.total_amount).toFixed(2)}</td>
                                        <td className="p-4 capitalize">{inv.payment_method}</td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => router.get(`/invoices/${inv.id}`)}>
                                                <FileText className="h-4 w-4 mr-2" /> View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No invoices found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </>
    );
}
