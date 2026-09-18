import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    Coins, 
    TrendingUp, 
    ArrowUpRight, 
    AlertTriangle, 
    Plus, 
    Calendar, 
    Layers, 
    FolderPlus, 
    DollarSign, 
    Receipt, 
    CreditCard, 
    User, 
    ArrowRight,
    Trash2,
    CalendarSearch,
    BookOpen
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
    DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

// Types
interface ExpenseCategory {
    id: number;
    name: string;
    description: string | null;
    expenses_count?: number;
}

interface Expense {
    id: number;
    expense_category_id: number;
    amount: string;
    ref_number: string | null;
    notes: string | null;
    expense_date: string;
    category?: ExpenseCategory;
    user?: { id: number; name: string };
}

interface Customer {
    id: number;
    name: string;
    mobile: string | null;
    email: string | null;
    credit_limit: string;
    outstanding_balance: string;
}

interface CreditPayment {
    id: number;
    customer_id: number;
    amount: string;
    payment_method: string;
    notes: string | null;
    created_at: string;
    customer?: Customer;
    user?: { id: number; name: string };
}

interface PLReport {
    gross_sales: number;
    cash_sales: number;
    collected_credits: number;
    gross_cash_inflow: number;
    total_expenses: number;
    total_commissions: number;
    net_income_accrual: number;
    net_cash_flow: number;
}

interface Props {
    expenses: Expense[];
    expenseCategories: ExpenseCategory[];
    outstandingCustomers: Customer[];
    creditPayments: CreditPayment[];
    filters: { start_date: string; end_date: string };
    plReport: PLReport;
}

type TabType = 'expenses' | 'credits' | 'pl';

export default function FinancialsIndex({ 
    expenses, 
    expenseCategories, 
    outstandingCustomers, 
    creditPayments, 
    filters, 
    plReport 
}: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('expenses');

    // Dialog state
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [isExpOpen, setIsExpOpen] = useState(false);
    const [isPayOpen, setIsPayOpen] = useState(false);
    
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const tabs = [
        { key: 'expenses', label: 'Business Expenses', icon: <Receipt className="h-4 w-4" /> },
        { key: 'credits', label: 'Customer Dues Ledger', icon: <CreditCard className="h-4 w-4" /> },
        { key: 'pl', label: 'Profit & Loss Sheet', icon: <BookOpen className="h-4 w-4" /> },
    ] as const;

    return (
        <>
            <Head title="Financials & Accounting" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-6">
                
                {/* Header banner */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-6 dark:border-neutral-800">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Financials & Ledger</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Log business expenses, collect outstanding customer credit balances, and audit cash flow margins.
                        </p>
                    </div>
                </div>

                {/* Tab select bar */}
                <div className="flex gap-1 rounded-lg border border-neutral-100 bg-muted/50 p-1 dark:border-neutral-800 dark:bg-[#1c1c1a] self-start">
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
                        </button>
                    ))}
                </div>

                {/* Tab content wrapper */}
                <div className="space-y-6">
                    {activeTab === 'expenses' && (
                        <ExpensesTab 
                            expenses={expenses} 
                            categories={expenseCategories} 
                            onOpenCat={() => setIsCatOpen(true)}
                            onOpenExp={() => setIsExpOpen(true)}
                        />
                    )}
                    {activeTab === 'credits' && (
                        <CreditsTab 
                            outstanding={outstandingCustomers} 
                            payments={creditPayments} 
                            onOpenPay={(customer) => {
                                setSelectedCustomer(customer);
                                setIsPayOpen(true);
                            }}
                        />
                    )}
                    {activeTab === 'pl' && (
                        <ProfitLossTab 
                            filters={filters} 
                            report={plReport} 
                        />
                    )}
                </div>
            </div>

            {/* Modals & Dialogs */}
            <CategoryDialog isOpen={isCatOpen} setIsOpen={setIsCatOpen} categories={expenseCategories} />
            <ExpenseDialog isOpen={isExpOpen} setIsOpen={setIsExpOpen} categories={expenseCategories} />
            {selectedCustomer && (
                <PayDialog isOpen={isPayOpen} setIsOpen={setIsPayOpen} customer={selectedCustomer} />
            )}
        </>
    );
}

// ─── EXPENSES TAB ─────────────────────────────────────────────────────────────

interface ExpensesTabProps {
    expenses: Expense[];
    categories: ExpenseCategory[];
    onOpenCat: () => void;
    onOpenExp: () => void;
}

