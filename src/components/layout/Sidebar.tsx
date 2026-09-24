"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Sparkles,
    CalendarDays,
    TrendingUp,
    Globe2,
    BarChart3,
    Settings,
    Zap,
    ChevronLeft,
    ChevronRight,
    Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/lib/hooks/useSubscription";
import type { PlanId } from "@/lib/plans";

interface NavItem {
    href: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
    { href: "/dashboard", label: "Home", description: "Your overview and next steps", icon: LayoutDashboard },
    { href: "/create", label: "Create", description: "Posts, carousels, reels, thumbnails", icon: Sparkles },
    { href: "/plan", label: "Plan", description: "Content calendar and schedule", icon: CalendarDays },
    { href: "/research", label: "Research", description: "Trends, evergreen ideas, competitors", icon: TrendingUp },
    { href: "/platforms", label: "Platforms", description: "LinkedIn, X, Instagram, YouTube", icon: Globe2 },
    { href: "/performance", label: "Performance", description: "Analytics and audits", icon: BarChart3 },
];

const SETTINGS_NAV: NavItem[] = [
    { href: "/settings", label: "Settings", description: "Brand profile and preferences", icon: Settings },
];

const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "agency"];

function planRank(plan: PlanId): number {
    return PLAN_ORDER.indexOf(plan);
}

interface SidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { plan, isPaid, loading: subLoading } = useSubscription();

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname === href || pathname.startsWith(href + "/");
    };

    const renderLink = (item: NavItem) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
            <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn("sidebar-link", active && "active", collapsed && "justify-center px-0")}
            >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
        );
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen bg-sidebar-bg border-r border-sidebar-border flex flex-col z-40 transition-all duration-300",
                collapsed ? "w-[68px]" : "w-[240px]"
            )}
        >
            {/* Brand */}
            <div className={cn("flex items-center gap-3 h-[60px] border-b border-sidebar-border shrink-0", collapsed ? "justify-center px-2" : "px-4")}>
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <Zap size={15} className="text-primary-foreground" fill="currentColor" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden flex-1">
                        <h1 className="text-sm font-semibold text-foreground leading-tight truncate">The Personal Brand</h1>
                        <p className="text-[10px] text-muted-foreground leading-tight">Founder marketing system</p>
                    </div>
                )}
                {onToggle && !collapsed && (
                    <button onClick={onToggle} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors" aria-label="Collapse sidebar">
                        <ChevronLeft size={14} />
                    </button>
                )}
            </div>

            {/* Primary navigation */}
            <nav className={cn("flex-1 py-3 space-y-0.5 overflow-y-auto", collapsed ? "px-3" : "px-3.5")} aria-label="Primary">
                {PRIMARY_NAV.map(renderLink)}

                {collapsed && onToggle && (
                    <button onClick={onToggle} className="sidebar-link justify-center px-0 w-full" aria-label="Expand sidebar">
                        <ChevronRight size={18} />
                    </button>
                )}
            </nav>

            {/* Bottom section */}
            <div className={cn("shrink-0 border-t border-sidebar-border py-3 space-y-0.5", collapsed ? "px-3" : "px-3.5")}>
                {/* Upgrade — single entry point */}
                {!isPaid && !subLoading &&
                    (collapsed ? (
                        <Link href="/upgrade" title="Upgrade" className="sidebar-link justify-center px-0" style={{ color: "var(--butter-ink)" }}>
                            <Crown size={18} className="shrink-0" />
                        </Link>
                    ) : (
                        <Link
                            href="/upgrade"
                            className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl transition-transform hover:scale-[1.01]"
                            style={{ background: "var(--butter-bg)", border: "1px solid var(--amber)" }}
                        >
                            <Crown size={16} style={{ color: "var(--butter-ink)" }} />
                            <span className="flex-1 min-w-0">
                                <span className="block text-xs font-semibold" style={{ color: "var(--butter-ink)" }}>Upgrade</span>
                                <span className="block text-[10px] text-muted-foreground leading-tight">Unlock all features</span>
                            </span>
                        </Link>
                    ))}
                {SETTINGS_NAV.map(renderLink)}
            </div>
        </aside>
    );
}
