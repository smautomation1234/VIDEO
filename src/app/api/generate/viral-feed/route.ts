import { NextResponse } from 'next/server';
import { generateWithWebSearch } from "@/lib/ai";
import { webSearch, fetchRSSContext } from '@/lib/web-search';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche') || 'Fitness';
    const platform = searchParams.get('platform') || 'TikTok';

    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ posts: [], niche, platform });
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Fetch live web data
    let liveContext = '';
    const webResult = await webSearch(
      `What are the top 8 most viral ${niche} posts, hooks, and content ideas going viral on ${platform} right now? Today is ${today}. Include specific post ideas, hooks used, and why they are getting millions of views.`,
      apiKey
    );
    if (webResult.summary) {
      liveContext = webResult.summary;
    } else {
      const rssData = await fetchRSSContext([`${niche} viral ${platform}`, `${niche} trending`]);
      if (rssData) liveContext = `Trending now:\n- ${rssData}`;
    }

    const prompt = `Today is ${today}. You are a viral content intelligence engine.

${liveContext ? `LIVE WEB SEARCH DATA:\n${liveContext}\n` : ''}

Based on this real web data, generate 8 viral post ideas for "${niche}" on ${platform} that mirror what is actually performing right now.

Return a JSON object with a "posts" array. Each post:
{
  "id": "post_N",
  "creator": "@realistic_username",
  "title": "Catchy viral title based on current trends",
  "topic": "Topic category",
  "caption": "Full post caption (with emojis and hashtags) based on what is actually trending",
  "hook": "The opening hook line that makes people stop scrolling",
  "script": ["Hook line", "Body point 1", "Payoff/reveal", "CTA"],
  "style": "Visual/editing style description",
  "views": 2400000,
  "likes": 180000,
  "comments": 8400,
  "shares": 45000,
  "viralScore": 91,
  "format": "Tutorial or POV Story or Listicle or Transformation or Reaction",
  "audio": "Trending audio name",
  "hashtags": ["tag1", "tag2", "tag3"],
  "postedAgo": "2h ago",
  "trend": "🔥 HOT or ⚡ RISING or 📈 PEAK or ✨ NEW",
  "trendColor": "#DC2626 or #D97706 or #7C3AED or #059669"
}

Return ONLY valid JSON. Make every post feel like it is actually going viral RIGHT NOW based on the web search data.`;

    const aiResult = await generateWithWebSearch({ prompt });

    const content = aiResult.text || '{"posts":[]}';
    let data: any = { posts: [] };
    try {
      data = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) { try { data = JSON.parse(jsonMatch[0]); } catch {} }
    }

    const posts = Array.isArray(data.posts) ? data.posts : [];

    return NextResponse.json({ posts, niche, platform });
  } catch (error: any) {
    console.error('Viral feed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
