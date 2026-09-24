import { NextResponse } from 'next/server';
import { generateWithWebSearch } from "@/lib/ai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { concept, format } = await req.json(); // format e.g. '5sec', '15sec', '30sec', '60sec', 'carousel5', 'carousel10'

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "OpenAI API Key is missing. Add it to Vercel first." }, { status: 401 });
    }

    const systemPrompts: Record<string, string> = {
      '5sec': `You are an expert short-form reel scriptwriter. Convert this concept into a high-retention, hyper-engaging exactly 5-7 second TikTok/Instagram Reel script. Output format: [ON-SCREEN TEXT] <text> [B-ROLL / VISUAL ACTION] <description> [CAPTION] <caption>`,
      '15sec': `You are an expert short-form reel scriptwriter. Convert this concept into an engaging 15-second TikTok/Instagram Reel script. Output format: [HOOK (0-3s)] <text/audio> [VALUE/BODY (3-12s)] <text/audio> [CTA (12-15s)] <text/audio>`,
      '30sec': `You are an expert short-form reel scriptwriter. Convert this concept into a 30-second rapid-fire tutorial/insight script. Include camera angle directions, timestamps, hook, and exact word-for-word spoken audio.`,
      '60sec': `You are an expert long-form Reel/Shorts scriptwriter. Convert this concept into a 60-second deep-dive engaging script designed for maximum retention. Include timestamps (every 5-10s), camera angles/hooks, and the exact spoken script word-for-word.`,
      'carousel5': `You are an expert LinkedIn/Instagram Carousel creator. Convert this concept into a highly viral exactly 5-slide carousel. Output format: [SLIDE 1 - HOOK] <text> [SLIDE 2 - PROBLEM] <text> ... [SLIDE 5 - CTA] <text>`,
      'carousel10': `You are an expert LinkedIn/Instagram Carousel creator. Convert this concept into an in-depth 10-slide carousel. Output format: [SLIDE 1 - HOOK] <text> ... [SLIDE 10 - CTA] <text>`
    };

    const targetPrompt = systemPrompts[format] || systemPrompts['15sec'];

    const { text } = await generateWithWebSearch({
      system: targetPrompt,
      prompt: `Write the viral script specifically focused on executing this exact concept:\n\n${concept}`
    });

    return NextResponse.json({ script: text || 'Failed to generate.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
