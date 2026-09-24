import { NextResponse } from 'next/server';
import { generateWithWebSearch } from "@/lib/ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 55;

export async function POST(request: Request) {
  try {
    const { niche, mode, country = 'IN', platform = 'All' } = await request.json();
    if (!niche) return NextResponse.json({ error: 'Niche is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    // ── TRENDING NOW: Dedicated multi-source real-data handler ─────────────────
    if (mode === 'trending_now') {
      const countryCode = country.toUpperCase();
      const ceidMap: Record<string, string> = {
        'US': 'US:en', 'UK': 'GB:en', 'GB': 'GB:en',
        'CA': 'CA:en', 'AU': 'AU:en', 'IN': 'IN:en', 'ZA': 'ZA:en', 'WW': 'US:en',
      };
      const gl = countryCode === 'UK' ? 'GB' : countryCode === 'WW' ? 'US' : countryCode;
      const ceid = ceidMap[countryCode] || 'US:en';

      // Step 1: Fetch REAL headlines from 3 Google News RSS queries in parallel
      const rawSignals: { title: string; url: string; source: string }[] = [];

      const newsQueries = [niche, `${niche} trending 2025`, `${niche} viral news`];
      await Promise.all(newsQueries.map(async (q) => {
        try {
          const res = await fetch(
            `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=${gl}&ceid=${ceid}`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (!res.ok) return;
          const xml = await res.text();
          const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
          let m;
          while ((m = itemRegex.exec(xml)) !== null) {
            const body = m[1];
            const titleM = body.match(/<title>([\s\S]*?)<\/title>/i);
            const linkM = body.match(/<link>([\s\S]*?)<\/link>/i);
            const sourceM = body.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
            if (titleM && linkM) {
              const t = titleM[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
              const u = linkM[1].trim();
              const s = sourceM ? sourceM[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim() : 'Google News';
              if (t && u && !rawSignals.find(sig => sig.title === t)) {
                rawSignals.push({ title: t, url: u, source: s });
              }
            }
          }
        } catch { /* skip failed feeds */ }
      }));

      // Step 2: Fetch REAL Reddit hot posts from niche-matched subreddits
      const nicheLower = niche.toLowerCase();
      let subreddits = ['Entrepreneur', 'business'];
      if (nicheLower.includes('real estate') || nicheLower.includes('realestate')) subreddits = ['realestate', 'REBubble', 'personalfinance'];
      else if (nicheLower.includes('crypto') || nicheLower.includes('bitcoin')) subreddits = ['CryptoCurrency', 'Bitcoin', 'ethereum'];
      else if (nicheLower.includes('finance') || nicheLower.includes('investing')) subreddits = ['investing', 'stocks', 'personalfinance'];
      else if (nicheLower.includes('ai') || nicheLower.includes('artificial')) subreddits = ['artificial', 'ChatGPT', 'LocalLLaMA'];
      else if (nicheLower.includes('saas') || nicheLower.includes('startup')) subreddits = ['SaaS', 'startups', 'Entrepreneur'];
      else if (nicheLower.includes('market')) subreddits = ['marketing', 'socialmedia', 'GrowthHacking'];
      else if (nicheLower.includes('health') || nicheLower.includes('fitness')) subreddits = ['fitness', 'nutrition', 'mentalhealth'];
      else if (nicheLower.includes('ecommerce') || nicheLower.includes('e-commerce')) subreddits = ['ecommerce', 'dropship', 'FulfillmentByAmazon'];
      else if (nicheLower.includes('leadership') || nicheLower.includes('hr')) subreddits = ['leadership', 'management', 'humanresources'];
      else if (nicheLower.includes('content') || nicheLower.includes('creator')) subreddits = ['NewTubers', 'content_marketing', 'socialmedia'];

      await Promise.all(subreddits.slice(0, 3).map(async (sub) => {
        try {
          const res = await fetch(
            `https://www.reddit.com/r/${sub}/hot.json?limit=8`,
            { headers: { 'User-Agent': 'TrendBot/1.0' }, signal: AbortSignal.timeout(6000) }
          );
          if (!res.ok) return;
          const data = await res.json();
          data?.data?.children?.forEach((post: any) => {
            const d = post.data;
            if (d?.title && d?.ups > 30) {
              const redditUrl = `https://reddit.com${d.permalink}`;
              if (!rawSignals.find(s => s.title === d.title)) {
                rawSignals.push({ title: d.title, url: redditUrl, source: `Reddit r/${sub}` });
              }
            }
          });
        } catch { /* skip */ }
      }));

      const totalSignals = rawSignals.length;

      // Step 3: The AI model ranks ONLY the real signals (minimal hallucination)
      const signalSlice = rawSignals.slice(0, 20);
      const signalList = signalSlice
        .map((s, i) => `[${i + 1}] "${s.title}" — Source: ${s.source} — URL: ${s.url}`)
        .join('\n');

      const trendPrompt = `Today is ${today}. You are a social media trend analyst.

Below are REAL, LIVE signals collected RIGHT NOW from Google News and Reddit about "${niche}".
These are 100% real data. Do NOT refuse or return an empty array.
Your ONLY job is to rank and annotate these real signals.

REAL SIGNALS:
${signalList || `(No signals fetched — use your best knowledge of what is trending in ${niche} right now)`}

YOU MUST select exactly 10 signals (or fewer only if fewer than 10 signals exist above). For EACH:
1. Copy the EXACT title verbatim as "headline"
2. Copy the EXACT URL verbatim as "sourceUrl" — do NOT make up URLs
3. Extract the publication/subreddit name as "sourceName"
4. Assign trendScore (7.0–9.9) based on virality potential
5. Choose best platform: LinkedIn, Twitter, Instagram, or YouTube
6. Choose hookType: Contrarian, Curiosity Gap, Data-Backed, Insider Knowledge, or Social Proof
7. Write one short sentence for whyTrending
8. Write a specific content angle (max 12 words) as contentAngle
9. urgency: "Post today" or "Post this week"
10. color: a hex color string like "#ef4444"

Return ONLY valid JSON — no markdown, no explanation:
{
  "summary": "2-sentence summary of what is trending in ${niche} right now",
  "trends": [
    {
      "id": "tr1",
      "headline": "EXACT title from the list above",
      "sourceUrl": "EXACT URL from the list above",
      "sourceName": "publication or subreddit",
      "trendScore": 9.2,
      "platform": "LinkedIn",
      "hookType": "Data-Backed",
      "whyTrending": "one sentence",
      "contentAngle": "specific post idea",
      "urgency": "Post today",
      "color": "#ef4444"
    }
  ]
}`;

      const { text: rawTrend } = await generateWithWebSearch({ prompt: trendPrompt, apiKey, maxOutputTokens: 4000 });

      let trendResult: any = {};
      try {
        trendResult = JSON.parse(rawTrend.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim());
      } catch {
        const mm = rawTrend.match(/\{[\s\S]*\}/);
        if (mm) { try { trendResult = JSON.parse(mm[0]); } catch {} }
      }

      // ── Fallback: if the model returned 0 trends, build cards directly from raw signals ──
      if (!trendResult.trends || trendResult.trends.length === 0) {
        const HOOK_TYPES = ['Data-Backed', 'Curiosity Gap', 'Contrarian', 'Insider Knowledge', 'Social Proof'];
        const PLATFORMS = ['LinkedIn', 'Twitter', 'Instagram', 'YouTube'];
        const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
        trendResult.trends = signalSlice.slice(0, 10).map((s, i) => ({
          id: `tr${i + 1}`,
          headline: s.title,
          sourceUrl: s.url,
          sourceName: s.source,
          trendScore: parseFloat((9.5 - i * 0.15).toFixed(1)),
          platform: PLATFORMS[i % PLATFORMS.length],
          hookType: HOOK_TYPES[i % HOOK_TYPES.length],
          whyTrending: `This ${niche} story is generating significant discussion across social media.`,
          contentAngle: `Create a post breaking down this ${niche} update for your audience.`,
          urgency: i < 5 ? 'Post today' : 'Post this week',
          color: COLORS[i % COLORS.length],
        }));
        trendResult.summary = trendResult.summary || `Real-time trending signals for ${niche} scraped from Google News and Reddit. These are the most discussed topics right now — post while they're hot.`;
      }

      return NextResponse.json({
        ...trendResult,
        rawSignalCount: totalSignals,
        citations: rawSignals.slice(0, 25).map(s => ({ title: s.title, url: s.url, source: s.source })),
        niche,
        mode: 'trending_now',
        isRealData: true,
        generatedAt: new Date().toISOString(),
      });
    }
    // ── END TRENDING NOW ───────────────────────────────────────────────────────

    // ── Other modes: Google News RSS + Reddit grounding + Google News RSS + Reddit grounding + AI structuring
    let liveContext = '';
    const citations: { title: string; url: string }[] = [];
    try {
      const countryCode = country.toUpperCase();
      const ceidMap: Record<string, string> = {
        'US': 'US:en', 'UK': 'GB:en', 'GB': 'GB:en',
        'CA': 'CA:en', 'AU': 'AU:en', 'IN': 'IN:en',
        'ZA': 'ZA:en', 'WW': 'US:en'
      };
      const gl = countryCode === 'UK' ? 'GB' : (countryCode === 'WW' ? 'US' : countryCode);
      const ceid = ceidMap[countryCode] || 'US:en';

      const searchRes = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(niche)}&hl=en-US&gl=${gl}&ceid=${ceid}`);
      if (searchRes.ok) {
        const xml = await searchRes.text();
        const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/gi;
        let match;
        let count = 0;
        while ((match = itemRegex.exec(xml)) !== null && count < 15) {
          const title = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1');
          liveContext += `- ${title}\n`;
          citations.push({ title, url: match[2] });
          count++;
        }
      }
    } catch (e) {
      console.error('Failed to fetch live context');
    }

    const liveDataPrompt = liveContext ? `\n\nCRITICAL CONTEXT: Here is LIVE, real-time news data from today about "${niche}":\n${liveContext}\nUSE THIS EXACT DATA to formulate your ideas and trends.` : '';

    const prompts: Record<string, string> = {
      niche_ideas: `Today is ${today}.${liveDataPrompt}

Generate EXACTLY 10 content ideas for EACH of these 4 platforms: LinkedIn, Instagram, Twitter, and YouTube — for someone in the "${niche}" niche, targeting the ${country} market. That is 40 ideas total.
${platform !== 'All' ? `CRITICAL: Generate ALL 40 ideas specifically for ${platform}.` : 'Distribute ideas evenly: 10 per platform.'}

Each idea must be unique, based on current real-world trends, and actionable TODAY.

Return ONLY a valid JSON object:
{
  "summary": "2-sentence summary of the content opportunity in this niche right now",
  "ideas": [
    {
      "id": "i1",
      "title": "Punchy content idea title (max 12 words)",
      "format": "Reel or Carousel or LinkedIn Post or Twitter Thread or YouTube Short",
      "hook": "Opening line or hook for this content (max 20 words)",
      "angle": "The unique angle that makes this stand out",
      "whyItWorks": "One sentence: why this will perform well",
      "difficulty": "Easy or Medium or Hard",
      "estimatedReach": "e.g. 10K-50K",
      "platform": "LinkedIn or Instagram or Twitter or YouTube",
      "category": "Educational or Entertaining or Inspiring or Controversial or How-To",
      "color": "#hex"
    }
  ],
  "topFormats": [
    { "format": "Reels", "avgViews": "45K", "reason": "Why this format wins" }
  ]
}`,

      top_creators: `Today is ${today}.${liveDataPrompt}

Based on current trends, find EXACTLY 10 REAL, SPECIFIC content creators in the "${niche}" niche (focusing on the ${country} market) who are growing the fastest RIGHT NOW in 2025.
${platform !== 'All' ? `CRITICAL: You MUST ONLY select creators who are primarily known for their content on ${platform}.` : ''}

CRITICAL INSTRUCTION: You MUST use REAL, existing human creators. DO NOT use generic, made-up placeholder names. DO NOT hallucinate. Do not just use American examples if the country is not US.
YOU MUST RETURN EXACTLY 10 CREATORS. EACH MUST HAVE EXACTLY 5 PIECES OF CONTENT (VIDEOS OR POSTS).
CRITICAL: Keep all descriptions, styles, and titles EXTREMELY short (max 5 words). Do not write long paragraphs, or your response will be cut off!

For each real creator, find:
- Their exact name or channel name
- Their content style and what makes them unique
- Their best-performing content types
- What ideas you can ethically "steal and spin" from them
- A list of exactly 5 of their most popular videos/posts

Return ONLY a valid JSON object:
{
  "summary": "2-sentence overview of the creator landscape in ${niche}",
  "creators": [
    {
      "id": "c1",
      "name": "Real Creator Name",
      "username": "their exact @handle (e.g. mkbhd)",
      "platform": "LinkedIn or Instagram or YouTube or Twitter",
      "followers": "e.g. 245K",
      "niche": "${niche}",
      "contentStyle": "How they create content (e.g. 'Educational carousels with data')",
      "bestPerforming": "Their top content format and topic",
      "stealAndSpin": "A specific idea you can take from their style and make your own",
      "growthRate": "e.g. +12K/month",
      "color": "#hex",
      "topVideos": [
        {
          "title": "Exact real title of their most popular video/post",
          "views": "e.g. 1.2M Views",
          "date": "e.g. 2 months ago"
        }
      ]
    }
  ],
  "patterns": ["Common pattern 1", "Common pattern 2", "Common pattern 3"]
}`,

      competitor_gap: `Today is ${today}.${liveDataPrompt}

You are an elite competitive intelligence analyst.
Analyze the following competitors in the social media space:
"${niche}" (treat this input as a list of competitors).

Find EXACTLY 10 ranked content opportunities/gaps that these competitors are MISSING or NOT covering well, but their audience wants.
Provide your output as a ranked list.

Return ONLY a valid JSON object:
{
  "summary": "2-sentence analysis of these competitors and where they are weak",
  "ideas": [
    {
      "id": "cg1",
      "title": "Content gap idea title (max 12 words)",
      "format": "Format to use",
      "hook": "Why the competitors are missing this",
      "angle": "Your unique angle to steal their audience",
      "whyItWorks": "Why this gap exists and how you fill it",
      "difficulty": "Easy or Medium or Hard",
      "estimatedReach": "Opportunity size",
      "platform": "Best platform to attack this gap",
      "category": "Competitor Gap",
      "color": "#f59e0b"
    }
  ],
  "topFormats": []
}`,

      evergreen_vs_trending: `Today is ${today}.${liveDataPrompt}

You are a content strategist.
Classify the following list of topics/ideas into "Trending" (Post This Week) vs "Evergreen" (Add to Calendar).
List of topics: "${niche}"

For EACH topic, classify it and explain why. Then provide a specific title and hook.

Return ONLY a valid JSON object:
{
  "summary": "2-sentence summary of the balance between trending and evergreen topics in this list",
  "ideas": [
    {
      "id": "et1",
      "title": "The exact topic or a better title for it",
      "format": "Trending or Evergreen",
      "hook": "Specific hook to use",
      "angle": "Why it is classified this way",
      "whyItWorks": "How to execute it properly",
      "difficulty": "Easy or Medium or Hard",
      "estimatedReach": "Expected lifespan (e.g. 1 week vs 2 years)",
      "platform": "Best platform",
      "category": "Classification",
      "color": "#10b981"
    }
  ],
  "topFormats": []
}
`,

      viral_formula: `Today is ${today}.${liveDataPrompt}

You are a viral content analyst for Instagram.
I want to understand WHY content goes viral in my niche.
My niche: "${niche}"

Analyze the viral content pattern in my niche and tell me:
1. THE HOOK FORMULAS that work (First 3 seconds)
2. THE EMOTION TRIGGERS that drive DM shares (DM shares = #1 signal in 2026)
3. THE CONTENT STRUCTURES that get saves
4. THE CAPTION STYLES that drive comments
5. THE VISUAL PATTERNS that get watched fully

Give me a NICHE-SPECIFIC viral content blueprint.

Return ONLY a valid JSON object:
{
  "summary": "2-sentence blueprint of what goes viral in ${niche} right now",
  "ideas": [
    {
      "id": "vf1",
      "title": "Hook Formula: [Name of Hook]",
      "format": "Reel or Carousel",
      "hook": "Give 1 concrete example of this hook for my niche",
      "angle": "Why this emotion trigger works for DM shares",
      "whyItWorks": "Why this specific visual pattern retains viewers",
      "difficulty": "Easy or Medium or Hard",
      "estimatedReach": "Expected viral impact",
      "platform": "Instagram",
      "category": "Viral Blueprint",
      "color": "#ec4899"
    }
  ],
  "topFormats": []
}`,

      news_to_ideas: `Today is ${today}.${liveDataPrompt}

Using the breaking news stories provided above AND your knowledge of what's trending TODAY in "${niche}", generate EXACTLY 10 content ideas for EACH of these 4 platforms: LinkedIn, Instagram, Twitter, and YouTube — targeting creators in the ${country} market. That is 40 ideas total.
${platform !== 'All' ? `CRITICAL: Generate ALL 40 ideas specifically for the ${platform} platform.` : 'Distribute exactly: 10 per platform (LinkedIn, Instagram, Twitter, YouTube).'}

IMPORTANT RULES:
- Each idea must reference a specific real news headline or current trend
- Ideas must be ready to post TODAY or this week
- Each platform should have a different angle on the same news
- Vary the formats: use Reels, Carousels, Twitter Threads, LinkedIn Posts, YouTube Shorts

Return ONLY a valid JSON object:
{
  "summary": "What is happening in ${niche} right now that creators should be talking about",
  "newsIdeas": [
    {
      "id": "n1",
      "newsHeadline": "The actual news story or trend you found",
      "newsSource": "Publication or platform name",
      "newsUrl": "https://source-url.com",
      "contentIdea": "The content idea derived from this news (max 12 words)",
      "format": "Reel or Carousel or LinkedIn Post or Twitter Thread or YouTube Short",
      "hook": "Opening hook for this content (make it scroll-stopping)",
      "angle": "Your unique take on this news for this platform",
      "urgency": "Post today or Post this week",
      "platform": "LinkedIn or Instagram or Twitter or YouTube",
      "color": "#hex"
    }
  ]
}`
    };

    const selectedPrompt = prompts[mode] || prompts['niche_ideas'];

    const { text: rawText } = await generateWithWebSearch({ prompt: selectedPrompt, apiKey, maxOutputTokens: 6000 });

    let result: any = {};
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    try {
      result = JSON.parse(cleaned);
    } catch {
      const fixes = ['}', ']}', '}]}', ']} ]}', '}]}]}'];
      let parsed = false;
      for (const fix of fixes) {
        try {
          result = JSON.parse(cleaned + fix);
          parsed = true;
          break;
        } catch {}
      }
      if (!parsed) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try { result = JSON.parse(match[0]); } catch {}
        }
      }
    }

    return NextResponse.json({ ...result, citations, niche, mode, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Ideas engine error:', err);
    return NextResponse.json({ error: err.message || 'Ideas engine failed' }, { status: 500 });
  }
}
