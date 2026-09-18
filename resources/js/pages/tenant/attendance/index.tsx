import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    ClipboardCheck,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Calendar,
    Users,
    FileText,
    TrendingUp,
    Plus,
    LogIn,
    LogOut,
    ChevronDown,
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffUser { id: number; name: string; email: string; }
interface DailyEntry {
    user_id: number; name: string; log_id: number | null;
    clock_in: string | null; clock_out: string | null;
    status: string; notes: string | null;
}
interface LeaveRequest {
    id: number; user_id: number; leave_type: string;
    start_date: string; end_date: string; reason: string | null;
    status: string;
    user?: StaffUser;
    approver?: StaffUser | null;
}
interface SummaryRow {
    user_id: number; name: string; working_days: number;
    present: number; absent: number; on_leave: number;
    not_marked: number; percentage: number;
}
interface Props {
    staff: StaffUser[];
    dailyAttendance: DailyEntry[];
    leaveRequests: LeaveRequest[];
    summary: SummaryRow[];
    selectedDate: string;
    selectedMonth: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    present:    { label: 'Present',    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
    absent:     { label: 'Absent',     color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                 icon: XCircle },
    half_day:   { label: 'Half Day',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         icon: AlertCircle },
    leave:      { label: 'Leave',      color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',     icon: Calendar },
    not_marked: { label: 'Not Marked', color: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',    icon: Clock },
};

const leaveStatusConfig: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AttendanceIndex({
    staff, dailyAttendance, leaveRequests, summary, selectedDate, selectedMonth,
}: Props) {
    const [activeTab, setActiveTab] = useState<'daily' | 'leaves' | 'summary'>('daily');
    const [date, setDate] = useState(selectedDate);
    const [month, setMonth] = useState(selectedMonth);
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);
    const [bulkLogs, setBulkLogs] = useState<Record<number, { status: string; clock_in: string; clock_out: string }>>(
        Object.fromEntries(dailyAttendance.map(e => [e.user_id, {
            status: e.status === 'not_marked' ? 'present' : e.status,
            clock_in: e.clock_in || '',
            clock_out: e.clock_out || '',
        }]))
    );

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        router.get('/attendance', { date: newDate, month }, { preserveState: true, replace: true });
    };

    const handleMonthChange = (newMonth: string) => {
        setMonth(newMonth);
        router.get('/attendance', { date, month: newMonth }, { preserveState: true, replace: true });
    };

    const handleBulkSave = () => {
        const logs = dailyAttendance.map(e => ({
            user_id: e.user_id,
            status: bulkLogs[e.user_id]?.status || 'present',
            clock_in: bulkLogs[e.user_id]?.clock_in || null,
            clock_out: bulkLogs[e.user_id]?.clock_out || null,
        }));
        router.post('/attendance/bulk-mark', { date, logs }, {
            onSuccess: () => toast.success('Attendance saved!'),
            onError: () => toast.error('Failed to save attendance.'),
        });
    };

    const handleLeaveAction = (id: number, action: 'approve' | 'reject') => {
        router.post(`/leaves/${id}/${action}`, {}, {
            onSuccess: () => toast.success(`Leave ${action}d successfully.`),
            onError: () => toast.error(`Failed to ${action} leave.`),
        });
    };

    const tabs = [
        { id: 'daily', label: 'Daily Log', icon: ClipboardCheck },
        { id: 'leaves', label: 'Leave Requests', icon: FileText },
        { id: 'summary', label: 'Monthly Summary', icon: TrendingUp },
    ] as const;

    return (
        <>
            <Head title="Attendance" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-6 dark:border-neutral-800">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Attendance</h1>
                        <p className="text-sm text-muted-foreground mt-1">Track daily attendance, manage leave requests, and view monthly summaries.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.post('/attendance/clock-in', {}, { onSuccess: () => toast.success('Clocked in!') })}>
                            <LogIn className="h-4 w-4 mr-1.5" /> Clock In
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.post('/attendance/clock-out', {}, { onSuccess: () => toast.success('Clocked out!') })}>
                            <LogOut className="h-4 w-4 mr-1.5" /> Clock Out
                        </Button>
                        <Button size="sm" onClick={() => setIsLeaveOpen(true)}>
                            <Plus className="h-4 w-4 mr-1.5" /> Request Leave
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit dark:bg-neutral-800/50">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-white shadow-sm dark:bg-neutral-700 text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Tab: Daily Log ── */}
                {activeTab === 'daily' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Label className="text-xs font-extrabold uppercase text-muted-foreground">Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => handleDateChange(e.target.value)}
                                    className="w-40 h-8 text-sm"
                                />
                            </div>
                            <Button size="sm" onClick={handleBulkSave}>
                                <ClipboardCheck className="h-4 w-4 mr-1.5" /> Save Attendance
                            </Button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-neutral-100 bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-100 bg-muted/40 text-xs font-bold uppercase text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                                        <th className="p-4">Staff Member</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Clock In</th>
                                        <th className="p-4">Clock Out</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                                    {dailyAttendance.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No staff found.</td></tr>
                                    ) : dailyAttendance.map(entry => {
                                        const cfg = statusConfig[entry.status] || statusConfig.not_marked;
                                        const Icon = cfg.icon;
                                        const log = bulkLogs[entry.user_id] || { status: 'present', clock_in: '', clock_out: '' };
                                        return (
                                            <tr key={entry.user_id} className="hover:bg-muted/20">
                                                <td className="p-4 font-semibold">{entry.name}</td>
                                                <td className="p-4">
                                                    <Select
                                                        value={log.status}
                                                        onValueChange={v => setBulkLogs(prev => ({ ...prev, [entry.user_id]: { ...prev[entry.user_id], status: v } }))}
                                                    >
                                                        <SelectTrigger className="h-8 w-36 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="present">✅ Present</SelectItem>
                                                            <SelectItem value="absent">❌ Absent</SelectItem>
                                                            <SelectItem value="half_day">🟠 Half Day</SelectItem>
                                                            <SelectItem value="leave">🟡 Leave</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        type="time"
                                                        value={log.clock_in}
                                                        onChange={e => setBulkLogs(prev => ({ ...prev, [entry.user_id]: { ...prev[entry.user_id], clock_in: e.target.value } }))}
                                                        className="h-8 w-32 text-xs"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        type="time"
                                                        value={log.clock_out}
                                                        onChange={e => setBulkLogs(prev => ({ ...prev, [entry.user_id]: { ...prev[entry.user_id], clock_out: e.target.value } }))}
                                                        className="h-8 w-32 text-xs"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── Tab: Leave Requests ── */}
                {activeTab === 'leaves' && (
                    <div className="overflow-hidden rounded-xl border border-neutral-100 bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-muted/40 text-xs font-bold uppercase text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                                    <th className="p-4">Staff</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Period</th>
                                    <th className="p-4">Reason</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                                {leaveRequests.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No leave requests yet.</td></tr>
                                ) : leaveRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-muted/20">
                                        <td className="p-4 font-semibold">{req.user?.name}</td>
                                        <td className="p-4 capitalize">
                                            <Badge variant="outline" className="text-xs capitalize">{req.leave_type}</Badge>
                                        </td>
                                        <td className="p-4 text-xs text-muted-foreground">
                                            {req.start_date} → {req.end_date}
                                        </td>
                                        <td className="p-4 text-xs text-muted-foreground max-w-[180px] truncate">
                                            {req.reason || '—'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${leaveStatusConfig[req.status] || ''}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                        onClick={() => handleLeaveAction(req.id, 'approve')}>
                                                        Approve
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                                        onClick={() => handleLeaveAction(req.id, 'reject')}>
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {req.status !== 'pending' && (
                                                <span className="text-xs text-muted-foreground">{req.approver?.name || '—'}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Tab: Monthly Summary ── */}
                {activeTab === 'summary' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Label className="text-xs font-extrabold uppercase text-muted-foreground">Month</Label>
                            <Input
                                type="month"
                                value={month}
                                onChange={e => handleMonthChange(e.target.value)}
                                className="w-40 h-8 text-sm"
                            />
                        </div>

                        <div className="overflow-hidden rounded-xl border border-neutral-100 bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-100 bg-muted/40 text-xs font-bold uppercase text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                                        <th className="p-4">Staff Member</th>
                                        <th className="p-4 text-center">Working Days</th>
                                        <th className="p-4 text-center">Present</th>
                                        <th className="p-4 text-center">Absent</th>
                                        <th className="p-4 text-center">Leave</th>
                                        <th className="p-4 text-center">Not Marked</th>
                                        <th className="p-4 text-center">Attendance %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                                    {summary.map(row => (
                                        <tr key={row.user_id} className="hover:bg-muted/20">
                                            <td className="p-4 font-semibold">{row.name}</td>
                                            <td className="p-4 text-center text-muted-foreground">{row.working_days}</td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-bold">
                                                    {row.present}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-0.5 text-xs font-bold">
                                                    {row.absent}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 px-2.5 py-0.5 text-xs font-bold">
                                                    {row.on_leave}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-muted-foreground text-xs">{row.not_marked}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-sm font-extrabold ${row.percentage >= 90 ? 'text-emerald-600' : row.percentage >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                                                        {row.percentage}%
                                                    </span>
                                                    <div className="w-16 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700">
                                                        <div
                                                            className={`h-1.5 rounded-full ${row.percentage >= 90 ? 'bg-emerald-500' : row.percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${row.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Leave Request Dialog */}
            <LeaveRequestDialog isOpen={isLeaveOpen} setIsOpen={setIsLeaveOpen} />
        </>
    );
}

// ─── Leave Request Dialog ──────────────────────────────────────────────────────

function LeaveRequestDialog({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        leave_type: 'casual',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/leaves', {
            onSuccess: () => { reset(); setIsOpen(false); toast.success('Leave request submitted!'); },
            onError: () => toast.error('Please fill in all required fields.'),
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-extrabold uppercase">Leave Type *</Label>
                        <Select value={data.leave_type} onValueChange={v => setData('leave_type', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sick">Sick Leave</SelectItem>
                                <SelectItem value="casual">Casual Leave</SelectItem>
                                <SelectItem value="annual">Annual Leave</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-extrabold uppercase">Start Date *</Label>
                            <Input type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} required />
                            {errors.start_date && <p className="text-xs text-red-500">{errors.start_date}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-extrabold uppercase">End Date *</Label>
                            <Input type="date" value={data.end_date} onChange={e => setData('end_date', e.target.value)} required />
                            {errors.end_date && <p className="text-xs text-red-500">{errors.end_date}</p>}
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-extrabold uppercase">Reason</Label>
                        <Textarea value={data.reason} onChange={e => setData('reason', e.target.value)} placeholder="Optional reason..." rows={3} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={processing}>Submit Request</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

AttendanceIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Attendance', href: '/attendance' }]}>{page}</AppLayout>
);
