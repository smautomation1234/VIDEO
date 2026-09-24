"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import {
    PenLine,
    TrendingUp,
    Layers,
    CalendarDays,
    Link2,
    CheckCircle2,
    Circle,
    ArrowRight,
    Lightbulb,
    UserRound,
} from "lucide-react";
import {
    loadGrowthWorkspace,
    type GrowthCampaign,
    type CampaignStage,
} from "@/lib/growth-workspace";
import { createClient } from "@/lib/supabase-browser";

interface ConnectionState {
    linkedin: boolean;
    youtube: boolean;
    facebook: boolean;
}

const STAGE_META: Record<CampaignStage, { label: string; className: string }> = {
    opportunity: { label: "Idea", className: "badge-info" },
    creating: { label: "Creating", className: "badge-warning" },
    ready: { label: "Ready", className: "badge-neutral" },
    scheduled: { label: "Scheduled", className: "badge-muted" },
    published: { label: "Published", className: "badge-success" },
    measured: { label: "Measured", className: "badge-success" },
};

const QUICK_ACTIONS = [
    { href: "/linkedin", icon: PenLine, title: "Write a post", description: "LinkedIn, X or Instagram", tone: "var(--sky-bg)" },
    { href: "/research/trends", icon: TrendingUp, title: "Find a trend", description: "Live topics worth posting about", tone: "var(--sage-bg)" },
    { href: "/carousel", icon: Layers, title: "Build a carousel", description: "Multi-slide posts with export", tone: "var(--rose-bg)" },
    { href: "/plan", icon: CalendarDays, title: "Open the calendar", description: "Plan your week of content", tone: "var(--butter-bg)" },
];

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

