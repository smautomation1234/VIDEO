/**
 * UniversalContentGenerator
 * TypeScript equivalent of the Python generator — encapsulates all viral
 * intelligence logic so any API route can call generate_for_any_niche().
 */

import { generateWithWebSearch } from '@/lib/ai';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Hook {
  text: string;
  score: number;
  pattern: string;
  why: string;
}

export interface HashtagSet {
  trending: string[];
  niche: string[];
  broad: string[];
  all: string[];
}

export interface FormatGuide {
  style: string;
  length: string;
  shots: string[];
  editTips: string[];
  whyItWorks: string;
  trendingSignals: string[];
}

export interface AudioRec {
  primary: string;
  primaryUses: string;
  alternative: string;
  audioReason: string;
}

export interface CrossNicheInsight {
  niche: string;
  approach: string;
  views: string;
  lesson: string;
}

export interface AdaptationGuide {
  tiktok: string;
  instagram: string;
  youtube: string;
  keepForAll: string;
}

export interface OpportunityAnalysis {
  score: number;
  verdict: string;
  reason: string;
  saturation: string;
  growthRate: string;
  recommendation: string;
}

export interface ViewPrediction {
  min: number;
  max: number;
  likely: number;
  engagement: string;
}

export interface PostingStrategy {
  today: string;
  tomorrow: string;
  reason: string;
  preTactics: string[];
  postTactics: string[];
}

export interface GeneratedContent {
  caption: string;
  hooks: Hook[];
  hashtags: HashtagSet;
  format: FormatGuide;
  audio: AudioRec;
  trendingElements: string[];
  crossNicheInsights: CrossNicheInsight[];
  adaptationGuide: AdaptationGuide;
  opportunityAnalysis: OpportunityAnalysis;
  viralScore: number;
  predictions: ViewPrediction;
  timing: PostingStrategy;
  platform: string;
  topic: string;
  niche: string;
  generatedAt: string;
}

// ─── Universal Patterns (mirrors Python UNIVERSAL_PATTERNS dict) ──────────────

const UNIVERSAL_PATTERNS = [
  { template: 'Stop doing [X] if you want [Y]',                        trigger: 'Contrarian',    score: 94 },
  { template: 'Nobody tells you that [surprising truth about X]',       trigger: 'Curiosity Gap', score: 93 },
  { template: "I tried [X] for 30 days — here's what happened",        trigger: 'Social Proof',  score: 91 },
  { template: 'POV: You finally figured out [X]',                      trigger: 'Relatability',  score: 89 },
  { template: "The [X] secret [authority] doesn't want you to know",   trigger: 'Conspiracy',    score: 88 },
  { template: '[N] things I wish I knew before [X]',                   trigger: 'Value/Regret',  score: 87 },
  { template: 'This changed everything about how I [X]',               trigger: 'Transformation',score: 86 },
  { template: 'Why [common belief about X] is completely wrong',       trigger: 'Shock',         score: 84 },
  { template: "The reason you're not getting [result] yet",            trigger: 'Pain Point',    score: 83 },
  { template: 'How [unexpected person] does [X] differently',          trigger: 'Curiosity',     score: 82 },
];

// ─── Scoring & Predictions ────────────────────────────────────────────────────

function calculateViralScore(
  hooks: Hook[],
  hashtags: string[],
  format: Partial<FormatGuide>,
  platform: string,
  crossNicheInsights: CrossNicheInsight[],
): number {
  let score = 0;

  // Hook quality — 35 pts
  const firstHook = hooks[0]?.text || '';
  const triggerWords = ['secret','nobody','hidden','truth','finally','actually','stop','pov','why','how','never','this'];
  if (triggerWords.some(w => firstHook.toLowerCase().includes(w))) score += 12;
  const wc = firstHook.split(' ').length;
  if (wc >= 5 && wc <= 18) score += 8;
  if (/\d/.test(firstHook)) score += 7;
  score += Math.min(hooks[0]?.score || 0, 8);

  // Trend alignment — 25 pts
  const hasTrendSignals = (format?.trendingSignals?.length || 0) > 0;
  score += hasTrendSignals ? 18 : 10;
  score += Math.min(Math.floor((hooks[0]?.score || 70) / 10), 7);

  // Format optimisation — 20 pts
  const topFormats = ['recipe','transformation','tutorial','storytime','pov','montage','split-screen','reaction','breakdown','reveal'];
  score += topFormats.some(f => (format?.style || '').toLowerCase().includes(f)) ? 18 : 10;

  // Hashtag strategy — 10 pts
  const hc = hashtags.length;
  score += hc >= 5 && hc <= 12 ? 7 : hc > 0 ? 4 : 0;
  score += Math.min(hc * 0.5, 3);

  // Cross-niche appeal — 10 pts
  score += Math.min((crossNicheInsights?.length || 0) * 3, 10);

  return Math.min(Math.round(score), 100);
}

