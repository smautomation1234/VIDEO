"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Activity,
  BookOpenCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  History,
  Images,
  Instagram,
  Linkedin,
  Loader2,
  Search,
  Sprout,
  Twitter,
  Youtube,
} from "lucide-react";
import type { EvergreenPlatform, EvergreenResearchResult, EvergreenIdea } from "@/lib/evergreen-research";
import { addBriefToGrowthWorkspace } from "@/lib/growth-workspace";
import { RESEARCH_NICHES } from "@/lib/research-niches";
import { ErrorBanner } from "@/components/ui/Helpers";

const PLATFORMS: Array<{ id: EvergreenPlatform; label: string; icon: typeof Youtube; color: string }> = [
  { id: "youtube", label: "YouTube", icon: Youtube, color: "#ef4444" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#ec4899" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#2563eb" },
  { id: "x", label: "X / Twitter", icon: Twitter, color: "#111827" },
];

const DESTINATIONS: Record<EvergreenPlatform, { path: string; tool: string }> = {
  youtube: { path: "/youtube-strategy", tool: "5" },
  instagram: { path: "/instagram", tool: "3" },
  linkedin: { path: "/linkedin", tool: "4" },
  x: { path: "/x", tool: "4" },
};

export default function EvergreenContentLabPage() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState<EvergreenPlatform>("youtube");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EvergreenResearchResult | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedNiche = params.get("niche") || localStorage.getItem("activeContentNiche") || "";
    const requestedPlatform = params.get("platform") as EvergreenPlatform | null;
    if (requestedNiche) setNiche(requestedNiche);
    if (requestedPlatform && PLATFORMS.some(item => item.id === requestedPlatform)) setPlatform(requestedPlatform);
  }, []);

  const scan = async () => {
    const cleanNiche = niche.trim();
    if (cleanNiche.length < 2) {
      setError("Enter a specific niche first, for example: personal finance for Indian beginners.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    localStorage.setItem("activeContentNiche", cleanNiche);
    try {
      const response = await fetch("/api/evergreen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: cleanNiche, platform }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Evergreen research failed.");
      setResult(data as EvergreenResearchResult);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Evergreen research failed.");
    } finally {
      setLoading(false);
    }
  };

  const createFromIdea = (idea: EvergreenIdea) => {
    const selectedPlatform = PLATFORMS.find(item => item.id === platform)?.label || platform;
    const brief = {
      origin: "evergreen-lab",
      niche: result?.niche || niche.trim(),
      platform: selectedPlatform,
      title: idea.title,
      sourceTitle: idea.title,
      sourceUrl: idea.sourceVideoUrl,
      sourceChannel: idea.sourceChannel,
      content: idea.description,
      hook: idea.hook,
      evergreenReason: idea.whyEvergreen,
      keywords: idea.keywords,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("activeContentBrief", JSON.stringify(brief));
    addBriefToGrowthWorkspace(brief);
    const destination = DESTINATIONS[platform];
    router.push(`${destination.path}?niche=${encodeURIComponent(result?.niche || niche.trim())}&useBrief=1&tool=${destination.tool}`);
  };

  const sendToCarousel = (idea: EvergreenIdea) => {
    const source = [
      `Headline: ${idea.title}`,
      `Hook: ${idea.hook}`,
      idea.description ? `Why it matters: ${idea.description}` : "",
      idea.whyEvergreen ? `Evergreen opportunity: ${idea.whyEvergreen}` : "",
      idea.keywords?.length ? `Keywords: ${idea.keywords.join(", ")}` : "",
      idea.sourceVideoUrl ? `Source: ${idea.sourceVideoUrl}` : "",
    ].filter(Boolean).join("\n\n");
    const brief = {
      origin: "evergreen-lab",
      niche: result?.niche || niche.trim(),
      platform: "Carousel",
      title: idea.title,
      sourceTitle: idea.title,
      sourceUrl: idea.sourceVideoUrl,
      sourceChannel: idea.sourceChannel,
      content: source,
      hook: idea.hook,
      evergreenReason: idea.whyEvergreen,
      keywords: idea.keywords,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("activeContentBrief", JSON.stringify(brief));
    addBriefToGrowthWorkspace(brief);
    router.push(`/carousel?topic=${encodeURIComponent(source)}&returnTo=${encodeURIComponent('/research/evergreen')}`);
  };

  const copyIdea = async (idea: EvergreenIdea, index: number) => {
    await navigator.clipboard.writeText(`${idea.title}\n\nHook: ${idea.hook}\n\n${idea.description}\n\nKeywords: ${idea.keywords.join(", ")}\nSource: ${idea.sourceVideoUrl}`);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 64, display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="card" style={{ padding: 5, display: "flex", gap: 5, width: "fit-content" }}>
        <button type="button" onClick={() => router.push(`/trends?niche=${encodeURIComponent(niche.trim())}`)} style={{ border: 0, borderRadius: 8, padding: "9px 14px", background: "transparent", color: "var(--muted-foreground)", fontWeight: 850, cursor: "pointer", display: "flex", gap: 7, alignItems: "center" }}><Activity size={14} /> Live topics</button>
        <button type="button" style={{ border: 0, borderRadius: 8, padding: "9px 14px", background: "var(--primary)", color: "#fff", fontWeight: 850, cursor: "pointer", display: "flex", gap: 7, alignItems: "center" }}><Sprout size={14} /> Evergreen ideas</button>
      </div>

      <section className="card" style={{ padding: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px,1fr) auto", gap: 14, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 7, fontSize: 12, fontWeight: 800 }}>
            Niche or specific audience
            <input
              value={niche}
              onChange={event => setNiche(event.target.value)}
              onKeyDown={event => { if (event.key === "Enter" && !loading) scan(); }}
              placeholder="e.g. personal finance for Indian beginners"
              style={{ width: "100%", height: 44, border: "1px solid var(--border)", borderRadius: 10, padding: "0 13px", background: "var(--background)", color: "var(--foreground)" }}
            />
          </label>
          <button onClick={scan} disabled={loading} className="btn btn-primary" style={{ height: 44, minWidth: 190, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
            {loading ? "Scanning public evidence…" : "Find evergreen ideas"}
          </button>
        </div>
        <div style={{ marginTop: 15 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "var(--muted-foreground)", marginBottom: 8 }}>POPULAR NICHES — OR ENTER ANY CUSTOM NICHE ABOVE</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {RESEARCH_NICHES.map(item => {
              const selected = niche.trim().toLowerCase() === item.label.toLowerCase();
              return <button key={item.id} type="button" onClick={() => setNiche(item.label)} style={{ border: `1px solid ${selected ? item.color : "var(--border)"}`, background: selected ? `${item.color}12` : "transparent", color: selected ? item.color : "var(--muted-foreground)", borderRadius: 18, padding: "6px 10px", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>{item.icon} {item.label}</button>;
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 15 }}>
          {PLATFORMS.map(item => {
            const Icon = item.icon;
            const selected = platform === item.id;
            return <button key={item.id} onClick={() => setPlatform(item.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 9, cursor: "pointer", fontWeight: 750, fontSize: 12, border: `1px solid ${selected ? item.color : "var(--border)"}`, background: selected ? `${item.color}12` : "transparent", color: selected ? item.color : "var(--muted-foreground)" }}><Icon size={15} />{item.label}</button>;
          })}
        </div>
        <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: "13px 0 0" }}>No social account connection required. The research source is public YouTube search; the selected platform controls how each idea is packaged.</p>
      </section>

      {error && <ErrorBanner message={error} />}

      {result && (
        <>
          <section className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--sage-ink)", fontWeight: 900, display: "flex", gap: 7, alignItems: "center" }}><BookOpenCheck size={16} /> RESEARCH SUMMARY</div>
                <p style={{ margin: "9px 0 0", lineHeight: 1.65, maxWidth: 820 }}>{result.summary}</p>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted-foreground)", fontSize: 11 }}><History size={13} /> Scanned {new Date(result.researchedAt).toLocaleString()}</span>
            </div>
            <div style={{ marginTop: 14, padding: 12, borderRadius: 9, background: "var(--sage-bg)", color: "var(--muted-foreground)", fontSize: 11, lineHeight: 1.55 }}>{result.methodology}</div>
          </section>

          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 11 }}>
              <div><h2 style={{ fontSize: 19, margin: 0 }}>Channels recurring in niche searches</h2><p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>Based on appearances across the three public searches—not subscriber ranking.</p></div>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{result.evidence.length} unique public videos inspected</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              {result.channels.slice(0, 6).map(channel => (
                <article key={`${channel.name}-${channel.url}`} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ fontSize: 14 }}>{channel.name}</strong><span style={{ whiteSpace: "nowrap", color: "var(--sage-ink)", fontSize: 11, fontWeight: 800 }}>{channel.appearances} result{channel.appearances === 1 ? "" : "s"}</span></div>
                  <ul style={{ paddingLeft: 17, margin: "10px 0 12px", color: "var(--muted-foreground)", fontSize: 11, lineHeight: 1.55 }}>{channel.sampleTitles.slice(0, 2).map(title => <li key={title} style={{ marginBottom: 5 }}>{title}</li>)}</ul>
                  {channel.url && <a href={channel.url} target="_blank" rel="noreferrer" style={{ color: "var(--sage-ink)", fontSize: 12, fontWeight: 800, display: "inline-flex", gap: 5, alignItems: "center" }}>Open public channel <ExternalLink size={12} /></a>}
                </article>
              ))}
            </div>
          </section>

          <section>
            <div style={{ marginBottom: 11 }}><h2 style={{ fontSize: 19, margin: 0 }}>Evergreen content opportunities</h2><p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>Each idea has a real public evidence link and is adapted for {PLATFORMS.find(item => item.id === platform)?.label}.</p></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 14 }}>
              {result.ideas.map((idea, index) => (
                <article key={`${idea.title}-${index}`} className="card" style={{ padding: 19, display: "flex", flexDirection: "column", gap: 11 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ minWidth: 28, height: 28, borderRadius: 14, display: "grid", placeItems: "center", background: "var(--sage-bg)", color: "var(--sage-ink)", fontSize: 11, fontWeight: 900 }}>{index + 1}</span><h3 style={{ fontSize: 16, lineHeight: 1.35, margin: 2 }}>{idea.title}</h3></div>
                  <div style={{ fontSize: 11, color: "var(--sage-ink)", fontWeight: 850 }}>{idea.searchIntent} · {idea.format}</div>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: "var(--muted-foreground)" }}>{idea.whyEvergreen}</p>
                  <div style={{ padding: 11, borderRadius: 9, background: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}><strong>Hook:</strong> {idea.hook}</div>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55 }}>{idea.description}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{idea.keywords.map(keyword => <span key={keyword} style={{ fontSize: 10, padding: "4px 7px", borderRadius: 12, background: "var(--sage-bg)", color: "var(--sage-ink)" }}>{keyword}</span>)}</div>
                  <a href={idea.sourceVideoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--muted-foreground)", display: "inline-flex", alignItems: "center", gap: 5 }}>Evidence: {idea.sourceChannel} <ExternalLink size={11} /></a>
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
                    <button onClick={() => createFromIdea(idea)} className="btn btn-primary" style={{ flex: 1, display: "flex", justifyContent: "center", gap: 7, alignItems: "center" }}>Create for {PLATFORMS.find(item => item.id === platform)?.label} <ArrowUpRight size={14} /></button>
                    <button onClick={() => sendToCarousel(idea)} className="btn btn-secondary" style={{ display: "flex", justifyContent: "center", gap: 6, alignItems: "center", fontSize: 12, fontWeight: 800, color: "var(--sky-ink)" }}><Images size={14} />Carousel</button>
                    <button onClick={() => copyIdea(idea, index)} className="btn btn-secondary" aria-label="Copy idea">{copied === index ? <CheckCircle2 size={15} color="var(--sage-ink)" /> : <Copy size={15} />}</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="card" style={{ padding: 20 }}><h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Content gaps to own</h3>{result.gaps.map(gap => <div key={gap} style={{ display: "flex", gap: 8, margin: "9px 0", fontSize: 12, lineHeight: 1.5 }}><CheckCircle2 size={15} color="var(--sage-ink)" style={{ flexShrink: 0, marginTop: 2 }} />{gap}</div>)}</div>
            <div className="card" style={{ padding: 20 }}><h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Recommended action plan</h3>{result.actions.map(action => <div key={action} style={{ display: "flex", gap: 8, margin: "9px 0", fontSize: 12, lineHeight: 1.5 }}><CheckCircle2 size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />{action}</div>)}</div>
          </section>
        </>
      )}
    </div>
  );
}
