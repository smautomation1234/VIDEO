import { NextResponse } from 'next/server';
import { generateWithWebSearch } from "@/lib/ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { niche, platform, currentDate } = await request.json();
    if (!niche) return NextResponse.json({ error: 'Niche is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    const today = currentDate || new Date().toISOString().split('T')[0];

    const prompt = `You are a professional content strategist generating a Weekly Content Intelligence Report.

CREATOR DETAILS:
- Niche: ${niche}
- Primary Platform: ${platform || 'LinkedIn + Instagram + YouTube'}
- Report Date: ${today}

Generate a complete, specific, actionable Weekly Content Intelligence Report. Be highly specific — use real topic types that would actually be trending in this niche.

Return ONLY valid JSON:
{
  "weekOf": "${today}",
  "niche": "${niche}",
  "section1_trending": [
    {
      "topic": "specific trending topic name",
      "urgencyScore": 9,
      "competition": "Low | Medium | High",
      "recommendedAngle": "your unique angle for this topic",
      "platform": "LinkedIn | Instagram | YouTube | TikTok | All",
      "whyTrending": "1 sentence explaining why this is hot right now",
      "postBy": "Today | This Week | This Month"
    }
  ],
  "section2_rising": [
    {
      "topic": "rising topic name",
      "momentum": "gaining momentum description",
      "saturationLevel": "Low | Medium",
      "windowOfOpportunity": "how long you have to capitalize on this",
      "bestPlatform": "platform recommendation"
    }
  ],
  "section3_declining": [
    {
      "topic": "declining topic name",
      "reason": "why it peaked and is now declining",
      "peakedWhen": "last week | last month"
    }
  ],
  "section4_bigOpportunity": {
    "topic": "THE single best topic to post this week",
    "hook": "the hook to use",
    "angle": "unique angle",
    "titleSuggestion": "a full video/post title",
    "whyNow": "why this specific week is the right time",
    "platform": "best platform",
    "expectedPerformance": "expected reach/engagement outcome",
    "contentBrief": "3-4 sentence content brief — what to cover and how"
  },
  "section5_calendar": [
    { "day": "Monday", "topic": "specific topic", "platform": "platform", "format": "Reel | Carousel | LinkedIn Post | YouTube Video | Thread", "hook": "opening hook idea" },
    { "day": "Tuesday", "topic": "specific topic", "platform": "platform", "format": "format", "hook": "opening hook idea" },
    { "day": "Wednesday", "topic": "specific topic", "platform": "platform", "format": "format", "hook": "opening hook idea" },
    { "day": "Thursday", "topic": "specific topic", "platform": "platform", "format": "format", "hook": "opening hook idea" },
    { "day": "Friday", "topic": "specific topic", "platform": "platform", "format": "format", "hook": "opening hook idea" },
    { "day": "Saturday", "topic": "specific topic", "platform": "platform", "format": "format", "hook": "opening hook idea" },
    { "day": "Sunday", "topic": "specific topic", "platform": "platform", "format": "format", "hook": "opening hook idea" }
  ]
}`;

    const { text } = await generateWithWebSearch({ prompt, apiKey });

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse AI response');
      result = JSON.parse(jsonMatch[0]);
    }
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Weekly report error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate report' }, { status: 500 });
  }
}
