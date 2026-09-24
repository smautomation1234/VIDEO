import { NextRequest, NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { topic, hookStyle, platform } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const styleDescriptions: Record<string, string> = {
      curiosity_gap: "Curiosity Gap — create irresistible curiosity, make the viewer NEED to watch to find out the answer",
      shock_statement: "Shock Statement — challenge a common belief or reveal a shocking truth about the topic",
      direct_value: "Direct Value — immediately promise a specific, tangible outcome or free resource",
      story_hook: "Story Hook — open mid-story with a transformation from a bad state to a good state",
      challenge_hook: "Challenge Hook — create a dare, bet, or exclusive insight that challenges the viewer",
    };

    const style = styleDescriptions[hookStyle] || styleDescriptions["curiosity_gap"];

    const systemPrompt = `You are a viral social media content strategist who writes scroll-stopping hooks. 
Your hooks make people STOP scrolling in the first 3 seconds.
Rules:
- Keep each hook under 15 words
- Start with power words (Never, Stop, Secret, This, Why, How, etc.)
- Create pattern interrupts
- Make it ultra-specific to the topic
- Use the hook style requested
- NO generic filler words`;

    const userPrompt = `Write 3 different scroll-stopping hooks for: "${topic}"
Hook Style: ${style}
Platform: ${platform || "Instagram Reels"}

Format the response as a JSON array of exactly 3 strings. Example:
["Hook 1 here", "Hook 2 here", "Hook 3 here"]

Only return the JSON array, nothing else.`;

    const aiResult = await generateWithWebSearch({ system: systemPrompt, prompt: userPrompt, maxOutputTokens: 300 });

    const content = aiResult.text || "[]";
    let hooks: string[] = [];
    try {
      hooks = JSON.parse(content);
    } catch {
      hooks = content.split("\n").filter((l) => l.trim()).slice(0, 3);
    }

    return NextResponse.json({ hooks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate hooks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
