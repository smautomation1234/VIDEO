"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import CopyButton from "@/components/ui/CopyButton";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { addBriefToGrowthWorkspace } from "@/lib/growth-workspace";
import type { ContentIntelligence, ContentOpportunity } from "@/lib/content-intelligence";
import {
    Radar,
    Sparkles,
    Lightbulb,
    FileText,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    CheckCircle2,
    Globe,
    Users,
    Target,
    Layers,
} from "lucide-react";

const PLATFORMS = [
    { id: "youtube", label: "YouTube" },
    { id: "instagram", label: "Instagram" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "x", label: "X/Twitter" },
    { id: "tiktok", label: "TikTok" },
];

const STAGE_TONE: Record<string, string> = {
    Emerging: "badge-info",
    Accelerating: "badge-warning",
    Active: "badge-success",
    Cooling: "badge-muted",
    Evergreen: "badge-neutral",
};

const URGENCY_TONE: Record<string, string> = {
    Today: "badge-danger",
    "This week": "badge-warning",
    Evergreen: "badge-neutral",
};

interface ResearchResponse {
    content: string;
    intelligence: ContentIntelligence;
    liveData: boolean;
    partial: boolean;
    dataMode: string;
    retrievedAt: string;
    platforms: string[];
    contentType: string;
    sources: { title: string; url: string; platform: string; publishedAt?: string; origin: string }[];
}

function platformDestination(platform: string): string {
    const lower = platform.toLowerCase();
    if (lower.includes("youtube")) return "/youtube-strategy?useBrief=1";
    if (lower.includes("instagram")) return "/instagram?useBrief=1";
    if (lower.includes("x") || lower.includes("twitter")) return "/x?useBrief=1";
    return "/linkedin?useBrief=1";
}

function handOff(opportunity: ContentOpportunity, niche: string) {
    const brief = {
        origin: "content-engine",
        niche,
        platform: opportunity.platform,
        title: opportunity.title,
        sourceTitle: opportunity.sourceTitle,
        sourceUrl: opportunity.sourceUrl,
        content: `${opportunity.angle}\n\nHook: ${opportunity.hook}\nFormat: ${opportunity.format}\nWhy now: ${opportunity.whyNow}`,
        hook: opportunity.hook,
        savedAt: new Date().toISOString(),
    };
    localStorage.setItem("activeContentBrief", JSON.stringify(brief));
    addBriefToGrowthWorkspace(brief);
    window.location.href = platformDestination(opportunity.platform);
}

function ScoreBar({ label, value, penalty = false }: { label: string; value: number; penalty?: boolean }) {
    const pct = Math.max(0, Math.min(100, value));
    return (
        <div className="flex items-center gap-2">
            <span className="w-28 shrink-0 text-[0.6875rem] text-muted-foreground">{label}</span>
            <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--muted)" }}>
                <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: penalty ? "var(--rose-ink)" : "var(--sage-ink)" }}
                />
            </div>
            <span className="w-8 text-right text-[0.6875rem] font-semibold text-foreground">{value}</span>
        </div>
    );
}

