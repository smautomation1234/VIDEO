import { NextResponse } from 'next/server';
import { generateWithWebSearch } from "@/lib/ai";
import { algorithmCracker, PostData } from '@/lib/algorithm-cracker';

export const dynamic = 'force-dynamic';

// Universal patterns baked in (replaces DB lookup from Python version)
const UNIVERSAL_PATTERNS = [
  { template: 'Stop doing [X] if you want [Y]', trigger: 'Contrarian', score: 94 },
  { template: 'Nobody tells you that [surprising truth about X]', trigger: 'Curiosity Gap', score: 93 },
  { template: 'I tried [X] for 30 days — here\'s what happened', trigger: 'Social Proof', score: 91 },
  { template: 'POV: You finally figured out [X]', trigger: 'Relatability', score: 89 },
  { template: 'The [X] secret [authority] doesn\'t want you to know', trigger: 'Conspiracy', score: 88 },
  { template: '[N] things I wish I knew before [X]', trigger: 'Value/Regret', score: 87 },
  { template: 'This changed everything about how I [X]', trigger: 'Transformation', score: 86 },
  { template: 'Why [common belief about X] is completely wrong', trigger: 'Shock', score: 84 },
  { template: 'The reason you\'re not getting [result] yet', trigger: 'Pain Point', score: 83 },
  { template: 'How [unexpected person] does [X] differently', trigger: 'Curiosity', score: 82 },
];

function calculateViralScore(
  hooks: any[],
  hashtags: string[],
  format: any,
  platform: string,
  crossNicheInsights: any[]
): number {
  let score = 0;

  // Hook quality — 35 pts (matches Python)
  const firstHook = hooks[0]?.text || '';
  const triggerWords = ['secret','nobody','hidden','truth','finally','actually','stop','pov','why','how','never','this'];
  if (triggerWords.some(w => firstHook.toLowerCase().includes(w))) score += 12;
  const wc = firstHook.split(' ').length;
  if (wc >= 5 && wc <= 18) score += 8;
  if (/\d/.test(firstHook)) score += 7;
  score += Math.min(hooks[0]?.score || 0, 8);

  // Trend alignment — 25 pts (matches Python)
  const hasTrendSignals = (format?.trendingSignals?.length || 0) > 0;
  score += hasTrendSignals ? 18 : 10;
  score += Math.min(Math.floor((hooks[0]?.score || 70) / 10), 7);

  // Format optimisation — 20 pts (matches Python)
  const topFormats = ['recipe','transformation','tutorial','storytime','pov','montage','split-screen','reaction','breakdown','reveal'];
  score += topFormats.some(f => (format?.style || '').toLowerCase().includes(f)) ? 18 : 10;

  // Hashtag strategy — 10 pts (matches Python)
  const hc = hashtags.length;
  score += hc >= 5 && hc <= 12 ? 7 : hc > 0 ? 4 : 0;
  score += Math.min(hc * 0.5, 3);

  // Cross-niche appeal — 10 pts (matches Python)
  score += Math.min((crossNicheInsights?.length || 0) * 3, 10);

  return Math.min(Math.round(score), 100);
}

// Python base_multipliers: tiktok 15K, instagram 8K, youtube 5K
function predictViews(viralScore: number, platform: string) {
  const base: Record<string, number> = { tiktok: 15000, instagram: 8000, youtube: 5000, linkedin: 6000 };
  const b = base[platform.toLowerCase()] || 10000;
  let min: number, max: number;
  if (viralScore >= 90)      { min = b * 100; max = b * 1000; }
  else if (viralScore >= 80) { min = b * 30;  max = b * 200;  }
  else if (viralScore >= 70) { min = b * 10;  max = b * 50;   }
  else if (viralScore >= 60) { min = b * 3;   max = b * 15;   }
  else                       { min = b;        max = b * 5;    }
  return {
    min: Math.round(min),
    max: Math.round(max),
    likely: Math.round((min + max) / 2),
    engagement: viralScore >= 80 ? '6.2%–9.4%' : viralScore >= 70 ? '4.1%–7.2%' : '2.5%–5.0%',
  };
}

function getPostingStrategy(platform: string) {
  const map: Record<string, { today: string; tomorrow: string; reason: string }> = {
    tiktok:    { today: '6:45 PM', tomorrow: '8:15 AM or 7:30 PM', reason: 'Peak dinner-time scrolling; FYP algorithm is most aggressive at these windows.' },
    instagram: { today: '7:00 PM', tomorrow: '9:00 AM or 6:30 PM', reason: 'Reels algorithm favours early-evening engagement spikes for discovery.' },
    youtube:   { today: '3:00 PM', tomorrow: '2:00 PM or 4:00 PM', reason: 'Shorts peak post-lunch; algorithm amplifies watch-time in afternoon sessions.' },
    linkedin:  { today: '9:00 AM', tomorrow: '8:30 AM or 12:00 PM', reason: 'Peaks Tue–Thu mornings during commute and lunch hours.' },
  };
  const t = map[platform.toLowerCase()] || map.instagram;
  return {
    ...t,
    preTactics: [
      'Engage with 10 posts in your niche 30 min before posting',
      'Reply to DMs to signal high account activity to the algorithm',
      'Post a story/poll to warm up your audience',
    ],
    postTactics: [
      'Reply to every comment within the first 60 minutes',
      'Share to your story immediately after posting',
      'Pin the best comment to boost thread engagement',
    ],
  };
}

