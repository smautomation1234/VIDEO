import { NextResponse } from 'next/server';
import { buildLinkedInLiveContext } from '@/lib/linkedin-live';
import { buildPublicWebAnalysis } from '@/lib/public-web-analysis';
import { generateWithWebSearch } from '@/lib/ai';

function briefText(value: unknown, maxLength = 1800) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';
}

function buildImportedPostFallback(brief: Record<string, unknown>, profile: Record<string, string>) {
  const title = briefText(brief.title || brief.sourceTitle, 180) || 'A useful idea worth discussing';
  const hook = briefText(brief.hook, 260) || title;
  const description = briefText(brief.content, 1400);
  const reason = briefText(brief.evergreenReason, 500);
  const sourceUrl = briefText(brief.sourceUrl, 500);
  const audience = briefText(profile.audience, 160);
  const rawKeywords = Array.isArray(brief.keywords) ? brief.keywords : [];
  const hashtags = rawKeywords
    .map(item => briefText(item, 45).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ''))
    .filter(Boolean)
    .slice(0, 4)
    .map(item => `#${item}`)
    .join(' ');

  return [
    hook,
    description,
    reason ? `Why this remains useful: ${reason}` : '',
    audience ? `For ${audience}, the practical question is: how would you apply this in your own work?` : 'How would you apply this in your own work?',
    hashtags,
    sourceUrl ? `Source used for this draft: ${sourceUrl}` : '',
  ].filter(Boolean).join('\n\n');
}

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

    const liveContext = await buildLinkedInLiveContext(null, Number(promptId), profile as Record<string, string>, payload as Record<string, unknown>);

    const systemContext = `
You are a dedicated LinkedIn content strategy assistant.
LINKEDIN CREATOR PROFILE:
- Name: ${profile.name}
- Headline/Title: ${profile.headline}
- Industry/Field: ${profile.industry}
- Target Audience: ${profile.audience}
- Content Pillars: ${profile.pillars}
- Content Types I Post: ${profile.contentTypes}
- Posting Frequency: ${profile.frequency}
- Current Followers: ${profile.followers}
- Primary Goal: ${profile.goal}
- My Unique Angle: ${profile.uniqueAngle}
- Current Problem: ${profile.currentProblem}
- Tone of Voice: ${profile.tone}

Use this profile context in EVERY response. Never give generic advice — make it specific to this field and audience.`;

    let userPrompt = '';

    switch (promptId) {
      case 1:
        userPrompt = `Act as a LinkedIn content strategist for someone in my industry.
My content pillars are: ${profile.pillars}
My audience is: ${profile.audience}

Give me 10 post ideas for this week.
For each idea:
- The core idea/topic
- Which pillar it supports
- The angle that makes it worth reading
- Best format (Text / Carousel / Native video)
- One possible opening line

Rank them by how likely they are to spark real discussion in the comments. Flag your top 3 picks.`;
        break;
      case 2:
        userPrompt = `Act as a ghostwriter helping me mine my own experience for content.
Here is a recent story/situation: ${payload.story}

Give me:
1. The single most interesting insight buried in what I told you
2. 3 different post angles I could take on this same story
3. The strongest opening line for each angle
4. Which angle is most likely to get substantive comments`;
        break;
      case 3:
        userPrompt = `Act as a competitive content analyst for LinkedIn.
My field: ${profile.industry}
People I admire or compete with: ${payload.competitors}

Based on general patterns in my field:
1. What topics get the most substantive comments?
2. What post structures work well?
3. What are 5 content gaps I could own?
4. What's a common mistake people make in their posts that I should avoid?
Give me 5 specific post ideas that take a different angle.`;
        break;
      case 4:
        userPrompt = isSelectedTrendCreation ? `Act as a factual LinkedIn editor. Turn the imported research brief into one concise, ready-to-publish LinkedIn post. Do not provide alternate hooks, strategy notes, or a research report.` : `Act as a LinkedIn ghostwriter who writes posts that get read all the way through and generate real comments.
POST DETAILS:
- Topic: ${payload.topic}
- Format: ${payload.format}
- Goal: Comments / Establishing expertise
- Tone: ${profile.tone}

Write the complete post:
FIRST 2-3 LINES: Give me 3 options (Option A: concrete, Option B: contrarian, Option C: direct question).
BODY: Short paragraphs, line breaks, one concrete example. Build to a clear point.
CLOSING: A genuine question that invites a substantive answer. No hard sell.`;
        break;
      case 5:
        userPrompt = `Act as a LinkedIn carousel content strategist.
TOPIC: ${payload.topic}
GOAL: Saves / Shares / Establishing expertise
NUMBER OF SLIDES: 8-12

Write it out:
SLIDE 1 — COVER: Headline, Subhead. Give me 3 options.
SLIDES 2 to N-1: Slide title, 1-3 lines of content, suggest visual/diagram.
FINAL SLIDE — CTA: Summary, specific question/next step.
CAPTION: First 2-3 lines as hook, brief context, discussion question.`;
        break;
      case 6:
        userPrompt = `Act as a LinkedIn video scriptwriter.
TOPIC: ${payload.topic}
LENGTH: 60-90 seconds

Write:
OPENING LINE (first 3s): Give me 3 options.
MAIN CONTENT: Structured in clear beats (Beat 1: problem, Beat 2: insight, Beat 3: takeaway).
CLOSING LINE: Specific question/clear point.
ON-SCREEN TEXT SUGGESTIONS: Key phrases to caption.
CAPTION: 2-3 lines hook, brief framing.`;
        break;
      case 7:
        userPrompt = `Act as a LinkedIn profile strategist.
MY CURRENT PROFILE:
Headline: ${profile.headline}
About/Problem: ${profile.currentProblem}
Goal: ${profile.goal}

Rewrite:
1. HEADLINE: Give me 3 versions (220 chars).
2. ABOUT SECTION: 2-3 short paragraphs in first person, conversational, closing with soft CTA.
3. FEATURED SECTION SUGGESTIONS: 3-5 things to pin.
4. CONSISTENCY CHECK: Does it align with my pillars?`;
        break;
      case 8:
        userPrompt = `Act as my LinkedIn content planner for this week.
My details are in my profile.
Focus: ${payload.focus || 'General growth'}

For each post give me:
- Day
- Format
- Topic + pillar it supports
- Hook (first 2-3 lines)
- Discussion question
Mix formats. End with one theme.`;
        break;
      case 9:
        userPrompt = `I have one idea I want to get real mileage out of:
TOPIC/IDEA: ${payload.idea}

Turn this into:
1. A text post (story-first angle)
2. A text post (contrarian angle)
3. A carousel outline
4. A short video script
5. A comment-bait question post

Space these out - give me a 2-3 week posting order.`;
        break;
      case 10:
        userPrompt = `Act as a LinkedIn content analyst helping me learn from a specific post.
POST DETAILS:
Topic: ${payload.metrics.topic}
Format: ${payload.metrics.format}
Opening line: ${payload.metrics.hook}
Impressions: ${payload.metrics.impressions}
Comments: ${payload.metrics.comments}

Give me:
1. What likely worked/didn't
2. Was the opening line strong? Rewrite it 2 better ways
3. Did the closing question invite real comments?
4. One specific change to test next
5. Is this worth a follow-up?`;
        break;
      case 11:
        userPrompt = `Act as a LinkedIn strategy consultant giving me an honest audit.
Best performing post: ${payload.bestPost}
Weakest performing post: ${payload.weakPost}
What I think the problem is: ${payload.problem}

Audit across:
1. PROFILE
2. CONTENT MIX
3. HOOKS
4. ENGAGEMENT
5. CONSISTENCY

End with: 3 things to keep doing, 3 things to stop/change, highest-leverage change to make, and a 30-day plan.`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

    const isImportedPost = Number(promptId) === 4 && isSelectedTrendCreation;
    if (isImportedPost) {
      userPrompt += `\n\nIMPORTED RESEARCH BRIEF:\nTitle: ${briefText(workflowBrief.title || workflowBrief.sourceTitle)}\nHook: ${briefText(workflowBrief.hook)}\nDescription: ${briefText(workflowBrief.content)}\nWhy evergreen: ${briefText(workflowBrief.evergreenReason)}\nSource URL: ${briefText(workflowBrief.sourceUrl)}\nKeywords: ${Array.isArray(workflowBrief.keywords) ? workflowBrief.keywords.join(', ') : ''}\n\nVERIFIED PUBLIC WEB CONTEXT:\n${liveContext}\n\nReturn one ready-to-publish LinkedIn post, not a research report. Start with one strong factual hook, use short readable paragraphs, explain the practical insight, and end with one genuine discussion question. Add 3-5 relevant hashtags and a final source note. Use only facts contained in the imported brief or verified context. If the brief lacks detail, keep the post concise and ask a thoughtful question instead of filling gaps with generic advice. Do not add alternate hooks, performance promises, invented statistics, or unsupported claims.`;
    } else {
      userPrompt += `\n\nAUTHORITATIVE LIVE PUBLIC WEB DATA (retrieved now):\n${liveContext}\n\nUse current source titles, dates, URLs, and evidence. For every prompt return: (1) evidence-backed findings, (2) three prioritized action points labeled Today / This week / Validate, (3) three content title options, (4) a ready-to-use description, (5) relevant hashtag/keyword options without claiming usage volume, (6) the expected output or success check for each action, and (7) a short source ledger. Never invent platform metrics or algorithm rules; label unavailable data.`;
    }

    if (process.env.ENABLE_AI_SYNTHESIS !== 'true' && !isSelectedTrendCreation) {
      return NextResponse.json({ content: buildPublicWebAnalysis('LinkedIn', userPrompt, liveContext), liveData: true, partial: true, dataMode: "public-web-only", retrievedAt: new Date().toISOString() });
    }
    try {
      const aiResult = await generateWithWebSearch({ system: systemContext, prompt: userPrompt });
      return NextResponse.json({ content: aiResult.text, liveData: true, dataMode: "public-web-with-ai-synthesis", retrievedAt: new Date().toISOString() });
    } catch (synthesisError) {
      console.error('LinkedIn AI synthesis unavailable; returning public web data:', synthesisError instanceof Error ? synthesisError.message : 'unknown error');
      if (isImportedPost) {
        return NextResponse.json({ content: buildImportedPostFallback(workflowBrief, profile as Record<string, string>), liveData: true, partial: true, dataMode: "source-backed-draft", retrievedAt: new Date().toISOString() });
      }
      return NextResponse.json({ content: buildPublicWebAnalysis('LinkedIn', userPrompt, liveContext), liveData: true, partial: true, dataMode: "public-web-only", retrievedAt: new Date().toISOString() });
    }

  } catch (error: unknown) {
    console.error('LinkedIn API Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate content';
    return NextResponse.json({ error: message }, { status: /live LinkedIn\/web/i.test(message) ? 503 : 500 });
  }
}
