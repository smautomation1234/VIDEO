export type ConfidenceLevel = "Verified" | "Observed" | "Estimated";
export type TrendStage = "Emerging" | "Accelerating" | "Active" | "Cooling" | "Evergreen";

export interface IntelligenceSource {
  title: string;
  url: string;
  platform: string;
  publishedAt?: string;
  origin: "openai-web-search" | "google-news-rss";
}

export interface ScoreBreakdown {
  freshness: number;
  relevance: number;
  evidence: number;
  crossPlatform: number;
  contentGap: number;
  competitionPenalty: number;
}

export interface TrendSignal {
  id: string;
  topic: string;
  platform: string;
  stage: TrendStage;
  score: number;
  confidence: ConfidenceLevel;
  reason: string;
  sourceUrl: string;
  publishedAt?: string;
}

export interface ContentOpportunity {
  rank: number;
  title: string;
  platform: string;
  angle: string;
  hook: string;
  format: string;
  urgency: "Today" | "This week" | "Evergreen";
  opportunityScore: number;
  confidence: ConfidenceLevel;
  scoreBreakdown: ScoreBreakdown;
  whyNow: string;
  validationTest: string;
  sourceTitle: string;
  sourceUrl: string;
  titleOptions: string[];
  description: string;
  hashtagOptions: string[];
}

export interface ContentGap {
  question: string;
  suggestedFormat: string;
  evidence: string;
  confidence: ConfidenceLevel;
  sourceUrl: string;
}

export interface ContentPackage {
  workingTitle: string;
  thumbnailText: string;
  hooks: string[];
  shortScript: {
    hook: string;
    setup: string;
    value: string;
    proof: string;
    cta: string;
  };
  visualBeats: string[];
  caption: string;
  platformAdaptations: { platform: string; execution: string }[];
}

export interface ContentIntelligence {
  methodology: string;
  trendSignals: TrendSignal[];
  opportunities: ContentOpportunity[];
  gaps: ContentGap[];
  contentPackage: ContentPackage;
  competitorCoverage: {
    requested: string[];
    sourcesFound: number;
    note: string;
  };
}

interface BuildInput {
  niche: string;
  audience: string;
  goal: string;
  platforms: string[];
  competitorUrls: string[];
  sources: IntelligenceSource[];
}

const STOP_WORDS = new Set([
  "about", "after", "again", "against", "being", "could", "from", "have", "into", "latest",
  "more", "news", "over", "that", "their", "there", "these", "this", "those", "today", "trending",
  "viral", "what", "when", "where", "which", "while", "with", "would", "your", "youtube", "instagram",
  "linkedin", "twitter",
]);

// Search providers sometimes return the query itself or evergreen creator advice
// instead of a current event. These are not usable as a concrete topic.
const GENERIC_TOPIC_PATTERNS = [
  /what(?:'|’)s happening this week/i,
  /how to create viral/i,
  /reels ideas? for/i,
  /explore trends on/i,
  /latest creator trends/i,
  /content ideas? for/i,
  /viral content/i,
];

export function isConcreteTopic(title: string) {
  const clean = title.replace(/\s+/g, " ").trim();
  return clean.length >= 28 && !GENERIC_TOPIC_PATTERNS.some(pattern => pattern.test(clean));
}

const PLATFORM_FORMATS: Record<string, string> = {
  YouTube: "8–12 minute evidence-led explainer",
  Instagram: "30–45 second Reel with an on-screen proof point",
  LinkedIn: "contrarian insight post with a practical framework",
  "X/Twitter": "concise observation followed by a 5-post thread",
  TikTok: "25–40 second fast-cut explainer",
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOP_WORDS.has(word));
}

function titleWithoutPublisher(title: string) {
  return title.replace(/\s+-\s+[^-]+$/, "").trim();
}

function ageInHours(publishedAt?: string): number | null {
  if (!publishedAt) return null;
  const timestamp = Date.parse(publishedAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, (Date.now() - timestamp) / 3_600_000);
}

function freshnessScore(publishedAt?: string) {
  const hours = ageInHours(publishedAt);
  if (hours === null) return 42;
  if (hours <= 24) return 100;
  if (hours <= 72) return 88;
  if (hours <= 168) return 76;
  if (hours <= 720) return 55;
  return 30;
}

function trendStage(publishedAt?: string, crossPlatformCount = 1): TrendStage {
  const hours = ageInHours(publishedAt);
  if (hours === null) return crossPlatformCount >= 2 ? "Active" : "Evergreen";
  if (hours <= 36 && crossPlatformCount >= 2) return "Accelerating";
  if (hours <= 36) return "Emerging";
  if (hours <= 168) return "Active";
  if (hours <= 720) return "Cooling";
  return "Evergreen";
}