export default function DashboardPage() {
    const [loadingWorkspace, setLoadingWorkspace] = useState(true);
    const [campaigns, setCampaigns] = useState<GrowthCampaign[]>([]);
    const [connections, setConnections] = useState<ConnectionState | null>(null);
    const [hasBrandProfile, setHasBrandProfile] = useState<boolean | null>(null);

    const refresh = useCallback(() => {
        setCampaigns(loadGrowthWorkspace().campaigns);
        setLoadingWorkspace(false);
    }, []);

    useEffect(() => {
        refresh();
        const onUpdated = () => refresh();
        window.addEventListener("growth-workspace-updated", onUpdated);
        return () => window.removeEventListener("growth-workspace-updated", onUpdated);
    }, [refresh]);

    useEffect(() => {
        fetch("/api/settings/connections")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) {
                    setConnections({
                        linkedin: !!data.linkedin?.connected,
                        youtube: !!data.youtube?.connected,
                        facebook: !!data.facebook?.connected,
                    });
                }
            })
            .catch(() => setConnections({ linkedin: false, youtube: false, facebook: false }));

        (async () => {
            try {
                const { data } = await createClient()
                    .from("users")
                    .select("niche_description")
                    .limit(1);
                const row = Array.isArray(data) ? data[0] : null;
                setHasBrandProfile(!!row && typeof row.niche_description === "string" && row.niche_description.trim().length > 0);
            } catch {
                setHasBrandProfile(false);
            }
        })();
    }, []);

    const activeCampaigns = campaigns.filter((c) => !["published", "measured"].includes(c.stage));
    const doneCount = campaigns.length - activeCampaigns.length;
    const anyConnected = connections ? Object.values(connections).some(Boolean) : null;

    const nextStep = (() => {
        if (anyConnected === false) {
            return {
                icon: Link2,
                text: "Connect a social account to unlock personal analytics and publishing.",
                cta: "Connect accounts",
                href: "/settings/connections",
            };
        }
        if (hasBrandProfile === false) {
            return {
                icon: UserRound,
                text: "Tell the AI about your brand so every post sounds like you.",
                cta: "Set up brand profile",
                href: "/settings/brand",
            };
        }
        if (activeCampaigns.length === 0) {
            return {
                icon: Lightbulb,
                text: "No ideas saved yet. Scan today's trends and save what looks promising.",
                cta: "Browse trends",
                href: "/research/trends",
            };
        }
        const first = activeCampaigns[0];
        return {
            icon: Lightbulb,
            text: `Continue “${first.title.slice(0, 60)}${first.title.length > 60 ? "…" : ""}” — it's at the ${STAGE_META[first.stage].label.toLowerCase()} stage.`,
            cta: "Open research tools",
            href: "/research",
        };
    })();

    return (
        <div className="animate-fade-in">
            <PageHeader
                title={`${greeting()}`}
                description={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            />

            {/* Quick actions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                {QUICK_ACTIONS.map(({ href, icon: Icon, title, description, tone }) => (
                    <Link key={href} href={href} className="card card-hover group flex items-center gap-4 py-4">
                        <span
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                            style={{ background: tone }}
                        >
                            <Icon size={19} />
                        </span>
                        <span>
                            <span className="block text-sm font-semibold">{title}</span>
                            <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
                        </span>
                    </Link>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Pipeline */}
                <section className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold">Your content pipeline</h2>
                        <Link href="/plan" className="text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
                            Plan content <ArrowRight size={13} />
                        </Link>
                    </div>

                    {loadingWorkspace ? (
                        <SkeletonCard lines={4} />
                    ) : activeCampaigns.length === 0 && doneCount === 0 ? (
                        <div className="card">
                            <EmptyState
                                icon={Lightbulb}
                                title="Nothing in progress yet"
                                description="Ideas you save while researching trends will show up here as cards you can move forward."
                                action={<Link href="/research/trends" className="btn-primary">Find your first idea</Link>}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[...activeCampaigns, ...campaigns.filter((c) => ["published", "measured"].includes(c.stage))]
                                .slice(0, 6)
                                .map((c) => {
                                    const meta = STAGE_META[c.stage];
                                    return (
                                        <div key={c.id} className="card card-hover flex items-center gap-4 py-3.5 px-4">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{c.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {c.niche}
                                                    {c.platforms.length > 0 && ` · ${c.platforms.join(", ")}`}
                                                </p>
                                            </div>
                                            <span className={`badge ${meta.className}`}>{meta.label}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </section>

                {/* Right rail */}
                <div className="space-y-6">
                    {/* Next step */}
                    <section>
                        <h2 className="text-base font-semibold mb-4">Do this next</h2>
                        <div className="card flex gap-3.5 items-start" style={{ background: "var(--lavender-bg)", borderColor: "var(--lavender)" }}>
                            {(() => {
                                const Icon = nextStep.icon;
                                return <Icon size={18} style={{ color: "var(--lavender-ink)" }} className="shrink-0 mt-0.5" />;
                            })()}
                            <div>
                                <p className="text-[0.8125rem] leading-relaxed" style={{ color: "var(--lavender-ink)" }}>{nextStep.text}</p>
                                <Link href={nextStep.href} className="inline-flex items-center gap-1 mt-3 text-[0.8125rem] font-semibold hover:underline" style={{ color: "var(--lavender-ink)" }}>
                                    {nextStep.cta} <ArrowRight size={13} />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Connections */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold">Connections</h2>
                            <Link href="/settings/connections" className="text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Manage
                            </Link>
                        </div>
                        <div className="card divide-y divide-border py-0 px-0 overflow-hidden">
                            {!connections ? (
                                <div className="p-4 space-y-3">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="h-5 w-1/2" />
                                    <Skeleton className="h-5 w-3/5" />
                                </div>
                            ) : (
                                [
                                    { key: "linkedin", label: "LinkedIn" },
                                    { key: "youtube", label: "YouTube" },
                                    { key: "facebook", label: "Facebook & Instagram" },
                                ].map(({ key, label }) => {
                                    const connected = connections[key as keyof ConnectionState];
                                    return (
                                        <div key={key} className="flex items-center justify-between px-4 py-3">
                                            <span className="text-sm font-medium">{label}</span>
                                            {connected ? (
                                                <span className="badge badge-success"><CheckCircle2 size={11} /> Connected</span>
                                            ) : (
                                                <span className="badge badge-muted"><Circle size={9} /> Not connected</span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
