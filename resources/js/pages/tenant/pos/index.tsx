import { Head, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Banknote, Wallet, Receipt, Scissors, Crown, Star, Gift, Plus, Trash2, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MembershipPlan { id: number; name: string; discount_percentage: string; }
interface CustomerMembership { id: number; plan: MembershipPlan; expires_at: string; }
interface Service { id: number; name: string; pivot: { price: string }; }
interface Customer { id: number; name: string; wallet_balance: string; loyalty_points: number; active_membership?: CustomerMembership | null; }
interface Appointment {
    id: number;
    date: string;
    start_time: string;
    customer: Customer;
    services: Service[];
}

interface Props {
    appointments: Appointment[];
}

export default function PosRegister({ appointments }: Props) {
    const [selectedAptId, setSelectedAptId] = useState<string | null>(null);

    const selectedAppointment = useMemo(() => {
        return appointments.find(a => a.id.toString() === selectedAptId);
    }, [selectedAptId, appointments]);

    const subtotal = useMemo(() => {
        if (!selectedAppointment) return 0;
        return selectedAppointment.services.reduce((acc, svc) => acc + parseFloat(svc.pivot.price), 0);
    }, [selectedAppointment]);

    const { data, setData, post, processing, errors } = useForm({
        discount_amount: '0',
        tax_amount: '0',
        payment_method: 'cash',
        notes: '',
        redeem_points: '0',
        coupon_code: '',
        split_payments: [] as Array<{ method: string; amount: string }>,
    });

    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ id: number; code: string; type: string; value: string } | null>(null);
    const [couponError, setCouponError] = useState('');

    const [splitEnabled, setSplitEnabled] = useState(false);
    const [splitSegments, setSplitSegments] = useState<Array<{ method: string; amount: string }>>([
        { method: 'cash', amount: '' },
    ]);

    const [redeemEnabled, setRedeemEnabled] = useState(false);

    const membershipDiscount = useMemo(() => {
        if (!selectedAppointment?.customer?.active_membership) return 0;
        const pct = parseFloat(selectedAppointment.customer.active_membership.plan.discount_percentage);
        return Math.round(subtotal * (pct / 100) * 100) / 100;
    }, [selectedAppointment, subtotal]);

    const pointsDiscount = useMemo(() => {
        const pts = parseInt(data.redeem_points) || 0;
        return Math.round((pts / 10) * 100) / 100;
    }, [data.redeem_points]);

    const couponDiscount = useMemo(() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === 'percentage') {
            return Math.round(subtotal * (parseFloat(appliedCoupon.value) / 100) * 100) / 100;
        }
        return Math.min(subtotal, parseFloat(appliedCoupon.value));
    }, [appliedCoupon, subtotal]);

    const total = useMemo(() => {
        const d = parseFloat(data.discount_amount) || 0;
        const t = parseFloat(data.tax_amount) || 0;
        return Math.max(0, subtotal - d - membershipDiscount - pointsDiscount - couponDiscount + t);
    }, [subtotal, data.discount_amount, data.tax_amount, membershipDiscount, pointsDiscount, couponDiscount]);

    const splitTotalSum = useMemo(() => {
        return splitSegments.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
    }, [splitSegments]);

    const splitMismatched = useMemo(() => {
        return splitEnabled && Math.abs(splitTotalSum - total) > 0.01;
    }, [splitEnabled, splitTotalSum, total]);

    const handleApplyCoupon = async () => {
        if (!couponCodeInput) return;
        setCouponError('');
        try {
            const res = await fetch('/coupons/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ code: couponCodeInput }),
            });
            const body = await res.json();
            if (res.ok && body.valid) {
                setAppliedCoupon(body.coupon);
                toast.success(`Coupon code ${body.coupon.code} applied!`);
            } else {
                setCouponError(body.message || 'Invalid coupon.');
                toast.error(body.message || 'Invalid coupon.');
            }
        } catch (err) {
            setCouponError('Error validating coupon.');
            toast.error('Error validating coupon.');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCodeInput('');
        setCouponError('');
    };

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAptId) {
            toast.error('Please select an appointment first.');
            return;
        }

        router.post(`/pos/checkout/${selectedAptId}`, {
            ...data,
            payment_method: splitEnabled ? 'split' : data.payment_method,
            split_payments: splitEnabled ? splitSegments.map(s => ({ ...s, amount: parseFloat(s.amount) })) : [],
            coupon_code: appliedCoupon ? appliedCoupon.code : null,
        }, {
            onSuccess: () => toast.success('Payment processed successfully!'),
            onError: (err) => {
                if (err.payment_method) toast.error(err.payment_method);
                else if (err.coupon_code) toast.error(err.coupon_code);
                else toast.error('Checkout failed. Please check inputs.');
            }
        });
    };

    return (
        <>
            <Head title="POS Register" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-6">
                
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Register</h2>
                    <p className="text-sm text-muted-foreground">Process payments and generate receipts.</p>
                </div>

                <div className="grid h-full gap-6 md:grid-cols-2">
                    
                    {/* Left Pane: Select Appointment */}
                    <div className="flex flex-col gap-4 overflow-hidden rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <h3 className="font-semibold text-lg border-b border-sidebar-border pb-3 dark:border-neutral-800">Pending Checkouts</h3>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {appointments.length === 0 ? (
                                <p className="text-sm text-muted-foreground mt-4 text-center">No pending appointments to bill today.</p>
                            ) : (
                                appointments.map(apt => (
                                    <div 
                                        key={apt.id}
                                        onClick={() => setSelectedAptId(apt.id.toString())}
                                        className={`cursor-pointer rounded-lg border p-4 transition-all ${
                                            selectedAptId === apt.id.toString() 
                                                ? 'border-emerald-500 bg-emerald-500/10' 
                                                : 'border-sidebar-border hover:bg-muted/50 dark:border-neutral-800'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-semibold">{apt.customer?.name || 'Walk-in'}</div>
                                            <div className="text-xs font-medium bg-muted px-2 py-1 rounded-sm">{apt.start_time}</div>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex gap-1 items-center">
                                            <Scissors className="h-3 w-3" /> {apt.services.length} services
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Pane: Checkout Cart */}
                    <div className="flex flex-col overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        
                        {/* Cart Header */}
                        <div className="p-6 border-b border-sidebar-border dark:border-neutral-800 bg-muted/20">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Receipt className="h-5 w-5" /> Current Bill
                            </h3>
                            {selectedAppointment && selectedAppointment.customer && (
                                <div className="mt-2 space-y-2">
                                    <div className="text-sm text-muted-foreground flex justify-between">
                                        <span>Wallet: <strong className="text-emerald-600">${selectedAppointment.customer.wallet_balance}</strong></span>
                                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> <strong>{selectedAppointment.customer.loyalty_points}</strong> pts</span>
                                    </div>
                                    {selectedAppointment.customer.active_membership && (
                                        <div className="flex items-center gap-2">
                                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                                            <span className="text-xs font-semibold text-amber-600">
                                                {selectedAppointment.customer.active_membership.plan.name} Member — {parseFloat(selectedAppointment.customer.active_membership.plan.discount_percentage).toFixed(0)}% auto-discount applied
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {!selectedAppointment ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Select an appointment to view the bill.
                                </div>
                            ) : (
                                <>
                                    {selectedAppointment.services.map(svc => (
                                        <div key={svc.id} className="flex justify-between items-center text-sm">
                                            <span>{svc.name}</span>
                                            <span className="font-medium">${parseFloat(svc.pivot.price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* Totals & Payment (Only show if selected) */}
                        {selectedAppointment && (
                            <form onSubmit={handleCheckout} className="border-t border-sidebar-border p-6 bg-muted/10 dark:border-neutral-800">
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Discount ($)</Label>
                                        <Input type="number" min="0" step="0.01" value={data.discount_amount} onChange={(e) => setData('discount_amount', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Tax ($)</Label>
                                        <Input type="number" min="0" step="0.01" value={data.tax_amount} onChange={(e) => setData('tax_amount', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <Label className="text-xs text-muted-foreground">Coupon Code</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={couponCodeInput} 
                                            onChange={e => setCouponCodeInput(e.target.value.toUpperCase())} 
                                            placeholder="ENTER CODE" 
                                            disabled={!!appliedCoupon}
                                            className="h-8 text-xs font-bold uppercase tracking-wider"
                                        />
                                        {appliedCoupon ? (
                                            <Button type="button" variant="outline" size="sm" className="h-8 text-red-500 hover:text-red-600 shrink-0" onClick={handleRemoveCoupon}>
                                                Remove
                                            </Button>
                                        ) : (
                                            <Button type="button" size="sm" className="h-8 shrink-0" onClick={handleApplyCoupon}>
                                                Apply
                                            </Button>
                                        )}
                                    </div>
                                    {couponError && <p className="text-3xs text-red-500 mt-1">{couponError}</p>}
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    {membershipDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-amber-600">
                                            <span className="flex items-center gap-1"><Crown className="h-3 w-3" /> Membership discount</span>
                                            <span>-${membershipDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {pointsDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-violet-600">
                                            <span className="flex items-center gap-1"><Gift className="h-3 w-3" /> Points redemption ({data.redeem_points} pts)</span>
                                            <span>-${pointsDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-pink-600">
                                            <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> Coupon ({appliedCoupon?.code})</span>
                                            <span>-${couponDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-2xl font-bold border-t border-sidebar-border pt-3 dark:border-neutral-800">
                                        <span>Total</span>
                                        <span className="text-emerald-600">${total.toFixed(2)}</span>
                                    </div>
                                </div>                                <div className="space-y-4">
                                    {/* Redeem Points Toggle */}
                                    {selectedAppointment?.customer && selectedAppointment.customer.loyalty_points > 0 && (
                                        <div className="rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30 p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-2 text-xs font-bold text-violet-700 dark:text-violet-400 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={redeemEnabled}
                                                        onChange={e => {
                                                            setRedeemEnabled(e.target.checked);
                                                            if (!e.target.checked) setData('redeem_points', '0');
                                                        }}
                                                        className="accent-violet-600"
                                                    />
                                                    <Gift className="h-3.5 w-3.5" />
                                                    Redeem Loyalty Points
                                                </label>
                                                <span className="text-xs text-violet-500">{selectedAppointment.customer.loyalty_points} pts available</span>
                                            </div>
                                            {redeemEnabled && (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max={selectedAppointment.customer.loyalty_points}
                                                        value={data.redeem_points}
                                                        onChange={e => setData('redeem_points', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">= ${pointsDiscount.toFixed(2)} off</span>
                                                </div>
                                            )}
                                            {errors.redeem_points && <p className="text-xs text-destructive">{errors.redeem_points}</p>}
                                        </div>
                                    )}

                                    {/* Split Payment Toggle */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="split_enabled"
                                            checked={splitEnabled}
                                            onChange={e => setSplitEnabled(e.target.checked)}
                                            className="accent-primary h-4 w-4 cursor-pointer"
                                        />
                                        <Label htmlFor="split_enabled" className="text-xs font-bold cursor-pointer flex items-center gap-1">
                                            <Ticket className="h-3.5 w-3.5 text-muted-foreground" /> Split Payment
                                        </Label>
                                    </div>

                                    {splitEnabled ? (
                                        <div className="space-y-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-muted/20">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-3xs font-extrabold uppercase text-muted-foreground">Payment Segments</span>
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 px-1.5 text-3xs font-bold"
                                                    onClick={() => setSplitSegments([...splitSegments, { method: 'cash', amount: '' }])}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" /> Add
                                                </Button>
                                            </div>

                                            {splitSegments.map((segment, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <Select 
                                                        value={segment.method} 
                                                        onValueChange={v => {
                                                            const newSegments = [...splitSegments];
                                                            newSegments[idx].method = v;
                                                            setSplitSegments(newSegments);
                                                        }}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs flex-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="cash">Cash</SelectItem>
                                                            <SelectItem value="card">Card</SelectItem>
                                                            <SelectItem value="wallet">Wallet</SelectItem>
                                                            <SelectItem value="credit">Credit</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Amount ($)"
                                                        value={segment.amount}
                                                        onChange={e => {
                                                            const newSegments = [...splitSegments];
                                                            newSegments[idx].amount = e.target.value;
                                                            setSplitSegments(newSegments);
                                                        }}
                                                        className="h-8 w-28 text-xs"
                                                    />
                                                    {splitSegments.length > 1 && (
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-red-500"
                                                            onClick={() => setSplitSegments(splitSegments.filter((_, i) => i !== idx))}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}

                                            <div className="flex justify-between items-center text-xs border-t border-neutral-200 dark:border-neutral-800 pt-2 mt-2">
                                                <span className="font-semibold">Sum: ${splitTotalSum.toFixed(2)}</span>
                                                <span className={splitMismatched ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
                                                    {splitMismatched ? `Need: $${total.toFixed(2)}` : 'Matched!'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label>Payment Method</Label>
                                            <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash"><div className="flex items-center gap-2"><Banknote className="h-4 w-4"/> Cash</div></SelectItem>
                                                    <SelectItem value="card"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4"/> Card</div></SelectItem>
                                                    <SelectItem value="wallet"><div className="flex items-center gap-2"><Wallet className="h-4 w-4"/> Wallet</div></SelectItem>
                                                    <SelectItem value="credit"><div className="flex items-center gap-2"><Ticket className="h-4 w-4"/> Credit</div></SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.payment_method && <p className="text-xs text-destructive mt-1">{errors.payment_method}</p>}
                                        </div>
                                    )}

                                    <Button type="submit" size="lg" disabled={processing || splitMismatched} className="w-full font-semibold">
                                        Process Payment
                                    </Button>
                                </div>
                            </form>
                        )}

                    </div>

                </div>
            </div>
        </>
    );
}
