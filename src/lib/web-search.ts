/**
 * Web Search Utility
 * Uses the OpenAI Responses API with the hosted web_search tool for real-time web data.
 * This is the same engine ChatGPT uses to search the web.
 */

import { AI_CONFIG, getOpenAIClient } from '@/lib/ai';

export interface WebSearchResult {
  summary: string;
  citations: { title: string; url: string }[];
}

export interface RSSSearchItem {
  title: string;
  url: string;
  publishedAt: string;
}

export function filterRecentRSSResults(items: RSSSearchItem[], maxAgeDays = 7): RSSSearchItem[] {
  const now = Date.now();
  return items
    .filter(item => {
      const timestamp = Date.parse(item.publishedAt);
      if (!Number.isFinite(timestamp)) return false;
      const ageDays = (now - timestamp) / 86_400_000;
      return ageDays >= -0.5 && ageDays <= maxAgeDays;
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

/**
 * Performs a real web search using the OpenAI Responses API (web_search).
 * Returns a summary of web findings plus citations.
 */
export async function webSearch(
  query: string,
  apiKey: string,
  maxResults: number = 8,
  forceLiveSearch = false,
): Promise<WebSearchResult> {
  // RSS is the default low-cost live-data path. Enable hosted AI web search
  // explicitly when deeper synthesis is worth the extra API usage.
  if (!apiKey.trim()) {
    console.error('Web search skipped: OPENAI_API_KEY is not configured.');
    return { summary: '', citations: [] };
  }
  if (process.env.ENABLE_AI_WEB_SEARCH === 'false') {
    console.info('Hosted AI web search is disabled; using live RSS sources.');
    return { summary: '', citations: [] };
  }

  try {
    const client = getOpenAIClient(apiKey);
    const response = await client.responses.create({
      model: AI_CONFIG.textModel,
      reasoning: { effort: AI_CONFIG.reasoningEffort as 'none' },
      tools: [{ type: 'web_search', search_context_size: 'low' }],
      tool_choice: 'required',
      input: query,
    });

    let summary = response.output_text || '';
    const citations: { title: string; url: string }[] = [];

    for (const item of response.output) {
      if (item.type !== 'message') continue;
      for (const block of item.content) {
        if (block.type !== 'output_text') continue;
        summary ||= block.text || '';
        for (const annotation of block.annotations || []) {
          if (annotation.type === 'url_citation' && annotation.url) {
            citations.push({ title: annotation.title || annotation.url, url: annotation.url });
          }
        }
      }
    }

    return {
      summary: summary.slice(0, 4000), // Cap at 4000 chars to save tokens
      citations: citations.slice(0, maxResults),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Web search failed:', message);
    return {
      summary: '',
      citations: [],
    };
  }
}

/**
 * Fetches live news + trends using multiple RSS feeds simultaneously.
 * Used as a fast, free fallback when the Responses API is unavailable.
 */
export async function fetchRSSResults(queries: string[], maxPerQuery = 5, locale = 'US'): Promise<RSSSearchItem[]> {
  const decodeXml = (value: string) => value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '').trim();

  const fetchFeed = async (query: string): Promise<RSSSearchItem[]> => {
    try {
      const encoded = encodeURIComponent(query);
      const normalizedLocale = locale.toUpperCase() === 'IN' ? 'IN' : 'US';
      const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=${normalizedLocale}&ceid=${normalizedLocale}:en`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
      if (!res.ok) return [];
      const xml = await res.text();
      const items: RSSSearchItem[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null && items.length < maxPerQuery) {
        const block = match[1];
        const title = decodeXml(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
        const link = decodeXml(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || '');
        const publishedAt = decodeXml(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || '');
        if (title && link) items.push({ title, url: link, publishedAt });
      }
      return items;
    } catch {
      return [];
    }
  };

  const results = await Promise.allSettled(queries.map(q => fetchFeed(q)));
  const all: RSSSearchItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  return [...new Map(all.map(item => [item.url, item])).values()];
}

export async function fetchRSSContext(queries: string[]): Promise<string> {
  const items = await fetchRSSResults(queries, 5);
  return items.map(item => `${item.title}${item.publishedAt ? ` (${item.publishedAt})` : ''} — ${item.url}`).join('\n- ');
}

/**
 * Performs web search for trending topics in a specific niche.
 * Returns formatted context ready to be injected into any AI prompt.
 */
export async function fetchTrendContext(
  niche: string,
  platform: string,
  apiKey: string
): Promise<string> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Try OpenAI web search first
  const searchResult = await webSearch(
    `What are the most trending and viral topics in "${niche}" on ${platform} today, ${today}? Include specific viral posts, trending debates, breaking news, and hot takes.`,
    apiKey
  );

  if (searchResult.summary) {
    const citationLines = searchResult.citations
      .slice(0, 5)
      .map(c => `• [${c.title}](${c.url})`)
      .join('\n');
    return `=== LIVE WEB SEARCH RESULTS (${today}) ===\n${searchResult.summary}\n\nSOURCES:\n${citationLines}`;
  }

  // Fallback to RSS
  const rssData = await fetchRSSContext([
    `${niche} trending ${platform}`,
    `${niche} viral content today`,
    `${niche} news today`,
  ]);

  if (rssData) {
    return `=== LATEST NEWS (${today}) ===\n- ${rssData}`;
  }

  return `=== NO VERIFIED LIVE SOURCES (${today}) ===\nNo current public source was returned for "${niche}" on ${platform}. Do not infer or invent a trend; broaden the niche or try again later.`;
}
