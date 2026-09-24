import { NextResponse } from 'next/server';
import { UniversalPatternAnalyzer } from '../../../../lib/analyzer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const niche = searchParams.get('niche');

    if (!niche) {
      return NextResponse.json({ error: 'Niche required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ hot_hooks: [], quick_ideas: [], pipeline_count: 0 });
    }

    const analyzer = new UniversalPatternAnalyzer();
    
    // Get real-time trending data
    const trending = await analyzer.get_trending_now(niche, 24);

    return NextResponse.json({
      niche,
      updated_at: new Date().toISOString(),
      ...trending
    });

  } catch (error: any) {
    console.error('Trending API error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
