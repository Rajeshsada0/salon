import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Clock, DollarSign, Percent, FolderOpen, Scissors, Package } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceCategory {
    id: number;
    name: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
    services_count?: number;
}

interface Service {
    id: number;
    service_category_id: number;
    name: string;
    description: string | null;
    price: string;
    duration_minutes: number;
    commission_percentage: string;
    is_active: boolean;
    category?: ServiceCategory;
}

interface ServicePackage {
    id: number;
    name: string;
    description: string | null;
    price: string;
    is_active: boolean;
    services: Service[];
}

interface Props {
    services: Service[];
    categories: ServiceCategory[];
    packages: ServicePackage[];
}

interface PageProps {
    tenant: { id: string; name: string } | null;
}

type TabType = 'categories' | 'services' | 'packages';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServicesIndex({ services, categories, packages }: Props) {
    const { tenant } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<TabType>('services');

    if (!tenant) {
        return <div className="p-6 text-center text-destructive">Error: Tenant context not loaded.</div>;
    }

    const tabs: { key: TabType; label: string; icon: React.ReactNode; count: number }[] = [
        { key: 'categories', label: 'Categories', icon: <FolderOpen className="h-4 w-4" />, count: categories.length },
        { key: 'services', label: 'Services', icon: <Scissors className="h-4 w-4" />, count: services.length },
        { key: 'packages', label: 'Packages', icon: <Package className="h-4 w-4" />, count: packages.length },
    ];

    return (
        <>
            <Head title="Services" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">

                {/* Header */}
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Services Management</h2>
                    <p className="text-sm text-muted-foreground dark:text-neutral-400">
                        Configure your salon's service categories, individual services, and packages.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg border border-sidebar-border bg-muted/50 p-1 dark:border-neutral-800 dark:bg-[#1c1c1a]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                                activeTab === tab.key
                                    ? 'bg-card text-foreground shadow-sm dark:bg-[#161615]'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                                {tab.count}
                            </Badge>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'categories' && <CategoriesTab categories={categories} />}
                {activeTab === 'services' && <ServicesTab services={services} categories={categories} />}
                {activeTab === 'packages' && <PackagesTab packages={packages} services={services} />}
            </div>
        </>
    );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab({ categories }: { categories: ServiceCategory[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<ServiceCategory | null>(null);
    const { data, setData, post, put, delete: remove, processing, errors, reset, clearErrors } = useForm({
        name: '',
        description: '',
        sort_order: '0',
        is_active: true,
    });

    const openCreate = () => { reset(); clearErrors(); setEditing(null); setIsOpen(true); };
    const openEdit = (cat: ServiceCategory) => {
        clearErrors();
        setEditing(cat);
        setData({ name: cat.name, description: cat.description || '', sort_order: cat.sort_order.toString(), is_active: cat.is_active });
        setIsOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = {
            onSuccess: () => { setIsOpen(false); toast.success(editing ? 'Category updated.' : 'Category created.'); },
            onError: () => toast.error('Please check your inputs.'),
        };
        if (editing) { put(`/services/categories/${editing.id}`, opts); }
        else { post('/services/categories', opts); }
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this category? All its services will also be deleted.')) {
            remove(`/services/categories/${id}`, {
                onSuccess: () => toast.success('Category deleted.'),
                onError: () => toast.error('Failed to delete category.'),
            });
        }
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground dark:text-neutral-400">Organize your services into logical groups.</span>
                <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Category</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-sidebar-border bg-muted/50 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                            <th className="p-4">Name</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Order</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border dark:divide-neutral-800 text-sm">
                        {categories.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No categories yet.</td></tr>
                        ) : categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-muted/30 dark:hover:bg-[#1c1c1b]">
                                <td className="p-4 font-medium">{cat.name}</td>
                                <td className="p-4 text-muted-foreground dark:text-neutral-400 max-w-xs truncate">{cat.description || '—'}</td>
                                <td className="p-4 text-muted-foreground">{cat.sort_order}</td>
                                <td className="p-4">
                                    <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                                        {cat.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
                        <DialogDescription>Service categories help organize your offerings.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cat-name">Category Name *</Label>
                            <Input id="cat-name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="E.g., Hair Care" required />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cat-desc">Description</Label>
                            <Input id="cat-desc" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Optional description" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cat-order">Sort Order</Label>
                            <Input id="cat-order" type="number" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{editing ? 'Save' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ─── Services Tab ─────────────────────────────────────────────────────────────

function ServicesTab({ services, categories }: { services: Service[]; categories: ServiceCategory[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);
    const { data, setData, post, put, delete: remove, processing, errors, reset, clearErrors } = useForm({
        service_category_id: '',
        name: '',
        description: '',
        price: '',
        duration_minutes: '',
        commission_percentage: '',
        is_active: true,
    });

    const openCreate = () => { reset(); clearErrors(); setEditing(null); setIsOpen(true); };
    const openEdit = (svc: Service) => {
        clearErrors();
        setEditing(svc);
        setData({
            service_category_id: svc.service_category_id.toString(),
            name: svc.name,
            description: svc.description || '',
            price: parseFloat(svc.price).toString(),
            duration_minutes: svc.duration_minutes.toString(),
            commission_percentage: parseFloat(svc.commission_percentage).toString(),
            is_active: svc.is_active,
        });
        setIsOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = {
            onSuccess: () => { setIsOpen(false); toast.success(editing ? 'Service updated.' : 'Service created.'); },
            onError: () => toast.error('Please check your inputs.'),
        };
        if (editing) { put(`/services/${editing.id}`, opts); }
        else { post('/services', opts); }
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this service?')) {
            remove(`/services/${id}`, {
                onSuccess: () => toast.success('Service deleted.'),
                onError: () => toast.error('Failed to delete service.'),
            });
        }
    };

    const getCategoryName = (id: number) => categories.find((c) => c.id === id)?.name || '—';

    return (
        <>
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground dark:text-neutral-400">Define individual salon services with pricing and duration.</span>
                <Button onClick={openCreate} className="gap-2" disabled={categories.length === 0}>
                    <Plus className="h-4 w-4" /> Add Service
                </Button>
            </div>
            {categories.length === 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
                    Create at least one service category first before adding services.
                </div>
            )}
            <div className="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-sidebar-border bg-muted/50 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                            <th className="p-4">Service</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Duration</th>
                            <th className="p-4">Commission</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border dark:divide-neutral-800 text-sm">
                        {services.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No services yet.</td></tr>
                        ) : services.map((svc) => (
                            <tr key={svc.id} className="hover:bg-muted/30 dark:hover:bg-[#1c1c1b]">
                                <td className="p-4">
                                    <div>
                                        <p className="font-medium">{svc.name}</p>
                                        {svc.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{svc.description}</p>}
                                    </div>
                                </td>
                                <td className="p-4"><Badge variant="outline">{getCategoryName(svc.service_category_id)}</Badge></td>
                                <td className="p-4 font-semibold">
                                    <span className="inline-flex items-center gap-0.5"><DollarSign className="h-3.5 w-3.5 text-muted-foreground" />{parseFloat(svc.price).toFixed(2)}</span>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{svc.duration_minutes} min</span>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        {parseFloat(svc.commission_percentage)}%
                                    </span>
                                </td>
                                <td className="p-4">
                                    <Badge variant={svc.is_active ? 'default' : 'secondary'}>{svc.is_active ? 'Active' : 'Inactive'}</Badge>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(svc)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(svc.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Service' : 'New Service'}</DialogTitle>
                        <DialogDescription>Define a salon service with pricing and duration.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Category *</Label>
                            <Select value={data.service_category_id} onValueChange={(val) => setData('service_category_id', val)}>
                                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.service_category_id && <p className="text-xs text-destructive">{errors.service_category_id}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="svc-name">Service Name *</Label>
                            <Input id="svc-name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="E.g., Men's Haircut" required />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="svc-desc">Description</Label>
                            <Input id="svc-desc" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Optional description" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="svc-price">Price ($) *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="svc-price" type="number" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} className="pl-8" required />
                                </div>
                                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="svc-dur">Duration (mins) *</Label>
                                <div className="relative">
                                    <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="svc-dur" type="number" value={data.duration_minutes} onChange={(e) => setData('duration_minutes', e.target.value)} className="pl-8" required />
                                </div>
                                {errors.duration_minutes && <p className="text-xs text-destructive">{errors.duration_minutes}</p>}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="svc-comm">Staff Commission (%)</Label>
                            <div className="relative">
                                <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="svc-comm" type="number" step="0.1" value={data.commission_percentage} onChange={(e) => setData('commission_percentage', e.target.value)} className="pl-8" placeholder="0" />
                            </div>
                            {errors.commission_percentage && <p className="text-xs text-destructive">{errors.commission_percentage}</p>}
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{editing ? 'Save' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ─── Packages Tab ─────────────────────────────────────────────────────────────

function PackagesTab({ packages, services }: { packages: ServicePackage[]; services: Service[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<ServicePackage | null>(null);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const { data, setData, post, put, delete: remove, processing, errors, reset, clearErrors, transform } = useForm({
        name: '',
        description: '',
        price: '',
        is_active: true,
        services: [] as number[],
    });

    // Keep services in sync
    transform((formData) => ({ ...formData, services: selectedServices }));

    const openCreate = () => {
        reset(); clearErrors(); setEditing(null); setSelectedServices([]); setIsOpen(true);
    };
    const openEdit = (pkg: ServicePackage) => {
        clearErrors();
        setEditing(pkg);
        setSelectedServices(pkg.services.map((s) => s.id));
        setData({
            name: pkg.name,
            description: pkg.description || '',
            price: parseFloat(pkg.price).toString(),
            is_active: pkg.is_active,
            services: pkg.services.map((s) => s.id),
        });
        setIsOpen(true);
    };

    const toggleService = (id: number) => {
        setSelectedServices((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = {
            onSuccess: () => { setIsOpen(false); toast.success(editing ? 'Package updated.' : 'Package created.'); },
            onError: () => toast.error('Please check your inputs.'),
        };
        if (editing) { put(`/services/packages/${editing.id}`, opts); }
        else { post('/services/packages', opts); }
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this package?')) {
            remove(`/services/packages/${id}`, {
                onSuccess: () => toast.success('Package deleted.'),
                onError: () => toast.error('Failed to delete package.'),
            });
        }
    };

    const computedDuration = (pkg: ServicePackage) =>
        pkg.services.reduce((sum, s) => sum + s.duration_minutes, 0);

    return (
        <>
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground dark:text-neutral-400">Bundle services into discounted packages.</span>
                <Button onClick={openCreate} className="gap-2" disabled={services.length === 0}>
                    <Plus className="h-4 w-4" /> Add Package
                </Button>
            </div>
            {services.length === 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
                    Create at least one service before building packages.
                </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {packages.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-sidebar-border bg-card p-8 text-center text-muted-foreground dark:border-neutral-800 dark:bg-[#161615]">
                        No packages yet.
                    </div>
                ) : packages.map((pkg) => (
                    <div key={pkg.id} className="rounded-xl border border-sidebar-border bg-card p-5 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold">{pkg.name}</h4>
                                {pkg.description && <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>}
                            </div>
                            <Badge variant={pkg.is_active ? 'default' : 'secondary'}>{pkg.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold">${parseFloat(pkg.price).toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">
                                · {computedDuration(pkg)} min total
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {pkg.services.map((svc) => (
                                <Badge key={svc.id} variant="outline" className="text-xs">
                                    {svc.name}
                                </Badge>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-1 border-t border-sidebar-border pt-3 dark:border-neutral-800">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)} className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Package' : 'New Package'}</DialogTitle>
                        <DialogDescription>Bundle multiple services into a single package with a special price.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="pkg-name">Package Name *</Label>
                            <Input id="pkg-name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="E.g., Bridal Package" required />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pkg-desc">Description</Label>
                            <Input id="pkg-desc" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Optional description" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pkg-price">Package Price ($) *</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="pkg-price" type="number" step="0.01" value={data.price} onChange={(e) => setData('price', e.target.value)} className="pl-8" required />
                            </div>
                            {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Include Services *</Label>
                            <div className="rounded-lg border border-sidebar-border p-3 max-h-48 overflow-y-auto space-y-2 dark:border-neutral-800">
                                {services.map((svc) => (
                                    <label key={svc.id} className="flex items-center gap-3 cursor-pointer rounded-md p-2 hover:bg-muted/50 dark:hover:bg-neutral-800/50">
                                        <Checkbox
                                            checked={selectedServices.includes(svc.id)}
                                            onCheckedChange={() => toggleService(svc.id)}
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium">{svc.name}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">${parseFloat(svc.price).toFixed(2)} · {svc.duration_minutes} min</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {errors.services && <p className="text-xs text-destructive">{errors.services}</p>}
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{editing ? 'Save' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
