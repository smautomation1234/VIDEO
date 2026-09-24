"use client";

import { useState } from "react";
import {
  Zap, TrendingUp, Brain, AlertCircle, Clock, Star,
  ChevronRight, BarChart2, Flame, Target, Globe, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UniversalPattern {
  rank: number;
  template: string;
  trigger: string;
  worksForNiches: string[];
  psychology: string;
  adaptedExample: string;
  viralScore: number;
  adaptability: string;
}
interface PowerWord {
  word: string;
  crossNicheScore: number;
  niches: string[];
  avgViewBoost: string;
}
interface Trending24h {
  pattern: string;
  trendStatus: string;
  useBy: string;
  example: string;
}
interface OpportunityItem {
  element: string;
  growthRate: number;
  avgViews: number;
  currentUses: number;
  saturation: string;
  score: number;
  verdict: string;
}
interface EmotionalTrigger {
  trigger: string;
  count: number;
  percentage: number;
  avgViralScore: number;
  topExample: string;
}
interface AnalysisResult {
  niche: string;
  platform: string;
  generatedAt: string;
  universalPatterns: UniversalPattern[];
  powerWords: PowerWord[];
  trending24h: Trending24h[];
  opportunityMap: OpportunityItem[];
  emotionalTriggers: EmotionalTrigger[];
  niqueInsight: string;
  meta: { postsAnalyzed: string; nichesScanned: number; dataFreshness: string; modelUsed: string };
}

// ─── Constants ───────────────────────────────────────────────────────────────
const NICHES = [
  "Fitness","Business","Food","Fashion","Finance","Travel",
  "Beauty","Gaming","Education","Real Estate","Relationships","Comedy",
  "Music","Tech","Pets","Parenting","DIY/Crafts","Mental Health",
];
const PLATFORMS = ["TikTok","Instagram","YouTube","LinkedIn"];

const TRIGGER_COLORS: Record<string, string> = {
  curiosity:    "#7C3AED",
  shock:        "#DC2626",
  fomo:         "#D97706",
  controversy:  "#B91C1C",
  aspiration:   "#059669",
  relatability: "#2563EB",
  urgency:      "#EA580C",
  exclusivity:  "#9333EA",
};

const SATURATION_COLORS: Record<string, string> = {
  low: "#059669", medium: "#D97706", high: "#DC2626",
};

const TREND_COLORS: Record<string, string> = {
  EXPLODING: "#DC2626", HOT: "#D97706", RISING: "#059669",
  EMERGING: "#7C3AED", PEAK: "#2563EB",
};

// ─── Utility ─────────────────────────────────────────────────────────────────
function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const color = score >= 85 ? "#059669" : score >= 70 ? "#D97706" : "#DC2626";
  const padding = size === "lg" ? "8px 14px" : size === "sm" ? "3px 8px" : "5px 10px";
  const fontSize = size === "lg" ? 18 : size === "sm" ? 11 : 13;
  return (
    <span style={{
      background: `${color}20`, color, border: `1px solid ${color}40`,
      borderRadius: 8, padding, fontSize, fontWeight: 800, fontVariantNumeric: "tabular-nums",
    }}>
      {score}
    </span>
  );
}

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function UniversalPatternsPanel({ patterns }: { patterns: UniversalPattern[] }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {patterns.map((p, i) => (
        <div
          key={i}
          style={{
            border: "1px solid var(--border)", borderRadius: 10,
            overflow: "hidden", background: "var(--card)",
          }}
        >
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              width: "100%", padding: "12px 16px", background: "transparent",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              gap: 12, fontFamily: "inherit", textAlign: "left",
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: 6, background: "var(--primary)",
              color: "#fff", fontSize: 12, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              #{p.rank}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                {p.template}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, background: "#7C3AED20", color: "#7C3AED", padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>
                  {p.trigger}
                </span>
                {(p.worksForNiches || []).slice(0, 3).map((n) => (
                  <span key={n} style={{ fontSize: 11, background: "var(--muted)", color: "var(--muted-foreground)", padding: "2px 7px", borderRadius: 5 }}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <ScoreBadge score={p.viralScore} size="sm" />
            <ChevronRight size={14} style={{
              color: "var(--muted-foreground)", flexShrink: 0,
              transform: expanded === i ? "rotate(90deg)" : "none", transition: "transform 0.2s",
            }} />
          </button>
          {expanded === i && (
            <div style={{ padding: "0 16px 14px 54px", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: "var(--muted)", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, marginBottom: 4 }}>ADAPTED EXAMPLE</div>
                  <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--foreground)" }}>"{p.adaptedExample}"</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "var(--muted)", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, marginBottom: 4 }}>🧠 PSYCHOLOGY</div>
                    <div style={{ fontSize: 12, color: "var(--foreground)" }}>{p.psychology}</div>
                  </div>
                  <div style={{ background: "var(--muted)", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, marginBottom: 4 }}>🔧 ADAPTABILITY</div>
                    <div style={{ fontSize: 12, color: "var(--foreground)" }}>{p.adaptability}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EmotionalTriggersPanel({ triggers }: { triggers: EmotionalTrigger[] }) {
  const max = Math.max(...triggers.map(t => t.avgViralScore), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {triggers.map((t, i) => {
        const color = TRIGGER_COLORS[t.trigger] || "#7C3AED";
        const barW = (t.avgViralScore / max) * 100;
        return (
          <div key={i} style={{ background: "var(--muted)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                background: `${color}20`, color, padding: "3px 9px", borderRadius: 6, border: `1px solid ${color}30`,
              }}>
                {t.trigger}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: "auto" }}>
                {t.percentage}% of viral posts
              </span>
              <ScoreBadge score={t.avgViralScore} size="sm" />
            </div>
            <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${barW}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
            </div>
            {t.topExample && (
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--muted-foreground)", fontStyle: "italic" }}>
                e.g. "{t.topExample}"
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PowerWordsPanel({ words }: { words: PowerWord[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
      {words.map((w, i) => {
        const score = w.crossNicheScore;
        const color = score >= 85 ? "#059669" : score >= 70 ? "#D97706" : "#7C3AED";
        return (
          <div key={i} style={{
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
            padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)" }}>{w.word}</span>
              <ScoreBadge score={score} size="sm" />
            </div>
            <div style={{ fontSize: 12, color, fontWeight: 700 }}>{w.avgViewBoost} avg views</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(w.niches || []).slice(0, 3).map((n) => (
                <span key={n} style={{ fontSize: 10, background: "var(--muted)", color: "var(--muted-foreground)", padding: "2px 6px", borderRadius: 4 }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Trending24hPanel({ items }: { items: Trending24h[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => {
        const color = TREND_COLORS[item.trendStatus] || "#D97706";
        return (
          <div key={i} style={{
            background: "var(--card)", border: `1px solid ${color}30`, borderRadius: 10,
            padding: "14px 16px", display: "flex", gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 9, background: `${color}20`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Flame size={18} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, background: `${color}20`,
                  color, padding: "2px 8px", borderRadius: 5,
                }}>
                  {item.trendStatus}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={10} /> Use by: {item.useBy}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{item.pattern}</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>"{item.example}"</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OpportunityMapPanel({ items }: { items: OpportunityItem[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => {
        const satColor = SATURATION_COLORS[item.saturation] || "#D97706";
        return (
          <div key={i} style={{
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
            padding: "12px 16px", display: "flex", alignItems: "center", gap: 14,
          }}>
            <ScoreBadge score={item.score} size="lg" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{item.element}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                  📈 {item.growthRate > 0 ? "+" : ""}{item.growthRate}% growth
                </span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                  👁 {(item.avgViews / 1000000).toFixed(1)}M avg views
                </span>
                <span style={{ fontSize: 11, background: `${satColor}20`, color: satColor, padding: "1px 7px", borderRadius: 5, fontWeight: 600 }}>
                  {item.saturation} saturation
                </span>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: item.score >= 70 ? "#059669" : "#D97706", textAlign: "right", maxWidth: 140 }}>
              {item.verdict}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PatternAnalyzer() {
  const [niche, setNiche] = useState("Fitness");
  const [platform, setPlatform] = useState("TikTok");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [activePanel, setActivePanel] = useState<string>("patterns");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/generate/pattern-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
      setActivePanel("patterns");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const PANELS = [
    { id: "patterns",   label: "Universal Patterns",   icon: <Globe size={13} /> },
    { id: "triggers",   label: "Emotional Triggers",   icon: <Brain size={13} /> },
    { id: "powerwords", label: "Power Words",          icon: <Star size={13} /> },
    { id: "trending",   label: "Trending Now",         icon: <Flame size={13} /> },
    { id: "opportunity",label: "Opportunity Map",      icon: <Target size={13} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Config Card ─────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 20,
      }}>
        <SectionTitle
          icon={<BarChart2 size={18} color="#fff" />}
          title="Universal Pattern Analyzer"
          sub="Cross-niche intelligence engine — finds what works across ALL industries"
        />

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              NICHE
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px", background: "var(--muted)",
                border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)",
                fontFamily: "inherit", fontSize: 13, cursor: "pointer",
              }}
            >
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
              PLATFORM
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px", background: "var(--muted)",
                border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)",
                fontFamily: "inherit", fontSize: 13, cursor: "pointer",
              }}
            >
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: "10px 24px", background: loading ? "var(--muted)" : "var(--primary)",
              color: loading ? "var(--muted-foreground)" : "#fff", border: "none",
              borderRadius: 9, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", fontWeight: 700, fontSize: 14,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Analyzing…</> : <><Zap size={15} /> Analyze Patterns</>}
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { icon: "📊", label: "Posts Analyzed", val: "500K+" },
            { icon: "🌍", label: "Niches Scanned", val: "20" },
            { icon: "⚡", label: "Analysis Speed", val: "~15 sec" },
            { icon: "🎯", label: "Pattern Types", val: "5" },
          ].map((s) => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 12px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: "#DC262610", border: "1px solid #DC262630",
          borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center",
        }}>
          <AlertCircle size={16} color="#DC2626" />
          <span style={{ fontSize: 13, color: "#DC2626" }}>{error}</span>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      {result && (
        <>
          {/* Insight Banner */}
          {result.niqueInsight && (
            <div style={{
              background: "linear-gradient(135deg, #7C3AED15, #2563EB10)",
              border: "1px solid #7C3AED30", borderRadius: 12, padding: "14px 18px",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <Brain size={20} color="#7C3AED" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", marginBottom: 4 }}>KEY INSIGHT</div>
                <div style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>{result.niqueInsight}</div>
              </div>
            </div>
          )}

          {/* Panel tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PANELS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePanel(p.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8, border: `1px solid ${activePanel === p.id ? "var(--primary)" : "var(--border)"}`,
                  background: activePanel === p.id ? "var(--primary)" : "var(--card)",
                  color: activePanel === p.id ? "#fff" : "var(--muted-foreground)",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12,
                }}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            {activePanel === "patterns" && (
              <>
                <SectionTitle
                  icon={<Globe size={16} color="#fff" />}
                  title="Universal Hook Patterns"
                  sub={`Top patterns that work across ALL niches — adapted for ${result.niche}`}
                />
                <UniversalPatternsPanel patterns={result.universalPatterns} />
              </>
            )}
            {activePanel === "triggers" && (
              <>
                <SectionTitle
                  icon={<Brain size={16} color="#fff" />}
                  title="Emotional Trigger Analysis"
                  sub="Which psychological triggers drive the most views in viral content"
                />
                <EmotionalTriggersPanel triggers={result.emotionalTriggers} />
              </>
            )}
            {activePanel === "powerwords" && (
              <>
                <SectionTitle
                  icon={<Star size={16} color="#fff" />}
                  title="Cross-Niche Power Words"
                  sub="Words appearing in viral content across 3+ different niches"
                />
                <PowerWordsPanel words={result.powerWords} />
              </>
            )}
            {activePanel === "trending" && (
              <>
                <SectionTitle
                  icon={<Flame size={16} color="#fff" />}
                  title="Trending in Last 24 Hours"
                  sub={`What's going viral RIGHT NOW in ${result.niche} on ${result.platform}`}
                />
                <Trending24hPanel items={result.trending24h} />
              </>
            )}
            {activePanel === "opportunity" && (
              <>
                <SectionTitle
                  icon={<Target size={16} color="#fff" />}
                  title="Opportunity Score Map"
                  sub="Calculated using growth rate × avg views × saturation penalty"
                />
                <OpportunityMapPanel items={result.opportunityMap} />
              </>
            )}
          </div>

          {/* Meta footer */}
          <div style={{
            display: "flex", gap: 16, flexWrap: "wrap", padding: "10px 14px",
            background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)",
          }}>
            {Object.entries(result.meta).map(([k, v]) => (
              <span key={k} style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                <strong style={{ color: "var(--foreground)" }}>{k.replace(/([A-Z])/g, ' $1').trim()}:</strong> {v}
              </span>
            ))}
            <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: "auto" }}>
              Generated {new Date(result.generatedAt).toLocaleTimeString()}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
