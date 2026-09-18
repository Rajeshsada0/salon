import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Ticket,
    Plus,
    Percent,
    DollarSign,
    Calendar,
    UserCheck,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CouponCode {
    id: number;
    code: string;
    type: string; // percentage, fixed
    value: string;
    expires_at: string | null;
    is_active: boolean;
    max_uses: number | null;
    uses_count: number;
}

interface Props {
    coupons: CouponCode[];
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CouponsIndex({ coupons }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<CouponCode | null>(null);

    const openCreateDialog = () => {
        setEditingCoupon(null);
        setIsOpen(true);
    };

    const handleEdit = (coupon: CouponCode) => {
        setEditingCoupon(coupon);
        setIsOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this coupon code?')) {
            router.delete(`/coupons/${id}`, {
                onSuccess: () => toast.success('Coupon code deleted.'),
                onError: () => toast.error('Failed to delete coupon.'),
            });
        }
    };

    return (
        <>
            <Head title="Coupon Codes" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-6 dark:border-neutral-800">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Coupons & Promo Codes</h1>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">
                            Create fixed-discount or percentage discount coupons to apply at the POS checkout.
                        </p>
                    </div>
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create Coupon Code
                    </Button>
                </div>

                {/* Coupon Cards Grid */}
                {coupons.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center text-muted-foreground">
                        <Ticket className="h-8 w-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No coupons available. Create one to get started!</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {coupons.map((coupon) => {
                            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                            const isValid = coupon.is_active && !isExpired && (coupon.max_uses === null || coupon.uses_count < coupon.max_uses);

                            return (
                                <div key={coupon.id} className={`rounded-xl border p-5 bg-card shadow-sm transition-all flex flex-col justify-between ${
                                    isValid 
                                        ? 'border-neutral-100 dark:border-neutral-800' 
                                        : 'border-red-200 dark:border-red-950 opacity-60'
                                }`}>
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <Ticket className={`h-5 w-5 ${isValid ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <h3 className="font-extrabold text-base tracking-wide uppercase text-foreground">{coupon.code}</h3>
                                            </div>
                                            <span className={`text-3xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                isValid 
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                                                    : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                                            }`}>
                                                {isValid ? 'Active' : isExpired ? 'Expired' : 'Limit Reached'}
                                            </span>
                                        </div>

                                        <div className="mt-4 flex items-baseline gap-1">
                                            <span className="text-3xl font-black">
                                                {coupon.type === 'percentage' 
                                                    ? `${parseFloat(coupon.value).toFixed(0)}%` 
                                                    : `$${parseFloat(coupon.value).toFixed(2)}`
                                                }
                                            </span>
                                            <span className="text-xs text-muted-foreground font-semibold">off services</span>
                                        </div>

                                        <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>Expires: {coupon.expires_at || 'Never'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <UserCheck className="h-3.5 w-3.5" />
                                                <span>Redemptions: <strong>{coupon.uses_count}</strong> {coupon.max_uses !== null && ` / ${coupon.max_uses}`}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-1.5 border-t border-neutral-100 dark:border-neutral-800/60 pt-4">
                                        <Button variant="outline" size="sm" className="h-8" onClick={() => handleEdit(coupon)}>
                                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(coupon.id)}>
                                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Coupon Dialog */}
            <CouponDialog isOpen={isOpen} setIsOpen={setIsOpen} coupon={editingCoupon} />
        </>
    );
}

// ─── Coupon Dialog ─────────────────────────────────────────────────────────────

function CouponDialog({
    isOpen,
    setIsOpen,
    coupon,
}: {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    coupon: CouponCode | null;
}) {
    const { data, setData, post, put, processing, reset, errors } = useForm({
        code: coupon?.code || '',
        type: coupon?.type || 'percentage',
        value: coupon?.value || '',
        expires_at: coupon?.expires_at || '',
        max_uses: coupon?.max_uses?.toString() || '',
        is_active: coupon?.is_active ?? true,
    });

    React.useEffect(() => {
        if (coupon) {
            setData({
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                expires_at: coupon.expires_at || '',
                max_uses: coupon.max_uses?.toString() || '',
                is_active: coupon.is_active,
            });
        } else {
            reset();
        }
    }, [coupon]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            onSuccess: () => { reset(); setIsOpen(false); toast.success(coupon ? 'Coupon updated.' : 'Coupon created!'); },
            onError: () => toast.error('Error saving coupon code.'),
        };

        if (coupon) {
            put(`/coupons/${coupon.id}`, options);
        } else {
            post('/coupons', options);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{coupon ? 'Edit Coupon Code' : 'Create Coupon Code'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1">
                        <Label className="text-3xs font-extrabold uppercase">Coupon Code *</Label>
                        <Input value={data.code} onChange={e => setData('code', e.target.value.toUpperCase())} placeholder="e.g. SUMMER50, SAVE20" required />
                        {errors.code && <p className="text-3xs text-red-500">{errors.code}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                            <Label className="text-3xs font-extrabold uppercase">Discount Type *</Label>
                            <Select value={data.type} onValueChange={v => setData('type', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-3xs font-extrabold uppercase">Discount Value *</Label>
                            <div className="relative">
                                {data.type === 'fixed' ? (
                                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Percent className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                )}
                                <Input type="number" step="0.01" className="pl-7" value={data.value} onChange={e => setData('value', e.target.value)} required />
                            </div>
                            {errors.value && <p className="text-3xs text-red-500">{errors.value}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                            <Label className="text-3xs font-extrabold uppercase">Expiry Date</Label>
                            <Input type="date" value={data.expires_at} onChange={e => setData('expires_at', e.target.value)} />
                            {errors.expires_at && <p className="text-3xs text-red-500">{errors.expires_at}</p>}
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-3xs font-extrabold uppercase">Max Redemptions</Label>
                            <Input type="number" min="1" value={data.max_uses} onChange={e => setData('max_uses', e.target.value)} placeholder="Unlimited" />
                            {errors.max_uses && <p className="text-3xs text-red-500">{errors.max_uses}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={data.is_active}
                            onChange={e => setData('is_active', e.target.checked)}
                            className="accent-primary h-4 w-4 cursor-pointer"
                        />
                        <Label htmlFor="is_active" className="text-xs font-bold cursor-pointer">Active and redeemable</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {coupon ? 'Save Changes' : 'Create Coupon'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Layout association
CouponsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Coupons', href: '/coupons' }]}>
        {page}
    </AppLayout>
);
