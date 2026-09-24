import OpenAI from 'openai';

/* ────────────────────────────────────────────────────────────────────────────
   Central AI configuration — the ONLY place a model is named.

   To change the model, reasoning effort, or search behaviour app-wide,
   edit AI_CONFIG below or set the matching environment variables.
   No route or component should hardcode a model string.
   ──────────────────────────────────────────────────────────────────────────── */

const env = (key: string): string | undefined => {
    const value = process.env[key];
    return value && value.trim() ? value.trim() : undefined;
};

export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export const AI_CONFIG = {
    /** Model used for ALL text generation and live research. */
    // Keep the shared generator aligned with the model already configured for
    // content generation. The old fictional default made every request fail
    // before the carousel UI could receive a response.
    textModel: env('OPENAI_TEXT_MODEL') ?? env('OPENAI_CONTENT_MODEL') ?? 'gpt-4o-mini',

    /** Reasoning effort sent with every request. 'none' = fastest & cheapest. */
    reasoningEffort: (env('OPENAI_REASONING_EFFORT') ?? 'none') as ReasoningEffort,

    /** Hosted web_search tool settings (Responses API). */
    webSearch: {
        /** Set ENABLE_AI_WEB_SEARCH=false to fall back to RSS-only research. */
        enabled: env('ENABLE_AI_WEB_SEARCH') !== 'false',
        contextSize: (env('OPENAI_SEARCH_CONTEXT') ?? 'low') as 'low' | 'medium' | 'high',
    },

    requestTimeoutMs: 55_000,
    maxRetries: 1,
    defaultMaxOutputTokens: 2000,
} as const;

/** Backwards-compatible alias used by older imports. */
export const OPENAI_TEXT_MODEL = AI_CONFIG.textModel;

export interface AISource {
    title: string;
    url: string;
}

export interface AIResult {
    text: string;
    sources: AISource[];
    modelUsed: string;
}

interface GenerateOptions {
    system?: string;
    prompt: string;
    apiKey?: string;
    maxOutputTokens?: number;
    forceSearch?: boolean;
}

interface VisionChatOptions {
    system?: string;
    /** OpenAI vision content parts — e.g. [{ type: 'image_url', image_url: {...} }, { type: 'text', text }] */
    content: unknown[];
    apiKey?: string;
    maxOutputTokens?: number;
}

type OpenAIClient = InstanceType<typeof OpenAI>;

const clientCache = new Map<string, OpenAIClient>();

/** Shared client factory — one client per API key, reused across calls. */
export function getOpenAIClient(apiKey?: string): OpenAIClient {
    const key = (apiKey || env('OPENAI_API_KEY') || '').trim();
    if (!key) throw new Error('OPENAI_API_KEY is not configured');
    const cached = clientCache.get(key);
    if (cached) return cached;
    const client = new OpenAI({
        apiKey: key,
        timeout: AI_CONFIG.requestTimeoutMs,
        maxRetries: AI_CONFIG.maxRetries,
    });
    clientCache.set(key, client);
    return client;
}

function extractFromResponse(response: unknown): { text: string; sources: AISource[] } {
    let text = (response as { output_text?: string }).output_text || '';
    const sources: AISource[] = [];
    const output = (response as { output?: unknown[] }).output || [];
    for (const item of output) {
        if (!item || typeof item !== 'object') continue;
        const record = item as { type?: unknown; content?: unknown[] };
        if (record.type !== 'message') continue;
        for (const block of record.content || []) {
            if (!block || typeof block !== 'object') continue;
            const blockRecord = block as { type?: unknown; text?: unknown; annotations?: unknown[] };
            if (blockRecord.type !== 'output_text') continue;
            if (!text && typeof blockRecord.text === 'string') text = blockRecord.text;
            for (const annotation of blockRecord.annotations || []) {
                if (!annotation || typeof annotation !== 'object') continue;
                const annotationRecord = annotation as { type?: unknown; title?: unknown; url?: unknown };
                if (annotationRecord.type === 'url_citation' && typeof annotationRecord.url === 'string') {
                    const title = typeof annotationRecord.title === 'string' ? annotationRecord.title : annotationRecord.url;
                    sources.push({ title, url: annotationRecord.url });
                }
            }
        }
    }
    return { text: text.trim(), sources };
}

async function responsesCall(
    client: OpenAIClient,
    opts: GenerateOptions,
    withSearch: boolean,
): Promise<AIResult> {
    const input: { role: 'system' | 'user'; content: string }[] = [];
    if (opts.system) input.push({ role: 'system', content: opts.system });
    input.push({ role: 'user', content: opts.prompt });

    const params: Record<string, unknown> = {
        model: AI_CONFIG.textModel,
        input,
        max_output_tokens: opts.maxOutputTokens ?? AI_CONFIG.defaultMaxOutputTokens,
        reasoning: { effort: AI_CONFIG.reasoningEffort },
    };

    if (withSearch) {
        params.tools = [{ type: 'web_search', search_context_size: AI_CONFIG.webSearch.contextSize }];
        params.tool_choice = { type: 'web_search' };
    }

    const response = await client.responses.create(params as never);
    const { text, sources } = extractFromResponse(response);
    return {
        text,
        sources,
        modelUsed: `${AI_CONFIG.textModel}${withSearch ? ' + web search' : ''} (OpenAI)`,
    };
}

async function chatCompletionsFallback(
    client: OpenAIClient,
    opts: GenerateOptions,
): Promise<AIResult> {
    const response = await client.chat.completions.create({
        model: AI_CONFIG.textModel,
        messages: [
            ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
            { role: 'user' as const, content: opts.prompt },
        ],
        max_completion_tokens: opts.maxOutputTokens ?? AI_CONFIG.defaultMaxOutputTokens,
    });
    return {
        text: response.choices?.[0]?.message?.content?.trim() || '',
        sources: [],
        modelUsed: `${AI_CONFIG.textModel} (OpenAI)`,
    };
}

/**
 * Primary generation path for the whole app.
 * ALWAYS attempts a live web search before writing, then falls back
 * to a non-search response only if the search-enabled request fails.
 */
export async function generateWithWebSearch(opts: GenerateOptions): Promise<AIResult> {
    const client = getOpenAIClient(opts.apiKey);
    const forceSearch = opts.forceSearch !== false && AI_CONFIG.webSearch.enabled;

    try {
        return await responsesCall(client, opts, forceSearch);
    } catch (err) {
        console.warn('[ai] Web-search generation failed, retrying without search:', err instanceof Error ? err.message : err);
    }

    try {
        return await responsesCall(client, opts, false);
    } catch (err) {
        console.warn('[ai] Responses API failed, using chat completions fallback:', err instanceof Error ? err.message : err);
    }

    return chatCompletionsFallback(client, opts);
}

/**
 * Image + text analysis (vision). Uses chat completions with the shared
 * model — web search does not apply to user-uploaded images.
 */
export async function runVisionChat(opts: VisionChatOptions): Promise<AIResult> {
    const client = getOpenAIClient(opts.apiKey);
    const response = await client.chat.completions.create({
        model: AI_CONFIG.textModel,
        messages: [
            ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
            { role: 'user' as const, content: opts.content as never },
        ],
        max_completion_tokens: opts.maxOutputTokens ?? AI_CONFIG.defaultMaxOutputTokens,
    });
    return {
        text: response.choices?.[0]?.message?.content?.trim() || '',
        sources: [],
        modelUsed: `${AI_CONFIG.textModel} (OpenAI)`,
    };
}
