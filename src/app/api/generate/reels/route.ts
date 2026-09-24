import { NextRequest, NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";
import { getSessionUserId } from "@/lib/social-tokens";

export async function POST(req: NextRequest) {
    try {
        const userId = await getSessionUserId();
        // if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

        const { topic, customScript, sceneCount: rawSceneCount, openAiKey, reelMode = 'faceless' } = await req.json();
        if ((!topic || !topic.trim()) && (!customScript || !customScript.trim())) {
            return NextResponse.json({ error: "Topic or Custom Script is required." }, { status: 400 });
        }

        const apiKey = openAiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI API Key is missing. Please provide it in the UI.");

        // Determine scene count and prompt rules based on reel mode
        let sceneCount = rawSceneCount;
        let systemExtra = "";
        let promptRules = "";

        if (reelMode === 'short') {
            sceneCount = sceneCount ?? 3;
            systemExtra = "You specialise in ULTRA-SHORT 5-second reels. Every word counts. Zero fluff.";
            promptRules = `Rules for 5-Second Snack format (DESIGNED FOR INFINITE LOOPING):
- 3 scenes ONLY
- Scene 1 = HOOK (3-5 words, MUST use a negative hook or extreme curiosity gap, ALL CAPS. E.g., "STOP DOING X" or "THE SECRET THEY HIDE")
- Scene 2 = PAYOFF (one powerful insight, 4-6 words)
- Scene 3 = CTA (MUST explicitly ask for a SAVE, SHARE, or COMMENT 'LINK' for auto-DM. e.g. "Save this!" or "Comment 'GROWTH' for the guide")
- Main text must be 3-5 words MAXIMUM — no exceptions
- Sub text optional; max 8 words if used`;
        } else if (reelMode === 'long') {
            sceneCount = sceneCount ?? 8;
            systemExtra = "You specialise in 60-second long-form reels with a full narrative arc that retains viewers through curiosity.";
            promptRules = `Rules for 60-Second Story format:
- 7-8 scenes
- Scene 1 = HOOK: Must be a viral negative hook or a severe curiosity gap (e.g. "Stop doing X", "The biggest lie about Y")
- Scene 2 = CONTEXT/STORY: Relatable setup or personal anecdote
- Scenes 3-6 = 3-4 VALUE POINTS: One insight/tip per scene, punchy
- Scene 7 = CLIMAX/RESULT: The payoff — transformation or key result
- Scene ${sceneCount} = CTA: MUST optimize for algorithms. Say explicitly "Save this for later" or "Comment 'GUIDE' and I'll DM you". NO generic follow requests.
- Main text: 4-10 words, uppercase preferred
- Sub text: 10-18 words adding context or proof`;
        } else {
            // default: faceless
            sceneCount = sceneCount ?? 5;
            systemExtra = "You specialise in FACELESS reels — text-card style, voiceover-friendly. No face on camera. Each scene works as a standalone text overlay.";
            promptRules = `Rules for Faceless Reel format:
- 5 scenes
- Scene 1 = HOOK: Must stop the scroll using a negative hook or data-backed shocking claim
- Scenes 2-4 = VALUE: Short punchy points (list style works great)
- Scene 5 = CTA: Algorithm-optimized CTA. Ask for a SAVE, SHARE, or give an Auto-DM trigger keyword "Comment [WORD] for the full guide"
- Main text: 3-8 words max, uppercase preferred, reads well as a text card
- Sub text: supporting line 8-15 words, optional but powerful
- Tag: 1-3 word scene label (e.g. "HACK", "FACT", "PRO TIP", "RESULT")`;
        }

        const system = `You are an elite short-form video script writer for Instagram Reels and YouTube Shorts.
You create punchy, scroll-stopping scenes that maximize watch time, saves, and shares.
${systemExtra}`;

        const prompt = customScript && customScript.trim() 
            ? `Convert the following user script into a ${sceneCount}-scene viral Instagram Reel script formatting it EXACTLY as requested.\n\nUser Script:\n"""${customScript}"""\n\n${promptRules}\n\nReturn ONLY a valid JSON array, no markdown, no explanation:
[
  { "main": "...", "sub": "...", "tag": "...", "cta": null },
  { "main": "...", "sub": "...", "tag": "...", "cta": null },
  ...
]`
            : `Create a ${sceneCount}-scene viral Instagram Reel script for the topic: "${topic}"

${promptRules}

Return ONLY a valid JSON array, no markdown, no explanation:
[
  { "main": "...", "sub": "...", "tag": "...", "cta": null },
  { "main": "...", "sub": "...", "tag": "...", "cta": null },
  ...
]`;

        const aiResult = await generateWithWebSearch({ system, prompt, apiKey });
        const raw = aiResult.text;

        // Parse JSON from the response (strip any markdown fences)
        let scenes: unknown;
        try {
            const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            scenes = JSON.parse(jsonStr);
        } catch {
            const arrMatch = raw.match(/\[[\s\S]*\]/);
            if (!arrMatch) throw new Error("Invalid scenes response from AI.");
            scenes = JSON.parse(arrMatch[0]);
        }

        if (!Array.isArray(scenes) || scenes.length === 0) {
            throw new Error("Invalid scenes response from AI.");
        }

        return NextResponse.json({ success: true, scenes });
    } catch (err) {
        console.error("[generate reels] Error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
