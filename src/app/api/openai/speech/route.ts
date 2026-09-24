import { NextResponse } from 'next/server';

export const maxDuration = 55;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured in environment variables' }, { status: 500 });
    }

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error(`OpenAI TTS API error ${res.status}: ${errorData}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      }
    });
  } catch (error: any) {
    console.error('OpenAI Speech API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
