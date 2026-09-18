import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    Crown,
    Plus,
    Star,
    Users,
    Percent,
    Calendar,
    Trash2,
    Edit2,
    CheckCircle,
    XCircle,
    DollarSign,
    Gift,
    Clock,
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MembershipPlan {
    id: number;
    name: string;
    price: string;
    duration_months: number;
    discount_percentage: string;
    loyalty_points_bonus: number;
    description: string | null;
    is_active: boolean;
    active_subscribers_count?: number;
}

interface CustomerMembership {
    id: number;
    customer_id: number;
    membership_plan_id: number;
    started_at: string;
    expires_at: string;
    status: string;
    customer?: { id: number; name: string; mobile: string | null };
    plan?: MembershipPlan;
}

interface Props {
    plans: MembershipPlan[];
    activeSubscriptions: CustomerMembership[];
}

// ─── Tier color mappings ───────────────────────────────────────────────────────

const tierColors: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
    Silver: {
        bg: 'bg-slate-50 dark:bg-slate-900/30',
        border: 'border-slate-300 dark:border-slate-700',
        icon: 'text-slate-500',
        badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    Gold: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-300 dark:border-amber-700',
        icon: 'text-amber-500',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    },
    Platinum: {
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        border: 'border-violet-300 dark:border-violet-700',
        icon: 'text-violet-500',
        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
    },
};

