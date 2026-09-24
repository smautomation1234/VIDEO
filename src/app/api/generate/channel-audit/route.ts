import { NextResponse } from 'next/server';
import { generateWithWebSearch } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { mode, videoData, channelData } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    let prompt = '';

    if (mode === 'profile-seo') {
      const { platform, handle, niche, targetAudience, currentBio, currentKeywords } = channelData || {};
      prompt = `Act as a ${platform || 'Instagram'} Profile SEO Expert for 2026.
In 2026, social profiles operate as micro-search engines. If a profile isn't optimized for search, it won't be discovered.

PROFILE DETAILS:
- Platform: Instagram (2026 Algorithm)
- Handle/Username: ${handle || 'Unknown'}
- Niche: ${niche || 'Unknown'}
- Target Audience: ${targetAudience || 'Unknown'}
- Current Bio: "${currentBio || 'None'}"
- Keywords they think they are targeting: ${currentKeywords || 'None'}

Analyze this profile and generate a complete Profile SEO overhaul.

Return ONLY valid JSON:
{
  "profileScore": 85,
  "seoDiagnosis": "What is currently wrong with their searchability",
  "nameFieldOptimization": {
    "current": "their current name field",
    "recommendation": "Name | Keyword 1 | Keyword 2",
    "why": "Why this specific format ranks better"
  },
  "bioRewrite": {
    "line1": "The Authority/Hook line (who you are + who you help)",
    "line2": "The Value/SEO line (keywords naturally integrated)",
    "line3": "The Proof/Credibility line",
    "line4": "The CTA line (pointing to link)"
  },
  "keywordBank": ["Top Keyword 1", "Keyword 2", "Keyword 3", "Keyword 4"],
  "pinnedContentStrategy": "What 3 pieces of content they should pin to the top of their profile and why",
  "urgentAction": "The #1 thing they must change today"
}`;
    } else if (mode === 'post') {
      const { platform, title, views, impressions, subscribersGained, shares, saves, nonFollowerReach } = videoData || {};
      prompt = `You are an Instagram analytics expert who consults top creators on the 2026 algorithm.

POST PERFORMANCE DATA:
- Platform: Instagram (2026 Algorithm)
- Topic/Hook: ${title || 'Unknown'}
- Views: ${views || 0}
- Impressions/Reach: ${impressions || 0}
- Followers Gained: ${subscribersGained || 0}
- Shares / DM Sends: ${shares || 0}
- Saves: ${saves || 0}
- Non-Follower Reach %: ${nonFollowerReach || 'Unknown'}

Analyze this and return a complete diagnosis + prescription. Be specific, data-driven, and brutally honest.

Return ONLY valid JSON:
{
  "overallRating": "Excellent | Good | Average | Below Average | Poor",
  "benchmarkComparison": "How this compares to industry benchmarks — is this good or bad for a channel this size?",
  "primaryProblem": "The #1 thing holding this video back",
  "diagnosis": {
    "reachAnalysis": "detailed analysis of impressions vs views",
    "shareAnalysis": "what the share metric tells us about virality",
    "saveAnalysis": "what the save metric tells us about value",
    "followerConversion": "conversion rate analysis"
  },
  "prescription": {
    "stopDoing": ["thing to stop doing 1", "thing to stop 2"],
    "startDoing": ["thing to start 1", "thing to start 2"],
    "improve": ["thing to improve 1", "thing to improve 2"]
  },
  "titleAlternatives": [
    { "title": "better title option 1", "reason": "why this would perform better" },
    { "title": "better title option 2", "reason": "why this would perform better" },
    { "title": "better title option 3", "reason": "why this would perform better" }
  ],
  "nextVideoRecommendation": "What type of post/Reel to make next based on this data",
  "audienceInsight": "What this data reveals about the audience"
}`;
    } else {
      const { platform, niche, totalVideos, subscribers, avgViews, bestVideo, worstVideo, postingFrequency, problems } = channelData || {};
      prompt = `You are a social media strategy consultant for Instagram. Treat this like a $500 paid consultation. Be brutally honest.

ACCOUNT DATA:
- Platform: Instagram (2026 Algorithm)
- Niche: ${niche || 'Unknown'}
- Total Posts: ${totalVideos || 0}
- Followers: ${subscribers || 0}
- Average Views Per Post: ${avgViews || 0}
- Best Performing Post: ${bestVideo || 'Not specified'}
- Worst Performing Post: ${worstVideo || 'Not specified'}
- Posting Frequency: ${postingFrequency || 'Not specified'}
- Current Problems: ${problems || 'Not specified'}

Perform a complete Instagram account audit.

Return ONLY valid JSON:
{
  "channelScore": 72,
  "strengths": [
    { "item": "what is working", "action": "double down on this immediately" }
  ],
  "weaknesses": [
    { "item": "what is not working", "action": "stop doing this immediately" }
  ],
  "contentGaps": [
    { "topic": "missing topic", "why": "why audience wants it", "opportunity": "High | Medium | Low" }
  ],
  "titlePatternIssues": [
    "specific titling mistake 1",
    "specific titling mistake 2",
    "specific titling mistake 3"
  ],
  "postingStrategyVerdict": "Too much | Too little | About right — with explanation",
  "growthBottleneck": "The single #1 thing holding this account back with specific explanation",
  "thirtyDayPlan": [
    { "week": 1, "focus": "what to focus on week 1", "tasks": ["task 1", "task 2", "task 3"] },
    { "week": 2, "focus": "what to focus on week 2", "tasks": ["task 1", "task 2", "task 3"] },
    { "week": 3, "focus": "what to focus on week 3", "tasks": ["task 1", "task 2", "task 3"] },
    { "week": 4, "focus": "what to focus on week 4", "tasks": ["task 1", "task 2", "task 3"] }
  ],
  "urgentAction": "The ONE thing to do this week before anything else"
}`;
    }

    const { text } = await generateWithWebSearch({ prompt, apiKey });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return NextResponse.json({ ...result, mode });
  } catch (err: any) {
    console.error('Channel audit error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate audit' }, { status: 500 });
  }
}
