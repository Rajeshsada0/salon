import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Clock, DollarSign, User, Scissors, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Customer { id: number; name: string; mobile: string | null; }
interface Staff { id: number; name: string; }
interface Service { id: number; name: string; price: string; duration_minutes: number; }

interface Props {
    customers: Customer[];
    staff: Staff[];
    services: Service[];
}

export default function AppointmentsCreate({ customers, staff, services }: Props) {
    const [selectedServices, setSelectedServices] = useState<number[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        staff_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        notes: '',
        services: [] as number[],
    });

    const handleServiceToggle = (id: number) => {
        let newSelected;
        if (selectedServices.includes(id)) {
            newSelected = selectedServices.filter(s => s !== id);
        } else {
            newSelected = [...selectedServices, id];
        }
        setSelectedServices(newSelected);
        setData('services', newSelected);
    };

    // Calculate dynamic totals based on selected services
    const totals = useMemo(() => {
        return selectedServices.reduce(
            (acc, id) => {
                const svc = services.find(s => s.id === id);
                if (svc) {
                    acc.price += parseFloat(svc.price);
                    acc.duration += svc.duration_minutes;
                }
                return acc;
            },
            { price: 0, duration: 0 }
        );
    }, [selectedServices, services]);

    // Calculate end time
    const computedEndTime = useMemo(() => {
        if (!data.start_time || totals.duration === 0) return '—';
        const [hours, minutes] = data.start_time.split(':').map(Number);
        const dateObj = new Date();
        dateObj.setHours(hours, minutes, 0);
        dateObj.setMinutes(dateObj.getMinutes() + totals.duration);
        return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [data.start_time, totals.duration]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedServices.length === 0) {
            toast.error('Please select at least one service.');
            return;
        }
        post('/appointments', {
            onSuccess: () => toast.success('Appointment booked successfully!'),
            onError: (err) => {
                if (err.overlap) {
                    toast.error(err.overlap);
                } else {
                    toast.error('Failed to book appointment. Check the inputs.');
                }
            }
        });
    };

    return (
        <>
            <Head title="Book Appointment" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.get('/appointments')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">New Appointment</h2>
                        <p className="text-sm text-muted-foreground">Schedule a new booking for a customer.</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_350px]">
                    
                    {/* Form Section */}
                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* People */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Who</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Customer *</Label>
                                        <Select value={data.customer_id} onValueChange={(v) => setData('customer_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                                            <SelectContent>
                                                {customers.map(c => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name} {c.mobile ? `(${c.mobile})` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Staff (Stylist) *</Label>
                                        <Select value={data.staff_id} onValueChange={(v) => setData('staff_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Assign staff..." /></SelectTrigger>
                                            <SelectContent>
                                                {staff.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.staff_id && <p className="text-xs text-destructive">{errors.staff_id}</p>}
                                        {errors.overlap && <p className="text-xs text-destructive font-semibold mt-1">{errors.overlap}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* When */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">When</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Date *</Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="date" 
                                                value={data.date} 
                                                onChange={(e) => setData('date', e.target.value)} 
                                                className="pl-9" 
                                                required 
                                            />
                                        </div>
                                        {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Start Time *</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="time" 
                                                value={data.start_time} 
                                                onChange={(e) => setData('start_time', e.target.value)} 
                                                className="pl-9" 
                                                required 
                                            />
                                        </div>
                                        {errors.start_time && <p className="text-xs text-destructive">{errors.start_time}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Services Selection */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Services *</h3>
                                <div className="rounded-lg border border-sidebar-border divide-y divide-sidebar-border dark:border-neutral-800 dark:divide-neutral-800 max-h-64 overflow-y-auto">
                                    {services.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">No services available.</div>
                                    ) : services.map(svc => (
                                        <label key={svc.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                                            <Checkbox 
                                                checked={selectedServices.includes(svc.id)} 
                                                onCheckedChange={() => handleServiceToggle(svc.id)} 
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{svc.name}</p>
                                                <p className="text-xs text-muted-foreground">{svc.duration_minutes} min</p>
                                            </div>
                                            <div className="font-semibold text-sm">
                                                ${parseFloat(svc.price).toFixed(2)}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.services && <p className="text-xs text-destructive">{errors.services}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Booking Notes</Label>
                                <Input 
                                    value={data.notes} 
                                    onChange={(e) => setData('notes', e.target.value)} 
                                    placeholder="Any special requests or instructions?" 
                                />
                            </div>

                        </form>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="flex flex-col gap-4">
                        <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                            <h3 className="font-semibold mb-4">Summary</h3>
                            
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Services:</span>
                                    <span className="font-medium">{selectedServices.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Duration:</span>
                                    <span className="font-medium">{totals.duration} mins</span>
                                </div>
                                <div className="flex justify-between border-b border-sidebar-border pb-4 dark:border-neutral-800">
                                    <span className="text-muted-foreground">Estimated End Time:</span>
                                    <span className="font-medium">{computedEndTime}</span>
                                </div>
                                
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-base font-semibold">Total Cost:</span>
                                    <span className="text-2xl font-bold text-emerald-600">${totals.price.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" form="booking-form" size="lg" disabled={processing} className="w-full">
                            Confirm Booking
                        </Button>
                    </div>

                </div>
            </div>
        </>
    );
}
