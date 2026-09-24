"use client";

import { useState, useEffect, useRef } from "react";
import {
  Globe2, TrendingUp, TrendingDown, Zap, AlertCircle, BarChart3,
  Newspaper, Film, Layers, ChevronRight, Loader2, Copy, CheckCheck,
  Download, RefreshCw, Eye, Minus, ArrowUpRight, ArrowDownRight,
  Activity, DollarSign, Shield, Flame, Clock, Target, BookOpen,
  Lightbulb, Star, Share2, FileText
} from "lucide-react";
// Removed html2canvas import, using dynamic html-to-image for better CSS v4 support
import JSZip from 'jszip';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NewsItem {
  id: string;
  headline: string;
  region: string;
  category: string;
  date: string;
  impact_level: "low" | "medium" | "high" | "extreme";
  markets_affected: string[];
  source: string;
  summary?: string;
  finance_concepts: { concept: string; explanation: string; metric: string }[];
}

interface InfographicData {
  title: string;
  subtitle: string;
  impact_score: number;
  timeline: string;
  assets: { name: string; direction: string; magnitude: string; reason: string }[];
  concepts: { name: string; simple_definition: string; why_it_matters: string }[];
  key_stat: { number: string; label: string };
  historical_parallel: { event: string; outcome: string; year: number };
  investor_actions: string[];
  bottom_line: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const IMPACT_CONFIG = {
  extreme: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "EXTREME", icon: Flame },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "HIGH", icon: AlertCircle },
  medium: { color: "#eab308", bg: "rgba(234,179,8,0.12)", label: "MEDIUM", icon: Activity },
  low: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "LOW", icon: TrendingUp },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  trade_war: DollarSign,
  war_conflict: Shield,
  sanctions: Globe2,
  central_bank: BarChart3,
  election: Target,
  default: Activity,
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const IMPACT_WASH = {
  extreme: { ink: "var(--rose-ink)", bg: "var(--rose-bg)", border: "var(--rose)" },
  high: { ink: "var(--rose-ink)", bg: "var(--rose-bg)", border: "var(--rose)" },
  medium: { ink: "var(--butter-ink)", bg: "var(--butter-bg)", border: "var(--amber)" },
  low: { ink: "var(--sage-ink)", bg: "var(--sage-bg)", border: "var(--sage)" },
};

function ImpactBadge({ level }: { level: string }) {
  const cfg = IMPACT_CONFIG[level as keyof typeof IMPACT_CONFIG] || IMPACT_CONFIG.medium;
  const wash = IMPACT_WASH[level as keyof typeof IMPACT_WASH] || IMPACT_WASH.medium;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
      style={{ color: wash.ink, background: wash.bg, border: `1px solid ${wash.border}` }}
    >
      <Icon size={9} />
      {cfg.label}
    </span>
  );
}

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === "up") return <ArrowUpRight size={14} className="text-emerald-400" />;
  if (direction === "down") return <ArrowDownRight size={14} className="text-red-400" />;
  return <Minus size={14} className="text-yellow-400" />;
}

