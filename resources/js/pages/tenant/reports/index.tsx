import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, CreditCard, Users, Scissors, Download } from 'lucide-react';

interface ReportMetrics {
    total_revenue: string;
    revenue_by_method: { payment_method: string; total: string }[];
    staff_performance: { staff_name: string; revenue: string; appointments: number }[];
    popular_services: { item_name: string; times_booked: number; revenue_generated: string }[];
}

interface Props {
    filters: { start_date: string; end_date: string };
    metrics: ReportMetrics;
}

export default function ReportsIndex({ filters, metrics }: Props) {
    const [dateRange, setDateRange] = useState(filters);

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports', dateRange, { preserveState: true });
    };

    const maxStaffRevenue = Math.max(...metrics.staff_performance.map(s => parseFloat(s.revenue)), 1);

    return (
        <>
            <Head title="Reporting & Analytics" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
                        <p className="text-sm text-muted-foreground">Historical performance and salon insights.</p>
                    </div>

                    <form onSubmit={applyFilters} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-card p-3 rounded-lg border border-sidebar-border dark:border-neutral-800 shadow-sm">
                        <div className="flex gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Start Date</Label>
                                <Input type="date" className="h-9" value={dateRange.start_date} onChange={e => setDateRange({...dateRange, start_date: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">End Date</Label>
                                <Input type="date" className="h-9" value={dateRange.end_date} onChange={e => setDateRange({...dateRange, end_date: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="h-9">Filter</Button>
                            <a 
                                href={`/reports/export?start_date=${encodeURIComponent(dateRange.start_date)}&end_date=${encodeURIComponent(dateRange.end_date)}`}
                                download
                            >
                                <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5">
                                    <Download className="h-4 w-4" />
                                    Export CSV
                                </Button>
                            </a>
                        </div>
                    </form>
                </div>

                {/* Top Level Summary */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-emerald-900 dark:text-emerald-400">Total Period Revenue</h3>
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-4xl font-bold text-emerald-600">${parseFloat(metrics.total_revenue).toFixed(2)}</span>
                    </div>

                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Revenue by Payment Method</h3>
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-3">
                            {metrics.revenue_by_method.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No data for this period.</p>
                            ) : metrics.revenue_by_method.map(method => (
                                <div key={method.payment_method} className="flex justify-between items-center text-sm border-b border-sidebar-border pb-2 last:border-0 last:pb-0 dark:border-neutral-800">
                                    <span className="capitalize">{method.payment_method}</span>
                                    <span className="font-semibold">${parseFloat(method.total).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    
                    {/* Staff Leaderboard */}
                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center gap-2 mb-6 border-b border-sidebar-border pb-4 dark:border-neutral-800">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">Staff Performance</h3>
                        </div>
                        
                        <div className="space-y-6">
                            {metrics.staff_performance.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No staff activity recorded.</p>
                            ) : metrics.staff_performance.map(staff => {
                                const rev = parseFloat(staff.revenue);
                                const percentage = (rev / maxStaffRevenue) * 100;
                                return (
                                    <div key={staff.staff_name} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{staff.staff_name}</span>
                                            <span className="text-muted-foreground">{staff.appointments} appts &middot; <strong className="text-foreground">${rev.toFixed(2)}</strong></span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Popular Services */}
                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center gap-2 mb-6 border-b border-sidebar-border pb-4 dark:border-neutral-800">
                            <Scissors className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">Top Services</h3>
                        </div>

                        <div className="space-y-4">
                            {metrics.popular_services.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No services booked.</p>
                            ) : metrics.popular_services.map((svc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-sidebar-border bg-muted/20 dark:border-neutral-800">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-foreground text-background flex items-center justify-center font-bold text-xs">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{svc.item_name}</p>
                                            <p className="text-xs text-muted-foreground">{svc.times_booked} times booked</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-emerald-600">${parseFloat(svc.revenue_generated).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}
