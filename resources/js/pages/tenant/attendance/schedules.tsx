import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import {
    CalendarDays,
    Save,
    Clock,
    Toggle,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface ScheduleEntry {
    id?: number;
    day_of_week: number;
    start_time: string | null;
    end_time: string | null;
    is_off_day: boolean;
}

interface StaffUser {
    id: number;
    name: string;
    email: string;
    schedule: ScheduleEntry[];
}

interface Props {
    staff: StaffUser[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Default empty schedule ────────────────────────────────────────────────────

function buildDefaultSchedule(existing: ScheduleEntry[]): ScheduleEntry[] {
    return DAYS.map((_, index) => {
        const found = existing.find(s => s.day_of_week === index);
        return found ?? {
            day_of_week: index,
            start_time: '09:00',
            end_time: '18:00',
            is_off_day: index === 0, // Sunday off by default
        };
    });
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StaffSchedules({ staff }: Props) {
    const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id?.toString() || '');
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(() => {
        const member = staff.find(s => s.id.toString() === selectedStaffId);
        return buildDefaultSchedule(member?.schedule || []);
    });
    const [saving, setSaving] = useState(false);

    const handleStaffChange = (id: string) => {
        setSelectedStaffId(id);
        const member = staff.find(s => s.id.toString() === id);
        setSchedule(buildDefaultSchedule(member?.schedule || []));
    };

    const updateDay = (index: number, field: keyof ScheduleEntry, value: string | boolean) => {
        setSchedule(prev => prev.map((day, i) =>
            i === index ? { ...day, [field]: value } : day
        ));
    };

    const handleSave = () => {
        if (!selectedStaffId) return;
        setSaving(true);
        router.post(`/staff/schedules/${selectedStaffId}`, { schedule }, {
            onSuccess: () => toast.success('Schedule saved successfully!'),
            onError: () => toast.error('Failed to save schedule.'),
            onFinish: () => setSaving(false),
        });
    };

    const selectedStaff = staff.find(s => s.id.toString() === selectedStaffId);

    return (
        <>
            <Head title="Staff Schedules" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-6 dark:border-neutral-800">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Weekly Schedules</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configure working hours and off days for each staff member.
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={saving || !selectedStaffId}>
                        <Save className="h-4 w-4 mr-1.5" />
                        {saving ? 'Saving...' : 'Save Schedule'}
                    </Button>
                </div>

                {/* Staff Selector */}
                <div className="flex items-center gap-4 max-w-xs">
                    <Label className="text-xs font-extrabold uppercase text-muted-foreground whitespace-nowrap">Staff Member</Label>
                    <Select value={selectedStaffId} onValueChange={handleStaffChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select staff..." />
                        </SelectTrigger>
                        <SelectContent>
                            {staff.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 7-day Schedule Grid */}
                {selectedStaff && (
                    <div className="overflow-hidden rounded-xl border border-neutral-100 bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="border-b border-neutral-100 bg-muted/40 px-5 py-3 dark:border-neutral-800 dark:bg-[#1c1c1a]">
                            <h3 className="text-sm font-extrabold">
                                {selectedStaff.name} — Weekly Work Schedule
                            </h3>
                        </div>
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {schedule.map((day, index) => (
                                <div key={day.day_of_week} className={`flex items-center gap-4 px-5 py-4 transition-colors ${day.is_off_day ? 'bg-neutral-50 dark:bg-neutral-900/30 opacity-60' : 'hover:bg-muted/20'}`}>
                                    {/* Day label */}
                                    <div className="w-28 shrink-0">
                                        <span className="text-sm font-bold">{DAYS[day.day_of_week]}</span>
                                        {(day.day_of_week === 0 || day.day_of_week === 6) && (
                                            <span className="ml-2 text-xs text-muted-foreground">(Weekend)</span>
                                        )}
                                    </div>

                                    {/* Off Day toggle */}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div
                                            className={`relative h-5 w-9 rounded-full transition-colors ${day.is_off_day ? 'bg-red-400' : 'bg-emerald-500'}`}
                                            onClick={() => updateDay(index, 'is_off_day', !day.is_off_day)}
                                        >
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${day.is_off_day ? 'translate-x-0.5' : 'translate-x-4'}`} />
                                        </div>
                                        <span className={`text-xs font-semibold ${day.is_off_day ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {day.is_off_day ? 'Day Off' : 'Working'}
                                        </span>
                                    </label>

                                    {/* Time inputs */}
                                    {!day.is_off_day && (
                                        <div className="flex items-center gap-3 ml-auto">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <Label className="text-xs text-muted-foreground">Start</Label>
                                                <Input
                                                    type="time"
                                                    value={day.start_time || '09:00'}
                                                    onChange={e => updateDay(index, 'start_time', e.target.value)}
                                                    className="h-8 w-32 text-sm"
                                                />
                                            </div>
                                            <span className="text-muted-foreground">→</span>
                                            <div className="flex items-center gap-1.5">
                                                <Label className="text-xs text-muted-foreground">End</Label>
                                                <Input
                                                    type="time"
                                                    value={day.end_time || '18:00'}
                                                    onChange={e => updateDay(index, 'end_time', e.target.value)}
                                                    className="h-8 w-32 text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {day.is_off_day && (
                                        <span className="ml-auto text-xs text-muted-foreground italic">Not scheduled</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

StaffSchedules.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Attendance', href: '/attendance' },
        { title: 'Schedules', href: '/staff/schedules' },
    ]}>{page}</AppLayout>
);
