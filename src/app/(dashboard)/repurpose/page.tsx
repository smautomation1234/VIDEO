"use client";
import React, { useState } from "react";
import { RefreshCw, Sparkles, Copy, Check, ChevronRight, Film, Layers, BookOpen, MessageSquare, Quote } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

const CONTENT_TYPES = [
  { id: "YouTube Video", ink: "var(--rose-ink)", bg: "var(--rose-bg)", border: "var(--rose)" },
  { id: "Blog Post", ink: "var(--sky-ink)", bg: "var(--sky-bg)", border: "var(--sky)" },
  { id: "Podcast", ink: "var(--lavender-ink)", bg: "var(--lavender-bg)", border: "var(--lavender)" },
  { id: "Instagram Reel", ink: "var(--butter-ink)", bg: "var(--butter-bg)", border: "var(--butter)" },
  { id: "Live Stream", ink: "var(--sage-ink)", bg: "var(--sage-bg)", border: "var(--sage)" },
];

const SECTIONS = [
  { key: "instagramReels", label: "Instagram Reels (3 Angles)", ink: "var(--rose-ink)", bg: "var(--rose-bg)", border: "var(--rose)", icon: Film },
  { key: "instagramCarousel", label: "Instagram Carousel", ink: "var(--butter-ink)", bg: "var(--butter-bg)", border: "var(--butter)", icon: Layers },
  { key: "instagramStories", label: "Instagram Stories", ink: "var(--sky-ink)", bg: "var(--sky-bg)", border: "var(--sky)", icon: MessageSquare },
  { key: "quoteGraphics", label: "Quote Graphics", ink: "var(--lavender-ink)", bg: "var(--lavender-bg)", border: "var(--lavender)", icon: Quote },
  { key: "captionVariations", label: "Caption Variations", ink: "var(--sage-ink)", bg: "var(--sage-bg)", border: "var(--sage)", icon: BookOpen },
  { key: "instagramNotes", label: "Instagram Notes / Threads", ink: "var(--sage-ink)", bg: "var(--sage-bg)", border: "var(--sage)", icon: MessageSquare },
];

