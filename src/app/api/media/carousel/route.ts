import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const maxDuration = 55;

export async function POST(req: Request) {
  try {
    const { prompt, theme = 'dark', slideCount = 5 } = await req.json();

    const systemPrompt = `You are an expert carousel generator for LinkedIn and Instagram.
Given the user's prompt, create a ${slideCount}-slide carousel.
Each slide needs:
1. title: A catchy headline (max 8 words)
2. text: Detailed breakdown with 3-4 lines/bullets of actionable, high-value content (40-60 words total per slide).
3. icon: A suggested emoji or 1-word icon name representing the slide
4. color: A hex color code that fits a premium ${theme} theme.

Slide 1 should be a strong hook. The last slide should be a Call to Action (CTA).

Respond ONLY with valid JSON in this format:
{
  "slides": [
    { "title": "Hook", "text": "...", "icon": "🚀", "color": "#1e293b" }
  ]
}`;

    const aiResult = await generateWithWebSearch({ system: systemPrompt, prompt });

    const content = aiResult.text;
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Carousel Gen Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
