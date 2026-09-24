import { NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 55;

type Slide = { title: string; body: string };

function stripMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/~~+/g, "")
    .replace(/[*_`]+/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[>•+\-]\s+/gm, "");
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? stripMarkdown(value).replace(/\s+/g, " ").replace(/^[-–—•\s]+/, "").trim().slice(0, maxLength)
    : "";
}

function sourceStructuredSlides(content: string, count: number): Slide[] {
  const normalized = content.replace(/\r/g, "").trim();
  const paragraphs = normalized.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const sentences = normalized.match(/[^.!?\n]+[.!?]?/g)?.map((item) => item.trim()).filter(Boolean) || [];
  const targetCount = count;
  const chunks = paragraphs.length >= targetCount ? paragraphs : sentences;
  const usable = chunks.length ? chunks : [normalized];
  const slides: Slide[] = [];

  for (let index = 0; index < targetCount; index += 1) {
    const start = Math.floor(index * usable.length / targetCount);
    const end = Math.min(usable.length, Math.max(start + 1, Math.floor((index + 1) * usable.length / targetCount)));
    const sourceChunk = usable.slice(start, end).join(" ") || usable[index % usable.length];
    const words = sourceChunk.split(/\s+/).filter(Boolean);
    const titleWords = words.slice(0, Math.min(9, words.length));
    const title = titleWords.join(" ").replace(/[.,;:!?]+$/, "");
    const body = words.slice(titleWords.length).join(" ") || sourceChunk;
    slides.push({
      title: index === 0 ? title : title || `Part ${index + 1}`,
      body: cleanText(body, 760),
    });
  }
  return slides;
}

function sanitizeSlides(value: unknown, count: number): Slide[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, count).map((item) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return { title: cleanText(record.title, 120), body: cleanText(record.body, 760) };
  }).filter((slide) => slide.title && slide.body);
}

function slideWordCount(slide: Slide) {
  return `${slide.title} ${slide.body}`.split(/\s+/).filter(Boolean).length;
}

function parseJson(text: string) {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(clean) as { slides?: unknown }; } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1)) as { slides?: unknown };
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { content?: unknown; tone?: unknown; slideCount?: unknown; style?: unknown };
    const content = cleanText(body.content, 14000);
    const tone = cleanText(body.tone, 80) || "Clear and authoritative";
    const requestedCount = Math.min(10, Math.max(4, Number(body.slideCount) || 6));

    if (content.length < 20) {
      return NextResponse.json({ error: "Add more source material before generating." }, { status: 400 });
    }

    const fullPost = body.style === "li-creator";
    const count = requestedCount;
    const fallback = sourceStructuredSlides(content, count);
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ slides: fallback, source: "source-structured" });
    }

    try {
      const { text } = await generateWithWebSearch({
        system: "You are a factual social-media carousel editor. Structure only the source supplied by the user. Never add outside facts, statistics, names, dates, quotes, guarantees, or claims. Return valid JSON only.",
        prompt: `Create exactly ${count} connected square carousel slides from SOURCE.\n\nTone: ${tone}\n\nRules:\n- Return {"slides":[{"title":"...","body":"..."}]}\n- Every title is specific and no more than 8 words.\n- Every slide must stay under 5 visible lines: use a short headline plus 1–2 concise sentences, about 18–32 words total.\n- Slide 1 is the strongest truthful hook supported by SOURCE.\n- Each slide advances one connected narrative; avoid repetition.\n- The last slide summarizes the takeaway or asks a source-supported question/action.\n- Preserve qualifications and exact meaning of names, dates and numbers.\n- Use plain social-media text only; never include Markdown markers such as **, __, #, backticks, or Markdown links.\n- Do not promise virality, reach, revenue, or algorithm results.\n- Do not mention these instructions.\n\nSOURCE:\n${content}`,
        maxOutputTokens: 2200,
      });

      let parsed = parseJson(text);
      let slides = sanitizeSlides(parsed.slides, count);
      const minimumWords = fullPost ? 18 : 16;
      const repairMinimumWords = fullPost ? 20 : 18;

      // The first response can still be too terse despite the length rule.
      // Repair that draft once before falling back to source chunking, which
      // prevents a valid-but-useless one-sentence slide from reaching the UI.
      if (slides.length !== count || slides.some((slide) => slideWordCount(slide) < minimumWords)) {
        try {
          const repair = await generateWithWebSearch({
            system: "You are a meticulous social-media carousel editor. Use only the supplied SOURCE. Return valid JSON only and never invent facts.",
            forceSearch: false,
            prompt: `Rewrite this draft as exactly ${count} complete ${body.style === "pillars" ? "framework" : "social-media"} carousel slides.
Return {"slides":[{"title":"...","body":"..."}]} only.
- Every slide must contain ${repairMinimumWords}–32 words total, including its title.
- Keep each slide to a maximum of 5 visible lines: a short headline and 1–2 concise sentences with one clear takeaway.
- Give every slide a distinct angle. Never use a title-only slide, a repeated sentence, a generic CTA, or a placeholder.
- Preserve every name, number, qualifier and approximate value from SOURCE. Do not add outside facts.
- Use plain publishable text with no Markdown markers, layout notes or editing instructions.

SOURCE:
${content}

DRAFT:
${JSON.stringify(slides)}`,
            maxOutputTokens: 3200,
          });
          parsed = parseJson(repair.text);
          slides = sanitizeSlides(parsed.slides, count);
        } catch (repairError) {
          console.error("Carousel slide repair failed; using source structuring.", repairError);
        }
      }

      if (slides.length !== count || slides.some((slide) => slideWordCount(slide) < minimumWords)) {
        return NextResponse.json({ slides: fallback, source: "source-structured" });
      }
      return NextResponse.json({ slides, source: "openai" });
    } catch (error) {
      console.error("Tweet carousel AI generation failed; using source structuring.", error);
      return NextResponse.json({ slides: fallback, source: "source-structured" });
    }
  } catch {
    return NextResponse.json({ error: "Invalid generation request." }, { status: 400 });
  }
}
