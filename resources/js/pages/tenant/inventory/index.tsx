import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
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
    DialogTitle 
} from '@/components/ui/dialog';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    Plus, 
    Edit, 
    Trash2, 
    Search, 
    AlertTriangle, 
    TrendingUp, 
    History, 
    DollarSign, 
    Layers, 
    Tag, 
    Barcode, 
    Sliders,
    ArrowUpRight,
    ArrowDownRight,
    Package
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductCategory {
    id: number;
    name: string;
    description: string | null;
    products_count?: number;
}

interface Brand {
    id: number;
    name: string;
    description: string | null;
    products_count?: number;
}

interface Product {
    id: number;
    product_category_id: number | null;
    brand_id: number | null;
    name: string;
    description: string | null;
    sku: string | null;
    cost_price: string;
    retail_price: string;
    stock_quantity: number;
    alert_quantity: number;
    is_active: boolean;
    category?: ProductCategory;
    brand?: Brand;
}

interface InventoryLog {
    id: number;
    product_id: number;
    user_id: number | null;
    quantity: number;
    type: string;
    notes: string | null;
    created_at: string;
    product?: Product;
    user?: { name: string };
}

interface Props {
    products: Product[];
    categories: ProductCategory[];
    brands: Brand[];
    inventoryLogs: InventoryLog[];
}

interface PageProps {
    tenant: {
        id: string;
        name: string;
    } | null;
}

