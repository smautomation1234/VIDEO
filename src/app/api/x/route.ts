import { NextResponse } from 'next/server';
import { buildXLiveContext } from '@/lib/x-live';
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

    const liveContext = await buildXLiveContext(Number(promptId), profile as Record<string, string>, payload as Record<string, unknown>);

    const systemContext = `
You are a dedicated X (Twitter) content strategy assistant.
X CREATOR PROFILE:
- Name/handle: ${profile.name}
- Bio (current): ${profile.bio}
- Field/Industry: ${profile.industry}
- Target Audience: ${profile.audience}
- Content Pillars: ${profile.pillars}
- Building in public: ${profile.buildingInPublic}
- Content Types I Post: ${profile.contentTypes}
- Posting Frequency: ${profile.frequency}
- Current Followers: ${profile.followers}
- Primary Goals: ${profile.goal}
- My Unique Angle: ${profile.uniqueAngle}
- Current Problem: ${profile.currentProblem}
- Tone of Voice: ${profile.tone}

Use this profile context in EVERY response. Never give generic "Twitter guru" advice — make it specific to this field and audience.`;

    let userPrompt = '';
    let searchContext = liveContext;

    switch (promptId) {
      case 1:
        userPrompt = `Act as an X (Twitter) content strategist for someone in my industry.
My content pillars are: ${profile.pillars}
My audience is: ${profile.audience}
${payload.useSearch ? `\nRecent Web Search Context for Trends:\n${searchContext}\n` : ''}
Give me 10 post ideas for this week.
For each idea give:
- The core idea/topic
- Which pillar it supports
- The angle (contrarian / hard-won lesson / data point / mistake / raw number)
- Best format: Single tweet / Thread / Poll / Image + short text
- One possible opening line (stand-alone hook)

Rank them by how likely they are to generate real REPLIES. Flag your top 3 picks.`;
        break;
      case 2:
        userPrompt = `Act as a ghostwriter helping me mine my own experience for X content.
My story: ${payload.story}

Give me:
1. The single most interesting, tweetable insight buried in what I told you
2. 3 different post angles on this same story
3. Whether this should be a single sharp tweet or a thread — and why
4. The strongest opening line for each angle
5. Which angle is most likely to get real replies, not just likes`;
        break;
      case 3:
        userPrompt = `Act as a competitive content analyst for X.
My field: ${profile.industry}
Accounts I admire or compete with: ${payload.competitors}
${payload.useSearch ? `\nSearch Context about these accounts/industry:\n${searchContext}\n` : ''}
1. What topics tend to generate the most substantive replies in this space?
2. What post structures tend to work well here?
3. What are 5 content gaps I could own?
4. What's a common mistake accounts in my field make on X?
5. Suggest 10 other accounts worth replying to thoughtfully (beyond those named).
Give me 5 specific post ideas that take a different angle than what's commonly posted.`;
        break;
      case 4:
        userPrompt = `Act as an X ghostwriter who writes tweets that get replies, not just likes.
POST DETAILS:
- Topic: ${payload.topic}
- Angle: ${payload.angle}
- Goal: Replies / Profile visits / Follows / Establishing expertise
- Tone: ${profile.tone}

Write 3 VERSIONS of the tweet:
- Version A: Leads with a specific number or concrete detail
- Version B: Leads with a contrarian or surprising claim
- Version C: Leads with a direct question to the reader

For each version:
- Under 280 characters
- Must work as a stand-alone hook
- No hashtags
- Ends with something that invites a real answer
Flag which version is strongest and why.`;
        break;
      case 5:
        userPrompt = `Act as an X thread strategist.
TOPIC: ${payload.topic}
GOAL: ${payload.goal}
LENGTH: 6-12 tweets

Write it out:
TWEET 1 — THE HOOK: Give 3 options (number-led, contrarian, story-cliffhanger).
TWEETS 2 to [N-1] — THE BODY: One clear idea per tweet. Short, punchy sentences. Concrete details.
FINAL TWEET — THE CLOSE: Summary takeaway. Genuine question inviting real replies.
Confirm the thread reads as specific experience.`;
        break;
      case 6:
        userPrompt = `Act as a build-in-public content strategist.
WHAT I'M BUILDING: ${profile.buildingInPublic}
THIS UPDATE IS ABOUT: ${payload.topic}
RAW DETAILS: ${payload.details}

Write:
1. A single-tweet version (leads with outcome/number, vulnerable, ends with question).
2. A short-thread version (4-6 tweets: hook, middle/what didn't work, what's next).
3. Flag whether this stands alone or should be combined for later.`;
        break;
      case 7:
        userPrompt = `Act as an X growth strategist focused on reply-based visibility.
MY FIELD: ${profile.industry}
MY EXPERTISE: ${profile.uniqueAngle}
A TWEET I WANT TO REPLY TO: ${payload.targetTweet}

Give me:
1. 3 different reply options (adds new angle, disagreement, data point, or extension - NO generic praise).
2. Flag which reply is most likely to get replies of its own.
3. One line on why a generic reply would be wasted here.
4. A short list of the TYPES of accounts/tweets in my field worth replying to regularly.`;
        break;
      case 8:
        userPrompt = `Act as an X profile strategist helping me build a personal brand.
MY CURRENT PROFILE:
- Current bio: ${profile.bio}
- Current pinned tweet: ${payload.pinnedTweet}
- Target audience: ${profile.audience}
- Primary goals: ${profile.goal}

Rewrite:
1. BIO (160 characters): Give me 3 versions. Focus on what I'm known for.
2. PINNED TWEET STRATEGY: What kind of tweet should be pinned? Draft one option.
3. CONSISTENCY CHECK: Does my bio/pinned tweet align with my pillars?`;
        break;
      case 9:
        userPrompt = `Act as my X content planner for the week.
MY DETAILS:
- Content pillars: ${profile.pillars}
- Posting frequency: ${profile.frequency}
- This week's focus: ${payload.focus}
- Build-in-public update planned: ${payload.bipUpdate}

For each post give me:
- Day
- Format (Single tweet / Thread / Poll / Build-in-public)
- Topic + pillar it supports
- Hook (opening line)
- Closing question or CTA
Mix formats across the week. Include 2-3 planned reply sessions. End with one theme.`;
        break;
      case 10:
        userPrompt = `I have one idea/experience I want to get real mileage out of:
TOPIC: ${payload.idea}
KEY POINTS: ${payload.keyPoints}

Turn this into:
1. A single sharp tweet (punchiest version)
2. A thread (full teaching/story version)
3. A build-in-public angle (if relevant)
4. A reply-bait question tweet
5. A quote-tweet-friendly version
Space these out - give a 2-3 week posting order.`;
        break;
      case 11:
        userPrompt = `Act as an X content analyst helping me learn from a specific post.
POST DETAILS:
- Topic: ${payload.metrics.topic}
- Format: ${payload.metrics.format}
- Opening line: ${payload.metrics.hook}
METRICS:
- Impressions: ${payload.metrics.impressions}
- Likes: ${payload.metrics.likes}
- Replies: ${payload.metrics.replies}
- Reposts/Quote tweets: ${payload.metrics.reposts}

Give me:
1. What likely worked and didn't
2. Rewrite the opening line 2 better ways
3. Did replies feel real or low-effort?
4. One specific change to test next time
5. Does this deserve a follow-up?`;
        break;
      case 12:
        userPrompt = `Act as an X strategy consultant giving me an honest audit.
MY ACCOUNT:
- Followers: ${profile.followers}
- Frequency this month: ${payload.audit.frequency}
- Best performing post: ${payload.audit.bestPost}
- Weakest performing post: ${payload.audit.weakPost}
- What I think the problem is: ${payload.audit.problem}

Audit across:
1. PROFILE (alignment)
2. CONTENT MIX (formats)
3. HOOKS (earning attention)
4. REPLIES (conversation vs passive)
5. CONSISTENCY (beat)
End with: 3 things working, 3 things to change, single highest-leverage change, 30-day plan.`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

    userPrompt += `\n\nAUTHORITATIVE LIVE PUBLIC WEB DATA (retrieved now):\n${liveContext}\n\nUse current source titles, dates, URLs, and evidence. For every prompt return: (1) evidence-backed findings, (2) three prioritized action points labeled Today / This week / Validate, (3) three post or thread title/opening options, (4) a ready-to-use description or post body, (5) relevant hashtag/keyword options without claiming usage volume, (6) the expected output or success check for each action, and (7) a short source ledger. Do not invent X metrics, reply counts, or algorithm rules; label unavailable data.`;

    if (process.env.ENABLE_AI_SYNTHESIS !== 'true' && !isLaunchedPrompt) {
      return NextResponse.json({ content: buildPublicWebAnalysis('X/Twitter', userPrompt, liveContext), liveData: true, partial: true, dataMode: "public-web-only", retrievedAt: new Date().toISOString() });
    }
    try {
      const aiResult = await generateWithWebSearch({ system: systemContext, prompt: userPrompt });
      return NextResponse.json({ content: aiResult.text, liveData: true, dataMode: "public-web-with-ai-synthesis", retrievedAt: new Date().toISOString() });
    } catch (synthesisError) {
      console.error('X AI synthesis unavailable; returning public web analysis:', synthesisError instanceof Error ? synthesisError.message : 'unknown error');
      return NextResponse.json({ content: buildPublicWebAnalysis('X/Twitter', userPrompt, liveContext), liveData: true, partial: true, dataMode: "public-web-only", retrievedAt: new Date().toISOString() });
    }

  } catch (error: any) {
    console.error('X API Error:', error);
    const message = error.message || 'Failed to generate content';
    return NextResponse.json({ error: message }, { status: /live X\/Twitter/i.test(message) ? 503 : 500 });
  }
}
