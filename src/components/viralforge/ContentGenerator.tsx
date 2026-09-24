"use client";

import { useState } from "react";
import { Zap, Copy, Check, RefreshCw, Clock, Hash, Video, Music, TrendingUp, ChevronDown, ChevronUp, Layers, Film, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "LinkedIn"];
const VIBES = ["Fun & Entertaining", "Educational", "Inspiring", "Shocking/Controversial", "Relatable", "Behind-the-scenes"];
const NICHES = ["Fitness", "Food & Recipes", "Finance", "Business/Entrepreneurship", "Beauty & Fashion", "Travel", "Tech", "Self-Improvement", "Parenting", "Real Estate", "Other"];
const BRAND_VOICES = ["Casual", "Professional", "Humorous", "Authoritative", "Inspirational", "Educational"];

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#3D5E41" : score >= 65 ? "#7A5A2A" : "#7A3A2A";
  const bg = score >= 80 ? "#F2F7F2" : score >= 65 ? "#FAF4ED" : "#FBF3F1";
  return (
    <div style={{ width: 90, height: 90, borderRadius: "50%", background: bg, border: `4px solid ${color}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 10, color, fontWeight: 600, opacity: 0.8 }}>/ 100</span>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: copied ? "var(--sage-bg)" : "var(--muted)", border: `1px solid ${copied ? "var(--sage)" : "var(--border)"}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: copied ? "#3D5E41" : "var(--muted-foreground)", transition: "all 0.15s" }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ActionBtn({ icon: Icon, label, href, textToCopy }: { icon: any, label: string, href: string, textToCopy: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { 
        navigator.clipboard.writeText(textToCopy).catch(() => {}); 
        setCopied(true); 
        setTimeout(() => {
          setCopied(false);
          window.open(href, '_blank');
        }, 800); 
      }}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: copied ? "var(--sage-bg)" : "var(--card)", border: `1px solid ${copied ? "var(--sage)" : "var(--primary)"}`, borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: copied ? "#3D5E41" : "var(--foreground)", transition: "all 0.15s", flex: 1, minWidth: 160 }}
    >
      {copied ? <Check size={16} /> : <Icon size={16} />} 
      {copied ? "Copied! Redirecting..." : label}
      {!copied && <ArrowRight size={14} style={{ opacity: 0.5, marginLeft: "auto" }} />}
    </button>
  );
}

