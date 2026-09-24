import { NextResponse } from 'next/server';
import { runEvergreenResearch, type EvergreenPlatform, type EvergreenResearchResult } from '@/lib/evergreen-research';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;

const EVERGREEN_CACHE_TTL = 6 * 60 * 60 * 1000;
const evergreenCache = new Map<string, { expiresAt: number; result: EvergreenResearchResult }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const niche = String(body.niche || '').trim();
    const platform = String(body.platform || 'youtube') as EvergreenPlatform;
    if (niche.length < 2) return NextResponse.json({ error: 'Enter a niche with at least 2 characters.' }, { status: 400 });
    if (!['youtube', 'instagram', 'linkedin', 'x'].includes(platform)) {
      return NextResponse.json({ error: 'Unsupported publishing platform.' }, { status: 400 });
    }
    const cacheKey = `${niche.toLowerCase()}|${platform}`;
    const cached = evergreenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ ...cached.result, cacheStatus: 'fresh-cache' }, { headers: { 'Cache-Control': 'private, max-age=600' } });
    }
    const result = await runEvergreenResearch(niche.slice(0, 100), platform);
    evergreenCache.set(cacheKey, { expiresAt: Date.now() + EVERGREEN_CACHE_TTL, result });
    return NextResponse.json({ ...result, cacheStatus: 'live-scan' }, { headers: { 'Cache-Control': 'private, max-age=600' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Evergreen research failed.';
    console.error('Evergreen research error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