function OpportunityCard({ opportunity, niche }: { opportunity: ContentOpportunity; niche: string }) {
    const [expanded, setExpanded] = useState(false);
    const b = opportunity.scoreBreakdown;
    const total = Math.round(
        (b.freshness + b.relevance + b.evidence + b.crossPlatform + b.contentGap - b.competitionPenalty) / 5
    );

    return (
        <div className="card">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 min-w-0">
                    <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{ background: "var(--sky-bg)", color: "var(--sky-ink)" }}
                    >
                        {opportunity.rank}
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug">{opportunity.title}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="badge badge-muted">{opportunity.platform}</span>
                            <span className={`badge ${URGENCY_TONE[opportunity.urgency] || "badge-muted"}`}>{opportunity.urgency}</span>
                            <span className="badge badge-info">{opportunity.confidence}</span>
                            <span className="badge badge-success">{opportunity.format}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-xl font-bold leading-none">{opportunity.opportunityScore}</div>
                    <div className="text-[0.625rem] text-muted-foreground mt-0.5">score / 100</div>
                </div>
            </div>

            <p className="text-[0.8125rem] text-muted-foreground leading-relaxed mb-2">
                <strong className="text-foreground">Hook:</strong> {opportunity.hook}
            </p>
            <p className="text-[0.8125rem] text-muted-foreground leading-relaxed mb-3">
                <strong className="text-foreground">Why now:</strong> {opportunity.whyNow}
            </p>

            <button
                onClick={() => setExpanded(!expanded)}
                className="text-[0.75rem] font-semibold inline-flex items-center gap-1 hover:underline"
                style={{ color: "var(--sky-ink)" }}
            >
                {expanded ? "Hide details" : "Score breakdown & title options"}
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {expanded && (
                <div className="mt-4 space-y-4 animate-fade-in">
                    <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--muted)" }}>
                        <ScoreBar label="Freshness" value={b.freshness} />
                        <ScoreBar label="Relevance" value={b.relevance} />
                        <ScoreBar label="Evidence" value={b.evidence} />
                        <ScoreBar label="Cross-platform" value={b.crossPlatform} />
                        <ScoreBar label="Content gap" value={b.contentGap} />
                        <ScoreBar label="Competition" value={b.competitionPenalty} penalty />
                        <p className="text-[0.6875rem] text-muted-foreground pt-1">
                            Heuristic score {total}/100 — a planning aid, not a reach prediction.
                        </p>
                    </div>

                    <div>
                        <p className="label-muted">Title options</p>
                        <ul className="space-y-1">
                            {opportunity.titleOptions.map((t, i) => (
                                <li key={i} className="text-[0.8125rem] text-foreground flex gap-2">
                                    <span className="text-muted-foreground">{i + 1}.</span> {t}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="label-muted">Angle</p>
                        <p className="text-[0.8125rem] text-foreground leading-relaxed">{opportunity.angle}</p>
                    </div>

                    {opportunity.hashtagOptions.length > 0 && (
                        <div>
                            <p className="label-muted">Hashtag / keyword options</p>
                            <div className="flex flex-wrap gap-1.5">
                                {opportunity.hashtagOptions.map((tag, i) => (
                                    <span key={i} className="badge badge-neutral">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl p-3.5" style={{ background: "var(--butter-bg)" }}>
                        <p className="text-[0.75rem] leading-relaxed" style={{ color: "var(--butter-ink)" }}>
                            <strong>Validate first:</strong> {opportunity.validationTest}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border">
                <a
                    href={opportunity.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.75rem] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 min-w-0"
                >
                    <ExternalLink size={11} className="shrink-0" />
                    <span className="truncate">{opportunity.sourceTitle}</span>
                </a>
                <button onClick={() => handOff(opportunity, niche)} className="btn-primary shrink-0" style={{ fontSize: "0.75rem", padding: "0.375rem 0.875rem" }}>
                    Create this <ArrowRight size={12} />
                </button>
            </div>
        </div>
    );
}

export default function ContentEnginePage() {
    const [niche, setNiche] = useState("");
    const [audience, setAudience] = useState("");
    const [goal, setGoal] = useState("");
    const [platformIds, setPlatformIds] = useState<string[]>(["linkedin", "instagram", "youtube"]);
    const [contentType, setContentType] = useState("both");
    const [timeRange, setTimeRange] = useState("past 7 days");
    const [region, setRegion] = useState("Global");
    const [competitorUrls, setCompetitorUrls] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<ResearchResponse | null>(null);

    const togglePlatform = (id: string) => {
        setPlatformIds(prev =>
            prev.includes(id) ? (prev.length > 1 ? prev.filter(p => p !== id) : prev) : [...prev, id]
        );
    };

    async function runResearch() {
        if (!niche.trim()) {
            setError("Enter a niche or topic first.");
            return;
        }
        setError("");
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/live-research", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    niche,
                    audience,
                    goal,
                    region,
                    timeRange,
                    contentType,
                    platforms: platformIds,
                    competitorUrls: competitorUrls.split(/[\n,]/).map(s => s.trim()).filter(Boolean).slice(0, 5),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Live research failed. Try again.");
            setResult(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Live research failed. Try again.");
        } finally {
            setLoading(false);
        }
    }

    const intel = result?.intelligence;
    const topScore = intel?.opportunities?.[0]?.opportunityScore ?? 0;

    return (
        <div className="animate-fade-in">
            <PageHeader
                eyebrow="Research"
                title="Content opportunity engine"
                description="Live web research turned into ranked, source-backed opportunities you can act on today."
            />

            <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">
                {/* Input panel */}
                <div className="card lg:sticky lg:top-20 space-y-4">
                    <div>
                        <label className="label">Niche or topic *</label>
                        <input
                            className="input-field"
                            value={niche}
                            onChange={e => setNiche(e.target.value)}
                            placeholder="e.g. AI tools for small businesses"
                        />
                    </div>
                    <div>
                        <label className="label">Audience</label>
                        <input
                            className="input-field"
                            value={audience}
                            onChange={e => setAudience(e.target.value)}
                            placeholder="e.g. solo founders and marketers"
                        />
                    </div>
                    <div>
                        <label className="label">Goal</label>
                        <input
                            className="input-field"
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            placeholder="e.g. build authority and inbound leads"
                        />
                    </div>
                    <div>
                        <label className="label">Platforms</label>
                        <div className="flex flex-wrap gap-1.5">
                            {PLATFORMS.map(p => {
                                const on = platformIds.includes(p.id);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => togglePlatform(p.id)}
                                        className="badge"
                                        style={{
                                            cursor: "pointer",
                                            border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`,
                                            background: on ? "var(--primary)" : "var(--card)",
                                            color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
                                            padding: "0.3rem 0.75rem",
                                        }}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Content type</label>
                            <select className="input-field" value={contentType} onChange={e => setContentType(e.target.value)}>
                                <option value="both">Trending + evergreen</option>
                                <option value="trending">Trending only</option>
                                <option value="evergreen">Evergreen only</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Window</label>
                            <select className="input-field" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                                <option value="past 48 hours">Past 48 hours</option>
                                <option value="past 7 days">Past 7 days</option>
                                <option value="past 30 days">Past 30 days</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Region</label>
                        <input className="input-field" value={region} onChange={e => setRegion(e.target.value)} placeholder="Global" />
                    </div>
                    <div>
                        <label className="label">Competitor URLs (optional)</label>
                        <textarea
                            className="input-field"
                            value={competitorUrls}
                            onChange={e => setCompetitorUrls(e.target.value)}
                            placeholder="One channel or profile URL per line, up to 5"
                            rows={3}
                        />
                    </div>
                    {error && (
                        <div className="rounded-xl px-4 py-3 text-[0.8125rem] font-medium" style={{ background: "var(--rose-bg)", color: "var(--rose-ink)" }} role="alert">
                            {error}
                        </div>
                    )}
                    <button onClick={runResearch} disabled={loading} className="btn-primary w-full">
                        <Sparkles size={15} />
                        {loading ? "Researching live sources…" : "Run live research"}
                    </button>
                    <p className="text-[0.6875rem] text-muted-foreground leading-relaxed">
                        Searches public web sources and news feeds, then scores opportunities from the evidence it finds. Takes 15–40 seconds.
                    </p>
                </div>

                {/* Results */}
                <div className="space-y-6 min-w-0">
                    {loading && <SkeletonCard lines={6} />}

                    {!loading && !result && (
                        <div className="card">
                            <EmptyState
                                icon={Radar}
                                title="Run your first research"
                                description="Enter a niche on the left. The engine scans live public sources, ranks opportunities with a transparent score breakdown, and builds a ready-to-record package."
                            />
                        </div>
                    )}

                    {!loading && result && intel && (
                        <>
                            {/* Status banner */}
                            <div className="card flex flex-wrap items-center gap-3 py-3.5" style={{ background: "var(--sage-bg)", borderColor: "var(--sage)" }}>
                                <CheckCircle2 size={16} style={{ color: "var(--sage-ink)" }} />
                                <span className="text-[0.8125rem] font-medium flex-1" style={{ color: "var(--sage-ink)" }}>
                                    Live research complete — {result.sources.length} sources · {new Date(result.retrievedAt).toLocaleTimeString()}
                                </span>
                                <span className="badge" style={{ background: "var(--card)", color: "var(--foreground)" }}>
                                    {result.dataMode === "live-web-search-with-ai-synthesis" ? "AI synthesis + live data" : "Live sources + deterministic analysis"}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard label="Sources found" value={result.sources.length} icon={<Globe size={13} />} tone="sky" />
                                <StatCard label="Opportunities" value={intel.opportunities.length} icon={<Target size={13} />} tone="sage" />
                                <StatCard label="Content gaps" value={intel.gaps.length} icon={<Lightbulb size={13} />} tone="butter" />
                                <StatCard label="Top score" value={topScore} hint="out of 100" icon={<Layers size={13} />} tone="lavender" />
                            </div>

                            {/* Trend signals */}
                            {intel.trendSignals.length > 0 && (
                                <section>
                                    <h2 className="text-base font-semibold mb-3">What is moving now</h2>
                                    <div className="space-y-2.5">
                                        {intel.trendSignals.map(signal => (
                                            <div key={signal.id} className="card flex items-start gap-3 py-3.5">
                                                <span className={`badge ${STAGE_TONE[signal.stage] || "badge-muted"} shrink-0 mt-0.5`}>{signal.stage}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[0.8125rem] font-semibold leading-snug">{signal.topic}</p>
                                                    <p className="text-[0.75rem] text-muted-foreground mt-1 leading-relaxed">{signal.reason}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="badge badge-muted">{signal.platform}</span>
                                                        <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[0.6875rem] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5">
                                                            Source <ExternalLink size={9} />
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-base font-bold leading-none">{signal.score}</div>
                                                    <div className="text-[0.625rem] text-muted-foreground mt-0.5">{signal.confidence}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Opportunities */}
                            <section>
                                <h2 className="text-base font-semibold mb-1">Ranked opportunities</h2>
                                <p className="text-[0.8125rem] text-muted-foreground mb-3">
                                    Scores are transparent heuristics built from the evidence — open a card to see exactly how each one was calculated.
                                </p>
                                <div className="space-y-3">
                                    {intel.opportunities.map(op => (
                                        <OpportunityCard key={op.rank} opportunity={op} niche={niche} />
                                    ))}
                                </div>
                            </section>

                            {/* Gaps */}
                            {intel.gaps.length > 0 && (
                                <section>
                                    <h2 className="text-base font-semibold mb-3">Content gaps worth filling</h2>
                                    <div className="space-y-2.5">
                                        {intel.gaps.map((gap, i) => (
                                            <div key={i} className="card py-3.5">
                                                <p className="text-[0.8125rem] font-semibold leading-snug">{gap.question}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="badge badge-info">{gap.suggestedFormat}</span>
                                                    <span className="badge badge-muted">{gap.confidence}</span>
                                                    <a href={gap.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[0.6875rem] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5">
                                                        Evidence <ExternalLink size={9} />
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Package */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-base font-semibold">Ready-to-record package</h2>
                                    <CopyButton text={`${intel.contentPackage.workingTitle}\n\nHook: ${intel.contentPackage.shortScript.hook}\n\nSetup: ${intel.contentPackage.shortScript.setup}\n\nValue: ${intel.contentPackage.shortScript.value}\n\nProof: ${intel.contentPackage.shortScript.proof}\n\nCTA: ${intel.contentPackage.shortScript.cta}`} label="Copy script" />
                                </div>
                                <div className="card space-y-4">
                                    <div>
                                        <p className="label-muted">Working title</p>
                                        <p className="text-sm font-semibold">{intel.contentPackage.workingTitle}</p>
                                    </div>
                                    <div>
                                        <p className="label-muted">Thumbnail text</p>
                                        <p className="text-sm">{intel.contentPackage.thumbnailText}</p>
                                    </div>
                                    <div>
                                        <p className="label-muted">Hook options</p>
                                        <ul className="space-y-1">
                                            {intel.contentPackage.hooks.map((h, i) => (
                                                <li key={i} className="text-[0.8125rem] text-foreground flex gap-2">
                                                    <span className="text-muted-foreground">{i + 1}.</span> {h}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="rounded-xl p-4 space-y-2.5" style={{ background: "var(--muted)" }}>
                                        <p className="label-muted" style={{ marginBottom: 0 }}>30–45 second script</p>
                                        {[
                                            ["Hook", intel.contentPackage.shortScript.hook],
                                            ["Setup", intel.contentPackage.shortScript.setup],
                                            ["Value", intel.contentPackage.shortScript.value],
                                            ["Proof", intel.contentPackage.shortScript.proof],
                                            ["CTA", intel.contentPackage.shortScript.cta],
                                        ].map(([label, text]) => (
                                            <p key={label} className="text-[0.8125rem] leading-relaxed">
                                                <strong className="capitalize">{label}:</strong> <span className="text-muted-foreground">{text}</span>
                                            </p>
                                        ))}
                                    </div>
                                    <div>
                                        <p className="label-muted">Visual beats</p>
                                        <ol className="space-y-1">
                                            {intel.contentPackage.visualBeats.map((beat, i) => (
                                                <li key={i} className="text-[0.8125rem] text-foreground flex gap-2">
                                                    <span className="text-muted-foreground font-semibold">{i + 1}.</span> {beat}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                    <div>
                                        <p className="label-muted">Caption</p>
                                        <p className="text-[0.8125rem] text-foreground leading-relaxed whitespace-pre-wrap">{intel.contentPackage.caption}</p>
                                    </div>
                                    {intel.contentPackage.platformAdaptations.length > 0 && (
                                        <div>
                                            <p className="label-muted">Platform adaptations</p>
                                            <div className="space-y-2">
                                                {intel.contentPackage.platformAdaptations.map((a, i) => (
                                                    <div key={i} className="rounded-lg px-3.5 py-2.5" style={{ background: "var(--sky-bg)" }}>
                                                        <span className="text-[0.75rem] font-bold" style={{ color: "var(--sky-ink)" }}>{a.platform}: </span>
                                                        <span className="text-[0.8125rem]">{a.execution}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Full report */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-base font-semibold">Full report</h2>
                                    <CopyButton text={result.content} label="Copy report" />
                                </div>
                                <div className="card">
                                    <pre className="text-[0.8125rem] leading-relaxed whitespace-pre-wrap font-sans text-foreground">{result.content}</pre>
                                </div>
                            </section>

                            {/* Evidence ledger */}
                            <section>
                                <h2 className="text-base font-semibold mb-3">Evidence ledger</h2>
                                <div className="card divide-y divide-border py-0 px-0 overflow-hidden">
                                    {result.sources.map((source, i) => (
                                        <a
                                            key={i}
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[0.8125rem] font-medium truncate">{source.title}</p>
                                                <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
                                                    {source.platform}
                                                    {source.publishedAt ? ` · ${source.publishedAt}` : ""}
                                                    {source.origin === "openai-web-search" ? " · web search" : " · news feed"}
                                                </p>
                                            </div>
                                            <ExternalLink size={13} className="text-muted-foreground shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
