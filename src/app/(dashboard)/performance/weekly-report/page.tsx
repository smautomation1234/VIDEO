"use client";
import React, { useState } from "react";
import { FileText, RefreshCw, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

const NICHES = [
  "Finance & Investing", "AI & Tech", "SaaS & Startups", "Digital Marketing",
  "Real Estate", "Health & Fitness", "Personal Development", "E-Commerce",
  "Content Creation", "Leadership & HR", "Crypto & Web3", "Education",
];

const PLATFORMS = ["LinkedIn + Instagram", "YouTube", "TikTok", "LinkedIn", "Instagram", "All Platforms"];

const FORMAT_COLORS: Record<string, { line: string; wash: string; ink: string }> = {
  "Reel": { line: "var(--rose)", wash: "var(--rose-bg)", ink: "var(--rose-ink)" },
  "Carousel": { line: "var(--lavender)", wash: "var(--lavender-bg)", ink: "var(--lavender-ink)" },
  "LinkedIn Post": { line: "var(--sky)", wash: "var(--sky-bg)", ink: "var(--sky-ink)" },
  "Thread": { line: "var(--sky)", wash: "var(--sky-bg)", ink: "var(--sky-ink)" },
  "YouTube Video": { line: "var(--rose)", wash: "var(--rose-bg)", ink: "var(--rose-ink)" },
  "Story": { line: "var(--butter)", wash: "var(--butter-bg)", ink: "var(--butter-ink)" },
  "Short": { line: "var(--rose)", wash: "var(--rose-bg)", ink: "var(--rose-ink)" },
  "Newsletter": { line: "var(--sage)", wash: "var(--sage-bg)", ink: "var(--sage-ink)" },
};

const URGENCY_LABELS: Record<string, { wash: string; ink: string; label: string }> = {
  "Today": { wash: "var(--rose-bg)", ink: "var(--rose-ink)", label: "Post today" },
  "This Week": { wash: "var(--butter-bg)", ink: "var(--butter-ink)", label: "This week" },
  "This Month": { wash: "var(--lavender-bg)", ink: "var(--lavender-ink)", label: "This month" },
};

export default function WeeklyReportPage() {
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [platform, setPlatform] = useState("LinkedIn + Instagram");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const activeNiche = niche === "custom" ? customNiche : niche;

  const generate = async () => {
    if (!activeNiche.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: activeNiche, platform, currentDate: new Date().toISOString().split("T")[0] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100, margin: "0 auto" }}>
      {!result && !loading && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} color="var(--sage-ink)" /> Configure Your Report
          </h2>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Your Niche</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {NICHES.map((n) => (
                <button key={n} onClick={() => setNiche(n)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${niche === n ? "var(--sage)" : "var(--border)"}`, background: niche === n ? "var(--sage-bg)" : "var(--muted)", color: niche === n ? "var(--sage-ink)" : "var(--muted-foreground)", fontSize: 12, fontWeight: niche === n ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setNiche("custom")} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${niche === "custom" ? "var(--sage)" : "var(--border)"}`, background: niche === "custom" ? "var(--sage-bg)" : "var(--muted)", color: niche === "custom" ? "var(--sage-ink)" : "var(--muted-foreground)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Custom
              </button>
            </div>
            {niche === "custom" && (
              <input value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="Enter your niche..." style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Primary Platform</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => setPlatform(p)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${platform === p ? "var(--sage)" : "var(--border)"}`, background: platform === p ? "var(--sage-bg)" : "var(--muted)", color: platform === p ? "var(--sage-ink)" : "var(--muted-foreground)", fontSize: 12, fontWeight: platform === p ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!activeNiche.trim()}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            <FileText size={16} /> Generate weekly report
          </button>

          {error && <div style={{ padding: 12, background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: "var(--radius-sm)", color: "var(--rose-ink)", fontSize: 13 }}>{error}</div>}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <RefreshCw size={28} color="var(--sage-ink)" className="animate-spin" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>Generating your weekly report...</div>
              <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Researching trending topics, rising signals, and building your 7-day calendar.</div>
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse-soft" style={{ height: 120, background: "var(--muted)", borderRadius: "var(--radius-lg)", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      )}

      {result && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sage-ink)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                Weekly report — {activeNiche} — {result.weekOf || new Date().toLocaleDateString()}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--foreground)" }}>Your content intelligence report</h2>
            </div>
            <button onClick={() => { setResult(null); setNiche(""); setCustomNiche(""); }} className="btn-secondary" style={{ fontSize: 12 }}>
              <RefreshCw size={13} /> New report
            </button>
          </div>

          {result.section1_trending?.length > 0 && (
            <Section label="Section 1" title="This week's top trending topics" wash="var(--rose-bg)" ink="var(--rose-ink)">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.section1_trending.map((topic: any, i: number) => {
                  const urgency = URGENCY_LABELS[topic.postBy] || URGENCY_LABELS["This Week"];
                  const comp = topic.competition === "Low" ? { wash: "var(--sage-bg)", ink: "var(--sage-ink)" } : topic.competition === "Medium" ? { wash: "var(--butter-bg)", ink: "var(--butter-ink)" } : { wash: "var(--rose-bg)", ink: "var(--rose-ink)" };
                  return (
                    <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "var(--muted)", borderRadius: "var(--radius)", border: "1px solid var(--border)", alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "var(--rose-bg)", border: "1px solid var(--rose)", color: "var(--rose-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{topic.topic}</div>
                        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8, lineHeight: 1.5 }}>{topic.whyTrending}</div>
                        <div style={{ fontSize: 12, color: "var(--butter-ink)", fontStyle: "italic", padding: "6px 10px", background: "var(--butter-bg)", borderRadius: "var(--radius-sm)", borderLeft: "2px solid var(--butter)" }}>Your angle: {topic.recommendedAngle}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: urgency?.ink, background: urgency?.wash, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{urgency?.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: comp.ink, background: comp.wash, padding: "2px 8px", borderRadius: 20 }}>{topic.competition} competition</span>
                        <span style={{ fontSize: 12, fontWeight: 900, color: "var(--rose-ink)" }}>{topic.urgencyScore}/10</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {result.section2_rising?.length > 0 && (
            <Section label="Section 2" title="Rising topics to watch" wash="var(--sky-bg)" ink="var(--sky-ink)">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {result.section2_rising.map((topic: any, i: number) => (
                  <div key={i} style={{ padding: 14, background: "var(--muted)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <TrendingUp size={14} color="var(--sky-ink)" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{topic.topic}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5, marginBottom: 6 }}>{topic.momentum}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--sky-ink)", background: "var(--sky-bg)", padding: "2px 8px", borderRadius: 20 }}>{topic.windowOfOpportunity}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", background: "var(--card)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 20 }}>{topic.bestPlatform}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {result.section3_declining?.length > 0 && (
            <Section label="Section 3" title="Declining topics — avoid these" wash="var(--muted)" ink="var(--muted-foreground)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.section3_declining.map((topic: any, i: number) => (
                  <div key={i} style={{ padding: "10px 14px", background: "var(--muted)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                    <TrendingDown size={14} color="var(--muted-foreground)" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textDecoration: "line-through" }}>{topic.topic}</div>
                      <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{topic.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {result.section4_bigOpportunity && (
            <Section label="Section 4" title="One big opportunity this week" wash="var(--sage-bg)" ink="var(--sage-ink)">
              <div style={{ padding: 20, background: "var(--sage-bg)", borderRadius: "var(--radius-lg)", border: "1px solid var(--sage)" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--foreground)", marginBottom: 8 }}>{result.section4_bigOpportunity.topic}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  {[
                    ["Platform", result.section4_bigOpportunity.platform],
                    ["Why now", result.section4_bigOpportunity.whyNow],
                    ["Hook", result.section4_bigOpportunity.hook],
                    ["Angle", result.section4_bigOpportunity.angle],
                  ].map(([label, val]) => (
                    <div key={label} style={{ padding: "10px 12px", background: "var(--card)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sage-ink)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.5 }}>{val}</div>
                    </div>
                  ))}
                </div>
                {result.section4_bigOpportunity.titleSuggestion && (
                  <div style={{ padding: "10px 14px", background: "var(--card)", borderRadius: "var(--radius-sm)", border: "1px solid var(--sage)", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sage-ink)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Suggested title</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{result.section4_bigOpportunity.titleSuggestion}</div>
                  </div>
                )}
                {result.section4_bigOpportunity.contentBrief && (
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.7 }}>{result.section4_bigOpportunity.contentBrief}</div>
                )}
              </div>
            </Section>
          )}

          {result.section5_calendar?.length > 0 && (
            <Section label="Section 5" title="7-day content calendar" wash="var(--lavender-bg)" ink="var(--lavender-ink)">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
                {result.section5_calendar.map((day: any, i: number) => {
                  const fc = FORMAT_COLORS[day.format] || { line: "var(--lavender)", wash: "var(--lavender-bg)", ink: "var(--lavender-ink)" };
                  return (
                    <div key={i} style={{ padding: 12, background: "var(--muted)", borderRadius: "var(--radius)", border: "1px solid var(--border)", borderTop: `3px solid ${fc.line}`, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: fc.ink }}>{day.day}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.4 }}>{day.topic}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: "auto" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: fc.ink, background: fc.wash, border: `1px solid ${fc.line}`, padding: "2px 6px", borderRadius: 10, textAlign: "center" }}>{day.format}</span>
                        {day.platform && <span style={{ fontSize: 9, color: "var(--muted-foreground)", textAlign: "center" }}>{day.platform}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, title, wash, ink, children }: { label: string; title: string; wash: string; ink: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: ink, background: wash, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}
