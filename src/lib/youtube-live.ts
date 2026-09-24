import { getYouTubeTokens } from "@/lib/social-tokens";
import { fetchRSSResults, webSearch } from "@/lib/web-search";

const API = "https://www.googleapis.com/youtube/v3";
const ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2/reports";

type YouTubeResponse = Record<string, unknown>;

export interface LiveVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  tags: string[];
  duration: string;
  views: number;
  likes: number;
  comments: number;
  thumbnail: string;
}

export interface LiveChannel {
  id: string;
  title: string;
  description: string;
  subscribers: number;
  views: number;
  videoCount: number;
  uploadsPlaylistId: string;
  thumbnail: string;
}

function asRecord(value: unknown): YouTubeResponse {
  return value && typeof value === "object" ? value as YouTubeResponse : {};
}

function asArray(value: unknown): YouTubeResponse[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function numberValue(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isoDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

function parseDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration || "Unknown";
  const h = Number(match[1] || 0);
  const m = Number(match[2] || 0);
  const s = Number(match[3] || 0);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

async function youtubeFetch(path: string, accessToken: string): Promise<YouTubeResponse> {
  const response = await fetch(`${API}/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(20000),
  });
  const data = asRecord(await response.json().catch(() => ({})));
  if (!response.ok) {
    const error = asRecord(data.error);
    throw new Error(`YouTube API ${response.status}: ${String(error.message || "request failed")}`);
  }
  return data;
}

async function youtubePublicFetch(path: string): Promise<YouTubeResponse | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${API}/${path}${separator}key=${encodeURIComponent(key)}`, {
    signal: AbortSignal.timeout(20000),
  });
  const data = asRecord(await response.json().catch(() => ({})));
  if (!response.ok) {
    const error = asRecord(data.error);
    throw new Error(`YouTube public API ${response.status}: ${String(error.message || "request failed")}`);
  }
  return data;
}

function mapVideo(item: YouTubeResponse): LiveVideo {
  const snippet = asRecord(item.snippet);
  const statistics = asRecord(item.statistics);
  const contentDetails = asRecord(item.contentDetails);
  const thumbnails = asRecord(snippet.thumbnails);
  const medium = asRecord(thumbnails.medium);
  return {
    id: String(item.id || ""),
    title: String(snippet.title || "Untitled"),
    description: String(snippet.description || ""),
    publishedAt: String(snippet.publishedAt || ""),
    channelId: String(snippet.channelId || ""),
    channelTitle: String(snippet.channelTitle || ""),
    tags: Array.isArray(snippet.tags) ? snippet.tags.map(String) : [],
    duration: parseDuration(String(contentDetails.duration || "")),
    views: numberValue(statistics.viewCount),
    likes: numberValue(statistics.likeCount),
    comments: numberValue(statistics.commentCount),
    thumbnail: String(medium.url || ""),
  };
}

export async function getLiveChannel(userId: string): Promise<LiveChannel> {
  const { accessToken } = await getYouTubeTokens(userId);
  const data = await youtubeFetch("channels?part=snippet,statistics,contentDetails&mine=true", accessToken);
  const channel = asArray(data.items)[0];
  if (!channel) throw new Error("No YouTube channel is linked to this account.");
  const snippet = asRecord(channel.snippet);
  const stats = asRecord(channel.statistics);
  const details = asRecord(channel.contentDetails);
  const related = asRecord(details.relatedPlaylists);
  const thumbs = asRecord(snippet.thumbnails);
  const medium = asRecord(thumbs.medium);
  return {
    id: String(channel.id || ""),
    title: String(snippet.title || ""),
    description: String(snippet.description || ""),
    subscribers: numberValue(stats.subscriberCount),
    views: numberValue(stats.viewCount),
    videoCount: numberValue(stats.videoCount),
    uploadsPlaylistId: String(related.uploads || ""),
    thumbnail: String(medium.url || ""),
  };
}

export async function getChannelVideos(userId: string, maxResults = 25): Promise<LiveVideo[]> {
  const tokens = await getYouTubeTokens(userId);
  const channel = await getLiveChannel(userId);
  if (!channel.uploadsPlaylistId) return [];
  const playlist = await youtubeFetch(`playlistItems?part=contentDetails&playlistId=${encodeURIComponent(channel.uploadsPlaylistId)}&maxResults=${Math.min(maxResults, 50)}`, tokens.accessToken);
  const ids = asArray(playlist.items).map(item => String(asRecord(item.contentDetails).videoId || "")).filter(Boolean);
  if (!ids.length) return [];
  const videos = await youtubeFetch(`videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`, tokens.accessToken);
  return asArray(videos.items).map(mapVideo);
}

export async function searchLiveVideos(userId: string, query: string, maxResults = 10): Promise<LiveVideo[]> {
  const tokens = await getYouTubeTokens(userId);
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    order: "date",
    maxResults: String(Math.min(maxResults, 50)),
    publishedAfter: isoDate(30),
  });
  const search = await youtubeFetch(`search?${params.toString()}`, tokens.accessToken);
  const ids = asArray(search.items).map(item => String(asRecord(item.id).videoId || "")).filter(Boolean);
  if (!ids.length) return [];
  const details = await youtubeFetch(`videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`, tokens.accessToken);
  return asArray(details.items).map(mapVideo);
}