function ExpensesTab({ expenses, categories, onOpenCat, onOpenExp }: ExpensesTabProps) {
    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this expense record?')) {
            router.delete(`/expenses/${id}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold">Expense Ledger</h3>
                    <p className="text-xs text-muted-foreground">Detailed logs of operating costs, rent, utilities, and stock purchases.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onOpenCat}>
                        <Layers className="h-4 w-4 mr-1.5" />
                        Manage Categories
                    </Button>
                    <Button size="sm" onClick={onOpenExp}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        Log Expense
                    </Button>
                </div>
            </div>

            {/* Expenses List */}
            <div className="overflow-hidden rounded-xl border border-neutral-100 bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-100 bg-muted/30 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                            <th className="p-4">Date</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Reference No.</th>
                            <th className="p-4">Notes</th>
                            <th className="p-4">Logged By</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                                    No business expenses logged yet. Click "Log Expense" to start.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-muted/10 border-b border-neutral-100 dark:border-neutral-850 dark:hover:bg-[#1c1c1b]">
                                    <td className="p-4 text-xs font-medium">
                                        {new Date(expense.expense_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                    </td>
                                    <td className="p-4">
                                        <Badge variant="outline" className="bg-muted/30 capitalize">
                                            {expense.category?.name || 'Uncategorized'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-xs font-mono text-muted-foreground">{expense.ref_number || '—'}</td>
                                    <td className="p-4 text-xs text-muted-foreground italic max-w-xs truncate">{expense.notes || '—'}</td>
                                    <td className="p-4 text-xs font-medium">{expense.user?.name || 'System'}</td>
                                    <td className="p-4 text-sm font-bold text-right text-red-500">
                                        -${parseFloat(expense.amount).toFixed(2)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(expense.id)}
                                            className="text-muted-foreground hover:text-red-500 h-8 w-8"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── CREDITS TAB ──────────────────────────────────────────────────────────────

interface CreditsTabProps {
    outstanding: Customer[];
    payments: CreditPayment[];
    onOpenPay: (customer: Customer) => void;
}

function CreditsTab({ outstanding, payments, onOpenPay }: CreditsTabProps) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                
                {/* Left side: Outstanding Balance accounts */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold">Outstanding Customer Credit</h3>
                        <p className="text-xs text-muted-foreground">List of clients who purchased on credit at POS. Click pay to record collected funds.</p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-neutral-100 bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-muted/30 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                                    <th className="p-4">Customer</th>
                                    <th className="p-4 text-right">Limit</th>
                                    <th className="p-4 text-right">Outstanding</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outstanding.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                                            No customers with outstanding credit balances.
                                        </td>
                                    </tr>
                                ) : (
                                    outstanding.map((cust) => (
                                        <tr key={cust.id} className="hover:bg-muted/10 border-b border-neutral-100 dark:border-neutral-850 dark:hover:bg-[#1c1c1b]">
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{cust.name}</span>
                                                    <span className="text-3xs text-muted-foreground">{cust.mobile || cust.email || 'No contact'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-medium text-right text-muted-foreground">
                                                ${parseFloat(cust.credit_limit).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-sm font-black text-right text-amber-600 dark:text-amber-500">
                                                ${parseFloat(cust.outstanding_balance).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button size="xs" variant="outline" className="h-7 text-3xs font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white" onClick={() => onOpenPay(cust)}>
                                                    Collect Dues
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right side: Credit payments logged history */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold">Dues Collection Logs</h3>
                        <p className="text-xs text-muted-foreground">Auditing history of cash/card payments collected from credit accounts.</p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-neutral-100 bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-muted/30 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                                    <th className="p-4">Received Date</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Payment Method</th>
                                    <th className="p-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">
                                            No payment records collected yet.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/10 border-b border-neutral-100 dark:border-neutral-850 dark:hover:bg-[#1c1c1b]">
                                            <td className="p-4 text-3xs text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-xs font-bold">{log.customer?.name || 'Deleted Customer'}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="capitalize text-3xs">{log.payment_method}</Badge>
                                            </td>
                                            <td className="p-4 text-xs font-black text-right text-emerald-600 dark:text-emerald-400">
                                                +${parseFloat(log.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ─── PROFIT & LOSS TAB ─────────────────────────────────────────────────────────

interface ProfitLossTabProps {
    filters: { start_date: string; end_date: string };
    report: PLReport;
}

function ProfitLossTab({ filters, report }: ProfitLossTabProps) {
    const [dateRange, setDateRange] = useState(filters);

    const applyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/financials', dateRange, { preserveState: true });
    };

    const accrualMargin = report.gross_sales > 0 
        ? (report.net_income_accrual / report.gross_sales) * 100 
        : 0;

    const cashMargin = report.gross_cash_inflow > 0 
        ? (report.net_cash_flow / report.gross_cash_inflow) * 100 
        : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold">Operating Profit & Loss Statement</h3>
                    <p className="text-xs text-muted-foreground">Dynamic financial sheet calculated on an Accrual basis vs Cash Flow basis.</p>
                </div>

                <form onSubmit={applyFilters} className="flex gap-2 items-end bg-card p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm self-start">
                    <div className="space-y-1">
                        <Label className="text-3xs font-extrabold uppercase">Start Date</Label>
                        <Input type="date" className="h-8 text-xs" value={dateRange.start_date} onChange={e => setDateRange({...dateRange, start_date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-3xs font-extrabold uppercase">End Date</Label>
                        <Input type="date" className="h-8 text-xs" value={dateRange.end_date} onChange={e => setDateRange({...dateRange, end_date: e.target.value})} />
                    </div>
                    <Button type="submit" size="sm" className="h-8">
                        <CalendarSearch className="h-3.5 w-3.5 mr-1" />
                        Apply
                    </Button>
                </form>
            </div>

            {/* P&L Ledgers Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                
                {/* Ledger 1: Accrual Income Statement */}
                <div className="rounded-xl border border-neutral-100 bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615] space-y-6">
                    <div className="border-b border-neutral-100 pb-3 dark:border-neutral-800 flex justify-between items-center">
                        <h4 className="font-extrabold text-base">Accrual-basis Statement</h4>
                        <Badge variant="outline">Standard Accounting</Badge>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Gross recognized Sales (Invoices)</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+${report.gross_sales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2 dark:border-neutral-800">
                            <span className="text-muted-foreground">Operating Expenses (Utilities, Rent)</span>
                            <span className="font-semibold text-red-500">-${report.total_expenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2 dark:border-neutral-800">
                            <span className="text-muted-foreground">Stylist Commission Payouts</span>
                            <span className="font-semibold text-red-500">-${report.total_commissions.toFixed(2)}</span>
                        </div>
                        
                        <div className="pt-4 flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800">
                            <span className="font-bold text-base">Net Operating Income</span>
                            <span className={`text-xl font-black ${report.net_income_accrual >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
                                ${report.net_income_accrual.toFixed(2)}
                            </span>
                        </div>

                        {/* Progress Bar Margin indicator */}
                        <div className="pt-2 space-y-1.5">
                            <div className="flex justify-between text-3xs font-extrabold text-muted-foreground uppercase">
                                <span>Profit Margin</span>
                                <span>{accrualMargin.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, accrualMargin))}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ledger 2: Cash Flow Statement */}
                <div className="rounded-xl border border-neutral-100 bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615] space-y-6">
                    <div className="border-b border-neutral-100 pb-3 dark:border-neutral-800 flex justify-between items-center">
                        <h4 className="font-extrabold text-base">Cash-basis Statement</h4>
                        <Badge variant="outline">Cash Flow Liquid</Badge>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Cash Checkout Sales (POS)</span>
                            <span>+${report.cash_sales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground border-b border-neutral-100 pb-2 dark:border-neutral-800">
                            <span>Collected Credits (Debt settles)</span>
                            <span>+${report.collected_credits.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Gross Cash Inflow</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+${report.gross_cash_inflow.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2 dark:border-neutral-800">
                            <span className="text-muted-foreground">Operating Expenses Paid</span>
                            <span className="font-semibold text-red-500">-${report.total_expenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2 dark:border-neutral-800">
                            <span className="text-muted-foreground">Stylist Commission Cash payouts</span>
                            <span className="font-semibold text-red-500">-${report.total_commissions.toFixed(2)}</span>
                        </div>

                        <div className="pt-4 flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800">
                            <span className="font-bold text-base">Net Liquid Cash Flow</span>
                            <span className={`text-xl font-black ${report.net_cash_flow >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500'}`}>
                                ${report.net_cash_flow.toFixed(2)}
                            </span>
                        </div>

                        {/* Progress Bar Margin indicator */}
                        <div className="pt-2 space-y-1.5">
                            <div className="flex justify-between text-3xs font-extrabold text-muted-foreground uppercase">
                                <span>Cash Flow Margin</span>
                                <span>{cashMargin.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, cashMargin))}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ─── DIALOG COMPONENTS ────────────────────────────────────────────────────────

// 1. Manage Expense Categories Dialog
function CategoryDialog({ isOpen, setIsOpen, categories }: { isOpen: boolean; setIsOpen: (open: boolean) => void; categories: ExpenseCategory[] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        description: ''
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/expense-categories', {
            onSuccess: () => {
                reset();
                setIsOpen(false);
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this category? All associated expenses will be deleted.')) {
            router.delete(`/expense-categories/${id}`);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Expense Categories</DialogTitle>
                </DialogHeader>
                
                {/* List of categories */}
                <div className="space-y-2 max-h-48 overflow-y-auto mb-4 border-b pb-4 border-neutral-100 dark:border-neutral-800">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-2 rounded-lg border border-neutral-100 dark:border-neutral-800/60 bg-muted/10">
                            <div>
                                <span className="text-xs font-bold capitalize">{cat.name}</span>
                                <p className="text-3xs text-muted-foreground max-w-xs">{cat.description || 'No description'}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(cat.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Add new category form */}
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1">
                        <Label htmlFor="cat-name" className="text-3xs font-extrabold uppercase">Category Name *</Label>
                        <Input id="cat-name" value={data.name} onChange={e => setData('name', e.target.value)} required />
                        {errors.name && <p className="text-3xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="cat-desc" className="text-3xs font-extrabold uppercase">Description</Label>
                        <Textarea id="cat-desc" value={data.description} onChange={e => setData('description', e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
                        <Button type="submit" size="sm" disabled={processing}>Add Category</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// 2. Log Expense Dialog
function ExpenseDialog({ isOpen, setIsOpen, categories }: { isOpen: boolean; setIsOpen: (open: boolean) => void; categories: ExpenseCategory[] }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        expense_category_id: '',
        amount: '',
        ref_number: '',
        notes: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/expenses', {
            onSuccess: () => {
                reset();
                setIsOpen(false);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Log Business Expense</DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1">
                        <Label className="text-3xs font-extrabold uppercase">Category *</Label>
                        <Select value={data.expense_category_id} onValueChange={val => setData('expense_category_id', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id.toString()} className="capitalize">{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.expense_category_id && <p className="text-3xs text-red-500">{errors.expense_category_id}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                            <Label htmlFor="exp-amount" className="text-3xs font-extrabold uppercase">Amount ($) *</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input id="exp-amount" type="number" step="0.01" className="pl-7" value={data.amount} onChange={e => setData('amount', e.target.value)} required />
                            </div>
                            {errors.amount && <p className="text-3xs text-red-500">{errors.amount}</p>}
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="exp-date" className="text-3xs font-extrabold uppercase">Expense Date *</Label>
                            <Input id="exp-date" type="date" value={data.expense_date} onChange={e => setData('expense_date', e.target.value)} required />
                            {errors.expense_date && <p className="text-3xs text-red-500">{errors.expense_date}</p>}
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="exp-ref" className="text-3xs font-extrabold uppercase">Ref / Receipt Number</Label>
                        <Input id="exp-ref" value={data.ref_number} onChange={e => setData('ref_number', e.target.value)} placeholder="e.g. Utility bill number, TxID" />
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="exp-notes" className="text-3xs font-extrabold uppercase">Notes</Label>
                        <Textarea id="exp-notes" value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="Additional notes about the business transaction" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={processing}>Save Expense</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// 3. Collect Dues Dialog
function PayDialog({ isOpen, setIsOpen, customer }: { isOpen: boolean; setIsOpen: (open: boolean) => void; customer: Customer }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        customer_id: customer.id.toString(),
        amount: '',
        payment_method: 'cash',
        notes: ''
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/credits/pay', {
            onSuccess: () => {
                reset();
                setIsOpen(false);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Collect Outstanding Balance</DialogTitle>
                </DialogHeader>

                <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/20 text-xs border border-amber-500/20 space-y-1.5 mb-2">
                    <div className="flex justify-between font-medium text-amber-950 dark:text-amber-300">
                        <span>Customer Name:</span>
                        <span>{customer.name}</span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400 text-sm">
                        <span>Total Due Balance:</span>
                        <span>${parseFloat(customer.outstanding_balance).toFixed(2)}</span>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1">
                            <Label htmlFor="pay-amount" className="text-3xs font-extrabold uppercase">Collect Amount ($) *</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-emerald-500" />
                                <Input id="pay-amount" type="number" step="0.01" className="pl-7" value={data.amount} onChange={e => setData('amount', e.target.value)} required max={customer.outstanding_balance} />
                            </div>
                            {errors.amount && <p className="text-3xs text-red-500">{errors.amount}</p>}
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-3xs font-extrabold uppercase">Payment Method *</Label>
                            <Select value={data.payment_method} onValueChange={val => setData('payment_method', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Payment Method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Credit Card</SelectItem>
                                    <SelectItem value="bank">Mobile/Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.payment_method && <p className="text-3xs text-red-500">{errors.payment_method}</p>}
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="pay-notes" className="text-3xs font-extrabold uppercase">Notes</Label>
                        <Textarea id="pay-notes" value={data.notes} onChange={e => setData('notes', e.target.value)} placeholder="e.g. Cleared invoice balances" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={processing} className="bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-700 dark:hover:bg-emerald-600">
                            Log Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Layout association helper
FinancialsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Financials & Ledger', href: '/financials' }]}>
        {page}
    </AppLayout>
);
