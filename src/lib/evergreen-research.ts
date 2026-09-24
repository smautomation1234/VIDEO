import { RESEARCH_NICHES, RESEARCH_NICHE_TERMS } from './research-niches';
import { generateWithWebSearch } from '@/lib/ai';

export type EvergreenPlatform = 'youtube' | 'instagram' | 'linkedin' | 'x';

export interface EvergreenVideoEvidence {
  videoId: string;
  title: string;
  url: string;
  channelName: string;
  channelUrl: string;
  publishedLabel: string;
  viewLabel: string;
  description: string;
  thumbnail: string;
  matchedQuery: string;
}

export interface EvergreenChannelEvidence {
  name: string;
  url: string;
  appearances: number;
  sampleTitles: string[];
  evidenceUrls: string[];
}

export interface EvergreenIdea {
  title: string;
  whyEvergreen: string;
  searchIntent: string;
  format: string;
  hook: string;
  description: string;
  keywords: string[];
  sourceVideoUrl: string;
  sourceChannel: string;
}

export interface EvergreenResearchResult {
  niche: string;
  platform: EvergreenPlatform;
  researchedAt: string;
  summary: string;
  channels: EvergreenChannelEvidence[];
  evidence: EvergreenVideoEvidence[];
  ideas: EvergreenIdea[];
  gaps: string[];
  actions: string[];
  methodology: string;
}

// YouTube's embedded response is a deeply nested, undocumented structure.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

function textValue(value: AnyRecord | undefined): string {
  if (!value) return '';
  if (typeof value.simpleText === 'string') return value.simpleText;
  if (Array.isArray(value.runs)) return value.runs.map((run: AnyRecord) => String(run?.text || '')).join('').trim();
  return '';
}

function decodeInitialData(html: string): AnyRecord | null {
  const escaped = html.match(/var ytInitialData = '([\s\S]*?)';/)?.[1];
  if (escaped) {
    try {
      const decoded = escaped
        .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\'/g, "'");
      return JSON.parse(decoded);
    } catch {}
  }

  const objectText = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/)?.[1]
    || html.match(/ytInitialData\s*=\s*(\{[\s\S]*?\});/)?.[1];
  if (objectText) {
    try { return JSON.parse(objectText); } catch {}
  }
  return null;
}

function collectRenderers(node: unknown, output: AnyRecord[]) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectRenderers(item, output);
    return;
  }
  const record = node as AnyRecord;
  if (record.videoWithContextRenderer) output.push(record.videoWithContextRenderer);
  if (record.videoRenderer) output.push(record.videoRenderer);
  for (const value of Object.values(record)) collectRenderers(value, output);
}

function mapRenderer(renderer: AnyRecord, matchedQuery: string): EvergreenVideoEvidence | null {
  const videoId = String(
    renderer?.navigationEndpoint?.watchEndpoint?.videoId
    || renderer?.videoId
    || renderer?.onTap?.innertubeCommand?.watchEndpoint?.videoId
    || '',
  );
  const title = textValue(renderer?.headline) || textValue(renderer?.title);
  if (!videoId || !title) return null;

  const byline = renderer?.shortBylineText || renderer?.longBylineText;
  const bylineRun = Array.isArray(byline?.runs) ? byline.runs[0] : null;
  const channelName = String(bylineRun?.text || 'Channel name unavailable');
  const browseEndpoint = bylineRun?.navigationEndpoint?.browseEndpoint || {};
  const canonical = String(browseEndpoint?.canonicalBaseUrl || '');
  const browseId = String(browseEndpoint?.browseId || '');
  const channelUrl = canonical
    ? `https://www.youtube.com${canonical}`
    : browseId ? `https://www.youtube.com/channel/${browseId}` : '';
  const description = textValue(renderer?.detailedMetadataSnippets?.[0]?.snippetText)
    || textValue(renderer?.descriptionSnippet);
  const thumbnails = renderer?.thumbnail?.thumbnails || [];

  return {
    videoId,
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    channelName,
    channelUrl,
    publishedLabel: textValue(renderer?.publishedTimeText) || 'Publication label unavailable',
    viewLabel: textValue(renderer?.shortViewCountText) || textValue(renderer?.viewCountText) || 'Public view label unavailable',
    description,
    thumbnail: String(thumbnails[thumbnails.length - 1]?.url || '').replace(/\\u0026/g, '&'),
    matchedQuery,
  };
}

