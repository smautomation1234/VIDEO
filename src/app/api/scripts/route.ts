import { NextResponse } from 'next/server';
import { generateWithWebSearch } from "@/lib/ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { topic, format, tone, targetAudience, mode, title, videoLength, platform } = await request.json();

    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    let prompt = '';

    // ── MODE 1: VIRAL REEL (Prompt 5) ──────────────────────────────────
    if (mode === 'viral-reel') {
      prompt = `Act as a top Instagram Reels scriptwriter who writes scripts for Reels that get 1M+ views and massive DM shares.

REEL DETAILS:
- Topic: ${topic}
- Target Length: Under 30 seconds (MAXIMUM REACH FORMAT)
- Goal: DM shares and Views
- Tone: ${tone || 'Educational'}
- Audience: ${targetAudience || 'General audience'}

Write the complete Reel script.

Return ONLY valid JSON:
{
  "script": "⏱️ SECOND 0-3 — THE SCROLL STOPPER:\\n[Hook text...]\\n\\n⏱️ SECOND 3-15 — THE SETUP:\\n[Setup text...]\\n\\n⏱️ SECOND 15-25 — THE VALUE BOMB:\\n[Value bomb text...]\\n\\n⏱️ SECOND 25-30 — THE CTA:\\n[CTA text...]",
  "hooks": ["Option A: Bold shocking claim", "Option B: Direct audience call-out", "Option C: Visual description + text overlay combo"],
  "callToAction": "One line that creates action without being salesy (e.g. Save, Share, Watch again).",
  "tips": ["On-screen text: Give me 4 text overlay lines for the video.", "Audio suggestion: What type of audio works best for this Reel?"]
}`;

    // ── MODE 2: CAROUSEL SCRIPT (Prompt 6) ────────────────────────────────────
    } else if (mode === 'carousel') {
      prompt = `Act as a carousel content strategist for Instagram. Write a high-performing educational carousel post.

CAROUSEL DETAILS:
- Topic: ${topic}
- Niche: ${targetAudience || 'General'}
- Tone: ${tone || 'Educational'}
- Number of slides: 10

Return ONLY valid JSON:
{
  "script": "SLIDE 1 — COVER SLIDE\\nHeadline: [Text]\\nSub-text: [Text]\\n\\nSLIDE 2 — [Title]\\nMain text: [2-3 lines]\\nVisual: [Description]\\nMicro-hook: [Teaser]\\n\\n... (Continue through Slide 9) ...\\n\\nSLIDE 10 — CTA SLIDE\\n[Summary]\\n[Clear next step]\\n[Question to drive comments]",
  "hooks": ["Cover headline option 1", "Cover headline option 2", "Cover headline option 3"],
  "callToAction": "Save / Follow / DM me / Share",
  "tips": ["Recommend color scheme", "Font style (Bold/Minimal/Playful)", "Consistent element to use across all slides"]
}`;

    // ── MODE 3: STORY SEQUENCE (Prompt 7) ────────────────────────────────────
    } else if (mode === 'story-sequence') {
      prompt = `Act as an Instagram Stories strategist.
Create a 7-story sequence that keeps viewers watching ALL 7 stories, builds towards a strong CTA at the end, and increases engagement through interactive elements.

STORY DETAILS:
- Topic: ${topic}
- Niche: ${targetAudience || 'General'}
- Tone: ${tone || 'Engaging'}

Return ONLY valid JSON:
{
  "script": "STORY 1 — ATTENTION GRABBER:\\nVisual: [What to show]\\nText overlay: [What to write]\\nInteractive element: [Poll/Question]\\nTransition hook: [Tease]\\n\\nSTORY 2 — BUILD CURIOSITY:\\n[Details...]\\n\\nSTORY 3 — DELIVER VALUE 1:\\n[Details...]\\n\\nSTORY 4 — INTERACTIVE ENGAGEMENT:\\n[Poll/Quiz...]\\n\\nSTORY 5 — DELIVER VALUE 2:\\n[Details...]\\n\\nSTORY 6 — SOCIAL PROOF:\\n[Details...]\\n\\nSTORY 7 — STRONG CTA:\\n[Details...]",
  "hooks": ["Alternative hook for Story 1", "Alternative interactive idea"],
  "callToAction": "Make the final CTA clear and urgent.",
  "tips": ["Make each story feel INCOMPLETE without watching the next.", "Use link stickers effectively."]
}`;

    // ── MODE 4: SEO CAPTION WRITER (Prompt 8) ──────────────────────────
    } else if (mode === 'seo-caption') {
      prompt = `Act as an Instagram SEO and caption specialist for 2026.
In 2026, Instagram works like a SEARCH ENGINE. Keywords in captions now matter MORE than hashtags for discovery.

POST DETAILS:
- Topic: ${topic}
- Niche: ${targetAudience || 'General'}
- Tone: ${tone || 'Professional'}

Write a COMPLETE optimized caption.

Return ONLY valid JSON:
{
  "script": "[The Hook - must make them tap 'more']\\n\\n[Body - 3-5 lines, keyword rich, short punchy sentences]\\n\\n[Engagement Trigger - One question that gets people to comment]\\n\\n[CTA LINE - Save/Share/Send]\\n\\n[5 HASHTAGS - 2 niche, 2 topic, 1 broad]",
  "hooks": ["Hook option A (Bold statement)", "Hook option B (Question style)", "Hook option C ('If you...' format)"],
  "callToAction": "Save this / Share this / Send to someone who needs this (PICK ONE ONLY)",
  "tips": ["SEO CHECK: Confirm main keyword appears in first 2 lines naturally", "Confirm caption reads like a HUMAN wrote it"]
}`;

    // ── MODE 5: CAPTION STYLE PACK (Prompt 9) ─────────────────────────────
    } else if (mode === 'caption-style-pack') {
      prompt = `Write 6 different caption versions — same topic, different styles.

POST DETAILS:
- Topic: ${topic}
- Niche: ${targetAudience || 'General'}
- Tone: ${tone || 'Various'}

Return ONLY valid JSON:
{
  "script": "VERSION 1 — EDUCATIONAL (Saves-focused):\\n[Caption...]\\n\\nVERSION 2 — STORYTELLING (Connection-focused):\\n[Caption...]\\n\\nVERSION 3 — CONTROVERSIAL (Comments-focused):\\n[Caption...]\\n\\nVERSION 4 — MOTIVATIONAL (Shares-focused):\\n[Caption...]\\n\\nVERSION 5 — ULTRA SHORT (Reels-optimized):\\n[Caption...]\\n\\nVERSION 6 — DM SHARE BAIT (Algorithm GOLD):\\n[Caption...]",
  "hooks": ["Educational hook", "Storytelling hook", "Controversial hook"],
  "callToAction": "N/A - CTAs are built into each version.",
  "tips": ["BEST for saves: [Version X]", "BEST for reach: [Version Y]", "BEST for comments: [Version Z]"]
}`;
    } else {
      prompt = `Act as an Instagram expert. Write content for: ${topic}`;
    }

    const { text } = await generateWithWebSearch({ prompt, apiKey });

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse AI response');
      result = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json({ ...result, mode: mode || 'caption' });
  } catch (err: any) {
    console.error('Script writer error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate script' }, { status: 500 });
  }
}
