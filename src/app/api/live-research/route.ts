import { NextResponse } from "next/server";
import { buildContentIntelligence, isConcreteTopic, type IntelligenceSource } from "@/lib/content-intelligence";
import { fetchRSSResults, webSearch } from "@/lib/web-search";
import { generateWithWebSearch } from "@/lib/ai";

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X/Twitter",
  tiktok: "TikTok",
};

function clean(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanList(value: unknown, max = 5): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => clean(item)).filter(Boolean))].slice(0, max);
}

function competitorSearchTerm(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return `${url.hostname.replace(/^www\./, "")} ${url.pathname.split("/").filter(Boolean).slice(0, 2).join(" ")}`.trim();
  } catch {
    return value.slice(0, 100);
  }
}

function uniqueSources(sources: IntelligenceSource[]) {
  return [...new Map(sources.map(source => [source.url, source])).values()];
}

function fallbackReport(
  niche: string,
  audience: string,
  sources: IntelligenceSource[],
  intelligence: ReturnType<typeof buildContentIntelligence>,
) {
  const opportunities = intelligence.opportunities.map(item => [
    `${item.rank}. ${item.title}`,
    `   - Platform: ${item.platform}`,
    `   - Opportunity score: ${item.opportunityScore}/100 (${item.confidence})`,
    `   - Format: ${item.format}`,
    `   - Hook: ${item.hook}`,
    `   - Why now: ${item.whyNow}`,
    `   - Evidence: ${item.sourceUrl}`,
  ].join("\n")).join("\n\n");

  const gaps = intelligence.gaps.map((gap, index) => `${index + 1}. ${gap.question}\n   - Format: ${gap.suggestedFormat}\n   - Evidence: ${gap.sourceUrl}`).join("\n\n");
  const sourceList = sources.map(source => `- [${source.title}](${source.url}) — ${source.platform}${source.publishedAt ? `, ${source.publishedAt}` : ""}`).join("\n");
  const pack = intelligence.contentPackage;

  return `# Live Content Opportunity Report: ${niche}

This plan was built directly from current public source records. The richer AI narrative was unavailable, but the scores and recommendations below still use the retrieved evidence.

## What is moving now

${intelligence.trendSignals.map(signal => `- **${signal.stage}:** ${signal.topic} (${signal.platform}, ${signal.score}/100)`).join("\n")}

## Ranked content opportunities

${opportunities}

## Content gaps

${gaps}

## Ready-to-record package

**Working title:** ${pack.workingTitle}

**Hook:** ${pack.shortScript.hook}

**Setup:** ${pack.shortScript.setup}

**Value:** ${pack.shortScript.value}

**Proof:** ${pack.shortScript.proof}

**CTA:** ${pack.shortScript.cta}

## Seven-day execution rule

Publish the highest-scoring fresh opportunity first, then alternate current evidence with evergreen education for ${audience}. Revalidate every "Today" recommendation before recording.

## Live sources

${sourceList}

## Accuracy rule

Opportunity scores are planning heuristics, not reach forecasts. Do not quote engagement, search volume, or algorithm metrics unless a linked source explicitly provides them.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const niche = clean(body.niche);
    const audience = clean(body.audience, "people interested in this topic");
    const goal = clean(body.goal, "grow attention and build an audience");
    const request = clean(body.request, "trends, content gaps, and content ideas");
    const region = clean(body.region, "Global");
    const language = clean(body.language, "English");
    const timeRange = clean(body.timeRange, "past 7 days");
    const contentType = clean(body.contentType, "both");
    const deliverable = clean(body.deliverable, "Full one-stop content plan");
    const competitorUrls = cleanList(body.competitorUrls, 5);
    const platformIds = cleanList(body.platforms, Object.keys(PLATFORM_LABELS).length)
      .map(value => value.toLowerCase())
      .filter(value => PLATFORM_LABELS[value]);
    const platforms = platformIds.length ? platformIds : Object.keys(PLATFORM_LABELS);

    if (!niche) return NextResponse.json({ error: "Enter a niche or topic first." }, { status: 400 });
    if (!platforms.length) return NextResponse.json({ error: "Choose at least one platform." }, { status: 400 });

    const competitorTerms = competitorUrls.map(competitorSearchTerm).join(" OR ");
    const searches = await Promise.allSettled(platforms.map(async platform => {
      const label = PLATFORM_LABELS[platform];
      const typeQuery = contentType === "evergreen"
        ? "evergreen search-driven questions, foundational explainers, tutorials, checklists, comparisons, and recurring problems"
        : contentType === "trending"
          ? "breaking news, current developments, named events, launches, policy changes, debates, and news"
          : "current developments plus evergreen search-driven questions, tutorials, and recurring problems";
      const baseQuery = `${label} ${niche} ${request} ${region} ${language} ${typeQuery} ${timeRange}`;
      const webQuery = competitorTerms ? `${baseQuery}. Also look for public evidence about: ${competitorTerms}` : baseQuery;
      const [web, rss] = await Promise.all([
        webSearch(webQuery, process.env.OPENAI_API_KEY || "", 8),
        fetchRSSResults([
          `${niche} ${region} ${contentType === "evergreen" ? "evergreen guide tutorial comparison how-to" : "latest news"} ${timeRange}`,
          `${niche} ${label} named developments news`,
          `${niche} market policy launch update`,
        ], 5),
      ]);

      const sources: IntelligenceSource[] = [
        ...web.citations.map(source => ({
          ...source,
          platform: label,
          origin: "openai-web-search" as const,
        })),
        ...rss.map(source => ({
          title: source.title,
          url: source.url,
          publishedAt: source.publishedAt,
          platform: label,
          origin: "google-news-rss" as const,
        })),
      ];

      return {
        platform,
        summary: web.summary || rss.map(item => `- ${item.title}${item.publishedAt ? ` (${item.publishedAt})` : ""}`).join("\n"),
        sources: uniqueSources(sources),
      };
    }));

    let live = searches
      .filter((item): item is PromiseFulfilledResult<{ platform: string; summary: string; sources: IntelligenceSource[] }> => item.status === "fulfilled")
      .map(item => item.value)
      .filter(item => item.sources.length > 0);

    if (competitorUrls.length) {
      const competitorRss = await fetchRSSResults(
        competitorUrls.map(value => `${competitorSearchTerm(value)} ${niche} latest`),
        4,
      );
      if (competitorRss.length) {
        live = [...live, {
          platform: "competitors",
          summary: competitorRss.map(item => `- ${item.title}`).join("\n"),
          sources: competitorRss.map(item => ({
            title: item.title,
            url: item.url,
            publishedAt: item.publishedAt,
            platform: "Competitor scan",
            origin: "google-news-rss" as const,
          })),
        }];
      }
    }

    const sourceObjects = uniqueSources(live.flatMap(item => item.sources)).filter(source => isConcreteTopic(source.title));
    if (!sourceObjects.length) {
      return NextResponse.json({ error: "No current public data was returned. Check internet access and try a broader niche or research window." }, { status: 503 });
    }

    const intelligence = buildContentIntelligence({
      niche,
      audience,
      goal,
      platforms: platforms.map(platform => PLATFORM_LABELS[platform]),
      competitorUrls,
      sources: sourceObjects,
    });
    const sourceLines = sourceObjects.map(source => `- [${source.title}](${source.url}) (${source.platform}${source.publishedAt ? `; ${source.publishedAt}` : ""})`);
    const research = live.map(item => `### ${PLATFORM_LABELS[item.platform] || "Competitor scan"} live research\n${item.summary}`).join("\n\n") + `\n\nSOURCE LIST:\n${sourceLines.join("\n")}`;
    const prompt = `Create a practical cross-platform content plan using ONLY the live research below.

NICHE: ${niche}
AUDIENCE: ${audience}
GOAL: ${goal}
REQUEST: ${request}
REGION: ${region}
LANGUAGE: ${language}
RESEARCH WINDOW: ${timeRange}
CONTENT TYPE: ${contentType}
DELIVERABLE: ${deliverable}
PLATFORMS: ${platforms.map(platform => PLATFORM_LABELS[platform]).join(", ")}
PUBLIC COMPETITOR REFERENCES: ${competitorUrls.join(", ") || "none"}

${research}

Return a ${deliverable} containing:
1. What is moving now, with platform, evidence, recency, and what is confirmed versus inferred.
2. Ten ranked content opportunities with three title options, a source-aware description, a specific angle, format, hook, source, urgency, relevant hashtag/keyword options, and validation test.
3. The clearest underserved audience questions or content gaps visible in the evidence.
4. Platform adaptations for the top three ideas.
5. A complete package for the strongest idea: five hooks, title, thumbnail text, 30–45 second script, visual beats, caption, and CTA.
6. A seven-day publishing plan balancing timely and evergreen content.
7. What not to claim when metrics are missing.

Never invent search volume, engagement, follower counts, algorithm rules, or trend duration. The application computes a separate transparent opportunity heuristic; do not describe it as a platform prediction. If evidence is missing, say "unavailable" and prescribe a validation test.`;

    let content = fallbackReport(niche, audience, sourceObjects, intelligence);
    let partial = true;
    if (process.env.ENABLE_AI_SYNTHESIS === 'true') try {
      const aiResult = await generateWithWebSearch({
        system: "You are a rigorous live-data content strategist. Cite supplied sources inline, separate evidence from hypotheses, and never promise virality.",
        prompt,
      });
      content = aiResult.text;
    } catch (synthesisError) {
      const message = synthesisError instanceof Error ? synthesisError.message : "AI synthesis unavailable";
      console.error("Live research synthesis failed; returning verified research:", message);
      content = fallbackReport(niche, audience, sourceObjects, intelligence);
    }

    return NextResponse.json({
      content: content || fallbackReport(niche, audience, sourceObjects, intelligence),
      intelligence,
      liveData: true,
      partial,
      dataMode: partial ? "live-sources-with-deterministic-analysis" : "live-web-search-with-ai-synthesis",
      retrievedAt: new Date().toISOString(),
      platforms,
      contentType,
      sources: sourceObjects,
    });
  } catch (error: unknown) {
    console.error("Live research API error:", error instanceof Error ? error.message : "Unknown error");
    const message = error instanceof Error ? error.message : "Live research failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
