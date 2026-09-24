import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatForLinkedIn } from "@/lib/unicode";
import { getSessionUserId } from "@/lib/social-tokens";
import { fetchLiveNewsContext } from "@/lib/news";
import { generateWithWebSearch } from "@/lib/ai";

const supabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const callOpenAI = (
    systemInstruction: string,
    prompt: string,
    apiKey?: string,
    _temperature = 0.9
) => generateWithWebSearch({ system: systemInstruction, prompt, apiKey });

export async function POST(req: NextRequest) {
    try {
        const userId = await getSessionUserId();
        if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

        const { topic } = await req.json();

        // 1. Fetch User Profile
        const { data: profile, error: profileErr } = await supabase()
            .from("users")
            .select("full_name, persona, niche_description, writing_style, target_audience, content_goals, avoid_topics, writing_sample_1, writing_sample_2, writing_sample_3, preferred_categories, custom_sources")
            .eq("id", userId)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({
                error: "Profile not set up.",
                detail: "Please complete your profile in the Brand/Profile page first."
            }, { status: 400 });
        }

        // 2. Fetch past 15 posts to avoid repetition
        const { data: pastPosts } = await supabase()
            .from("linkedin_posts")
            .select("topic")
            .eq("user_id", userId)
            .order("posted_at", { ascending: false })
            .limit(15);
        const pastTopics = pastPosts?.map(p => p.topic).filter(Boolean).join(", ") || "None";

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY is missing from environment variables.");
        }

        let finalTopic = topic;
        let finalSources: any[] = [];
        let winningTopicsText = "";

        // ─── Stage 1 & 2: Scout + Debate ──────────────────────────────────────
        if (!finalTopic) {
            const niche = profile.niche_description || "tech startups";
            const liveContext = await fetchLiveNewsContext(undefined, undefined, profile);

            const scoutRes = await callOpenAI(
                "You are an elite news scout. Find today's biggest breaking stories.",
                `Find the 10 most impactful, breaking news stories today in: "${niche}". Focus on stories that would make professionals stop and think. Return a numbered list with headline and 1-sentence summary.\n\nHere is live context from the user's preferred news sources:\n${liveContext}`,
                apiKey, 0.7
            );

            const debateSys = `You are a panel of elite LinkedIn algorithm experts.
Editor A picks the 3 most viral stories.
Editor B critiques each for engagement potential with founders and professionals.
Chief Editor picks the single BEST story — the one with the most counter-intuitive or surprising angle.`;

            const debateRes = await callOpenAI(
                debateSys,
                `TODAY'S NEWS:\n${scoutRes.text}\n\nPAST TOPICS (DO NOT REPEAT):\n${pastTopics}\n\nRun the debate. End with EXACTLY:\nWINNING TOPIC: [Headline] - [Brief Summary]`,
                apiKey, 0.9
            );

            const match = debateRes.text.match(/WINNING TOPIC:\s*(.+)/i);
            finalTopic = match ? match[1].trim() : `Latest major trend in ${niche}`;
            winningTopicsText = debateRes.text;
        } else {
            // Fake context since we don't have native Google Grounding for facts
            const factRes = await callOpenAI(
                "You are a research assistant. Get the very latest facts, numbers, and angles on this topic.",
                `Find the most recent and surprising facts/stats about: ${finalTopic}. Include specific numbers if available.`,
                apiKey, 0.4
            );
        }

        const writingSamples = [profile.writing_sample_1, profile.writing_sample_2, profile.writing_sample_3]
            .filter(Boolean)
            .map((s: string, i: number) => `SAMPLE ${i + 1}:\n"""\n${s.slice(0, 800)}\n"""`)
            .join("\n\n");

        // ─── Stage 3: Write — No Template, Format Variety ─────────────────────
        const systemWriter = `You are the world's most elite LinkedIn ghostwriter. You write posts that get 10x more engagement than average because you never use a template.

USER PROFILE (study this carefully — write AS this person):
- Name: ${profile.full_name || "the user"}
- Who they are: ${profile.persona || "Professional, experienced in their field"}
- Topics/Niche: ${profile.niche_description || "General business and technology"}
- Writing style: ${profile.writing_style || "Direct, confident, data-driven"}
- Target audience: ${profile.target_audience || "Professionals and founders"}
- Content goals: ${profile.content_goals || "Build thought leadership"}
${profile.avoid_topics ? `- NEVER post about: ${profile.avoid_topics}` : ""}

PAST TOPICS (do NOT repeat the same angle or topic): ${pastTopics}

─── HOW TO CHOOSE YOUR FORMAT ───
Look at the topic. Pick the format that makes it hit hardest:

FORMAT A — THE COUNTER-NARRATIVE: Start with a common belief, immediately destroy it with evidence.
Example opening: "Everyone says X. They're wrong. Here's the data."

FORMAT B — THE NUMBER HOOK: Lead with the most shocking stat. Everything else explains it.
Example opening: "47% of [X] will [Y] by 2026. LinkedIn isn't talking about this."

FORMAT C — THE INSIDER REVEAL: "I've spoken to 50 [type of person]. Here's what they all said."
Share a pattern most people haven't noticed.

FORMAT D — THE PREDICTION: Make a bold, specific prediction about the next 12 months.
Back it up with 3 pieces of evidence. End with a controversial question.

FORMAT E — THE BREAKDOWN: "5 things [event/news] just changed about [industry]." 
Each point should feel like new information, not obvious.

─── WRITING RULES ───
- Choose the format that BEST fits the topic — NEVER use the same format twice
- Post length is YOUR choice: if the insight is punchy, write 150–250 words; if it needs explaining, write 400–600 words. Never exceed 700 words.
- Open with the hook (first line must work standalone — no "Today I want to talk about")
- Short paragraphs but VARY the rhythm — some 1-liners, some 2-3 lines, never all the same
- Use **bold** for the single most important sentence per section (will be formatted as Unicode bold)
- Use numbers when you have them. Be specific: "47%" beats "many"
- End with ONE question — make it SPECIFIC and slightly uncomfortable, not "What do you think?"
- Add 3–5 hashtags at the very end
- NO filler phrases: "In today's fast-paced world", "leverage", "synergy", "game-changing", "dive deep"
- Write like you're talking to ONE smart person, not a crowd

OUTPUT: Only the raw post text. No meta-commentary. No format label.`;

        const samplesBlock = writingSamples
            ? `\n\nWRITING SAMPLES (study these — this is EXACTLY how the user writes):\n${writingSamples}\n\nMATCH their sentence length, hook style, vocabulary, paragraph rhythm, and tone EXACTLY.`
            : "";

        const postRes = await callOpenAI(
            systemWriter,
            `Write the best possible LinkedIn post about: ${finalTopic}\n${samplesBlock}`,
            apiKey, 0.92
        );

        // ─── Stage 4: Unicode Formatting ──────────────────────────────────────
        const formattedText = formatForLinkedIn(postRes.text);

        return NextResponse.json({
            success: true,
            linkedin: { text: formattedText },
            topic: finalTopic,
            sources: finalSources,
            debateRaw: winningTopicsText,
            modelUsed: postRes.modelUsed
        });

    } catch (err) {
        console.error("[generate text] Error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
