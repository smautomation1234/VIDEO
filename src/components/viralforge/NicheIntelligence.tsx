"use client";

import { useState, useCallback } from "react";
import {
  RefreshCw, BarChart2, TrendingUp, Hash, Music, Zap,
  Target, BookOpen, Lightbulb, Copy, Check, ChevronDown, ChevronUp
} from "lucide-react";

const NICHES = [
  "Fitness", "Food & Recipes", "Finance", "Business/Entrepreneurship",
  "Beauty & Fashion", "Travel", "Tech", "Self-Improvement",
  "Parenting", "Real Estate", "Gaming", "Comedy", "Motivation",
];
const PLATFORMS = ["TikTok", "Instagram", "YouTube"];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: copied ? "var(--sage-bg)" : "var(--muted)", border: `1px solid ${copied ? "var(--sage)" : "var(--border)"}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: copied ? "#3D5E41" : "var(--muted-foreground)", transition: "all 0.15s", whiteSpace: "nowrap" as const }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ padding: "12px 14px", background: accent ? "var(--sage-bg)" : "var(--muted)", border: `1px solid ${accent ? "var(--sage)" : "var(--border)"}`, borderRadius: 10 }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: accent ? "#3D5E41" : "var(--foreground)" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ height: 6, background: "var(--muted)", borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
      <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
}

function TrendBadge({ trend, color }: { trend: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 800, color, background: `${color}18`, border: `1px solid ${color}40`, padding: "3px 8px", borderRadius: 20 }}>
      {trend}
    </span>
  );
}

function SaturationDot({ level }: { level: string }) {
  const colors: Record<string, string> = { Low: "#3D5E41", Medium: "#D97706", High: "#DC2626" };
  const c = colors[level] || "#9CA3AF";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c, marginRight: 5 }} />;
}

export default function NicheIntelligence() {
  const [niche, setNiche] = useState("Fitness");
  const [platform, setPlatform] = useState("TikTok");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [expandedHook, setExpandedHook] = useState<number | null>(null);

  const scan = useCallback(async (n = niche, p = platform) => {
    setLoading(true);
    setError(null);
    setData(null);
    setExpandedHook(null);
    try {
      const res = await fetch(`/api/generate/niche-intel?niche=${encodeURIComponent(n)}&platform=${encodeURIComponent(p)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Scan failed");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [niche, platform]);

  const ov = data?.nicheOverview;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Control bar */}
      <div className="card" style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label className="label">Niche</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {NICHES.map((n) => (
              <button
                key={n}
                onClick={() => setNiche(n)}
                style={{ padding: "6px 11px", borderRadius: 7, border: `1px solid ${niche === n ? "var(--primary)" : "var(--border)"}`, background: niche === n ? "var(--primary)" : "var(--card)", color: niche === n ? "#fff" : "var(--muted-foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Platform</label>
          <div style={{ display: "flex", gap: 6 }}>
            {PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                style={{ padding: "6px 11px", borderRadius: 7, border: `1px solid ${platform === p ? "var(--primary)" : "var(--border)"}`, background: platform === p ? "var(--primary)" : "var(--card)", color: platform === p ? "#fff" : "var(--muted-foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => scan(niche, platform)}
          disabled={loading}
          style={{ height: 40, paddingLeft: 22, paddingRight: 22, fontSize: 13, flexShrink: 0 }}
        >
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <BarChart2 size={15} />}
          {loading ? "Scanning 500+ Posts..." : data ? "Re-Scan" : "Run Intelligence Scan"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8, fontSize: 13, color: "#7A3A2A", fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted-foreground)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Niche Intelligence Engine</div>
          <div style={{ fontSize: 14, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            Reverse-engineered from 500+ viral posts per niche. Discover exact hook patterns, trending formats, hashtag opportunities, and the winning formula for your niche.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
            {["🎣 Hook Templates", "📹 Viral Formats", "#️⃣ Trending Tags", "🎵 Hot Audio", "🗂️ Topic Clusters"].map((f) => (
              <span key={f} style={{ padding: "6px 14px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 80, background: "var(--muted)", borderRadius: 10, animation: "pulse-soft 1.5s ease-in-out infinite" }} />
            ))}
          </div>
          {[220, 180, 160].map((h, i) => (
            <div key={i} style={{ height: h, background: "var(--muted)", borderRadius: 10, animation: "pulse-soft 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {data && !loading && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Niche Overview */}
          {ov && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <BarChart2 size={16} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>{niche} Niche Overview — {platform}</span>
                <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: 15, background: "var(--sage-bg)", color: "#3D5E41", padding: "4px 12px", borderRadius: 8 }}>
                  Opportunity: {ov.opportunityScore}/100
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                <StatCard icon="👁️" label="Avg Viral Views" value={ov.avgViralViews >= 1000000 ? `${(ov.avgViralViews / 1000000).toFixed(1)}M` : `${(ov.avgViralViews / 1000).toFixed(0)}K`} accent />
                <StatCard icon="🔥" label="Top Post Views" value={ov.topPostViews >= 1000000 ? `${(ov.topPostViews / 1000000).toFixed(1)}M` : `${(ov.topPostViews / 1000).toFixed(0)}K`} />
                <StatCard icon="💬" label="Avg Engagement" value={ov.avgEngagementRate} />
                <StatCard icon="⚡" label="Content Velocity" value={ov.contentVelocity} />
                <StatCard icon="🏆" label="Competition" value={ov.competitionLevel} />
                <StatCard icon="📅" label="Best Day" value={ov.bestDayToPost} />
                <StatCard icon="🕐" label="Best Time" value={ov.bestTimeToPost} accent />
                <StatCard icon="📈" label="Rising Keyword" value={ov.risingKeyword} />
              </div>
            </div>
          )}

          {/* Hook Patterns */}
          {data.hookPatterns?.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Target size={16} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>🎣 Viral Hook Patterns — Ranked by Performance</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.hookPatterns.map((hook: any, i: number) => (
                  <div key={i} style={{ border: `1px solid ${expandedHook === i ? "var(--primary)" : "var(--border)"}`, borderRadius: 10, overflow: "hidden", transition: "border 0.15s" }}>
                    <button
                      onClick={() => setExpandedHook(expandedHook === i ? null : i)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: expandedHook === i ? "var(--muted)" : "var(--card)", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                    >
                      <span style={{ width: 26, height: 26, borderRadius: 8, background: i === 0 ? "var(--primary)" : "var(--muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i === 0 ? "#fff" : "var(--muted-foreground)", flexShrink: 0 }}>
                        #{hook.rank}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic" }}>"{hook.template}"</div>
                        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
                          Trigger: <strong>{hook.trigger}</strong> · Avg: {hook.avgViews >= 1000000 ? `${(hook.avgViews / 1000000).toFixed(1)}M` : `${(hook.avgViews / 1000).toFixed(0)}K`} views
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, background: hook.successRate >= 80 ? "var(--sage-bg)" : "var(--muted)", color: hook.successRate >= 80 ? "#3D5E41" : "var(--muted-foreground)", padding: "3px 9px", borderRadius: 6 }}>
                          {hook.successRate}%
                        </span>
                        {expandedHook === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {expandedHook === i && (
                      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid var(--border)", background: "var(--muted)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <ScoreBar score={hook.successRate} color="#3D5E41" />
                        <div style={{ padding: "10px 12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted-foreground)", marginBottom: 4 }}>Example</div>
                          <div style={{ fontSize: 14, fontStyle: "italic", fontWeight: 600 }}>"{hook.example}"</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                          <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0, flex: 1 }}>💡 {hook.why}</p>
                          <CopyBtn text={hook.template} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Formats + Topic Clusters — 2-col */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>

            {/* Formats */}
            {data.trendingFormats?.length > 0 && (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <TrendingUp size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>📹 Viral Formats — Market Share</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.trendingFormats.map((fmt: any, i: number) => (
                    <div key={i} style={{ padding: "12px 14px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 9 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{fmt.format}</span>
                        <TrendBadge trend={fmt.trend} color={fmt.trendColor} />
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <div style={{ flex: 1, height: 8, background: "var(--card)", borderRadius: 4, overflow: "hidden", border: "1px solid var(--border)" }}>
                          <div style={{ width: `${fmt.shareOfViral}%`, height: "100%", background: fmt.trendColor, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 34, color: fmt.trendColor }}>{fmt.shareOfViral}%</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                          Avg: {fmt.avgViews >= 1000000 ? `${(fmt.avgViews / 1000000).toFixed(1)}M` : `${(fmt.avgViews / 1000).toFixed(0)}K`} views
                        </span>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>·</span>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{fmt.idealLength}</span>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>·</span>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{fmt.editingStyle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topic Clusters */}
            {data.topicClusters?.length > 0 && (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <BookOpen size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>🗂️ Topic Clusters — Opportunity Map</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.topicClusters.map((cluster: any, i: number) => (
                    <div key={i} style={{ padding: "11px 13px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 9 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{cluster.topic}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, background: cluster.viralScore >= 85 ? "var(--sage-bg)" : cluster.viralScore >= 75 ? "var(--amber-bg)" : "var(--muted)", color: cluster.viralScore >= 85 ? "#3D5E41" : cluster.viralScore >= 75 ? "#7A5A2A" : "var(--muted-foreground)", padding: "2px 8px", borderRadius: 6 }}>
                          {cluster.viralScore}/100
                        </span>
                      </div>
                      <ScoreBar score={cluster.viralScore} color={cluster.viralScore >= 85 ? "#3D5E41" : cluster.viralScore >= 75 ? "#D97706" : "#9CA3AF"} />
                      <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                          <SaturationDot level={cluster.saturation} />{cluster.saturation} Saturation
                        </span>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>·</span>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                          {cluster.posts7d >= 1000 ? `${(cluster.posts7d / 1000).toFixed(1)}K` : cluster.posts7d} posts/7d
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hashtags + Audio — 2-col */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>

            {/* Trending Hashtags */}
            {data.trendingHashtags?.length > 0 && (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Hash size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>#️⃣ Trending Hashtags</span>
                  <CopyBtn text={data.trendingHashtags.map((h: any) => `#${h.tag}`).join(" ")} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.trendingHashtags.map((tag: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>#{tag.tag}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#3D5E41" }}>{tag.weeklyGrowth}</span>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", minWidth: 40, textAlign: "right" as const }}>{tag.uses}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: tag.opportunity === "High" ? "var(--sage-bg)" : tag.opportunity === "Medium" ? "var(--amber-bg)" : "var(--muted)", color: tag.opportunity === "High" ? "#3D5E41" : tag.opportunity === "Medium" ? "#7A5A2A" : "var(--muted-foreground)", border: `1px solid ${tag.opportunity === "High" ? "var(--sage)" : tag.opportunity === "Medium" ? "var(--amber)" : "var(--border)"}` }}>
                        {tag.opportunity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Audio */}
            {data.trendingAudio?.length > 0 && (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Music size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>🎵 Trending Audio</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.trendingAudio.map((audio: any, i: number) => (
                    <div key={i} style={{ padding: "12px 14px", background: i === 0 ? "var(--rose-bg)" : "var(--muted)", border: `1px solid ${i === 0 ? "var(--rose)" : "var(--border)"}`, borderRadius: 9 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>🎵 {audio.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: i === 0 ? "#DC2626" : "#D97706" }}>{audio.trend}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>
                        {audio.uses} uses · <em>{audio.vibe}</em>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Wins */}
                {data.quickWins?.length > 0 && (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Lightbulb size={15} color="var(--primary)" />
                      <span style={{ fontWeight: 700, fontSize: 14 }}>⚡ Quick Wins</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {data.quickWins.map((tip: string, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", background: "var(--sage-bg)", border: "1px solid var(--sage)", borderRadius: 7 }}>
                          <span style={{ color: "#3D5E41", fontSize: 13, lineHeight: 1, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 13, color: "var(--foreground)" }}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Viral Formula */}
          {data.viralFormula && (
            <div className="card" style={{ border: "2px solid var(--primary)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -50, right: -50, width: 160, height: 160, background: "var(--sage)", filter: "blur(60px)", opacity: 0.15, borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ padding: 8, background: "var(--primary)", borderRadius: 9 }}>
                  <Zap size={16} color="#fff" />
                </div>
                <span style={{ fontWeight: 800, fontSize: 15 }}>The Winning Formula for {niche} on {platform}</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: "var(--foreground)", margin: 0, padding: "12px 14px", background: "var(--muted)", borderRadius: 9, border: "1px solid var(--border)" }}>
                {data.viralFormula}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