function confidenceFor(source: IntelligenceSource, corroboration: number): ConfidenceLevel {
  if (source.origin === "google-news-rss" && source.publishedAt && corroboration >= 2) return "Observed";
  if (source.origin === "openai-web-search" || source.publishedAt) return "Observed";
  return "Estimated";
}

function relevanceScore(title: string, niche: string, audience: string) {
  const target = new Set(tokens(`${niche} ${audience}`));
  if (!target.size) return 60;
  const matches = tokens(title).filter(word => target.has(word)).length;
  return clamp(45 + (matches / target.size) * 55);
}

function overlapCount(a: string, b: string) {
  const left = new Set(tokens(a));
  return tokens(b).filter(word => left.has(word)).length;
}

function corroborationFor(source: IntelligenceSource, sources: IntelligenceSource[]) {
  return sources.filter(candidate => candidate.url !== source.url && overlapCount(source.title, candidate.title) >= 2).length + 1;
}

function crossPlatformFor(source: IntelligenceSource, sources: IntelligenceSource[]) {
  return new Set(
    sources
      .filter(candidate => overlapCount(source.title, candidate.title) >= 2)
      .map(candidate => candidate.platform),
  ).size;
}

function scoreSource(source: IntelligenceSource, input: BuildInput): ScoreBreakdown {
  const corroboration = corroborationFor(source, input.sources);
  const platformSpread = crossPlatformFor(source, input.sources);
  const freshness = freshnessScore(source.publishedAt);
  const relevance = relevanceScore(source.title, input.niche, input.audience);
  const evidence = clamp(45 + corroboration * 12 + (source.publishedAt ? 12 : 0));
  const crossPlatform = clamp(30 + platformSpread * 20);
  const contentGap = clamp(82 - (corroboration - 1) * 9);
  const competitionPenalty = clamp((corroboration - 1) * 8, 0, 28);
  return { freshness, relevance, evidence, crossPlatform, contentGap, competitionPenalty };
}

function opportunityScore(score: ScoreBreakdown) {
  return clamp(
    score.freshness * 0.25 +
    score.relevance * 0.24 +
    score.evidence * 0.21 +
    score.crossPlatform * 0.15 +
    score.contentGap * 0.15 -
    score.competitionPenalty,
  );
}

function urgencyFor(publishedAt?: string): "Today" | "This week" | "Evergreen" {
  const hours = ageInHours(publishedAt);
  if (hours !== null && hours <= 48) return "Today";
  if (hours !== null && hours <= 240) return "This week";
  return "Evergreen";
}

function formatFor(platform: string) {
  return PLATFORM_FORMATS[platform] || "short evidence-led explainer";
}

function createAngle(source: IntelligenceSource, audience: string) {
  return `Explain what “${titleWithoutPublisher(source.title)}” changes for ${audience}, then give one action they can use immediately.`;
}

function createHook(source: IntelligenceSource) {
  return `Most people will miss what “${titleWithoutPublisher(source.title)}” actually means—here is the practical takeaway.`;
}

function createTitleOptions(source: IntelligenceSource, audience: string) {
  const topic = titleWithoutPublisher(source.title);
  return [
    topic,
    `What “${topic}” means for ${audience}`,
    `The practical creator guide to ${topic}`,
  ];
}

function createDescription(source: IntelligenceSource, niche: string, audience: string) {
  const topic = titleWithoutPublisher(source.title);
  return `A source-backed ${niche} breakdown for ${audience}: explain what “${topic}” confirms, what remains uncertain, and the practical next step. Verify the linked source before publishing.`;
}

function createHashtags(source: IntelligenceSource, niche: string) {
  const terms = [...new Set([...tokens(niche), ...tokens(titleWithoutPublisher(source.title))])].slice(0, 5);
  return terms.length ? terms.map(term => `#${term}`) : ["#contentstrategy", "#creatorideas", "#industrytrends"];
}

function uniqueSources(sources: IntelligenceSource[]) {
  return [...new Map(sources.map(source => [source.url, source])).values()];
}

