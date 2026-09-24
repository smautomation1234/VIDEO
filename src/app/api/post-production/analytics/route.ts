import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

export async function POST(request: Request) {
  try {
    const { analyticsData } = await request.json();

    if (!analyticsData) return NextResponse.json({ error: 'Analytics data is required' }, { status: 400 });

    const prompt = `Act as an elite Social Media Growth Strategist and Data Analyst.

I am providing you with my recent video/post analytics in JSON format.
Analyze the data and tell me exactly what is working, what is failing, and give me 3 highly actionable recommendations to improve my next post.

ANALYTICS DATA:
"""
${analyticsData}
"""

Output Format Requirements:
Return a JSON object:
{
  "summary": "A 2-sentence summary of overall performance",
  "workingWell": ["point 1", "point 2"],
  "needsImprovement": ["point 1", "point 2"],
  "actionableTips": [
    {"title": "Tip 1", "description": "How to execute tip 1"},
    {"title": "Tip 2", "description": "How to execute tip 2"}
  ]
}
Make sure it is ONLY a valid JSON string.`;

    const aiResult = await generateWithWebSearch({ prompt });
    return NextResponse.json(JSON.parse(aiResult.text));
  } catch (err: any) {
    console.error('Analytics Gen Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to analyze data' }, { status: 500 });
  }
}