function getTierColor(name: string) {
    return tierColors[name] || {
        bg: 'bg-card',
        border: 'border-neutral-200 dark:border-neutral-700',
        icon: 'text-primary',
        badge: 'bg-muted text-muted-foreground',
    };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MembershipsIndex({ plans, activeSubscriptions }: Props) {
    const [isPlanOpen, setIsPlanOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

    const handleEdit = (plan: MembershipPlan) => {
        setEditingPlan(plan);
        setIsPlanOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this plan? All active subscribers will have their memberships cancelled.')) {
            router.delete(`/memberships/${id}`);
        }
    };

    const handleCancel = (id: number) => {
        if (confirm('Cancel this customer membership?')) {
            router.post(`/memberships/cancel/${id}`);
        }
    };

    const totalActiveSubscribers = plans.reduce((acc, p) => acc + (p.active_subscribers_count || 0), 0);

    return (
        <>
            <Head title="Membership Plans" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-6 dark:border-neutral-800">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Loyalty & Memberships</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage subscription tiers, assign plans to customers, and monitor active memberships.
                        </p>
                    </div>
                    <Button onClick={() => { setEditingPlan(null); setIsPlanOpen(true); }}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        New Membership Plan
                    </Button>
                </div>

                {/* Summary stat */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-neutral-100 bg-card p-5 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center justify-between text-muted-foreground mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider">Total Plans</span>
                            <Crown className="h-4 w-4" />
                        </div>
                        <span className="text-3xl font-black">{plans.length}</span>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-card p-5 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center justify-between text-muted-foreground mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider">Active Subscribers</span>
                            <Users className="h-4 w-4 text-indigo-500" />
                        </div>
                        <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{totalActiveSubscribers}</span>
                    </div>
                    <div className="rounded-xl border border-neutral-100 bg-card p-5 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center justify-between text-muted-foreground mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider">Loyalty Rate</span>
                            <Star className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black">10</span>
                            <span className="text-xs text-muted-foreground">pts = $1.00 off</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-5">

                    {/* Left: Plan Cards */}
                    <div className="lg:col-span-3 space-y-4">
                        <h3 className="text-base font-bold">Membership Plan Catalog</h3>
                        {plans.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 p-12 text-center text-muted-foreground">
                                <Crown className="h-8 w-8 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No membership plans yet. Create your first tier!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {plans.map((plan) => {
                                    const colors = getTierColor(plan.name);
                                    return (
                                        <div key={plan.id} className={`rounded-xl border p-5 ${colors.bg} ${colors.border}`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 dark:bg-black/20 ${colors.icon}`}>
                                                        <Crown className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-extrabold text-base">{plan.name}</h4>
                                                            <span className={`text-3xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.badge}`}>
                                                                {plan.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{plan.description || 'No description provided.'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(plan)}>
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(plan.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-4 gap-3">
                                                <div className="rounded-lg bg-white/50 dark:bg-black/20 p-2.5 text-center">
                                                    <div className={`flex justify-center mb-1 ${colors.icon}`}><DollarSign className="h-3.5 w-3.5" /></div>
                                                    <span className="text-sm font-black">${parseFloat(plan.price).toFixed(2)}</span>
                                                    <p className="text-3xs text-muted-foreground">per month</p>
                                                </div>
                                                <div className="rounded-lg bg-white/50 dark:bg-black/20 p-2.5 text-center">
                                                    <div className={`flex justify-center mb-1 ${colors.icon}`}><Clock className="h-3.5 w-3.5" /></div>
                                                    <span className="text-sm font-black">{plan.duration_months}</span>
                                                    <p className="text-3xs text-muted-foreground">months</p>
                                                </div>
                                                <div className="rounded-lg bg-white/50 dark:bg-black/20 p-2.5 text-center">
                                                    <div className={`flex justify-center mb-1 ${colors.icon}`}><Percent className="h-3.5 w-3.5" /></div>
                                                    <span className="text-sm font-black">{parseFloat(plan.discount_percentage).toFixed(0)}%</span>
                                                    <p className="text-3xs text-muted-foreground">discount</p>
                                                </div>
                                                <div className="rounded-lg bg-white/50 dark:bg-black/20 p-2.5 text-center">
                                                    <div className={`flex justify-center mb-1 ${colors.icon}`}><Gift className="h-3.5 w-3.5" /></div>
                                                    <span className="text-sm font-black">{plan.loyalty_points_bonus}</span>
                                                    <p className="text-3xs text-muted-foreground">bonus pts</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    <Users className="h-3 w-3 inline mr-1" />
                                                    {plan.active_subscribers_count || 0} active subscriber{(plan.active_subscribers_count || 0) !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right: Active Subscribers */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-base font-bold">Active Subscribers</h3>
                        <div className="overflow-hidden rounded-xl border border-neutral-100 bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                            {activeSubscriptions.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    No active memberships yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {activeSubscriptions.map((sub) => {
                                        const colors = getTierColor(sub.plan?.name || '');
                                        const daysLeft = Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / 86400000));
                                        return (
                                            <div key={sub.id} className="p-4 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.icon}`}>
                                                        <Crown className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold truncate">{sub.customer?.name}</p>
                                                        <p className="text-3xs text-muted-foreground">{sub.plan?.name} · {daysLeft}d left</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500"
                                                    onClick={() => handleCancel(sub.id)}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Plan create/edit dialog */}
            <PlanDialog
                isOpen={isPlanOpen}
                setIsOpen={setIsPlanOpen}
                plan={editingPlan}
            />
        </>
    );
}

// ─── Plan Dialog ───────────────────────────────────────────────────────────────

function PlanDialog({
    isOpen,
    setIsOpen,
    plan,
}: {
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    plan: MembershipPlan | null;
}) {
    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: plan?.name || '',
        price: plan?.price || '',
        duration_months: plan?.duration_months?.toString() || '1',
        discount_percentage: plan?.discount_percentage || '',
        loyalty_points_bonus: plan?.loyalty_points_bonus?.toString() || '0',
        description: plan?.description || '',
        is_active: plan?.is_active ?? true,
    });

    React.useEffect(() => {
        if (plan) {
            setData({
                name: plan.name,
                price: plan.price,
                duration_months: plan.duration_months.toString(),
                discount_percentage: plan.discount_percentage,
                loyalty_points_bonus: plan.loyalty_points_bonus.toString(),
                description: plan.description || '',
                is_active: plan.is_active,
            });
        } else {
            reset();
        }
    }, [plan]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (plan) {
            put(`/memberships/${plan.id}`, { onSuccess: () => { reset(); setIsOpen(false); } });
        } else {
            post('/memberships', { onSuccess: () => { reset(); setIsOpen(false); } });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{plan ? 'Edit Membership Plan' : 'Create Membership Plan'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1">
                        <Label className="text-3xs font-extrabold uppercase">Plan Name *</Label>
                        <Input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Silver, Gold, Platinum" required />
                        {errors.name && <p className="text-3xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                            <Label className="text-3xs font-extrabold uppercase">Monthly Price ($) *</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" step="0.01" className="pl-7" value={data.price} onChange={e => setData('price', e.target.value)} required />
                            </div>
                            {errors.price && <p className="text-3xs text-red-500">{errors.price}</p>}
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-3xs font-extrabold uppercase">Duration (Months) *</Label>
                            <Input type="number" min="1" value={data.duration_months} onChange={e => setData('duration_months', e.target.value)} required />
                            {errors.duration_months && <p className="text-3xs text-red-500">{errors.duration_months}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                            <Label className="text-3xs font-extrabold uppercase">Service Discount (%) *</Label>
                            <div className="relative">
                                <Percent className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" step="0.01" min="0" max="100" className="pl-7" value={data.discount_percentage} onChange={e => setData('discount_percentage', e.target.value)} required />
                            </div>
                            {errors.discount_percentage && <p className="text-3xs text-red-500">{errors.discount_percentage}</p>}
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-3xs font-extrabold uppercase">Bonus Points on Join</Label>
                            <div className="relative">
                                <Star className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" min="0" className="pl-7" value={data.loyalty_points_bonus} onChange={e => setData('loyalty_points_bonus', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <Label className="text-3xs font-extrabold uppercase">Description</Label>
                        <Textarea value={data.description} onChange={e => setData('description', e.target.value)} placeholder="Benefits of this membership tier..." />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={processing}>
                            {plan ? 'Save Changes' : 'Create Plan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Layout association
MembershipsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Memberships', href: '/memberships' }]}>
        {page}
    </AppLayout>
);