function predictViews(viralScore: number, platform: string): ViewPrediction {
  // Base multipliers match Python: tiktok 15K, instagram 8K, youtube 5K
  const base: Record<string, number> = { tiktok: 15000, instagram: 8000, youtube: 5000, linkedin: 6000 };
  const b = base[platform.toLowerCase()] || 10000;
  let min: number, max: number;

  if      (viralScore >= 90) { min = b * 100; max = b * 1000; }
  else if (viralScore >= 80) { min = b * 30;  max = b * 200;  }
  else if (viralScore >= 70) { min = b * 10;  max = b * 50;   }
  else if (viralScore >= 60) { min = b * 3;   max = b * 15;   }
  else                       { min = b;        max = b * 5;    }

  return {
    min: Math.round(min),
    max: Math.round(max),
    likely: Math.round((min + max) / 2),
    engagement: viralScore >= 80 ? '6.2%–9.4%' : viralScore >= 70 ? '4.1%–7.2%' : '2.5%–5.0%',
  };
}

function getPostingStrategy(platform: string): PostingStrategy {
  const map: Record<string, { today: string; tomorrow: string; reason: string }> = {
    tiktok:    { today: '6:45 PM', tomorrow: '8:15 AM or 7:30 PM', reason: 'Peak dinner-time scrolling; FYP algorithm is most aggressive at these windows.' },
    instagram: { today: '7:00 PM', tomorrow: '9:00 AM or 6:30 PM', reason: 'Reels algorithm favours early-evening engagement spikes for discovery.' },
    youtube:   { today: '3:00 PM', tomorrow: '2:00 PM or 4:00 PM', reason: 'Shorts peak post-lunch; algorithm amplifies watch-time in afternoon sessions.' },
    linkedin:  { today: '9:00 AM', tomorrow: '8:30 AM or 12:00 PM', reason: 'Peaks Tue–Thu mornings during commute and lunch hours.' },
  };
  const t = map[platform.toLowerCase()] || map.instagram;
  return {
    ...t,
    preTactics: [
      'Engage with 10 posts in your niche 30 min before posting',
      'Reply to DMs to signal high account activity to the algorithm',
      'Post a story/poll to warm up your audience',
    ],
    postTactics: [
      'Reply to every comment within the first 60 minutes',
      'Share to your story immediately after posting',
      'Pin the best comment to boost thread engagement',
    ],
  };
}

// ─── Generator Class ──────────────────────────────────────────────────────────

export class UniversalContentGenerator {
  /** Uses the shared AI helper (gpt-5.6-luna + web search). */

