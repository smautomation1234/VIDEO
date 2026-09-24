import { NextResponse } from 'next/server';
import { buildInstagramLiveContext } from '@/lib/instagram-live';
import { buildPublicWebAnalysis } from '@/lib/public-web-analysis';
import { generateWithWebSearch } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { promptId, profile, ...payload } = body;
    let workflowBrief: Record<string, unknown> = {};
    try { workflowBrief = JSON.parse(String(payload.workflowBrief || '{}')); } catch {}
    const isLaunchedPrompt = workflowBrief.origin === 'master-prompt' || workflowBrief.origin === 'trend-scout' || workflowBrief.origin === 'evergreen-lab';

    if (!promptId || !profile) {
      return NextResponse.json({ error: 'Missing promptId or profile data.' }, { status: 400 });
    }

    const liveContext = await buildInstagramLiveContext(null, Number(promptId), profile as Record<string, string>, payload as Record<string, string>);

    const systemContext = `
You are a dedicated Instagram content strategy assistant specializing in the 2026 algorithm.
INSTAGRAM CREATOR PROFILE:
- Handle: ${profile.handle}
- Niche: ${profile.niche}
- Target Audience: ${profile.audience}
- Content Pillars: ${profile.pillars}
- Content Types: ${profile.contentTypes}
- Posting Frequency: ${profile.frequency}
- Current Followers: ${profile.followers}
- Primary Goal: ${profile.goal}
- Unique Angle: ${profile.uniqueAngle}
- Current Problem: ${profile.currentProblem}
- Tone: ${profile.tone}

Treat the live Instagram/web research below as the source of truth for current formats, audio, keywords, and performance patterns. Do not present unverified algorithm claims, rankings, or benchmark numbers as facts. If a live metric is unavailable, label it unavailable and give a testable hypothesis instead.`;

    let userPrompt = '';

    switch (promptId) {
      case 1:
        userPrompt = `Act as an Instagram trend researcher for a creator in the ${profile.niche} niche.
Category: ${payload.category || profile.niche}
Mode: ${payload.mode === 'audio' ? 'Audio trends' : 'Topic trends'}

${payload.mode === 'audio' 
  ? `Find 8-10 trending audio tracks/sounds currently performing well for ${profile.niche} content:
- Audio name
- Why it works for this niche
- What type of reel works best with it
- Hook idea using this audio` 
  : `Find 10 trending topics in ${profile.niche} RIGHT NOW:
- Topic
- Why it's trending
- Content angle for Reels
- Content angle for Carousel
- Estimated engagement potential (DM shares / saves)`}

Be specific, not generic. Avoid topics that are always trending (like "motivation").`;
        break;
      case 2:
        userPrompt = `Act as a competitive intelligence analyst for Instagram.
Competitors/accounts to analyze: ${payload.competitors}
My niche: ${profile.niche}

1. Identify 5 content FORMATS these accounts use that consistently perform well
2. Find 3 content GAPS — topics they don't cover well that I could own
3. Extract 5 VIRAL FORMULA patterns (e.g. "controversy + reveal + teach", "pain point + data + solution")
4. Give me 3 specific content ideas I can create that are DIFFERENTIATED from what they do`;
        break;
      case 3:
        userPrompt = `Act as a top Instagram Reels scriptwriter (2026 algorithm expert).
TOPIC: ${payload.topic}
TONE: ${payload.tone || 'Educational'}
AUDIENCE: ${profile.audience}
TARGET: shares, saves, and meaningful comments when supported by the live research

Write a complete under-30s Reel script:

SECOND 0-3 — SCROLL STOPPER HOOK:
(text overlay + visual action combined)
3 hook options (A/B/C)

SECOND 3-15 — THE SETUP:
(create tension or curiosity)

SECOND 15-25 — THE VALUE:
(the payoff / insight / reveal)

SECOND 25-30 — THE SHARE TRIGGER:
(something so valuable or relatable they must DM it to someone)

ON-SCREEN TEXT: 4 key text overlays
AUDIO STYLE: What type of audio works
DM-BAIT LINE: One line designed to make viewers share via DM`;
        break;
      case 4:
        userPrompt = `Act as an Instagram carousel strategist.
TOPIC: ${payload.topic}
TARGET METRIC: Saves (2026 #1 carousel signal)
SLIDES: 10

Write:
SLIDE 1 — COVER: Headline + subhead (3 options)
SLIDES 2-9: Slide title, 2-3 lines of value, what visual/graphic to use
SLIDE 10 — CTA: Summary + save prompt + question
CAPTION: Hook (2-3 lines) + context + save prompt question`;
        break;
      case 5:
        userPrompt = `Act as an Instagram Stories strategist.
TOPIC: ${payload.topic}
TARGET: Keep all 7 stories watched to completion

Write a 7-story sequence:
STORY 1 — HOOK: Cliffhanger or bold claim
STORY 2 — CONTEXT: Why this matters to viewer
STORY 3 — INTERACTIVE: Poll or question sticker idea
STORY 4 — VALUE PART 1: First insight
STORY 5 — VALUE PART 2: Second insight
STORY 6 — TEASE: What's coming on main feed / Reel
STORY 7 — CTA: DM me, reply, link in bio etc.

For each story: what to say, what sticker/interaction to use, text overlay`;
        break;
      case 6:
        userPrompt = `Act as an Instagram SEO caption writer (2026 search strategy).
TOPIC/POST: ${payload.topic}
NICHE: ${profile.niche}

Write a full SEO-optimized caption:
HOOK (first 2 lines — must work before "more" truncation)
BODY: Include 3-4 natural keyword phrases people search on Instagram
QUESTION: Specific question to drive comments (not "thoughts?")
KEYWORDS USED: List the Instagram search terms embedded

Include which keywords to use as the 3-5 hashtags at the end.`;
        break;
      case 7:
        userPrompt = `Act as an Instagram caption strategist.
POST TOPIC: ${payload.topic}
NICHE: ${profile.niche}
TONE: ${profile.tone}

Write 6 different caption styles for THIS SAME post:
1. STORYTELLING STYLE: Opens with a personal moment
2. CONTROVERSIAL/HOT TAKE: Makes people react
3. DATA/STAT LED: Opens with a surprising fact
4. LISTICLE STYLE: "5 things about..."
5. CONVERSATIONAL/DM BAIT: Feels like a text to a friend
6. SHORT & PUNCHY: Under 50 words, high impact

Each must have a different closing question/CTA.`;
        break;
      case 8:
        userPrompt = `Act as a viral content strategist specializing in Instagram hooks.
TOPIC: ${payload.topic}
NICHE: ${profile.niche}

Generate 10 scroll-stopping hooks for this topic:
- 3 TEXT OVERLAY hooks (for on-screen text in Reels)
- 3 CAPTION OPENING hooks (first 2 lines before "more")
- 2 CONTROVERSIAL hooks (mild controversy that gets comments)
- 2 PATTERN INTERRUPT hooks (unexpected angle)

For each: the hook text + why it works + which format it's best for (Reel / Carousel / Post)`;
        break;
      case 9:
        userPrompt = `Act as an Instagram hashtag strategist (2026 strategy — NOT the old 30 hashtag approach).
POST TOPIC: ${payload.topic}
NICHE: ${profile.niche}
FOLLOWERS: ${profile.followers}

The 2026 strategy: 3-5 HIGHLY RELEVANT hashtags only. Quality over quantity.

Give me:
1. 3 NICHE HASHTAGS: Highly specific (under 500k posts), high-intent audience
2. 1-2 MID HASHTAGS: Topic-specific (500k-2M posts)
3. AVOID: 3 hashtags I should NOT use and why (too broad, shadow-banned, etc.)
4. REASONING: Why each recommended hashtag will get my content seen

Also: Should I put hashtags in caption or first comment for this post?`;
        break;
      case 10:
        userPrompt = `Act as my Instagram content calendar manager.
NICHE: ${profile.niche}
PILLARS: ${profile.pillars}
POSTING FREQUENCY: ${profile.frequency}
FOCUS THIS WEEK: ${payload.idea || 'General content mix'}

Create a full week content calendar:
For each post:
- Day + time (optimal posting time for Instagram)
- Format (Reel / Carousel / Static / Story sequence)
- Topic + pillar it supports
- Hook/opening line
- Target metric (DM shares / Saves / Comments)
- Audio suggestion (if Reel)

Include: 2 story session days, at least 2 Reels, 1 Carousel.
End with the week's unifying theme.`;
        break;
      case 11:
        userPrompt = `Act as an Instagram content repurposing strategist.
CORE IDEA: ${payload.idea}
NICHE: ${profile.niche}

Turn this one idea into 5 Instagram content pieces:
1. REEL (under 30s): Hook concept + key script beats
2. CAROUSEL (10 slides): Outline + cover slide idea
3. SINGLE STATIC POST: Caption + visual concept
4. STORY SEQUENCE (5 stories): Story-by-story outline
5. CAPTION VARIATION: Standalone caption that works without visuals

Give me a posting schedule (spread over 2-3 weeks) so it doesn't feel repetitive.`;
        break;
      case 12:
        userPrompt = `Act as an Instagram strategy consultant giving me an honest account audit.
FOLLOWERS: ${payload.followers}
BEST POST: ${payload.bestPost}
WEAKEST POST: ${payload.weakPost}
WHAT I THINK THE PROBLEM IS: ${payload.problem}

Audit across these 2026-specific metrics:
1. CONTENT MIX: Am I posting the right ratio of Reels/Carousels/Static?
2. DM SHARE TRIGGERS: Do my posts have "share to a friend" moments?
3. SAVE TRIGGERS: Do my carousels/posts earn saves?
4. HOOK QUALITY: Are my first 3 seconds/2 lines strong enough?
5. HASHTAG STRATEGY: Am I using 3-5 niche-relevant tags?
6. COMMENT QUALITY: Are my CTAs getting real replies or just "great!"?

End with:
- 3 things working — keep doing
- 3 things to change immediately
- The single highest-leverage change for THIS account
- 30-day growth plan`;
        break;
      case 13:
        userPrompt = `Act as an Instagram profile SEO specialist.
CURRENT PROFILE: ${JSON.stringify(profile)}
Create three searchable Name Field versions, two bios under 150 characters, five profile keywords, three link-in-bio CTAs, five SEO-friendly Story Highlight names, and three niche-specific alt-text templates. Base recommendations on the live data below.`;
        break;
      case 14:
        userPrompt = `Act as an Instagram Trial Reels growth specialist.
Build a 30-day testing calendar for ${profile.niche} using the live trends and account data below. Include hook, format, and topic tests; winner metric; minimum sample size; publish/discard rule; and how to scale the winning Reel. Do not invent benchmarks.`;
        break;
      case 15:
        userPrompt = `Act as an Instagram analytics expert. Analyze the public post/topic and live web evidence in the data below. Compare reach, impressions, likes, comments, saves, shares, and non-follower growth only where real metrics are present. Return diagnosis, limitations, biggest problem, root cause, exact fixes, hook rewrite, caption rewrite, and next-post recommendation. Clearly state unavailable private metrics.`;
        break;
      case 16:
        userPrompt = `Act as a professional Instagram growth consultant. Perform a research-based niche/account audit using the creator profile and current web research below. Audit profile SEO, content mix, hooks, captions, hashtags, share/save triggers, and current audience patterns. If private account metrics are absent, say so and provide a measurement plan. End with the top 3 opportunities, top 3 things to stop, the #1 change this week, and a 30-day plan.`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

    userPrompt += `\n\nAUTHORITATIVE LIVE PUBLIC WEB DATA (retrieved now):\n${liveContext}\n\nUse current source titles, dates, URLs, and evidence. For every prompt return: (1) evidence-backed findings, (2) three prioritized action points labeled Today / This week / Validate, (3) three content title options, (4) a ready-to-use description/caption, (5) relevant hashtag/keyword options without claiming usage volume, (6) the expected output or success check for each action, and (7) a short source ledger. Never invent Instagram metrics, audio usage, or algorithm rules; label unavailable data.`;

    if (process.env.ENABLE_AI_SYNTHESIS !== 'true' && !isLaunchedPrompt) {
      return NextResponse.json({ content: buildPublicWebAnalysis('Instagram', userPrompt, liveContext), liveData: true, partial: true, dataMode: "public-web-only", retrievedAt: new Date().toISOString() });
    }
    try {
      const aiResult = await generateWithWebSearch({ system: systemContext, prompt: userPrompt });
      return NextResponse.json({ content: aiResult.text, liveData: true, dataMode: "public-web-with-ai-synthesis", retrievedAt: new Date().toISOString() });
    } catch (synthesisError) {
      console.error('Instagram AI synthesis unavailable; returning public web data:', synthesisError instanceof Error ? synthesisError.message : 'unknown error');
      return NextResponse.json({ content: buildPublicWebAnalysis('Instagram', userPrompt, liveContext), liveData: true, partial: true, dataMode: "public-web-only", retrievedAt: new Date().toISOString() });
    }

  } catch (error: unknown) {
    console.error('Instagram API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate content';
    return NextResponse.json({ error: message }, { status: /live Instagram\/web/i.test(message) ? 503 : 500 });
  }
}
