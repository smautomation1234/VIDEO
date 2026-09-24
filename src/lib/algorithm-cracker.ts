import { generateWithWebSearch } from '@/lib/ai';


export interface PostData {
  posted_at: Date | string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  duration?: number;
  avg_watch_time?: number;
  completions?: number;
  profile_visits?: number;
  new_followers?: number;
  unique_viewers?: number;
  saves?: number;
  comment_texts?: string[];
  avg_session_time_after?: number;
  retention_graph?: number[];
  cut_count?: number;
  visual_variety_score?: number;
  has_progressive_text_reveals?: boolean;
  has_progress_indicator?: boolean;
  has_setup_payoff_rhythm?: boolean;
  transcript?: string;
  first_frame_description?: string;
  last_frame_description?: string;
  has_visual_movement?: boolean;
  has_text_overlay_opening?: boolean;
  has_audio_hook?: boolean;
  has_expressive_face?: boolean;
}

export interface UserData {
  top_engaged_followers?: string[];
}

export class AlgorithmCracker {
  private platforms: Record<string, PlatformAlgorithm>;

  constructor() {
    this.platforms = {
      tiktok: new TikTokAlgorithm(),
      instagram: new InstagramAlgorithm(),
      youtube: new YouTubeAlgorithm(),
      twitter: new TwitterAlgorithm(),
      linkedin: new LinkedInAlgorithm()
    };
  }

  // CORE FEATURE 1: Real-Time State Detection
  public detectCurrentState(postData: PostData, platform: string) {
    const timeSincePost = (new Date().getTime() - new Date(postData.posted_at).getTime()) / 60000;
    const views = postData.views;
    const engagement = postData.likes + postData.comments + postData.shares;

    const platformAlgo = this.platforms[platform.toLowerCase()] || this.platforms['tiktok'];
    const engagementVelocity = engagement / Math.max(timeSincePost, 1);

    if (timeSincePost < 60) {
      return this._analyzeTestingPhase(postData, platformAlgo, engagementVelocity);
    } else if (timeSincePost < 720) {
      return this._analyzeSmallBatchPhase(postData, platformAlgo, engagementVelocity);
    } else if (timeSincePost < 2880) {
      return { current_state: "VIRAL_OR_PLATEAU", time_in_state: timeSincePost, metrics: { engagementVelocity } };
    } else {
      return { current_state: "DECAY", time_in_state: timeSincePost, metrics: { engagementVelocity } };
    }
  }

  private _analyzeTestingPhase(postData: PostData, algo: PlatformAlgorithm, velocity: number) {
    const thresholds = algo.getTestingThresholds();
    const watchTimeRate = (postData.avg_watch_time || 0) / (postData.duration || 1);
    const completionRate = (postData.completions || 0) / Math.max(postData.views, 1);

    let score = 0;
    const issues: string[] = [];
    const actions: string[] = [];

    if (watchTimeRate >= thresholds.watch_time_threshold) score += 30;
    else {
      issues.push(`Watch time only ${(watchTimeRate * 100).toFixed(1)}%, need ${(thresholds.watch_time_threshold * 100).toFixed(1)}%`);
      actions.push("❌ Hook is weak - people dropping off early");
    }

    if (completionRate >= thresholds.completion_threshold) score += 30;
    else {
      issues.push(`Completion rate ${(completionRate * 100).toFixed(1)}%, need ${(thresholds.completion_threshold * 100).toFixed(1)}%`);
      actions.push("❌ Video too long or boring - cut 30%");
    }

    if (velocity >= thresholds.velocity_threshold) score += 40;
    else {
      issues.push(`Engagement velocity ${velocity.toFixed(1)}/min, need ${thresholds.velocity_threshold.toFixed(1)}/min`);
      actions.push("🚨 URGENT: Boost engagement NOW - reply all comments, share to story, activate pods");
    }

    let probability = 0.1;
    let status = "❌ FAILING - Post will likely die unless immediate action";
    if (score >= 80) { probability = 0.9; status = "🚀 PASSING - Will likely push to more users"; }
    else if (score >= 50) { probability = 0.5; status = "⚠️ BORDERLINE - Boost engagement in next 20 mins to pass"; }

    return {
      current_state: "TESTING",
      time_in_state: Math.floor((new Date().getTime() - new Date(postData.posted_at).getTime()) / 60000),
      transition_probability: probability,
      required_actions: actions.length ? actions : ["✅ All metrics good - maintain engagement"],
      metrics: { watch_time_rate: watchTimeRate, completion_rate: completionRate, engagement_velocity: velocity, score, status }
    };
  }
  
