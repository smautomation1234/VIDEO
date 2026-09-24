import { NextResponse } from 'next/server';
import { webSearch, fetchRSSContext } from '@/lib/web-search';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    const { topic, platform, followerCount, niche } = await request.json();
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let liveContext = '';
    const webResult = await webSearch(
      `What are the most viral and trending hashtags right now for "${topic}" in the "${niche || 'General'}" niche on ${platform}? Today is ${today}. Include specific tags that are getting high reach.`,
      apiKey
    );
    if (webResult.summary) {
      liveContext = webResult.summary;
    } else {
      const rssData = await fetchRSSContext([`${topic} trending hashtags ${platform}`, `${niche} hashtags ${platform}`]);
      if (rssData) liveContext = `Trending now:\n- ${rssData}`;
    }

    const prompt = `You are a social media SEO specialist and hashtag strategist. Today is ${today}.

POST DETAILS:
- Topic: ${topic}
- Platform: ${platform} (2026 Algorithm)
- Current Following: ${followerCount || 'Under 10K'}
- Niche: ${niche || 'General'}

${liveContext ? `LIVE WEB SEARCH DATA (Use these real trending hashtags):\n${liveContext}\n` : ''}

Generate a STRATEGIC hashtag system with 4 tiers:

TIER 1 — NICHE HASHTAGS: 5 hashtags with under 500K posts — high relevance, can actually RANK here
TIER 2 — MID HASHTAGS: 5 hashtags with 500K to 2M posts — balance reach and competition
TIER 3 — BROAD HASHTAGS: 3 hashtags with 2M+ posts — maximum exposure, harder to rank
TIER 4 — KEYWORD HASHTAGS: 3 hashtags that are search-based terms people actually TYPE to find content

For EACH hashtag include:
- tag: the hashtag (with #)
- estimatedPosts: approximate post count as a string like "240K" or "1.2M"
- relevance: why it fits this content (1 sentence)
- rankingProbability: "High" | "Medium" | "Low" based on account size
- tier: 1 | 2 | 3 | 4

Also provide:
- finalMix: The best 5-8 hashtags to use together (one from each tier mixed strategically)
- strategy: 2-3 sentences explaining the logic behind the selection
- postingTip: One actionable tip for using these hashtags on Instagram in 2026
- avoidList: 3 hashtags in this niche that are oversaturated and should be avoided

Return ONLY valid JSON:
{
  "hashtags": [
    {
      "tag": "#example",
      "estimatedPosts": "240K",
      "relevance": "why it fits",
      "rankingProbability": "High",
      "tier": 1
    }
  ],
  "finalMix": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "strategy": "explanation of the selection logic",
  "postingTip": "actionable tip",
  "avoidList": ["#oversaturated1", "#oversaturated2", "#oversaturated3"]
}`;

    const { text } = await generateWithWebSearch({ prompt, apiKey });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Hashtag lab error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate hashtags' }, { status: 500 });
  }
}
