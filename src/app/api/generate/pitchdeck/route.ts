import { NextRequest, NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";

const callOpenAI = async (system: string, prompt: string, apiKey?: string, _temperature = 0.8) => {
  const result = await generateWithWebSearch({ system, prompt, apiKey });
  return result.text;
};

function parseJSON(text: string): any {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]);
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) return JSON.parse(objectMatch[0]);
    throw new Error("Failed to parse AI response");
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is missing from environment variables.");

    const body = await req.json();
    const { action } = body;

    // ── ACTION 1: Generate outline (slide titles) ─────────────────────────────
    if (action === "outline") {
      const { topic, companyName, targetAudience, tone, slideCount, industry } = body;

      const toneMap: Record<string, string> = {
        formal: "professional, polished, boardroom-ready",
        bold: "bold, direct, energetic — for disruption-stage startups",
        startup: "casual yet credible — startup-culture-savvy",
        creative: "creative, visually storytelling, design-forward",
      };
      const toneDesc = toneMap[tone] || "professional";

      const system = `You are a world-class pitch deck consultant who has helped companies raise over $1B. You create compelling slide structures that tell a story investors cannot ignore.`;

      const prompt = `Create a ${slideCount}-slide pitch deck outline for:
Company: ${companyName}
Topic/Pitch: ${topic}
Industry: ${industry || "Technology"}
Target Audience: ${targetAudience}
Tone: ${toneDesc}

Use the best-practice investor pitch deck structure, adapted to this company. Include slides like: Title, Problem, Solution, Market Size, Business Model, Traction, Competition, Go-to-Market, Team, Financials, Ask/CTA, etc. — but make them specific and engaging.

Return a JSON array of exactly ${slideCount} objects:
[
  { "index": 0, "title": "Slide Title", "type": "title|section|content|chart|cta", "suggestedContent": "2-3 short bullet bullets or a 1-sentence description of what goes here" },
  ...
]

Types:
- "title" = cover slide
- "section" = divider/chapter slide  
- "content" = regular content slide
- "chart" = data/metrics slide
- "cta" = call-to-action/closing slide

Return ONLY the JSON array. No markdown fences.`;

      const raw = await callOpenAI(system, prompt, apiKey, 0.75);
      const slides = parseJSON(raw);

      return NextResponse.json({ success: true, slides });
    }

    // ── ACTION 2: Enhance a single slide (or all slides) ─────────────────────
    if (action === "enhance") {
      const { companyName, topic, targetAudience, tone, slides } = body;

      const system = `You are a master presentation writer and pitch deck consultant. You transform rough notes into powerful, concise slide content that captivates investors and executives.`;

      const prompt = `Enhance the content for this pitch deck:
Company: ${companyName}
Pitch topic: ${topic}
Target audience: ${targetAudience}
Tone: ${tone}

For each slide below, rewrite/enhance the content to be more compelling, specific, and impactful. Keep bullet points concise (max 12 words each). For "title" type slides keep body as tagline. For "section" type slides write a powerful 1-line subheading.

Slides to enhance:
${JSON.stringify(slides, null, 2)}

Return a JSON array with the SAME structure but with enhanced fields added:
[
  {
    "index": <same index>,
    "title": "<polished title>",
    "type": "<same type>",
    "enhancedBullets": ["bullet 1", "bullet 2", "bullet 3"],
    "speakerNote": "1-2 sentence speaker note for this slide"
  },
  ...
]

Return ONLY the JSON array. No markdown fences.`;

      const raw = await callOpenAI(system, prompt, apiKey, 0.8);
      const enhanced = parseJSON(raw);

      return NextResponse.json({ success: true, enhanced });
    }

    // ── ACTION 3: Enhance single slide ────────────────────────────────────────
    if (action === "enhance_single") {
      const { companyName, topic, targetAudience, tone, slide } = body;

      const system = `You are a master presentation writer. Transform rough notes into powerful slide content.`;

      const prompt = `Enhance this single slide for a pitch deck:
Company: ${companyName}, Topic: ${topic}, Audience: ${targetAudience}, Tone: ${tone}

Slide: ${JSON.stringify(slide)}

Return JSON with:
{
  "index": <same>,
  "title": "<polished title>",
  "type": "<same>",
  "enhancedBullets": ["bullet 1", "bullet 2", "bullet 3"],
  "speakerNote": "1-2 sentence speaker note"
}

Return ONLY JSON. No markdown fences.`;

      const raw = await callOpenAI(system, prompt, apiKey, 0.8);
      const enhanced = parseJSON(raw);

      return NextResponse.json({ success: true, enhanced });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[pitchdeck API] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