  private _analyzeSmallBatchPhase(postData: PostData, algo: PlatformAlgorithm, velocity: number) {
     const thresholds = algo.getSmallBatchThresholds();
     const shareRate = (postData.shares) / Math.max(postData.views, 1);
     const profileVisitRate = (postData.profile_visits || 0) / Math.max(postData.views, 1);
     const followerConversion = (postData.new_followers || 0) / Math.max(postData.views, 1);

     let score = 0;
     const actions: string[] = [];

     if (shareRate >= thresholds.share_rate_threshold) score += 40;
     else actions.push(`Share rate low (${(shareRate * 100).toFixed(2)}%). Make content more shareable - add controversy or relatability`);
     
     if (profileVisitRate >= thresholds.profile_visit_threshold) score += 30;
     else actions.push("Low profile visits. Add 'more like this' CTA, or tease part 2");

     if (followerConversion >= thresholds.follower_conversion_threshold) score += 30;
     else actions.push("Follower conversion low. Add explicit follow CTA");

     let probability = 0.15;
     let status = "📊 AVERAGE - Will plateau unless shares increase";
     if (score >= 80) { probability = 0.85; status = "🔥 GOING VIRAL - Expect FYP/Explore push soon"; }
     else if (score >= 50) { probability = 0.4; status = "📈 GOOD PERFORMANCE - Might get pushed, boost signals"; }

     return {
         current_state: "SMALL_BATCH",
         time_in_state: Math.floor((new Date().getTime() - new Date(postData.posted_at).getTime()) / 60000),
         transition_probability: probability,
         required_actions: actions.length ? actions : ["✅ Performing well - let algorithm work"],
         metrics: { share_rate: shareRate, profile_visit_rate: profileVisitRate, follower_conversion: followerConversion, score, status }
     };
  }

  // CORE FEATURE 2: Shadow Metrics Tracker
  public async calculateShadowMetrics(postData: PostData, platform: string) {
      const completionBySecond = this._analyzeDropoffPoints(postData);
      const totalViews = postData.views;
      const uniqueViewers = postData.unique_viewers || (totalViews * 0.9);
      const rewatchRate = uniqueViewers > 0 ? (totalViews - uniqueViewers) / uniqueViewers : 0;
      const profileVisitRate = totalViews > 0 ? (postData.profile_visits || 0) / totalViews : 0;
      const saveToShareRatio = (postData.saves || 0) / Math.max(postData.shares, 1);
      const sentimentScore = await this._analyzeCommentSentiment(postData.comment_texts || []);
      const followerConversionVelocity = totalViews > 0 ? ((postData.new_followers || 0) / totalViews * 10000) : 0;
      
      const platformAlgo = this.platforms[platform.toLowerCase()] || this.platforms['tiktok'];
      const avgSessionAfter = postData.avg_session_time_after || 0;
      const platformAvgSession = platformAlgo.getAvgSessionTime();
      const sessionTimeImpact = platformAvgSession > 0 ? (avgSessionAfter / platformAvgSession) : 1.0;
      
      const timeMinutes = (new Date().getTime() - new Date(postData.posted_at).getTime()) / 60000;
      const totalEngagement = postData.likes + postData.comments + postData.shares;
      const engagementVelocity = totalEngagement / Math.max(timeMinutes, 1);

      return {
          completion_rate_by_second: completionBySecond,
          rewatch_rate: rewatchRate,
          profile_visit_rate: profileVisitRate,
          save_to_share_ratio: saveToShareRatio,
          comment_sentiment_score: sentimentScore,
          follower_conversion_velocity: followerConversionVelocity,
          session_time_impact: sessionTimeImpact,
          engagement_velocity: engagementVelocity
      };
  }

