"use client";
import React from "react";

// ─── Template registry ────────────────────────────────────────────────────────
export type TemplateId =
    | "bullets"
    | "stats_grid"
    | "timeline"
    | "two_column"
    | "big_number"
    | "comparison"
    | "process_steps"
    | "quote";

export interface TemplateInfo {
    id: TemplateId;
    label: string;
    icon: string;
    desc: string;
    hint: string; // placeholder hint for user content
}

export const TEMPLATES: TemplateInfo[] = [
    { id: "bullets", label: "Bullet List", icon: "📋", desc: "Title + bullet points", hint: "Key point 1\nKey point 2\nKey point 3" },
    { id: "stats_grid", label: "Stats Grid", icon: "📊", desc: "4 big metrics in a grid", hint: "10x ROI\n$5M ARR\n3K Users\n98% Retention" },
    { id: "timeline", label: "Timeline", icon: "🕒", desc: "Horizontal milestone timeline", hint: "Q1 2023: Founded\nQ3 2023: Beta launch\nQ1 2024: Series A\nQ4 2024: Expansion" },
    { id: "two_column", label: "Two Column", icon: "⬜", desc: "Left text + right visual panel", hint: "Problem: Legacy systems slow teams down\nSolution: AI-native workflow engine\nResult: 10x faster delivery" },
    { id: "big_number", label: "Big Number", icon: "🔢", desc: "One huge KPI front & centre", hint: "$12M\nTotal Addressable Market\nGrowing 40% YoY" },
    { id: "comparison", label: "Comparison", icon: "⚖️", desc: "Before vs After / Us vs Them", hint: "Before: 6 hrs manual work | After: 15 mins automated\nBefore: 30% error rate | After: <1% error rate\nBefore: $80K/yr cost | After: $12K/yr cost" },
    { id: "process_steps", label: "Process Steps", icon: "🔄", desc: "Numbered step-by-step flow", hint: "Sign Up\nConnect your data\nAI analyses patterns\nGet actionable insights" },
    { id: "quote", label: "Quote Highlight", icon: "💬", desc: "Pull-quote with attribution", hint: "\"This changed how we sell.\"\n— Jane Smith, VP Sales, Acme Corp" },
];

// ─── Theme colours (keep in sync with page.tsx) ───────────────────────────────
export type Theme = "dark" | "bold" | "clean";

export const TC = {
    dark: { bg: "#0D1117", accent: "#C9A84C", text: "#FFFFFF", sub: "#94A3B8", card: "#161B22", border: "#30363D" },
    bold: { bg: "#1E1B4B", accent: "#A78BFA", text: "#FFFFFF", sub: "#C4B5FD", card: "#2D2B69", border: "rgba(167,139,250,0.3)" },
    clean: { bg: "#FFFFFF", accent: "#1D4ED8", text: "#111827", sub: "#6B7280", card: "#F8FAFC", border: "#E5E7EB" },
};

