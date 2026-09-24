import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 55;

export async function POST(request: Request) {
  try {
    const { message, agentName, agentType, knowledgeBase, chatHistory } = await request.json();

    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const systemPrompt = `You are a highly specialized AI agent named "${agentName}".
Your role is: ${agentType}.
Today's date is: ${today}.

YOUR KNOWLEDGE BASE / TRAINING DATA:
"""
${knowledgeBase || 'No specific training data provided. Use your general expertise.'}
"""

INSTRUCTIONS:
1. You MUST embody your role (${agentType}) perfectly.
2. You MUST use the provided Knowledge Base to match the user's tone, style, and past work. Do not ignore the Knowledge Base.
3. Because you have access to real-time web search, ALWAYS search the web to provide the most current, accurate, and real data possible when answering. No fake or outdated data.
4. Keep your responses actionable, concise, and highly relevant.
5. For LinkedIn and X (Twitter) requests, specifically analyze the provided live context to highlight top creators, viral trends, and top-performing content formats for the user's niche.

If you are a Researcher, find the latest real stats and news, including LinkedIn and X insights.
If you are an Idea Generator, check what is trending right now and apply the user's style.
If you are a Script Writer, write a script on the topic using real current facts and the exact tone from the Knowledge Base.
`;

    const messages = chatHistory || [];

    let conversationPrompt = '';
    for (const msg of messages) {
      conversationPrompt += `${msg.role === 'user' ? 'USER' : 'AGENT'}: ${msg.content}\n\n`;
    }
    conversationPrompt += `USER: ${message}\n\nAGENT:`;

    let liveContext = '';
    try {
      const query = message.length > 50 ? message.substring(0, 50) : message;
      
      // Search General, LinkedIn, and X/Twitter
      const queries = [
        query,
        `${query} site:linkedin.com`,
        `${query} site:twitter.com OR site:x.com`
      ];

      const fetchPromises = queries.map(q => 
        fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`).then(r => r.ok ? r.text() : '')
      );

      const results = await Promise.all(fetchPromises);
      const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/gi;

      results.forEach((xml, index) => {
        if (!xml) return;
        const sourceName = index === 1 ? 'LinkedIn' : index === 2 ? 'X/Twitter' : 'General News';
        let match;
        let count = 0;
        while ((match = itemRegex.exec(xml)) !== null && count < 4) {
          const title = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1');
          liveContext += `- [${sourceName}] ${title}\n`;
          count++;
        }
      });
    } catch (e) {
      console.error('Failed to fetch live context');
    }

    if (liveContext) {
      conversationPrompt = `CRITICAL LIVE NEWS CONTEXT FOR YOUR RESPONSE:\n${liveContext}\n\n` + conversationPrompt;
    }

    const aiResult = await generateWithWebSearch({ system: systemPrompt, prompt: conversationPrompt });

    return NextResponse.json({
      text: aiResult.text,
      citations: aiResult.sources,
      generatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Agent chat error:', err);
    return NextResponse.json({ error: err.message || 'Agent failed to respond' }, { status: 500 });
  }
}