  private _analyzeDropoffPoints(postData: PostData) {
      const duration = postData.duration || 15;
      const retentionGraph = postData.retention_graph || [];
      if (!retentionGraph.length) {
          const estimated = [];
          for (let i = 0; i < Math.floor(duration); i++) estimated.push(Math.max(0, 100.0 - (i * 5)));
          return estimated;
      }
      return retentionGraph;
  }

  private async _analyzeCommentSentiment(comments: string[]): Promise<number> {
      if (!comments.length) return 0.0;
      const sample = comments.slice(0, 50);
      const prompt = `Analyze sentiment of these comments:\n\n${sample.slice(0, 20).join('\n')}\n\nReturn JSON: { "overall_sentiment": -1.0 to 1.0 }`;
      
      try {
          const response = await generateWithWebSearch({
              prompt,
              maxOutputTokens: 500
          });
          const result = JSON.parse(response.text || '{}');
          return result.overall_sentiment || 0.0;
      } catch (e) { return 0.0; }
  }

  // CORE FEATURE 3: Golden Window Orchestrator
  public createGoldenWindowPlan(postTime: string | Date, platform: string, userData: UserData) {
      const pt = new Date(postTime).getTime();
      const platformAlgo = this.platforms[platform.toLowerCase()] || this.platforms['tiktok'];
      
      const plan = {
          pre_post: [
              { time: new Date(pt - 10*60000).toISOString(), action: 'Send DM to top 20 engaged followers', target: (userData.top_engaged_followers || []).slice(0,20) },
              { time: new Date(pt - 10*60000).toISOString(), action: 'Alert engagement pod' },
              { time: new Date(pt - 5*60000).toISOString(), action: 'Post teaser to Story', platform }
          ],
          post_moment: [
              { time: new Date(pt).toISOString(), action: 'POST GOES LIVE', immediately_after: ['Share to Story with poll/question sticker', 'Pin your own comment asking question'] }
          ],
          first_5_min: [
              { time: new Date(pt + 5*60000).toISOString(), action: 'Reply to EVERY comment', why: 'Boosts engagement velocity score' },
              { time: new Date(pt + 5*60000).toISOString(), action: 'Check engagement velocity', benchmark: platformAlgo.get30minEngagementThreshold() }
          ],
          first_15_min: [
              { time: new Date(pt + 15*60000).toISOString(), action: 'Engagement pod coordination', ensure: '20-30 comments' }
          ],
          first_30_min: [
              { time: new Date(pt + 30*60000).toISOString(), action: 'CRITICAL CHECKPOINT', success_indicators: [`> ${platformAlgo.get30minViewThreshold()} views`] }
          ]
      };
      return plan;
  }

  // CORE FEATURE 4: Hook-Retention-Loop Analyzer
  public async analyzeTrinity(videoData: PostData, platform: string) {
      const hookAnalysis = await this._analyzeHook(videoData);
      const retentionAnalysis = this._analyzeRetention(videoData);
      const loopAnalysis = this._analyzeLoop(videoData);

      const overallScore = (hookAnalysis.score * 0.4) + (retentionAnalysis.score * 0.4) + (loopAnalysis.score * 0.2);
      const improvements: string[] = [];

      if (hookAnalysis.score < 70) improvements.push(...hookAnalysis.improvements);
      if (retentionAnalysis.score < 70) improvements.push(...retentionAnalysis.improvements);
      if (loopAnalysis.score < 70) improvements.push(...loopAnalysis.improvements);

      return { hookAnalysis, retentionAnalysis, loopAnalysis, overallScore, improvements };
  }