export default function ContentGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [niche, setNiche] = useState("Fitness");
  const [vibe, setVibe] = useState("Fun & Entertaining");
  const [brandVoice, setBrandVoice] = useState("Casual");
  const [followers, setFollowers] = useState("5000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [expandedHook, setExpandedHook] = useState<number | null>(0);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate/viralforge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, niche, vibe, brand_voice: brandVoice.toLowerCase(), followers: Number(followers) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fmtNum = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);

  const fullCopyText = result ? `HOOK:
"${result.hooks?.[0]?.text || ""}"

CAPTION:
${result.caption || ""}

SCRIPT / CAROUSEL:
${result.script || ""}

FILMING & STYLE:
${(result.format?.shots || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}
Edit: ${result.format?.style || ''} · Length: ${result.format?.length || ''}

AUDIO:
🎵 ${result.audio?.primary || ''}

HASHTAGS:
${(Array.isArray(result.hashtags) ? result.hashtags : (result.hashtags?.all || [])).map((h: string) => `#${h.replace(/^#/, "")}`).join(" ")}

BEST POSTING TIME:
${result.timing?.today || ""}
` : '';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Input Form */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 0 }}>📝 What do you want to create?</h3>

        <div>
          <label className="label">Your Topic *</label>
          <input
            type="text"
            className="input-field"
            placeholder='e.g. "protein smoothie", "morning routine", "real estate investing"'
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div>
            <label className="label">Platform</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => setPlatform(p)} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${platform === p ? "var(--primary)" : "var(--border)"}`, background: platform === p ? "var(--primary)" : "var(--card)", color: platform === p ? "#fff" : "var(--muted-foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Niche</label>
            <select className="input-field" value={niche} onChange={(e) => setNiche(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Vibe</label>
            <select className="input-field" value={vibe} onChange={(e) => setVibe(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
              {VIBES.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Brand Voice</label>
            <select className="input-field" value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
              {BRAND_VOICES.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Your Followers</label>
            <input type="number" className="input-field" value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="5000" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 4 }}>
          <button className="btn-primary" onClick={generate} disabled={loading || !topic.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, fontSize: 14 }}>
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            {loading ? "Generating..." : "Generate Full Package"}
          </button>
          {result && <button className="btn-ghost" onClick={() => setResult(null)} style={{ fontSize: 13 }}>Clear</button>}
          <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: "auto" }}>~10 seconds</span>
        </div>

        {error && <div style={{ padding: "10px 14px", background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8, fontSize: 13, color: "#7A3A2A", fontWeight: 500 }}>⚠️ {error}</div>}
      </div>

      {/* Results */}
      {result && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Viral Score + Predictions */}
          <div className="card" style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <ScoreRing score={result.viralScore || 0} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <TrendingUp size={16} color="#3D5E41" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Viral Score & Predictions</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                {[
                  { label: "Min Views", val: fmtNum(result.predictions?.min || 0) },
                  { label: "Likely Views", val: fmtNum(result.predictions?.likely || 0), highlight: true },
                  { label: "Max Views", val: fmtNum(result.predictions?.max || 0) },
                  { label: "Engagement", val: result.predictions?.engagement || "–" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "10px 12px", background: s.highlight ? "var(--sage-bg)" : "var(--muted)", borderRadius: 8, border: `1px solid ${s.highlight ? "var(--sage)" : "var(--border)"}` }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.highlight ? "#3D5E41" : "var(--foreground)" }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Script */}
          {result.script && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>🎞️ Script / Carousel Outline</span>
                <CopyBtn text={result.script} />
              </div>
              <div style={{ background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--foreground)" }}>
                {result.script}
              </div>
            </div>
          )}

          {/* Caption */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>📝 Caption (Ready to Copy)</span>
              <CopyBtn text={result.caption || ""} />
            </div>
            <div style={{ background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "var(--foreground)" }}>
              {result.caption}
            </div>
          </div>

          {/* Hooks */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🎣 Hook Options — Pick the Best One</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(result.hooks || []).map((hook: any, i: number) => (
                <div key={i} style={{ border: `1px solid ${expandedHook === i ? "var(--primary)" : "var(--border)"}`, borderRadius: 9, overflow: "hidden", transition: "border 0.15s" }}>
                  <button
                    onClick={() => setExpandedHook(expandedHook === i ? null : i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: expandedHook === i ? "var(--muted)" : "var(--card)", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  >
                    <span style={{ fontWeight: 800, fontSize: 13, color: "var(--muted-foreground)", minWidth: 20 }}>#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{hook.text}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, background: "var(--sage-bg)", color: "#3D5E41", padding: "3px 8px", borderRadius: 6 }}>
                        {hook.score}/100
                      </span>
                      {expandedHook === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>
                  {expandedHook === i && (
                    <div style={{ padding: "10px 14px 14px", borderTop: "1px solid var(--border)", background: "var(--muted)", display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>Pattern: {hook.pattern}</span>
                        <p style={{ fontSize: 13, color: "var(--foreground)", margin: "4px 0 0" }}>{hook.why}</p>
                      </div>
                      <CopyBtn text={hook.text} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hashtags + Audio + Format + Timing — 2 col grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>

            {/* Hashtags */}
            <div className="card">
              {(() => {
                const htObj = result.hashtags;
                const allTags: string[] = Array.isArray(htObj) ? htObj : (htObj?.all || []);
                const catMap: Record<string, string[]> = Array.isArray(htObj) ? {} : { trending: htObj?.trending || [], niche: htObj?.niche || [], broad: htObj?.broad || [] };
                const catColors: Record<string, string> = { trending: "var(--rose-bg)", niche: "var(--sage-bg)", broad: "var(--lavender-bg)" };
                const catBorder: Record<string, string> = { trending: "var(--rose)", niche: "var(--sage)", broad: "var(--lavender)" };
                const catText: Record<string, string> = { trending: "#7A3A2A", niche: "#3D5E41", broad: "#50487A" };
                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}><Hash size={14} style={{ display: "inline", marginRight: 6 }} />Hashtag Strategy</span>
                      <CopyBtn text={allTags.map((h: string) => `#${h.replace(/^#/, "")}`).join(" ")} />
                    </div>
                    {Object.keys(catMap).filter(k => catMap[k].length > 0).map(cat => (
                      <div key={cat} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: catText[cat], marginBottom: 5 }}>{cat === "niche" ? "Niche-Specific" : cat === "broad" ? "Broad Reach" : "Trending Now"}</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {catMap[cat].map((tag: string, i: number) => (
                            <span key={i} style={{ padding: "4px 9px", background: catColors[cat], border: `1px solid ${catBorder[cat]}`, borderRadius: 20, fontSize: 12, fontWeight: 600, color: catText[cat] }}>#{tag.replace(/^#/, "")}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(catMap).every(k => catMap[k].length === 0) && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {allTags.map((tag: string, i: number) => (
                          <span key={i} style={{ padding: "5px 10px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>#{tag.replace(/^#/, "")}</span>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Audio */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}><Music size={14} style={{ display: "inline", marginRight: 6 }} />Audio Suggestions</div>
              {result.audio && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ padding: "10px 12px", background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>🔥 {result.audio.primary}</span>
                      <span style={{ fontSize: 11, color: "#7A3A2A", fontWeight: 600 }}>{result.audio.primaryUses} uses</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "4px 0 0" }}>Trending now</p>
                  </div>
                  <div style={{ padding: "10px 12px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>💡 {result.audio.alternative}</div>
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "4px 0 0" }}>{result.audio.audioReason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Format */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}><Video size={14} style={{ display: "inline", marginRight: 6 }} />Format Guide</div>
              {result.format && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ padding: "4px 10px", background: "var(--lavender-bg)", border: "1px solid var(--lavender)", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#50487A" }}>{result.format.style}</span>
                    <span style={{ padding: "4px 10px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, color: "var(--muted-foreground)" }}>{result.format.length}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)", fontStyle: "italic" }}>📊 {result.format.whyItWorks}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: 6 }}>📹 Shot List</div>
                    {(result.format.shots || []).map((shot: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 12, color: "var(--foreground)" }}>{shot}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Timing */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}><Clock size={14} style={{ display: "inline", marginRight: 6 }} />Best Posting Times</div>
              {result.timing && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ padding: "10px 12px", background: "var(--sage-bg)", border: "1px solid var(--sage)", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted-foreground)", marginBottom: 2 }}>Today</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#3D5E41" }}>{result.timing.today}</div>
                  </div>
                  <div style={{ padding: "10px 12px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted-foreground)", marginBottom: 2 }}>Tomorrow</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{result.timing.tomorrow}</div>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>💡 {result.timing.reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Trending elements */}
          {result.trendingElements?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🔥 Trending Elements to Include</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {result.trendingElements.map((el: string, i: number) => (
                  <span key={i} style={{ padding: "6px 12px", background: "var(--amber-bg)", border: "1px solid var(--amber)", borderRadius: 8, fontSize: 13, fontWeight: 500, color: "#7A5A2A" }}>{el}</span>
                ))}
              </div>
            </div>
          )}

          {/* Cross-Niche Insights */}
          {result.crossNicheInsights?.length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🌐 Cross-Niche Insights</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.crossNicheInsights.map((item: any, i: number) => (
                  <div key={i} style={{ background: "var(--muted)", borderRadius: 9, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 80, padding: "3px 10px", background: "var(--lavender-bg)", border: "1px solid var(--lavender)", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#50487A", textAlign: "center" }}>{item.niche}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{item.approach}</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>👁 {item.views} views</span>
                        <span style={{ fontSize: 11, color: "#3D5E41", fontWeight: 600 }}>💡 {item.lesson}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adaptation Guide + Opportunity Analysis — 2 col */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>

            {result.adaptationGuide && (
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>🔄 Platform Adaptation Guide</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(["tiktok","instagram","youtube"] as const).map((p) => result.adaptationGuide[p] && (
                    <div key={p} style={{ background: "var(--muted)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--muted-foreground)", marginBottom: 3 }}>{p}</div>
                      <div style={{ fontSize: 12, color: "var(--foreground)" }}>{result.adaptationGuide[p]}</div>
                    </div>
                  ))}
                  {result.adaptationGuide.keepForAll && (
                    <div style={{ background: "var(--sage-bg)", border: "1px solid var(--sage)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, color: "#3D5E41", marginBottom: 3 }}>Keep for All</div>
                      <div style={{ fontSize: 12, color: "var(--foreground)" }}>{result.adaptationGuide.keepForAll}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.opportunityAnalysis && (() => {
              const o = result.opportunityAnalysis;
              const scoreColor = o.score >= 75 ? "#059669" : o.score >= 55 ? "#D97706" : "#DC2626";
              const satColor: Record<string,string> = { low: "#059669", medium: "#D97706", high: "#DC2626" };
              return (
                <div className="card">
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📈 Opportunity Analysis</div>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${scoreColor}15`, border: `3px solid ${scoreColor}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{o.score}</span>
                      <span style={{ fontSize: 9, color: scoreColor, fontWeight: 600 }}>/ 100</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: scoreColor }}>{o.verdict}</div>
                      <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{o.reason}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    {o.saturation && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", background: `${satColor[o.saturation] || "#D97706"}15`, color: satColor[o.saturation] || "#D97706", border: `1px solid ${satColor[o.saturation] || "#D97706"}30`, borderRadius: 6 }}>{o.saturation} saturation</span>}
                    {o.growthRate && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: 6 }}>📊 {o.growthRate}</span>}
                  </div>
                  {o.recommendation && <div style={{ fontSize: 12, color: "var(--foreground)", background: "var(--sage-bg)", border: "1px solid var(--sage)", borderRadius: 8, padding: "10px 12px" }}>💡 {o.recommendation}</div>}
                </div>
              );
            })()}
          </div>

          {/* Next Steps / Actions */}
          <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Next Steps</span>
              <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
            </div>
            
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ActionBtn 
                icon={Layers} 
                label="Make Carousel" 
                href={`/carousel?topic=${encodeURIComponent(topic)}`} 
                textToCopy={fullCopyText} 
              />
              <ActionBtn 
                icon={Film} 
                label="Make Reel" 
                href={`/reels?topic=${encodeURIComponent(topic)}`} 
                textToCopy={fullCopyText} 
              />
            </div>
            
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
              <CopyBtn text={fullCopyText} />
              <button className="btn-primary" onClick={generate} style={{ fontSize: 13 }}>
                <RefreshCw size={14} /> Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