function CopyBtn({ text, id, copiedMap, copy }: any) {
  return (
    <button
      onClick={() => copy(text, id)}
      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, background: copiedMap[id] ? "var(--sage-bg)" : "var(--muted)", border: `1px solid ${copiedMap[id] ? "var(--sage)" : "var(--border)"}`, color: copiedMap[id] ? "var(--sage-ink)" : "var(--muted-foreground)", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
    >
      {copiedMap[id] ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
    </button>
  );
}

function SectionCard({ section, result, copiedMap, copy }: { section: typeof SECTIONS[0]; result: any; copiedMap: any; copy: any }) {
  const [expanded, setExpanded] = useState(true);
  const data = result?.[section.key];
  if (!data) return null;
  const Icon = section.icon;

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: section.bg, border: "none", cursor: "pointer", textAlign: "left", borderBottom: expanded ? "1px solid var(--border)" : "none" }}
      >
        <Icon size={16} color={section.ink} />
        <span style={{ fontSize: 13, fontWeight: 800, color: section.ink, flex: 1 }}>{section.label}</span>
        <ChevronRight size={16} color="var(--muted-foreground)" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>

      {expanded && (
        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {section.key === "instagramReels" && Array.isArray(data) && data.map((item: any, i: number) => (
            <div key={i} style={{ padding: 14, background: "var(--muted)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: section.ink, marginBottom: 6 }}>REEL #{i + 1} — {item.angleType}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                {[["Hook", item.hook], ["Description", item.description]].map(([label, val]) => (
                  <div key={label as string}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 3 }}>{label as string}</div>
                    <div style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.5 }}>{val as string}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {section.key === "instagramCarousel" && data.slides && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.slides.map((slide: any, i: number) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: "var(--muted)", borderRadius: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: section.bg, color: section.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{slide.slideNumber}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{slide.headline}</div>
                    {slide.subtext && <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{slide.subtext}</div>}
                    <span style={{ fontSize: 10, color: section.ink, fontWeight: 600 }}>{slide.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section.key === "captionVariations" && Array.isArray(data) && data.map((item: any, i: number) => (
            <div key={i} style={{ padding: 14, background: "var(--muted)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: section.ink }}>VERSION {i + 1} — {item.focus}</div>
                <CopyBtn text={item.caption} id={`cap-${i}`} copiedMap={copiedMap} copy={copy} />
              </div>
              <div style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.caption}</div>
            </div>
          ))}

          {section.key === "instagramStories" && Array.isArray(data) && data.map((story: any, i: number) => (
            <div key={i} style={{ padding: 14, background: "var(--muted)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: section.ink }}>Story {story.story} — {story.type}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--foreground)", marginBottom: 6 }}>{story.text}</div>
              {story.interactive && <div style={{ fontSize: 11, color: "var(--butter-ink)", fontStyle: "italic" }}>Interactive: {story.interactive}</div>}
            </div>
          ))}

          {section.key === "instagramNotes" && Array.isArray(data) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.map((note: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "var(--muted)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: section.bg, color: section.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>{note}</div>
                  <CopyBtn text={note} id={`note-${i}`} copiedMap={copiedMap} copy={copy} />
                </div>
              ))}
            </div>
          )}

          {section.key === "quoteGraphics" && Array.isArray(data) && data.map((q: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", background: "var(--muted)", borderRadius: 10, border: `1px solid ${section.border}`, borderLeft: `3px solid ${section.ink}` }}>
              <Quote size={16} color={section.ink} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--foreground)", fontStyle: "italic", lineHeight: 1.5 }}>"{q.quote}"</div>
              <CopyBtn text={`"${q.quote}"`} id={`q-${i}`} copiedMap={copiedMap} copy={copy} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RepurposePage() {
  const [contentType, setContentType] = useState("YouTube Video");
  const [title, setTitle] = useState("");
  const [mainPoints, setMainPoints] = useState("");
  const [length, setLength] = useState("");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  const generate = async () => {
    if (!title.trim() || !mainPoints.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, title, mainPoints, length, niche }),
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

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Create"
        title="Repurpose"
        description="Turn one piece of content into a full pack of posts, slides and captions."
      />

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, alignItems: "start" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={16} color="var(--lavender-ink)" /> Your Content
          </h2>

          <div>
            <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
              Content Type
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CONTENT_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => setContentType(ct.id)}
                  style={{
                    padding: "6px 12px", borderRadius: 20,
                    border: `1px solid ${contentType === ct.id ? ct.border : "var(--border)"}`,
                    background: contentType === ct.id ? ct.bg : "var(--muted)",
                    color: contentType === ct.id ? ct.ink : "var(--muted-foreground)",
                    fontSize: 12, fontWeight: contentType === ct.id ? 700 : 500, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {ct.id}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
              Content Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 7 AI Tools That Replace My Entire Team"
              className="input-field"
              style={{ width: "100%", fontSize: 13 }}
            />
          </div>

          <div>
            <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>
              Main Points / Key Insights *
            </label>
            <textarea
              value={mainPoints}
              onChange={(e) => setMainPoints(e.target.value)}
              placeholder="Paste your 5 key points here, or summarize your content in a few sentences..."
              className="input-field"
              style={{ width: "100%", height: 140, fontSize: 13, resize: "none", lineHeight: 1.6 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>Length</label>
              <input
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 12 min"
                className="input-field"
                style={{ width: "100%", fontSize: 13 }}
              />
            </div>
            <div>
              <label className="label-muted" style={{ display: "block", marginBottom: 8 }}>Niche</label>
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. SaaS"
                className="input-field"
                style={{ width: "100%", fontSize: 13 }}
              />
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !title.trim() || !mainPoints.trim()}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%" }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Generating Assets..." : "Repurpose My Content"}
          </button>

          {error && (
            <div style={{ padding: 12, background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8, color: "var(--rose-ink)", fontSize: 13 }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ padding: "10px 14px", background: "var(--lavender-bg)", border: "1px solid var(--lavender)", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "var(--lavender-ink)" }}>{result.totalPieces || "15+"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>Content Pieces Generated</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse-soft" style={{ height: 60, background: "var(--muted)", borderRadius: 12, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : result ? (
            SECTIONS.map((section) => (
              <SectionCard key={section.key} section={section} result={result} copiedMap={copiedMap} copy={copy} />
            ))
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, background: "var(--card)", borderRadius: 16, border: "1px dashed var(--border)", gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: "var(--lavender-bg)", border: "1px solid var(--lavender)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={32} color="var(--lavender-ink)" style={{ opacity: 0.6 }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginBottom: 8 }}>1 Post → 15+ Instagram Pieces</div>
                <div style={{ fontSize: 13, color: "var(--muted-foreground)", maxWidth: 340, lineHeight: 1.6 }}>
                  Enter your content title and key points to generate Reels, Carousels, Stories, Notes, and Quote Graphics all at once.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 16 }}>
                  {SECTIONS.map((s) => (
                    <span key={s.key} style={{ padding: "4px 10px", background: s.bg, color: s.ink, borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${s.border}` }}>{s.label}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
