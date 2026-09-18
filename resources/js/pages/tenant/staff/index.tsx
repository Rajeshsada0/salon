import { Head, useForm, usePage } from '@inertiajs/react';
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
import { Plus, Edit, Trash2, Calendar, DollarSign, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { store, update, destroy } from '@/actions/App/Http/Controllers/Tenant/StaffController';

interface Role {
    name: string;
}

interface StaffMember {
    id: number;
    name: string;
    email: string;
    joining_date: string | null;
    salary: string | null;
    commission_percentage: string | null;
    roles: Role[];
}

interface Props {
    staff: StaffMember[];
    roles: string[];
}

interface PageProps {
    tenant: {
        id: string;
        name: string;
    } | null;
}

export default function StaffIndex({ staff, roles }: Props) {
    const { tenant } = usePage<PageProps>().props;
    const [isOpen, setIsOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

    const { data, setData, post, put, delete: remove, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        role: '',
        joining_date: '',
        salary: '',
        commission_percentage: '',
    });

    if (!tenant) {
        return (
            <div className="p-6 text-center text-destructive">
                Error: Tenant context not loaded.
            </div>
        );
    }

    const openCreateDialog = () => {
        reset();
        clearErrors();
        setEditingStaff(null);
        setIsOpen(true);
    };

    const openEditDialog = (member: StaffMember) => {
        clearErrors();
        setEditingStaff(member);
        setData({
            name: member.name,
            email: member.email,
            password: '',
            role: member.roles[0]?.name || '',
            joining_date: member.joining_date || '',
            salary: member.salary ? parseFloat(member.salary).toString() : '',
            commission_percentage: member.commission_percentage ? parseFloat(member.commission_percentage).toString() : '',
        });
        setIsOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const options = {
            onSuccess: () => {
                setIsOpen(false);
                toast.success(editingStaff ? 'Staff member updated successfully.' : 'Staff member created successfully.');
            },
            onError: () => toast.error('An error occurred. Please verify your inputs.'),
        };

        if (editingStaff) {
            put(update.url({ tenant: tenant.id, user: editingStaff.id }), options);
        } else {
            post(store.url(tenant.id), options);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this staff member?')) {
            remove(destroy.url({ tenant: tenant.id, user: id }), {
                onSuccess: () => toast.success('Staff member deleted successfully.'),
                onError: (err) => {
                    const message = Object.values(err)[0] || 'Failed to delete staff member.';
                    toast.error(message);
                },
            });
        }
    };

    return (
        <>
            <Head title="Staff Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Staff Members ({tenant.name})</h2>
                        <p className="text-sm text-muted-foreground dark:text-neutral-400">
                            Manage your stylists, receptionists, accountants, and configure their salary and commission rates.
                        </p>
                    </div>
                    <Button onClick={openCreateDialog} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Staff
                    </Button>
                </div>

                {/* Table Container */}
                <div className="mt-4 overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-sidebar-border bg-muted/50 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                                <th className="p-4">Name</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Joining Date</th>
                                <th className="p-4">Base Salary</th>
                                <th className="p-4">Commission</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sidebar-border dark:divide-neutral-800 text-sm">
                            {staff.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground dark:text-neutral-400">
                                        No staff members found.
                                    </td>
                                </tr>
                            ) : (
                                staff.map((member) => (
                                    <tr key={member.id} className="hover:bg-muted/30 dark:hover:bg-[#1c1c1b]">
                                        <td className="p-4 font-medium">{member.name}</td>
                                        <td className="p-4 text-muted-foreground dark:text-neutral-400">{member.email}</td>
                                        <td className="p-4">
                                            <Badge variant="secondary">
                                                {member.roles[0]?.name || 'N/A'}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            {member.joining_date ? (
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground dark:text-neutral-400">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {member.joining_date}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground dark:text-neutral-500">Not set</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-semibold">
                                            {member.salary ? `$${parseFloat(member.salary).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="p-4">
                                            {member.commission_percentage ? (
                                                <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                    {parseFloat(member.commission_percentage)}%
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground dark:text-neutral-500">0%</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(member)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(member.id)}
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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

            {/* Create/Edit Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
                        <DialogDescription>
                            {editingStaff ? 'Update this staff profile, role, and salary parameters.' : 'Create a new staff user and assign their salon role.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="E.g., Jane Doe"
                                required
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="E.g., jane@salon.com"
                                required
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password {editingStaff && <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>}</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                required={!editingStaff}
                            />
                            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                        </div>

                        {/* Role Select */}
                        <div className="grid gap-2">
                            <Label htmlFor="role">Assign Role</Label>
                            <Select
                                value={data.role}
                                onValueChange={(val) => setData('role', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((roleName) => (
                                        <SelectItem key={roleName} value={roleName}>
                                            {roleName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
                        </div>

                        {/* Salary Parameters */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Joining Date */}
                            <div className="grid gap-2">
                                <Label htmlFor="joining_date">Joining Date</Label>
                                <Input
                                    id="joining_date"
                                    type="date"
                                    value={data.joining_date}
                                    onChange={(e) => setData('joining_date', e.target.value)}
                                />
                                {errors.joining_date && <p className="text-xs text-destructive">{errors.joining_date}</p>}
                            </div>

                            {/* Base Salary */}
                            <div className="grid gap-2">
                                <Label htmlFor="salary">Base Salary ($)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="salary"
                                        type="number"
                                        step="0.01"
                                        value={data.salary}
                                        onChange={(e) => setData('salary', e.target.value)}
                                        className="pl-8"
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.salary && <p className="text-xs text-destructive">{errors.salary}</p>}
                            </div>
                        </div>

                        {/* Commission Percentage */}
                        <div className="grid gap-2">
                            <Label htmlFor="commission_percentage">Service Commission Percentage (%)</Label>
                            <div className="relative col-span-2">
                                <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="commission_percentage"
                                    type="number"
                                    step="0.1"
                                    value={data.commission_percentage}
                                    onChange={(e) => setData('commission_percentage', e.target.value)}
                                    className="pl-8"
                                    placeholder="0"
                                />
                            </div>
                            {errors.commission_percentage && <p className="text-xs text-destructive">{errors.commission_percentage}</p>}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingStaff ? 'Save Changes' : 'Create Staff'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
