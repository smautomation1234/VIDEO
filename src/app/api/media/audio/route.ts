import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = await request.json();

    if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1', // or tts-1-hd
        input: text,
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        speed: speed
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenAI Error: ${errorText.substring(0, 100)}`);
    }

    // Get the audio array buffer and convert to base64
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({ audioUrl: audioDataUrl });
  } catch (err: any) {
    console.error('Audio Gen Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate audio' }, { status: 500 });
  }
}