  private async _analyzeHook(videoData: PostData) {
      const first3Sec = (videoData.transcript || '').substring(0, 100);
      const visualDesc = videoData.first_frame_description || '';
      const hasVisualContrast = !!videoData.has_visual_movement;
      const hasTextOverlay = !!videoData.has_text_overlay_opening;
      const hasAudioSpike = !!videoData.has_audio_hook;
      const hasFacialExpression = !!videoData.has_expressive_face;

      let score = 0;
      const improvements: string[] = [];

      const hookPatterns = ['POV:', 'Nobody talks about', 'I tried', 'This changed', 'You\'re doing', 'What I wish', 'The truth about', 'Stop doing', '?'];
      const hasHookPattern = hookPatterns.some(p => first3Sec.toLowerCase().includes(p.toLowerCase()));

      if (hasHookPattern) score += 25;
      else improvements.push("❌ No proven hook pattern detected. Use: POV, Question, or Bold Statement");

      if (hasVisualContrast) score += 20;
      else improvements.push("❌ Add visual movement in first frame");

      if (hasTextOverlay) score += 20;
      else improvements.push("❌ Add text overlay in first 3 seconds with controversial/curious statement");

      if (hasAudioSpike) score += 15;
      else improvements.push("Add audio hook");

      if (hasFacialExpression) score += 20;
      else improvements.push("Start with expressive facial reaction");

      const prompt = `Analyze this video hook:\nText: ${first3Sec}\nVisual: ${visualDesc}\nRate the hook 1-100 and explain why in a short paragraph.`;
      let aiAnalysis = "";
      try {
          const response = await generateWithWebSearch({
              prompt,
              maxOutputTokens: 500
          });
          aiAnalysis = response.text || '';
      } catch (e) {}

      return { score, has_hook_pattern: hasHookPattern, ai_analysis: aiAnalysis, improvements };
  }

  private _analyzeRetention(videoData: PostData) {
      const duration = videoData.duration || 15;
      const cutCount = videoData.cut_count || 0;
      const visualVariety = videoData.visual_variety_score || 0;
      
      let score = 0;
      const improvements: string[] = [];

      const cutsPerSecond = duration > 0 ? cutCount / duration : 0;
      if (cutsPerSecond >= 0.3 && cutsPerSecond <= 0.6) score += 30;
      else if (cutsPerSecond < 0.3) improvements.push(`❌ Too slow - only ${cutsPerSecond.toFixed(2)} cuts/sec. Aim for 0.4-0.5`);
      else improvements.push(`⚠️ Too fast - ${cutsPerSecond.toFixed(2)} cuts/sec. Slow down slightly`);

      if (visualVariety > 70) score += 25;
      else improvements.push("❌ Visually repetitive. Change angle every 3-5 seconds");

      if (videoData.has_progressive_text_reveals) score += 20;
      else improvements.push("Add text overlays that reveal info progressively");

      if (videoData.has_progress_indicator) score += 15;
      else improvements.push("Add progress indicator ('Tip 2 of 5')");

      if (videoData.has_setup_payoff_rhythm) score += 30;
      else improvements.push("❌ Missing setup→payoff loops. Every 3-5 sec: tease something, then deliver it");

      return { score, cuts_per_second: cutsPerSecond, improvements };
  }

  private _analyzeLoop(videoData: PostData) {
      const last5Sec = (videoData.transcript || '').slice(-100);
      let score = 0;
      const improvements: string[] = [];

      const loopsSeamlessly = (videoData.first_frame_description && videoData.first_frame_description === videoData.last_frame_description);
      if (loopsSeamlessly) score += 40;
      else improvements.push("Consider making end frame connect to beginning for seamless loop");

      const ctaPatterns = ['comment', 'drop a', 'tag', 'share', 'save', 'follow', 'part 2', 'link in bio'];
      const hasCta = ctaPatterns.some(p => last5Sec.toLowerCase().includes(p.toLowerCase()));
      if (hasCta) score += 30;
      else improvements.push("❌ No CTA at end.");

      const rewatchTriggers = ['wait', 'did you catch', 'notice', 'see that'];
      const hasRewatchTrigger = rewatchTriggers.some(p => last5Sec.toLowerCase().includes(p.toLowerCase()));
      if (hasRewatchTrigger) score += 30;
      else improvements.push("Add rewatch trigger: 'Did you catch [detail]?'");

      return { score, has_cta: hasCta, improvements };
  }

