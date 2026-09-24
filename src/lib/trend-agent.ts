import { webSearch, fetchRSSResults } from './web-search';
import { generateWithWebSearch } from '@/lib/ai';
import { RESEARCH_NICHES, RESEARCH_NICHE_TERMS } from './research-niches';

export interface TrendResult {
  id: string;
  topic: string;
  sourceName: string;
  sourceUrl: string;
  platform: string;
  virality: number;
  velocity: string;
  engagement: number;
  hook: string;
  category: string;
  color: string;
  whyItsTrending: string;
  postIdea: string;
  urgencyScore: number;
  competition: string;
  lifespan: string;
  isRealData: boolean;
  sparkline: number[];
  publishedAt?: string;
  discussionReason?: string;
  youtubeAngle?: string;
  linkedinAngle?: string;
}

export interface HookResult {
  id: string;
  text: string;
  framework: string;
  score: number;
  platform: string;
  category: string;
}

export interface AgentResult {
  topics: TrendResult[];
  hooks: HookResult[];
  agentSteps: string[];
  rawCount: number;
  searchSummary: string;
  citations: { title: string; url: string; publishedAt?: string }[];
}

export type TrendRegion = 'india' | 'world';

const GENERIC_TREND_TITLES = [
  /ai-assisted, human-led content creation/i,
  /reels for discovery, carousels for authority/i,
  /valuable over viral content/i,
  /instagram seo and social search/i,
  /what(?:'|’)s happening this week/i,
  /top trending topics/i,
  /latest creator trends/i,
  /analyst upgrades?\s*&?\s*downgrades?/i,
  /stock market (?:today|update|news)$/i,
  /market (?:update|outlook|roundup)$/i,
  /latest (?:stocks?|shares?) news/i,
  /^latest .* news(?: and updates)?\b/i,
  /^today['’]s (?:top )?stories\b/i,
  /^(?:india|world|global) (?:latest|breaking|trending) news\b/i,
];

function isConcreteTrendTitle(title: string) {
  const value = title.replace(/\s+/g, ' ').trim();
  return value.length >= 28 && !GENERIC_TREND_TITLES.some(pattern => pattern.test(value));
}

function isNicheRelevant(title: string, categoryId: string, customNiche = '') {
  if (categoryId === 'news') return true;
  const value = title.toLowerCase();
  const customTerms = customNiche.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 2);
  const terms = customTerms.length ? customTerms : (RESEARCH_NICHE_TERMS[categoryId] || []);
  const matches = terms.filter(term => value.includes(term));
  // "Education" is frequently used for unrelated public-awareness campaigns.
  // Require a second, domain-specific signal unless the headline names a more
  // concrete education term such as school, teacher, student, or classroom.
  if (!customNiche && categoryId === 'education' && matches.length === 1 && matches[0] === 'education') return false;
  return matches.length > 0;
}

function isRecentItem(publishedAt: string) {
  const timestamp = Date.parse(publishedAt);
  if (!Number.isFinite(timestamp)) return false;
  // Trend Scout is intentionally strict: only the last seven days count as
  // current. Never fill a current scan with stale or undated headlines.
  const ageDays = (Date.now() - timestamp) / 86_400_000;
  return ageDays >= -0.5 && ageDays <= 7;
}

export const AGENT_CATEGORIES = RESEARCH_NICHES;

function sourceNameFromTitle(title: string) {
  const parts = title.split(/\s+[-|]\s+/).map(part => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : 'Live News';
}

function newsCategory(region: TrendRegion) {
  return {
    id: 'news',
    label: region === 'india' ? 'India News' : 'World News',
    icon: region === 'india' ? '🇮🇳' : '🌍',
    color: region === 'india' ? '#ea580c' : '#2563eb',
    searchQuery: region === 'india'
      ? 'latest named India news, government decisions, business developments, technology, science, culture, and public events'
      : 'latest named world news, government decisions, business developments, technology, science, culture, and international events',
  };
}

// Main agent: uses real web search via OpenAI Responses API
export async function runChatGPTWebSearchAgent(
  categoryId: string,
  apiKey: string,
  platform: string = 'all',
  mode: string = 'topics',
  customNiche = '',
  region: TrendRegion = 'india',
): Promise<AgentResult> {
  const steps: string[] = [];
  const category = categoryId === 'news' && !customNiche.trim() ? newsCategory(region) : customNiche.trim() ? {
    id: 'custom', label: customNiche.trim(), icon: '🎯', color: '#7c3aed',
    searchQuery: `latest named developments, debates, launches, studies, questions, and public discussions in ${customNiche.trim()} today`,
  } : (AGENT_CATEGORIES.find(c => c.id === categoryId) || AGENT_CATEGORIES[0]);

  steps.push(`🤖 AI Agent activated for: ${category.label}`);
  steps.push(`🌐 Performing live web search...`);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const todayIso = new Date().toISOString().slice(0, 10);

  // Step 1: Query current RSS evidence first. This is faster and free. Hosted
  // OpenAI web search is only used when RSS cannot provide verified sources.
  let liveContext = '';
  const citations: { title: string; url: string; publishedAt?: string }[] = [];

  const platformLabel = platform === 'instagram' ? 'Instagram' : platform === 'linkedin' ? 'LinkedIn' : platform === 'youtube' ? 'YouTube' : platform === 'x' ? 'X/Twitter' : 'social media';
  const searchQuery = mode === 'audio' && platform === 'instagram'
    ? `What are the most trending audio tracks and songs being used on Instagram Reels for ${category.label} content right now? Today is ${today}.`
    : `${category.searchQuery} Focus on ${platformLabel}. Today is ${today}.`;

  const rssLocale = categoryId === 'news' && !customNiche.trim() && region === 'india' ? 'IN' : 'US';
  const rssQueries = categoryId === 'news' && !customNiche.trim()
    ? region === 'india'
      ? [
          'India latest news when:2d',
          'India breaking news when:2d',
          'India trending news when:2d',
          'India top stories when:2d',
        ]
      : [
          'world latest news when:2d',
          'global breaking news when:2d',
          'world trending news when:2d',
          'international top stories when:2d',
        ]
    : categoryId === 'stock_market' && !customNiche.trim()
    ? [
        'stock market when:7d',
        'stocks earnings when:7d',
        'stock market Reuters when:7d',
        `stock market ${todayIso}`,
      ]
    : [
        `${category.label} when:7d`,
        `${category.label} news when:7d`,
        `${category.label} ${platformLabel} when:7d`,
      ];
  const rssItems = await fetchRSSResults(rssQueries, 10, rssLocale);
  const filteredRssItems = rssItems
    .filter(item =>
      isConcreteTrendTitle(item.title) &&
      isNicheRelevant(item.title, categoryId, customNiche) &&
      isRecentItem(item.publishedAt)
    )
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  citations.push(...filteredRssItems.map(item => ({ title: item.title, url: item.url, publishedAt: item.publishedAt })));

  if (filteredRssItems.length) {
    liveContext = `Latest news:\n- ${filteredRssItems.map(item => `${item.title} — ${item.url}`).join('\n- ')}`;
    steps.push(`📰 Found ${filteredRssItems.length} current RSS sources from the last 7 days`);
  }

  if (filteredRssItems.length < 4 && process.env.ENABLE_AI_WEB_SEARCH === 'true') {
    const webResult = await webSearch(
      `${searchQuery} Today is ${todayIso}. Return only named, dated events, launches, company announcements, policy changes, studies, or specific public debates from the last 7 days with source URLs. Do not return generic advice, content strategies, or format labels.`,
      apiKey,
    );
    if (webResult.summary && webResult.citations.length) {
      liveContext = `${liveContext}\n${webResult.summary}`.trim();
      citations.push(...webResult.citations);
      steps.push(`🔍 Added ${webResult.citations.length} hosted web-search sources`);
    }
  }

  if (!citations.length) {
    steps.push(`⚠️ No verified live sources were returned`);
  }

  const verifiedCitations = [...new Map(
    citations
      .filter(citation => isConcreteTrendTitle(citation.title) && isNicheRelevant(citation.title, categoryId, customNiche))
      .map(citation => [citation.title.toLowerCase().replace(/\s+-\s+[^-]+$/, '').trim(), citation]),
  ).values()];
  citations.splice(0, citations.length, ...verifiedCitations);
  if (citations.length === 0) {
    throw new Error(`No verified live ${category.label} sources were returned. Try again or broaden the niche.`);
  }

  // Low-cost mode is source-only: never invent virality, engagement, hooks,
  // velocity, or trend scores. The headline and publication date are the data.
  if (process.env.ENABLE_AI_SYNTHESIS !== 'true') {
    const topics: TrendResult[] = citations.slice(0, 8).map((citation, index) => ({
      id: `source-${index + 1}`,
      topic: citation.title,
      sourceName: sourceNameFromTitle(citation.title),
      sourceUrl: citation.url,
      platform: platform === 'youtube' ? 'YouTube' : platform === 'instagram' ? 'Instagram' : platform === 'linkedin' ? 'LinkedIn' : platform === 'x' ? 'X/Twitter' : 'Web',
      virality: 0,
      velocity: 'Unavailable — no public velocity metric',
      engagement: 0,
      hook: 'Unavailable — no hook metric in source',
      category: category.label,
      color: category.color,
      whyItsTrending: citation.publishedAt ? `Published ${new Date(citation.publishedAt).toLocaleString()}; verify the source before publishing.` : 'Live source retrieved; publication date unavailable.',
      postIdea: `Create an evidence-led explanation of “${citation.title}” and link the source.`,
      urgencyScore: 0,
      competition: 'Unavailable',
      lifespan: 'Unavailable',
      isRealData: true,
      sparkline: [],
      publishedAt: citation.publishedAt,
      discussionReason: citation.publishedAt ? `A current, dated development in ${category.label}.` : `A current indexed discussion in ${category.label}; confirm timing at the source.`,
      youtubeAngle: `Explain what happened in “${citation.title}”, why it matters now, and what viewers should watch next.`,
      linkedinAngle: `Open with the headline “${citation.title}”, add one professional implication, then ask which outcome the audience expects.`,
    }));
    return { topics, hooks: [], agentSteps: [...steps, `📰 Returned ${topics.length} source-backed topics; no synthetic scores`], rawCount: topics.length, searchSummary: 'Source-only live data. No model-generated trend claims.', citations };
  }

  let agentPrompt = '';

  if (mode === 'audio' && platform === 'instagram') {
    agentPrompt = `Today is ${today}. My niche is "${category.label}".

LIVE WEB SEARCH DATA:
${liveContext}

Based on this live data, identify the top 8 rising trending audio tracks for Instagram Reels in the "${category.label}" niche right now.
Return exact JSON:
{
  "searchSummary": "2-3 sentence summary of trending sounds based on web search",
  "topics": [
    {
      "topic": "Name of the Song / Audio",
      "platform": "Instagram",
      "virality": 9.5,
      "urgencyScore": 9.5,
      "competition": "Low (<10K uses)",
      "lifespan": "Rising",
      "whyItsTrending": "Why this audio works right now (based on web data)",
      "postIdea": "Hook idea for using this sound",
      "color": "${category.color}",
      "sourceTitle": "Trend Source",
      "sourceUrl": ""
    }
  ],
  "hooks": []
}`;
  } else if (platform === 'instagram') {
    agentPrompt = `Today is ${today}.

LIVE WEB SEARCH DATA:
${liveContext}

Based on this live data, identify the 8 most viral, trending topics for Instagram content creators in the "${category.label}" niche RIGHT NOW.

IMPORTANT: Rank by DM share potential (the #1 Instagram growth signal in 2026).

Return JSON:
{
  "searchSummary": "2-3 sentence summary of what the web search found trending today for Instagram",
  "topics": [
    {
      "id": "t1",
      "topic": "Punchy trending topic (max 12 words) — from the web search data",
      "platform": "Instagram",
      "virality": 9.1,
      "urgencyScore": 9.5,
      "competition": "Low or Medium or High",
      "lifespan": "Flash Trend (3-7 days) or Medium (2-4 weeks) or Evergreen",
      "hook": "Contrarian or Relatability or Curiosity Gap",
      "color": "${category.color}",
      "whyItsTrending": "Why this is going viral RIGHT NOW (based on web data)",
      "postIdea": "Specific Reel, Carousel, or Story idea",
      "sourceTitle": "Source name from web search",
      "sourceUrl": "https://actual-url.com"
    }
  ],
  "hooks": [
    {
      "id": "h1",
      "text": "Under 15 words viral hook based on a real trend",
      "framework": "Contrarian or Curiosity Gap",
      "score": 9.2,
      "platform": "Instagram",
      "category": "${category.label}"
    }
  ]
}`;
  } else {
    agentPrompt = `Today is ${today}.

LIVE WEB SEARCH DATA:
${liveContext}

Based on this LIVE web search data, identify the 8 most viral, trending topics for social media content creators in the "${category.label}" niche RIGHT NOW.

Return JSON only:
{
  "searchSummary": "2-3 sentence summary of what the web search found trending today",
  "topics": [
    {
      "id": "t1",
      "topic": "Punchy trending topic (max 12 words) — must be from the web search data",
      "platform": "LinkedIn or Twitter or Instagram",
      "virality": 9.1,
      "velocity": "+340%",
      "engagement": 45000,
      "hook": "Contrarian or Social Proof or Curiosity Gap or Data-Backed or Insider Knowledge",
      "color": "${category.color}",
      "whyItsTrending": "Why this is going viral RIGHT NOW based on the web search",
      "postIdea": "Specific post angle for this trend",
      "urgencyScore": 9.5,
      "competition": "Low or Medium or High",
      "lifespan": "24 hours or 3 days or 1 week or 1 month",
      "sourceTitle": "Source name from web search",
      "sourceUrl": "https://actual-url.com"
    }
  ],
  "hooks": [
    {
      "id": "h1",
      "text": "Under 15 words viral hook based on a real trend from the web data",
      "framework": "Contrarian or Curiosity Gap or Data-Backed or Social Proof or Insider Knowledge",
      "score": 9.2,
      "platform": "LinkedIn",
      "category": "${category.label}"
    }
  ]
}

Return ONLY the JSON object. No markdown.`;
  }

  // Step 2: Structure the web data with GPT-5.6 Luna
  steps.push(`🧠 Structuring web data into trending topics...`);
  const chat = await generateWithWebSearch({
    prompt: agentPrompt,
    maxOutputTokens: 3000,
  });
  let rawText = chat.text || '{}';

  steps.push(`📰 Found ${citations.length} real web sources`);

  // Parse JSON from the AI response
  let aiData: any = { topics: [], hooks: [], searchSummary: '' };
  try {
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    aiData = JSON.parse(cleaned);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try { aiData = JSON.parse(match[0]); } catch {}
    }
  }

  steps.push(`🧠 Extracted ${aiData.topics?.length || 0} trending topics`);
  steps.push(`✨ Generated ${aiData.hooks?.length || 0} viral hooks`);

  // Build the list from the returned source records first. The model may add
  // formatting, but it must not reduce the result to generic invented topics.
  const concreteCitations = citations.filter(citation =>
    isConcreteTrendTitle(citation.title) && isNicheRelevant(citation.title, categoryId, customNiche)
  );
  const topicRows = concreteCitations.length
    ? concreteCitations.slice(0, 8).map((citation, i) => ({ ...(aiData.topics || [])[i], sourceTitle: citation.title, sourceUrl: citation.url }))
    : [];
  const topics: TrendResult[] = topicRows.map((t: any, i: number) => {
    const matchedCitation = concreteCitations.find(c => c.url === t.sourceUrl) || concreteCitations[i] || null;
    // The source headline is the topic. Never let the model replace it with a
    // generic template or invent a trend that is not present in the evidence.
    const concreteTopic = matchedCitation?.title || t.topic || 'No sourced topic returned';

    return {
      id: t.id || `t${i}`,
      topic: concreteTopic,
      sourceName: sourceNameFromTitle(matchedCitation?.title || t.sourceTitle || 'Live News'),
      sourceUrl: matchedCitation?.url || t.sourceUrl || '',
      platform: platform === 'youtube' ? 'YouTube' : platform === 'instagram' ? 'Instagram' : platform === 'linkedin' ? 'LinkedIn' : platform === 'x' ? 'X/Twitter' : (t.platform || 'Social web'),
      virality: 0,
      velocity: t.velocity || 'Source-backed; no public velocity metric',
      engagement: typeof t.engagement === 'number' ? t.engagement : 0,
      hook: t.hook || 'Curiosity Gap',
      category: category.label,
      color: category.color,
      whyItsTrending: t.whyItsTrending || '',
      postIdea: t.postIdea || '',
      urgencyScore: 0,
      competition: 'Public metric unavailable',
      lifespan: 'Not predicted',
      isRealData: true,
      sparkline: [],
      publishedAt: matchedCitation?.publishedAt,
    };
  });

  return {
    topics: topics.sort((a, b) => b.virality - a.virality),
    hooks: (aiData.hooks || []).map((h: any, i: number) => ({
      id: h.id || `h${i}`,
      text: h.text || '',
      framework: h.framework || 'Curiosity Gap',
      score: 0,
      platform: h.platform || 'LinkedIn',
      category: category.label,
    })),
    agentSteps: steps,
    rawCount: concreteCitations.length,
    searchSummary: aiData.searchSummary || '',
    citations: concreteCitations,
  };
}