export async function searchLiveChannels(userId: string, query: string, maxResults = 3): Promise<LiveChannel[]> {
  const tokens = await getYouTubeTokens(userId);
  const params = new URLSearchParams({ part: "snippet", q: query, type: "channel", maxResults: String(Math.min(maxResults, 10)) });
  const search = await youtubeFetch(`search?${params.toString()}`, tokens.accessToken);
  const ids = asArray(search.items).map(item => String(asRecord(item.id).channelId || "")).filter(Boolean);
  if (!ids.length) return [];
  const details = await youtubeFetch(`channels?part=snippet,statistics,contentDetails&id=${ids.join(",")}`, tokens.accessToken);
  return asArray(details.items).map(channel => {
    const snippet = asRecord(channel.snippet);
    const stats = asRecord(channel.statistics);
    const content = asRecord(channel.contentDetails);
    const related = asRecord(content.relatedPlaylists);
    return {
      id: String(channel.id || ""), title: String(snippet.title || ""), description: String(snippet.description || ""),
      subscribers: numberValue(stats.subscriberCount), views: numberValue(stats.viewCount), videoCount: numberValue(stats.videoCount),
      uploadsPlaylistId: String(related.uploads || ""), thumbnail: String(asRecord(asRecord(snippet.thumbnails).medium).url || ""),
    };
  });
}

export async function getVideoById(userId: string, videoId: string): Promise<LiveVideo | null> {
  const tokens = await getYouTubeTokens(userId);
  const data = await youtubeFetch(`videos?part=snippet,statistics,contentDetails&id=${encodeURIComponent(videoId)}`, tokens.accessToken);
  const item = asArray(data.items)[0];
  return item ? mapVideo(item) : null;
}

async function getPublicVideoById(videoId: string): Promise<LiveVideo | null> {
  const data = await youtubePublicFetch(`videos?part=snippet,statistics,contentDetails&id=${encodeURIComponent(videoId)}`);
  const item = data ? asArray(data.items)[0] : null;
  return item ? mapVideo(item) : null;
}

async function searchPublicVideos(query: string, maxResults = 10): Promise<LiveVideo[]> {
  const params = new URLSearchParams({
    part: "snippet", q: query, type: "video", order: "date",
    maxResults: String(Math.min(maxResults, 50)), publishedAfter: isoDate(30),
  });
  const search = await youtubePublicFetch(`search?${params.toString()}`);
  if (!search) return [];
  const ids = asArray(search.items).map(item => String(asRecord(item.id).videoId || "")).filter(Boolean);
  if (!ids.length) return [];
  const details = await youtubePublicFetch(`videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`);
  return details ? asArray(details.items).map(mapVideo) : [];
}

async function searchPublicChannels(query: string, maxResults = 3): Promise<LiveChannel[]> {
  const params = new URLSearchParams({ part: "snippet", q: query, type: "channel", maxResults: String(Math.min(maxResults, 10)) });
  const search = await youtubePublicFetch(`search?${params.toString()}`);
  if (!search) return [];
  const ids = asArray(search.items).map(item => String(asRecord(item.id).channelId || "")).filter(Boolean);
  if (!ids.length) return [];
  const details = await youtubePublicFetch(`channels?part=snippet,statistics,contentDetails&id=${ids.join(",")}`);
  return details ? asArray(details.items).map(channel => {
    const snippet = asRecord(channel.snippet);
    const stats = asRecord(channel.statistics);
    const content = asRecord(channel.contentDetails);
    const related = asRecord(content.relatedPlaylists);
    return {
      id: String(channel.id || ""), title: String(snippet.title || ""), description: String(snippet.description || ""),
      subscribers: numberValue(stats.subscriberCount), views: numberValue(stats.viewCount), videoCount: numberValue(stats.videoCount),
      uploadsPlaylistId: String(related.uploads || ""), thumbnail: String(asRecord(asRecord(snippet.thumbnails).medium).url || ""),
    };
  }) : [];
}

