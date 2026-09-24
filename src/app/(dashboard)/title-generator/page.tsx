"use client";
import React, { useState } from "react";
import {
  Type, Sparkles, Copy, Check, ChevronDown, ChevronUp,
  Eye, Zap, CheckCircle2, RefreshCw, Palette, LayoutTemplate, Star
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const STYLE_OPTIONS = [
  { id: "Educational", ink: "var(--sky-ink)", bg: "var(--sky-bg)", border: "var(--sky)" },
  { id: "Entertaining", ink: "var(--lavender-ink)", bg: "var(--lavender-bg)", border: "var(--lavender)" },
  { id: "Motivational", ink: "var(--butter-ink)", bg: "var(--butter-bg)", border: "var(--butter)" },
  { id: "Controversial", ink: "var(--rose-ink)", bg: "var(--rose-bg)", border: "var(--rose)" },
  { id: "Review-based", ink: "var(--sage-ink)", bg: "var(--sage-bg)", border: "var(--sage)" },
  { id: "Storytelling", ink: "var(--sky-ink)", bg: "var(--sky-bg)", border: "var(--sky)" },
];

const FORMULA_STYLES: Record<string, { ink: string; bg: string; border: string }> = {
  NUMBER: { ink: "var(--sky-ink)", bg: "var(--sky-bg)", border: "var(--sky)" },
  CURIOSITY: { ink: "var(--lavender-ink)", bg: "var(--lavender-bg)", border: "var(--lavender)" },
  STORY: { ink: "var(--sage-ink)", bg: "var(--sage-bg)", border: "var(--sage)" },
  VS: { ink: "var(--butter-ink)", bg: "var(--butter-bg)", border: "var(--butter)" },
  QUESTION: { ink: "var(--rose-ink)", bg: "var(--rose-bg)", border: "var(--rose)" },
};

const FORMULA_LABELS: Record<string, string> = {
  NUMBER: "Number",
  CURIOSITY: "Curiosity",
  STORY: "Story",
  VS: "VS",
  QUESTION: "Question",
};

const CTR_COLORS: Record<string, string> = {
  High: "var(--sage-ink)",
  Medium: "var(--butter-ink)",
  Low: "var(--rose-ink)",
};

const EMOTION_COLORS: Record<string, string> = {
  Curiosity: "var(--lavender-ink)",
  Fear: "var(--rose-ink)",
  Excitement: "var(--butter-ink)",
  FOMO: "var(--sage-ink)",
  Shock: "var(--sky-ink)",
};

function SkeletonCard() {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      {[70, 90, 50].map((w, i) => (
        <div key={i} className="animate-pulse-soft" style={{ height: 14, width: `${w}%`, background: "var(--muted)", borderRadius: 6, animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export default function TitleGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState("Educational");
  const [channelName, setChannelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"titles" | "thumbnail">("titles");
  const [filterFormula, setFilterFormula] = useState("ALL");
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [expandedTop3, setExpandedTop3] = useState<Record<number, boolean>>({});

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate/title-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, style, channelName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setActiveTab("titles");
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

  const activeStyle = STYLE_OPTIONS.find((s) => s.id === style);
  const filteredTitles = result?.titles?.filter((t: any) =>
    filterFormula === "ALL" ? true : t.formula === filterFormula
  ) ?? [];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Create"
        title="Hooks & titles"
        description="Scroll-stopping opening lines and titles for any platform."
      />

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} color="var(--lavender-ink)" /> Configure Your Video
            </h2>

            <div>
              <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
                Video Topic *
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How I went from $0 to $10K/month with AI tools in 90 days..."
                className="input-field"
                style={{ width: "100%", height: 100, fontSize: 13, resize: "none", lineHeight: 1.6 }}
              />
            </div>

            <div>
              <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
                Target Audience
              </label>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. 18-30 males, aspiring entrepreneurs"
                className="input-field"
                style={{ width: "100%", fontSize: 13 }}
              />
            </div>

            <div>
              <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
                Channel Style
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    style={{
                      padding: "6px 12px", borderRadius: 20,
                      border: `1px solid ${style === s.id ? s.border : "var(--border)"}`,
                      background: style === s.id ? s.bg : "var(--muted)",
                      color: style === s.id ? s.ink : "var(--muted-foreground)",
                      fontSize: 12, fontWeight: style === s.id ? 700 : 500, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
                Channel Name (optional)
              </label>
              <input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g. FinanceWithJohn"
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
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? "Generating 20 Titles..." : "Generate Titles"}
            </button>

            {error && (
              <div style={{ padding: 12, background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8, color: "var(--rose-ink)", fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.8 }}>5 Proven Title Formulas</h3>
            {Object.entries(FORMULA_LABELS).map(([key, label]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: FORMULA_STYLES[key].bg, borderRadius: 8, border: `1px solid ${FORMULA_STYLES[key].border}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: FORMULA_STYLES[key].ink, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: FORMULA_STYLES[key].ink }}>{label}</span>
                <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: "auto", fontWeight: 700 }}>
                  {key === "NUMBER" || key === "CURIOSITY" || key === "STORY" ? "×5" : key === "VS" ? "×3" : "×2"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                {["Titles", "Thumbnail"].map((t) => (
                  <div key={t} className="animate-pulse-soft" style={{ height: 36, width: 100, background: "var(--muted)", borderRadius: 8 }} />
                ))}
              </div>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : result ? (
            <>
              <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 1 }}>
                {(["titles", "thumbnail"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                      color: activeTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
                      borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab === "titles" ? `20 Titles` : `Thumbnail Ideas`}
                  </button>
                ))}
              </div>

              {activeTab === "titles" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {result.top3 && (
                    <div style={{ background: "var(--lavender-bg)", border: "1px solid var(--lavender)", borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--lavender-ink)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <Star size={14} fill="var(--lavender-ink)" /> AI Top 3 Picks
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {result.top3.map((pick: any, i: number) => (
                          <div key={i} style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "var(--butter-bg)" : i === 1 ? "var(--muted)" : "var(--sky-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: i === 0 ? "var(--butter-ink)" : i === 1 ? "var(--muted-foreground)" : "var(--sky-ink)", flexShrink: 0 }}>
                                {i + 1}
                              </div>
                              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{pick.title}</div>
                              <button onClick={() => copy(pick.title, `top3-${i}`)} style={{ background: copiedMap[`top3-${i}`] ? "var(--sage-bg)" : "var(--muted)", border: `1px solid ${copiedMap[`top3-${i}`] ? "var(--sage)" : "var(--border)"}`, color: copiedMap[`top3-${i}`] ? "var(--sage-ink)" : "var(--muted-foreground)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
                                {copiedMap[`top3-${i}`] ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                              </button>
                              <button onClick={() => setExpandedTop3((p) => ({ ...p, [i]: !p[i] }))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 4 }}>
                                {expandedTop3[i] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                            {expandedTop3[i] && (
                              <div style={{ padding: "0 14px 12px 52px", fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                                {pick.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["ALL", "NUMBER", "CURIOSITY", "STORY", "VS", "QUESTION"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilterFormula(f)}
                        style={{
                          padding: "5px 12px", borderRadius: 20,
                          border: `1px solid ${filterFormula === f ? (FORMULA_STYLES[f]?.border || "var(--primary)") : "var(--border)"}`,
                          background: filterFormula === f ? (FORMULA_STYLES[f]?.bg || "var(--primary)") : "var(--muted)",
                          color: filterFormula === f ? (FORMULA_STYLES[f]?.ink || "var(--background)") : "var(--muted-foreground)",
                          fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {f === "ALL" ? `All 20` : FORMULA_LABELS[f]}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filteredTitles.map((title: any, i: number) => {
                      const fs = FORMULA_STYLES[title.formula] || FORMULA_STYLES.NUMBER;
                      const ec = EMOTION_COLORS[title.emotion] || "var(--primary)";
                      const cc = CTR_COLORS[title.ctrPrediction] || "var(--muted-foreground)";
                      return (
                        <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, transition: "box-shadow 0.15s" }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: fs.ink, background: fs.bg, padding: "3px 8px", borderRadius: 20, flexShrink: 0, whiteSpace: "nowrap" }}>
                            {FORMULA_LABELS[title.formula] || title.formula}
                          </span>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{title.text}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, color: ec, fontWeight: 700, background: "var(--muted)", padding: "2px 8px", borderRadius: 20 }}>{title.emotion}</span>
                            <span style={{ fontSize: 10, color: cc, fontWeight: 700 }}>CTR: {title.ctrPrediction}</span>
                            <button onClick={() => copy(title.text, `title-${i}`)} style={{ background: copiedMap[`title-${i}`] ? "var(--sage-bg)" : "var(--muted)", border: `1px solid ${copiedMap[`title-${i}`] ? "var(--sage)" : "var(--border)"}`, color: copiedMap[`title-${i}`] ? "var(--sage-ink)" : "var(--muted-foreground)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
                              {copiedMap[`title-${i}`] ? <><Check size={11} /> Copied</> : <><Copy size={11} /></>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "thumbnail" && result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {result.thumbnailText && (
                    <div className="card">
                      <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <Type size={16} color="var(--lavender-ink)" /> Main Headline Text (Bold 3–5 Words)
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {result.thumbnailText.map((text: string, i: number) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--muted)", borderRadius: 10, border: "1px solid var(--border)" }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--foreground)", letterSpacing: -0.3, flex: 1 }}>{text.toUpperCase()}</span>
                            <button onClick={() => copy(text, `thumb-${i}`)} style={{ background: copiedMap[`thumb-${i}`] ? "var(--sage-bg)" : "var(--card)", border: `1px solid ${copiedMap[`thumb-${i}`] ? "var(--sage)" : "var(--border)"}`, color: copiedMap[`thumb-${i}`] ? "var(--sage-ink)" : "var(--muted-foreground)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
                              {copiedMap[`thumb-${i}`] ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.colorPsychology && (
                    <div className="card">
                      <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <Palette size={16} color="var(--rose-ink)" /> Color Psychology
                      </h3>
                      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                        {[result.colorPsychology.primary, result.colorPsychology.secondary, result.colorPsychology.accent].filter(Boolean).map((c: string, i: number) => (
                          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: c, border: "2px solid var(--border)" }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)" }}>{c}</span>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.6 }}>{result.colorPsychology.reason}</p>
                    </div>
                  )}

                  {result.thumbnailConcepts && (
                    <div className="card">
                      <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                        <LayoutTemplate size={16} color="var(--butter-ink)" /> Thumbnail Visual Concepts
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {result.thumbnailConcepts.map((concept: any, i: number) => (
                          <div key={i} style={{ padding: 16, background: "var(--muted)", borderRadius: 12, border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--foreground)" }}>Concept {i + 1}</span>
                              <div style={{ display: "flex", gap: 10 }}>
                                {[{ Icon: Eye, label: "Curiosity", val: concept.curiosity }, { Icon: Zap, label: "Shock", val: concept.shock }, { Icon: CheckCircle2, label: "Clarity", val: concept.clarity }].map((metric) => (
                                  <span key={metric.label} style={{ fontSize: 11, color: "var(--muted-foreground)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <metric.Icon size={12} /> {metric.label}: <strong style={{ color: "var(--foreground)" }}>{metric.val}/10</strong>
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              {[
                                { label: "Background", val: concept.background },
                                { label: "Expression", val: concept.expression },
                                { label: "Text Position", val: concept.textPlacement },
                                { label: "Props", val: concept.props },
                              ].map((item) => (
                                <div key={item.label}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 3 }}>{item.label}</span>
                                  <span style={{ fontSize: 12, color: "var(--foreground)" }}>{item.val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, background: "var(--card)", borderRadius: 16, border: "1px dashed var(--border)", gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "var(--lavender-bg)", border: "1px solid var(--lavender)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Type size={32} color="var(--lavender-ink)" style={{ opacity: 0.6 }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginBottom: 8 }}>Ready to Generate</div>
                <div style={{ fontSize: 13, color: "var(--muted-foreground)", maxWidth: 300, lineHeight: 1.6 }}>
                  Enter your video topic and click Generate to get 20 title options plus thumbnail concepts
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
