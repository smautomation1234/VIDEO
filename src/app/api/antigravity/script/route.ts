import { NextRequest, NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";

const templateInstructions: Record<string, string> = {
  listicle: `Write a Listicle Reel Script using this structure:
- SCENE 1 (0-3s): Hook line that promises a list + stops scrolling
- SCENE 2–6 (3-20s): Each point gets 2-3 seconds. Label them Point 1, Point 2, etc. One sentence + what to show on screen
- SCENE 7 (20-25s): CTA — tell them to Save this + what to follow for more
Format each scene on its own line starting with [SCENE X - Xs]:`,

  myth_buster: `Write a Myth Buster Reel Script using this structure:
- SCENE 1 (0-3s): State the common myth boldly (the WRONG belief everyone has)
- SCENE 2 (3-8s): Show why this is wrong with evidence/example
- SCENE 3 (8-18s): Reveal the TRUTH — the correct approach/fact
- SCENE 4 (18-25s): Quick proof/result + CTA to Share with someone who believes the myth
Format each scene on its own line starting with [SCENE X - Xs]:`,

  before_after: `Write a Before/After Transformation Reel Script using this structure:
- SCENE 1 (0-3s): Flash the RESULT first (the after state) — most compelling outcome
- SCENE 2 (3-8s): Show the painful BEFORE state — create emotional gap
- SCENE 3 (8-20s): 3 quick steps/actions that caused the transformation (numbered)
- SCENE 4 (20-25s): Show result again + CTA: "Follow for the full guide"
Format each scene on its own line starting with [SCENE X - Xs]:`,

  story_hook: `Write a Story Hook Reel Script using this structure:
- SCENE 1 (0-3s): Start MID-STORY with the most dramatic moment ("I was about to give up...")
- SCENE 2 (3-10s): Set the context briefly — who, what problem
- SCENE 3 (10-20s): The turning point — what changed, what insight/action made the difference
- SCENE 4 (20-25s): Where you are NOW + what viewers should do next
Format each scene on its own line starting with [SCENE X - Xs]:`,
};

export async function POST(req: NextRequest) {
  try {
    const { topic, templateType, targetLength } = await req.json();
    if (!topic || !templateType) {
      return NextResponse.json({ error: "Topic and templateType are required" }, { status: 400 });
    }

    const instruction = templateInstructions[templateType] || templateInstructions["listicle"];
    const length = targetLength || "15-25 seconds";

    const systemPrompt = `You are an elite short-form video scriptwriter. You write punchy, high-retention reel scripts that keep viewers watching till the end. Every word earns its place. You write for a ${length} reel.`;

    const userPrompt = `Topic: "${topic}"

${instruction}

Additional requirements:
- Write the actual spoken words (caption text for each scene)
- Also note what to show visually in brackets: [visual: ...]
- Keep total script under ${length} when spoken at normal pace
- Use hooks, pattern interrupts, and cliffhangers between scenes
- Make it punchy — cut unnecessary words ruthlessly

Write the complete script now:`;

    const aiResult = await generateWithWebSearch({ system: systemPrompt, prompt: userPrompt, maxOutputTokens: 700 });

    const script = aiResult.text || "";
    return NextResponse.json({ script });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate script";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