export async function getVideoAnalytics(userId: string, videoId: string, days = 28): Promise<Record<string, string | number> | null> {
  const tokens = await getYouTubeTokens(userId);
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    ids: "channel==MINE", startDate: start, endDate: end, dimensions: "video", filters: `video==${videoId}`,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,impressions,impressionClickThroughRate",
  });
  const response = await fetch(`${ANALYTICS_API}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` }, signal: AbortSignal.timeout(20000),
  });
  const data = asRecord(await response.json().catch(() => ({})));
  if (!response.ok) return null;
  const headers = asArray(data.columnHeaders).map(item => String(item.name || ""));
  const row = asArray(data.rows)[0];
  if (!row) return null;
  return Object.fromEntries(headers.map((header, index) => [header, row[index] as string | number]));
}

export function extractVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0] || null;
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/");
    const index = parts.findIndex(part => part === "shorts" || part === "embed");
    return index >= 0 ? parts[index + 1] || null : null;
  } catch { return null; }
}

function serializeVideos(videos: LiveVideo[]): string {
  return videos.map(video => ({
    id: video.id, title: video.title, channel: video.channelTitle, publishedAt: video.publishedAt,
    duration: video.duration, views: video.views, likes: video.likes, comments: video.comments,
    tags: video.tags.slice(0, 15), url: `https://www.youtube.com/watch?v=${video.id}`,
  })).map(item => JSON.stringify(item)).join("\n");
}

async function buildPublicLiveContext(promptId: number, profile: Record<string, string>, payload: Record<string, string>): Promise<string> {
  const niche = profile.niche || "YouTube creators";
  let brief: Record<string, string> = {};
  try {
    brief = JSON.parse(payload.workflowBrief || "{}");
  } catch {}
  const selectedTitle = brief.title || brief.sourceTitle || "";
  const selectedUrl = brief.sourceUrl || "";
  const selectedDate = brief.publishedAt || "";
  const topic = payload.topic || payload.title || selectedTitle || payload.videoId || niche;
  const queryByPrompt: Record<number, string> = {
    1: `YouTube trending topics and videos in ${niche} this week`,
    2: `YouTube competitor channels and content gaps in ${payload.competitors || niche}`,
    3: `YouTube evergreen and trending video ideas for ${payload.topicList || niche}`,
    4: `YouTube creator trends and breaking news in ${niche} this month`,
    5: `high click through rate YouTube titles for ${topic}`,
    6: `YouTube thumbnail text and packaging trends for ${topic}`,
    7: `viral YouTube video structures and scripts for ${topic}`,
    8: `YouTube Shorts trends and hooks for ${topic}`,
    9: `YouTube and Instagram content repurposing trends for ${topic}`,
    10: `YouTube keyword and hashtag trends for ${topic}`,
    11: `YouTube content calendar trends for ${niche}`,
    12: `YouTube content repurposing ideas for ${topic}`,
    13: `YouTube video ${payload.videoUrl || payload.videoId || topic} public performance and audience response`,
    14: `YouTube channel audit best practices and successful ${niche} channels`,
  };
  const query = queryByPrompt[promptId] || `latest YouTube ${niche} trends`;
  const rss = await fetchRSSResults([`${topic} when:7d`, `${niche} creator video trends when:7d`, query], 6);
  const web = rss.length >= 3 || selectedUrl
    ? { summary: "", citations: [] as { title: string; url: string }[] }
    : await webSearch(query, process.env.OPENAI_API_KEY || "", 10);
  const lines = [`LIVE PUBLIC WEB DATA ONLY (retrieved ${new Date().toISOString()}):`, `WEB SEARCH SUMMARY:\n${web.summary || "The AI web-search provider was unavailable; current public RSS records are provided below."}`];
  const sources = [
    ...(selectedUrl ? [`- SELECTED TREND: ${selectedTitle}${selectedDate ? ` (${selectedDate})` : ""}: ${selectedUrl}`] : []),
    ...web.citations.map(citation => `- ${citation.title}: ${citation.url}`),
    ...rss.map(item => `- ${item.title}${item.publishedAt ? ` (${item.publishedAt})` : ""}: ${item.url}`),
  ];
  if (sources.length) lines.push("PUBLIC WEB SOURCES:\n" + [...new Set(sources)].join("\n"));

  if (promptId === 13) {
    const videoId = extractVideoId(payload.videoId || payload.videoUrl || payload.title || "");
    if (videoId) {
      const video = await getPublicVideoById(videoId).catch(() => null);
      if (video) lines.push("PUBLIC VIDEO STATISTICS:\n" + JSON.stringify(video));
    }
  } else if (promptId === 2) {
    const competitors = (payload.competitors || "").split(",").map(value => value.trim()).filter(Boolean).slice(0, 3);
    for (const competitor of competitors) {
      const channels = await searchPublicChannels(competitor, 1).catch(() => []);
      const videos = await searchPublicVideos(`${competitor} ${niche}`, 5).catch(() => []);
      lines.push(`PUBLIC COMPETITOR ${competitor}: ${JSON.stringify(channels[0] || null)}\n${serializeVideos(videos)}`);
    }
  } else {
    const videos = await searchPublicVideos(topic, 10).catch(() => []);
    if (videos.length) lines.push("PUBLIC RECENT VIDEOS:\n" + serializeVideos(videos));
  }

  if (!selectedUrl && !web.summary && web.citations.length === 0 && rss.length === 0 && !lines.some(line => line.startsWith("PUBLIC "))) {
    throw new Error("No current public web data was returned. Try again with a broader niche or time window.");
  }
  lines.push("PLATFORM ACCOUNT DATA: intentionally excluded. Use only current public web sources above. Private channel analytics are unavailable in this workflow; label platform metrics unavailable instead of estimating.");
  return lines.join("\n\n");
}

