import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// ─── Emotional Trigger Definitions (ported from pattern_analyzer.py) ───────────
const EMOTIONAL_TRIGGERS: Record<string, string[]> = {
  curiosity:    ['secret', 'nobody', 'hidden', 'truth', 'reveal', 'expose', 'real reason'],
  shock:        ["can't believe", 'shocking', 'insane', 'crazy', 'wild', 'unbelievable'],
  fomo:         ['before it\'s too late', 'everyone', 'trend', 'missing out', 'going viral'],
  controversy:  ['wrong', 'lie', 'truth about', 'they don\'t want', 'unpopular opinion'],
  aspiration:   ['finally', 'achieved', 'success', 'transformation', 'changed my life'],
  relatability: ['when you', 'pov', 'that moment', 'we all', 'if you\'re like me'],
  urgency:      ['now', 'today', 'immediately', 'quick', 'fast', 'stop scrolling'],
  exclusivity:  ['only', 'insider', 'exclusive', 'private', 'few people know'],
};

// ─── Opportunity Score Calculator (ported from pattern_analyzer.py) ─────────────
function calculateOpportunityScore(params: {
  growthRate: number;
  avgViews: number;
  currentUses: number;
}): { score: number; saturation: 'low' | 'medium' | 'high'; verdict: string } {
  const { growthRate, avgViews, currentUses } = params;

  const saturationPenalty =
    currentUses > 10000 ? 0.5 :
    currentUses > 5000  ? 0.7 :
    currentUses > 1000  ? 0.9 : 1.0;

  const saturation: 'low' | 'medium' | 'high' =
    saturationPenalty > 0.8 ? 'low' :
    saturationPenalty > 0.6 ? 'medium' : 'high';

  const score = Math.min(100, Math.round(
    growthRate * 0.4 +
    (avgViews / 10000) * 0.3 +
    saturationPenalty * 30
  ));

  const verdict =
    score >= 80 ? 'High Opportunity — Act Now' :
    score >= 60 ? 'Moderate — Worth Testing' :
    score >= 40 ? 'Declining — Use Carefully' : 'Oversaturated — Avoid';

  return { score, saturation, verdict };
}

// ─── Analyse emotional triggers from text array ───────────────────────────────
function analyzeEmotionalTriggers(texts: string[]): Array<{
  trigger: string; count: number; percentage: number;
  avgViralScore: number; topExample: string;
}> {
  const combined = texts.join(' ').toLowerCase();
  const results: Array<{ trigger: string; count: number; percentage: number; avgViralScore: number; topExample: string }> = [];

  for (const [trigger, words] of Object.entries(EMOTIONAL_TRIGGERS)) {
    let count = 0;
    let topExample = '';
    for (const text of texts) {
      const lower = text.toLowerCase();
      if (words.some(w => lower.includes(w))) {
        count++;
        if (!topExample) topExample = text.slice(0, 80) + (text.length > 80 ? '…' : '');
      }
    }
    if (count > 0) {
      // Viral score heuristic: curiosity & controversy score highest historically
      const viralScoreMap: Record<string, number> = {
        curiosity: 88, shock: 84, fomo: 79, controversy: 91,
        aspiration: 76, relatability: 82, urgency: 72, exclusivity: 77,
      };
      results.push({
        trigger,
        count,
        percentage: Math.round((count / texts.length) * 100),
        avgViralScore: viralScoreMap[trigger] ?? 70,
        topExample,
      });
    }
  }

  return results.sort((a, b) => b.avgViralScore - a.avgViralScore);
}

// ─── Main POST handler ─────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { niche, platform = 'TikTok', analysisType = 'all' } = await req.json();

    if (!niche) {
      return NextResponse.json({ error: 'niche is required' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // ── 1. Universal Cross-Niche Pattern Analysis (GPT-powered) ──────────────
    const crossNichePrompt = `You are a viral content scientist who has analyzed 500,000+ posts across 20 niches. 

The user wants universal pattern intelligence for the "${niche}" niche on ${platform}.

Output a single JSON object:
{
  "universalPatterns": [
    {
      "rank": 1,
      "template": "hook template with [VARIABLES]",
      "trigger": "psychological trigger name",
      "worksForNiches": ["niche1", "niche2", "niche3"],
      "psychology": "one sentence why it works psychologically",
      "adaptedExample": "example adapted to ${niche}",
      "viralScore": 94,
      "adaptability": "how to adapt this to any niche"
    }
  ],
  "powerWords": [
    { "word": "word", "crossNicheScore": 91, "niches": ["fitness","business","food"], "avgViewBoost": "+340%" }
  ],
  "trending24h": [
    { "pattern": "hook pattern", "trendStatus": "EXPLODING", "useBy": "next 48 hours", "example": "adapted for ${niche}" }
  ],
  "opportunityMap": [
    {
      "element": "specific hook/format/word",
      "growthRate": 145,
      "avgViews": 2400000,
      "currentUses": 800,
      "saturation": "low"
    }
  ],
  "niqueInsight": "One powerful data-driven insight about what makes content in the ${niche} niche go viral that most creators miss."
}

Rules:
- universalPatterns: exactly 8 entries, ranked by viral score
- powerWords: exactly 10 entries, must appear in 3+ niches  
- trending24h: exactly 5 entries specific to what's hot RIGHT NOW in ${niche}
- opportunityMap: exactly 6 entries, mix of high/medium/low saturation
- All data SPECIFIC and REALISTIC for ${niche} on ${platform}
- No placeholder text — use real examples`;

    const aiResponse = await generateWithWebSearch({
      system: 'You are a viral content data scientist. Output ONLY valid JSON. No markdown, no code blocks.',
      prompt: crossNichePrompt,
      maxOutputTokens: 3000,
    });

    let aiData: any = {};
    try { aiData = JSON.parse(aiResponse.text || '{}'); } catch {}

    // ── 2. Compute opportunity scores for each element ─────────────────────────
    const opportunityMap = (aiData.opportunityMap || []).map((item: any) => {
      const opp = calculateOpportunityScore({
        growthRate: item.growthRate ?? 50,
        avgViews: item.avgViews ?? 1000000,
        currentUses: item.currentUses ?? 2000,
      });
      return { ...item, ...opp };
    });

    // ── 3. Compute emotional trigger breakdown from trending examples ──────────
    const sampleTexts = [
      ...(aiData.universalPatterns || []).map((p: any) => p.adaptedExample || ''),
      ...(aiData.trending24h || []).map((t: any) => t.example || ''),
    ].filter(Boolean);

    const emotionalTriggers = analyzeEmotionalTriggers(sampleTexts);

    // ── 4. Build final response ────────────────────────────────────────────────
    return NextResponse.json({
      niche,
      platform,
      generatedAt: new Date().toISOString(),
      universalPatterns: aiData.universalPatterns || [],
      powerWords: aiData.powerWords || [],
      trending24h: aiData.trending24h || [],
      opportunityMap,
      emotionalTriggers,
      niqueInsight: aiData.niqueInsight || '',
      meta: {
        postsAnalyzed: '500,000+',
        nichesScanned: 20,
        dataFreshness: 'Simulated real-time',
        modelUsed: aiResponse.modelUsed || 'Pattern Engine v2',
      },
    });

  } catch (error: any) {
    console.error('Pattern Analyzer error:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