// ─── Shared slide wrapper ─────────────────────────────────────────────────────
function Wrap({ theme, children, title, isSpecial, specialBg }: {
    theme: Theme; children: React.ReactNode; title?: string;
    isSpecial?: boolean; specialBg?: string;
}) {
    const t = TC[theme];
    return (
        <div style={{
            width: "100%", aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", position: "relative",
            background: specialBg || (isSpecial ? t.card : t.bg),
            border: `1px solid ${t.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            display: "flex", flexDirection: "column",
        }}>
            {/* accent bar */}
            {!isSpecial && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: t.accent }} />}
            {/* title row */}
            {title && (
                <div style={{ padding: "1rem 1rem 0", marginTop: 4 }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: t.accent }}>{title}</span>
                    <div style={{ height: 1, background: t.border, marginTop: "0.3rem" }} />
                </div>
            )}
            <div style={{ flex: 1, overflow: "hidden", padding: "0.5rem 1rem 0.75rem" }}>
                {children}
            </div>
        </div>
    );
}

// ─── 1. Bullets ───────────────────────────────────────────────────────────────
export function BulletsPreview({ slide, theme, companyName, idx, total }: SlidePreviewProps) {
    const t = TC[theme];
    const bullets = getBullets(slide);
    return (
        <Wrap theme={theme} title={slide.title || "Slide Title"}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {bullets.slice(0, 5).map((b, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.35rem" }}>
                        <span style={{ color: t.accent, fontSize: "0.5rem", marginTop: "0.12rem", flexShrink: 0 }}>▸</span>
                        <span style={{ fontSize: "0.45rem", color: t.text, lineHeight: 1.5 }}>{b}</span>
                    </li>
                ))}
            </ul>
            <Footer t={t} idx={idx} total={total} company={companyName} />
        </Wrap>
    );
}

// ─── 2. Stats Grid ────────────────────────────────────────────────────────────
export function StatsGridPreview({ slide, theme, companyName, idx, total }: SlidePreviewProps) {
    const t = TC[theme];
    const bullets = getBullets(slide);
    // Each bullet = "Number Label" e.g. "$5M ARR"
    const stats = bullets.slice(0, 4).map(b => {
        const parts = b.split(/\s+/);
        return { num: parts[0] || "—", label: parts.slice(1).join(" ") || b };
    });
    while (stats.length < 4) stats.push({ num: "—", label: "Metric" });

    return (
        <Wrap theme={theme} title={slide.title}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", height: "100%" }}>
                {stats.map((s, i) => (
                    <div key={i} style={{
                        background: theme === "clean" ? "#EFF6FF" : t.card, borderRadius: 6,
                        border: `1px solid ${t.border}`, display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", padding: "0.4rem",
                    }}>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: t.accent, lineHeight: 1 }}>{s.num}</span>
                        <span style={{ fontSize: "0.38rem", color: t.sub, marginTop: "0.2rem", textAlign: "center" }}>{s.label}</span>
                    </div>
                ))}
            </div>
            <Footer t={t} idx={idx} total={total} company={companyName} />
        </Wrap>
    );
}

// ─── 3. Timeline ─────────────────────────────────────────────────────────────
export function TimelinePreview({ slide, theme, companyName, idx, total }: SlidePreviewProps) {
    const t = TC[theme];
    const bullets = getBullets(slide);
    const items = bullets.slice(0, 5);

    return (
        <Wrap theme={theme} title={slide.title}>
            {/* horizontal line */}
            <div style={{ position: "relative", marginTop: "1rem" }}>
                <div style={{ height: 2, background: t.accent, borderRadius: 2 }} />
                <div style={{ display: "flex", justifyContent: "space-around", marginTop: "-0.45rem" }}>
                    {items.map((item, i) => {
                        const [label, sub] = item.split(":").map(s => s.trim());
                        return (
                            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 60 }}>
                                {/* dot */}
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.accent, border: `2px solid ${t.bg}`, flexShrink: 0 }} />
                                <span style={{ fontSize: "0.38rem", fontWeight: 700, color: t.accent, marginTop: "0.25rem", textAlign: "center" }}>{label}</span>
                                {sub && <span style={{ fontSize: "0.33rem", color: t.sub, textAlign: "center", marginTop: "0.1rem" }}>{sub}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
            <Footer t={t} idx={idx} total={total} company={companyName} />
        </Wrap>
    );
}

// ─── 4. Two Column ────────────────────────────────────────────────────────────
export function TwoColumnPreview({ slide, theme, companyName, idx, total }: SlidePreviewProps) {
    const t = TC[theme];
    const bullets = getBullets(slide);

    return (
        <Wrap theme={theme} title={slide.title}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", height: "100%" }}>
                {/* Left: bullets */}
                <div>
                    {bullets.slice(0, 4).map((b, i) => (
                        <div key={i} style={{ display: "flex", gap: "0.3rem", marginBottom: "0.3rem" }}>
                            <span style={{ color: t.accent, fontSize: "0.45rem", flexShrink: 0 }}>▸</span>
                            <span style={{ fontSize: "0.42rem", color: t.text, lineHeight: 1.4 }}>{b}</span>
                        </div>
                    ))}
                </div>
                {/* Right: decorative panel */}
                <div style={{
                    background: theme === "clean" ? "#EFF6FF" : t.card, borderRadius: 6,
                    border: `1px solid ${t.accent}40`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>📈</div>
                        <div style={{ fontSize: "0.38rem", color: t.sub }}>Visual / Chart</div>
                    </div>
                </div>
            </div>
            <Footer t={t} idx={idx} total={total} company={companyName} />
        </Wrap>
    );
}

// ─── 5. Big Number ────────────────────────────────────────────────────────────
export function BigNumberPreview({ slide, theme, companyName, idx, total }: SlidePreviewProps) {
    const t = TC[theme];
    const bullets = getBullets(slide);
    const num = bullets[0] || "0";
    const label = bullets[1] || slide.title;
    const sub = bullets[2] || "";

    return (
        <Wrap theme={theme} isSpecial specialBg={theme === "dark" ? "#0D1117" : theme === "bold" ? "#1E1B4B" : "#EFF6FF"}>
            {/* top bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: t.accent }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 900, color: t.accent, lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, color: t.text, marginTop: "0.4rem", textAlign: "center" }}>{label}</div>
                {sub && <div style={{ fontSize: "0.4rem", color: t.sub, marginTop: "0.25rem" }}>{sub}</div>}
            </div>
            <Footer t={t} idx={idx} total={total} company={companyName} />
        </Wrap>
    );
}

// ─── 6. Comparison ───────────────────────────────────────────────────────────
export function ComparisonPreview({ slide, theme, companyName, idx, total }: SlidePreviewProps) {
    const t = TC[theme];
    const bullets = getBullets(slide);
    const rows = bullets.slice(0, 4).map(b => {
        const [before, after] = b.split("|").map(s => s.trim());
        return { before: before || b, after: after || "" };
    });

    return (
        <Wrap theme={theme} title={slide.title}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.3rem" }}>
                <div style={{ background: "#EF444420", borderRadius: 4, padding: "0.2rem 0.4rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.42rem", fontWeight: 700, color: "#EF4444" }}>BEFORE</span>
                </div>
                <div style={{ background: "#16A34A20", borderRadius: 4, padding: "0.2rem 0.4rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.42rem", fontWeight: 700, color: "#16A34A" }}>AFTER</span>
                </div>
            </div>
            {rows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.25rem" }}>
                    <div style={{ background: t.card, borderRadius: 4, padding: "0.25rem 0.4rem", border: `1px solid ${t.border}` }}>
                        <span style={{ fontSize: "0.38rem", color: "#EF4444" }}>✗ </span>
                        <span style={{ fontSize: "0.38rem", color: t.text }}>{row.before}</span>
                    </div>
                    <div style={{ background: t.card, borderRadius: 4, padding: "0.25rem 0.4rem", border: `1px solid ${t.border}` }}>
                        <span style={{ fontSize: "0.38rem", color: "#16A34A" }}>✓ </span>
                        <span style={{ fontSize: "0.38rem", color: t.text }}>{row.after || "—"}</span>
                    </div>
                </div>
            ))}
            <Footer t={t} idx={idx} total={total} company={companyName} />
        </Wrap>
    );
}

// ─── 7. Process Steps ────────────────────────────────────────────────────────
export function ProcessStepsPreview({ slide, theme, companyName, idx, total }: SlidePreviewProps) {
    const t = TC[theme];
    const bullets = getBullets(slide);
    const steps = bullets.slice(0, 5);

    return (
        <Wrap theme={theme} title={slide.title}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {steps.map((s, i) => (
                    <React.Fragment key={i}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 55 }}>
                            <div style={{
                                width: 22, height: 22, borderRadius: "50%", background: t.accent,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.5rem", fontWeight: 800, color: theme === "clean" ? "#fff" : "#000",
                            }}>
                                {i + 1}
                            </div>
                            <span style={{ fontSize: "0.38rem", color: t.text, marginTop: "0.3rem", textAlign: "center", lineHeight: 1.3 }}>{s}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ color: t.accent, fontSize: "0.6rem", marginBottom: "1rem" }}>→</div>
                        )}
                    </React.Fragment>
                ))}
            </div>
            <Footer t={t} idx={idx} total={total} company={companyName} />
        </Wrap>
    );
}

// ─── 8. Quote Highlight ───────────────────────────────────────────────────────
export function QuotePreview({ slide, theme, companyName, idx, total }: SlidePreviewProps) {
    const t = TC[theme];
    const bullets = getBullets(slide);
    const quoteText = bullets[0] || slide.title;
    const attribution = bullets[1] || "";

    return (
        <Wrap theme={theme} isSpecial specialBg={theme === "clean" ? "#EFF6FF" : t.card}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: t.accent }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "1rem" }}>
                {/* Decorative quote mark */}
                <div style={{ fontSize: "2rem", color: t.accent, lineHeight: 0.8, marginBottom: "0.5rem", fontFamily: "Georgia, serif" }}>"</div>
                <p style={{ fontSize: "0.55rem", color: t.text, textAlign: "center", lineHeight: 1.6, fontStyle: "italic", maxWidth: "80%" }}>
                    {quoteText.replace(/^["']|["']$/g, "")}
                </p>
                {attribution && (
                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <div style={{ width: 20, height: 1, background: t.accent }} />
                        <span style={{ fontSize: "0.4rem", color: t.accent, fontWeight: 600 }}>{attribution}</span>
                    </div>
                )}
            </div>
            <Footer t={t} idx={idx} total={total} company={companyName} />
        </Wrap>
    );
}

// ─── Title slide ─────────────────────────────────────────────────────────────
export function TitleSlidePreview({ slide, theme, companyName, idx, total }: SlidePreviewProps) {
    const t = TC[theme];
    const titleBg = theme === "clean" ? "#1D4ED8" : theme === "bold" ? "#4F1D96" : "#0D1117";
    const bullets = getBullets(slide);
    return (
        <div style={{
            width: "100%", aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", position: "relative",
            background: titleBg, border: `1px solid ${t.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{ width: 40, height: 3, background: t.accent, borderRadius: 2, marginBottom: "0.75rem" }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2, marginBottom: "0.4rem", textAlign: "center", padding: "0 1rem" }}>{slide.title}</h2>
            <p style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.6)" }}>{companyName}</p>
            {bullets[0] && <p style={{ fontSize: "0.45rem", color: "rgba(255,255,255,0.5)", marginTop: "0.3rem", fontStyle: "italic" }}>{bullets[0]}</p>}
            <Footer t={{ ...t, sub: "rgba(255,255,255,0.4)" }} idx={idx} total={total} company={companyName} />
        </div>
    );
}

