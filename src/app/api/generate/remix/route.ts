import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { postUrl, postCaption, postViews, niche } = await req.json();

    if (!postCaption && !postUrl) {
      return NextResponse.json({ error: 'postCaption or postUrl is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are a viral content reverse-engineer. Output ONLY valid JSON. No markdown, no code blocks.`;

    const userPrompt = `Analyze this viral post and create a remixed version:

Original Post Caption: "${postCaption || 'No caption provided'}"
${postUrl ? `URL: ${postUrl}` : ''}
${postViews ? `Views: ${postViews}` : ''}
Target Niche: "${niche || 'general'}"

Output a single JSON object:
{
  "analysis": {
    "hookPattern": "name of the hook template e.g. 'I [action] for [time], Day X changed everything'",
    "hookPatternExplain": "why this hook works psychologically",
    "emotionalArc": "Curiosity (start) → Struggle (middle) → Win (end)",
    "formatType": "Timeline montage / Tutorial / POV / etc",
    "viralScore": 88,
    "keyFactors": ["factor 1", "factor 2", "factor 3", "factor 4"],
    "contentLength": "18 seconds",
    "whyItWentViral": "2-sentence summary of the core virality mechanism"
  },
  "remixed": {
    "hook": "remixed hook using same pattern but adapted to niche",
    "caption": "full remixed caption ready to copy-paste with emojis",
    "formatInstructions": {
      "filmingGuide": ["shot 1", "shot 2", "shot 3", "shot 4"],
      "editingStyle": "fast cuts / slow build / text overlay etc",
      "length": "15-20 seconds"
    },
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
    "trendingAudio": "trending audio suggestion name",
    "engagementHook": "the comment-bait line to add at end",
    "predictedScore": 82,
    "whyThisWillWork": "2-sentence explanation"
  }
}`;

    const aiResponse = await generateWithWebSearch({ system: systemPrompt, prompt: userPrompt });

    const content = aiResponse.text || '{}';
    let aiData: any = {};
    try { aiData = JSON.parse(content); } catch (e) {}

    return NextResponse.json({
      ...aiData,
      originalCaption: postCaption,
      niche,
      remixedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Remix engine error:', error);
    return NextResponse.json({ error: error.message || 'Remix failed' }, { status: 500 });
  }
}
