import { fetchRSSResults, webSearch } from "@/lib/web-search";

export async function buildLinkedInLiveContext(_userId: string | null, promptId: number, profile: Record<string, string>, payload: Record<string, unknown>): Promise<string> {
  const industry = profile.industry || "professional creators";
  let brief: Record<string, string> = {};
  try {
    brief = JSON.parse(String(payload.workflowBrief || "{}"));
  } catch {}
  const selectedTitle = brief.title || brief.sourceTitle || "";
  const selectedUrl = brief.sourceUrl || "";
  const selectedDate = brief.publishedAt || "";
  const requestedTopic = String(payload.topic || selectedTitle || industry).split("\n")[0].trim();
  const query = promptId === 3
    ? `LinkedIn ${industry} ${String(payload.competitors || "peers")} latest posts discussions content gaps`
    : `${requestedTopic} ${industry} professional discussion when:7d`;
  const rss = await fetchRSSResults([`${requestedTopic} when:7d`, `${industry} professional news when:7d`, query], 6);
  const web = rss.length >= 3 || selectedUrl
    ? { summary: "", citations: [] as { title: string; url: string }[] }
    : await webSearch(query, process.env.OPENAI_API_KEY || "", 10);
  const lines = [
    `LIVE WEB DATA ONLY (retrieved ${new Date().toISOString()}):`,
    `WEB SEARCH SUMMARY:\n${web.summary || "The AI web-search provider was unavailable; current public RSS records are provided below."}`,
  ];
  const sources = [
    ...(selectedUrl ? [`- SELECTED TREND: ${selectedTitle}${selectedDate ? ` (${selectedDate})` : ""}: ${selectedUrl}`] : []),
    ...web.citations.map(citation => `- ${citation.title}: ${citation.url}`),
    ...rss.map(item => `- ${item.title}${item.publishedAt ? ` (${item.publishedAt})` : ""}: ${item.url}`),
  ];
  if (sources.length) lines.push("PUBLIC WEB SOURCES:\n" + [...new Set(sources)].join("\n"));
  lines.push("PLATFORM ACCOUNT DATA: intentionally excluded. This workflow uses public web research only.");
  if (!selectedUrl && !web.summary && web.citations.length === 0 && rss.length === 0) {
    throw new Error("No current public web data was returned. Try again with a broader industry, topic, or time window.");
  }
  lines.push("RULE: Use only current public web sources above for factual claims. Never invent LinkedIn metrics, algorithm weights, or competitor results. Clearly label platform metrics as unavailable.");
  return lines.join("\n\n");
}
