"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Menu, LogOut, User, ChevronDown, Settings, Zap, CreditCard } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import PlanBadge from "@/components/ui/PlanBadge";
import { useSubscription } from "@/lib/hooks/useSubscription";

function getInitials(name: string): string {
    return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

interface TopbarProps {
    onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const userRef = useRef<HTMLDivElement>(null);
    const { plan, isPaid } = useSubscription();

    useEffect(() => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUser({
                    name: data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? "User",
                    email: data.user.email ?? "",
                });
            }
        });
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (userRef.current && !userRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    return (
        <header className="h-[60px] bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2" aria-label="Open menu">
                    <Menu size={18} />
                </button>
            </div>

            <div className="flex items-center gap-3">
                {/* Plan badge */}
                <PlanBadge size="sm" showUpgrade={false} />

                {/* Upgrade CTA for free users — single entry point */}
                {plan === 'free' && (
                    <Link href="/upgrade" className="hidden sm:inline-flex btn-primary" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.9375rem' }}>
                        <Zap size={13} />
                        Upgrade
                    </Link>
                )}

                {/* Notifications */}
                <button className="btn-ghost p-2 relative" aria-label="Notifications">
                    <Bell size={17} />
                </button>

                {/* User menu */}
                <div className="relative" ref={userRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 btn-ghost px-1.5"
                        aria-haspopup="menu"
                        aria-expanded={showUserMenu}
                    >
                        <div className="w-7 h-7 rounded-full bg-lavender-bg flex items-center justify-center border border-border">
                            <span className="text-[0.6875rem] font-semibold text-foreground">
                                {user ? getInitials(user.name) : "?"}
                            </span>
                        </div>
                        <span className="text-sm font-medium text-foreground hidden sm:block max-w-[120px] truncate">
                            {user?.name?.split(" ")[0] ?? ""}
                        </span>
                        <ChevronDown size={14} className={`text-muted-foreground hidden sm:block transition-transform ${showUserMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showUserMenu && (
                        <div
                            role="menu"
                            className="absolute right-0 top-full mt-1.5 w-56 bg-card border border-border rounded-xl shadow-lg animate-fade-in overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-border">
                                <p className="text-sm font-semibold truncate">{user?.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                <div className="mt-2">
                                    <PlanBadge size="sm" showUpgrade={false} />
                                </div>
                            </div>
                            <div className="py-1">
                                <Link href="/upgrade" role="menuitem" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setShowUserMenu(false)}>
                                    <Zap size={14} className="text-muted-foreground" /> Subscription &amp; Plans
                                </Link>
                                {isPaid && (
                                    <Link href="/upgrade" role="menuitem" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setShowUserMenu(false)}>
                                        <CreditCard size={14} className="text-muted-foreground" /> Manage Plan
                                    </Link>
                                )}
                                <Link href="/settings/brand" role="menuitem" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setShowUserMenu(false)}>
                                    <User size={14} className="text-muted-foreground" /> Brand Profile
                                </Link>
                                <Link href="/settings/connections" role="menuitem" className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setShowUserMenu(false)}>
                                    <Settings size={14} className="text-muted-foreground" /> Connections
                                </Link>
                                <div className="border-t border-border mt-1 pt-1">
                                    <button
                                        onClick={handleSignOut}
                                        role="menuitem"
                                        className="flex items-center gap-2.5 px-4 py-2 text-sm w-full text-left hover:bg-muted transition-colors"
                                        style={{ color: "var(--danger)" }}
                                    >
                                        <LogOut size={14} /> Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
