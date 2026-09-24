"use client";

import { useState } from "react";
import {
    Sparkles, Download, ChevronRight, ChevronLeft,
    RefreshCw, CheckCircle, Wand2, Eye, Settings2, Layers,
    RotateCcw, FileText, Palette, LayoutTemplate,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import {
    TEMPLATES, TemplateId, SlideData, SlidePreview, TemplateThumbnail, TC,
    getBullets,
} from "./templates";
import type { Theme } from "./templates";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tone = "formal" | "bold" | "startup" | "creative";

const THEMES = {
    dark: { name: "Dark executive", desc: "Navy • Gold accents", accent: TC.dark.accent },
    bold: { name: "Bold gradient", desc: "Purple gradient • Vibrant", accent: TC.bold.accent },
    clean: { name: "Corporate clean", desc: "White • Blue headers", accent: TC.clean.accent },
};

const SLIDE_COUNTS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
const TONE_OPTIONS: { id: Tone; label: string; desc: string }[] = [
    { id: "formal", label: "Formal", desc: "Boardroom-ready, polished" },
    { id: "bold", label: "Bold", desc: "Energetic, disruption-focused" },
    { id: "startup", label: "Startup", desc: "Casual yet credible" },
    { id: "creative", label: "Creative", desc: "Storytelling, design-forward" },
];

// ─── default template per slide type ─────────────────────────────────────────
function defaultTemplate(type: string): TemplateId {
    if (type === "chart") return "stats_grid";
    return "bullets";
}

// ─── Step dots ────────────────────────────────────────────────────────────────
function StepDots({ step }: { step: number }) {
    const labels = ["Setup", "Edit Slides", "Preview & Export"];
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "2rem" }}>
            {labels.map((label, i) => {
                const n = i + 1; const done = n < step; const active = n === step;
                return (
                    <div key={n} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.75rem", fontWeight: 600, transition: "all 0.3s",
                                background: done ? "var(--sage-ink)" : active ? "var(--foreground)" : "var(--border)",
                                color: done || active ? "#fff" : "var(--muted-foreground)",
                            }}>
                                {done ? <CheckCircle size={13} /> : n}
                            </div>
                            <span style={{ fontSize: "0.6875rem", fontWeight: active ? 600 : 400, color: active ? "var(--foreground)" : "var(--muted-foreground)", whiteSpace: "nowrap" }}>{label}</span>
                        </div>
                        {i < labels.length - 1 && <div style={{ flex: 1, height: 1, margin: "0 0.5rem", marginBottom: "1rem", background: done ? "var(--sage-ink)" : "var(--border)" }} />}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PitchDeckPage() {
    const [step, setStep] = useState(1);
    const [companyName, setCompanyName] = useState("");
    const [topic, setTopic] = useState("");
    const [industry, setIndustry] = useState("");
    const [targetAudience, setTargetAudience] = useState("Investors and venture capitalists");
    const [tone, setTone] = useState<Tone>("startup");
    const [slideCount, setSlideCount] = useState(20);
    const [theme, setTheme] = useState<Theme>("dark");
    const [slides, setSlides] = useState<SlideData[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [error, setError] = useState("");
    const [enhancingIdx, setEnhancingIdx] = useState<number | null>(null);
    const [enhancingAll, setEnhancingAll] = useState(false);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [previewIdx, setPreviewIdx] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [templatePickerIdx, setTemplatePickerIdx] = useState<number | null>(null);

    const tc = TC[theme];

    // ── Generate outline ──────────────────────────────────────────────────────
    const generateOutline = async () => {
        if (!companyName.trim() || !topic.trim()) { setError("Please fill in Company Name and Topic."); return; }
        setLoading(true); setError(""); setLoadingMsg("AI is crafting your slide structure...");
        try {
            const res = await fetch("/api/generate/pitchdeck", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "outline", topic, companyName, targetAudience, tone, slideCount, industry }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed");
            const initialized: SlideData[] = data.slides.map((s: any) => ({
                ...s,
                userContent: s.suggestedContent || "",
                enhancedBullets: [], speakerNote: "", isEnhanced: false,
                template: defaultTemplate(s.type),
            }));
            setSlides(initialized); setStep(2);
        } catch (e: any) { setError(String(e)); }
        setLoading(false);
    };

    // ── Enhance single ────────────────────────────────────────────────────────
    const enhanceSingle = async (idx: number) => {
        setEnhancingIdx(idx);
        try {
            const res = await fetch("/api/generate/pitchdeck", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "enhance_single", companyName, topic, targetAudience, tone, slide: slides[idx] }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setSlides(prev => prev.map((s, i) => i === idx ? {
                ...s, title: data.enhanced.title || s.title,
                enhancedBullets: data.enhanced.enhancedBullets || [],
                speakerNote: data.enhanced.speakerNote || "", isEnhanced: true,
            } : s));
        } catch (e: any) { setError(String(e)); }
        setEnhancingIdx(null);
    };

    // ── Enhance all ───────────────────────────────────────────────────────────
    const enhanceAll = async () => {
        setEnhancingAll(true); setError("");
        const batchSize = 5; const updated = [...slides];
        for (let i = 0; i < slides.length; i += batchSize) {
            try {
                setLoadingMsg(`Enhancing slides ${i + 1}–${Math.min(i + batchSize, slides.length)} of ${slides.length}…`);
                const res = await fetch("/api/generate/pitchdeck", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "enhance", companyName, topic, targetAudience, tone, slides: slides.slice(i, i + batchSize) }),
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.enhanced)) {
                    data.enhanced.forEach((e: any) => {
                        if (updated[e.index]) {
                            updated[e.index] = { ...updated[e.index], title: e.title || updated[e.index].title, enhancedBullets: e.enhancedBullets || [], speakerNote: e.speakerNote || "", isEnhanced: true };
                        }
                    });
                }
            } catch (_) { /* continue */ }
        }
        setSlides(updated); setEnhancingAll(false); setLoadingMsg("");
    };

    // ── Export PPTX ───────────────────────────────────────────────────────────
    const exportPptx = async () => {
        setExporting(true);
        try {
            const PptxGenJS = (await import("pptxgenjs")).default;
            const pptx = new PptxGenJS();
            pptx.layout = "LAYOUT_WIDE"; pptx.author = companyName; pptx.title = `${companyName} - Pitch Deck`;

            const col = {
                dark: { bg: "0D1117", accent: "C9A84C", text: "FFFFFF", sub: "94A3B8", card: "161B22" },
                bold: { bg: "1E1B4B", accent: "A78BFA", text: "FFFFFF", sub: "C4B5FD", card: "2D2B69" },
                clean: { bg: "FFFFFF", accent: "1D4ED8", text: "111827", sub: "6B7280", card: "F8FAFC" },
            }[theme];

            slides.forEach((slide, idx) => {
                const sld = pptx.addSlide();
                const bullets = getBullets(slide);
                const isTitle = slide.type === "title";
                const isSection = slide.type === "section" || slide.type === "cta";

                // Background
                sld.background = { color: isTitle ? col.accent : isSection ? col.card : col.bg };

                // Accent bar + footer (always)
                if (!isTitle) sld.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: col.accent } });
                sld.addText(`${idx + 1} / ${slides.length}`, { x: 8.5, y: 5.2, w: 1.3, h: 0.3, fontSize: 7, color: col.sub, align: "right" });
                sld.addText(companyName, { x: 0.3, y: 5.2, w: 3, h: 0.3, fontSize: 7, color: col.sub });

                if (isTitle) {
                    sld.addShape(pptx.ShapeType.rect, { x: 3.5, y: 2.2, w: 3, h: 0.05, fill: { color: "FFFFFF" } });
                    sld.addText(slide.title, { x: 1, y: 1.2, w: 8, h: 1.5, fontSize: 36, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
                    sld.addText(companyName, { x: 1, y: 3, w: 8, h: 0.5, fontSize: 14, color: "E2E8F0", align: "center" });
                    if (bullets[0]) sld.addText(bullets[0], { x: 1.5, y: 3.6, w: 7, h: 0.6, fontSize: 11, color: "CBD5E1", align: "center", italic: true });
                } else if (isSection) {
                    sld.addText(slide.type === "cta" ? "CLOSING" : "CHAPTER", { x: 0.5, y: 1.5, w: 9, h: 0.35, fontSize: 9, color: col.accent, bold: true, align: "center", charSpacing: 4 });
                    sld.addText(slide.title, { x: 0.5, y: 2, w: 9, h: 1.2, fontSize: 28, bold: true, color: col.text, align: "center", valign: "middle" });
                    if (bullets[0]) sld.addText(bullets[0], { x: 1.5, y: 3.3, w: 7, h: 0.6, fontSize: 13, color: col.sub, align: "center" });
                } else {
                    // Title
                    sld.addText(slide.title, { x: 0.4, y: 0.12, w: 9, h: 0.65, fontSize: 20, bold: true, color: col.accent });
                    sld.addShape(pptx.ShapeType.rect, { x: 0.4, y: 0.82, w: 9.2, h: 0.02, fill: { color: col.sub } });

                    // Template-specific body
                    const tpl = slide.template;

                    if (tpl === "stats_grid") {
                        const stats = bullets.slice(0, 4).map(b => { const p = b.split(/\s+/); return { num: p[0] || "—", label: p.slice(1).join(" ") }; });
                        while (stats.length < 4) stats.push({ num: "—", label: "Metric" });
                        const positions = [[0.4, 1.0], [5.1, 1.0], [0.4, 3.1], [5.1, 3.1]];
                        stats.forEach((s, i) => {
                            const [x, y] = positions[i];
                            sld.addShape(pptx.ShapeType.rect, { x, y, w: 4.5, h: 1.8, fill: { color: col.card }, line: { color: col.accent, width: 1 } });
                            sld.addText(s.num, { x, y: y + 0.15, w: 4.5, h: 1, fontSize: 32, bold: true, color: col.accent, align: "center" });
                            sld.addText(s.label, { x, y: y + 1.1, w: 4.5, h: 0.5, fontSize: 11, color: col.sub, align: "center" });
                        });
                    } else if (tpl === "timeline") {
                        const items = bullets.slice(0, 5);
                        sld.addShape(pptx.ShapeType.rect, { x: 0.4, y: 2.5, w: 9.2, h: 0.05, fill: { color: col.accent } });
                        const step2 = 9.2 / Math.max(items.length - 1, 1);
                        items.forEach((item, i) => {
                            const x = 0.4 + i * step2;
                            const [label, sub] = item.split(":").map((s: string) => s.trim());
                            sld.addShape(pptx.ShapeType.ellipse, { x: x - 0.12, y: 2.38, w: 0.25, h: 0.25, fill: { color: col.accent } });
                            sld.addText(label, { x: x - 0.7, y: 2.7, w: 1.5, h: 0.4, fontSize: 8, bold: true, color: col.accent, align: "center" });
                            if (sub) sld.addText(sub, { x: x - 0.7, y: 3.1, w: 1.5, h: 0.5, fontSize: 7, color: col.sub, align: "center" });
                        });
                    } else if (tpl === "two_column") {
                        bullets.slice(0, 4).forEach((b, i) => {
                            sld.addText(`▸  ${b}`, { x: 0.4, y: 1.2 + i * 0.8, w: 4.5, h: 0.6, fontSize: 16, color: col.text, valign: "middle" });
                        });
                        sld.addShape(pptx.ShapeType.rect, { x: 5.2, y: 1.0, w: 4.5, h: 3.5, fill: { color: col.card }, line: { color: col.accent, width: 1 } });
                        sld.addText("📈", { x: 5.2, y: 2.3, w: 4.5, h: 1, fontSize: 32, align: "center" });
                    } else if (tpl === "big_number") {
                        sld.addText(bullets[0] || "0", { x: 0.5, y: 1.0, w: 9, h: 2.0, fontSize: 100, bold: true, color: col.accent, align: "center" });
                        sld.addText(bullets[1] || slide.title, { x: 1, y: 3.1, w: 8, h: 0.6, fontSize: 24, bold: true, color: col.text, align: "center" });
                        if (bullets[2]) sld.addText(bullets[2], { x: 1.5, y: 3.8, w: 7, h: 0.5, fontSize: 16, color: col.sub, align: "center", italic: true });
                    } else if (tpl === "comparison") {
                        sld.addShape(pptx.ShapeType.rect, { x: 0.4, y: 0.95, w: 4.5, h: 0.35, fill: { color: "EF444430" } });
                        sld.addText("BEFORE", { x: 0.4, y: 0.95, w: 4.5, h: 0.35, fontSize: 9, bold: true, color: "EF4444", align: "center" });
                        sld.addShape(pptx.ShapeType.rect, { x: 5.1, y: 0.95, w: 4.5, h: 0.35, fill: { color: "16A34A30" } });
                        sld.addText("AFTER", { x: 5.1, y: 0.95, w: 4.5, h: 0.35, fontSize: 9, bold: true, color: "16A34A", align: "center" });
                        bullets.slice(0, 4).forEach((b, i) => {
                            const [before, after] = b.split("|").map((s: string) => s.trim());
                            const y = 1.5 + i * 0.75;
                            sld.addShape(pptx.ShapeType.rect, { x: 0.4, y, w: 4.5, h: 0.6, fill: { color: col.card }, line: { color: "EF4444", width: 0.5 } });
                            sld.addText(`✗  ${before}`, { x: 0.5, y, w: 4.3, h: 0.6, fontSize: 10, color: col.text, valign: "middle" });
                            sld.addShape(pptx.ShapeType.rect, { x: 5.1, y, w: 4.5, h: 0.6, fill: { color: col.card }, line: { color: "16A34A", width: 0.5 } });
                            sld.addText(`✓  ${after || "—"}`, { x: 5.2, y, w: 4.3, h: 0.6, fontSize: 10, color: col.text, valign: "middle" });
                        });
                    } else if (tpl === "process_steps") {
                        const items = bullets.slice(0, 5);
                        const gapW = 9.6 / items.length;
                        items.forEach((s, i) => {
                            const x = 0.4 + i * gapW + gapW / 2;
                            sld.addShape(pptx.ShapeType.ellipse, { x: x - 0.35, y: 1.2, w: 0.7, h: 0.7, fill: { color: col.accent } });
                            sld.addText(`${i + 1}`, { x: x - 0.35, y: 1.2, w: 0.7, h: 0.7, fontSize: 14, bold: true, color: col.bg === "FFFFFF" ? "FFFFFF" : "000000", align: "center", valign: "middle" });
                            sld.addText(s, { x: x - 0.8, y: 2.1, w: 1.6, h: 0.8, fontSize: 9, color: col.text, align: "center" });
                            if (i < items.length - 1) {
                                sld.addShape(pptx.ShapeType.rect, { x: x + 0.4, y: 1.52, w: gapW - 0.7, h: 0.05, fill: { color: col.accent } });
                            }
                        });
                    } else if (tpl === "quote") {
                        sld.addText('"', { x: 0.5, y: 0.6, w: 2, h: 1.5, fontSize: 120, color: col.accent, fontFace: "Georgia" });
                        sld.addText(bullets[0] || slide.title, { x: 1, y: 1.2, w: 8, h: 2.5, fontSize: 26, italic: true, color: col.text, align: "center", valign: "middle", lineSpacing: 36 });
                        if (bullets[1]) {
                            sld.addShape(pptx.ShapeType.rect, { x: 4.0, y: 3.8, w: 2.0, h: 0.04, fill: { color: col.accent } });
                            sld.addText(bullets[1], { x: 1, y: 4.0, w: 8, h: 0.6, fontSize: 14, color: col.accent, align: "center", bold: true });
                        }
                    } else {
                        // default bullets
                        const bItems = bullets.slice(0, 6).map(b => ({
                            text: b,
                            options: {
                                bullet: { characterCode: "25B8", color: col.accent }, // Small right-pointing triangle ▸
                                fontSize: 16,
                                color: col.text,
                                paraSpaceAfter: 14,
                                valign: "middle" as const
                            }
                        }));
                        if (bItems.length > 0) {
                            sld.addText(bItems, {
                                x: 0.6,
                                y: 1.2,
                                w: 8.8,
                                h: 3.8,
                                valign: "top"
                            });
                        }
                    }

                    if (slide.speakerNote) sld.addNotes(slide.speakerNote);
                }
            });

            pptx.writeFile({ fileName: `${companyName.replace(/\s+/g, "-")}-PitchDeck.pptx` });
        } catch (e: any) { setError("Export failed: " + String(e)); }
        setExporting(false);
    };

    // ─── RENDER ─────────────────────────────────────────────────────────────────
    return (
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <PageHeader
                eyebrow="Create"
                title="Pitch deck"
                description="Investor-ready decks from a short brief."
            />

            <StepDots step={step} />

            {error && (
                <div style={{ background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem", color: "var(--rose-ink)" }}>
                    {error} <button onClick={() => setError("")} style={{ marginLeft: 8, cursor: "pointer", background: "none", border: "none", color: "var(--rose-ink)", fontWeight: 700 }}>✕</button>
                </div>
            )}

            {/* ── STEP 1: Setup ──────────────────────────────────────────────────── */}
            {step === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>
                    <div className="card">
                        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                            <Settings2 size={15} />Deck Setup
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                <div>
                                    <label style={lbl}>Company / Product Name *</label>
                                    <input style={inp} placeholder="e.g. Acme AI" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                                </div>
                                <div>
                                    <label style={lbl}>Industry</label>
                                    <input style={inp} placeholder="e.g. SaaS, HealthTech" value={industry} onChange={e => setIndustry(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label style={lbl}>Pitch Topic / Purpose *</label>
                                <textarea style={{ ...inp, height: 80, resize: "vertical" }} placeholder="e.g. Raising $2M seed round for our AI-powered sales tool" value={topic} onChange={e => setTopic(e.target.value)} />
                            </div>
                            <div>
                                <label style={lbl}>Target Audience</label>
                                <input style={inp} placeholder="e.g. Seed-stage investors" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
                            </div>
                            <div>
                                <label style={lbl}>Tone</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                    {TONE_OPTIONS.map(opt => (
                                        <button key={opt.id} onClick={() => setTone(opt.id)} style={{
                                            padding: "0.625rem 0.75rem", borderRadius: 8, cursor: "pointer", textAlign: "left",
                                            border: `1.5px solid ${tone === opt.id ? "var(--foreground)" : "var(--border)"}`,
                                            background: tone === opt.id ? "var(--foreground)" : "var(--card)",
                                        }}>
                                            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: tone === opt.id ? "var(--background)" : "var(--foreground)" }}>{opt.label}</div>
                                            <div style={{ fontSize: "0.6875rem", color: tone === opt.id ? "rgba(255,255,255,0.6)" : "var(--muted-foreground)" }}>{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={lbl}>Number of Slides</label>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    {SLIDE_COUNTS.map(n => (
                                        <button key={n} onClick={() => setSlideCount(n)} style={{
                                            padding: "0.5rem 0.75rem", borderRadius: 8, cursor: "pointer", minWidth: 48,
                                            border: `1.5px solid ${slideCount === n ? "var(--foreground)" : "var(--border)"}`,
                                            background: slideCount === n ? "var(--foreground)" : "var(--card)",
                                            color: slideCount === n ? "var(--background)" : "var(--foreground)", fontWeight: 600, fontSize: "0.875rem",
                                        }}>{n}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={generateOutline} disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "1.5rem", padding: "0.75rem", fontSize: "0.9375rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                            {loading ? <><RefreshCw size={15} className="animate-spin" />{loadingMsg}</> : <><Sparkles size={15} />Generate {slideCount}-Slide Outline</>}
                        </button>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "1rem", color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                            <Palette size={14} />Choose Theme
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.25rem" }}>
                            {(Object.keys(THEMES) as Theme[]).map(key => {
                                const th = THEMES[key]; const active = theme === key; const t = TC[key];
                                return (
                                    <button key={key} onClick={() => setTheme(key)} style={{
                                        border: `2px solid ${active ? "var(--foreground)" : "var(--border)"}`, borderRadius: 10, padding: "0.75rem",
                                        cursor: "pointer", background: "var(--card)", display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left",
                                    }}>
                                        <div style={{
                                            width: 52, height: 33, borderRadius: 5, flexShrink: 0, border: `1px solid ${t.border}`, overflow: "hidden",
                                            background: key === "bold" ? "linear-gradient(135deg,#4F1D96,#1E1B4B)" : t.bg,
                                            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 3
                                        }}>
                                            <div style={{ width: 28, height: 3, background: t.accent, borderRadius: 2 }} />
                                            <div style={{ width: 20, height: 2, background: t.sub, borderRadius: 2, opacity: 0.5 }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--foreground)" }}>{th.name}</div>
                                            <div style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>{th.desc}</div>
                                        </div>
                                        {active && <CheckCircle size={15} style={{ marginLeft: "auto", color: "var(--foreground)", flexShrink: 0 }} />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Template gallery in setup */}
                        <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                            <LayoutTemplate size={14} />Slide Templates
                        </h2>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                            {TEMPLATES.map(tpl => (
                                <div key={tpl.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.5rem 0.625rem", background: "var(--card)", textAlign: "center" }}>
                                    <div style={{ fontSize: "1rem" }}>{tpl.icon}</div>
                                    <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--foreground)", marginTop: "0.15rem" }}>{tpl.label}</div>
                                    <div style={{ fontSize: "0.52rem", color: "var(--muted-foreground)", lineHeight: 1.3, marginTop: "0.1rem" }}>{tpl.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Edit Slides ─────────────────────────────────────────────── */}
            {step === 2 && slides.length > 0 && (
                <div>
                    <div className="card" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--foreground)" }}>{slides.length} Slides</span>
                            <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginLeft: 8 }}>— Pick a template per slide, edit content, then AI Enhance</span>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button onClick={() => setStep(1)} style={ghost}><ChevronLeft size={14} />Back</button>
                            <button onClick={enhanceAll} disabled={enhancingAll} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.875rem" }}>
                                {enhancingAll ? <><RefreshCw size={13} className="animate-spin" />{loadingMsg || "Enhancing…"}</> : <><Wand2 size={13} />AI Enhance All</>}
                            </button>
                            <button onClick={() => setStep(3)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.875rem", background: "var(--foreground)", color: "var(--background)" }}>
                                Preview & Export<ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "0.875rem" }}>
                        {slides.map((slide, idx) => {
                            const isContentSlide = slide.type === "content" || slide.type === "chart";
                            const tplInfo = TEMPLATES.find(t => t.id === slide.template)!;
                            return (
                                <div key={idx} className="card" style={{ padding: "1rem" }}>
                                    {/* Mini preview */}
                                    <div style={{ marginBottom: "0.625rem", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                                        <SlidePreview slide={slide} theme={theme} companyName={companyName || "Company"} idx={idx} total={slides.length} />
                                    </div>

                                    {/* Header */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                                        <span style={{
                                            fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em",
                                            background: slide.type === "title" ? "var(--lavender-bg)" : slide.type === "section" ? "var(--butter-bg)" : slide.type === "cta" ? "var(--sage-bg)" : "var(--muted)",
                                            color: slide.type === "title" ? "var(--lavender-ink)" : slide.type === "section" ? "var(--butter-ink)" : slide.type === "cta" ? "var(--sage-ink)" : "var(--muted-foreground)",
                                        }}>{slide.type}</span>
                                        <span style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>Slide {idx + 1}</span>
                                        {slide.isEnhanced && <span style={{ fontSize: "0.6rem", color: "var(--sage-ink)", fontWeight: 600 }}>✓ Enhanced</span>}
                                        {isContentSlide && (
                                            <span style={{ marginLeft: "auto", fontSize: "0.6rem", color: tc.accent, background: `${tc.accent}15`, padding: "0.15rem 0.5rem", borderRadius: 999, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                                                {tplInfo?.icon} {tplInfo?.label}
                                            </span>
                                        )}
                                    </div>

                                    {/* Template picker (content slides only) */}
                                    {isContentSlide && (
                                        <div style={{ marginBottom: "0.5rem" }}>
                                            <button onClick={() => setTemplatePickerIdx(templatePickerIdx === idx ? null : idx)}
                                                style={{ ...ghost, width: "100%", justifyContent: "center", fontSize: "0.75rem", marginBottom: templatePickerIdx === idx ? "0.5rem" : 0 }}>
                                                <LayoutTemplate size={11} />Change Template
                                            </button>
                                            {templatePickerIdx === idx && (
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.3rem" }}
                                                    onClick={() => setTemplatePickerIdx(null)}>
                                                    {TEMPLATES.map(tpl => (
                                                        <div key={tpl.id} onClick={() => setSlides(prev => prev.map((s, i) => i === idx ? { ...s, template: tpl.id } : s))}
                                                            title={tpl.desc}>
                                                            <TemplateThumbnail tpl={tpl} active={slide.template === tpl.id} accent={tc.accent} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Title input */}
                                    <input value={slide.title}
                                        onChange={e => setSlides(prev => prev.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
                                        style={{ ...inp, fontWeight: 600, marginBottom: "0.5rem" }} placeholder="Slide title" />

                                    {/* Content textarea */}
                                    <textarea
                                        value={editingIdx === idx ? slide.userContent : slide.enhancedBullets.length > 0 ? slide.enhancedBullets.join("\n") : slide.userContent}
                                        onFocus={() => setEditingIdx(idx)}
                                        onChange={e => { setEditingIdx(idx); setSlides(prev => prev.map((s, i) => i === idx ? { ...s, userContent: e.target.value, enhancedBullets: [] } : s)); }}
                                        style={{ ...inp, height: 75, resize: "vertical", fontSize: "0.8125rem" }}
                                        placeholder={tplInfo?.hint || "Add your content here — AI will enhance it"}
                                    />
                                    {slide.speakerNote && (
                                        <div style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)", background: "var(--muted)", borderRadius: 6, padding: "0.4rem 0.6rem", marginTop: "0.4rem", lineHeight: 1.5 }}>
                                            <span style={{ fontWeight: 600 }}>Speaker note: </span>{slide.speakerNote}
                                        </div>
                                    )}
                                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.625rem" }}>
                                        <button onClick={() => enhanceSingle(idx)} disabled={enhancingIdx === idx}
                                            style={{ ...ghost, flex: 1, justifyContent: "center", fontSize: "0.75rem" }}>
                                            {enhancingIdx === idx ? <RefreshCw size={11} className="animate-spin" /> : <Wand2 size={11} />}
                                            {enhancingIdx === idx ? "Enhancing…" : "AI Enhance"}
                                        </button>
                                        <button onClick={() => setSlides(prev => prev.map((s, i) => i === idx ? { ...s, enhancedBullets: [], speakerNote: "", isEnhanced: false } : s))}
                                            style={{ ...ghost, fontSize: "0.75rem" }}>
                                            <RotateCcw size={11} />Reset
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                        <button onClick={() => setStep(3)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem" }}>
                            <Eye size={15} />Preview & Export<ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Preview & Export ────────────────────────────────────────── */}
            {step === 3 && slides.length > 0 && (
                <div>
                    <div className="card" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--foreground)" }}>{companyName} — {slides.length} Slides</div>
                            <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>Theme: {THEMES[theme].name}</div>
                        </div>
                        <button onClick={() => setStep(2)} style={ghost}><ChevronLeft size={14} />Edit Slides</button>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                            {(Object.keys(THEMES) as Theme[]).map(k => (
                                <button key={k} onClick={() => setTheme(k)} title={THEMES[k].name} style={{
                                    width: 28, height: 28, borderRadius: 6, cursor: "pointer",
                                    background: k === "bold" ? "linear-gradient(135deg,#4F1D96,#1E1B4B)" : TC[k].bg,
                                    border: `2px solid ${theme === k ? "var(--foreground)" : "var(--border)"}`,
                                }} />
                            ))}
                        </div>
                        <button onClick={exportPptx} disabled={exporting} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem" }}>
                            {exporting ? <><RefreshCw size={14} className="animate-spin" />Generating…</> : <><Download size={14} />Download .pptx</>}
                        </button>
                    </div>

                    {/* Navigator */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                        <button onClick={() => setPreviewIdx(i => Math.max(0, i - 1))} disabled={previewIdx === 0} style={ghost}><ChevronLeft size={16} /></button>
                        <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", flex: 1, textAlign: "center" }}>
                            Slide {previewIdx + 1} of {slides.length} — <strong style={{ color: "var(--foreground)" }}>{slides[previewIdx].title}</strong>
                            {" "}<span style={{ fontSize: "0.75rem", color: tc.accent }}>({TEMPLATES.find(t => t.id === slides[previewIdx].template)?.icon} {TEMPLATES.find(t => t.id === slides[previewIdx].template)?.label})</span>
                        </span>
                        <button onClick={() => setPreviewIdx(i => Math.min(slides.length - 1, i + 1))} disabled={previewIdx === slides.length - 1} style={ghost}><ChevronRight size={16} /></button>
                    </div>

                    {/* Large preview */}
                    <div style={{ maxWidth: 760, margin: "0 auto 1.5rem", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", borderRadius: 12, overflow: "hidden" }}>
                        <SlidePreview slide={slides[previewIdx]} theme={theme} companyName={companyName} idx={previewIdx} total={slides.length} />
                    </div>

                    {slides[previewIdx].speakerNote && (
                        <div style={{ maxWidth: 760, margin: "0 auto 1.5rem", background: "var(--muted)", borderRadius: 10, padding: "0.875rem 1rem" }}>
                            <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Speaker Note</div>
                            <p style={{ fontSize: "0.875rem", color: "var(--foreground)", lineHeight: 1.6 }}>{slides[previewIdx].speakerNote}</p>
                        </div>
                    )}

                    {/* Filmstrip */}
                    <div style={{ overflowX: "auto", paddingBottom: "0.5rem" }}>
                        <div style={{ display: "flex", gap: "0.5rem", width: "max-content" }}>
                            {slides.map((slide, idx) => (
                                <div key={idx} onClick={() => setPreviewIdx(idx)} style={{
                                    width: 130, flexShrink: 0, cursor: "pointer", borderRadius: 6, overflow: "hidden",
                                    border: `2px solid ${previewIdx === idx ? "var(--foreground)" : "var(--border)"}`, opacity: previewIdx === idx ? 1 : 0.75, transition: "border-color 0.15s"
                                }}>
                                    <SlidePreview slide={slide} theme={theme} companyName={companyName || "Co"} idx={idx} total={slides.length} />
                                    <div style={{ padding: "0.2rem 0.4rem", background: "var(--card)", fontSize: "0.5rem", color: "var(--muted-foreground)", borderTop: "1px solid var(--border)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {idx + 1}. {slide.title}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info cards */}
                    <div style={{ maxWidth: 760, margin: "1.5rem auto 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                        {[
                            { icon: <FileText size={16} />, label: "Format", value: "PowerPoint .pptx" },
                            { icon: <Layers size={16} />, label: "Slides", value: `${slides.length} slides` },
                            { icon: <LayoutTemplate size={16} />, label: "Templates", value: `${new Set(slides.map(s => s.template)).size} used` },
                        ].map((item, i) => (
                            <div key={i} className="card" style={{ padding: "0.875rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                <span style={{ color: "var(--muted-foreground)" }}>{item.icon}</span>
                                <div>
                                    <div style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>{item.label}</div>
                                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)" }}>{item.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const lbl: React.CSSProperties = { display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--foreground)", marginBottom: "0.375rem" };
const inp: React.CSSProperties = { width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };
const ghost: React.CSSProperties = { padding: "0.5rem 0.875rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 };
