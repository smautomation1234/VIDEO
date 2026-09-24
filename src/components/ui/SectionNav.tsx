"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SectionNavItem {
    href: string;
    label: string;
}

/**
 * Pill-style sub-navigation used to switch between related pages
 * (e.g. Research: Trends / Evergreen / Competitor Spy).
 * Renders as a segmented control; the current route is highlighted.
 */
export default function SectionNav({ items, className = "" }: { items: SectionNavItem[]; className?: string }) {
    const pathname = usePathname();
    return (
        <nav className={`tab-bar mb-6 flex-wrap ${className}`} aria-label="Section">
            {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                    <Link key={item.href} href={item.href} className={`tab-item ${active ? "active" : ""}`}>
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}

export { SectionNav };