// ─── Carousel Infographic Template ────────────────────────────────────────────
function CarouselTemplate({ data, news }: { data: InfographicData; news: NewsItem }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const hiddenSlidesRef = useRef<HTMLDivElement>(null);
  const cfg = IMPACT_CONFIG[news.impact_level] || IMPACT_CONFIG.medium;

  const downloadAllZip = async () => {
    if (!hiddenSlidesRef.current) return;
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const slideNodes = hiddenSlidesRef.current.children;
      const htmlToImage = await import('html-to-image');
      
      for (let i = 0; i < slideNodes.length; i++) {
        const dataUrl = await htmlToImage.toPng(slideNodes[i] as HTMLElement, { 
          backgroundColor: "#000",
          pixelRatio: 2, // High resolution for ZIP
          fontEmbedCSS: '', // Bypass cross-origin CSSRules SecurityError
        });
        zip.file(`slide_${i + 1}.png`, dataUrl.split(",")[1], { base64: true });
      }
      const archive = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(archive);
      link.download = `GeoFinance_Carousel_${news?.id || Date.now()}.zip`;
      link.click();
    } catch (err: any) {
      console.error("Failed to generate ZIP", err);
      alert(`Failed to save ZIP: ${err?.message || "Unknown error"}`);
    } finally {
      setDownloadingZip(false);
    }
  };

  const downloadAllPdf = async () => {
    if (!hiddenSlidesRef.current) return;
    setDownloadingPdf(true);
    try {
      // Robust jsPDF & htmlToImage dynamic imports
      const [jspdfModule, htmlToImage] = await Promise.all([
        import('jspdf'),
        import('html-to-image')
      ]);
      let JsPdfClass = (jspdfModule as any).jsPDF || (jspdfModule.default && (jspdfModule.default as any).jsPDF) || jspdfModule.default;
      
      if (!JsPdfClass) throw new Error("Could not initialize JS PDF. Module missing.");

      const slideNodes = hiddenSlidesRef.current.children;
      const pdf = new JsPdfClass({
        orientation: "portrait",
        unit: "pt", 
        format: [810, 1012.5], 
        compress: true 
      });

      for (let i = 0; i < slideNodes.length; i++) {
        // html-to-image natively supports oklab/oklch via SVG foreignObject, avoiding parsing crashes
        const imgData = await htmlToImage.toJpeg(slideNodes[i] as HTMLElement, { 
          quality: 0.95, 
          backgroundColor: "#000",
          pixelRatio: 1, // Keep standard 1x scale for PDF to avoid memory blowing up
          fontEmbedCSS: '', // Bypass NextJS Turbopack cross-origin CSSRules SecurityError
        });
        
        if (i > 0) pdf.addPage([810, 1012.5], "portrait");
        pdf.addImage(imgData, "JPEG", 0, 0, 810, 1012.5);
      }
      
      pdf.save(`GeoFinance_Carousel_${news?.id || Date.now()}.pdf`);
    } catch (err: any) {
      console.error("Failed to generate PDF", err);
      // Detailed error tracking for debugging color variables or missing modules
      alert(`Failed to save PDF: ${err?.message || "Unknown error"}. Please try again or use ZIP.`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const slides = [
    // Slide 1 — Title/Hook
    {
      label: "Title Hook",
      content: (
        <div className="flex flex-col h-full justify-between p-8" style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
            <Globe2 size={14} />
            <span>Geo · Finance · Intelligence</span>
          </div>
          <div>
            <div className="text-5xl font-black text-white leading-tight mb-4">{data.title}</div>
            <div className="text-xl font-semibold mb-6" style={{ color: cfg.color }}>{data.subtitle}</div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full font-bold text-sm text-black" style={{ background: cfg.color }}>
                Impact Score: {data.impact_score}/10
              </div>
              <div className="text-white/60 text-sm">Timeline: {data.timeline}</div>
            </div>
          </div>
          <div className="text-white/30 text-xs">{news.source} · {news.date} · Swipe for analysis →</div>
        </div>
      ),
    },
    // Slide 2 — The Event
    {
      label: "The Event",
      content: (
        <div className="flex flex-col h-full p-8" style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)" }}>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">02 · The Event</div>
          <div className="text-2xl font-black text-white mb-6 leading-tight">{news.headline}</div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-white/40 text-xs mb-1">📍 Region</div>
              <div className="text-white font-semibold text-sm">{news.region}</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-white/40 text-xs mb-1">📅 Date</div>
              <div className="text-white font-semibold text-sm">{news.date}</div>
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-2">Markets Affected</div>
            <div className="flex flex-wrap gap-2">
              {news.markets_affected.map(m => (
                <span key={m} className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    // Slide 3 — Key Stat
    {
      label: "Key Stat",
      content: (
        <div className="flex flex-col h-full items-center justify-center p-8 text-center" style={{ background: `linear-gradient(135deg, ${cfg.color}22, #0a0a0a)` }}>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-8">03 · The Number</div>
          <div className="text-7xl font-black mb-4" style={{ color: cfg.color, textShadow: `0 0 40px ${cfg.color}60` }}>
            {data.key_stat?.number ?? "—"}
          </div>
          <div className="text-xl font-semibold text-white/80 max-w-xs">{data.key_stat?.label ?? ""}</div>
          <div className="mt-8 px-6 py-3 rounded-full text-sm font-bold text-white" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            ⚡ This is what changes everything
          </div>
        </div>
      ),
    },
    // Slide 4 — Finance Concepts
    {
      label: "Finance Concepts",
      content: (
        <div className="flex flex-col h-full p-8" style={{ background: "linear-gradient(135deg, #0d1b2a, #1b2b3a)" }}>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">04 · Finance Decoded</div>
          <div className="text-xl font-black text-white mb-6">What This Actually Means</div>
          <div className="space-y-4 flex-1">
            {(data.concepts ?? []).slice(0, 3).map((c, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black" style={{ background: cfg.color }}>{i + 1}</div>
                  <div className="font-bold text-sm text-white">{c.name}</div>
                </div>
                <div className="text-white/60 text-xs leading-relaxed ml-8">{c.simple_definition}</div>
                <div className="text-xs mt-1 ml-8 font-semibold" style={{ color: cfg.color }}>→ {c.why_it_matters}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Slide 5 — Asset Impact Map
    {
      label: "Asset Impact",
      content: (
        <div className="flex flex-col h-full p-8" style={{ background: "linear-gradient(135deg, #0a0a0a, #1a1a2e)" }}>
          <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">05 · Market Impact</div>
          <div className="text-xl font-black text-white mb-6">Where Money Flows</div>
          <div className="space-y-3 flex-1">
            {(data.assets ?? []).slice(0, 5).map((asset, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <DirectionIcon direction={asset.direction} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{asset.name}</span>
                    <span className="font-black text-sm" style={{ color: asset.direction === "up" ? "#34d399" : asset.direction === "down" ? "#f87171" : "#fbbf24" }}>{asset.magnitude}</span>
                  </div>
                  <div className="text-white/40 text-[11px] mt-0.5">{asset.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Slide 6 — Historical Parallel
    {
      label: "History Lesson",
      content: (
        <div className="flex flex-col h-full p-8" style={{ background: "linear-gradient(135deg, #1a0a00, #2d1b00)" }}>
          <div className="text-xs font-bold uppercase tracking-widest text-amber-500/60 mb-4">06 · History Rhymes</div>
          <div className="text-xl font-black text-white mb-2">Last Time This Happened...</div>
          <div className="text-amber-400/80 font-semibold text-lg mb-6">{data.historical_parallel?.event} ({data.historical_parallel?.year})</div>
          <div className="flex-1 p-6 rounded-2xl flex flex-col justify-center" style={{ background: "rgba(251,191,36,0.08)", border: "2px solid rgba(251,191,36,0.20)" }}>
            <div className="text-3xl mb-3">📜</div>
            <div className="text-white text-lg font-semibold leading-relaxed">{data.historical_parallel?.outcome}</div>
          </div>
          <div className="mt-4 text-amber-400/60 text-xs font-semibold">History doesn&apos;t repeat — but it rhymes 🎯</div>
        </div>
      ),
    },
    // Slide 7 — Action Plan
    {
      label: "Action Plan",
      content: (
        <div className="flex flex-col h-full p-8" style={{ background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" }}>
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400/60 mb-4">07 · Smart Money Moves</div>
          <div className="text-xl font-black text-white mb-6">Your Action Plan</div>
          <div className="space-y-4 flex-1">
            {(data.investor_actions ?? []).map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm text-black shrink-0" style={{ background: "#06b6d4" }}>{i + 1}</div>
                <div className="text-white/90 text-sm leading-relaxed pt-0.5">{action}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-cyan-400/60 text-xs">Not financial advice · Do your own research</div>
        </div>
      ),
    },
    // Slide 8 — Bottom Line / CTA
    {
      label: "Bottom Line",
      content: (
        <div className="flex flex-col h-full items-center justify-between p-8 text-center" style={{ background: "linear-gradient(135deg, #000000, #130a2e)" }}>
          <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">08 · The Bottom Line</div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-5xl mb-6">💡</div>
            <div className="text-2xl font-black text-white leading-tight max-w-sm mb-8">&ldquo;{data.bottom_line}&rdquo;</div>
            <div className="px-6 py-3 rounded-full font-black text-black text-sm" style={{ background: cfg.color }}>
              Follow for Daily Geo-Finance Breakdowns
            </div>
          </div>
          <div className="text-white/20 text-xs">Save this · Share this · Stay ahead</div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 relative">
      {/* Hidden container to render all slides for html2canvas */}
      <div style={{ position: "absolute", top: -9999, left: -9999, width: 1080, pointerEvents: "none" }}>
        <div ref={hiddenSlidesRef}>
          {slides.map((s, i) => (
            <div key={i} style={{ width: 1080, height: 1350, fontSize: 2.25 }}>
              {s.content}
            </div>
          ))}
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={activeSlide === i
              ? { background: cfg.color, color: "var(--background)" }
              : { background: "var(--muted)", color: "var(--muted-foreground)" }}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* Active Slide Preview */}
      <div className="rounded-2xl overflow-hidden" style={{ height: 480, border: "1px solid var(--border)" }}>
        {slides[activeSlide].content}
      </div>

      {/* Navigation Arrows */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
          disabled={activeSlide === 0}
          className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-30 transition-all"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >← Prev</button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setActiveSlide(i)} className="w-2 h-2 rounded-full transition-all" style={{ background: activeSlide === i ? cfg.color : "var(--border)" }} />
          ))}
        </div>
        <button
          onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
          disabled={activeSlide === slides.length - 1}
          className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-30 transition-all"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >Next →</button>
      </div>
      <div className="pt-2 grid grid-cols-2 gap-3">
        <button
          onClick={downloadAllZip}
          disabled={downloadingZip || downloadingPdf}
          className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed"
          style={downloadingZip
            ? { background: "var(--muted)", color: "var(--muted-foreground)" }
            : { background: "var(--primary)", color: "var(--background)" }}
        >
          {downloadingZip ? <><Loader2 size={16} className="animate-spin" /> ZIP...</> : <><Download size={16} /> Save as .ZIP</>}
        </button>
        <button
          onClick={downloadAllPdf}
          disabled={downloadingZip || downloadingPdf}
          className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed"
          style={downloadingPdf
            ? { background: "var(--muted)", color: "var(--muted-foreground)" }
            : { background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
        >
          {downloadingPdf ? <><Loader2 size={16} className="animate-spin" /> PDF...</> : <><Download size={16} /> Save as .PDF</>}
        </button>
      </div>
    </div>
  );
}

// ─── Reel Script Display ───────────────────────────────────────────────────────
function ReelScriptDisplay({ content, news }: { content: string; news: NewsItem | null }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse scenes from content
  const scenes = content.split(/SCENE \d+/i).filter(s => s.trim()).map((s, i) => ({
    number: i + 1,
    content: s.trim(),
  }));

  const sceneColors = [
    { ink: "var(--sky-ink)", bg: "var(--sky-bg)" },
    { ink: "var(--lavender-ink)", bg: "var(--lavender-bg)" },
    { ink: "var(--rose-ink)", bg: "var(--rose-bg)" },
    { ink: "var(--butter-ink)", bg: "var(--butter-bg)" },
    { ink: "var(--sage-ink)", bg: "var(--sage-bg)" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film size={16} style={{ color: "var(--lavender-ink)" }} />
          <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>Reel Script</span>
          {news && <ImpactBadge level={news.impact_level} />}
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: copied ? "var(--sage-ink)" : "var(--muted-foreground)" }}>
          {copied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy Script</>}
        </button>
      </div>

      {scenes.length > 0 ? (
        <div className="space-y-3">
          {scenes.map((scene, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: sceneColors[i % sceneColors.length].bg }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black" style={{ background: sceneColors[i % sceneColors.length].ink, color: "var(--background)" }}>
                  {scene.number}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sceneColors[i % sceneColors.length].ink }}>Scene {scene.number}</span>
              </div>
              <div className="p-4">
                <pre className="text-sm font-sans whitespace-pre-wrap leading-relaxed" style={{ color: "var(--foreground)" }}>{scene.content}</pre>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          <pre className="text-sm font-sans whitespace-pre-wrap leading-relaxed" style={{ color: "var(--foreground)" }}>{content}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function GeoFinancePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [infographicData, setInfographicData] = useState<InfographicData | null>(null);
  const [outputFormat, setOutputFormat] = useState<"carousel" | "reel" | "post">("carousel");
  const [activeTab, setActiveTab] = useState<"news" | "template" | "concepts">("news");
  const [error, setError] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const outputRef = useRef<HTMLDivElement>(null);

  const scanNews = async () => {
    setScanning(true);
    setError("");
    try {
      const res = await fetch("/api/antigravity/geo-finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNews(data.news || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to scan news");
    } finally {
      setScanning(false);
    }
  };

  const generateTemplate = async () => {
    if (!selectedNews && !customTopic.trim()) return;
    setLoading(true);
    setError("");
    setGeneratedContent("");
    setInfographicData(null);
    try {
      // Generate both template content and infographic data in parallel
      const [templateRes, infoRes] = await Promise.all([
        fetch("/api/antigravity/geo-finance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate_template",
            newsId: selectedNews?.id,
            customTopic: customTopic || undefined,
            format: outputFormat,
          }),
        }),
        fetch("/api/antigravity/geo-finance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate_infographic_data",
            newsId: selectedNews?.id,
          }),
        }),
      ]);

      const templateData = await templateRes.json();
      const infoData = await infoRes.json();

      if (!templateRes.ok) throw new Error(templateData.error);
      setGeneratedContent(templateData.content || "");
      if (infoData.infographicData) setInfographicData(infoData.infographicData);

      setActiveTab("template");
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanNews();
  }, []);

  const filteredNews = filterCategory === "all"
    ? news
    : news.filter(n => n.category === filterCategory);

  const categories = ["all", ...Array.from(new Set(news.map(n => n.category)))];

  const impactOrder = { extreme: 0, high: 1, medium: 2, low: 3 };
  const sortedNews = [...filteredNews].sort((a, b) =>
    (impactOrder[a.impact_level as keyof typeof impactOrder] ?? 3) -
    (impactOrder[b.impact_level as keyof typeof impactOrder] ?? 3)
  );

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-8" style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)"
      }}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe2 size={20} style={{ color: "var(--lavender-ink)" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--lavender-ink)" }}>Geopolitical Finance Intelligence</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ color: "var(--foreground)" }}>
              Global Events → <span style={{ color: "var(--lavender-ink)" }}>Finance Impact</span>
            </h1>
            <p className="text-sm max-w-xl" style={{ color: "var(--muted-foreground)" }}>
              Scan breaking geopolitical events, decode the financial connections, and generate viral carousel & reel templates that educate your audience.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "var(--sage-bg)", border: "1px solid var(--border)" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--sage-ink)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--sage-ink)" }}>{news.length} Events Tracked</span>
            </div>
            <button
              onClick={scanNews}
              disabled={scanning}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: "var(--primary)", color: "var(--background)" }}
            >
              {scanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {scanning ? "Scanning..." : "Refresh Feed"}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: "Extreme Impact", value: news.filter(n => n.impact_level === "extreme").length, ink: "var(--rose-ink)", bg: "var(--rose-bg)" },
            { label: "High Impact", value: news.filter(n => n.impact_level === "high").length, ink: "var(--butter-ink)", bg: "var(--butter-bg)" },
            { label: "Markets Tracked", value: [...new Set(news.flatMap(n => n.markets_affected))].length, ink: "var(--lavender-ink)", bg: "var(--lavender-bg)" },
            { label: "Regions", value: [...new Set(news.map(n => n.region))].length, ink: "var(--sky-ink)", bg: "var(--sky-bg)" },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-xl" style={{ background: stat.bg, border: "1px solid var(--border)" }}>
              <div className="text-2xl font-black" style={{ color: stat.ink }}>{stat.value}</div>
              <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: News Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Newspaper size={16} style={{ color: "var(--lavender-ink)" }} />
              Global News Feed
            </h2>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{sortedNews.length} events</div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
                style={filterCategory === cat
                  ? { background: "var(--primary)", color: "var(--background)" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* News Cards */}
          <div className="space-y-3">
            {scanning && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3" style={{ color: "var(--muted-foreground)" }}>
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Analyzing coverage...</span>
                </div>
              </div>
            )}
            {!scanning && sortedNews.map(item => {
              const CategoryIcon = CATEGORY_ICONS[item.category] || Activity;
              const isSelected = selectedNews?.id === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedNews(isSelected ? null : item)}
                  className="w-full text-left p-4 rounded-xl transition-all hover:scale-[1.01]"
                  style={{
                    background: isSelected ? "var(--sky-bg)" : "var(--card)",
                    border: isSelected
                      ? "1.5px solid var(--sky)"
                      : "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--muted)" }}>
                        <CategoryIcon size={13} style={{ color: "var(--muted-foreground)" }} />
                      </div>
                      <ImpactBadge level={item.impact_level} />
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: "var(--muted-foreground)" }}>{item.source}</span>
                  </div>

                  <div className="text-sm font-semibold leading-snug mb-2" style={{ color: "var(--foreground)" }}>{item.headline}</div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <Globe2 size={10} />
                      <span>{item.region}</span>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold" style={{ color: "var(--sky-ink)" }}>✓ Selected</span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.finance_concepts.map((c, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md font-semibold" style={{ background: "var(--lavender-bg)", color: "var(--lavender-ink)" }}>
                          {c.concept}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.summary && (
                    <div className="mt-4 p-3 rounded-xl border transition-colors group cursor-pointer"
                      style={{
                        background: isSelected ? "var(--card)" : "var(--muted)",
                        borderColor: "var(--border)"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(item.summary || "");
                        alert("Summary copied to clipboard!");
                      }}>
                       <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isSelected ? "var(--sky-ink)" : "var(--muted-foreground)" }}>
                            Quick Summary (Click to Copy)
                          </span>
                          <Copy size={12} className="opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: isSelected ? "var(--sky-ink)" : "var(--muted-foreground)" }} />
                       </div>
                       <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>
                         {item.summary}
                       </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Topic Input */}
          <div className="p-4 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>Or Enter Custom Topic</div>
            <input
              type="text"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="e.g. US tariffs impact on semiconductor stocks..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              style={{ color: "var(--foreground)" }}
            />
          </div>
        </div>

        {/* Right: Generator + Output */}
        <div className="lg:col-span-3 space-y-4" ref={outputRef}>
          {/* Format Selector + Generate */}
          <div className="p-5 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" }}>
            <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Zap size={16} style={{ color: "var(--butter-ink)" }} />
              Generate Content Template
            </h3>

            {/* Format Toggle */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <button
                onClick={() => setOutputFormat("carousel")}
                className="flex-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all"
                style={outputFormat === "carousel"
                  ? { background: "var(--primary)", color: "var(--background)" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                <Layers size={14} /> Carousel
              </button>
              <button
                onClick={() => setOutputFormat("reel")}
                className="flex-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all"
                style={outputFormat === "reel"
                  ? { background: "var(--primary)", color: "var(--background)" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                <Film size={14} /> Reel Script
              </button>
              <button
                onClick={() => setOutputFormat("post")}
                className="flex-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all"
                style={outputFormat === "post"
                  ? { background: "var(--primary)", color: "var(--background)" }
                  : { background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                <FileText size={14} /> Deep-Dive Post
              </button>
            </div>

            {/* Selection Summary */}
            {selectedNews ? (
              <div className="flex items-start gap-3 p-3 rounded-xl mb-4" style={{ background: "var(--lavender-bg)", border: "1px solid var(--border)" }}>
                <Eye size={14} className="shrink-0 mt-0.5" style={{ color: "var(--lavender-ink)" }} />
                <div>
                  <div className="text-xs font-bold mb-0.5" style={{ color: "var(--lavender-ink)" }}>Selected Event</div>
                  <div className="text-sm leading-snug" style={{ color: "var(--foreground)" }}>{selectedNews.headline}</div>
                </div>
              </div>
            ) : customTopic.trim() ? (
              <div className="flex items-start gap-3 p-3 rounded-xl mb-4" style={{ background: "var(--lavender-bg)", border: "1px solid var(--border)" }}>
                <BookOpen size={14} className="shrink-0 mt-0.5" style={{ color: "var(--lavender-ink)" }} />
                <div>
                  <div className="text-xs font-bold mb-0.5" style={{ color: "var(--lavender-ink)" }}>Custom Topic</div>
                  <div className="text-sm" style={{ color: "var(--foreground)" }}>{customTopic}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                <ChevronRight size={14} />
                Select a news event from the feed or enter a custom topic
              </div>
            )}

            <button
              onClick={generateTemplate}
              disabled={loading || (!selectedNews && !customTopic.trim())}
              className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={loading
                ? { background: "var(--muted)", color: "var(--muted-foreground)" }
                : { background: "var(--primary)", color: "var(--background)" }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Generating…</>
              ) : (
                <><Zap size={16} /> Generate {outputFormat === "carousel" ? "Carousel" : outputFormat === "reel" ? "Reel" : "Deep-Dive Post"}</>
              )}
            </button>

            {error && (
              <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "var(--rose-bg)", border: "1px solid var(--rose)", color: "var(--rose-ink)" }}>{error}</div>
            )}
          </div>

          {/* Output Tabs */}
          {(generatedContent || infographicData) && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
              {/* Tab Bar */}
              <div className="flex border-b" style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
                {[
                  { id: "template", label: outputFormat === "carousel" ? "Preview Slides" : outputFormat === "reel" ? "Reel Script" : "Deep-Dive Post", icon: outputFormat === "carousel" ? Layers : outputFormat === "reel" ? Film : FileText },
                  { id: "concepts", label: "Finance Concepts", icon: Lightbulb },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className="flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all"
                    style={activeTab === tab.id
                      ? { color: "var(--lavender-ink)", borderBottom: "2px solid var(--lavender-ink)", background: "var(--card)" }
                      : { color: "var(--muted-foreground)" }}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5" style={{ background: "var(--card)" }}>
                {activeTab === "template" && infographicData && (
                  <div>
                    {outputFormat === "carousel" ? (
                      <CarouselTemplate
                        data={infographicData}
                        news={selectedNews || news[0]}
                      />
                    ) : (
                      <ReelScriptDisplay content={generatedContent} news={selectedNews} />
                    )}
                  </div>
                )}

                {activeTab === "concepts" && infographicData && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                      <BookOpen size={14} style={{ color: "var(--lavender-ink)" }} />
                      Finance Concepts Deep Dive
                    </h3>

                    {/* Key Stat */}
                    <div className="p-5 rounded-xl text-center" style={{ background: "var(--lavender-bg)", border: "1px solid var(--border)" }}>
                      <div className="text-4xl font-black mb-1" style={{ color: "var(--lavender-ink)" }}>{infographicData.key_stat?.number ?? "—"}</div>
                      <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{infographicData.key_stat?.label ?? ""}</div>
                    </div>

                    {/* Bottom Line */}
                    <div className="p-4 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={13} style={{ color: "var(--butter-ink)" }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--butter-ink)" }}>Bottom Line</span>
                      </div>
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{infographicData.bottom_line}</p>
                    </div>

                    {/* Concepts Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {(infographicData.concepts ?? selectedNews?.finance_concepts ?? []).map((c: { name?: string; concept?: string; simple_definition?: string; explanation?: string; why_it_matters?: string; metric?: string }, i: number) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ background: "var(--primary)", color: "var(--background)" }}>{i + 1}</div>
                            <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{c.name ?? c.concept}</div>
                          </div>
                          <div className="text-xs leading-relaxed ml-7" style={{ color: "var(--muted-foreground)" }}>{c.simple_definition ?? c.explanation}</div>
                          {(c.why_it_matters || c.metric) && (
                            <div className="text-xs font-semibold ml-7 mt-1" style={{ color: "var(--lavender-ink)" }}>{c.why_it_matters ?? c.metric}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Historical Parallel */}
                    {infographicData.historical_parallel && (
                      <div className="p-4 rounded-xl" style={{ background: "var(--butter-bg)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock size={13} style={{ color: "var(--butter-ink)" }} />
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--butter-ink)" }}>Historical Parallel — {infographicData.historical_parallel.year}</span>
                        </div>
                        <div className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>{infographicData.historical_parallel.event}</div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{infographicData.historical_parallel.outcome}</div>
                      </div>
                    )}

                    {/* Investor Actions */}
                    {infographicData.investor_actions?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Share2 size={13} style={{ color: "var(--sage-ink)" }} />
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--sage-ink)" }}>Investor Action Plan</span>
                        </div>
                        <div className="space-y-2">
                          {infographicData.investor_actions.map((action: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "var(--sage-bg)", border: "1px solid var(--border)" }}>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5" style={{ background: "var(--sage-ink)", color: "var(--background)" }}>{i + 1}</div>
                              <span className="text-sm" style={{ color: "var(--foreground)" }}>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!generatedContent && !infographicData && !loading && (
            <div className="p-12 rounded-2xl text-center flex flex-col items-center gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--lavender-bg)" }}>
                <Globe2 size={28} style={{ color: "var(--lavender-ink)" }} />
              </div>
              <div>
                <h3 className="font-bold mb-1" style={{ color: "var(--foreground)" }}>Select a News Event</h3>
                <p className="text-sm max-w-sm" style={{ color: "var(--muted-foreground)" }}>Pick any geopolitical event from the feed, choose your output format (carousel or reel), and hit generate.</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {["Finance Concepts", "Market Impact", "Historical Parallels", "Investor Takeaways"].map(tag => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Finance Reference Guide ── */}
      <div className="mt-8 p-6 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" }}>
        <h2 className="font-black text-lg mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <BarChart3 size={18} style={{ color: "var(--lavender-ink)" }} />
          Geopolitical Finance Concept Reference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries({
            "Trade Wars": [
              "Supply Chain Shock → Cost-push inflation surge",
              "Currency Wars → Competitive devaluation",
              "Stagflation Risk → GDP falls, prices rise",
            ],
            "Armed Conflicts": [
              "Safe Haven Flight → Gold, CHF, USD surge",
              "Energy Price Shock → Brent/WTI spikes",
              "Defense Rally → Lockheed, Raytheon outperform",
            ],
            "Sanctions": [
              "Dollar Weaponization → Accelerates de-dollarization",
              "SWIFT Exclusion → Sovereign credit stress",
              "Commodity Rerouting → Shadow markets form",
            ],
            "Central Banks": [
              "Rate Divergence → FX carry trade opportunities",
              "Yield Curve Control → Bond market distortion",
              "QE/QT Cycles → Liquidity drives risk assets",
            ],
            "Elections": [
              "Policy Risk Premium → Volatility compression",
              "Regulatory Regime Change → Sector rotation",
              "Fiscal Policy Shift → Deficit-to-GDP repricing",
            ],
            "Global Macro": [
              "Correlation Breakdown → Diversification fails",
              "Business Cycle Phases → Rotational playbook",
              "Inflation Regimes → Commodity vs Equity",
            ],
          }).map(([category, concepts]) => (
            <div key={category} className="p-4 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <div className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>{category}</div>
              <div className="space-y-2">
                {concepts.map((c, i) => (
                  <div key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--muted-foreground)" }}>
                    <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: "var(--lavender-ink)" }} />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
          These connections power your content — each event teaches your audience something they didn&apos;t know they needed to understand.
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-center text-xs pb-6" style={{ color: "var(--muted-foreground)" }}>
        This tool is for educational content creation only. Nothing here constitutes financial advice.
      </div>
    </div>
  );
}
