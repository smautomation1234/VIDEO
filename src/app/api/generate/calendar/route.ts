import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;

export async function POST(request: Request) {
  try {
    const { mode, niche, platforms, frequency, pillars, month, year } = await request.json();
    if (!niche) return NextResponse.json({ error: 'Niche is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    let prompt = '';

    if (mode === 'trial-reels') {
      prompt = `You are an elite Instagram Strategist.
Your task is to create a "Trial Reels Strategy" for a creator in the ${niche} niche.
The goal is to test 5 specific Reels angles to see what the Instagram algorithm rewards.

Provide a 5-Reel Trial Strategy to execute this week.

Return ONLY a valid JSON object:
{
  "theme": "The 5-Reel Trial Strategy for ${niche}",
  "summary": "Why we are testing these specific 5 angles and how to measure success.",
  "posts": [
    {
      "date": "Reel 1: The Broad Appeal",
      "platform": "Instagram",
      "topic": "Topic designed for maximum reach",
      "contentType": "⚡ Trending / Reach",
      "hookIdea": "The exact hook to use",
      "titleDraft": "Concept/Angle",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "bestPostTime": "When to post",
      "primaryGoal": "Views & non-follower reach",
      "color": "#ec4899"
    }
    // Generate exactly 5 Reels with different strategic goals:
    // Reel 2: The Deep Niche (Authority)
    // Reel 3: The Controversial/Hot Take (Engagement)
    // Reel 4: The Story/Vulnerability (Connection)
    // Reel 5: The Direct Pitch/CTA (Conversion)
  ]
}`;
    } else {
      prompt = `You are an elite social media manager.
Create a full 30-day content calendar for the month of ${month} ${year}.
Niche: ${niche}
Platform: Instagram (2026 Strategy)
Frequency: ${frequency} (e.g. Daily, 3x a week)
Content Pillars: ${pillars}

Your goal is to build a cohesive monthly strategy.
1. Provide a "Monthly Theme" that ties the content together.
2. Generate a calendar entry for each post according to the frequency (e.g., if Daily, generate ~30 posts. If 3x a week, generate ~12-14 posts).
3. Assign each post to specific dates in ${month} ${year}.

For EACH post, provide:
- date: (YYYY-MM-DD format)
- platform: which platform is this best for
- topic: The core topic
- contentType: ⚡ Trending, 🌲 Evergreen, or 💬 Engagement
- hookIdea: A specific hook to start the post
- titleDraft: A draft title or headline
- hashtags: array of 5 hashtags
- bestPostTime: e.g. "9:00 AM EST"
- primaryGoal: e.g. "Growth", "Lead Gen", "Community"
- color: A hex color code for UI display (e.g., #3b82f6 for Evergreen, #ef4444 for Trending)

Return ONLY a valid JSON object:
{
  "theme": "The overarching monthly theme",
  "summary": "2-3 sentences explaining the strategy",
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "platform": "Instagram",
      "topic": "Core topic",
      "contentType": "🌲 Evergreen",
      "hookIdea": "The hook",
      "titleDraft": "The headline",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "bestPostTime": "9:00 AM EST",
      "primaryGoal": "Lead Gen",
      "color": "#10b981"
    }
  ]
}
`;
    }

    const { text } = await generateWithWebSearch({ prompt, apiKey });

    let rawText = text || '{}';
    let result: any = {};
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    try {
      result = JSON.parse(cleaned);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try { result = JSON.parse(match[0]); } catch {}
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Calendar generation failed' }, { status: 500 });
  }
}
