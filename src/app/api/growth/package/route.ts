import { NextResponse } from 'next/server';
import type { ContentPackage, GrowthCampaign, PlatformContent } from '@/lib/growth-workspace';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function platformFallback(campaign: GrowthCampaign, platform: string, format: string): PlatformContent {
  const hook = campaign.hook || `Most people misunderstand ${campaign.title}. Here is the practical version.`;
  return {
    title: campaign.title,
    hook,
    body: `${hook}\n\n${campaign.summary || `Explain the durable principles behind ${campaign.title}.`}\n\n1. What it means\n2. Why it matters\n3. What to do next\n\nVerify any time-sensitive claim using the evidence links before publishing.`,
    description: `An evidence-aware explanation of ${campaign.title} for ${campaign.audience}.`,
    hashtags: campaign.keywords.slice(0, 5).map(keyword => `#${keyword.replace(/[^a-z0-9]/gi, '')}`).filter(tag => tag.length > 1),
    cta: 'What is the biggest question you still have about this?',
    format,
    visualDirection: platform === 'youtube' ? 'Clear face-led thumbnail with one concrete promise and minimal text.' : 'Use a clean proof-point visual with readable on-screen text.',
  };
}

function fallbackPackage(campaign: GrowthCampaign): ContentPackage {
  return {
    generatedAt: new Date().toISOString(),
    strategy: 'Start with the durable audience problem, cite the supplied public evidence, and adapt the depth rather than copying the same post across platforms.',
    youtube: platformFallback(campaign, 'youtube', '8–12 minute evidence-led explainer'),
    instagram: platformFallback(campaign, 'instagram', '30–45 second Reel plus carousel adaptation'),
    linkedin: platformFallback(campaign, 'linkedin', 'Professional text post with a discussion question'),
    x: platformFallback(campaign, 'x', 'Single insight post plus 6-post thread'),
    factCheck: campaign.evidence.length ? campaign.evidence.map(item => `Verify the claim and date at ${item.url}`) : ['No public evidence was attached. Treat factual claims as unverified until sources are added.'],
    repurposePlan: ['Publish the cornerstone YouTube explanation.', 'Turn the main framework into an Instagram carousel.', 'Share the professional implication on LinkedIn.', 'Convert the key lessons into an X thread.'],
  };
}

function readableText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const lines = value.map((item, index) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const heading = readableText(record.heading || record.section || record.title || record.scene || record.post, `Part ${index + 1}`);
        const detail = readableText(record.content || record.text || record.script || record.body || record.description || record.point);
        return detail ? `${heading}\n${detail}` : heading;
      }
      return readableText(item);
    }).filter(Boolean);
    return lines.join('\n\n') || fallback;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferred = record.content || record.text || record.script || record.body || record.description;
    if (preferred) return readableText(preferred, fallback);
    const lines = Object.entries(record).map(([key, item]) => {
      const text = readableText(item);
      return text ? `${key.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase())}: ${text}` : '';
    }).filter(Boolean);
    return lines.join('\n\n') || fallback;
  }
  return fallback;
}

function readableList(value: unknown, fallback: string[], limit = 12): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.map(item => readableText(item)).filter(Boolean).slice(0, limit);
  return items.length ? items : fallback;
}

function asContent(value: unknown, fallback: PlatformContent): PlatformContent {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    title: readableText(record.title, fallback.title),
    hook: readableText(record.hook, fallback.hook),
    body: readableText(record.body || record.script || record.thread, fallback.body),
    description: readableText(record.description || record.caption, fallback.description),
    hashtags: readableList(record.hashtags || record.keywords, fallback.hashtags, 10).map(tag => tag.startsWith('#') ? tag : `#${tag.replace(/[^a-z0-9]/gi, '')}`).filter(tag => tag.length > 1),
    cta: readableText(record.cta, fallback.cta),
    format: readableText(record.format, fallback.format),
    visualDirection: readableText(record.visualDirection || record.thumbnailDirection, fallback.visualDirection || ''),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const campaign = body.campaign as GrowthCampaign;
    if (!campaign?.title || !campaign?.niche) return NextResponse.json({ error: 'Campaign title and niche are required.' }, { status: 400 });
    const fallback = fallbackPackage(campaign);
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) return NextResponse.json(fallback);

    const evidence = campaign.evidence.map(item => ({ title: item.title, url: item.url, source: item.source, publishedAt: item.publishedAt, kind: item.kind }));
    const aiResult = await generateWithWebSearch({
      prompt: `Build one complete cross-platform production package.

CAMPAIGN:
${JSON.stringify({ title: campaign.title, niche: campaign.niche, audience: campaign.audience, goal: campaign.goal, summary: campaign.summary, hook: campaign.hook, keywords: campaign.keywords, evidence })}

Return JSON with: strategy, youtube, instagram, linkedin, x, factCheck, repurposePlan.
Each platform object must contain: title, hook, body, description, hashtags (array), cta, format, visualDirection.

Requirements:
- YouTube: a specific searchable title, 8–12 minute script with hook/sections/CTA, description, keywords, and thumbnail direction.
- Instagram: Reel script with scene/on-screen text guidance plus caption and hashtags.
- LinkedIn: complete readable post with professional implication and discussion question.
- X: strong single post plus a numbered 6–8 post thread in body.
- Adapt the idea to each platform; do not paste identical copy.
- Use only supplied evidence for factual/current claims. Preserve the evidence URLs in factCheck.
- If evidence is absent, write durable educational content and explicitly identify claims requiring verification.
- Never invent reach, engagement, search volume, subscriber counts, algorithm weights, or viral probability.
- Do not promise virality.`,
      maxOutputTokens: 5500,
    });
    const parsed = JSON.parse(aiResult.text || '{}') as Record<string, unknown>;
    const result: ContentPackage = {
      generatedAt: new Date().toISOString(),
      strategy: String(parsed.strategy || fallback.strategy),
      youtube: asContent(parsed.youtube, fallback.youtube),
      instagram: asContent(parsed.instagram, fallback.instagram),
      linkedin: asContent(parsed.linkedin, fallback.linkedin),
      x: asContent(parsed.x, fallback.x),
      factCheck: readableList(parsed.factCheck, fallback.factCheck),
      repurposePlan: readableList(parsed.repurposePlan, fallback.repurposePlan),
    };
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Production package generation failed.';
    console.error('Growth package error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
