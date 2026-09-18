import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar as CalendarIcon, Clock, User, Scissors, DollarSign, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

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
    customer: { id: number; name: string; mobile: string | null };
    staff: { id: number; name: string };
    services: Service[];
}

interface Props {
    appointments: Appointment[];
    currentDate: string;
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

export default function AppointmentsIndex({ appointments, currentDate }: Props) {
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        router.get('/appointments', { date: e.target.value }, { preserveState: true });
    };

    const changeDate = (days: number) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + days);
        const newDate = d.toISOString().split('T')[0];
        router.get('/appointments', { date: newDate }, { preserveState: true });
    };

    const formatTime = (timeStr: string) => {
        return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const updateStatus = (id: number, status: string) => {
        router.patch(`/appointments/${id}/status`, { status }, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Appointments Schedule" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">

                {/* Header Toolbar */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Schedule</h2>
                        <p className="text-sm text-muted-foreground dark:text-neutral-400">
                            Manage daily appointments and status.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Navigation */}
                        <div className="flex items-center rounded-md border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                            <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="h-9 w-9 rounded-r-none border-r border-sidebar-border dark:border-neutral-800">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="relative">
                                <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <input
                                    type="date"
                                    value={currentDate}
                                    onChange={handleDateChange}
                                    className="h-9 w-36 bg-transparent pl-9 pr-3 text-sm focus:outline-none"
                                />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => changeDate(1)} className="h-9 w-9 rounded-l-none border-l border-sidebar-border dark:border-neutral-800">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center rounded-md border border-sidebar-border bg-muted/50 p-1 dark:border-neutral-800 dark:bg-[#1c1c1a]">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1 text-xs font-medium rounded-sm ${viewMode === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`px-3 py-1 text-xs font-medium rounded-sm ${viewMode === 'kanban' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
                            >
                                Board
                            </button>
                        </div>

                        <Button onClick={() => router.get('/appointments/create')} className="gap-2">
                            <Plus className="h-4 w-4" /> Book Slot
                        </Button>
                    </div>
                </div>

                {/* List View */}
                {viewMode === 'list' && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-sidebar-border bg-muted/50 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Staff</th>
                                    <th className="p-4">Services</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border dark:divide-neutral-800 text-sm">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No appointments scheduled for this date.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-muted/30 dark:hover:bg-[#1c1c1b]">
                                            <td className="p-4">
                                                <div className="font-medium text-emerald-600 dark:text-emerald-400">
                                                    {formatTime(apt.start_time)}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    to {formatTime(apt.end_time)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium">{apt.customer.name}</p>
                                                {apt.customer.mobile && <p className="text-xs text-muted-foreground">{apt.customer.mobile}</p>}
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                                                    <User className="h-3 w-3" /> {apt.staff.name}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    {apt.services.map(s => (
                                                        <span key={s.id} className="truncate max-w-[150px]">— {s.name}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 font-semibold text-emerald-600">
                                                ${parseFloat(apt.total_amount).toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                <Select value={apt.status} onValueChange={(v) => updateStatus(apt.id, v)}>
                                                    <SelectTrigger className={`h-8 border-0 ${statusColors[apt.status]}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(statusLabels).map(([key, label]) => (
                                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.get(`/appointments/${apt.id}`)}
                                                    className="h-8 w-8 text-muted-foreground"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Kanban / Board View */}
                {viewMode === 'kanban' && (
                    <div className="mt-2 grid flex-1 grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 overflow-x-auto pb-4">
                        {['pending', 'confirmed', 'in_progress', 'completed'].map(status => (
                            <div key={status} className="flex min-w-[280px] flex-col gap-3 rounded-xl border border-sidebar-border bg-muted/20 p-3 dark:border-neutral-800 dark:bg-[#161615]">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="font-semibold text-sm">{statusLabels[status]}</h3>
                                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                        {appointments.filter(a => a.status === status).length}
                                    </Badge>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {appointments.filter(a => a.status === status).map(apt => (
                                        <div key={apt.id} className="rounded-lg border border-sidebar-border bg-card p-3 shadow-sm dark:border-neutral-800">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-medium text-sm">{apt.customer.name}</div>
                                                <div className="text-xs font-semibold text-emerald-600">{formatTime(apt.start_time)}</div>
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                                                <User className="h-3 w-3" /> {apt.staff.name}
                                            </div>
                                            <div className="text-xs border-t border-sidebar-border pt-2 mt-2 dark:border-neutral-800">
                                                <span className="font-semibold">${parseFloat(apt.total_amount).toFixed(2)}</span>
                                                <span className="text-muted-foreground ml-2">· {apt.services.length} item(s)</span>
                                            </div>
                                            {/* Quick status actions */}
                                            <div className="mt-3 flex gap-1">
                                                {status === 'pending' && <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => updateStatus(apt.id, 'confirmed')}>Confirm</Button>}
                                                {status === 'confirmed' && <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => updateStatus(apt.id, 'in_progress')}>Start</Button>}
                                                {status === 'in_progress' && <Button size="sm" variant="default" className="w-full text-xs h-7" onClick={() => updateStatus(apt.id, 'completed')}>Complete</Button>}
                                            </div>
                                        </div>
                                    ))}
                                    {appointments.filter(a => a.status === status).length === 0 && (
                                        <div className="rounded-lg border border-dashed border-sidebar-border p-4 text-center text-xs text-muted-foreground dark:border-neutral-800">
                                            Empty
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
