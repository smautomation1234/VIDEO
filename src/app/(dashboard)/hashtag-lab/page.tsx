"use client";
import React, { useState } from "react";
import { Hash, Sparkles, Copy, Check, RefreshCw, TrendingUp, Shield } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const FOLLOWER_RANGES = [
  "Under 1K", "1K–10K", "10K–50K", "50K–100K", "100K–500K", "500K+",
];

const TIER_CONFIG = [
  { tier: 1, label: "Niche", subtitle: "Under 500K posts — can rank here", ink: "var(--sage-ink)", bg: "var(--sage-bg)", border: "var(--sage)" },
  { tier: 2, label: "Mid", subtitle: "500K – 2M posts — balance reach & competition", ink: "var(--sky-ink)", bg: "var(--sky-bg)", border: "var(--sky)" },
  { tier: 3, label: "Broad", subtitle: "2M+ posts — maximum exposure", ink: "var(--butter-ink)", bg: "var(--butter-bg)", border: "var(--butter)" },
  { tier: 4, label: "Keyword", subtitle: "Search-based terms people actually type", ink: "var(--lavender-ink)", bg: "var(--lavender-bg)", border: "var(--lavender)" },
];

const RANK_COLORS: Record<string, string> = {
  High: "var(--sage-ink)", Medium: "var(--butter-ink)", Low: "var(--rose-ink)",
};

