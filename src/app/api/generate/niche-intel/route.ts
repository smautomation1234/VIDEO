import { NextResponse } from 'next/server';
import { webSearch, fetchRSSContext } from '@/lib/web-search';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche') || 'Fitness';
    const platform = searchParams.get('platform') || 'TikTok';

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const apiKey = process.env.OPENAI_API_KEY || '';

    // Fetch live web data for this niche
    let liveContext = '';
    const webResult = await webSearch(
      `What are the current viral trends, trending hashtags, trending audio, and top content formats for ${niche} creators on ${platform} right now? Today is ${today}.`,
      apiKey
    );
    if (webResult.summary) {
      liveContext = webResult.summary;
    } else {
      const rssData = await fetchRSSContext([`${niche} trending ${platform}`, `${niche} viral`]);
      if (rssData) liveContext = `Latest news:\n- ${rssData}`;
    }

    const systemPrompt = `You are a viral content data scientist with access to real-time web data. Output ONLY valid JSON. No markdown, no code blocks.`;

    const userPrompt = `Today is ${today}. Analyze the "${niche}" niche on ${platform} and output a comprehensive viral intelligence report.

${liveContext ? `LIVE WEB SEARCH DATA (use this as primary source):\n${liveContext}\n` : ''}

Output a single JSON object with this exact structure:
{
  "nicheOverview": {
    "avgViralViews": 2400000,
    "topPostViews": 18000000,
    "avgEngagementRate": "7.2%",
    "contentVelocity": "High",
    "competitionLevel": "Medium",
    "opportunityScore": 82,
    "bestDayToPost": "Tuesday",
    "bestTimeToPost": "6:45 PM",
    "peakSeason": "Q1 & Q4",
    "risingKeyword": "one trending keyword for this niche"
  },
  "hookPatterns": [
    {
      "rank": 1,
      "template": "I [action] for [timeframe]. Day [X] changed everything...",
      "trigger": "Curiosity Gap",
      "avgViews": 3200000,
      "successRate": 87,
      "example": "I meal-prepped for 30 days straight. Day 12 changed everything...",
      "why": "Creates open loop that forces completion"
    },
    {
      "rank": 2,
      "template": "POV: You [relatable situation] and now [unexpected outcome]",
      "trigger": "Relatability",
      "avgViews": 2800000,
      "successRate": 81,
      "example": "POV: You skipped the gym for a week and now can't stop",
      "why": "Second-person creates immediate identification"
    },
    {
      "rank": 3,
      "template": "Nobody talks about [secret/fact] in [niche]",
      "trigger": "Contrarian/Exclusive",
      "avgViews": 2200000,
      "successRate": 78,
      "example": "Nobody talks about this protein timing mistake in fitness",
      "why": "Positions creator as insider with forbidden knowledge"
    },
    {
      "rank": 4,
      "template": "Stop [common behavior]. Do THIS instead.",
      "trigger": "Authority + Urgency",
      "avgViews": 1900000,
      "successRate": 74,
      "example": "Stop counting calories. Do THIS instead.",
      "why": "Challenges existing behavior — high comment disagreement = high reach"
    },
    {
      "rank": 5,
      "template": "[Number] things I wish I knew before [starting/doing X]",
      "trigger": "Value + Regret",
      "avgViews": 1600000,
      "successRate": 71,
      "example": "5 things I wish I knew before starting my fitness journey",
      "why": "Implied shortcut for the viewer's future journey"
    }
  ],
  "trendingFormats": [
    {
      "format": "Transformation Before/After",
      "shareOfViral": 28,
      "avgViews": 4100000,
      "trend": "RISING",
      "trendColor": "#D97706",
      "editingStyle": "Fast cuts with dramatic music drop",
      "idealLength": "15-20 sec"
    },
    {
      "format": "Tutorial / How-To",
      "shareOfViral": 22,
      "avgViews": 2900000,
      "trend": "STABLE",
      "trendColor": "#059669",
      "editingStyle": "Text overlays with step numbers",
      "idealLength": "30-45 sec"
    },
    {
      "format": "POV Story",
      "shareOfViral": 19,
      "avgViews": 3500000,
      "trend": "HOT",
      "trendColor": "#DC2626",
      "editingStyle": "Single shot, emotional voiceover",
      "idealLength": "20-30 sec"
    },
    {
      "format": "Reaction / Commentary",
      "shareOfViral": 14,
      "avgViews": 2100000,
      "trend": "NEW",
      "trendColor": "#7C3AED",
      "editingStyle": "Split screen or green screen",
      "idealLength": "40-60 sec"
    }
  ],
  "trendingHashtags": [
    { "tag": "tag1", "weeklyGrowth": "+340%", "uses": "2.1M", "opportunity": "High" },
    { "tag": "tag2", "weeklyGrowth": "+210%", "uses": "890K", "opportunity": "High" },
    { "tag": "tag3", "weeklyGrowth": "+95%", "uses": "4.2M", "opportunity": "Medium" },
    { "tag": "tag4", "weeklyGrowth": "+60%", "uses": "8.7M", "opportunity": "Medium" },
    { "tag": "tag5", "weeklyGrowth": "+44%", "uses": "12.4M", "opportunity": "Low" },
    { "tag": "tag6", "weeklyGrowth": "+28%", "uses": "22.1M", "opportunity": "Low" }
  ],
  "trendingAudio": [
    { "name": "audio name 1", "uses": "680K", "trend": "EXPLODING", "vibe": "Motivational/Dramatic" },
    { "name": "audio name 2", "uses": "340K", "trend": "RISING", "vibe": "Upbeat/Fun" },
    { "name": "audio name 3", "uses": "1.2M", "trend": "PEAK", "vibe": "Chill/Ambient" }
  ],
  "topicClusters": [
    { "topic": "cluster topic 1", "viralScore": 91, "saturation": "Low", "posts7d": 1240 },
    { "topic": "cluster topic 2", "viralScore": 86, "saturation": "Medium", "posts7d": 4800 },
    { "topic": "cluster topic 3", "viralScore": 79, "saturation": "Low", "posts7d": 890 },
    { "topic": "cluster topic 4", "viralScore": 74, "saturation": "High", "posts7d": 18200 },
    { "topic": "cluster topic 5", "viralScore": 68, "saturation": "Medium", "posts7d": 6700 }
  ],
  "viralFormula": "One paragraph describing the winning formula for viral content in this specific niche — what combination of hook + format + audio + timing produces the most viral results with data-backed reasoning.",
  "quickWins": [
    "Actionable quick win tip 1 specific to this niche",
    "Actionable quick win tip 2 specific to this niche",
    "Actionable quick win tip 3 specific to this niche",
    "Actionable quick win tip 4 specific to this niche"
  ]
}

Make all data SPECIFIC and REALISTIC for the "${niche}" niche on ${platform}. Use real-sounding hashtags, audio names, topics, and numbers. Do not use placeholder text.`;

    const aiResponse = await generateWithWebSearch({ system: systemPrompt, prompt: userPrompt, apiKey });

    const content = aiResponse.text || '{}';
    let data: any = {};
    try { data = JSON.parse(content); } catch (e) {}

    return NextResponse.json({ ...data, niche, platform, generatedAt: new Date().toISOString() });

  } catch (error: any) {
    console.error('Niche intel error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate intelligence' }, { status: 500 });
  }
}
