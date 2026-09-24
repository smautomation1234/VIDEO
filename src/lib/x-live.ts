import { webSearch, fetchRSSResults, filterRecentRSSResults } from "@/lib/web-search";

export async function buildXLiveContext(promptId: number, profile: Record<string, string>, payload: Record<string, unknown>): Promise<string> {
  const industry = profile.industry || "professional creators";
  let brief: Record<string, string> = {};
  try { brief = JSON.parse(String(payload.workflowBrief || "{}")); } catch {}
  const selectedTitle = brief.title || brief.sourceTitle || "";
  const selectedUrl = brief.sourceUrl || "";
  const queries: Record<number, string> = {
    1: `latest X Twitter discussions trends and news in ${industry} this week`,
    2: `recent ${industry} founder experience lessons discussions on X Twitter`,
    3: `active X Twitter accounts and recent posts about ${industry} content gaps`,
    4: `high engagement X Twitter posts and conversations about ${String(payload.topic || selectedTitle || industry)}`,
    5: `best recent X Twitter threads teaching ${String(payload.topic || selectedTitle || industry)}`,
    6: `build in public ${String(profile.buildingInPublic || industry)} latest updates discussion`,
    7: `X Twitter conversations worth replying to in ${industry} today`,
    8: `X Twitter profile bio pinned tweet examples for ${industry}`,
    9: `X Twitter content calendar events news ${industry} this week`,
    10: `X Twitter posts and discussions about ${String(payload.idea || industry)}`,
    11: `X Twitter engagement benchmarks and content formats for ${industry}`,
    12: `X Twitter creator growth and content strategy audit ${industry}`,
  };
  const query = queries[promptId] || `latest X Twitter ${industry} news and discussions`;
  const rss = filterRecentRSSResults(await fetchRSSResults([`${query} when:7d`, `${industry} news when:7d`, `${industry} X Twitter when:7d`], 8));
  const result = rss.length >= 3 || Boolean(selectedUrl)
    ? { summary: "", citations: [] as { title: string; url: string }[] }
    : await webSearch(query, process.env.OPENAI_API_KEY || "", 10);
  const rssSummary = rss.map(item => `- ${item.title} (${item.publishedAt}): ${item.url}`).join("\n");
  const summary = result.summary || rssSummary || "No live web results were returned for this query.";
  if (!selectedUrl && !result.summary && result.citations.length === 0 && rss.length === 0) {
    throw new Error("No live X/Twitter web data was returned. Try again in a moment.");
  }
  const lines = [`LIVE X/TWITTER WEB DATA (retrieved ${new Date().toISOString()}):`, summary];
  const sourceLines = [
    ...(selectedUrl ? [`- SELECTED PUBLIC EVIDENCE: ${selectedTitle}: ${selectedUrl}`] : []),
    ...result.citations.map(citation => `- ${citation.title}: ${citation.url}`),
    ...rss.map(item => `- ${item.title} (${item.publishedAt}): ${item.url}`),
  ];
  if (sourceLines.length) lines.push("SOURCES:\n" + [...new Set(sourceLines)].join("\n"));
  lines.push("RULE: Use only the live sources above for current claims. X does not expose private account analytics here, so do not invent impressions, replies, or follower metrics. Label unavailable metrics explicitly.");
  return lines.join("\n\n");
}
