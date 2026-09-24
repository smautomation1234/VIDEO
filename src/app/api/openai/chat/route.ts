import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const maxDuration = 55;

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OPENAI_API_KEY is not configured in environment variables' }, { status: 500 });
        }

        const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
            return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
        }

        const system = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n') || undefined;
        const conversation = messages
            .filter(m => m.role !== 'system')
            .map(m => (m.role === 'user' ? m.content : `[Earlier assistant reply]:\n${m.content}`))
            .join('\n\n---\n\n');

        const result = await generateWithWebSearch({
            system,
            prompt: conversation,
            maxOutputTokens: typeof body.max_tokens === 'number' ? Math.min(body.max_tokens * 2, 4000) : 2000,
            forceSearch: true,
        });

        return NextResponse.json({
            choices: [
                {
                    message: { role: 'assistant', content: result.text },
                    finish_reason: 'stop',
                },
            ],
            citations: result.sources,
            model: result.modelUsed,
        });
    } catch (error: unknown) {
        console.error('OpenAI Chat API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Generation failed' },
            { status: 500 }
        );
    }
}
