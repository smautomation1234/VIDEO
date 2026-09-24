import { NextResponse } from 'next/server';
import { generateWithWebSearch } from "@/lib/ai";
import { webSearch, fetchRSSContext } from '@/lib/web-search';

export const maxDuration = 55;

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
       return NextResponse.json({ error: "OPENAI_API_KEY is not configured. No mock strategy was generated." }, { status: 503 });
    }

    const apiKey = process.env.OPENAI_API_KEY || '';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Fetch live web trends for this input
    let liveContext = '';
    const webResult = await webSearch(
      `What are the most viral trending topics, content formats, and hooks for "${input}" on TikTok, Instagram, and YouTube right now? Today is ${today}.`,
      apiKey
    );
    if (webResult.summary) {
      liveContext = webResult.summary;
    } else {
      const rssData = await fetchRSSContext([`${input} trending`, `${input} viral`]);
      if (rssData) liveContext = rssData;
    }

    const prompt = `You are a viral social media architect for growth SaaS/Tech platforms. 
Analyze the following topic or niche: "${input}". 
${liveContext ? `\nLIVE WEB SEARCH DATA (use this to ground your ideas in current trends):\n${liveContext}\n` : ''}
Generate a comprehensive viral ideation plan consisting of 13 specific strategies. Be edgy, contrarian, and use highly tactical modern hooks that reflect what is ACTUALLY trending right now.
Return ONLY a valid JSON object with the exact following keys (no markdown blocks around it, just raw JSON). Ensure all string values format nicely with \n for line breaks.

Keys:
- "stealSpin" (array of 2 strings: format: "1. Hook: ... \\nStructure: ...")
- "audioMatch" (string: Trending audio idea + execution)
- "newsJack" (string: News jacking idea + action)
- "ytVoid" (string: YouTube search void idea + action)
- "disruptor" (string: specific visual pattern disruptor)
- "deadZone" (string: retention warning + fix)
- "bRoll" (string: b-roll suggestion)
- "controversy" (string: polarizing take)
- "bingeSeries" (string: playlist architecture)
- "angleTesting" (string: 3 A/B test angles)
- "tensionLoop" (string: hollywood storyboard script)
- "bribeGenerator" (string: comment auto-DM bribe idea)
- "silentScroll" (string: trick for muted scrolls)
`;

    const { text } = await generateWithWebSearch({ prompt });

    const content = text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) { try { parsedData = JSON.parse(jsonMatch[0]); } catch {} }
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Error generating viral lab:", error);
    return NextResponse.json({ error: 'Failed to generate viral ideation' }, { status: 500 });
  }
}
