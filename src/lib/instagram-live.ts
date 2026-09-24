import { fetchRSSResults, filterRecentRSSResults, webSearch } from "@/lib/web-search";

export async function buildInstagramLiveContext(_userId: string | null, promptId: number, profile: Record<string, string>, payload: Record<string, string>): Promise<string> {
  const niche = profile.niche || "Instagram creators";
  let brief: Record<string, string> = {};
  try { brief = JSON.parse(String(payload.workflowBrief || "{}")); } catch {}
  const selectedTitle = brief.title || brief.sourceTitle || "";
  const selectedUrl = brief.sourceUrl || "";
  const queryByPrompt: Record<number, string> = {
    1: `Instagram trends and viral content formats for ${payload.category || niche} today`,
    2: `Instagram ${payload.competitors || "creator competitors"} content strategy comments reels`,
    3: `viral Instagram ${selectedTitle || niche} reels hooks formats shares saves`,
    4: `Instagram carousel ${payload.topic || niche} examples`,
    5: `Instagram stories ${payload.topic || niche} engagement examples`,
    6: `Instagram SEO captions keywords ${payload.topic || niche}`,
    7: `Instagram captions ${payload.topic || niche} creator examples`,
    8: `Instagram hooks ${payload.topic || niche} scroll stopping formats`,
    9: `Instagram hashtags keywords ${payload.topic || niche} search trends`,
    10: `Instagram content calendar trends ${niche} this month`,
    11: `Instagram content repurposing ideas ${payload.idea || niche}`,
    12: `Instagram growth audit ${niche} creator strategy`,
    13: `Instagram profile SEO ${niche} bio keywords`,
    14: `Instagram Trial Reels testing strategy ${niche}`,
    15: `Instagram content performance patterns ${niche} public discussions`,
    16: `Instagram growth audit ${niche} creator strategy`,
  };
  const query = queryByPrompt[promptId] || `${niche} Instagram trends today`;
  const rss = filterRecentRSSResults(await fetchRSSResults([`${query} when:7d`, `${niche} creator economy when:7d`, `${niche} Instagram when:7d`], 8));
  const web = rss.length >= 3 || Boolean(selectedUrl)
    ? { summary: "", citations: [] as { title: string; url: string }[] }
    : await webSearch(query, process.env.OPENAI_API_KEY || "", 10);
  const lines = [
    `LIVE WEB DATA ONLY (retrieved ${new Date().toISOString()}):`,
    `WEB SEARCH SUMMARY:\n${web.summary || "The AI web-search provider was unavailable; current public RSS records are provided below."}`,
  ];
  const sources = [
    ...(selectedUrl ? [`- SELECTED PUBLIC EVIDENCE: ${selectedTitle}: ${selectedUrl}`] : []),
    ...web.citations.map(citation => `- ${citation.title}: ${citation.url}`),
    ...rss.map(item => `- ${item.title}${item.publishedAt ? ` (${item.publishedAt})` : ""}: ${item.url}`),
  ];
  if (sources.length) lines.push("PUBLIC WEB SOURCES:\n" + [...new Set(sources)].join("\n"));
  lines.push("PLATFORM ACCOUNT DATA: intentionally excluded. This workflow uses public web research only.");
  if (!selectedUrl && !web.summary && web.citations.length === 0 && rss.length === 0) {
    throw new Error("No current public web data was returned. Try again with a broader niche, topic, or time window.");
  }
  lines.push("RULE: Use only current public web sources above for factual claims. Never invent Instagram metrics, algorithm weights, audio performance, or competitor results. Clearly label platform metrics as unavailable.");
  return lines.join("\n\n");
}
