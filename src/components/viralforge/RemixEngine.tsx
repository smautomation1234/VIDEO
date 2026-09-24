"use client";

import { useState, useEffect } from "react";
import { Repeat2, RefreshCw, Copy, Check, AlertTriangle, Sparkles, Layers, Film, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const NICHES = ["Fitness", "Food & Recipes", "Finance", "Business/Entrepreneurship", "Beauty & Fashion", "Travel", "Tech", "Self-Improvement", "Parenting", "Real Estate", "Other"];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: copied ? "var(--sage-bg)" : "var(--muted)", border: `1px solid ${copied ? "var(--sage)" : "var(--border)"}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: copied ? "#3D5E41" : "var(--muted-foreground)", transition: "all 0.15s", whiteSpace: "nowrap" as const }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function FactorBadge({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "var(--sage-bg)", border: "1px solid var(--sage)", borderRadius: 7 }}>
      <span style={{ color: "#3D5E41", fontSize: 14, lineHeight: 1 }}>✓</span>
      <span style={{ fontSize: 13, color: "var(--foreground)" }}>{text}</span>
    </div>
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

export default function RemixEngine({ prefillCaption }: { prefillCaption?: string }) {
  const [postCaption, setPostCaption] = useState(prefillCaption || "");
  const [postUrl, setPostUrl] = useState("");
  const [postViews, setPostViews] = useState("");
  const [niche, setNiche] = useState("Fitness");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (prefillCaption) {
      setPostCaption(prefillCaption);
      setResult(null);
    }
  }, [prefillCaption]);

  const remix = async () => {
    if (!postCaption.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postCaption, postUrl, postViews, niche }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remix failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const { analysis, remixed } = result || {};

  const fullCopyText = remixed ? `HOOK:
"${remixed.hook}"

CAPTION:
${remixed.caption}

FILMING & STYLE:
${(remixed.formatInstructions?.filmingGuide || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}
Edit: ${remixed.formatInstructions?.editingStyle || ''} · Length: ${remixed.formatInstructions?.length || ''}

AUDIO:
🎵 ${remixed.trendingAudio || ''}

HASHTAGS:
${(remixed.hashtags || []).map((h: string) => `#${h.replace(/^#/, "")}`).join(" ")}

ENGAGEMENT:
${remixed.engagementHook || ""}

WHY IT WORKS:
${remixed.whyThisWillWork || ""}` : '';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Instructions banner */}
      <div style={{ padding: "12px 16px", background: "var(--amber-bg)", border: "1px solid var(--amber)", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <AlertTriangle size={16} color="#7A5A2A" style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: "#7A5A2A" }}>
          <strong>How to use:</strong> Find a viral post in your niche, paste its caption below. The AI will reverse-engineer why it went viral and create your own unique version.
        </div>
      </div>

      {/* Input Form */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>🎯 Paste the Viral Post</h3>

        <div>
          <label className="label">Post Caption / Script *</label>
          <textarea
            className="input-field"
            rows={4}
            placeholder="Paste the viral post caption or script here... The more detail, the better the remix."
            value={postCaption}
            onChange={(e) => setPostCaption(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div>
            <label className="label">Post URL (optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="https://tiktok.com/..."
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Views (optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 2.3M"
              value={postViews}
              onChange={(e) => setPostViews(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Your Niche</label>
            <select className="input-field" value={niche} onChange={(e) => setNiche(e.target.value)} style={{ appearance: "none", cursor: "pointer" }}>
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 4 }}>
          <button className="btn-primary" onClick={remix} disabled={loading || !postCaption.trim()} style={{ height: 44, paddingLeft: 24, paddingRight: 24, fontSize: 14 }}>
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Repeat2 size={16} />}
            {loading ? "Analyzing..." : "Remix This Post"}
          </button>
          {result && <button className="btn-ghost" onClick={() => setResult(null)} style={{ fontSize: 13 }}>Clear</button>}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8, fontSize: 13, color: "#7A3A2A", fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && analysis && remixed && (
        <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>

          {/* Why It Went Viral */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ padding: 7, background: "var(--amber-bg)", borderRadius: 8 }}>
                <AlertTriangle size={15} color="#7A5A2A" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Why This Went Viral</span>
              <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: 16, background: "var(--sage-bg)", color: "#3D5E41", padding: "3px 10px", borderRadius: 6 }}>
                {analysis.viralScore}/100
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ padding: "10px 12px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: 3 }}>Hook Pattern</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic" }}>"{analysis.hookPattern}"</div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 4 }}>{analysis.hookPatternExplain}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ padding: "9px 11px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase" as const, marginBottom: 2 }}>Format</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{analysis.formatType}</div>
                </div>
                <div style={{ padding: "9px 11px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase" as const, marginBottom: 2 }}>Length</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{analysis.contentLength}</div>
                </div>
              </div>

              <div style={{ padding: "10px 12px", background: "var(--lavender-bg)", borderRadius: 8, border: "1px solid var(--lavender)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "#50487A", marginBottom: 3 }}>Emotional Arc</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#50487A" }}>{analysis.emotionalArc}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>Key Success Factors</div>
                {(analysis.keyFactors || []).map((f: string, i: number) => <FactorBadge key={i} text={f} />)}
              </div>

              <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0, padding: "8px 12px", borderLeft: "3px solid var(--border)", lineHeight: 1.6 }}>
                {analysis.whyItWentViral}
              </p>
            </div>
          </div>

          {/* Your Remixed Version */}
          <div className="card" style={{ border: "2px solid var(--primary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ padding: 7, background: "var(--primary)", borderRadius: 8 }}>
                <Sparkles size={15} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Your Remixed Post</span>
              <span style={{ marginLeft: "auto", fontWeight: 800, fontSize: 14, background: "var(--sage-bg)", color: "#3D5E41", padding: "3px 10px", borderRadius: 6 }}>
                Score: {remixed.predictedScore}/100
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Hook */}
              <div style={{ padding: "10px 12px", background: "var(--sage-bg)", border: "1px solid var(--sage)", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "#3D5E41", letterSpacing: "0.05em" }}>Your Hook</div>
                  <CopyBtn text={remixed.hook} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, fontStyle: "italic" }}>"{remixed.hook}"</div>
              </div>

              {/* Caption */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted-foreground)" }}>Full Caption</div>
                  <CopyBtn text={remixed.caption} />
                </div>
                <div style={{ background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {remixed.caption}
                </div>
              </div>

              {/* Format */}
              {remixed.formatInstructions && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted-foreground)", marginBottom: 6 }}>Filming Guide</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(remixed.formatInstructions.filmingGuide || []).map((shot: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ fontSize: 13 }}>{shot}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, padding: "8px 10px", background: "var(--muted)", borderRadius: 7, border: "1px solid var(--border)", fontSize: 12, color: "var(--muted-foreground)" }}>
                    ✂️ Edit: {remixed.formatInstructions.editingStyle} · {remixed.formatInstructions.length}
                  </div>
                </div>
              )}

              {/* Audio */}
              <div style={{ padding: "9px 11px", background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "#7A3A2A", marginBottom: 2 }}>Trending Audio</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>🎵 {remixed.trendingAudio}</div>
              </div>

              {/* Hashtags */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" as const, color: "var(--muted-foreground)" }}>Hashtags</div>
                  <CopyBtn text={(remixed.hashtags || []).map((h: string) => `#${h.replace(/^#/, "")}`).join(" ")} />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(remixed.hashtags || []).map((tag: string, i: number) => (
                    <span key={i} style={{ padding: "4px 9px", background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      #{tag.replace(/^#/, "")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Engagement hook */}
              {remixed.engagementHook && (
                <div style={{ padding: "9px 11px", background: "var(--lavender-bg)", border: "1px solid var(--lavender)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, color: "#50487A", marginBottom: 2 }}>Engagement Bait Line</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#50487A" }}>"{remixed.engagementHook}"</div>
                </div>
              )}

              {/* Why it will work */}
              {remixed.whyThisWillWork && (
                <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0, padding: "8px 12px", borderLeft: "3px solid var(--primary)", lineHeight: 1.6 }}>
                  💡 {remixed.whyThisWillWork}
                </p>
              )}

              {/* Actions */}
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
                    href={`/carousel?topic=${encodeURIComponent(remixed?.hook || postCaption || "")}`} 
                    textToCopy={fullCopyText} 
                  />
                  <ActionBtn 
                    icon={Film} 
                    label="Make Reel" 
                    href={`/reels?topic=${encodeURIComponent(remixed?.hook || postCaption || "")}`} 
                    textToCopy={fullCopyText} 
                  />
                </div>
                
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                  <CopyBtn text={fullCopyText} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
