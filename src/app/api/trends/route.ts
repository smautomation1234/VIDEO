import { NextResponse } from 'next/server';
import { runChatGPTWebSearchAgent, AGENT_CATEGORIES, TrendRegion } from '@/lib/trend-agent';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;

const TREND_CACHE_TTL = 10 * 60 * 1000;
const trendCache = new Map<string, { expiresAt: number; payload: Record<string, unknown> }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category') || 'marketing';
    const platform = searchParams.get('platform') || 'all';
    const mode = searchParams.get('mode') || 'topics'; // 'topics' or 'audio'
    const customNiche = (searchParams.get('niche') || '').trim();
    const region: TrendRegion = searchParams.get('region') === 'world' ? 'world' : 'india';

    const cacheKey = [categoryId, platform, mode, customNiche.toLowerCase(), region].join('|');
    const cached = trendCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ ...cached.payload, cacheStatus: 'fresh-cache' }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60' } });
    }

    const result = await runChatGPTWebSearchAgent(categoryId, process.env.OPENAI_API_KEY || '', platform, mode, customNiche, region);
    const cat = AGENT_CATEGORIES.find(c => c.id === categoryId);
    const isNews = categoryId === 'news' && !customNiche;
    const payload = {
      ...result,
      category: isNews ? (region === 'india' ? 'India News' : 'World News') : (customNiche || cat?.label || categoryId),
      categoryColor: isNews ? (region === 'india' ? '#ea580c' : '#2563eb') : (customNiche ? '#7c3aed' : (cat?.color || '#10b981')),
      categoryIcon: isNews ? (region === 'india' ? '🇮🇳' : '🌍') : (customNiche ? '🎯' : (cat?.icon || '📡')),
      region,
      isRealData: true,
      fetchedAt: new Date().toISOString(),
    };
    trendCache.set(cacheKey, { expiresAt: Date.now() + TREND_CACHE_TTL, payload });
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60' } });
  } catch (err: any) {
    console.error('Trend agent error:', err);
    return NextResponse.json({ error: err.message || 'Agent failed to run' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ categories: AGENT_CATEGORIES });
}