  /**
   * Primary entry point — mirrors Python generate_for_any_niche().
   * @param topic      - Content topic / subject
   * @param niche      - Creator niche (fitness, finance, food, etc.)
   * @param platform   - Target platform (tiktok | instagram | youtube | linkedin)
   * @param vibe       - Content vibe / intent (educational | entertaining | inspiring)
   * @param brandVoice - Writing voice (casual | professional | bold | friendly)
   * @param followers  - Approximate follower count for context
   */
  async generate_for_any_niche(
    topic: string,
    niche: string,
    platform = 'tiktok',
    vibe = 'educational',
    brandVoice = 'casual',
    followers = 1000,
  ): Promise<GeneratedContent> {
    if (!topic || !niche) throw new Error('topic and niche are required');
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

    const patternsList = UNIVERSAL_PATTERNS
      .map((p, i) => `${i + 1}. "${p.template}" [${p.trigger}] score:${p.score}`)
      .join('\n');

    const systemPrompt =
      'You are an elite viral content strategist. You have analysed 100K+ viral posts across 40+ niches. Output ONLY valid JSON — no markdown, no code fences.';

    const userPrompt = `Create a viral content package.
TOPIC: "${topic}" | PLATFORM: ${platform} | NICHE: ${niche} | TYPE: ${vibe} | VOICE: ${brandVoice} | FOLLOWERS: ${followers}

UNIVERSAL PATTERNS — use these as your hook framework:
${patternsList}

CROSS-NICHE TASK: provide 3 examples of how OTHER niches approach "${topic}" virally — for cross-pollination.

Return this exact JSON (no extra keys):
{
  "caption": "ready-to-post caption, 150-220 chars, emojis, voice:${brandVoice}",
  "hooks": [
    {"text":"hook1","score":92,"pattern":"Contrarian","why":"why it works"},
    {"text":"hook2","score":88,"pattern":"Curiosity Gap","why":"why it works"},
    {"text":"hook3","score":85,"pattern":"Social Proof","why":"why it works"},
    {"text":"hook4","score":81,"pattern":"POV","why":"why it works"},
    {"text":"hook5","score":78,"pattern":"Pain Point","why":"why it works"}
  ],
  "hashtags": {
    "trending": ["tag1","tag2","tag3"],
    "niche": ["tag4","tag5","tag6"],
    "broad": ["tag7","tag8"],
    "all": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8"]
  },
  "format": {
    "style": "format name",
    "length": "15-25 seconds",
    "shots": ["shot1","shot2","shot3","shot4"],
    "editTips": ["tip1","tip2","tip3"],
    "whyItWorks": "data-backed reason",
    "trendingSignals": ["signal1","signal2"]
  },
  "audio": {"primary":"name","primaryUses":"45K","alternative":"name","audioReason":"why"},
  "trendingElements": ["el1","el2","el3"],
  "crossNicheInsights": [
    {"niche":"Business","approach":"how they frame it","views":"2.3M","lesson":"what to steal"},
    {"niche":"Lifestyle","approach":"how they frame it","views":"1.8M","lesson":"what to steal"},
    {"niche":"Comedy","approach":"how they frame it","views":"4.1M","lesson":"what to steal"}
  ],
  "adaptationGuide": {
    "tiktok": "tiktok-specific changes",
    "instagram": "instagram-specific changes",
    "youtube": "youtube-specific changes",
    "keepForAll": "what stays the same"
  },
  "opportunityAnalysis": {
    "score": 78,
    "verdict": "High Opportunity",
    "reason": "why this topic/niche combo is strong right now",
    "saturation": "medium",
    "growthRate": "+34% this week",
    "recommendation": "one actionable sentence"
  }
}`;

    const aiResponse = await generateWithWebSearch({
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 3000,
    });

    let aiData: any = {};
    try {
      const jsonMatch = aiResponse.text.match(/\{[\s\S]*\}/);
      aiData = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    } catch {
      // fall through with empty object; scoring will still produce a result
    }

    // Normalise hashtags — support flat array (legacy) or keyed object (current)
    const hashtagsAll: string[] = Array.isArray(aiData.hashtags)
      ? aiData.hashtags
      : (aiData.hashtags?.all || []);

    const normalizedHashtags: HashtagSet = Array.isArray(aiData.hashtags)
      ? { all: aiData.hashtags, trending: [], niche: [], broad: [] }
      : (aiData.hashtags || { all: [], trending: [], niche: [], broad: [] });

    const viralScore = calculateViralScore(
      aiData.hooks || [],
      hashtagsAll,
      aiData.format || {},
      platform,
      aiData.crossNicheInsights || [],
    );

    const predictions  = predictViews(viralScore, platform);
    const timing       = getPostingStrategy(platform);

    return {
      caption:             aiData.caption             || '',
      hooks:               aiData.hooks               || [],
      hashtags:            normalizedHashtags,
      format:              aiData.format              || {} as FormatGuide,
      audio:               aiData.audio               || {} as AudioRec,
      trendingElements:    aiData.trendingElements    || [],
      crossNicheInsights:  aiData.crossNicheInsights  || [],
      adaptationGuide:     aiData.adaptationGuide     || {} as AdaptationGuide,
      opportunityAnalysis: aiData.opportunityAnalysis || {} as OpportunityAnalysis,
      viralScore,
      predictions,
      timing,
      platform,
      topic,
      niche,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Convenience helpers (callable individually from other routes) ───────────

  /** Score any set of hooks/hashtags/format without calling OpenAI */
  scoreContent(hooks: Hook[], hashtags: string[], format: Partial<FormatGuide>, platform: string, crossNicheInsights: CrossNicheInsight[] = []) {
    return calculateViralScore(hooks, hashtags, format, platform, crossNicheInsights);
  }

  /** Get view range prediction for a known viral score */
  estimateViews(viralScore: number, platform: string) {
    return predictViews(viralScore, platform);
  }

  /** Get posting time strategy for a platform */
  getTimingStrategy(platform: string) {
    return getPostingStrategy(platform);
  }
}