export async function buildLiveContext(userId: string | null, promptId: number, profile: Record<string, string>, payload: Record<string, string>): Promise<string> {
  if (!userId) return buildPublicLiveContext(promptId, profile, payload);
  const niche = profile.niche || "the channel niche";
  const lines: string[] = [`LIVE YOUTUBE DATA (retrieved ${new Date().toISOString()}):`];
  const channel = await getLiveChannel(userId);
  lines.push(`OWN CHANNEL: ${JSON.stringify(channel)}`);

  if (promptId === 14) {
    lines.push("OWN CHANNEL RECENT VIDEOS:\n" + serializeVideos(await getChannelVideos(userId, 50)));
  } else if (promptId === 13) {
    const videoId = extractVideoId(payload.videoId || payload.videoUrl || payload.title || "");
    if (!videoId) throw new Error("Enter a YouTube video URL or 11-character video ID for live analysis.");
    const video = await getVideoById(userId, videoId);
    if (!video) throw new Error("That YouTube video was not found or is not accessible.");
    lines.push("VIDEO:\n" + JSON.stringify(video));
    const analytics = await getVideoAnalytics(userId, videoId);
    lines.push("YOUTUBE ANALYTICS (may be unavailable unless the OAuth account owns the video):\n" + JSON.stringify(analytics || { unavailable: true }));
  } else if (promptId === 2) {
    const competitors = (payload.competitors || "").split(",").map(value => value.trim()).filter(Boolean).slice(0, 3);
    for (const competitor of competitors) {
      const channels = await searchLiveChannels(userId, competitor, 1);
      const videos = channels[0] ? await searchLiveVideos(userId, `${channels[0].title} ${niche}`, 5) : [];
      lines.push(`COMPETITOR ${competitor}: ${JSON.stringify(channels[0] || null)}\n${serializeVideos(videos)}`);
    }
  } else if (promptId === 3) {
    const topics = (payload.topicList || "").split(/\n|,/).map(value => value.trim()).filter(Boolean).slice(0, 10);
    for (const topic of topics) lines.push(`TOPIC ${topic}:\n${serializeVideos(await searchLiveVideos(userId, topic, 5))}`);
  } else if (promptId === 5 || promptId === 6 || promptId === 7 || promptId === 8 || promptId === 9 || promptId === 10 || promptId === 12) {
    const query = payload.topic || payload.title || payload.contentDesc || niche;
    lines.push("RELATED CURRENT VIDEOS:\n" + serializeVideos(await searchLiveVideos(userId, query, 10)));
  } else {
    lines.push("CURRENT NICHE VIDEOS:\n" + serializeVideos(await searchLiveVideos(userId, niche, 15)));
  }
  return lines.join("\n");
}
