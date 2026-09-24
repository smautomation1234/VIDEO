import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    const { videoSummary, targetPlatform } = await request.json();

    if (!videoSummary) return NextResponse.json({ error: 'Video summary is required' }, { status: 400 });

    const prompt = `Act as an expert Social Media Manager and SEO Specialist for ${targetPlatform || 'YouTube'}.

Given the following raw summary or transcript of a video, generate the perfect upload metadata package.

RAW VIDEO SUMMARY:
"""
${videoSummary}
"""

You must return a strictly valid JSON object with the following schema:
{
  "titles": ["Title 1 (Clickbaity but true)", "Title 2 (SEO focused)", "Title 3 (Curiosity gap)"],
  "description": "A fully formatted description including an intro, key takeaways, and social links placeholder. Use line breaks.",
  "tags": ["tag1", "tag2", "tag3", "etc (up to 15)"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "timestamps": [
    {"time": "00:00", "label": "Intro"},
    {"time": "00:45", "label": "First major point"},
    {"time": "02:30", "label": "Conclusion"}
  ]
}

Make sure the output is ONLY the JSON object. Do not wrap in markdown tags.`;

    const aiResult = await generateWithWebSearch({ prompt });
    return NextResponse.json(JSON.parse(aiResult.text));
  } catch (err: any) {
    console.error('Metadata Gen Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate metadata' }, { status: 500 });
  }
}
