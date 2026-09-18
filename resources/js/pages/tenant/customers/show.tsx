import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, Mail, MapPin, Star, Wallet, Calendar, User, FileText } from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    mobile: string | null;
    email: string | null;
    gender: string | null;
    dob: string | null;
    address: string | null;
    notes: string | null;
    group: string | null;
    loyalty_points: number;
    wallet_balance: string;
    created_at: string;
}

interface Props {
    customer: Customer;
}

interface PageProps {
    tenant: {
        id: string;
        name: string;
    } | null;
}

const groupColors: Record<string, string> = {
    VIP: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Premium: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    Regular: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

export default function CustomerShow({ customer }: Props) {
    const { tenant } = usePage<PageProps>().props;

    if (!tenant) {
        return (
            <div className="p-6 text-center text-destructive">
                Error: Tenant context not loaded.
            </div>
        );
    }

    return (
        <>
            <Head title={`Customer — ${customer.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">

                {/* Back Button */}
                <div>
                    <Button
                        variant="ghost"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => router.get('/customers')}
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Customers
                    </Button>
                </div>

                {/* Profile Header */}
                <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl font-bold text-white">
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
                                <div className="mt-1 flex items-center gap-3">
                                    {customer.group && (
                                        <Badge variant="outline" className={groupColors[customer.group] || 'bg-muted text-muted-foreground'}>
                                            {customer.group}
                                        </Badge>
                                    )}
                                    {customer.gender && (
                                        <span className="text-xs capitalize text-muted-foreground dark:text-neutral-400">
                                            {customer.gender}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4">
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3 text-center">
                                <div className="flex items-center gap-1.5 text-amber-600">
                                    <Star className="h-4 w-4" />
                                    <span className="text-xl font-bold">{customer.loyalty_points}</span>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">Loyalty Points</p>
                            </div>
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3 text-center">
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <Wallet className="h-4 w-4" />
                                    <span className="text-xl font-bold">${parseFloat(customer.wallet_balance).toFixed(2)}</span>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">Wallet Balance</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid gap-6 md:grid-cols-2">

                    {/* Contact Information */}
                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <h3 className="mb-4 text-sm font-semibold text-muted-foreground dark:text-neutral-400 uppercase tracking-wider">
                            Contact Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted dark:bg-neutral-800">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-neutral-400">Mobile</p>
                                    <p className="text-sm font-medium">{customer.mobile || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted dark:bg-neutral-800">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-neutral-400">Email</p>
                                    <p className="text-sm font-medium">{customer.email || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted dark:bg-neutral-800">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-neutral-400">Address</p>
                                    <p className="text-sm font-medium">{customer.address || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <h3 className="mb-4 text-sm font-semibold text-muted-foreground dark:text-neutral-400 uppercase tracking-wider">
                            Personal Details
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted dark:bg-neutral-800">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-neutral-400">Gender</p>
                                    <p className="text-sm font-medium capitalize">{customer.gender || 'Not specified'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted dark:bg-neutral-800">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-neutral-400">Date of Birth</p>
                                    <p className="text-sm font-medium">{customer.dob || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted dark:bg-neutral-800">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-neutral-400">Notes</p>
                                    <p className="text-sm font-medium">{customer.notes || 'No notes'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity / History placeholder */}
                <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground dark:text-neutral-400 uppercase tracking-wider">
                        Appointment History
                    </h3>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground dark:text-neutral-400">
                            No appointment history yet.
                        </p>
                        <p className="text-xs text-muted-foreground/60 dark:text-neutral-500 mt-1">
                            Appointment records will appear here once the booking module is available.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
