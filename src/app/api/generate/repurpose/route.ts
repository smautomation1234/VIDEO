import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { contentType, title, mainPoints, length, niche } = await request.json();
    if (!title || !mainPoints) return NextResponse.json({ error: 'Title and main points are required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    const prompt = `You are an Instagram content repurposing expert who helps creators turn one piece of content into 15+ Instagram assets.

ORIGINAL CONTENT:
- Type: ${contentType || 'YouTube Video'}
- Title: ${title}
- Main Points: ${mainPoints}
- Length: ${length || 'Not specified'}
- Niche: ${niche || 'General'}

Repurpose this into MAXIMUM Instagram content pieces. Be specific and actionable.

Return ONLY valid JSON:
{
  "instagramReels": [
    { "angleType": "The hook angle", "hook": "opening 3 seconds", "description": "how the reel flows" },
    { "angleType": "The controversial take", "hook": "...", "description": "..." },
    { "angleType": "The quick tip version (under 15s)", "hook": "...", "description": "..." }
  ],
  "instagramCarousel": {
    "slideCount": 10,
    "slides": [
      { "slideNumber": 1, "type": "Cover", "headline": "slide headline", "subtext": "supporting text" },
      { "slideNumber": 2, "type": "Value", "headline": "value point", "subtext": "details" }
    ]
  },
  "instagramStories": [
    { "story": 1, "type": "Hook", "text": "story content", "interactive": "poll/quiz/question sticker idea" },
    { "story": 2, "type": "Value", "text": "...", "interactive": "..." },
    { "story": 3, "type": "Value", "text": "...", "interactive": "..." },
    { "story": 4, "type": "Value", "text": "...", "interactive": "..." },
    { "story": 5, "type": "CTA", "text": "...", "interactive": "link sticker / swipe up" }
  ],
  "quoteGraphics": [
    { "quote": "quotable one-liner 1" },
    { "quote": "quotable one-liner 2" },
    { "quote": "quotable one-liner 3" },
    { "quote": "quotable one-liner 4" },
    { "quote": "quotable one-liner 5" }
  ],
  "captionVariations": [
    { "focus": "Reach (keyword-heavy)", "caption": "full caption text here..." },
    { "focus": "Saves (educational format)", "caption": "..." },
    { "focus": "Comments (question-driven)", "caption": "..." }
  ],
  "instagramNotes": [
    "short one-liner for note 1",
    "short one-liner for note 2",
    "short one-liner for note 3"
  ],
  "totalPieces": "15+",
  "priorityOrder": ["instagramReels", "instagramCarousel", "instagramStories"]
}`;

    const { text } = await generateWithWebSearch({ prompt, apiKey });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Repurpose engine error:', err);
    return NextResponse.json({ error: err.message || 'Failed to repurpose content' }, { status: 500 });
  }
}
