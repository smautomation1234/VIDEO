"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Clapperboard,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Instagram,
  Lightbulb,
  Linkedin,
  Loader2,
  Radar,
  Search,
  Target,
  Twitter,
  Users,
  Youtube,
  Zap,
} from "lucide-react";
import { addBriefToGrowthWorkspace } from "@/lib/growth-workspace";
import PageHeader from "@/components/ui/PageHeader";

const PLATFORMS = [
  { id: "youtube", label: "YouTube", icon: Youtube, color: "#ef4444" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#e1306c" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#2563eb" },
  { id: "x", label: "X/Twitter", icon: Twitter, color: "#111827" },
  { id: "tiktok", label: "TikTok", icon: Clapperboard, color: "#0f766e" },
];

type Confidence = "Verified" | "Observed" | "Estimated";

interface Source {
  title: string;
  url: string;
  platform: string;
  publishedAt?: string;
  origin?: string;
}

interface ScoreBreakdown {
  freshness: number;
  relevance: number;
  evidence: number;
  crossPlatform: number;
  contentGap: number;
  competitionPenalty: number;
}

interface Opportunity {
  rank: number;
  title: string;
  platform: string;
  angle: string;
  hook: string;
  format: string;
  urgency: string;
  opportunityScore: number;
  confidence: Confidence;
  scoreBreakdown: ScoreBreakdown;
  whyNow: string;
  validationTest: string;
  sourceTitle: string;
  sourceUrl: string;
  titleOptions: string[];
  description: string;
  hashtagOptions: string[];
}

interface Intelligence {
  methodology: string;
  trendSignals: {
    id: string;
    topic: string;
    platform: string;
    stage: string;
    score: number;
    confidence: Confidence;
    reason: string;
    sourceUrl: string;
    publishedAt?: string;
  }[];
  opportunities: Opportunity[];
  gaps: {
    question: string;
    suggestedFormat: string;
    evidence: string;
    confidence: Confidence;
    sourceUrl: string;
  }[];
  contentPackage: {
    workingTitle: string;
    thumbnailText: string;
    hooks: string[];
    shortScript: { hook: string; setup: string; value: string; proof: string; cta: string };
    visualBeats: string[];
    caption: string;
    platformAdaptations: { platform: string; execution: string }[];
  };
  competitorCoverage: { requested: string[]; sourcesFound: number; note: string };
}

interface ResearchResult {
  content: string;
  partial?: boolean;
  dataMode?: string;
  sources?: Source[];
  retrievedAt?: string;
  intelligence?: Intelligence;
}

const panelStyle = { border: "1px solid var(--border)", borderRadius: 16, background: "var(--card)" } as const;

function confidenceStyle(confidence: Confidence) {
  if (confidence === "Verified") return { background: "var(--sage-bg)", color: "var(--sage-ink)", border: "var(--sage)" };
  if (confidence === "Observed") return { background: "var(--sky-bg)", color: "var(--sky-ink)", border: "var(--sky)" };
  return { background: "var(--butter-bg)", color: "var(--butter-ink)", border: "var(--amber)" };
}

function ConfidenceBadge({ value }: { value: Confidence }) {
  const colors = confidenceStyle(value);
  return <span title={`${value} confidence`} style={{ fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 999, background: colors.background, color: colors.color, border: `1px solid ${colors.border}` }}>{value}</span>;
}

function ScoreRing({ score, size = 62 }: { score: number; size?: number }) {
  const color = score >= 75 ? "var(--sage-ink)" : score >= 55 ? "var(--sky-ink)" : "var(--butter-ink)";
  return (
    <div style={{ width: size, height: size, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", background: `conic-gradient(${color} ${score * 3.6}deg,var(--muted) 0)` }}>
      <div style={{ width: size - 10, height: size - 10, borderRadius: "50%", background: "var(--card)", display: "grid", placeItems: "center", fontSize: size > 50 ? 17 : 13, fontWeight: 900 }}>{score}</div>
    </div>
  );
}

function Metric({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, fontSize: 10, color: "var(--muted-foreground)", marginBottom: 4 }}><span>{label}</span><strong style={{ color: negative ? "var(--butter-ink)" : "var(--foreground)" }}>{negative ? `−${value}` : value}</strong></div>
      <div style={{ height: 4, borderRadius: 999, background: "var(--muted)", overflow: "hidden" }}><div style={{ width: `${value}%`, height: "100%", background: negative ? "var(--butter-ink)" : "var(--sky-ink)" }} /></div>
    </div>
  );
}

export default function ContentEnginePage() {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("Grow attention and build an audience");
  const [request, setRequest] = useState("trends, content gaps, viral formats, and content ideas");
  const [region, setRegion] = useState("Global");
  const [language, setLanguage] = useState("English");
  const [timeRange, setTimeRange] = useState("past 7 days");
  const [contentType, setContentType] = useState("both");
  const [deliverable, setDeliverable] = useState("Full one-stop content plan");
  const [competitors, setCompetitors] = useState("");
  const [platforms, setPlatforms] = useState(PLATFORMS.map(platform => platform.id));
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryNiche = params.get("niche");
    const queryCompetitor = params.get("competitor");
    if (queryNiche) setNiche(queryNiche);
    if (queryCompetitor) setCompetitors(queryCompetitor);
  }, []);

  const togglePlatform = (id: string) => {
    setPlatforms(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const competitorUrls = competitors.split(/[\n,]+/).map(value => value.trim()).filter(Boolean).slice(0, 5);

  const research = async () => {
    if (!niche.trim() || !platforms.length) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/live-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, audience, goal, request, region, language, timeRange, contentType, deliverable, platforms, competitorUrls }),
      });
      const responseText = await response.text();
      let data: Record<string, unknown>;
      try { data = JSON.parse(responseText) as Record<string, unknown>; } catch { throw new Error(responseText.trim().startsWith("<!DOCTYPE") ? "The deployed server returned an HTML error page. Redeploy the latest build so live research is available." : "The live research server returned an invalid response. Try again."); }
      if (!response.ok || data.error) throw new Error(String(data.error || "Live research failed."));
      const nextResult = data as unknown as ResearchResult;
      setResult(nextResult);
      const firstSource = nextResult.sources?.[0];
      const brief = { origin: "content-engine", title: `Content opportunity: ${niche}`, niche, audience, goal, platform: platforms.join(", "), prompt: "Content Opportunity Engine", content: nextResult.content, sourceTitle: firstSource?.title || "", sourceUrl: firstSource?.url || "", sourceChannel: firstSource?.platform || "Public web", savedAt: new Date().toISOString() };
      localStorage.setItem("activeContentBrief", JSON.stringify(brief));
      addBriefToGrowthWorkspace(brief);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Live research failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result?.content) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadResult = () => {
    if (!result?.content) return;
    const sources = result.sources?.map(source => `- [${source.title}](${source.url}) — ${source.platform}`).join("\n") || "No sources returned.";
    const markdown = `# Live Content Plan: ${niche}\n\n${result.content}\n\n## Live sources\n\n${sources}`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${niche.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "content"}-live-plan.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const intel = result?.intelligence;
  const topScore = intel?.opportunities[0]?.opportunityScore || 0;

  return (
    <main style={{ maxWidth: 1220, margin: "0 auto", paddingBottom: 72 }}>
      <PageHeader
        eyebrow="Research"
        title="Content opportunity engine"
        description="Live web research turned into ranked opportunities you can act on today."
      />

      <section className="card" style={{ padding: 24, marginBottom: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Niche or topic *<input value={niche} onChange={event => setNiche(event.target.value)} placeholder="e.g. AI tools for small businesses" /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Target audience<input value={audience} onChange={event => setAudience(event.target.value)} placeholder="e.g. non-technical founders" /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Goal<select value={goal} onChange={event => setGoal(event.target.value)}><option>Grow attention and build an audience</option><option>Generate leads or sales</option><option>Build authority</option><option>Launch a product</option></select></label>
        </div>

        <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700, marginTop: 16 }}>Research focus<input value={request} onChange={event => setRequest(event.target.value)} placeholder="trends, content gaps, formats, or a specific event" /></label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 16 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Region<input value={region} onChange={event => setRegion(event.target.value)} placeholder="Global, India, United States…" /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Language<input value={language} onChange={event => setLanguage(event.target.value)} placeholder="English" /></label>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Research window<select value={timeRange} onChange={event => setTimeRange(event.target.value)}><option>past 24 hours</option><option>past 7 days</option><option>past 30 days</option></select></label>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Content type<select value={contentType} onChange={event => setContentType(event.target.value)}><option value="both">Current trends + evergreen</option><option value="trending">Current trends only</option><option value="evergreen">Evergreen content only</option></select></label>
          <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Output<select value={deliverable} onChange={event => setDeliverable(event.target.value)}><option>Full one-stop content plan</option><option>Trend radar and opportunity report</option><option>Viral idea bank and hooks</option><option>Scripts and production plan</option><option>30-day content calendar</option></select></label>
        </div>

        <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700, marginTop: 16 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Users size={15} /> Public competitor URLs <span style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>(optional, maximum 5)</span></span>
          <textarea rows={2} value={competitors} onChange={event => setCompetitors(event.target.value)} placeholder="Paste public channel or profile URLs, separated by a new line" style={{ resize: "vertical" }} />
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 500 }}>Only publicly indexed evidence is scanned. No account connection or private analytics.</span>
        </label>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 9 }}>Platforms</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
            {PLATFORMS.map(platform => {
              const Icon = platform.icon;
              const active = platforms.includes(platform.id);
              return <button key={platform.id} onClick={() => togglePlatform(platform.id)} type="button" aria-pressed={active} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: 12, border: `1px solid ${active ? platform.color : "var(--border)"}`, background: active ? `${platform.color}14` : "transparent", color: "var(--foreground)", cursor: "pointer", textAlign: "left" }}><Icon size={17} color={active ? platform.color : "var(--muted-foreground)"} /><span style={{ flex: 1 }}>{platform.label}</span>{active && <Check size={15} color={platform.color} />}</button>;
            })}
          </div>
        </div>

        <button type="button" onClick={research} disabled={loading || !niche.trim() || !platforms.length} style={{ marginTop: 22, width: "100%", border: 0, borderRadius: 12, padding: "14px 18px", background: "var(--primary)", color: "var(--background)", fontWeight: 800, cursor: loading ? "wait" : "pointer", opacity: (!niche.trim() || !platforms.length) ? .5 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 9 }}>
          {loading ? <><Loader2 size={17} className="animate-spin" /> Scanning live evidence and scoring opportunities…</> : <><Search size={17} /> Find live opportunities</>}
        </button>
      </section>

      {error && <div style={{ padding: 15, borderRadius: 12, background: "var(--rose-bg)", color: "var(--rose-ink)", border: "1px solid var(--rose)", marginBottom: 22 }}>{error}</div>}

      {result && (
        <div style={{ display: "grid", gap: 22 }}>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            {[
              { icon: Globe2, label: "Live sources", value: result.sources?.length || 0, ink: "var(--sky-ink)", bg: "var(--sky-bg)" },
              { icon: Target, label: "Opportunities", value: intel?.opportunities.length || 0, ink: "var(--lavender-ink)", bg: "var(--lavender-bg)" },
              { icon: Zap, label: "Top opportunity", value: `${topScore}/100`, ink: "var(--sage-ink)", bg: "var(--sage-bg)" },
              { icon: Lightbulb, label: "Content gaps", value: intel?.gaps.length || 0, ink: "var(--butter-ink)", bg: "var(--butter-bg)" },
            ].map(stat => {
              const Icon = stat.icon;
              return <div key={stat.label} style={{ ...panelStyle, padding: 16, display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 11, background: stat.bg }}><Icon size={19} style={{ color: stat.ink }} /></div><div><div style={{ fontSize: 20, fontWeight: 900 }}>{stat.value}</div><div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{stat.label}</div></div></div>;
            })}
          </section>

          {result.partial && <div style={{ padding: 13, borderRadius: 12, background: "var(--butter-bg)", border: "1px solid var(--amber)", color: "var(--butter-ink)", fontSize: 12 }}><strong>Live-data fallback active.</strong> Current public sources and transparent scoring are working; the optional AI narrative is unavailable. No fake data has been substituted.</div>}

          {!!intel?.trendSignals.length && (
            <section style={{ ...panelStyle, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}><Radar size={19} style={{ color: "var(--sky-ink)" }} /><div><h2 style={{ margin: 0, fontSize: 18 }}>Trend radar</h2><div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 3 }}>Stages are calculated from source recency and corroboration.</div></div></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
                {intel.trendSignals.map(signal => <a key={signal.id} href={signal.sourceUrl} target="_blank" rel="noreferrer" style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 13, textDecoration: "none", color: "var(--foreground)", display: "grid", gap: 8 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><span style={{ fontSize: 10, fontWeight: 900, color: signal.stage === "Accelerating" ? "var(--sage-ink)" : "var(--sky-ink)", textTransform: "uppercase", letterSpacing: .7 }}>{signal.stage}</span><ConfidenceBadge value={signal.confidence} /></div><div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{signal.topic}</div><div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{signal.platform} · Score {signal.score}/100</div></a>)}
              </div>
            </section>
          )}

          {!!intel?.opportunities.length && (
            <section style={{ ...panelStyle, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}><BarChart3 size={19} style={{ color: "var(--lavender-ink)" }} /><h2 style={{ margin: 0, fontSize: 18 }}>Ranked content opportunities</h2></div>
              <p style={{ margin: "0 0 16px", fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{intel.methodology}</p>
              <div style={{ display: "grid", gap: 12 }}>
                {intel.opportunities.map(item => <article key={`${item.rank}-${item.sourceUrl}`} style={{ border: "1px solid var(--border)", borderRadius: 15, padding: 17 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 14 }}>
                    <ScoreRing score={item.opportunityScore} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}><span style={{ fontSize: 10, fontWeight: 900, color: "var(--lavender-ink)" }}>#{item.rank}</span><span style={{ fontSize: 10, fontWeight: 800, background: "var(--muted)", padding: "3px 7px", borderRadius: 99 }}>{item.platform}</span><span style={{ fontSize: 10, fontWeight: 800, background: item.urgency === "Today" ? "var(--rose-bg)" : "var(--butter-bg)", color: item.urgency === "Today" ? "var(--rose-ink)" : "var(--butter-ink)", padding: "3px 7px", borderRadius: 99 }}>{item.urgency}</span><ConfidenceBadge value={item.confidence} /></div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 16, lineHeight: 1.35 }}>{item.title}</h3>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.55 }}>{item.angle}</p>
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: "var(--muted)", marginTop: 13, fontSize: 12, lineHeight: 1.55 }}><strong>Hook:</strong> {item.hook}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10, marginTop: 11 }}>
                    <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 11 }}><div style={{ fontSize: 10, fontWeight: 900, color: "var(--sky-ink)", marginBottom: 6 }}>TITLE OPTIONS</div>{item.titleOptions.map((title, index) => <div key={title} style={{ fontSize: 11, lineHeight: 1.4, marginTop: index ? 5 : 0 }}>{index + 1}. {title}</div>)}</div>
                    <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 11 }}><div style={{ fontSize: 10, fontWeight: 900, color: "var(--sage-ink)", marginBottom: 6 }}>DESCRIPTION</div><div style={{ fontSize: 11, lineHeight: 1.5 }}>{item.description}</div></div>
                    <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 11 }}><div style={{ fontSize: 10, fontWeight: 900, color: "var(--lavender-ink)", marginBottom: 6 }}>HASHTAG / KEYWORD OPTIONS</div><div style={{ fontSize: 11, lineHeight: 1.5 }}>{item.hashtagOptions.join(" · ")}</div><div style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 5 }}>Relevant suggestions; no usage volume is claimed.</div></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginTop: 13 }}><Metric label="Freshness" value={item.scoreBreakdown.freshness} /><Metric label="Relevance" value={item.scoreBreakdown.relevance} /><Metric label="Evidence" value={item.scoreBreakdown.evidence} /><Metric label="Cross-platform" value={item.scoreBreakdown.crossPlatform} /><Metric label="Content gap" value={item.scoreBreakdown.contentGap} /><Metric label="Competition" value={item.scoreBreakdown.competitionPenalty} negative /></div>
                  <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", marginTop: 13, fontSize: 11 }}><span><strong>Format:</strong> {item.format}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><ExternalLink size={12} /> View evidence</a></div>
                </article>)}
              </div>
            </section>
          )}

          {!!intel?.gaps.length && (
            <section style={{ ...panelStyle, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 15 }}><Lightbulb size={19} style={{ color: "var(--butter-ink)" }} /><div><h2 style={{ margin: 0, fontSize: 18 }}>Content gap finder</h2><div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 3 }}>Underserved questions inferred from current coverage—not claimed search-volume data.</div></div></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 11 }}>
                {intel.gaps.map((gap, index) => <div key={gap.sourceUrl + index} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 7 }}><span style={{ fontSize: 11, fontWeight: 900, color: "var(--butter-ink)" }}>GAP {index + 1}</span><ConfidenceBadge value={gap.confidence} /></div><div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.4 }}>{gap.question}</div><div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 8 }}>{gap.suggestedFormat}</div></div>)}
              </div>
            </section>
          )}

          {intel?.contentPackage && (
            <section style={{ ...panelStyle, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}><Clapperboard size={19} style={{ color: "var(--sage-ink)" }} /><div><h2 style={{ margin: 0, fontSize: 18 }}>Ready-to-produce package</h2><div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 3 }}>Built from the highest-scoring current opportunity.</div></div></div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(260px,.75fr)", gap: 16 }}>
                <div style={{ border: "1px solid var(--border)", borderRadius: 13, padding: 16 }}>
                  <div style={{ fontSize: 10, color: "var(--sage-ink)", fontWeight: 900, letterSpacing: .8 }}>WORKING TITLE</div><h3 style={{ fontSize: 17, margin: "6px 0 13px" }}>{intel.contentPackage.workingTitle}</h3>
                  {Object.entries(intel.contentPackage.shortScript).map(([key, value]) => <div key={key} style={{ display: "grid", gridTemplateColumns: "62px 1fr", gap: 9, padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 12, lineHeight: 1.55 }}><strong style={{ textTransform: "capitalize" }}>{key}</strong><span>{value}</span></div>)}
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ borderRadius: 13, padding: 17, background: "var(--lavender-bg)", border: "1px solid var(--border)", color: "var(--lavender-ink)", display: "grid", placeItems: "center", minHeight: 116, textAlign: "center" }}><div><div style={{ fontSize: 9, letterSpacing: 1.4, fontWeight: 900 }}>THUMBNAIL TEXT</div><div style={{ fontSize: 22, fontWeight: 950, marginTop: 8 }}>{intel.contentPackage.thumbnailText}</div></div></div>
                  <div style={{ border: "1px solid var(--border)", borderRadius: 13, padding: 14 }}><div style={{ fontSize: 11, fontWeight: 900, marginBottom: 8 }}>Alternative hooks</div>{intel.contentPackage.hooks.slice(1).map((hook, index) => <div key={hook} style={{ fontSize: 11, lineHeight: 1.45, marginTop: 7, display: "flex", gap: 7 }}><span style={{ color: "var(--sky-ink)", fontWeight: 900 }}>{index + 2}.</span><span>{hook}</span></div>)}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10, marginTop: 13 }}>{intel.contentPackage.platformAdaptations.map(item => <div key={item.platform} style={{ border: "1px solid var(--border)", borderRadius: 11, padding: 12 }}><div style={{ fontSize: 11, fontWeight: 900 }}>{item.platform}</div><div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 5, lineHeight: 1.4 }}>{item.execution}</div></div>)}</div>
            </section>
          )}

          {intel?.competitorCoverage && (
            <section style={{ ...panelStyle, padding: 18, display: "flex", gap: 13, alignItems: "flex-start" }}><Users size={19} style={{ color: "var(--sky-ink)", flexShrink: 0 }} /><div><div style={{ fontSize: 13, fontWeight: 900 }}>Public competitor coverage</div><div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5, marginTop: 4 }}>{intel.competitorCoverage.note}</div>{intel.competitorCoverage.requested.length > 0 && <div style={{ marginTop: 7, fontSize: 11 }}>{intel.competitorCoverage.sourcesFound} matching indexed source(s) found for {intel.competitorCoverage.requested.length} reference(s).</div>}</div></section>
          )}

          <section style={{ ...panelStyle, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 11, color: "var(--sage-ink)", fontWeight: 800, letterSpacing: 1.2 }}>LIVE DATA USED</div><h2 style={{ margin: "5px 0 0", fontSize: 18 }}>Full strategic report</h2></div>
              <div style={{ display: "flex", gap: 8 }}><button type="button" onClick={copyResult} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--border)", borderRadius: 9, background: "transparent", padding: "9px 12px", cursor: "pointer" }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy"}</button><button type="button" onClick={downloadResult} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--border)", borderRadius: 9, background: "transparent", padding: "9px 12px", cursor: "pointer" }}><Download size={15} />Download</button></div>
            </div>
            <details style={{ marginTop: 15 }}><summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 7 }}><FileText size={14} /> Open complete report <ChevronDown size={14} /></summary><pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, lineHeight: 1.7, margin: "16px 0 0", paddingTop: 16, borderTop: "1px solid var(--border)" }}>{result.content}</pre></details>
          </section>

          {!!result.sources?.length && (
            <section style={{ ...panelStyle, padding: 22 }}><div style={{ fontSize: 14, fontWeight: 900, marginBottom: 11 }}>Evidence ledger</div><div style={{ display: "grid", gap: 7 }}>{result.sources.map(source => <div key={source.url} style={{ fontSize: 11, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "start", padding: "8px 0", borderBottom: "1px solid var(--border)" }}><a href={source.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: 6, minWidth: 0 }}><ExternalLink size={12} style={{ flexShrink: 0, marginTop: 2 }} /><span>{source.title}</span></a><span style={{ color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{source.platform}{source.publishedAt ? ` · ${new Date(source.publishedAt).toLocaleDateString()}` : ""}</span></div>)}</div>{result.retrievedAt && <div style={{ color: "var(--muted-foreground)", fontSize: 10, marginTop: 12 }}>Retrieved {new Date(result.retrievedAt).toLocaleString()} · Mode: {result.dataMode || "live research"}</div>}</section>
          )}
        </div>
      )}

      <section className="card" style={{ padding: 20, marginTop: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Advanced platform tools</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{PLATFORMS.filter(platform => platform.id !== "tiktok").map(platform => <a key={platform.id} href={platform.id === "youtube" ? "/youtube-strategy" : `/${platform.id}`} style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border)", color: "var(--foreground)", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>{platform.label} tools</a>)}</div>
      </section>
    </main>
  );
}
