/**
 * UniversalPatternAnalyzer
 * Extracts real-time trending patterns for any niche using live web search.
 */

import { webSearch, fetchRSSContext } from './web-search';
import { generateWithWebSearch } from '@/lib/ai';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HotHook {
  pattern: string;
  score: number;
  usage_count: number;
  growth_rate: number;
  deadline: string;
  trigger: string;
  platform: string;
  example: string;
}

export interface QuickIdea {
  topic: string;
  angle: string;
  estimated_views: string;
  difficulty: string;
}

export interface NichePulse {
  momentum: string;
  saturation: string;
  best_platform: string;
  top_format: string;
  weekly_change: string;
}

export interface TrendingData {
  hot_hooks: HotHook[];
  quick_ideas: QuickIdea[];
  niche_pulse: NichePulse;
}

// ─── Analyzer Class ───────────────────────────────────────────────────────────

export class UniversalPatternAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  /**
   * Retrieves real-time trending data for a specific niche using live web search.
   */
  async get_trending_now(niche: string, timeframeHours: number = 24): Promise<TrendingData> {
    if (!niche) throw new Error('Niche is required');
    if (!this.apiKey) throw new Error('OPENAI_API_KEY is not configured');

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // Step 1: Fetch live web context
    let liveContext = '';
    const webResult = await webSearch(
      `What are the top viral content trends, hooks, and formats for "${niche}" creators on TikTok, Instagram, and YouTube right now? Today is ${today}. Last ${timeframeHours} hours.`,
      this.apiKey
    );

    if (webResult.summary) {
      liveContext = webResult.summary;
    } else {
      const rssData = await fetchRSSContext([`${niche} trending`, `${niche} viral content`]);
      if (rssData) liveContext = `Latest news:\n- ${rssData}`;
    }

    const systemPrompt = 'You are a viral trend intelligence engine. Output ONLY valid JSON, no markdown.';

    const userPrompt = `Today is ${today}. Generate a real-time trend report for the "${niche}" niche on social media (TikTok, Instagram, YouTube) based on the last ${timeframeHours} hours.

${liveContext ? `LIVE WEB SEARCH DATA:\n${liveContext}\n\nUse this real data as the basis for your report.` : ''}

Return this exact JSON:
{
  "hot_hooks": [
    {
      "pattern": "hook text using a proven pattern for ${niche} — based on current trends",
      "score": 91,
      "usage_count": 4200,
      "growth_rate": 340,
      "deadline": "Next 48 hours",
      "trigger": "Curiosity Gap",
      "platform": "TikTok",
      "example": "e.g. Nobody tells you the truth about [specific current ${niche} topic from the web data]"
    }
  ],
  "quick_ideas": [
    {
      "topic": "specific viral topic in ${niche} — based on current trends",
      "angle": "educational",
      "estimated_views": "200K–800K",
      "difficulty": "easy"
    }
  ],
  "niche_pulse": {
    "momentum": "rising",
    "saturation": "medium",
    "best_platform": "TikTok",
    "top_format": "Tutorial Breakdown",
    "weekly_change": "+28%"
  }
}

Requirements:
- Provide exactly 4 hot_hooks, sorted by score desc
- Provide exactly 5 quick_ideas
- All hooks and ideas must reference actual current topics from the web data
- Scores between 75-97
- Usage counts between 800-12000
- Growth rates between 120-890 (%)
- Deadlines: "Next 24 hours", "Next 48 hours", or "Next 72 hours"
- Triggers: one of Curiosity Gap, Contrarian, Social Proof, POV, Pain Point, Transformation`;

    const aiResponse = await generateWithWebSearch({
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 2500,
    });

    const raw = aiResponse.text || '{}';
    let data: any = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      data = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (_) {
      // Fallback handled below
    }

    return {
      hot_hooks: data.hot_hooks || [],
      quick_ideas: data.quick_ideas || [],
      niche_pulse: data.niche_pulse || {
        momentum: 'unknown',
        saturation: 'unknown',
        best_platform: 'unknown',
        top_format: 'unknown',
        weekly_change: '0%',
      },
    };
  }
}