// ─── Section / CTA slide ─────────────────────────────────────────────────────
export function SectionSlidePreview({ slide, theme, companyName, idx, total, isCta }: SlidePreviewProps & { isCta?: boolean }) {
    const t = TC[theme];
    const sectionBg = theme === "dark" ? "#161B22" : theme === "bold" ? "#2D2B69" : "#EFF6FF";
    const bullets = getBullets(slide);
    return (
        <div style={{
            width: "100%", aspectRatio: "16/9", borderRadius: 8, overflow: "hidden", position: "relative",
            background: sectionBg, border: `1px solid ${t.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: t.accent }} />
            <div style={{ fontSize: "0.42rem", textTransform: "uppercase", letterSpacing: "0.1em", color: t.accent, marginBottom: "0.4rem", fontWeight: 700 }}>
                {isCta ? "CLOSING" : "CHAPTER"}
            </div>
            <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: t.text, lineHeight: 1.3, textAlign: "center", padding: "0 1rem" }}>{slide.title}</h2>
            {bullets[0] && <p style={{ fontSize: "0.45rem", color: t.sub, marginTop: "0.4rem" }}>{bullets[0]}</p>}
            <Footer t={t} idx={idx} total={total} company={companyName} />
        </div>
    );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────
export interface SlideData {
    index: number;
    title: string;
    type: "title" | "section" | "content" | "chart" | "cta";
    template: TemplateId;
    suggestedContent: string;
    userContent: string;
    enhancedBullets: string[];
    speakerNote: string;
    isEnhanced: boolean;
}

interface SlidePreviewProps {
    slide: SlideData;
    theme: Theme;
    companyName: string;
    idx: number;
    total: number;
}

export function SlidePreview(props: SlidePreviewProps) {
    const { slide, theme } = props;
    if (slide.type === "title") return <TitleSlidePreview {...props} />;
    if (slide.type === "section") return <SectionSlidePreview {...props} />;
    if (slide.type === "cta") return <SectionSlidePreview {...props} isCta />;
    switch (slide.template) {
        case "stats_grid": return <StatsGridPreview    {...props} />;
        case "timeline": return <TimelinePreview     {...props} />;
        case "two_column": return <TwoColumnPreview    {...props} />;
        case "big_number": return <BigNumberPreview    {...props} />;
        case "comparison": return <ComparisonPreview   {...props} />;
        case "process_steps": return <ProcessStepsPreview {...props} />;
        case "quote": return <QuotePreview        {...props} />;
        default: return <BulletsPreview      {...props} />;
    }
}

// ─── Template mini-thumbnail for the picker ───────────────────────────────────
export function TemplateThumbnail({ tpl, active, accent }: { tpl: TemplateInfo; active: boolean; accent: string }) {
    return (
        <div style={{
            border: `2px solid ${active ? accent : "var(--border)"}`,
            borderRadius: 8, padding: "0.5rem 0.625rem", cursor: "pointer",
            background: active ? `${accent}10` : "var(--card)", textAlign: "center",
            transition: "border-color 0.15s, background 0.15s",
        }}>
            <div style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>{tpl.icon}</div>
            <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--foreground)" }}>{tpl.label}</div>
            <div style={{ fontSize: "0.52rem", color: "var(--muted-foreground)", lineHeight: 1.3, marginTop: "0.1rem" }}>{tpl.desc}</div>
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getBullets(slide: SlideData): string[] {
    if (slide.enhancedBullets.length > 0) return slide.enhancedBullets;
    if (slide.userContent) return slide.userContent.split("\n").filter(Boolean);
    if (slide.suggestedContent) return slide.suggestedContent.split(".").filter(Boolean).map(s => s.trim());
    return [];
}

function Footer({ t, idx, total, company }: { t: { sub: string }; idx: number; total: number; company: string }) {
    return (
        <>
            <span style={{ position: "absolute", bottom: 6, left: 10, fontSize: "0.42rem", color: t.sub, opacity: 0.7 }}>{idx + 1} / {total}</span>
            <span style={{ position: "absolute", bottom: 6, right: 10, fontSize: "0.42rem", color: t.sub, opacity: 0.7 }}>{company}</span>
        </>
    );
}