function SkeletonTier() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="animate-pulse-soft" style={{ height: 18, width: "35%", background: "var(--muted)", borderRadius: 6 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse-soft" style={{ height: 52, background: "var(--muted)", borderRadius: 10, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

export default function HashtagLabPage() {
  const [topic, setTopic] = useState("");
  const platform = "Instagram";
  const [followerCount, setFollowerCount] = useState("1K–10K");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate/hashtag-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, followerCount, niche }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopiedMap((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const copyAll = () => {
    if (!result?.finalMix) return;
    copy(result.finalMix.join(" "), "all");
  };


  const hashtagsByTier = (tier: number) =>
    result?.hashtags?.filter((h: any) => h.tier === tier) ?? [];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Create"
        title="Hashtag lab"
        description="Balanced hashtag sets tuned to your topic and platform."
      />

      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} color="var(--sage-ink)" /> Configure Your Post
            </h2>

            <div>
              <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
                Post Topic *
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How to make passive income with digital products..."
                className="input-field"
                style={{ width: "100%", height: 90, fontSize: 13, resize: "none", lineHeight: 1.6 }}
              />
            </div>


            <div>
              <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
                Current Following Size
              </label>
              <select
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
                className="input-field"
                style={{ width: "100%", fontSize: 13 }}
              >
                {FOLLOWER_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
                Your Niche
              </label>
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Digital Marketing, Fitness, Finance..."
                className="input-field"
                style={{ width: "100%", fontSize: 13 }}
              />
            </div>

            <button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%" }}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Hash size={16} />}
              {loading ? "Researching Hashtags..." : "Generate Hashtag Strategy"}
            </button>

            {error && (
              <div style={{ padding: 12, background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8, color: "var(--rose-ink)", fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>4-Tier Strategy</h3>
            {TIER_CONFIG.map((t) => (
              <div key={t.tier} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: t.bg, borderRadius: 8, border: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 14, flexShrink: 0, color: t.ink }}>{t.tier}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.ink }}>Tier {t.tier} — {t.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{t.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="animate-pulse-soft" style={{ height: 80, background: "var(--muted)", borderRadius: 12 }} />
              {Array.from({ length: 4 }).map((_, i) => <SkeletonTier key={i} />)}
            </div>
          ) : result ? (
            <>
              <div style={{ background: "var(--sage-bg)", border: "1px solid var(--sage)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--sage-ink)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>
                      Recommended Final Mix
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Best {result.finalMix?.length || 5} hashtags to use together</div>
                  </div>
                  <button
                    onClick={copyAll}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: copiedMap["all"] ? "var(--sage-ink)" : "var(--card)", border: `1px solid ${copiedMap["all"] ? "var(--sage-ink)" : "var(--border)"}`, color: copiedMap["all"] ? "var(--background)" : "var(--foreground)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {copiedMap["all"] ? <><Check size={12} /> Copied All</> : <><Copy size={12} /> Copy All</>}
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.finalMix?.map((tag: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => copy(tag, `mix-${i}`)}
                      style={{ padding: "8px 14px", borderRadius: 20, background: "var(--card)", border: `1px solid ${copiedMap[`mix-${i}`] ? "var(--sage-ink)" : "var(--border)"}`, color: copiedMap[`mix-${i}`] ? "var(--sage-ink)" : "var(--foreground)", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5 }}
                    >
                      {copiedMap[`mix-${i}`] ? <Check size={12} /> : null}
                      {tag}
                    </button>
                  ))}
                </div>
                {result.strategy && (
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 14, lineHeight: 1.6, padding: "10px 14px", background: "var(--card)", borderRadius: 8 }}>
                    {result.strategy}
                  </p>
                )}
              </div>

              {TIER_CONFIG.map((tierConf) => {
                const items = hashtagsByTier(tierConf.tier);
                if (!items.length) return null;
                return (
                  <div key={tierConf.tier} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", background: tierConf.bg, borderBottom: `1px solid ${tierConf.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                      <Hash size={15} color={tierConf.ink} />
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: tierConf.ink }}>Tier {tierConf.tier} — {tierConf.label} Hashtags</span>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: 8 }}>({items.length} tags)</span>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: "auto" }}>{tierConf.subtitle}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {items.map((h: any, i: number) => {
                        const rColor = RANK_COLORS[h.rankingProbability] || "var(--muted-foreground)";
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: tierConf.ink, minWidth: 120 }}>{h.tag}</span>
                            <span style={{ fontSize: 11, color: "var(--muted-foreground)", flex: 1 }}>{h.relevance}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                              <span style={{ fontSize: 11, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>~{h.estimatedPosts}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: rColor, background: "var(--muted)", padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                                {h.rankingProbability} rank
                              </span>
                              <button
                                onClick={() => copy(h.tag, `h-${tierConf.tier}-${i}`)}
                                style={{ background: copiedMap[`h-${tierConf.tier}-${i}`] ? "var(--sage-bg)" : "var(--muted)", border: `1px solid ${copiedMap[`h-${tierConf.tier}-${i}`] ? "var(--sage)" : "var(--border)"}`, color: copiedMap[`h-${tierConf.tier}-${i}`] ? "var(--sage-ink)" : "var(--muted-foreground)", borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}
                              >
                                {copiedMap[`h-${tierConf.tier}-${i}`] ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {result.postingTip && (
                  <div style={{ padding: 16, background: "var(--sky-bg)", border: "1px solid var(--sky)", borderRadius: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sky-ink)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <TrendingUp size={13} /> Pro Tip for {platform}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0 }}>{result.postingTip}</p>
                  </div>
                )}
                {result.avoidList && (
                  <div style={{ padding: 16, background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--rose-ink)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <Shield size={13} /> Oversaturated — Avoid These
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {result.avoidList.map((tag: string, i: number) => (
                        <span key={i} style={{ fontSize: 12, color: "var(--rose-ink)", background: "var(--card)", padding: "3px 10px", borderRadius: 20, textDecoration: "line-through", opacity: 0.8 }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, background: "var(--card)", borderRadius: 16, border: "1px dashed var(--border)", gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "var(--sage-bg)", border: "1px solid var(--sage)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Hash size={32} color="var(--sage-ink)" style={{ opacity: 0.7 }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginBottom: 8 }}>4-Tier Hashtag Strategy</div>
                <div style={{ fontSize: 13, color: "var(--muted-foreground)", maxWidth: 320, lineHeight: 1.6 }}>
                  Enter your post topic, platform, and account size to get a custom hashtag strategy you can actually rank for.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
