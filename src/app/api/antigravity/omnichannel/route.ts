import { NextRequest, NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const systemPrompt = `You are a world-class Omni-Channel viral marketing strategist. Given a core topic, generate customized, algorithm-beating strategies for 4 platforms: Instagram, YouTube Shorts, X (Twitter), and LinkedIn.

Return ONLY a JSON object with strictly this structure:
{
  "insta": {
    "dmBait": "A short CTA line designed to trigger comments (e.g. 'Comment GROWTH to get...').",
    "caption": "A full, engaging Instagram caption with storytelling, line breaks, strong CTA, and 4-6 hashtags.",
    "seoScore": number (80-99 representing SEO strength)
  },
  "yt": {
    "loopIdea": "A clever way to make the end frame seamlessly loop into the start frame.",
    "pacing": "1-2 sentences with tips on pacing and visual changes.",
    "title": "A highly click-through YouTube title.",
    "retention": "A specific tip on maximizing average view duration for this topic."
  },
  "x": {
    "threadHook": "The viral hook for the first tweet (include 'Show More👇').",
    "threadBody": "A 2-4 tweet continuation of the thread outlining the core value.",
    "dwellTrick": "A formatting tip specific to Twitter to inflate read time."
  },
  "linkedin": {
    "broetry": "A 'broetry' style post: short, single-sentence paragraphs, telling a personal story of transformation.",
    "carousel": [
      "5 string array items representing text on 5 carousel slides"
    ],
    "algoTip": "A LinkedIn specific algorithm hack."
  }
}`;

    const aiResult = await generateWithWebSearch({
      system: systemPrompt,
      prompt: `Generate the omni-channel strategy for the topic: "${topic}"`,
    });

    const result = JSON.parse(aiResult.text || "{}");
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate strategies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
