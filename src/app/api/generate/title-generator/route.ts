import { NextResponse } from 'next/server';
import { generateWithWebSearch } from "@/lib/ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { topic, audience, style, channelName } = await request.json();
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    const prompt = `You are a world-class YouTube title copywriter who has written titles for videos with 10M+ views.

VIDEO DETAILS:
- Topic: ${topic}
- Target Audience: ${audience || 'General social media audience'}
- Channel Style: ${style || 'Educational'}
- Channel Name: ${channelName || 'My Channel'}

Generate exactly 20 title options using these formulas, and for each also provide emotion, ctrPrediction (Low/Medium/High), and bestPlatform.

FORMAT 1 — NUMBER TITLES (5 titles):
Pattern: "[Number] [Things/Ways/Secrets] That [Benefit/Outcome]"

FORMAT 2 — CURIOSITY TITLES (5 titles):
Use words like: Nobody, Finally, Truth, Secret, Hidden, Exposed, What They Won't Tell You

FORMAT 3 — STORY TITLES (5 titles):
Pattern: "I [Did Something] for [Time Period] — Here's What Happened"

FORMAT 4 — VS/COMPARISON TITLES (3 titles):
Pattern: "[Option A] vs [Option B] — The REAL Answer"

FORMAT 5 — QUESTION TITLES (2 titles):
Questions that make people think "I NEED to know this"

Also generate:
- top3: The 3 best picks with explanation of why they work
- thumbnailText: 5 options for main headline text (3-5 words MAX, bold, punchy)
- thumbnailConcepts: 3 thumbnail visual concept descriptions (background color, expression, text placement, props)
- colorPsychology: Recommended dominant colors for the thumbnail with reason
- emotionScores: For each thumbnail concept rate Curiosity (1-10), Shock (1-10), Clarity (1-10)

Return ONLY valid JSON:
{
  "titles": [
    {
      "text": "title text here",
      "formula": "NUMBER | CURIOSITY | STORY | VS | QUESTION",
      "emotion": "Curiosity | Fear | Excitement | FOMO | Shock",
      "ctrPrediction": "Low | Medium | High",
      "bestPlatform": "YouTube | Instagram | TikTok | All"
    }
  ],
  "top3": [
    { "title": "title text", "rank": 1, "reason": "why this works" }
  ],
  "thumbnailText": ["3-5 word option 1", "option 2", "option 3", "option 4", "option 5"],
  "thumbnailConcepts": [
    {
      "concept": "concept number 1",
      "background": "color description",
      "expression": "facial expression or visual",
      "textPlacement": "where text goes",
      "props": "any props or elements",
      "curiosity": 8,
      "shock": 6,
      "clarity": 9
    }
  ],
  "colorPsychology": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "accent": "#hexcolor",
    "reason": "why these colors stop the scroll for this topic"
  }
}`;

    const { text } = await generateWithWebSearch({ prompt, apiKey });

    let result: any;
    try {
      result = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Failed to parse AI response');
      result = JSON.parse(jsonMatch[0]);
    }
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Title generator error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate titles' }, { status: 500 });
  }
}
