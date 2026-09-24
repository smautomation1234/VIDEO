import { NextRequest, NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { script } = await req.json();
    if (!script) return NextResponse.json({ error: "Script is required" }, { status: 400 });

    const systemPrompt = `You are an expert social media algorithm analyzer. You grade short-form video scripts (reels/TikToks) based on their viral potential.

Analyze the script and provide a score out of 100 for each of the following 4 metrics:
1. "hook" (Max 30 points): Does it stop the scroll in the first 3 seconds? Does it use a curiosity gap, bold claim, or pattern interrupt?
2. "pacing" (Max 25 points): Is the script concise, punchy, and well-paced? (Optimal length is 20-60 words).
3. "retention" (Max 20 points): Does it use retention bait like numbered lists, "wait for it", cliffhangers, or emotional triggers?
4. "cta" (Max 25 points): Does it have a strong call to action (save, share, comment, follow)?

Calculate the total score by summing the 4 metrics (max 100).
Provide a "verdict" string based on the total score:
- 80-100: "🔥 Algorithm Loves This - High Viral Potential"
- 50-79: "⚠️ Needs Optimization"
- 0-49: "❌ Low Viral Potential - Rework Needed"

Provide an array of 2-3 short, highly actionable "tips" to improve the script.

Return ONLY a JSON object with this exact structure:
{
  "total": number (sum of the 4 metrics),
  "breakdown": {
    "hook": number,
    "pacing": number,
    "retention": number,
    "cta": number
  },
  "verdict": string,
  "tips": string[]
}
`;

    const aiResult = await generateWithWebSearch({
      system: systemPrompt,
      prompt: `Grade this script:\n\n${script}`,
    });

    const result = JSON.parse(aiResult.text || "{}");
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to analyze script";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
