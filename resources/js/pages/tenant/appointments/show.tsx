import { Head, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar, User, Phone, MapPin, DollarSign, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Service {
    id: number;
    name: string;
    duration_minutes: number;
    pivot: { price: string };
}

interface Appointment {
    id: number;
    customer_id: number;
    staff_id: number;
    date: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    total_amount: string;
    notes: string | null;
    customer: { id: number; name: string; mobile: string | null; group: string | null };
    staff: { id: number; name: string };
    services: Service[];
}

interface Props {
    appointment: Appointment;
}

const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    in_progress: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    no_show: 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
};

export default function AppointmentShow({ appointment }: Props) {
    const formatTime = (timeStr: string) => {
        return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const updateStatus = (status: string) => {
        router.patch(`/appointments/${appointment.id}/status`, { status }, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`Appointment #${appointment.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                
                {/* Back Button */}
                <div>
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => router.get('/appointments')}>
                        <ArrowLeft className="h-4 w-4" /> Back to Schedule
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Left Column: Details & Services */}
                    <div className="md:col-span-2 space-y-6">
                        
                        {/* Header Card */}
                        <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">Appointment #{appointment.id}</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Scheduled on {appointment.date}
                                    </p>
                                </div>
                                <Select value={appointment.status} onValueChange={updateStatus}>
                                    <SelectTrigger className={`w-[140px] ${statusColors[appointment.status]}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-6 border-t border-sidebar-border pt-6 dark:border-neutral-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Time</p>
                                        <p className="font-semibold">{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Stylist</p>
                                        <p className="font-semibold">{appointment.staff.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Services List */}
                        <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Booked Services</h3>
                            <div className="space-y-3">
                                {appointment.services.map((svc) => (
                                    <div key={svc.id} className="flex items-center justify-between rounded-lg border border-sidebar-border p-4 dark:border-neutral-800">
                                        <div>
                                            <p className="font-medium">{svc.name}</p>
                                            <p className="text-sm text-muted-foreground">{svc.duration_minutes} minutes</p>
                                        </div>
                                        <div className="font-semibold">
                                            ${parseFloat(svc.pivot.price).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex items-center justify-between border-t border-sidebar-border pt-4 dark:border-neutral-800">
                                <span className="text-lg font-semibold">Total Amount</span>
                                <span className="text-2xl font-bold text-emerald-600">${parseFloat(appointment.total_amount).toFixed(2)}</span>
                            </div>
                        </div>

                        {appointment.notes && (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-amber-800 dark:text-amber-400">
                                <div className="flex items-center gap-2 mb-2 font-semibold">
                                    <AlertCircle className="h-4 w-4" /> Booking Notes
                                </div>
                                <p className="text-sm">{appointment.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Customer Info */}
                    <div className="space-y-6">
                        <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Customer Info</h3>
                            
                            <div className="mb-6 flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl font-bold text-white">
                                    {appointment.customer.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold">{appointment.customer.name}</p>
                                    {appointment.customer.group && (
                                        <Badge variant="outline" className="mt-1">{appointment.customer.group}</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span>{appointment.customer.mobile || 'No mobile provided'}</span>
                                </div>
                            </div>

                            <Button 
                                variant="outline" 
                                className="w-full mt-6" 
                                onClick={() => router.get(`/customers/${appointment.customer.id}`)}
                            >
                                View Full Profile
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