export default function InventoryIndex({ products = [], categories = [], brands = [], inventoryLogs = [] }: Props) {
    const { tenant } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<'products' | 'categories_brands' | 'logs'>('products');
    
    // Stats Calculations
    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock_quantity, 0);
    const lowStockAlerts = products.filter(p => p.stock_quantity <= p.alert_quantity && p.stock_quantity > 0).length;
    const outOfStock = products.filter(p => p.stock_quantity === 0).length;

    if (!tenant) {
        return <div className="p-6 text-center text-destructive">Error: Tenant context not loaded.</div>;
    }

    const tabs = [
        { key: 'products', label: 'Products', icon: <Package className="h-4 w-4" />, count: totalProducts },
        { key: 'categories_brands', label: 'Categories & Brands', icon: <Layers className="h-4 w-4" />, count: categories.length + brands.length },
        { key: 'logs', label: 'Stock Audit Logs', icon: <History className="h-4 w-4" />, count: inventoryLogs.length },
    ] as const;

    return (
        <>
            <Head title="Inventory Management" />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6">
                
                {/* Header banner */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-sidebar-border pb-6 dark:border-neutral-800">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Inventory & Retail Management</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track professional supplies, manage retail merchandise, configure brands, and audit stock levels.
                        </p>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Catalog */}
                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider">Catalog Size</span>
                            <Package className="h-4 w-4" />
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black">{totalProducts}</span>
                            <span className="text-xs text-muted-foreground">products</span>
                        </div>
                    </div>
                    {/* Total Stock */}
                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider">Total Stock</span>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black">{totalStock}</span>
                            <span className="text-xs text-muted-foreground">units on hand</span>
                        </div>
                    </div>
                    {/* Low Stock Alerts */}
                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider">Low Stock</span>
                            <AlertTriangle className={`h-4 w-4 ${lowStockAlerts > 0 ? 'text-amber-500 animate-pulse' : ''}`} />
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black">{lowStockAlerts}</span>
                            <span className="text-xs text-muted-foreground">reorder alert</span>
                        </div>
                    </div>
                    {/* Out of Stock */}
                    <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                            <AlertTriangle className={`h-4 w-4 ${outOfStock > 0 ? 'text-red-500 animate-pulse' : ''}`} />
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-red-500">{outOfStock}</span>
                            <span className="text-xs text-muted-foreground">depleted stock</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-1 rounded-lg border border-sidebar-border bg-muted/50 p-1 dark:border-neutral-800 dark:bg-[#1c1c1a] self-start">
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

                {/* Tabs Content */}
                <div className="space-y-6">
                    {activeTab === 'products' && (
                        <ProductsTab products={products} categories={categories} brands={brands} tenantId={tenant.id} />
                    )}
                    {activeTab === 'categories_brands' && (
                        <CategoriesBrandsTab categories={categories} brands={brands} tenantId={tenant.id} />
                    )}
                    {activeTab === 'logs' && (
                        <LogsTab logs={inventoryLogs} />
                    )}
                </div>
            </div>
        </>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [
        {
            title: 'Inventory Management',
            href: '/inventory',
        },
    ],
};

// ─── PRODUCTS TAB ─────────────────────────────────────────────────────────────

function ProductsTab({ products, categories, brands, tenantId }: { products: Product[]; categories: ProductCategory[]; brands: Brand[]; tenantId: string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const { data, setData, post, put, delete: remove, processing, errors, reset, clearErrors } = useForm({
        name: '',
        product_category_id: '',
        brand_id: '',
        description: '',
        sku: '',
        cost_price: '',
        retail_price: '',
        stock_quantity: '0',
        alert_quantity: '5',
        is_active: true,
    });

    const { data: adjData, setData: setAdjData, post: postAdj, processing: processingAdj, errors: adjErrors, reset: resetAdj } = useForm({
        quantity: '',
        type: 'stock_in',
        notes: '',
    });

    const openCreate = () => {
        reset();
        clearErrors();
        setEditingProduct(null);
        setIsOpen(true);
    };

    const openEdit = (product: Product) => {
        clearErrors();
        setEditingProduct(product);
        setData({
            name: product.name,
            product_category_id: product.product_category_id ? product.product_category_id.toString() : '',
            brand_id: product.brand_id ? product.brand_id.toString() : '',
            description: product.description || '',
            sku: product.sku || '',
            cost_price: parseFloat(product.cost_price).toString(),
            retail_price: parseFloat(product.retail_price).toString(),
            stock_quantity: product.stock_quantity.toString(),
            alert_quantity: product.alert_quantity.toString(),
            is_active: product.is_active,
        });
        setIsOpen(true);
    };

    const openAdjustment = (product: Product) => {
        resetAdj();
        setSelectedProduct(product);
        setAdjData({
            quantity: '',
            type: 'stock_in',
            notes: '',
        });
        setIsAdjustOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = {
            onSuccess: () => {
                setIsOpen(false);
                toast.success(editingProduct ? 'Product details updated successfully.' : 'Product registered successfully.');
            },
            onError: () => toast.error('Error saving product. Verify parameters.'),
        };

        if (editingProduct) {
            put(`/inventory/${editingProduct.id}`, opts);
        } else {
            post('/inventory', opts);
        }
    };

    const handleAdjustmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        postAdj(`/inventory/${selectedProduct.id}/adjust`, {
            onSuccess: () => {
                setIsAdjustOpen(false);
                toast.success('Inventory stock level updated successfully.');
            },
            onError: () => toast.error('Error logging adjustment.'),
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this product permanently? Inventory records will be wiped.')) {
            remove(`/inventory/${id}`, {
                onSuccess: () => toast.success('Product deleted.'),
                onError: () => toast.error('Failed to delete product.'),
            });
        }
    };

    const filtered = products.filter(p => {
        const query = searchTerm.toLowerCase();
        return (
            p.name.toLowerCase().includes(query) ||
            (p.sku && p.sku.toLowerCase().includes(query)) ||
            (p.category?.name && p.category.name.toLowerCase().includes(query)) ||
            (p.brand?.name && p.brand.name.toLowerCase().includes(query))
        );
    });

    return (
        <div className="space-y-4">
            
            {/* Filter controls */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search SKU, brand, category, name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" /> Register Product</Button>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-sidebar-border bg-muted/50 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                            <th className="p-4">SKU / Item</th>
                            <th className="p-4">Category & Brand</th>
                            <th className="p-4">Cost Price</th>
                            <th className="p-4">Retail Price</th>
                            <th className="p-4">Stock Qty</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border dark:divide-neutral-800 text-sm">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    No products found matching filters.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((product) => {
                                const isLow = product.stock_quantity <= product.alert_quantity;
                                const isOut = product.stock_quantity === 0;

                                return (
                                    <tr key={product.id} className="hover:bg-muted/30 dark:hover:bg-[#1c1c1b]">
                                        <td className="p-4">
                                            <div className="font-semibold">{product.name}</div>
                                            {product.sku ? (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                    <Barcode className="h-3 w-3" /> {product.sku}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground/60 italic mt-0.5">No SKU</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs text-foreground font-semibold">
                                                {product.category?.name || 'Uncategorized'}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                Brand: {product.brand?.name || '—'}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-muted-foreground">
                                            ${parseFloat(product.cost_price).toFixed(2)}
                                        </td>
                                        <td className="p-4 font-mono text-sm font-semibold">
                                            ${parseFloat(product.retail_price).toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`font-bold ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {product.stock_quantity}
                                            </span>
                                            {isOut ? (
                                                <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.25 text-3xs font-extrabold uppercase text-red-700 dark:bg-red-950/40 dark:text-red-400">
                                                    Out
                                                </span>
                                            ) : isLow ? (
                                                <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.25 text-3xs font-extrabold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                                                    Low
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openAdjustment(product)}
                                                    className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                                                    title="Adjust Stock"
                                                >
                                                    <Sliders className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(product)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(product.id)}
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Product dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Product Parameters' : 'Register New Product'}</DialogTitle>
                        <DialogDescription>
                            Configure catalog metadata, cost pricing, retail sales valuation, and minimum alerts.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="prod-name">Product Name *</Label>
                            <Input
                                id="prod-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="E.g., Hair Spray Styling Hold"
                                required
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        {/* SKU */}
                        <div className="grid gap-2">
                            <Label htmlFor="prod-sku">SKU / Barcode</Label>
                            <Input
                                id="prod-sku"
                                value={data.sku}
                                onChange={(e) => setData('sku', e.target.value)}
                                placeholder="E.g., 90123049102"
                            />
                            {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                        </div>

                        {/* Category & Brand */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select
                                    value={data.product_category_id}
                                    onValueChange={(val) => setData('product_category_id', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">None</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Brand</Label>
                                <Select
                                    value={data.brand_id}
                                    onValueChange={(val) => setData('brand_id', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">None</SelectItem>
                                        {brands.map((b) => (
                                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Cost & Retail Pricing */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="cost">Cost Price ($) *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        value={data.cost_price}
                                        onChange={(e) => setData('cost_price', e.target.value)}
                                        className="pl-8"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                {errors.cost_price && <p className="text-xs text-destructive">{errors.cost_price}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="retail">Retail Sale Price ($) *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="retail"
                                        type="number"
                                        step="0.01"
                                        value={data.retail_price}
                                        onChange={(e) => setData('retail_price', e.target.value)}
                                        className="pl-8"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                {errors.retail_price && <p className="text-xs text-destructive">{errors.retail_price}</p>}
                            </div>
                        </div>

                        {/* Stock & Reorder quantities */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="stock">Initial Stock Quantity</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    value={data.stock_quantity}
                                    onChange={(e) => setData('stock_quantity', e.target.value)}
                                    disabled={!!editingProduct}
                                />
                                {errors.stock_quantity && <p className="text-xs text-destructive">{errors.stock_quantity}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="alert">Low Stock Alert Qty</Label>
                                <Input
                                    id="alert"
                                    type="number"
                                    value={data.alert_quantity}
                                    onChange={(e) => setData('alert_quantity', e.target.value)}
                                />
                                {errors.alert_quantity && <p className="text-xs text-destructive">{errors.alert_quantity}</p>}
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{editingProduct ? 'Save Changes' : 'Register'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Adjust Stock Dialog */}
            <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>Stock Levels Override</DialogTitle>
                        <DialogDescription>
                            Log manual stock adjustments or audits for <span className="font-bold text-foreground">{selectedProduct?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdjustmentSubmit} className="space-y-4 py-2">
                        {/* Adjustment type */}
                        <div className="grid gap-2">
                            <Label>Operation Type</Label>
                            <Select
                                value={adjData.type}
                                onValueChange={(val) => setAdjData('type', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stock_in">Stock In (Increment)</SelectItem>
                                    <SelectItem value="stock_out">Stock Out (Decrement)</SelectItem>
                                    <SelectItem value="adjustment">Manual Audit (Overwrite Total)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quantity */}
                        <div className="grid gap-2">
                            <Label htmlFor="adj-qty">
                                {adjData.type === 'adjustment' ? 'Target Stock Level (Set Total)' : 'Quantity Difference'}
                            </Label>
                            <Input
                                id="adj-qty"
                                type="number"
                                value={adjData.quantity}
                                onChange={(e) => setAdjData('quantity', e.target.value)}
                                placeholder="E.g., 10"
                                required
                            />
                            {adjErrors.quantity && <p className="text-xs text-destructive">{adjErrors.quantity}</p>}
                        </div>

                        {/* Notes */}
                        <div className="grid gap-2">
                            <Label htmlFor="adj-notes">Audit Notes / Explanation</Label>
                            <Input
                                id="adj-notes"
                                value={adjData.notes}
                                onChange={(e) => setAdjData('notes', e.target.value)}
                                placeholder="E.g., Reordered from vendor, or broken bottles"
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processingAdj}>Apply Adjustment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}

// ─── CATEGORIES & BRANDS TAB ───────────────────────────────────────────────

function CategoriesBrandsTab({ categories, brands, tenantId }: { categories: ProductCategory[]; brands: Brand[]; tenantId: string }) {
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [isBrandOpen, setIsBrandOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<ProductCategory | null>(null);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

    const { data: catData, setData: setCatData, post: postCat, put: putCat, delete: removeCat, processing: processingCat, errors: catErrors, reset: resetCat } = useForm({
        name: '',
        description: '',
    });

    const { data: brandData, setData: setBrandData, post: postBrand, put: putBrand, delete: removeBrand, processing: processingBrand, errors: brandErrors, reset: resetBrand } = useForm({
        name: '',
        description: '',
    });

    // Categories
    const openCreateCat = () => { resetCat(); setEditingCat(null); setIsCatOpen(true); };
    const openEditCat = (cat: ProductCategory) => {
        setEditingCat(cat);
        setCatData({ name: cat.name, description: cat.description || '' });
        setIsCatOpen(true);
    };
    const handleCatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: () => { setIsCatOpen(false); toast.success('Category updated.'); } };
        if (editingCat) { putCat(`/product-categories/${editingCat.id}`, opts); }
        else { postCat('/product-categories', opts); }
    };
    const handleCatDelete = (id: number) => {
        if (confirm('Delete this product category? Products inside will lose association.')) {
            removeCat(`/product-categories/${id}`, { onSuccess: () => toast.success('Category deleted.') });
        }
    };

    // Brands
    const openCreateBrand = () => { resetBrand(); setEditingBrand(null); setIsBrandOpen(true); };
    const openEditBrand = (b: Brand) => {
        setEditingBrand(b);
        setBrandData({ name: b.name, description: b.description || '' });
        setIsBrandOpen(true);
    };
    const handleBrandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: () => { setIsBrandOpen(false); toast.success('Brand updated.'); } };
        if (editingBrand) { putBrand(`/brands/${editingBrand.id}`, opts); }
        else { postBrand('/brands', opts); }
    };
    const handleBrandDelete = (id: number) => {
        if (confirm('Delete this brand?')) {
            removeBrand(`/brands/${id}`, { onSuccess: () => toast.success('Brand deleted.') });
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            
            {/* Categories Card */}
            <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                <div className="flex items-center justify-between border-b border-sidebar-border pb-4 dark:border-neutral-800">
                    <div>
                        <h3 className="text-base font-bold">Product Categories</h3>
                        <p className="text-xs text-muted-foreground">Classify inventory (e.g. Shampoos, Nail Polishes)</p>
                    </div>
                    <Button size="sm" onClick={openCreateCat} className="gap-1"><Plus className="h-3 w-3" /> Add Category</Button>
                </div>
                <div className="mt-4 space-y-3">
                    {categories.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No product categories created yet.</p>
                    ) : (
                        categories.map((c) => (
                            <div key={c.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/20 border border-transparent hover:border-sidebar-border">
                                <div>
                                    <div className="text-sm font-semibold">{c.name}</div>
                                    <div className="text-3xs text-muted-foreground mt-0.5 uppercase font-bold">
                                        {c.products_count || 0} products
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditCat(c)} className="h-7 w-7 text-muted-foreground hover:text-foreground"><Edit className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleCatDelete(c.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Brands Card */}
            <div className="rounded-xl border border-sidebar-border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                <div className="flex items-center justify-between border-b border-sidebar-border pb-4 dark:border-neutral-800">
                    <div>
                        <h3 className="text-base font-bold">Product Brands</h3>
                        <p className="text-xs text-muted-foreground">Manufacturers and vendors (e.g. L'Oreal, OPI)</p>
                    </div>
                    <Button size="sm" onClick={openCreateBrand} className="gap-1"><Plus className="h-3 w-3" /> Add Brand</Button>
                </div>
                <div className="mt-4 space-y-3">
                    {brands.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No brands configured yet.</p>
                    ) : (
                        brands.map((b) => (
                            <div key={b.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/20 border border-transparent hover:border-sidebar-border">
                                <div>
                                    <div className="text-sm font-semibold">{b.name}</div>
                                    <div className="text-3xs text-muted-foreground mt-0.5 uppercase font-bold">
                                        {b.products_count || 0} products
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditBrand(b)} className="h-7 w-7 text-muted-foreground hover:text-foreground"><Edit className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleBrandDelete(b.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Category Dialog */}
            <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{editingCat ? 'Edit Category' : 'New Category'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCatSubmit} className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="cat-name">Category Name *</Label>
                            <Input id="cat-name" value={catData.name} onChange={(e) => setCatData('name', e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cat-desc">Description</Label>
                            <Input id="cat-desc" value={catData.description} onChange={(e) => setCatData('description', e.target.value)} />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsCatOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processingCat}>Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Brand Dialog */}
            <Dialog open={isBrandOpen} onOpenChange={setIsBrandOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{editingBrand ? 'Edit Brand' : 'New Brand'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleBrandSubmit} className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="brand-name">Brand Name *</Label>
                            <Input id="brand-name" value={brandData.name} onChange={(e) => setBrandData('name', e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="brand-desc">Description</Label>
                            <Input id="brand-desc" value={brandData.description} onChange={(e) => setBrandData('description', e.target.value)} />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsBrandOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processingBrand}>Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}

// ─── LOGS TAB ─────────────────────────────────────────────────────────────────

function LogsTab({ logs }: { logs: InventoryLog[] }) {
    return (
        <div className="space-y-4">
            
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Historical list of inventory movements and corrections</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-sidebar-border bg-card shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-sidebar-border bg-muted/50 text-xs font-semibold text-muted-foreground dark:border-neutral-800 dark:bg-[#1c1c1a]">
                            <th className="p-4">Timestamp</th>
                            <th className="p-4">Product Item</th>
                            <th className="p-4">Adjusted Qty</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Staff Member</th>
                            <th className="p-4">Auditor Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border dark:divide-neutral-800 text-sm">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                    No stock audit logs exist yet.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => {
                                const isPos = log.type === 'stock_out';
                                const isInc = log.quantity > 0;

                                return (
                                    <tr key={log.id} className="hover:bg-muted/30 dark:hover:bg-[#1c1c1b]">
                                        <td className="p-4 text-xs text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 font-semibold">{log.product?.name || 'Deleted Product'}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-0.5 font-bold ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                                {isInc ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0" /> : <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />}
                                                {log.quantity}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={isInc ? 'default' : 'secondary'} className="uppercase text-3xs font-extrabold tracking-wider">
                                                {log.type.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-xs font-medium">
                                            {log.user?.name || 'System Auto'}
                                        </td>
                                        <td className="p-4 text-xs text-muted-foreground italic">
                                            {log.notes || '—'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