function detectPlatform(url: string) {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

async function scrapeVideoData(url: string, platform: string) {
  let caption = "";
  let views = 0, likes = 0, comments = 0, shares = 0, duration = 15;
  let hook = "";
  let hashtags: string[] = [];
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      next: { revalidate: 3600 }
    });
    
    if (res.ok) {
      const html = await res.text();
      
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
      
      if (titleMatch) caption += titleMatch[1] + " ";
      if (descMatch) caption += descMatch[1];
      
      const playMatch = html.match(/"playCount":(\d+)/) || html.match(/"viewCount":"(\d+)"/);
      const likeMatch = html.match(/"diggCount":(\d+)/) || html.match(/"likeCount":"(\d+)"/);
      const commentMatch = html.match(/"commentCount":(\d+)/);
      const shareMatch = html.match(/"shareCount":(\d+)/);
      
      if (playMatch) views = parseInt(playMatch[1]);
      if (likeMatch) likes = parseInt(likeMatch[1]);
      if (commentMatch) comments = parseInt(commentMatch[1]);
      if (shareMatch) shares = parseInt(shareMatch[1]);
    }
  } catch (e) {
    console.warn("Public metrics unavailable; leaving them unavailable", e);
  }

  // Fallback / estimation logic if exact metrics are hidden/blocked
  if (!caption) caption = "Caption unavailable from the public page.";
  
  hook = caption.split('\n')[0].substring(0, 100);
  hashtags = (caption.match(/#(\w+)/g) || []).map(t => t.replace('#', ''));
  
  return {
    platform,
    caption,
    hook,
    views,
    likes,
    comments,
    shares,
    engagement_rate: views > 0 ? ((likes + comments + shares) / views) * 100 : null,
    metrics_available: views > 0,
    duration,
    hashtags
  };
}

function analyzeAlgorithmPerformance(videoData: any, platform: string) {
  const algoScores: Record<string, number> = {};
  
  const estimatedVelocity = (videoData.likes + videoData.comments * 2 + videoData.shares * 3) / 24;
  algoScores.engagement_velocity = Math.min(100, estimatedVelocity / 10);
  
  if (videoData.duration < 15) algoScores.completion_rate = 75;
  else if (videoData.duration < 30) algoScores.completion_rate = 55;
  else algoScores.completion_rate = 35;
  
  if (videoData.engagement_rate > 10) algoScores.engagement_quality = 95;
  else if (videoData.engagement_rate > 7) algoScores.engagement_quality = 80;
  else if (videoData.engagement_rate > 5) algoScores.engagement_quality = 65;
  else algoScores.engagement_quality = 40;
  
  const values = Object.values(algoScores);
  const overall = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  
  return {
    platform,
    algorithm_scores: algoScores,
    overall_algorithm_score: overall,
    strengths: Object.keys(algoScores).filter(k => algoScores[k] > 70),
    weaknesses: Object.keys(algoScores).filter(k => algoScores[k] < 50)
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // --- REAL-TIME TREND MONITOR FLOW ---
    if (body.action === 'live_trends') {
      const { niche } = body;
      
      const prompt = `You are a real-time viral trend scanner. Return an array of 20 current trends${niche ? ` in the ${niche} niche` : ''}.
      Return JSON:
      {
        "trends": [
          { "topic": "...", "viral_score": 150, "growth_signals": 8, "mentions": 50 }
        ]
      }`;
      const { text } = await generateWithWebSearch({
        system: 'Output ONLY valid JSON.',
        prompt,
      });
      const raw = text || '{}';
      let trends: any[] = [];
      try { trends = JSON.parse(raw).trends || []; } catch (_) {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) { try { trends = JSON.parse(jsonMatch[0]).trends || []; } catch (_) {} }
      }
      
      const enhanced_trends = trends.map((trend: any) => {
        let time_to_act = "3-7 days";
        if (trend.growth_signals > 5 && trend.viral_score > 150) time_to_act = "6-12 hours before saturation";
        else if (trend.growth_signals > 3) time_to_act = "24-48 hours";
        
        let difficulty = { level: "Hard", reason: "Saturated, need unique angle" };
        if (trend.mentions < 10) difficulty = { level: "Easy", reason: "Few people covering it, easy to stand out" };
        else if (trend.mentions < 30) difficulty = { level: "Moderate", reason: "Some competition, need good execution" };
        
        let expected_roi = { potential: "Low", views: "<10K", followers: "<100" };
        if (trend.viral_score > 150) expected_roi = { potential: "Very High", views: "100K-500K", followers: "1K-5K" };
        else if (trend.viral_score > 100) expected_roi = { potential: "High", views: "50K-200K", followers: "500-2K" };
        else if (trend.viral_score > 70) expected_roi = { potential: "Moderate", views: "10K-50K", followers: "100-500" };
        
        return {
          ...trend,
          time_to_act,
          difficulty,
          expected_roi,
          quick_strategy: {
            approach: "Create content about '" + trend.topic + "' using trending hook pattern", 
            hook_suggestion: "POV: You just discovered " + trend.topic,
            cta: "Comment if you've tried this",
            hashtags: "#" + trend.topic.replace(/ /g, '') + " #viral"
          }
        };
      });
      
      return NextResponse.json({
        success: true,
        updated_at: new Date().toISOString(),
        next_update: new Date(Date.now() + 3600000).toISOString(),
        trends: enhanced_trends,
        summary: {
          total_trends: enhanced_trends.length,
          critical_urgency: enhanced_trends.filter((t: any) => t.time_to_act.includes('hours')).length,
          high_urgency: enhanced_trends.filter((t: any) => t.time_to_act.includes('24-48')).length
        }
      });
    }

    // --- SCAN INTERNET FOR VIRAL TOPICS FLOW ---
    if (body.action === 'trending_topics') {
      const { niche, limit = 50 } = body;
      
      const prompt = `You are a viral internet scanner. Find trending topics ${niche ? `for the niche: ${niche}` : 'across all platforms'}.
      Return up to ${limit} topics.
      Format as JSON: { "topics": [ { "topic": "...", "sources": ["tiktok", "instagram"], "viral_score": 95, "growth_signals": 8, "mentions": 450 } ] }`;
      
      const { text } = await generateWithWebSearch({
        system: 'Output ONLY valid JSON.',
        prompt,
      });
      let data: any = {};
      try { data = JSON.parse(text); } catch (_) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) { try { data = JSON.parse(jsonMatch[0]); } catch (_) {} }
      }
      let topics = data.topics || [];

      const enriched_topics = await Promise.all(topics.slice(0, limit).map(async (topic: any) => {
        const ideaPrompt = `For trending topic "${topic.topic}" in ${niche || 'general'} niche, give 3 QUICK viral hooks. Format: JSON array of strings. {"ideas": ["hook1", "hook2", "hook3"]}`;
        const ideaRes = await generateWithWebSearch({ prompt: ideaPrompt });
        let ideasData: any = {};
        try { ideasData = JSON.parse(ideaRes.text); } catch (_) {
          const jsonMatch = ideaRes.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) { try { ideasData = JSON.parse(jsonMatch[0]); } catch (_) {} }
        }
        
        let urgency_level = "LOW - Monitor for now";
        if (topic.viral_score > 150 || topic.growth_signals > 5) urgency_level = "CRITICAL - Create within 6 hours";
        else if (topic.viral_score > 100 || topic.growth_signals > 3) urgency_level = "HIGH - Create within 24 hours";
        else if (topic.viral_score > 70) urgency_level = "MODERATE - Create within 48 hours";
        
        let competition_level = { level: "Low", advice: "Great opportunity, act fast" };
        if (topic.mentions > 50) competition_level = { level: "High", advice: "Need unique angle to stand out" };
        else if (topic.mentions > 20) competition_level = { level: "Medium", advice: "Good opportunity with differentiation" };
        
        return {
          ...topic,
          content_ideas: ideasData.ideas || [],
          best_platforms: topic.sources ? topic.sources.slice(0, 3) : ['tiktok', 'instagram'],
          urgency_level,
          competition_level
        };
      }));

      return NextResponse.json({
        success: true,
        scanned_at: new Date().toISOString(),
        topics: enriched_topics,
        total_found: topics.length,
        sources_scanned: ['tiktok', 'instagram', 'youtube', 'twitter', 'reddit', 'google_trends', 'news']
      });
    }

    // --- COMPLETE CONTENT PACKAGE FLOW ---
    if (body.action === 'complete_package') {
      const { topic, platform = 'tiktok', duration = 15, style = 'educational', niche = 'general' } = body;
      if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });

      const prompt = `You are the ULTIMATE VIRAL CONTENT ENGINE.
      Create a COMPLETE viral package for:
      Topic: ${topic}
      Platform: ${platform}
      Niche: ${niche}
      
      Generate a JSON object with this exact structure:
      {
        "trending_status": {
          "is_trending": true,
          "urgency": "CRITICAL - Create within 6 hours",
          "recommendation": "Create immediately"
        },
        "master_script": {
          "platform": "${platform}",
          "hooks": [ { "text": "...", "score": 95, "pattern": "..." } ],
          "full_script": "...",
          "visual_guide": [ { "timestamp": "...", "camera": "...", "action": "...", "text": "..." } ],
          "editing_notes": { "pacing": "...", "transitions": "..." },
          "caption": "...",
          "predicted_performance": { "overall_score": 92, "prediction": "Expect 100K+ views" }
        },
        "platform_versions": {
          "tiktok": { "caption": "...", "hook": "...", "hashtags": ["..."] },
          "instagram": { "caption": "...", "hook": "...", "hashtags": ["..."] },
          "youtube": { "caption": "...", "hook": "...", "hashtags": ["..."] },
          "twitter": { "tweet_thread": ["..."] },
          "linkedin": { "text_post": "..." }
        },
        "seo_packages": {
          "tiktok": { "title": "...", "hashtags": { "hashtag_string": "..." }, "keywords": "..." },
          "instagram": { "title": "...", "hashtags": { "hashtag_string": "..." }, "keywords": "..." },
          "youtube": { "title": "...", "hashtags": { "hashtag_string": "..." }, "keywords": "..." }
        },
        "algorithm_strategies": {
          "tiktok": { "posting_strategy": { "best_time": "..." } },
          "instagram": { "posting_strategy": { "best_time": "..." } },
          "youtube": { "posting_strategy": { "best_time": "..." } }
        },
        "viral_examples": [ { "title": "...", "url": "..." } ],
        "engagement_tactics": {
          "comment_bait": ["..."],
          "share_triggers": ["..."],
          "follow_hooks": ["..."]
        }
      }`;

      const aiResponse = await generateWithWebSearch({
        system: 'Output ONLY valid JSON.',
        prompt,
      });

      const raw = aiResponse.text || '{}';
      let packageData: any = {};
      try { packageData = JSON.parse(raw); } catch (_) {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) { try { packageData = JSON.parse(jsonMatch[0]); } catch (_) {} }
      }

      return NextResponse.json({
        success: true,
        topic,
        ...packageData,
        posting_plan: {
            tiktok: {
                best_time: packageData.algorithm_strategies?.tiktok?.posting_strategy?.best_time || '6:30-7:30 PM (weekdays)',
                frequency: '2-4 times per day',
                hashtags: packageData.seo_packages?.tiktok?.hashtags?.hashtag_string || '',
                first_hour_actions: ['Reply to ALL comments', 'Engage with similar content', 'Share to Instagram simultaneously']
            },
            instagram: {
                best_time: packageData.algorithm_strategies?.instagram?.posting_strategy?.best_time || '7:00-9:00 PM (weekdays)',
                frequency: '1-2 Reels per day',
                hashtags: packageData.seo_packages?.instagram?.hashtags?.hashtag_string || '',
                first_hour_actions: ['Share to Stories with poll', 'DM close friends to engage', 'Reply to all comments']
            },
            youtube: {
                best_time: packageData.algorithm_strategies?.youtube?.posting_strategy?.best_time || '2:00-4:00 PM (weekends)',
                frequency: '3-5 Shorts per week',
                optimization: {
                    title: packageData.seo_packages?.youtube?.title || '',
                    description: 'First 2 lines critical, include keywords',
                    thumbnail: 'Bold text, high contrast, face if possible'
                }
            }
        },
        success_metrics: {
            track_these: ['Completion rate (aim for >50%)', 'Engagement rate in first hour', 'Share rate (shares are gold)', 'Follower conversion rate'],
            benchmarks: {
                viral: '>100K views in 48 hours',
                successful: '>50K views',
                good: '>10K views',
                average: '5K-10K views'
            }
        }
      });
    }

    // --- VIRAL VIDEO ANALYZER FLOW ---
    if (body.action === 'analyze' || (body.url && !body.action)) {
      const { url } = body;
      if (!url) {
        return NextResponse.json({ error: 'URL is required for analysis' }, { status: 400 });
      }
      
      const platform = detectPlatform(url);
      const videoData = await scrapeVideoData(url, platform);
      const algorithmFactors = analyzeAlgorithmPerformance(videoData, platform);
      
      const aiPrompt = `
You are an elite viral content analyzer. Analyze this viral video data and explain WHY it went viral.

Data:
- Platform: ${platform}
- Hook: "${videoData.hook}"
- Caption: "${videoData.caption}"
- Duration: ${videoData.duration} seconds
- Views: ${videoData.views.toLocaleString()}
- Engagement Rate: ${(videoData.engagement_rate ?? 0).toFixed(1)}%
- Likes: ${videoData.likes.toLocaleString()}
- Comments: ${videoData.comments.toLocaleString()}
- Shares: ${videoData.shares.toLocaleString()}
- Hashtags: ${videoData.hashtags.join(', ')}

Return ONLY valid JSON with this exact structure:
{
  "hook_analysis": {
    "pattern_used": "Name of pattern",
    "psychological_trigger": "Trigger name",
    "why_effective": "Explanation",
    "gpt_analysis": "Detailed hook analysis paragraph"
  },
  "content_structure": {
    "duration_category": "Short/Medium/Long",
    "pacing": "Fast/Slow",
    "value_delivery": "Explanation",
    "structure_analysis": "Detailed structure analysis paragraph"
  },
  "why_it_worked": "Comprehensive explanation of why it went viral, algorithm alignment, and timing.",
  "how_to_replicate": {
    "hook_formula": "Template to follow",
    "content_structure": "How to organize",
    "optimization_tips": ["tip1", "tip2", "tip3"],
    "engagement_tactics": ["tactic1", "tactic2"]
  }
}
`;
      const aiResponse = await generateWithWebSearch({
        system: 'You are an elite viral content strategist. Output ONLY valid JSON — no markdown.',
        prompt: aiPrompt,
      });

      const raw = aiResponse.text || '{}';
      let aiData: any = {};
      try { aiData = JSON.parse(raw); } catch (_) {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) { try { aiData = JSON.parse(jsonMatch[0]); } catch (_) {} }
      }

      // Reusing the same scoring logic
      const viralScore = calculateViralScore(
        [{ text: videoData.hook, score: 90 }],
        videoData.hashtags,
        { style: 'viral', trendingSignals: ['yes'] },
        platform,
        []
      );

      return NextResponse.json({
        basic_metrics: videoData,
        hook_analysis: aiData.hook_analysis || {},
        content_structure: aiData.content_structure || {},
        engagement_drivers: {
          engagement_rate: videoData.engagement_rate,
          likes: videoData.likes,
          comments: videoData.comments,
          shares: videoData.shares
        },
        algorithm_factors: algorithmFactors,
        viral_score: viralScore,
        why_it_worked: aiData.why_it_worked || "",
        how_to_replicate: aiData.how_to_replicate || {},
        generatedAt: new Date().toISOString(),
      });
    }

    // --- SCRIPT GENERATION FLOW ---
    if (body.action === 'generate_script') {
      const { topic, platform = 'tiktok', duration = 15, style = 'educational', niche = 'general' } = body;

      if (!topic) {
        return NextResponse.json({ error: 'topic is required' }, { status: 400 });
      }

      const prompt = `
You are a VIRAL CONTENT STRATEGIST who has created 100+ videos with 1M+ views each.

TASK: Create a COMPLETE viral video script for ${platform}.

CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topic: ${topic}
Platform: ${platform}
Duration: ${duration} seconds
Style: ${style}
Niche: ${niche}

CREATE A COMPLETE SCRIPT WITH:

1. HOOK (First 1-3 seconds)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Create 5 DIFFERENT hook options, each using a different viral pattern:
   
   For each hook provide:
   - The exact hook line
   - Visual direction (what to show)
   - Why it works (psychological trigger)
   - Predicted effectiveness score (1-100)
   - Which viral pattern it uses
   
   Make them ATTENTION-GRABBING. People scroll past in 0.3 seconds.

2. OPENING (Seconds 3-5)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   - Transition from hook
   - Set up the value proposition
   - Keep attention locked
   
   Include:
   - Exact words to say
   - What to show visually
   - Text overlays to add

3. BODY (Middle section)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Break into segments (every 3-5 seconds):
   
   Segment 1:
   - Timestamp: [X-Y seconds]
   - Voiceover script
   - Visual direction
   - Text overlay
   - Why this segment matters
   
   Keep it FAST-PACED. No dead moments.

4. CLIMAX/PAYOFF (Last 5 seconds before CTA)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   - Deliver the main value/transformation/answer
   - Create "aha moment"
   - Make it shareable
   
   Include:
   - Exact script
   - Visual payoff
   - Text overlay for impact

5. CALL-TO-ACTION (Last 2-3 seconds)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   - Drive engagement (comment, like, follow, share)
   - Make it natural, not forced
   
   Provide:
   - 3 different CTA options
   - Why each works
   - Expected engagement boost

6. VISUAL STORYBOARD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Shot-by-shot breakdown:
   
   Shot 1: [0:00-0:02]
   - Camera angle: [e.g., "close-up face"]
   - Action: [what's happening]
   - Text on screen: [overlay text]
   
   (Continue for all shots)

7. EDITING NOTES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   - Pacing: [cuts per second]
   - Transitions: [what type]
   - Effects: [any special effects]
   - Text style: [font, color, animation]
   - Music/audio: [type of audio needed]

8. CAPTION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Platform-optimized caption:
   - Hook in first line
   - Body (value/context)
   - CTA
   - Hashtags (optimized for ${platform})
   
   Keep it ${platform}-appropriate length.

9. WHY THIS WILL GO VIRAL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Explain the strategy:
   - Algorithm factors this hits
   - Psychological triggers used
   - Trend alignment
   - Expected performance

Base everything on PROVEN viral patterns, not theory.

Return as a structured JSON with keys:
- hooks (array of 5 hook options: {text, visual, why, score, pattern})
- opening (object: {script, visual, text_overlay})
- body_segments (array: {timestamp, script, visual, text_overlay, why_matters})
- climax (object: {script, visual, text_overlay})
- cta_options (array of 3: {text, why, engagement_boost})
- visual_storyboard (array of shots: {timestamp, camera, action, text})
- editing_notes (object: {pacing, transitions, effects, text_style, music})
- caption (object: {hook, body, cta, hashtags})
- explanation (object: {algorithm_factors, psychological_triggers, trend_alignment, expected_performance})
`;

      const aiResponse = await generateWithWebSearch({
        system: 'You are an elite viral content strategist. Every script you create has gone viral. You understand platform algorithms deeply and know exactly what makes content spread. Output ONLY valid JSON.',
        prompt,
      });

      const raw = aiResponse.text || '{}';
      let scriptData: any = {};
      try { scriptData = JSON.parse(raw); } catch (_) {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) { try { scriptData = JSON.parse(jsonMatch[0]); } catch (_) {} }
      }
      
      // Calculate viral score prediction
      let score = 0;
      let breakdown: any = {};
      
      if (scriptData.hooks && scriptData.hooks.length > 0) {
        const hookScore = scriptData.hooks[0].score || 50;
        score += Math.min(40, hookScore * 0.4);
        breakdown.hook_quality = hookScore;
      }
      
      if (scriptData.body_segments) {
        const numSegments = scriptData.body_segments.length;
        if (numSegments >= 3 && numSegments <= 6) {
          score += 20;
          breakdown.structure = 100;
        } else {
          score += 10;
          breakdown.structure = 50;
        }
      }
      
      if (scriptData.cta_options && scriptData.cta_options.length > 0) {
        score += 15;
        breakdown.cta = 100;
      }
      
      // Add platform optimization and pattern usage base scores
      score += 100 * 0.15; // Placeholder for platform optimization
      breakdown.platform_optimization = 100;
      
      score += 100 * 0.1; // Placeholder for pattern usage
      breakdown.pattern_usage = 100;

      const overall_score = Math.round(score);
      let prediction = "";
      if (overall_score >= 85) {
          prediction = "🔥 VERY HIGH - This has all elements of viral content. Expect 100K+ views.";
      } else if (overall_score >= 70) {
          prediction = "🚀 HIGH - Strong viral potential. Likely 50K+ views.";
      } else if (overall_score >= 55) {
          prediction = "📈 MODERATE - Good foundation. Expect 10K-50K views.";
      } else {
          prediction = "💡 NEEDS WORK - Improve hook and structure for better results.";
      }

      scriptData.predicted_viral_score = {
        overall_score,
        breakdown,
        prediction
      };
      
      scriptData.generatedAt = new Date().toISOString();

      return NextResponse.json(scriptData);
    }

    // --- CONTENT REPURPOSING FLOW ---
    if (body.action === 'repurpose' || body.action === 'quick_repurpose') {
      let content = body.content;
      let target_platforms = body.target_platforms || 'all';
      if (target_platforms === 'all') {
        target_platforms = ['tiktok', 'instagram', 'youtube_shorts', 'twitter', 'linkedin'];
      } else if (!Array.isArray(target_platforms)) {
        target_platforms = [target_platforms];
      }

      let formats = body.formats || 'all';
      if (formats === 'all') {
        formats = ['carousel_post', 'thread', 'blog_post', 'email_newsletter', 'infographic', 'text_post', 'podcast_script', 'quote_graphics'];
      } else if (!Array.isArray(formats)) {
        formats = [formats];
      }

      if (body.action === 'quick_repurpose' || body.url) {
        if (!body.url) {
          return NextResponse.json({ error: 'url is required for quick_repurpose' }, { status: 400 });
        }
        const platform = detectPlatform(body.url);
        const videoData = await scrapeVideoData(body.url, platform);
        
        content = {
          caption: videoData.caption,
          hook: videoData.hook,
          script: '', // We don't have full transcript from basic scrape
        };
      }

      if (!content || (!content.caption && !content.script && !content.hook)) {
        return NextResponse.json({ error: 'content object with at least a caption is required, or provide a url' }, { status: 400 });
      }

      const systemPrompt = `You are an elite content repurposing engine. Your task is to take a single piece of content and adapt it natively for multiple platforms and formats. Return ONLY valid JSON.`;
      
      const userPrompt = `
REPURPOSE this content:
CAPTION: ${content.caption || ''}
HOOK: ${content.hook || ''}
SCRIPT: ${content.script || ''}

Target Platforms: ${target_platforms.join(', ')}
Target Formats: ${formats.join(', ')}

Platform Requirements:
- tiktok: 2200 chars max, casual/trendy, short duration, hashtag count 3-5
- instagram: 2200 chars max, aesthetic/aspirational, hashtag count 8-12
- youtube_shorts: 5000 chars max, engaging/informative, hashtag count 3-5
- twitter: 280 chars max, witty/conversational, text hook, 1-2 hashtags
- linkedin: 3000 chars max, professional/valuable, educational angle, 3-5 hashtags

Format Requirements:
- carousel_post: 10 slides (hook, main points, summary, CTA). Provide headline, body, and visual suggestion for each.
- thread: Twitter thread (8-12 tweets). First tweet is hook. Under 280 chars per tweet.
- blog_post: SEO-optimized title, intro, 3-5 sections, conclusion.
- email_newsletter: Subject line, preview text, body, CTA.
- infographic: Visual layout description, key stats, actionable takeaways.
- text_post: Text only post for LinkedIn/Facebook, strong text hook, engaging formatting.
- podcast_script: Intro, 3 discussion points, outro, call to action.
- quote_graphics: 3 short, punchy, shareable quotes extracted from the content.

Output a JSON object with this exact structure:
{
  "platforms": {
    "[platform_name]": {
      "caption": "Optimized caption with hashtags",
      "hook": "Platform specific hook",
      "hashtags": ["tag1", "tag2"],
      "video_adaptation": "pacing and edit suggestions",
      "posting_strategy": "tips for this platform"
    }
  },
  "variations": {
    "carousel_post": [ { "slide": 1, "headline": "...", "body": "...", "visual": "..." } ],
    "thread": [ "tweet 1", "tweet 2" ],
    "blog_post": { "title": "...", "outline": ["intro", "section 1", "conclusion"], "target_keywords": ["kw1", "kw2"] },
    "email_newsletter": { "subject": "...", "preview": "...", "body": "...", "cta": "..." },
    "infographic": { "title": "...", "sections": [ { "heading": "...", "visual_idea": "...", "data_points": ["..."] } ] },
    "text_post": "...",
    "podcast_script": { "title": "...", "sections": [ { "segment": "...", "talking_points": ["..."] } ] },
    "quote_graphics": [ "quote 1", "quote 2", "quote 3" ]
  }
}
`;

      const aiResponse = await generateWithWebSearch({
        system: systemPrompt,
        prompt: userPrompt,
      });

      const raw = aiResponse.text || '{}';
      let repurposedData: any = {};
      try { repurposedData = JSON.parse(raw); } catch (_) {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) { try { repurposedData = JSON.parse(jsonMatch[0]); } catch (_) {} }
      }

      repurposedData.generatedAt = new Date().toISOString();
      if (body.url) repurposedData.original_url = body.url;
      repurposedData.original_content = content;

      return NextResponse.json(repurposedData);
    }

    // --- SEO OPTIMIZER FLOW ---
    if (body.action === 'optimize_seo') {
      const { content, platform = 'youtube', niche = 'general', competitor_url } = body;

      if (!content && !competitor_url) {
        return NextResponse.json({ error: 'content object or competitor_url is required' }, { status: 400 });
      }

      let competitorData: any = null;
      if (competitor_url) {
        const compPlatform = detectPlatform(competitor_url);
        competitorData = await scrapeVideoData(competitor_url, compPlatform);
      }

      const systemPrompt = `You are an elite SEO and Hashtag Optimizer for social media platforms. Output ONLY valid JSON.`;

      const userPrompt = `
PERFORM COMPLETE SEO OPTIMIZATION for ${platform.toUpperCase()}.

Content Context: ${content?.caption || content?.topic || 'N/A'}
Niche: ${niche}
${competitorData ? `\nCOMPETITOR DATA TO ANALYZE AND BEAT:\nTitle/Caption: ${competitorData.caption}\nHashtags: ${competitorData.hashtags.join(', ')}\nViews: ${competitorData.views}\nEngagement Rate: ${competitorData.engagement_rate}%` : ''}

PLATFORM TITLE REQUIREMENTS (${platform}):
- YouTube: 60-70 chars optimal, main keyword early, power words.
- TikTok: 20-40 chars optimal, hook-focused, conversational.
- Instagram: 125 chars optimal for first line, line breaks, emojis.

TITLE FORMULAS THAT WORK:
1. "How to [GOAL] in [TIMEFRAME] ([SPECIFIC RESULT])"
2. "[NUMBER] [TOPIC] That Will [BENEFIT]"
3. "I [DID X] for [Y TIME]. Here's What Happened"
4. "The [ADJECTIVE] Guide to [TOPIC] ([YEAR])"
5. "[TOPIC]: What [AUTHORITY] Won't Tell You"

Required JSON Output Structure:
{
  "title": [
    { "title": "...", "char_count": 50, "keywords_included": ["..."], "ctr_prediction": 85, "why_it_works": "..." }
  ], // Provide exactly 10 optimized titles ranked by CTR prediction
  "description": "Optimized description (100-500 chars), with CTA and spacing",
  "hashtags": {
    "trending": [{"tag": "...", "post_count": "10M", "why_include": "..."}], // 3 tags
    "niche": [{"tag": "...", "post_count": "500K", "why_include": "..."}], // 5 tags
    "broad": [{"tag": "...", "post_count": "50M", "why_include": "..."}], // 2-3 tags
    "hashtag_string": "#tag1 #tag2 ...",
    "placement_strategy": "caption vs comments"
  },
  "keywords": {
    "primary": { "phrase": "...", "search_volume": "High", "competition": "Medium", "where_to_include": "..." },
    "secondary": [ { "phrase": "...", "search_volume": "...", "competition": "..." } ], // 3-5 keywords
    "lsi": [ { "phrase": "...", "search_volume": "...", "competition": "..." } ] // 5-7 keywords
  },
  "thumbnail_text": ["text 1", "text 2", "text 3"], // Only if platform is youtube, else empty array
  "competitor_analysis": ${competitorData ? `{ "what_works": ["..."], "opportunities": ["..."], "how_to_beat": "..." }` : `null`}
}
`;

      const aiResponse = await generateWithWebSearch({
        system: systemPrompt,
        prompt: userPrompt,
      });

      const raw = aiResponse.text || '{}';
      let seoData: any = {};
      try { seoData = JSON.parse(raw); } catch (_) {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) { try { seoData = JSON.parse(jsonMatch[0]); } catch (_) {} }
      }

      // Calculate SEO Score
      let seo_score = 0;

      if (seoData.title && seoData.title.length > 0) {
        const bestCtr = seoData.title[0].ctr_prediction || 50;
        seo_score += Math.min(30, bestCtr * 0.3);
      }

      if (seoData.hashtags) {
        const hasTrending = (seoData.hashtags.trending?.length || 0) > 0;
        const hasNiche = (seoData.hashtags.niche?.length || 0) > 0;
        const hasBroad = (seoData.hashtags.broad?.length || 0) > 0;
        if (hasTrending && hasNiche && hasBroad) seo_score += 30;
        else if (hasTrending || hasNiche) seo_score += 20;
        else seo_score += 10;
      }

      if (seoData.keywords) {
        const hasPrimary = !!seoData.keywords.primary;
        const hasSecondary = (seoData.keywords.secondary?.length || 0) > 0;
        const hasLsi = (seoData.keywords.lsi?.length || 0) > 0;
        if (hasPrimary && hasSecondary && hasLsi) seo_score += 25;
        else if (hasPrimary && hasSecondary) seo_score += 18;
        else if (hasPrimary) seo_score += 12;
      }

      if (seoData.description) {
        const len = seoData.description.length;
        if (len > 100 && len < 500) seo_score += 15;
        else seo_score += 8;
      }

      seoData.seo_score = Math.round(seo_score);
      seoData.generatedAt = new Date().toISOString();

      return NextResponse.json(seoData);
    }

    // --- ALGORITHM CRACKER FLOWS ---
    if (body.action === 'detect_state') {
      const { postData, platform = 'tiktok' } = body;
      if (!postData) return NextResponse.json({ error: 'postData is required' }, { status: 400 });
      const state = algorithmCracker.detectCurrentState(postData as PostData, platform);
      return NextResponse.json({ success: true, state });
    }

    if (body.action === 'shadow_metrics') {
      const { postData, platform = 'tiktok' } = body;
      if (!postData) return NextResponse.json({ error: 'postData is required' }, { status: 400 });
      const metrics = await algorithmCracker.calculateShadowMetrics(postData as PostData, platform);
      return NextResponse.json({ success: true, metrics });
    }

    if (body.action === 'golden_window') {
      const { postTime, platform = 'tiktok', userData = {} } = body;
      if (!postTime) return NextResponse.json({ error: 'postTime is required' }, { status: 400 });
      const plan = algorithmCracker.createGoldenWindowPlan(postTime, platform, userData);
      return NextResponse.json({ success: true, plan });
    }

    if (body.action === 'analyze_trinity') {
      const { videoData, platform = 'tiktok' } = body;
      if (!videoData) return NextResponse.json({ error: 'videoData is required' }, { status: 400 });
      const analysis = await algorithmCracker.analyzeTrinity(videoData as PostData, platform);
      return NextResponse.json({ success: true, analysis });
    }

    if (body.action === 'batch_variations') {
      const { coreIdea, count = 5 } = body;
      if (!coreIdea) return NextResponse.json({ error: 'coreIdea is required' }, { status: 400 });
      const variations = await algorithmCracker.generateBatchVariations(coreIdea, count);
      return NextResponse.json({ success: true, ...variations });
    }

    // --- ORIGINAL CONTENT GENERATION FLOW ---
    const { topic, platform, niche, vibe, brand_voice = 'casual', followers = 1000 } = body;

    if (!topic || !platform) {
      return NextResponse.json({ error: 'topic and platform are required' }, { status: 400 });
    }

    const patternsList = UNIVERSAL_PATTERNS
      .map((p, i) => `${i + 1}. "${p.template}" [${p.trigger}] score:${p.score}`)
      .join('\n');

    const systemPrompt = `You are an elite viral content strategist. You have analysed 100K+ viral posts across 40+ niches. Output ONLY valid JSON — no markdown, no code fences.`;

    const userPrompt = `Create a viral content package.
TOPIC: "${topic}" | PLATFORM: ${platform} | NICHE: ${niche || 'general'} | TYPE: ${vibe || 'engaging'} | VOICE: ${brand_voice}

UNIVERSAL PATTERNS — use these as your hook framework:
${patternsList}

CROSS-NICHE TASK: provide 3 examples of how OTHER niches approach "${topic}" virally — for cross-pollination.

Return this exact JSON (no extra keys):
{
  "caption": "ready-to-post caption, 150-220 chars, emojis, voice:${brand_voice}",
  "script": "A 5-6 part slide-by-slide script for carousels OR scene-by-scene for reels. Use 'Slide 1: ... \\nSlide 2: ...' format.",
  "hooks": [
    {"text":"hook1","score":92,"pattern":"Contrarian","why":"why it works"},
    {"text":"hook2","score":88,"pattern":"Curiosity Gap","why":"why it works"},
    {"text":"hook3","score":85,"pattern":"Social Proof","why":"why it works"},
    {"text":"hook4","score":81,"pattern":"POV","why":"why it works"},
    {"text":"hook5","score":78,"pattern":"Pain Point","why":"why it works"}
  ],
  "hashtags": {
    "trending": ["tag1","tag2","tag3"],
    "niche": ["tag4","tag5","tag6"],
    "broad": ["tag7","tag8"],
    "all": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8"]
  },
  "format": {
    "style": "format name",
    "length": "15-25 seconds",
    "shots": ["shot1","shot2","shot3","shot4"],
    "editTips": ["tip1","tip2","tip3"],
    "whyItWorks": "data-backed reason",
    "trendingSignals": ["signal1","signal2"]
  },
  "audio": {"primary":"name","primaryUses":"45K","alternative":"name","audioReason":"why"},
  "trendingElements": ["el1","el2","el3"],
  "crossNicheInsights": [
    {"niche":"Business","approach":"how they frame it","views":"2.3M","lesson":"what to steal"},
    {"niche":"Lifestyle","approach":"how they frame it","views":"1.8M","lesson":"what to steal"},
    {"niche":"Comedy","approach":"how they frame it","views":"4.1M","lesson":"what to steal"}
  ],
  "adaptationGuide": {
    "tiktok": "tiktok-specific changes",
    "instagram": "instagram-specific changes",
    "youtube": "youtube-specific changes",
    "keepForAll": "what stays the same"
  },
  "opportunityAnalysis": {
    "score": 78,
    "verdict": "High Opportunity",
    "reason": "why this topic/niche combo is strong right now",
    "saturation": "medium",
    "growthRate": "+34% this week",
    "recommendation": "one actionable sentence"
  }
}`;

    const aiResponse = await generateWithWebSearch({
      system: systemPrompt,
      prompt: userPrompt,
    });

    const raw = aiResponse.text || '{}';
    let aiData: any = {};
    try { aiData = JSON.parse(raw); } catch (_) {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) { try { aiData = JSON.parse(jsonMatch[0]); } catch (_) {} }
    }

    // Normalise hashtags — support flat array (old) or object (new)
    const hashtagsAll: string[] = Array.isArray(aiData.hashtags)
      ? aiData.hashtags
      : (aiData.hashtags?.all || []);

    const viralScore = calculateViralScore(
      aiData.hooks || [],
      hashtagsAll,
      aiData.format || {},
      platform,
      aiData.crossNicheInsights || [],
    );

    const predictions = predictViews(viralScore, platform);
    const timing = getPostingStrategy(platform);

    return NextResponse.json({
      ...aiData,
      // Always return hashtags as object for UI consistency
      hashtags: Array.isArray(aiData.hashtags)
        ? { all: aiData.hashtags, trending: [], niche: [], broad: [] }
        : aiData.hashtags,
      viralScore,
      predictions,
      timing,
      platform,
      topic,
      niche,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('ViralForge generate error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
