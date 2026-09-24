import { NextResponse } from 'next/server';
import { generateWithWebSearch } from "@/lib/ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  LinkedIn: `Write a high-performing LinkedIn post (200–300 words).
- Bold opening line, no emoji in first line.
- Short paragraphs (1–2 sentences max).
- Personal or data-backed insight.
- 3–5 hashtags at the end.
- End with an engaging question.
- Tone: Professional but conversational.`,

  Twitter: `Write a viral Twitter/X thread (6–8 tweets).
- Tweet 1: The hook (max 280 chars, no hashtags).
- Tweets 2–6: One insight per tweet.
- Tweet 7: Contrarian or surprising conclusion.
- Tweet 8: CTA ("Follow for more", "RT if this helped").
- Format: "1/ [content]" then "2/ [content]" etc.
- Max 3 hashtags total.`,

  Instagram: `Write a high-engagement Instagram caption.
- Hook in the first line.
- 150–200 words total.
- Line breaks for readability.
- Strong CTA (save, share, comment).
- 10–15 hashtags on a new line.
- Tone: Inspiring, relatable.`,

  Reddit: `Write a Reddit post for r/marketing or the relevant subreddit.
- Title: Engaging, question or opinion-based (max 15 words).
- Body: 150–250 words. Conversational, no corporate speak.
- 2–3 bullet points with insights.
- End with a genuine question.
- No hashtags. No salesy language.`,
};

export async function POST(request: Request) {
  try {
    const { topic, platform, hook, category, sourceUrl, whyItsTrending, postIdea } = await request.json();

    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY missing' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const instruction = PLATFORM_INSTRUCTIONS[platform] || PLATFORM_INSTRUCTIONS['LinkedIn'];

    const prompt = `Today is ${today}.

Write a ${platform} post about this REAL trending topic that was found by searching the web RIGHT NOW:

TRENDING TOPIC: "${topic}"
CATEGORY: ${category || 'Social Media'}
WHY IT'S TRENDING NOW: ${whyItsTrending || 'Currently viral on social media'}
SUGGESTED ANGLE: ${postIdea || 'Share your perspective on this trend'}
HOOK TYPE: ${hook || 'Curiosity Gap'}
SOURCE: ${sourceUrl || 'Web search'}

${instruction}

This post should feel timely and urgent — written TODAY about something happening RIGHT NOW.

Return ONLY a JSON object:
{
  "post": "the full post content",
  "headline": "6-word punchy headline",
  "estimatedReach": "e.g. '15K–60K impressions'",
  "bestPostTime": "best time to post today",
  "tips": ["tip 1", "tip 2", "tip 3"]
}`;

    // Fetch live context via Google News RSS for the given topic
    let liveContext = '';
    try {
      const searchRes = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`);
      if (searchRes.ok) {
        const xml = await searchRes.text();
        const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/gi;
        let match;
        let count = 0;
        while ((match = itemRegex.exec(xml)) !== null && count < 5) {
          const title = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1');
          liveContext += `- ${title}\n`;
          count++;
        }
      }
    } catch (e) {
      console.error('Failed to fetch live context');
    }

    const finalPrompt = liveContext ? `CRITICAL LIVE NEWS CONTEXT FOR "${topic}":\n${liveContext}\n\n` + prompt : prompt;

    // Use ChatGPT to write the post with up-to-date context
    const { text: rawText } = await generateWithWebSearch({ prompt: finalPrompt, apiKey });

    let result: any = {};
    try {
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { result = JSON.parse(jsonMatch[0]); } catch {
          result = { post: rawText, headline: topic.slice(0, 30), tips: [] };
        }
      }
    }

    return NextResponse.json({ ...result, topic, platform, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Post gen error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate post' }, { status: 500 });
  }
}
