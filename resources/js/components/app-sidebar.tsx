import { Link } from '@inertiajs/react';
import { 
    LayoutGrid, 
    Calendar, 
    Users, 
    Award, 
    Scissors, 
    Package,
    BadgeDollarSign, 
    TrendingUp,
    Coins,
    Crown,
    ClipboardCheck,
    Ticket
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Appointments',
        href: '/appointments',
        icon: Calendar,
    },
    {
        title: 'Customers',
        href: '/customers',
        icon: Users,
    },
    {
        title: 'Memberships',
        href: '/memberships',
        icon: Crown,
    },
    {
        title: 'Staff',
        href: '/staff',
        icon: Award,
    },
    {
        title: 'Attendance',
        href: '/attendance',
        icon: ClipboardCheck,
    },
    {
        title: 'Services',
        href: '/services',
        icon: Scissors,
    },
    {
        title: 'Inventory',
        href: '/inventory',
        icon: Package,
    },
    {
        title: 'POS Terminal',
        href: '/pos',
        icon: BadgeDollarSign,
    },
    {
        title: 'Coupons',
        href: '/coupons',
        icon: Ticket,
    },
    {
        title: 'Financials',
        href: '/financials',
        icon: Coins,
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: TrendingUp,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
