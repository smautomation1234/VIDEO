"use client";

import Link from "next/link";
import { LucideIcon, ChevronRight, ExternalLink } from "lucide-react";

interface ErrorBannerProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
    return (
        <div
            className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-[0.8125rem] font-medium"
            style={{ background: "var(--rose-bg)", color: "var(--rose-ink)" }}
            role="alert"
        >
            <span>{message}</span>
            {onRetry && (
                <button onClick={onRetry} className="btn-secondary shrink-0" style={{ padding: "0.3125rem 0.875rem", fontSize: "0.75rem" }}>
                    Retry
                </button>
            )}
        </div>
    );
}

interface HubTileProps {
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
    tone?: keyof typeof TONE_BG;
    badge?: string;
    external?: boolean;
}

const TONE_BG: Record<string, string> = {
    sage: "var(--sage-bg)",
    rose: "var(--rose-bg)",
    butter: "var(--butter-bg)",
    lavender: "var(--lavender-bg)",
    sky: "var(--sky-bg)",
};

export function HubTile({ href, icon: Icon, title, description, tone = "sky", badge, external }: HubTileProps) {
    const inner = (
        <>
            <div className="flex items-start justify-between">
                <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-105"
                    style={{ background: TONE_BG[tone], color: "var(--foreground)" }}
                >
                    <Icon size={18} />
                </span>
                {badge && <span className="badge badge-muted">{badge}</span>}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
                    {title}
                    {external ? (
                        <ExternalLink size={12} className="text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    ) : (
                        <ChevronRight size={14} className="text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    )}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
            </div>
        </>
    );

    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="card card-hover group flex flex-col gap-3">
                {inner}
            </a>
        );
    }

    return (
        <Link href={href} className="card card-hover group flex flex-col gap-3">
            {inner}
        </Link>
    );
}
