"use client";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  Loader2,
  Minus,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";

type TweetSlide = { title: string; body: string };
type ThemeId = "midnight" | "paper" | "aurora" | "sunset";
type StyleId = "editorial" | "dark-social" | "classic-tweet";

const themes: Record<ThemeId, {
  label: string;
  background: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
}> = {
  midnight: {
    label: "Midnight",
    background: "#050505",
    card: "#0b0b0b",
    text: "#f4f4f5",
    muted: "#a1a1aa",
    border: "#34343a",
    accent: "#60a5fa",
  },
  paper: {
    label: "Clean paper",
    background: "#eeeae2",
    card: "#fffdf8",
    text: "#171717",
    muted: "#737373",
    border: "#d4d0c8",
    accent: "#2563eb",
  },
  aurora: {
    label: "Aurora",
    background: "linear-gradient(135deg,#082f49 0%,#0f172a 48%,#312e81 100%)",
    card: "rgba(15,23,42,.88)",
    text: "#f8fafc",
    muted: "#cbd5e1",
    border: "rgba(125,211,252,.35)",
    accent: "#22d3ee",
  },
  sunset: {
    label: "Sunset",
    background: "linear-gradient(135deg,#431407 0%,#7f1d1d 48%,#4c1d95 100%)",
    card: "rgba(28,13,22,.86)",
    text: "#fff7ed",
    muted: "#fed7aa",
    border: "rgba(253,186,116,.38)",
    accent: "#fb923c",
  },
};

const stylePresets: Record<StyleId, {
  label: string;
  description: string;
  swatch: string;
}> = {
  editorial: {
    label: "Bold editorial",
    description: "Oversized black type on a warm paper canvas",
    swatch: "#f6f4ef",
  },
  "dark-social": {
    label: "Dark social",
    description: "High-contrast post layout inspired by X dark mode",
    swatch: "#050505",
  },
  "classic-tweet": {
    label: "Classic tweet",
    description: "Light post card with familiar social metadata",
    swatch: "#ffffff",
  },
};

const starterSlides: TweetSlide[] = [
  { title: "Turn one post into a swipeable story", body: "Paste your post, article notes, or thread in the editor. The generator turns the source into a connected narrative with a strong opening hook, clear supporting points, and a final takeaway. Each slide stays editable, so you can tighten the language, add context, and shape the story before publishing it to your audience." },
  { title: "Your source stays in control", body: "Names, numbers, dates, and claims should come from the text you provide. The carousel is designed to organize and clarify your thinking, not to replace your judgment. Review every slide, correct anything that needs nuance, and make sure the final sequence says exactly what you want your audience to remember." },
  { title: "Edit, preview, and export", body: "Refine the hook and body copy, choose the reference-inspired editorial, dark social, or classic tweet style, then preview every slide at square format. When the story is ready, download the current image, the complete PNG set, a ZIP archive, or a single multi-page PDF for sharing." },
];

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "YO";
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 45) || "tweet-carousel";
}