export function buildContentIntelligence(input: BuildInput): ContentIntelligence {
  const sources = uniqueSources(input.sources).filter(source => isConcreteTopic(source.title));
  const scored = sources
    .map(source => {
      const scoreBreakdown = scoreSource(source, { ...input, sources });
      const corroboration = corroborationFor(source, sources);
      return {
        source,
        scoreBreakdown,
        score: opportunityScore(scoreBreakdown),
        confidence: confidenceFor(source, corroboration),
        corroboration,
        platformSpread: crossPlatformFor(source, sources),
      };
    })
    .sort((a, b) => b.score - a.score);

  const opportunities: ContentOpportunity[] = scored.slice(0, 10).map((item, index) => ({
    rank: index + 1,
    title: titleWithoutPublisher(item.source.title),
    platform: item.source.platform,
    angle: createAngle(item.source, input.audience),
    hook: createHook(item.source),
    format: formatFor(item.source.platform),
    urgency: urgencyFor(item.source.publishedAt),
    opportunityScore: item.score,
    confidence: item.confidence,
    scoreBreakdown: item.scoreBreakdown,
    whyNow: `${item.source.publishedAt ? "Recently published evidence" : "A current indexed source"} supports this angle${item.platformSpread > 1 ? ` across ${item.platformSpread} selected platforms` : " on the selected platform"}.`,
    validationTest: "Check native search suggestions and the newest public posts before publishing; revise the hook if discussion has cooled.",
    sourceTitle: item.source.title,
    sourceUrl: item.source.url,
    titleOptions: createTitleOptions(item.source, input.audience),
    description: createDescription(item.source, input.niche, input.audience),
    hashtagOptions: createHashtags(item.source, input.niche),
  }));

  const trendSignals: TrendSignal[] = scored.slice(0, 8).map((item, index) => ({
    id: `signal-${index + 1}`,
    topic: titleWithoutPublisher(item.source.title),
    platform: item.source.platform,
    stage: trendStage(item.source.publishedAt, item.platformSpread),
    score: item.score,
    confidence: item.confidence,
    reason: `${item.corroboration} related live source${item.corroboration === 1 ? "" : "s"}; ${item.platformSpread} platform${item.platformSpread === 1 ? "" : "s"}; freshness ${item.scoreBreakdown.freshness}/100.`,
    sourceUrl: item.source.url,
    publishedAt: item.source.publishedAt,
  }));

  const gaps: ContentGap[] = scored.slice(0, 5).map(item => ({
    question: `What does “${titleWithoutPublisher(item.source.title)}” mean in practice for ${input.audience}?`,
    suggestedFormat: item.scoreBreakdown.contentGap >= 70 ? "Beginner-friendly myth-versus-reality breakdown" : "Evidence-led reaction with a specific recommendation",
    evidence: `Based on a current ${item.source.platform} source; content-gap score ${item.scoreBreakdown.contentGap}/100 is a heuristic, not platform search-volume data.`,
    confidence: item.confidence,
    sourceUrl: item.source.url,
  }));

  const strongest = opportunities[0] || {
    title: input.niche,
    hook: `The biggest change happening in ${input.niche} right now`,
    angle: `Give ${input.audience} one useful action they can take today.`,
    sourceTitle: "Live source",
    sourceUrl: "",
  };
  const selectedPlatforms = input.platforms.length ? input.platforms : ["YouTube"];
  const contentPackage: ContentPackage = {
    workingTitle: `${strongest.title}: what it means and what to do next`,
    thumbnailText: "WHAT CHANGED?",
    hooks: [
      strongest.hook,
      `This looks like ordinary ${input.niche} news, but one detail changes the strategy.`,
      `Before you follow the crowd on this ${input.niche} trend, look at the evidence.`,
      `Here is the part of this story most creators are not explaining.`,
      `You have one practical opportunity before this topic becomes crowded.`,
    ],
    shortScript: {
      hook: strongest.hook,
      setup: `A current source is reporting: “${strongest.sourceTitle}.”`,
      value: strongest.angle,
      proof: `Show the linked source on screen, state what is confirmed, and clearly label your interpretation.`,
      cta: `Ask viewers whether they want the detailed ${input.niche} implementation guide next.`,
    },
    visualBeats: [
      "0–2s: Direct-to-camera hook with large on-screen text",
      "2–6s: Show the live source headline and publication time",
      "6–18s: Explain the change using one simple visual",
      "18–30s: Give the audience one immediate action",
      "30–35s: Ask a specific question to invite useful comments",
    ],
    caption: `${strongest.title}\n\nHere is what the evidence confirms, what remains uncertain, and the practical move for ${input.audience}. Save this before planning your next post.`,
    platformAdaptations: selectedPlatforms.map(platform => ({
      platform,
      execution: formatFor(platform),
    })),
  };

  const competitorMatches = sources.filter(source => input.competitorUrls.some(url => source.title.toLowerCase().includes(url.toLowerCase()) || source.url.toLowerCase().includes(url.toLowerCase()))).length;

  return {
    methodology: "Opportunity scores are transparent heuristics using source recency, niche relevance, corroboration, cross-platform overlap, and estimated content whitespace. They are not platform-provided reach predictions and do not guarantee virality.",
    trendSignals,
    opportunities,
    gaps,
    contentPackage,
    competitorCoverage: {
      requested: input.competitorUrls,
      sourcesFound: competitorMatches,
      note: input.competitorUrls.length
        ? "Coverage includes only publicly indexed evidence returned by the live search. Private analytics and unindexed posts are unavailable without account access."
        : "Add public creator, channel, or profile URLs to include competitor signals in the next scan.",
    },
  };
}
