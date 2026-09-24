import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/social-tokens";
import { createClient } from "@supabase/supabase-js";
import { fetchLiveNewsContext } from "@/lib/news";
import { generateWithWebSearch } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const { customTopic, category } = await req.json();

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userProfile } = await db
      .from("users")
      .select("niche_description, persona, preferred_categories, custom_sources")
      .eq("id", userId)
      .single();

    const niche = userProfile?.niche_description || "AI, startups, venture capital, tech";
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing from environment variables." }, { status: 500 });
    }

    // Capture context
    const liveContext = await fetchLiveNewsContext(customTopic, category, userProfile);

    const systemPrompt = `You are an elite news intelligence analyst for startup founders and professionals in: ${niche}.
You must analyze the provided recent breaking news stories and structure the most impactful ones into a JSON array.

OUTPUT RULES:
- Return ONLY a valid JSON array — no markdown, no backticks, no explanation
- Each element must have exactly these fields:
  {
    "title": "Short punchy headline (max 12 words)",
    "summary": "2–3 sentence summary of what happened and why it matters to founders",
    "viralityScore": <integer 1-10>,
    "viralityReason": "One sentence: why this will perform well on LinkedIn",
    "angle": "The most counter-intuitive or surprising angle for a LinkedIn post",
    "sources": [{"title": "Source name", "url": "https://..."}]
  }
- Include exactly 3–6 stories sorted by viralityScore descending
- viralityScore must be an integer between 1 and 10
- Return ONLY the JSON array, starting with [ and ending with ]`;

    const userPrompt = customTopic
      ? `Research the very latest news, facts, and angles about: "${customTopic}". Focus on developments from the last 24–72 hours.
Use the following live breaking news context if relevant, otherwise use your existing knowledge:
${liveContext}`
      : `Find today's 6 most impactful breaking news stories in: ${niche}. Focus on stories from the last 24 hours that would surprise or challenge professional assumptions.
Use the following live breaking news to ground your response:
${liveContext}`;

    const result = await generateWithWebSearch({ system: systemPrompt, prompt: userPrompt, apiKey });
    let jsonText = result.text || "[]";

    // Parse JSON safely
    let stories: any[] = [];
    try {
      const cleaned = jsonText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      stories = JSON.parse(cleaned);
      if (!Array.isArray(stories)) throw new Error("Not an array");
    } catch {
      const match = jsonText.match(/\[[\s\S]*\]/);
      if (match) {
        try { stories = JSON.parse(match[0]); } catch { stories = []; }
      }
    }

    // Validate + sanitize story objects
    stories = stories
      .filter(s => s && typeof s.title === "string" && typeof s.viralityScore === "number")
      .map(s => ({
        title: String(s.title ?? "").slice(0, 120),
        summary: String(s.summary ?? "").slice(0, 500),
        viralityScore: Math.min(10, Math.max(1, Math.round(s.viralityScore))),
        viralityReason: String(s.viralityReason ?? ""),
        angle: String(s.angle ?? ""),
        sources: Array.isArray(s.sources) ? s.sources.slice(0, 3) : [],
      }));

    if (stories.length === 0) {
      return NextResponse.json({ error: "No stories matched the expected format.", stories: [] }, { status: 200 });
    }

    return NextResponse.json({
      stories,
      niche,
      customTopic: customTopic || null,
      scoutedAt: new Date().toISOString(),
      debug: { rawJsonLength: jsonText.length },
    });
  } catch (error: any) {
    console.error("News scout error:", error);
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred while scouting news." 
    }, { status: 500 });
  }
}
