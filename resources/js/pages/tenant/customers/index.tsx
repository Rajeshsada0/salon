import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Edit, Trash2, Search, Phone, Mail, Star, Wallet, Eye, Crown } from 'lucide-react';
import { toast } from 'sonner';

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
}

interface MembershipPlan {
    id: number;
    name: string;
    price: string;
    duration_months: number;
    discount_percentage: string;
}

interface Props {
    customers: Customer[];
    membershipPlans?: MembershipPlan[];
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

export default function CustomerIndex({ customers, membershipPlans = [] }: Props) {
    const { tenant } = usePage<PageProps>().props;
    const [isOpen, setIsOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [assignTarget, setAssignTarget] = useState<Customer | null>(null);

    const { data, setData, post, put, delete: remove, processing, errors, reset, clearErrors } = useForm({
        name: '',
        mobile: '',
        email: '',
        gender: '',
        dob: '',
        address: '',
        notes: '',
        group: '',
        loyalty_points: '0',
        wallet_balance: '0.00',
    });

    if (!tenant) {
        return (
            <div className="p-6 text-center text-destructive">
                Error: Tenant context not loaded.
            </div>
        );
    }

    const filteredCustomers = customers.filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(q) ||
            (c.mobile && c.mobile.includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q))
        );
    });

    const openCreateDialog = () => {
        reset();
        clearErrors();
        setEditingCustomer(null);
        setIsOpen(true);
    };

    const openEditDialog = (customer: Customer) => {
        clearErrors();
        setEditingCustomer(customer);
        setData({
            name: customer.name,
            mobile: customer.mobile || '',
            email: customer.email || '',
            gender: customer.gender || '',
            dob: customer.dob || '',
            address: customer.address || '',
            notes: customer.notes || '',
            group: customer.group || '',
            loyalty_points: customer.loyalty_points.toString(),
            wallet_balance: customer.wallet_balance ? parseFloat(customer.wallet_balance).toString() : '0.00',
        });
        setIsOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            onSuccess: () => {
                setIsOpen(false);
                toast.success(editingCustomer ? 'Customer updated successfully.' : 'Customer added successfully.');
            },
            onError: () => toast.error('An error occurred. Please verify your inputs.'),
        };

        if (editingCustomer) {
            put(`/customers/${editingCustomer.id}`, options);
        } else {
            post('/customers', options);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            remove(`/customers/${id}`, {
                onSuccess: () => toast.success('Customer deleted successfully.'),
                onError: (err) => {
                    const message = Object.values(err)[0] || 'Failed to delete customer.';
                    toast.error(message as string);
                },
            });
        }
    };

    const viewCustomer = (id: number) => {
        router.get(`/customers/${id}`);
    };

    return (
        <>
            <Head title="Customers" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Customers</h2>
                        <p className="text-sm text-muted-foreground dark:text-neutral-400">
                            Manage your salon customers, groups, loyalty points, and wallet balances.
                        </p>
                    </div>
                    <Button onClick={openCreateDialog} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Customer
                    </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, mobile, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Table */}
                <div className="mt-2 overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-sidebar-border bg-muted/50 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                                <th className="p-4">Name</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Gender</th>
                                <th className="p-4">Group</th>
                                <th className="p-4">Loyalty</th>
                                <th className="p-4">Wallet</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border dark:divide-neutral-800 text-sm">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground dark:text-neutral-400">
                                        {searchQuery ? 'No customers match your search.' : 'No customers found. Add your first customer!'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-muted/30 dark:hover:bg-[#1c1c1b]">
                                        <td className="p-4 font-medium">{customer.name}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                {customer.mobile && (
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-neutral-400">
                                                        <Phone className="h-3 w-3" /> {customer.mobile}
                                                    </span>
                                                )}
                                                {customer.email && (
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-neutral-400">
                                                        <Mail className="h-3 w-3" /> {customer.email}
                                                    </span>
                                                )}
                                                {!customer.mobile && !customer.email && (
                                                    <span className="text-xs text-muted-foreground dark:text-neutral-500">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 capitalize text-xs text-muted-foreground dark:text-neutral-400">
                                            {customer.gender || '—'}
                                        </td>
                                        <td className="p-4">
                                            {customer.group ? (
                                                <Badge variant="outline" className={groupColors[customer.group] || 'bg-muted text-muted-foreground'}>
                                                    {customer.group}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground dark:text-neutral-500">—</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                <Star className="h-3 w-3" /> {customer.loyalty_points}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                <Wallet className="h-3 w-3" /> ${parseFloat(customer.wallet_balance).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => viewCustomer(customer.id)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(customer)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setAssignTarget(customer)}
                                                    className="h-8 w-8 text-amber-500 hover:bg-amber-500/10"
                                                    title="Assign Membership"
                                                >
                                                    <Crown className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Membership Modal */}
            <AssignMembershipDialog
                customer={assignTarget}
                plans={membershipPlans}
                onClose={() => setAssignTarget(null)}
            />

            {/* Create/Edit Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                        <DialogDescription>
                            {editingCustomer ? 'Update this customer\'s profile details.' : 'Add a new customer to your salon records.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="cust-name">Full Name *</Label>
                            <Input
                                id="cust-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="E.g., Sarah Johnson"
                                required
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        {/* Mobile & Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cust-mobile">Mobile Number</Label>
                                <Input
                                    id="cust-mobile"
                                    value={data.mobile}
                                    onChange={(e) => setData('mobile', e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                />
                                {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cust-email">Email</Label>
                                <Input
                                    id="cust-email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="sarah@example.com"
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Gender & DOB */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cust-gender">Gender</Label>
                                <Select
                                    value={data.gender}
                                    onValueChange={(val) => setData('gender', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cust-dob">Date of Birth</Label>
                                <Input
                                    id="cust-dob"
                                    type="date"
                                    value={data.dob}
                                    onChange={(e) => setData('dob', e.target.value)}
                                />
                                {errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
                            </div>
                        </div>

                        {/* Group */}
                        <div className="grid gap-2">
                            <Label htmlFor="cust-group">Customer Group</Label>
                            <Select
                                value={data.group}
                                onValueChange={(val) => setData('group', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select group..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Regular">Regular</SelectItem>
                                    <SelectItem value="Premium">Premium</SelectItem>
                                    <SelectItem value="VIP">VIP</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.group && <p className="text-xs text-destructive">{errors.group}</p>}
                        </div>

                        {/* Address */}
                        <div className="grid gap-2">
                            <Label htmlFor="cust-address">Address</Label>
                            <Input
                                id="cust-address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="123 Main St, City"
                            />
                            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                        </div>

                        {/* Notes */}
                        <div className="grid gap-2">
                            <Label htmlFor="cust-notes">Internal Notes</Label>
                            <Input
                                id="cust-notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Allergies, preferences, etc."
                            />
                            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                        </div>

                        {/* Loyalty & Wallet (display in edit mode) */}
                        {editingCustomer && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="cust-loyalty">Loyalty Points</Label>
                                    <div className="relative">
                                        <Star className="absolute left-2.5 top-2.5 h-4 w-4 text-amber-500" />
                                        <Input
                                            id="cust-loyalty"
                                            type="number"
                                            value={data.loyalty_points}
                                            onChange={(e) => setData('loyalty_points', e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cust-wallet">Wallet Balance ($)</Label>
                                    <div className="relative">
                                        <Wallet className="absolute left-2.5 top-2.5 h-4 w-4 text-emerald-500" />
                                        <Input
                                            id="cust-wallet"
                                            type="number"
                                            step="0.01"
                                            value={data.wallet_balance}
                                            onChange={(e) => setData('wallet_balance', e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingCustomer ? 'Save Changes' : 'Add Customer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ─── Assign Membership Dialog ──────────────────────────────────────────────────

function AssignMembershipDialog({
    customer,
    plans,
    onClose,
}: {
    customer: { id: number; name: string } | null;
    plans: MembershipPlan[];
    onClose: () => void;
}) {
    const { post, data, setData, processing, reset } = useForm({
        membership_plan_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) return;
        post(`/memberships/assign/${customer.id}`, {
            onSuccess: () => {
                reset();
                onClose();
                toast.success(`Membership assigned to ${customer.name}.`);
            },
            onError: () => toast.error('Failed to assign membership.'),
        });
    };

    return (
        <Dialog open={!!customer} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Assign Membership</DialogTitle>
                    <DialogDescription>
                        Select a plan to assign to <strong>{customer?.name}</strong>. Any existing active membership will be cancelled.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-extrabold uppercase">Membership Plan *</Label>
                        <Select value={data.membership_plan_id} onValueChange={(v) => setData('membership_plan_id', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a plan..." />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                                            <span>{p.name}</span>
                                            <span className="text-muted-foreground">— ${parseFloat(p.price).toFixed(2)}/mo · {parseFloat(p.discount_percentage).toFixed(0)}% off</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={processing || !data.membership_plan_id}>
                            Assign Plan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
