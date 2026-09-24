import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// This endpoint accepts a video/audio file upload and uses OpenAI's Whisper
// to return a detailed, word-level transcript with timestamps.

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

    const openai = new OpenAI({ apiKey });

    // We use whisper-1 for transcription with word-level timestamps
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    if (!response || !response.words) {
      throw new Error('Failed to get word-level timestamps from OpenAI.');
    }

    // Format the response for our frontend Text-Based Video Editor
    // Our UI expects: { text: "word", keep: true, start: 0.0, end: 0.5 }
    const transcript = response.words.map((w) => {
      const lower = w.word.toLowerCase().replace(/[^a-z]/g, '');
      const isFiller = ['um', 'uh', 'like', 'ah', 'er', 'youknow', 'basically', 'so', 'right'].includes(lower);
      return {
        text: w.word,
        start: w.start,
        end: w.end,
        keep: !isFiller // Auto-flag filler words as keep: false
      };
    });

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error('Transcription Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
