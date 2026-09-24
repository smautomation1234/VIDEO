import { NextRequest, NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";

const platformFormulas: Record<string, string> = {
  instagram: `Instagram Caption Formula:
LINE 1: Hook line (visible before "...more") — make it irresistible, max 125 chars
[blank line]
LINES 3-5: Value / Story / Context — short punchy sentences
LINE 6: CTA (Save this | Share with someone who needs this | Comment below)
[blank line]
LINE 8: 3-5 hashtags (1-2 niche 10K-100K, 1-2 medium 100K-500K, 1 broad)
NEVER use: #fyp #viral #explore`,

  linkedin: `LinkedIn Caption Formula:
LINE 1: Bold statement or story hook (2 lines max, visible before "See more")
[blank line]
LINES 3-8: Personal story in short paragraphs (1-2 sentences each)
LINE 9: Key insight / lesson learned
[blank line]
LINE 11: Question to drive comments (end with ?)
LINE 12: 3 relevant hashtags only
DO NOT put any URLs in the post body.`,

  youtube: `YouTube Shorts Title + Description Formula:
TITLE: [SEO keyword] + curiosity gap (max 60 chars)
[blank line]
DESCRIPTION LINE 1-2: Keyword-rich summary of the video value
DESCRIPTION LINE 3: #Shorts + 2 more relevant hashtags
CTA: "Subscribe for more [topic] tips"`,

  x: `X (Twitter) Thread Formula:
TWEET 1 (standalone viral): Hot take or bold claim about the topic. End with "🧵"
[blank line]
TWEET 2-5: Break down the key points (one insight per tweet, short sentences)
TWEET 6: Summary + CTA: "Follow @username for more [topic] insights"
TWEET 7: "RT if you found this useful 🔄"
Max 1-2 hashtags total. No links in first tweet.`,
};

export async function POST(req: NextRequest) {
  try {
    const { topic, platform, tone } = await req.json();
    if (!topic || !platform) {
      return NextResponse.json({ error: "Topic and platform are required" }, { status: 400 });
    }

    const formula = platformFormulas[platform] || platformFormulas["instagram"];

    const systemPrompt = `You are a world-class social media copywriter who writes high-converting captions that get saves, shares, and comments. You follow platform-specific formulas exactly and write in a ${tone || "conversational, authentic"} tone.`;

    const userPrompt = `Write a complete, ready-to-post ${platform} caption for the topic: "${topic}"

Follow this exact formula:
${formula}

Write the actual caption text (not the formula labels). Make it specific, valuable, and engaging. Use emojis where appropriate.`;

    const aiResult = await generateWithWebSearch({ system: systemPrompt, prompt: userPrompt, maxOutputTokens: 600 });

    const caption = aiResult.text || "";
    return NextResponse.json({ caption });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate caption";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