async function searchPublicYouTube(query: string): Promise<EvergreenVideoEvidence[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (compatible; EvergreenContentResearch/1.0)',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return [];
    const data = decodeInitialData(await response.text());
    if (!data) return [];
    const renderers: AnyRecord[] = [];
    collectRenderers(data, renderers);
    return renderers.map(renderer => mapRenderer(renderer, query)).filter(Boolean) as EvergreenVideoEvidence[];
  } catch {
    return [];
  }
}

function aggregateChannels(videos: EvergreenVideoEvidence[]): EvergreenChannelEvidence[] {
  const channels = new Map<string, EvergreenChannelEvidence>();
  for (const video of videos) {
    const key = `${video.channelName}|${video.channelUrl}`.toLowerCase();
    const current = channels.get(key) || {
      name: video.channelName,
      url: video.channelUrl,
      appearances: 0,
      sampleTitles: [],
      evidenceUrls: [],
    };
    current.appearances += 1;
    if (!current.sampleTitles.includes(video.title)) current.sampleTitles.push(video.title);
    if (!current.evidenceUrls.includes(video.url)) current.evidenceUrls.push(video.url);
    channels.set(key, current);
  }
  return [...channels.values()]
    .sort((a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map(channel => ({ ...channel, sampleTitles: channel.sampleTitles.slice(0, 3), evidenceUrls: channel.evidenceUrls.slice(0, 3) }));
}

function platformFormat(platform: EvergreenPlatform): string {
  if (platform === 'instagram') return '30–45 second Reel or 8-slide carousel';
  if (platform === 'linkedin') return 'Evidence-led text post or document carousel';
  if (platform === 'x') return 'Single insight post or 6–8 post thread';
  return '8–12 minute searchable video';
}

function evergreenTerms(niche: string): string[] {
  const normalized = niche.trim().toLowerCase();
  const preset = RESEARCH_NICHES.find(item => item.label.toLowerCase() === normalized || item.id === normalized);
  if (preset) return RESEARCH_NICHE_TERMS[preset.id] || preset.terms;
  const stopWords = new Set(['and', 'the', 'for', 'with', 'from', 'into', 'your', 'beginners', 'beginner']);
  return [...new Set(normalized.split(/[^a-z0-9]+/).filter(term => term.length > 2 && !stopWords.has(term)))];
}

function isEvergreenEvidenceRelevant(video: EvergreenVideoEvidence, niche: string): boolean {
  const terms = evergreenTerms(niche);
  if (!terms.length) return true;
  const value = `${video.title} ${video.description}`.toLowerCase();
  return terms.some(term => value.includes(term));
}

function fallbackIdeas(niche: string, platform: EvergreenPlatform, evidence: EvergreenVideoEvidence[]): EvergreenIdea[] {
  const sources = evidence.slice(0, 8);
  return sources.map(source => {
    const sourceTitle = source.title.replace(/\s+/g, ' ').trim();
    const intent = /mistake|avoid|wrong/i.test(sourceTitle) ? 'Problem solving'
      : /vs\.?|compare|best/i.test(sourceTitle) ? 'Comparison and decision'
      : /how|guide|step|beginner|explain/i.test(sourceTitle) ? 'How-to education'
      : 'Recurring educational intent';
    const title = /^(how|what|why|when|where|the)\b/i.test(sourceTitle)
      ? sourceTitle
      : `${sourceTitle}: a practical ${niche} explanation`;
    return {
      title,
      whyEvergreen: `This public result appeared for “${source.matchedQuery}” and addresses a repeatable question or learning need rather than a dated news event.`,
      searchIntent: intent,
      format: platformFormat(platform),
      hook: `If “${sourceTitle}” still feels confusing, start with these practical principles.`,
      description: `Use the recurring question behind “${sourceTitle}” to create a clearer ${niche} resource. Verify the source, add original examples, and separate durable guidance from any claim that can change.`,
      keywords: [niche, sourceTitle, `${niche} guide`].slice(0, 3),
      sourceVideoUrl: source.url,
      sourceChannel: source.channelName,
    };
  });
}

async function synthesizeIdeas(
  niche: string,
  platform: EvergreenPlatform,
  evidence: EvergreenVideoEvidence[],
): Promise<Pick<EvergreenResearchResult, 'summary' | 'ideas' | 'gaps' | 'actions'>> {
  const fallback = {
    summary: `Public YouTube search records were scanned for recurring ${niche} questions, guides, mistakes, and explainers.`,
    ideas: fallbackIdeas(niche, platform, evidence),
    gaps: [
      `Create a clearer beginner pathway for ${niche}.`,
      `Update older explanations with current examples while keeping the core lesson evergreen.`,
      `Combine common mistakes and a decision checklist in one practical resource.`,
    ],
    actions: [
      'Today: choose one recurring question and verify the cited source videos.',
      'This week: publish one searchable cornerstone piece and two shorter adaptations.',
      'Validate: compare comments, saves, watch time, or qualified replies using only metrics you actually have.',
    ],
  };
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey || evidence.length === 0) return fallback;

  try {
    const sourceRows = evidence.slice(0, 18).map((video, index) => ({
      id: index + 1,
      title: video.title,
      channel: video.channelName,
      published: video.publishedLabel,
      publicViewLabel: video.viewLabel,
      url: video.url,
      matchedQuery: video.matchedQuery,
    }));
    const completion = await generateWithWebSearch({
      prompt: `Analyze the public YouTube search evidence below for durable evergreen content opportunities in the niche "${niche}". Package the ideas for ${platform}.

EVIDENCE:
${JSON.stringify(sourceRows)}

Return JSON with: summary (string), ideas (8 objects), gaps (3 strings), actions (3 strings).
Each idea must contain: title, whyEvergreen, searchIntent, format, hook, description, keywords (3-6 strings), sourceVideoUrl, sourceChannel.
Rules: use only supplied channel names and URLs; cite one supplied sourceVideoUrl per idea; do not invent subscriber counts, view counts, trend scores, search volume, platform metrics, or algorithm claims; prefer recurring how-to, beginner, mistake, comparison, checklist, framework, and FAQ intent; distinguish durable lessons from time-sensitive facts.`,
      maxOutputTokens: 3000,
    });
    let parsed: AnyRecord = {};
    try {
      const jsonMatch = completion.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    } catch {
      parsed = {};
    }
    const allowedSources = new Map(evidence.map(video => [video.url, video]));
    const ideas = Array.isArray(parsed.ideas) ? parsed.ideas.slice(0, 10).map((idea: AnyRecord, index: number) => {
      const source = allowedSources.get(String(idea.sourceVideoUrl || '')) || evidence[index % evidence.length];
      return {
        title: String(idea.title || fallback.ideas[index % fallback.ideas.length].title),
        whyEvergreen: String(idea.whyEvergreen || fallback.ideas[index % fallback.ideas.length].whyEvergreen),
        searchIntent: String(idea.searchIntent || 'Recurring educational intent'),
        format: String(idea.format || platformFormat(platform)),
        hook: String(idea.hook || fallback.ideas[index % fallback.ideas.length].hook),
        description: String(idea.description || fallback.ideas[index % fallback.ideas.length].description),
        keywords: Array.isArray(idea.keywords) ? idea.keywords.map(String).slice(0, 6) : fallback.ideas[index % fallback.ideas.length].keywords,
        sourceVideoUrl: source.url,
        sourceChannel: source.channelName,
      } satisfies EvergreenIdea;
    }) : fallback.ideas;
    return {
      summary: String(parsed.summary || fallback.summary),
      ideas: ideas.length ? ideas : fallback.ideas,
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String).slice(0, 5) : fallback.gaps,
      actions: Array.isArray(parsed.actions) ? parsed.actions.map(String).slice(0, 5) : fallback.actions,
    };
  } catch {
    return fallback;
  }
}

export async function runEvergreenResearch(niche: string, platform: EvergreenPlatform): Promise<EvergreenResearchResult> {
  const queries = [
    `${niche} beginner guide`,
    `${niche} how to explained`,
    `${niche} mistakes tips`,
  ];
  const settled = await Promise.allSettled(queries.map(query => searchPublicYouTube(query)));
  const combined = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const evidence = [...new Map(combined.map(video => [video.videoId, video])).values()]
    .filter(video => isEvergreenEvidenceRelevant(video, niche))
    .slice(0, 30);
  if (evidence.length === 0) throw new Error(`No public YouTube evidence was returned for "${niche}". Try a broader niche.`);

  const analysis = await synthesizeIdeas(niche, platform, evidence);
  return {
    niche,
    platform,
    researchedAt: new Date().toISOString(),
    summary: analysis.summary,
    channels: aggregateChannels(evidence),
    evidence,
    ideas: analysis.ideas,
    gaps: analysis.gaps,
    actions: analysis.actions,
    methodology: 'Public YouTube search results were scanned across beginner-guide, how-to/explainer, and mistakes/tips intent. Channel order reflects recurring appearances in these search results, not subscriber rank. Public labels are shown as returned; no private analytics or invented scores are used.',
  };
}