function cleanSocialText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/~~+/g, "")
    .replace(/[*_`]+/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[>•+\-]\s+/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function SlideCard({
  slide,
  index,
  total,
  name,
  handle,
  theme,
  accent,
  styleMode,
  exportMode = false,
}: {
  slide: TweetSlide;
  index: number;
  total: number;
  name: string;
  handle: string;
  theme: ThemeId;
  accent: string;
  styleMode: StyleId;
  exportMode?: boolean;
}) {
  const palette = themes[theme];
  const isEditorial = styleMode === "editorial";
  const isDarkSocial = styleMode === "dark-social";
  const isClassicTweet = styleMode === "classic-tweet";
  const canvasBackground = isDarkSocial ? "#050505" : isClassicTweet ? "#eef1f3" : "#f6f4ef";
  const canvasText = isDarkSocial ? "#f4f4f5" : isClassicTweet ? "#0f1419" : "#080808";
  const canvasMuted = isDarkSocial ? "#d4d4d8" : isClassicTweet ? "#536471" : "#252525";
  const canvasBorder = isDarkSocial ? "#2f2f33" : isClassicTweet ? "#cfd9de" : "#e6e3db";
  const displayTitle = cleanSocialText(slide.title);
  const paragraphs = slide.body.split(/\n+/).map(cleanSocialText).filter(Boolean);

  return (
    <div
      className={`relative flex h-[540px] w-[540px] shrink-0 flex-col overflow-hidden ${isClassicTweet ? "p-0" : isDarkSocial ? "p-8" : "p-7"}`}
      style={{ background: canvasBackground, color: canvasText }}
    >
      {!isClassicTweet ? <>
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-20 blur-3xl" style={{ background: accent }} />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full opacity-10 blur-3xl" style={{ background: palette.accent }} />
      </> : null}

      <div
        className={`relative flex h-full flex-col ${isEditorial ? "px-4 py-4" : isDarkSocial ? "border-0 px-5 py-5" : "border px-8 py-7"}`}
        style={{
          background: isEditorial ? "transparent" : isDarkSocial ? "transparent" : "#ffffff",
          borderColor: isEditorial ? "transparent" : isDarkSocial ? "transparent" : canvasBorder,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white" style={{ background: isClassicTweet ? "#1d9bf0" : isDarkSocial ? "#24a8e0" : accent }}>
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold">{name || "Your name"}{isClassicTweet || isEditorial ? <span className="ml-1 text-[13px] font-black" style={{ color: "#1d9bf0" }}>✓</span> : null}</p>
            <p className="truncate text-[12px]" style={{ color: canvasMuted }}>{handle.startsWith("@") ? handle : `@${handle || "yourhandle"}`}</p>
          </div>
          <span className="ml-auto text-xs font-semibold" style={{ color: canvasMuted }}>{index + 1}/{total}</span>
        </div>

        <div className="my-auto py-8">
          {!isClassicTweet ? <div className="mb-5 h-1 w-14 rounded-full" style={{ background: isDarkSocial ? "#24a8e0" : accent }} /> : null}
          <h2 className={`${isEditorial ? "text-[34px]" : isDarkSocial ? "text-[31px]" : "text-[28px]"} font-black leading-[1.08] tracking-[-0.035em]`}>
            {displayTitle || "Add a strong slide title"}
          </h2>
          <div className={`${isEditorial ? "mt-5 text-[16px] font-medium" : isDarkSocial ? "mt-6 text-[17px]" : "mt-5 text-[16px]"} space-y-2.5 leading-[1.34]`} style={{ color: canvasMuted }}>
            {paragraphs.length ? paragraphs.map((paragraph, paragraphIndex) => (
              <p key={`${index}-${paragraphIndex}`}>{paragraph}</p>
            )) : <p>Add supporting copy for this slide.</p>}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4 text-[11px] font-semibold" style={{ borderColor: canvasBorder, color: canvasMuted }}>
          <span className={isClassicTweet ? "" : "uppercase tracking-[.16em]"}>{isClassicTweet ? "♡  Reply   ↻  Repost   ♡  Like" : index === total - 1 ? "Save • Share • Follow" : "Swipe for more"}</span>
          <span style={{ color: isDarkSocial ? "#24a8e0" : accent }}>{isClassicTweet ? "" : "→"}</span>
        </div>
      </div>
      {exportMode ? <span className="sr-only">Export render</span> : null}
    </div>
  );
}

export default function TweetCarousel() {
  const [source, setSource] = useState("");
  const [name, setName] = useState("Your Name");
  const [handle, setHandle] = useState("yourhandle");
  const [tone, setTone] = useState("Clear and authoritative");
  const [slideCount, setSlideCount] = useState(6);
  const [slides, setSlides] = useState<TweetSlide[]>(starterSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [theme, setTheme] = useState<ThemeId>("paper");
  const [styleMode, setStyleMode] = useState<StyleId>("editorial");
  const [accent, setAccent] = useState("#2563eb");
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const exportRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    try {
      const draft = localStorage.getItem("tweetCarouselDraft");
      if (draft) {
        const parsed = JSON.parse(draft) as Partial<{
          source: string; name: string; handle: string; tone: string; slides: TweetSlide[]; theme: ThemeId; styleMode: StyleId; accent: string;
        }>;
        if (parsed.source) setSource(parsed.source);
        if (parsed.name) setName(parsed.name);
        if (parsed.handle) setHandle(parsed.handle);
        if (parsed.tone) setTone(parsed.tone);
        if (parsed.slides?.length) setSlides(parsed.slides);
        if (parsed.theme && themes[parsed.theme]) setTheme(parsed.theme);
        if (parsed.styleMode && stylePresets[parsed.styleMode]) setStyleMode(parsed.styleMode);
        if (parsed.accent) setAccent(parsed.accent);
      } else {
        const brief = localStorage.getItem("activeContentBrief");
        if (brief) {
          const parsed = JSON.parse(brief) as Record<string, unknown>;
          const text = [parsed.title, parsed.hook, parsed.summary, parsed.description, parsed.content]
            .filter((value): value is string => typeof value === "string")
            .join("\n\n");
          if (text) setSource(text);
        }
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem("tweetCarouselDraft", JSON.stringify({ source, name, handle, tone, slides, theme, styleMode, accent }));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [source, name, handle, tone, slides, theme, styleMode, accent]);

  useEffect(() => {
    if (currentSlide >= slides.length) setCurrentSlide(Math.max(0, slides.length - 1));
  }, [currentSlide, slides.length]);

  const current = slides[currentSlide] || starterSlides[0];
  const sourceWordCount = useMemo(() => source.trim() ? source.trim().split(/\s+/).length : 0, [source]);

  async function generateSlides() {
    if (source.trim().length < 20) {
      setMessage("Paste at least 20 characters from your post, notes, or article first.");
      return;
    }
    setGenerating(true);
    setMessage("");
    try {
      const response = await fetch("/api/generate/tweet-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: source, tone, slideCount }),
      });
      const payload = await response.json() as { slides?: TweetSlide[]; source?: string; error?: string };
      if (!response.ok || !payload.slides?.length) throw new Error(payload.error || "Carousel generation failed.");
      setSlides(payload.slides);
      setCurrentSlide(0);
      setMessage(payload.source === "source-structured" ? "Slides created from your text. Add an API key for AI rewriting, if desired." : "Carousel generated. Review every claim before publishing.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Carousel generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  function updateSlide(field: keyof TweetSlide, value: string) {
    setSlides((items) => items.map((item, index) => index === currentSlide ? { ...item, [field]: value } : item));
  }

  function resetDraft() {
    localStorage.removeItem("tweetCarouselDraft");
    setSource("");
    setName("Your Name");
    setHandle("yourhandle");
    setTone("Clear and authoritative");
    setSlideCount(6);
    setSlides(starterSlides);
    setCurrentSlide(0);
    setTheme("paper");
    setStyleMode("editorial");
    setAccent("#2563eb");
    setMessage("New blank draft ready.");
  }

  function addSlide() {
    if (slides.length >= 10) return;
    const next = [...slides, { title: "New slide", body: "Add the next part of your story." }];
    setSlides(next);
    setCurrentSlide(next.length - 1);
  }

  function removeSlide() {
    if (slides.length <= 1) return;
    setSlides((items) => items.filter((_, index) => index !== currentSlide));
    setCurrentSlide((value) => Math.max(0, value - 1));
  }

  async function renderNode(node: HTMLElement, fileName: string) {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, skipFonts: true, width: 540, height: 540 });
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  }

  async function downloadCurrent() {
    if (!previewRef.current) return;
    setExporting(true);
    setMessage("");
    try {
      await renderNode(previewRef.current, `${safeFileName(current.title)}-${currentSlide + 1}.png`);
      setMessage("Current slide downloaded as a 1080 × 1080 PNG.");
    } catch {
      setMessage("Could not export this slide. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  async function downloadAll() {
    setExporting(true);
    setMessage("");
    try {
      const [{ toPng }, JSZipModule] = await Promise.all([import("html-to-image"), import("jszip")]);
      const zip = new JSZipModule.default();
      for (let index = 0; index < slides.length; index += 1) {
        const node = exportRefs.current[index];
        if (!node) continue;
        const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, skipFonts: true, width: 540, height: 540 });
        zip.file(`slide-${String(index + 1).padStart(2, "0")}.png`, dataUrl.split(",")[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${safeFileName(slides[0]?.title || "tweet-carousel")}.zip`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setMessage(`${slides.length} slides downloaded as a ZIP.`);
    } catch {
      setMessage("Could not export the full carousel. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  async function downloadPdf() {
    setExporting(true);
    setMessage("");
    try {
      const [{ toPng }, jsPdfModule] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const pdf = new jsPdfModule.jsPDF({ orientation: "portrait", unit: "px", format: [1080, 1080], compress: true });

      for (let index = 0; index < slides.length; index += 1) {
        const node = exportRefs.current[index];
        if (!node) continue;
        const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true, skipFonts: true, width: 540, height: 540 });
        if (index > 0) pdf.addPage([1080, 1080], "portrait");
        pdf.addImage(dataUrl, "PNG", 0, 0, 1080, 1080, undefined, "FAST");
      }

      pdf.save(`${safeFileName(slides[0]?.title || "tweet-carousel")}.pdf`);
      setMessage(`${slides.length} slides downloaded as a PDF.`);
    } catch {
      setMessage("Could not export the PDF. Please try again or use the ZIP export.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] px-5 py-6 lg:px-8">
      <PageHeader
        eyebrow="Create"
        title="Tweet carousel"
        description="Turn tweets into beautiful screenshot carousels."
      />

      <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
        <section className="card h-fit space-y-5 p-5">
          <div>
            <label className="mb-2 block text-xs font-bold text-gray-700">Your post, thread, or source material *</label>
            <textarea
              className="input-field min-h-40 resize-y"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Paste the complete post, article notes, transcript excerpt, or researched brief. Include the facts you want the carousel to use."
            />
            <div className="mt-1 flex justify-between text-[11px] text-gray-400"><span>{sourceWordCount} words</span><span>Facts come from this source</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-gray-700">Display name<input className="input-field mt-2" value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="text-xs font-bold text-gray-700">Handle<input className="input-field mt-2" value={handle} onChange={(event) => setHandle(event.target.value.replace(/\s/g, ""))} /></label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-gray-700">Tone<select className="input-field mt-2" value={tone} onChange={(event) => setTone(event.target.value)}><option>Clear and authoritative</option><option>Bold and conversational</option><option>Educational and practical</option><option>Concise and analytical</option><option>Warm and personal</option></select></label>
            <label className="text-xs font-bold text-gray-700">Slides<select className="input-field mt-2" value={slideCount} onChange={(event) => setSlideCount(Number(event.target.value))}>{[4,5,6,7,8,9,10].map((count) => <option key={count}>{count}</option>)}</select></label>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button className="btn-primary flex items-center justify-center gap-2" onClick={generateSlides} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Structuring your carousel…" : "Generate carousel"}
            </button>
            <button className="btn-secondary px-4" onClick={resetDraft}>New draft</button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500">Edit slide {currentSlide + 1}</p>
              <div className="flex gap-1">
                <button className="rounded-lg border p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40" onClick={removeSlide} disabled={slides.length <= 1} aria-label="Remove slide"><Minus className="h-4 w-4" /></button>
                <button className="rounded-lg border p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40" onClick={addSlide} disabled={slides.length >= 10} aria-label="Add slide"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <input className="input-field mb-2 font-semibold" value={current.title} onChange={(event) => updateSlide("title", event.target.value)} aria-label="Slide title" />
            <textarea className="input-field min-h-28 resize-y" value={current.body} onChange={(event) => updateSlide("body", event.target.value)} aria-label="Slide body" />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-1 text-xs font-black uppercase tracking-wider text-gray-500">Reference style</p>
            <p className="mb-3 text-xs text-gray-400">Choose a layout inspired by your uploaded examples.</p>
            <div className="space-y-2">
              {(Object.entries(stylePresets) as Array<[StyleId, typeof stylePresets[StyleId]]>).map(([id, preset]) => (
                <button key={id} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${styleMode === id ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-gray-200 bg-white"}`} onClick={() => setStyleMode(id)}>
                  <span className="h-8 w-8 shrink-0 rounded-lg border" style={{ background: preset.swatch, borderColor: id === "dark-social" ? "#050505" : "#d8d4cc" }} />
                  <span className="min-w-0"><span className="block text-xs font-bold text-gray-800">{preset.label}</span><span className="block truncate text-[11px] text-gray-500">{preset.description}</span></span>
                </button>
              ))}
            </div>
            <p className="mb-3 mt-4 text-xs font-black uppercase tracking-wider text-gray-500">Color palette</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(themes) as Array<[ThemeId, typeof themes[ThemeId]]>).map(([id, palette]) => (
                <button key={id} className={`rounded-xl border px-3 py-2 text-left text-xs font-bold ${theme === id ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"}`} onClick={() => setTheme(id)}>
                  <span className="mr-2 inline-block h-3 w-3 rounded-full border" style={{ background: palette.background }} />{palette.label}
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center justify-between text-xs font-bold text-gray-700">Accent color<input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="h-9 w-14 cursor-pointer rounded border bg-white p-1" /></label>
          </div>
        </section>

        <section className="card min-w-0 overflow-hidden p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-black text-gray-900">Live preview</h2><p className="text-xs text-gray-500">{stylePresets[styleMode].label} • square format • exports at 1080 × 1080</p></div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary flex items-center gap-2" onClick={downloadCurrent} disabled={exporting}><Download className="h-4 w-4" />Current PNG</button>
              <button className="btn-secondary flex items-center gap-2" onClick={downloadPdf} disabled={exporting}>{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}All slides PDF</button>
              <button className="btn-primary flex items-center gap-2" onClick={downloadAll} disabled={exporting}>{exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}All slides ZIP</button>
            </div>
          </div>

          <div className="relative flex min-h-[610px] items-center justify-center overflow-auto rounded-3xl bg-gray-100 p-5">
            <button className="absolute left-3 z-10 rounded-full bg-white/95 p-2 text-gray-900 shadow disabled:opacity-30" onClick={() => setCurrentSlide((value) => Math.max(0, value - 1))} disabled={currentSlide === 0} aria-label="Previous slide"><ChevronLeft className="h-5 w-5" /></button>
            <div ref={previewRef}><SlideCard slide={current} index={currentSlide} total={slides.length} name={name} handle={handle} theme={theme} accent={accent} styleMode={styleMode} /></div>
            <button className="absolute right-3 z-10 rounded-full bg-white/95 p-2 text-gray-900 shadow disabled:opacity-30" onClick={() => setCurrentSlide((value) => Math.min(slides.length - 1, value + 1))} disabled={currentSlide === slides.length - 1} aria-label="Next slide"><ChevronRight className="h-5 w-5" /></button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {slides.map((_, index) => <button key={index} className={`h-2.5 rounded-full transition-all ${index === currentSlide ? "w-8 bg-blue-600" : "w-2.5 bg-gray-300 hover:bg-gray-400"}`} onClick={() => setCurrentSlide(index)} aria-label={`Open slide ${index + 1}`} />)}
          </div>
          {message ? <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</p> : null}
          <p className="mt-3 text-center text-[11px] text-gray-400">Generated copy is a draft. Verify names, dates, figures, and claims before publishing.</p>
        </section>
      </div>

      <div className="pointer-events-none fixed -left-[2000px] top-0 opacity-0" aria-hidden="true">
        {slides.map((slide, index) => (
          <div key={`export-${index}`} ref={(node) => { exportRefs.current[index] = node; }}>
            <SlideCard slide={slide} index={index} total={slides.length} name={name} handle={handle} theme={theme} accent={accent} styleMode={styleMode} exportMode />
          </div>
        ))}
      </div>
    </div>
  );
}
