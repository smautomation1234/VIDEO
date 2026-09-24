import { NextRequest, NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";

// Curated geopolitical finance concept map
const FINANCE_CONCEPTS: Record<string, { concept: string; explanation: string; metric: string }[]> = {
  "trade_war": [
    { concept: "Supply Chain Shock", explanation: "Tariffs disrupt global supply chains → cost-push inflation", metric: "CPI, PPI impact" },
    { concept: "Currency Depreciation", explanation: "Trade barriers weaken domestic currency vs USD", metric: "DXY, CNY/USD" },
    { concept: "Stagflation Risk", explanation: "Simultaneous inflation + economic slowdown", metric: "GDP growth vs Inflation rate" },
  ],
  "war_conflict": [
    { concept: "Safe Haven Assets", explanation: "Gold, USD, Swiss Franc surge during geopolitical risk", metric: "Gold price, VIX index" },
    { concept: "Energy Price Shock", explanation: "Conflict disrupts oil supply → energy inflation", metric: "Brent Crude, WTI" },
    { concept: "Defense Sector Rally", explanation: "Arms spending increases → defense stocks outperform", metric: "LMT, RTX, NOC P/E ratios" },
  ],
  "sanctions": [
    { concept: "Dollar Weaponization", explanation: "USD sanctions push countries toward de-dollarization", metric: "BRICS currency basket" },
    { concept: "Commodity Decoupling", explanation: "Sanctioned economies find alternative trade routes", metric: "Oil discount, trade volumes" },
    { concept: "Bond Market Stress", explanation: "Sovereign debt pressure from excluded SWIFT access", metric: "CDS spreads, bond yields" },
  ],
  "central_bank": [
    { concept: "Interest Rate Divergence", explanation: "Different central bank policies create FX arbitrage", metric: "Fed Funds rate vs ECB" },
    { concept: "Yield Curve Control", explanation: "Central banks cap yields to manage sovereign debt costs", metric: "10Y bond yield vs GDP" },
    { concept: "Liquidity Trap", explanation: "Zero rates fail to stimulate when confidence is low", metric: "M2 money supply growth" },
  ],
  "election": [
    { concept: "Policy Risk Premium", explanation: "Election uncertainty adds risk premium to assets", metric: "Implied volatility, P/E compression" },
    { concept: "Fiscal Policy Shift", explanation: "New governments change tax/spend → market repricing", metric: "Deficit-to-GDP ratio" },
    { concept: "Regulatory Arbitrage", explanation: "Policy changes create sector winners and losers", metric: "Sector ETF performance" },
  ],
  "default": [
    { concept: "Systemic Risk Contagion", explanation: "Financial shocks spread across interconnected markets", metric: "Correlation coefficient" },
    { concept: "Flight to Quality", explanation: "Investors exit risky assets → rush to safe havens", metric: "Risk-off vs Risk-on spread" },
    { concept: "Macro Regime Change", explanation: "Structural shifts in interest rates, inflation, growth", metric: "Business cycle indicators" },
  ],
};

// Simulated news feed (in production, connect to NewsAPI, GNews, or Reuters API)
const LIVE_NEWS_SIMULATION = [
  {
    id: "n1",
    headline: "US Tariffs on Chinese Goods Hit 145% — Beijing Retaliates with Rare Earth Export Curbs",
    region: "US-China",
    category: "trade_war",
    date: "2026-04-03",
    impact_level: "extreme",
    markets_affected: ["S&P 500", "USD/CNY", "Commodities", "Tech Sector"],
    source: "Reuters",
  },
  {
    id: "n2",
    headline: "Federal Reserve Signals Rate Hold Amid Stagflation Fears — Dollar Strengthens",
    region: "United States",
    category: "central_bank",
    date: "2026-04-02",
    impact_level: "high",
    markets_affected: ["US Treasuries", "DXY", "Emerging Markets", "Gold"],
    source: "Bloomberg",
  },
  {
    id: "n3",
    headline: "Russia-Ukraine Ceasefire Talks Collapse — Energy Markets React Sharply",
    region: "Europe",
    category: "war_conflict",
    date: "2026-04-01",
    impact_level: "high",
    markets_affected: ["Brent Crude", "European Equities", "EUR/USD", "Natural Gas"],
    source: "FT",
  },
  {
    id: "n4",
    headline: "BRICS Nations Launch Cross-Border Payment System — Dollar Dominance Under Threat",
    region: "Global South",
    category: "sanctions",
    date: "2026-04-01",
    impact_level: "medium",
    markets_affected: ["USD Index", "Gold", "Emerging Market bonds", "CNY"],
    source: "WSJ",
  },
  {
    id: "n5",
    headline: "India-Pakistan Tensions Escalate — South Asian Markets in Freefall",
    region: "South Asia",
    category: "war_conflict",
    date: "2026-03-31",
    impact_level: "high",
    markets_affected: ["BSE Sensex", "INR/USD", "Pakistan PSX", "Regional FX"],
    source: "Al Jazeera",
  },
  {
    id: "n6",
    headline: "EU Elections Shift Right — Energy Transition Policies at Risk",
    region: "Europe",
    category: "election",
    date: "2026-03-30",
    impact_level: "medium",
    markets_affected: ["Clean Energy ETFs", "EUR/USD", "European Bonds", "Oil Majors"],
    source: "Politico",
  },
  {
    id: "n7",
    headline: "Saudi Arabia Cuts Oil Production — OPEC+ Alliance Stresses as Demand Weakens",
    region: "Middle East",
    category: "trade_war",
    date: "2026-03-29",
    impact_level: "high",
    markets_affected: ["WTI Crude", "Energy Stocks", "Petrodollar", "Inflation"],
    source: "CNBC",
  },
  {
    id: "n8",
    headline: "Japan Raises Rates for First Time in Decades — Yen Carry Trade Unwinds",
    region: "Japan",
    category: "central_bank",
    date: "2026-03-28",
    impact_level: "extreme",
    markets_affected: ["JPY/USD", "Global Equities", "US Treasuries", "EM Currencies"],
    source: "Nikkei",
  },
];

export async function POST(req: NextRequest) {
  try {
    const { action, newsId, customTopic, templateType, format } = await req.json();

    if (action === "scan") {
      // Fetch actual live trends with live data
      let liveNews = [];
      try {
        const res = await fetch("http://feeds.bbci.co.uk/news/business/rss.xml", { next: { revalidate: 3600 } });
        const xml = await res.text();
        
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
          const itemXml = match[1];
          const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/);
          const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || itemXml.match(/<description>(.*?)<\/description>/);
          const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
          
          if (titleMatch) {
            items.push({
              title: titleMatch[1].trim(),
              description: descMatch ? descMatch[1].trim() : "",
              date: dateMatch ? new Date(dateMatch[1]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            });
          }
        }

        if (items.length > 0) {
          const prompt = `Convert these real news headlines into the required structured format for our geopolitical finance app.

Raw News:
${items.map((item, i) => `${i + 1}. ${item.title}\n   ${item.description}\n   Date: ${item.date}`).join("\n")}

Respond with ONLY a JSON array of objects, where each object has:
- id: string (generate a short unique id like "n1")
- headline: string (the title, cleaned up)
- region: string (guess the region: "US", "Europe", "Global", "Asia", etc.)
- category: string (choose from: "trade_war", "war_conflict", "sanctions", "central_bank", "election", "default")
- date: string (YYYY-MM-DD)
- impact_level: "low" | "medium" | "high" | "extreme" (assign based on severity/market importance)
- markets_affected: array of strings (e.g. ["S&P 500", "Brent Crude", "USD", "Tech Sector"] - infer 3-4 likely affected markets)
- source: "BBC Business"
- summary: string (write a crisp 2-3 sentence summary of the geopolitical and financial topic so the user can copy/paste it before generating a carousel)

JSON Array Only, no markdown block:`;

          const aiResult = await generateWithWebSearch({ prompt, maxOutputTokens: 2000 });

          const content = aiResult.text || "[]";
          const cleanJson = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
          liveNews = JSON.parse(cleanJson);
        } else {
          liveNews = LIVE_NEWS_SIMULATION;
        }
      } catch (err) {
        console.error("Failed to parse live news", err);
        liveNews = LIVE_NEWS_SIMULATION;
      }

      // Enrich with finance concepts
      const enrichedNews = liveNews.map((news: { category?: string; [key: string]: unknown }) => ({
        ...news,
        finance_concepts: FINANCE_CONCEPTS[news.category as string] || FINANCE_CONCEPTS["default"],
      }));
      return NextResponse.json({ news: enrichedNews });
    }

    if (action === "generate_template") {
      // Generate full carousel/reel template for selected news
      const selectedNews = newsId
        ? LIVE_NEWS_SIMULATION.find(n => n.id === newsId)
        : null;

      const topic = customTopic || (selectedNews
        ? `${selectedNews.headline} — Markets: ${selectedNews.markets_affected.join(", ")}`
        : "Global macro shift");

      const concepts = selectedNews
        ? (FINANCE_CONCEPTS[selectedNews.category] || FINANCE_CONCEPTS["default"])
        : FINANCE_CONCEPTS["default"];

      const formatInstructions = format === "reel"
        ? `Create a 5-scene vertical reel script (60 seconds) with:
SCENE 1 (0-5s): HOOK — Shocking headline statement that stops scrolling
SCENE 2 (5-15s): THE EVENT — What happened geopolitically (simple, visual)
SCENE 3 (15-35s): THE FINANCE IMPACT — 3 key financial concepts explained simply with numbers
SCENE 4 (35-50s): WHAT THIS MEANS FOR YOUR MONEY — Practical investor takeaway
SCENE 5 (50-60s): CTA — Follow for daily geopolitical finance breakdowns

For each scene: write [SPOKEN TEXT] and [VISUAL: description]`
        : format === "post"
        ? `Create a high-converting, deeply detailed social media post (perfect for a LinkedIn Newsletter or a long-form Twitter/X thread). 
Structure it with the "Event → Macro Effect → Micro Impact → Investor Action" framework.
Include:
- A hooking intro that calls out what most people are missing.
- Numbered breakdown of the macroeconomic and geopolitical domino effects.
- "The Smart Money Playbook" detailing specific investor actions (overweight/underweight sectors).
- Use relevant emojis and bold text for formatting.
- Keep the tone analytical, urgent, and insightful.`
        : `Create a 10-slide carousel with:
SLIDE 1: Bold title + hook stat (make it shocking and share-worthy)
SLIDE 2: The Geopolitical Event — What happened (use bullet points, 3 max)
SLIDE 3: Finance Concept #1 — ${concepts[0]?.concept} explained simply
SLIDE 4: The Numbers — Key metrics and data points
SLIDE 5: Finance Concept #2 — ${concepts[1]?.concept} explained simply
SLIDE 6: Market Impact Map — Which assets are affected and how
SLIDE 7: Finance Concept #3 — ${concepts[2]?.concept} explained simply
SLIDE 8: Historical Comparison — "Last time this happened..." with example
SLIDE 9: What Smart Money Is Doing — Institutional investor behavior
SLIDE 10: Your Action Plan — 3 concrete takeaways + Follow CTA

For each slide: write [HEADLINE], [BODY TEXT], and [VISUAL ELEMENT]`;

      const systemPrompt = `You are a world-class financial educator and content creator who makes complex geopolitical finance topics digestible for everyday people. You blend geopolitical analysis with finance concepts to create content that goes viral because it makes people think "I never saw this connection before." Your style: punchy, clear, uses real numbers, makes abstract concepts concrete with analogies.`;

      const userPrompt = `Topic: ${topic}

Key Finance Concepts to weave in:
${concepts.map((c, i) => `${i + 1}. ${c.concept}: ${c.explanation} (Track via: ${c.metric})`).join("\n")}

${formatInstructions}

Critical rules:
- Start with a counter-intuitive or shocking insight
- Use specific numbers and percentages (estimate realistically)
- Explain the 2nd + 3rd order effects (what most people miss)
- Show the historical precedent
- Make it educational but also urgent
- Avoid jargon — explain it like talking to a smart friend
- End with actionable insight for the audience

Generate the complete ${format === "reel" ? "reel script" : format === "post" ? "social media post" : "carousel content"} now:`;

      const aiResult = await generateWithWebSearch({ system: systemPrompt, prompt: userPrompt, maxOutputTokens: 1800 });

      const content = aiResult.text || "";
      return NextResponse.json({
        content,
        news: selectedNews,
        concepts,
        format,
        topic,
      });
    }

    if (action === "generate_infographic_data") {
      // Generate structured data for visual infographic template
      const selectedNews = newsId
        ? LIVE_NEWS_SIMULATION.find(n => n.id === newsId)
        : LIVE_NEWS_SIMULATION[0];

      const concepts = selectedNews
        ? (FINANCE_CONCEPTS[selectedNews.category] || FINANCE_CONCEPTS["default"])
        : FINANCE_CONCEPTS["default"];

      const systemPrompt = `You are a data journalist who creates infographic content. Return structured JSON data for a visual infographic.`;

      const userPrompt = `Create infographic data for this event: "${selectedNews?.headline}"

Finance concepts involved: ${concepts.map(c => c.concept).join(", ")}
Markets affected: ${selectedNews?.markets_affected.join(", ")}

Return a JSON object with:
{
  "title": "short punchy title (max 8 words)",
  "subtitle": "one line that explains the finance angle",
  "impact_score": number 1-10,
  "timeline": "how long until full impact (e.g. '3-6 months')",
  "assets": [
    {"name": "asset name", "direction": "up|down|volatile", "magnitude": "percentage estimate", "reason": "one sentence why"}
  ],
  "concepts": [
    {"name": "concept name", "simple_definition": "one line ELI5", "why_it_matters": "1 sentence"}
  ],
  "key_stat": {"number": "shocking statistic", "label": "what it means"},
  "historical_parallel": {"event": "similar past event", "outcome": "what happened then", "year": year},
  "investor_actions": ["action 1", "action 2", "action 3"],
  "bottom_line": "One powerful sentence that summarizes everything"
}`;

      const aiResult = await generateWithWebSearch({ system: systemPrompt, prompt: userPrompt, maxOutputTokens: 1000 });

      const rawData = aiResult.text || "{}";
      const infographicData = JSON.parse(rawData);
      return NextResponse.json({ infographicData, news: selectedNews });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
