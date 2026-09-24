import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    const { prompt, size = '1024x1024', style = 'vivid', quality = 'standard' } = await request.json();

    if (!prompt) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality, // standard or hd
        style: style // vivid or natural
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenAI Error: ${errorText.substring(0, 100)}`);
    }

    const data = await res.json();
    return NextResponse.json({ url: data.data[0].url, revisedPrompt: data.data[0].revised_prompt });
  } catch (err: any) {
    console.error('Image Gen Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate image' }, { status: 500 });
  }
}