  // CORE FEATURE 5: Batch Testing System
  public async generateBatchVariations(coreIdea: string, count: number = 5) {
      const prompt = `Generate ${count} DIFFERENT variations of this video idea:\nCore idea: ${coreIdea}\n\nFor each variation, create:\n1. Hook (different pattern each time)\n2. Opening 10 seconds (script)\n3. Why this variation will perform differently\n\nFormat as JSON array: { "variations": [ { "hook_pattern": "...", "hook": "...", "script": "...", "why": "..." } ] }`;
      
      try {
          const response = await generateWithWebSearch({
              prompt,
              maxOutputTokens: 1500
          });
          const result = JSON.parse(response.text || '{}');
          const variations = result.variations || [];
          variations.forEach((v: any, i: number) => {
              v.suggested_post_time = `Post ${i+1}: +${i*3} hours from first`;
              v.tracking_id = `variation_${i+1}`;
          });
          
          return {
              core_idea: coreIdea,
              variations,
              testing_strategy: {
                  post_schedule: 'Space 3-4 hours apart',
                  tracking: 'Monitor which hook gets best engagement in first hour',
                  decision_point: '24 hours - identify winner',
                  next_step: 'Double down on winner pattern for next 5 posts'
              }
          };
      } catch (e) {
          return { error: 'Failed to generate variations' };
      }
  }
}

class PlatformAlgorithm {
    getTestingThresholds() { return { watch_time_threshold: 0.5, completion_threshold: 0.4, velocity_threshold: 3.0 }; }
    getSmallBatchThresholds() { return { share_rate_threshold: 0.01, profile_visit_threshold: 0.05, follower_conversion_threshold: 0.003 }; }
    get30minViewThreshold() { return 300; }
    get30minEngagementThreshold() { return 5.0; }
    getAvgSessionTime() { return 30; }
}

class TikTokAlgorithm extends PlatformAlgorithm {
    getTestingThresholds() { return { watch_time_threshold: 0.65, completion_threshold: 0.50, velocity_threshold: 5.0 }; }
    getSmallBatchThresholds() { return { share_rate_threshold: 0.015, profile_visit_threshold: 0.05, follower_conversion_threshold: 0.003 }; }
    get30minViewThreshold() { return 500; }
    get30minEngagementThreshold() { return 8.0; }
    getAvgSessionTime() { return 52; }
}

class InstagramAlgorithm extends PlatformAlgorithm {
    getTestingThresholds() { return { watch_time_threshold: 0.60, completion_threshold: 0.45, velocity_threshold: 3.0 }; }
    getSmallBatchThresholds() { return { share_rate_threshold: 0.02, profile_visit_threshold: 0.08, follower_conversion_threshold: 0.005 }; }
    get30minViewThreshold() { return 300; }
    get30minEngagementThreshold() { return 6.0; }
    getAvgSessionTime() { return 28; }
}

class YouTubeAlgorithm extends PlatformAlgorithm {
    getTestingThresholds() { return { watch_time_threshold: 0.70, completion_threshold: 0.60, velocity_threshold: 4.0 }; }
    getSmallBatchThresholds() { return { share_rate_threshold: 0.01, profile_visit_threshold: 0.02, follower_conversion_threshold: 0.008 }; }
    get30minViewThreshold() { return 1000; }
    get30minEngagementThreshold() { return 7.0; }
    getAvgSessionTime() { return 40; }
}

class TwitterAlgorithm extends PlatformAlgorithm { }
class LinkedInAlgorithm extends PlatformAlgorithm { }

export const algorithmCracker = new AlgorithmCracker();
