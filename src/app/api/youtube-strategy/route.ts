import { NextResponse } from 'next/server';
import { buildLiveContext } from '@/lib/youtube-live';
import { buildPublicWebAnalysis } from '@/lib/public-web-analysis';
import { generateWithWebSearch } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { promptId, profile, ...payload } = body;
    let workflowBrief: Record<string, unknown> = {};
    try { workflowBrief = JSON.parse(String(payload.workflowBrief || '{}')); } catch {}
    const isSelectedTrendCreation = workflowBrief.origin === 'trend-scout' || workflowBrief.origin === 'master-prompt' || workflowBrief.origin === 'evergreen-lab';

    if (!promptId || !profile) {
      return NextResponse.json({ error: 'Missing promptId or profile data.' }, { status: 400 });
    }

    const liveContext = await buildLiveContext(null, Number(promptId), profile as Record<string, string>, payload as Record<string, string>);

    const systemContext = `
You are a dedicated YouTube content strategy assistant and SEO expert.
YOUTUBE CHANNEL PROFILE:
- Channel Name: ${profile.channelName}
- Niche/Category: ${profile.niche}
- Target Audience: ${profile.audience}
- Content Pillars: ${profile.pillars}
- Typical Video Length: ${profile.videoLength}
- Upload Frequency: ${profile.uploadFrequency}
- Current Subscribers: ${profile.subscribers}
- Primary Goal: ${profile.goal}
- Unique Angle: ${profile.uniqueAngle}
- Current Problem: ${profile.currentProblem}
- Tone of Voice: ${profile.tone}

LIVE DATA OVERRIDE: Use the live YouTube/web data section below as the source of truth for current topics, videos, packaging patterns, and public metrics. Do not invent search volume, retention, CTR, ranking signals, or trend duration. Label unavailable metrics and turn them into testable hypotheses.

2026 YouTube algorithm facts to base all advice on:
- CTR (Click Through Rate) and AVD (Average View Duration) are the two core ranking signals.
- The first 30 seconds determine whether YouTube promotes a video. Hook is critical.
- YouTube search is a major discovery channel — SEO in titles, descriptions, and tags matters.
- Shorts are a separate feed but cross-promote long-form content effectively.
- Consistency of upload schedule matters more than upload frequency alone.
- Playlists and series dramatically improve session time (YouTube's #3 signal).`;    let userPrompt = '';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    switch (promptId) {
      case 1:
        const p1Trends = liveContext;
        userPrompt = `Act as a professional YouTube trend researcher.

My niche is ${profile.niche}.
My target audience is ${profile.audience}.
Today's date is ${today}.

I have done web research for the latest trends. Here are recent headlines:
${p1Trends}

Do the following:

1. Find 10 trending topics RIGHT NOW in my niche based on these trends and your knowledge.
2. For each topic give me:
   - Topic name
   - Why it's trending (reason)
   - Search volume level (Low / Medium / High)
   - Competition level (Low / Medium / High)
   - Best platform for this topic (YouTube / Instagram / TikTok)
   - How long this trend will last (1 week / 1 month / Evergreen)
   - Urgency score out of 10 (10 = post TODAY)

3. Rank them from HIGHEST opportunity to LOWEST
4. Put a ⚡ next to topics I should cover THIS WEEK
5. Put a 🔥 next to topics with viral potential

Format this as a clean table.`;
        break;

      case 2:
        userPrompt = `Act as a competitive intelligence analyst for YouTube creators.

My channel is in ${profile.niche}.
My top 3 competitors are: ${payload.competitors}

Do the following:

1. Identify topics my competitors cover MOST
2. Find topics they have NOT covered or covered POORLY
3. Find topics where small channels are OUTPERFORMING big ones
4. Find questions the audience is asking that NO ONE has answered well
5. Give me 10 content gap opportunities ranked by:
   - Audience demand (High/Medium/Low)
   - Competition level (High/Medium/Low)
   - My chance of ranking (High/Medium/Low)

For each opportunity give me:
- Topic title
- Why competitors missed it
- My unique angle to cover it better
- Suggested video length
- Expected view potential

This is my unfair advantage list. Make it detailed.`;
        break;

      case 3:
        userPrompt = `I have the following list of video topic ideas:
${payload.topicList}

For each topic, tell me:

1. Is this TRENDING (hot now, short shelf life) or EVERGREEN (stays relevant forever)?
2. Best time to post it (NOW / This Month / Anytime)
3. Search intent (Are people searching this or just scrolling?)
4. Viral potential score out of 10
5. Recommended approach: 
   - Short-form (Reels/Shorts under 60 sec)
   - Mid-form (3-8 minutes)
   - Long-form (10+ minutes)

Sort them into two lists:
- POST THIS WEEK (Trending)
- ADD TO CONTENT CALENDAR (Evergreen)`;
        break;

      case 4:
        const p4Trends = liveContext;
        userPrompt = `Every Monday, I want you to generate my Weekly Content Intelligence Report.

My niche: ${profile.niche}
My platform: YouTube

Here is live web data about current trends:
${p4Trends}

Report must include:

SECTION 1 — THIS WEEK'S TOP 5 TRENDING TOPICS
(With urgency score, competition, and my recommended angle)

SECTION 2 — RISING TOPICS TO WATCH
(Topics gaining momentum but not yet saturated)

SECTION 3 — DECLINING TOPICS TO AVOID
(Topics that peaked last week — avoid wasting time)

SECTION 4 — ONE BIG OPPORTUNITY THIS WEEK
(The single best topic for me to post right now with full strategy)

SECTION 5 — CONTENT CALENDAR SUGGESTION
(Map the 5 topics across Mon/Wed/Fri/Sat/Sun with platform recommendations)

Make this my complete weekly game plan. Be specific and actionable based on the live trends provided.`;
        break;

      case 5:
        userPrompt = `Act as a world-class YouTube title copywriter who has written titles for videos with 10M+ views.

My video topic is: ${payload.topic}
My target audience is: ${profile.audience}
My channel style is: ${profile.tone}

Generate 20 different title options using these formulas:

FORMAT 1 — NUMBER TITLES (5 of them)
"[Number] [Things/Ways/Secrets] That [Benefit/Outcome]"

FORMAT 2 — CURIOSITY TITLES (5 of them)
Use words like: Nobody, Finally, Truth, Secret, Hidden, Exposed

FORMAT 3 — STORY TITLES (5 of them)
"I [Did Something] for [Time Period] — Here's What Happened"

FORMAT 4 — VS / COMPARISON TITLES (3 of them)
"[Option A] vs [Option B] — The REAL Answer"

FORMAT 5 — QUESTION TITLES (2 of them)
A question that makes people think "I NEED to know this"

For EACH title give me:
- Emotion it triggers (Curiosity / Fear / Excitement / FOMO)
- Click-through rate prediction (Low/Medium/High)
- Best used for (YouTube / Instagram / TikTok)

Then give me your TOP 3 picks with explanation of WHY.`;
        break;

      case 6:
        userPrompt = `My video title is: ${payload.title}
My topic is: ${payload.topic}

Generate thumbnail text options for me:

1. MAIN HEADLINE TEXT (3-5 words MAX, big and bold)
   - Give me 5 options
   - Must create instant curiosity or shock

2. SUPPORTING TEXT (optional, smaller text)
   - Give me 3 options if needed

3. THUMBNAIL CONCEPT IDEAS
   - Give me 3 thumbnail visual concepts
   - Describe: Background color, facial expression, text placement, any props

4. COLOR PSYCHOLOGY SUGGESTION
   - What colors should dominate my thumbnail for THIS topic?
   - Why will those colors stop the scroll?

5. EMOTION SCORE
   - Rate each thumbnail concept on: Curiosity (1-10), Shock (1-10), Clarity (1-10)

Top creators use thumbnails that tell a STORY in 2 seconds. Make mine do that.`;
        break;

      case 7:
        userPrompt = `Act as a professional YouTube scriptwriter who writes scripts for videos that consistently get 1M+ views.

VIDEO DETAILS:
- Topic: ${payload.topic}
- Title: ${payload.title}
- Target Length: ${payload.length}
- My Style: ${profile.tone}
- Audience: ${profile.audience}

Write a complete video script with:

SECTION 1 — HOOK (First 30 seconds)
- Open with a SHOCKING statement, question, or story
- Must make viewer say "I NEED to keep watching"
- No intro, no "welcome back" — start with IMPACT

SECTION 2 — PROMISE (30-60 seconds)
- Tell them EXACTLY what they'll learn/get by watching
- Create anticipation for the ending

SECTION 3 — MAIN CONTENT (The Meat)
- Divide into clear sections with transition phrases
- Add pattern interrupts every 60-90 seconds
- Include specific examples, numbers, and stories
- Add timestamps markers [0:00], [1:30], [3:00] etc.

SECTION 4 — RETENTION BOOSTERS
- Add 2-3 moments where you say "stay till the end because..."
- Include a mid-video hook to prevent drop-off

SECTION 5 — CALL TO ACTION (Last 30 seconds)
- Subscribe CTA that feels natural not forced
- Tell them what video to watch next
- End with a memorable line they'll remember

Write in MY voice — conversational, not robotic. 
Make every sentence earn its place in the script.`;
        break;

      case 8:
        userPrompt = `Write a SHORT-FORM video script (45-60 seconds MAX) for:

Platform: YouTube Shorts
Topic: ${payload.topic}
Goal: Views / Followers to long video

Structure MUST be:

SECOND 0-3: SCROLL-STOPPING HOOK
(One sentence that makes them stop scrolling immediately)
Options: Bold claim / Shocking fact / Direct question / "POV:" format

SECOND 3-15: THE PROBLEM OR SETUP
(Agitate the pain or set up the story — keep it fast)

SECOND 15-45: THE VALUE BOMB
(Deliver the main point in the most punchy, simple way)
- Use bullet-point style delivery
- One idea per sentence
- NO filler words

SECOND 45-60: CTA + LOOP HOOK
(Tell them what to do AND create a reason to rewatch)
- "Save this before it disappears"
- "Watch again — you missed something"
- "Follow for Part 2"

BONUS: Give me 3 on-screen text overlay suggestions
(Text that appears on screen to boost watch time)

Make this feel NATIVE to the platform — not like a commercial.`;
        break;

      case 9:
        userPrompt = `Write captions for my content across ALL platforms.

MY CONTENT: ${payload.contentDesc}
MY NICHE: ${profile.niche}
MY AUDIENCE: ${profile.audience}

Write separate optimized captions for:

━━━━━━━━━━━━━━━━━━━━━━
YOUTUBE DESCRIPTION:
━━━━━━━━━━━━━━━━━━━━━━
- First 2 lines must include main keyword naturally (shown before "Show More")
- Paragraph 1: Video summary with keywords
- Paragraph 2: Why this matters to viewer
- Timestamps section (create 6-8 chapter markers)
- Resource links section (placeholder)
- Subscribe CTA
- Hashtags (3-5 relevant ones at bottom)
- Total length: 200-300 words

━━━━━━━━━━━━━━━━━━━━━━
INSTAGRAM CAPTION:
━━━━━━━━━━━━━━━━━━━━━━
- Line 1: HOOK (makes them tap "more")
- Body: 3-5 punchy lines of value
- Line break before CTA
- CTA: Saves / Comments / DM me
- 5 hashtags (mix of niche + broad)
- Total length: 100-150 words

━━━━━━━━━━━━━━━━━━━━━━
TIKTOK CAPTION:
━━━━━━━━━━━━━━━━━━━━━━
- Super short (under 100 characters)
- Include 1 question to boost comments
- 3-4 hashtags only
- Conversational tone

━━━━━━━━━━━━━━━━━━━━━━
TWITTER/X THREAD HOOK:
━━━━━━━━━━━━━━━━━━━━━━
- Tweet 1: The hook (under 280 characters)
- Tweet 2: The value teaser
- Tweet 3: Link to full video`;
        break;

      case 10:
        userPrompt = `Act as a social media SEO specialist.

My post is about: ${payload.topic}
My platform: YouTube
My current following size: ${profile.subscribers}
My niche: ${profile.niche}

Generate a STRATEGIC hashtag/keyword system:

TIER 1 — NICHE KEYWORDS (High relevance, low competition)
Give me 5 of these — where my content can actually RANK

TIER 2 — MID KEYWORDS (Medium competition)
Give me 5 of these — balance between reach and competition

TIER 3 — BROAD KEYWORDS (High competition)
Give me 3 of these — maximum exposure but harder to rank

TIER 4 — SEARCH KEYWORDS (Search-based intent)
Give me 3 of these — things people actually TYPE to search

For EACH keyword tell me:
- Approximate search volume intent
- Why it's relevant to MY content
- Probability of ranking (High/Medium/Low) based on my account size

FINAL RECOMMENDATION:
Give me the BEST 5 tags to use.
Explain the logic behind your final selection.`;
        break;

      case 11:
        userPrompt = `Act as my personal content director.

Create a FULL 30-DAY content calendar for me.

MY DETAILS:
- Niche: ${profile.niche}
- Platform: YouTube
- Posting schedule: ${profile.uploadFrequency}
- Current goal this month: ${profile.goal}
- My content pillars: ${profile.pillars}

For each piece of content include:

📅 DATE:
📌 PLATFORM:
🎯 TOPIC:
📝 CONTENT TYPE: (Educational/Entertaining/Promotional/Trending)
🔥 HOOK IDEA: (First sentence or visual)
📖 TITLE DRAFT:
🏷️ 5 KEYWORDS:
🎯 PRIMARY GOAL: (Views/Engagement/Conversions)

ALSO INCLUDE:
- 2 Trending topic posts per week (marked with ⚡)
- 2 Evergreen posts per week (marked with 🌲)
- 1 Engagement post per week like polls, questions (marked with 💬)

At the end give me a MONTHLY THEME — one overarching message that connects all content together for brand building.`;
        break;

      case 12:
        userPrompt = `I just created this piece of content:

TYPE: YouTube Video
TITLE: ${payload.title}
MAIN POINTS: ${payload.points}

Repurpose this into MAXIMUM pieces of content:

1. YOUTUBE SHORTS (3 ideas — which moments become Shorts)
2. INSTAGRAM CAROUSEL (10 slide outline — what goes on each slide)
3. INSTAGRAM REEL SCRIPT (45 seconds — best part of the video)
4. TIKTOK (3 different angles for 3 separate TikToks)
5. TWITTER/X THREAD (5-tweet thread with hook tweet)
6. INSTAGRAM STORIES (5-story sequence with poll/question ideas)
7. EMAIL NEWSLETTER (Subject line + 3-paragraph summary)
8. PINTEREST PIN (Title + description for 3 pins)
9. LINKEDIN POST (Professional angle for same content)
10. QUOTE GRAPHICS (5 quotable one-liners from the content)

Goal: ONE video becomes 30+ pieces of content.
Map out EXACTLY how to do this efficiently.`;
        break;

      case 13:
        userPrompt = `Act as a YouTube analytics expert.

Fetch and use the actual video and YouTube Analytics record supplied in the live data section below. Do not use guessed or manually supplied metrics. If CTR, impressions, or retention are unavailable because the connected account does not own the video, say so explicitly and analyze the public statistics that are available.

Analyze this and tell me:

1. IS THIS GOOD OR BAD for my channel size (${profile.subscribers} subs)? (Benchmark comparison)
2. WHERE is the biggest problem? (CTR / Retention / Reach?)
3. WHAT specifically caused low/high performance?
4. HOW do I fix each problem in my NEXT video?
5. WHAT does this data tell me about my audience?
6. WHAT type of video should I make next based on this data?
7. TITLE ANALYSIS — Was my title the problem? Give me 3 better alternatives.

Give me a clear DIAGNOSIS + PRESCRIPTION.
What to stop. What to start. What to improve.`;
        break;

      case 14:
        userPrompt = `Audit my YouTube channel strategy completely.

CHANNEL INFO:
- Niche: ${profile.niche}
- Posting frequency: ${profile.uploadFrequency}
- Current problems: ${profile.currentProblem}

Use the connected channel's live subscriber count, total video count, recent uploads, and performance statistics from the live data section. Do not rely on manually entered or guessed channel metrics.

Give me a COMPLETE channel audit:

1. WHAT IS WORKING — Double down on these immediately
2. WHAT IS NOT WORKING — Stop doing these immediately
3. CONTENT GAPS — Topics I'm missing that my audience wants
4. TITLE PATTERNS — Common mistakes in my titling strategy
5. POSTING STRATEGY — Am I posting too much or too little?
6. GROWTH BOTTLENECK — The #1 thing holding my channel back
7. 30-DAY ACTION PLAN — Step by step what to do this month

Be brutally honest. I need real feedback, not compliments.
Treat this like a paid $500 consultation.`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

    userPrompt += `\n\nAUTHORITATIVE LIVE PUBLIC WEB DATA (do not invent metrics or claim a source that is not present):\n${liveContext}\n\nUse actual source titles, dates, public records, and URLs above. For every prompt return: (1) evidence-backed findings, (2) three prioritized action points labeled Today / This week / Validate, (3) three video title options, (4) a ready-to-use description, (5) relevant hashtag/keyword options without claiming usage volume, (6) the expected output or success check for each action, and (7) a short source ledger. Clearly label unavailable private metrics and never invent algorithm rules.`;

    if (process.env.ENABLE_AI_SYNTHESIS !== 'true' && !isSelectedTrendCreation) {
      return NextResponse.json({ content: buildPublicWebAnalysis('YouTube', userPrompt, liveContext), liveData: true, partial: true, dataMode: "public-web-only", retrievedAt: new Date().toISOString() });
    }
    try {
      const aiResult = await generateWithWebSearch({ system: systemContext, prompt: userPrompt });
      return NextResponse.json({ content: aiResult.text, liveData: true, dataMode: "public-web-with-ai-synthesis", retrievedAt: new Date().toISOString() });
    } catch (synthesisError) {
      console.error('YouTube AI synthesis unavailable; returning public web data:', synthesisError instanceof Error ? synthesisError.message : 'unknown error');
      return NextResponse.json({ content: buildPublicWebAnalysis('YouTube', userPrompt, liveContext), liveData: true, partial: true, dataMode: "public-web-only", retrievedAt: new Date().toISOString() });
    }

  } catch (error: unknown) {
    console.error('YouTube Strategy API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate content';
    const status = /youtube_not_connected|Connect YouTube|No YouTube channel|No live YouTube\/web data/i.test(message) ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
