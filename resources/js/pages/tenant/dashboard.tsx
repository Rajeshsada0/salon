import { Head, Link } from '@inertiajs/react';
import { 
    Users, 
    Calendar, 
    DollarSign, 
    Award, 
    ArrowRight, 
    Plus, 
    Scissors, 
    FileText, 
    TrendingUp, 
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    BadgeDollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Customer {
    id: number;
    name: string;
    email: string;
    mobile: string;
}

interface Staff {
    id: number;
    name: string;
}

interface Service {
    id: number;
    name: string;
    price: string;
}

interface Appointment {
    id: number;
    customer_id: number;
    staff_id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    total_amount: string;
    notes: string | null;
    customer?: Customer;
    staff?: Staff;
    services?: Service[];
}

interface Invoice {
    id: number;
    appointment_id: number | null;
    customer_id: number | null;
    invoice_number: string;
    total_amount: string;
    payment_method: string | null;
    status: string;
    created_at: string;
    customer?: Customer;
}

interface DashboardMetrics {
    staffCount: number;
    bookings: { total: number; pending: number };
    revenue: { daily: number };
    customers: { total: number; newToday: number };
}

interface Props {
    metrics: DashboardMetrics;
    recentAppointments: Appointment[];
    recentInvoices: Invoice[];
}

// Helper to format time (e.g. 10:00:00 -> 10:00 AM)
function formatTime(timeStr: string) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

// Helper to get initials from name
function getInitials(name: string) {
    if (!name) return 'C';
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

// Helper to get relative time for invoices
function getRelativeTime(dateStr: string) {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Today';
    }
}

export default function TenantDashboard({ metrics, recentAppointments = [], recentInvoices = [] }: Props) {
    const todayStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <>
            <Head title="Salon Overview" />
            
            <div className="flex flex-col gap-6 p-6">
                
                {/* Modern Banner Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 p-6 text-white shadow-lg dark:from-violet-950 dark:via-indigo-950 dark:to-neutral-900">
                    <div className="absolute right-0 top-0 h-64 w-64 -translate-y-12 translate-x-12 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute left-1/3 bottom-0 h-32 w-32 translate-y-12 rounded-full bg-indigo-400/20 blur-2xl"></div>
                    
                    <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-md">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Live Salon Operations
                            </span>
                            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Hello, Salon Owner ✨</h1>
                            <p className="mt-1 text-sm text-indigo-100/90 font-medium">
                                Here is what's happening at your salon today &mdash; {todayStr}
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2.5">
                            <Link href="/appointments/create">
                                <Button className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm transition-transform active:scale-95 border-none">
                                    <Plus className="mr-1.5 h-4 w-4 stroke-[2.5]" /> Book Appointment
                                </Button>
                            </Link>
                            <Link href="/pos">
                                <Button className="bg-indigo-500/30 text-white border border-white/20 hover:bg-indigo-500/40 font-semibold backdrop-blur-md transition-transform active:scale-95">
                                    <BadgeDollarSign className="mr-1.5 h-4 w-4" /> POS Terminal
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Glassmorphic Metrics Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    
                    {/* Active Staff */}
                    <div className="group relative overflow-hidden rounded-xl border border-sidebar-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="absolute -right-4 -bottom-4 text-violet-500/10 transition-transform duration-300 group-hover:scale-125">
                            <Users className="h-24 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stylists & Staff</h3>
                            <div className="rounded-lg bg-violet-50 p-2 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tight">{metrics.staffCount}</span>
                            <span className="text-xs text-muted-foreground font-medium">on duty</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Active stylists serving clients</p>
                    </div>

                    {/* Bookings */}
                    <div className="group relative overflow-hidden rounded-xl border border-sidebar-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="absolute -right-4 -bottom-4 text-indigo-500/10 transition-transform duration-300 group-hover:scale-125">
                            <Calendar className="h-24 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Bookings</h3>
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tight">{metrics.bookings.total}</span>
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                {metrics.bookings.pending} pending
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Total appointments scheduled today</p>
                    </div>

                    {/* Daily Revenue */}
                    <div className="group relative overflow-hidden rounded-xl border border-sidebar-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="absolute -right-4 -bottom-4 text-emerald-500/10 transition-transform duration-300 group-hover:scale-125">
                            <DollarSign className="h-24 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Revenue</h3>
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <DollarSign className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-xs font-bold text-muted-foreground">$</span>
                            <span className="text-3xl font-black tracking-tight">{metrics.revenue.daily.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">Closed sales transactions</p>
                    </div>

                    {/* Customers */}
                    <div className="group relative overflow-hidden rounded-xl border border-sidebar-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="absolute -right-4 -bottom-4 text-rose-500/10 transition-transform duration-300 group-hover:scale-125">
                            <Award className="h-24 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Customers</h3>
                            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                <Award className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tight">{metrics.customers.total}</span>
                            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                                +{metrics.customers.newToday} today
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Loyalty client registry database</p>
                    </div>

                </div>

                {/* Timeline and Billings section */}
                <div className="grid gap-6 lg:grid-cols-3">
                    
                    {/* Today's Schedule Timeline Widget */}
                    <div className="lg:col-span-2 rounded-2xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615] flex flex-col justify-between min-h-[400px]">
                        <div>
                            <div className="flex items-center justify-between border-b border-sidebar-border pb-4 dark:border-neutral-800">
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">Today's Schedule</h3>
                                    <p className="text-xs text-muted-foreground">Chronological timeline of bookings today</p>
                                </div>
                                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                    {recentAppointments.length} Booked
                                </span>
                            </div>

                            {/* Timeline List */}
                            <div className="mt-4 space-y-4">
                                {recentAppointments.length > 0 ? (
                                    recentAppointments.map((apt, index) => (
                                        <div key={apt.id} className="relative flex gap-4 pl-4 group">
                                            {/* Timeline Node Connector */}
                                            {index !== recentAppointments.length - 1 && (
                                                <span className="absolute left-6 top-8 bottom-0 w-0.5 bg-neutral-100 dark:bg-neutral-800"></span>
                                            )}
                                            
                                            {/* Timeline Node Dot */}
                                            <div className="relative z-10 flex h-5 w-5 translate-y-1 items-center justify-center rounded-full border-2 border-card bg-indigo-600 dark:border-neutral-900">
                                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                            </div>

                                            {/* Card Contents */}
                                            <div className="flex-1 rounded-xl bg-muted/30 p-4 border border-transparent transition-all duration-300 hover:border-sidebar-border hover:bg-muted/50 dark:bg-neutral-900/30 dark:hover:border-neutral-800">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                    
                                                    {/* Time & Client Name */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-sm">
                                                            {getInitials(apt.customer?.name || '')}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold">{apt.customer?.name || 'Walk-in Client'}</h4>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 font-medium">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge & Staff */}
                                                    <div className="flex items-center sm:flex-col sm:items-end gap-2">
                                                        <span className={`rounded-full px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider ${
                                                            apt.status === 'completed' 
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                : apt.status === 'confirmed'
                                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                        }`}>
                                                            {apt.status}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground font-medium sm:mt-1">
                                                            Stylist: <span className="font-bold text-foreground">{apt.staff?.name || 'Any'}</span>
                                                        </span>
                                                    </div>

                                                </div>

                                                {/* Services List tags */}
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {apt.services && apt.services.map(s => (
                                                        <span key={s.id} className="inline-flex items-center rounded-md bg-sidebar-border/30 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>

                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="rounded-full bg-muted p-4 text-muted-foreground dark:bg-neutral-900">
                                            <Calendar className="h-8 w-8" />
                                        </div>
                                        <h4 className="mt-4 text-sm font-semibold">No appointments scheduled today</h4>
                                        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                                            Schedule your clients for styling, treatments, or color services.
                                        </p>
                                        <Link href="/appointments/create" className="mt-4">
                                            <Button size="sm">Create Appointment</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {recentAppointments.length > 0 && (
                            <Link href="/appointments" className="block border-t border-sidebar-border mt-6 pt-4 text-center text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:border-neutral-800 dark:text-indigo-400">
                                View Full Appointment Calendar &rarr;
                            </Link>
                        )}
                    </div>

                    {/* Recent Billings Activity Feed */}
                    <div className="rounded-2xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615] flex flex-col justify-between min-h-[400px]">
                        <div>
                            <div className="flex items-center justify-between border-b border-sidebar-border pb-4 dark:border-neutral-800">
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">Recent Sales</h3>
                                    <p className="text-xs text-muted-foreground">Latest invoices & checkouts</p>
                                </div>
                                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                            </div>

                            {/* Billing List */}
                            <div className="mt-4 space-y-4">
                                {recentInvoices.length > 0 ? (
                                    recentInvoices.map(invoice => (
                                        <div key={invoice.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground dark:bg-neutral-900">
                                                    <FileText className="h-4 w-4 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                        {invoice.invoice_number}
                                                    </h4>
                                                    <p className="text-sm font-semibold mt-0.5">
                                                        {invoice.customer?.name || 'Walk-in Client'}
                                                    </p>
                                                    <span className="text-3xs text-muted-foreground uppercase font-black px-1.5 py-0.25 rounded bg-neutral-100 dark:bg-neutral-800">
                                                        {invoice.payment_method || 'cash'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                    +${parseFloat(invoice.total_amount).toFixed(2)}
                                                </span>
                                                <p className="text-3xs text-muted-foreground mt-0.5">
                                                    {getRelativeTime(invoice.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="rounded-full bg-muted p-4 text-muted-foreground dark:bg-neutral-900">
                                            <FileText className="h-8 w-8" />
                                        </div>
                                        <h4 className="mt-4 text-sm font-semibold">No recent sales</h4>
                                        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                                            Complete checkouts at the POS terminal to generate invoice transactions.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {recentInvoices.length > 0 && (
                            <Link href="/pos" className="block border-t border-sidebar-border mt-6 pt-4 text-center text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:border-neutral-800 dark:text-indigo-400">
                                Open POS to Checkout Bills &rarr;
                            </Link>
                        )}
                    </div>

                </div>

                {/* Premium Shortcut Features */}
                <div className="grid gap-4 md:grid-cols-3">
                    
                    {/* POS Shortcut */}
                    <div className="group rounded-xl border border-sidebar-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-[#161615] flex flex-col justify-between">
                        <div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                                <BadgeDollarSign className="h-5 w-5" />
                            </div>
                            <h4 className="text-base font-bold mt-4">POS Billing Terminal</h4>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Process walk-ins, charge client appointments, apply discounts, and issue invoices instantly.
                            </p>
                        </div>
                        <Link href="/pos" className="mt-4">
                            <Button size="sm" variant="outline" className="w-full justify-between transition-colors group-hover:bg-violet-500 group-hover:text-white dark:group-hover:bg-violet-700">
                                Open POS Register <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* Services Catalog Shortcut */}
                    <div className="group rounded-xl border border-sidebar-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-[#161615] flex flex-col justify-between">
                        <div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <Scissors className="h-5 w-5" />
                            </div>
                            <h4 className="text-base font-bold mt-4">Service & Packages Catalog</h4>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Add service items, customize pricing, structure durations, and bundle services into discount packages.
                            </p>
                        </div>
                        <Link href="/services" className="mt-4">
                            <Button size="sm" variant="outline" className="w-full justify-between transition-colors group-hover:bg-indigo-500 group-hover:text-white dark:group-hover:bg-indigo-700">
                                Manage Services <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* Reports Shortcut */}
                    <div className="group rounded-xl border border-sidebar-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-[#161615] flex flex-col justify-between">
                        <div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <h4 className="text-base font-bold mt-4">Reporting & Analytics</h4>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Monitor historical analytics, aggregate top services, trace payment splits, and review stylist commissions.
                            </p>
                        </div>
                        <Link href="/reports" className="mt-4">
                            <Button size="sm" variant="outline" className="w-full justify-between transition-colors group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:bg-emerald-750">
                                View Analytics Reports <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                </div>

            </div>
        </>
    );
}

TenantDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Salon Dashboard',
            href: '/dashboard',
        },
    ],
};
