export const CATEGORIES: Record<string, {name: string; url: string; type: string}[]> = {
  'Tech & AI': [
    { name: 'Hacker News', url: 'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty', type: 'hn' },
    { name: 'Reddit (/r/artificial)', url: 'https://www.reddit.com/r/artificial/hot.json?limit=6', type: 'reddit' },
    { name: 'Reddit (/r/technology)', url: 'https://www.reddit.com/r/technology/hot.json?limit=6', type: 'reddit' }
  ],
  'Business & Startups': [
    { name: 'Reddit (/r/Entrepreneur)', url: 'https://www.reddit.com/r/Entrepreneur/hot.json?limit=6', type: 'reddit' },
    { name: 'Reddit (/r/startups)', url: 'https://www.reddit.com/r/startups/hot.json?limit=6', type: 'reddit' },
    { name: 'Reddit (/r/SaaS)', url: 'https://www.reddit.com/r/SaaS/hot.json?limit=6', type: 'reddit' }
  ],
  'Politics & News': [
    { name: 'Reddit (/r/worldnews)', url: 'https://www.reddit.com/r/worldnews/hot.json?limit=6', type: 'reddit' },
    { name: 'Reddit (/r/politics)', url: 'https://www.reddit.com/r/politics/hot.json?limit=6', type: 'reddit' },
    { name: 'Reddit (/r/news)', url: 'https://www.reddit.com/r/news/hot.json?limit=6', type: 'reddit' }
  ],
  'Marketing & Growth': [
    { name: 'Reddit (/r/marketing)', url: 'https://www.reddit.com/r/marketing/hot.json?limit=6', type: 'reddit' },
    { name: 'Reddit (/r/socialmedia)', url: 'https://www.reddit.com/r/socialmedia/hot.json?limit=6', type: 'reddit' },
    { name: 'Reddit (/r/GrowthHacking)', url: 'https://www.reddit.com/r/GrowthHacking/hot.json?limit=6', type: 'reddit' }
  ]
};

// Fetch live news feeds for "grounding" the AI
export async function fetchLiveNewsContext(customTopic?: string, category?: string, userProfile?: any): Promise<string> {
  const prefCategories: string[] = userProfile?.preferred_categories || [];
  const customSources: string[] = userProfile?.custom_sources || [];

  let chosenCategories = prefCategories.length > 0 ? prefCategories : ['Tech & AI'];
  
  // If the user explicitly requested a category in the UI (and it's a valid category), use it.
  // Otherwise, fallback to their preferred categories or 'Tech & AI'
  if (category && CATEGORIES[category] && prefCategories.length === 0) {
    chosenCategories = [category];
  }

  let sources: {name: string; url: string; type: string}[] = [];
  
  for (const cat of chosenCategories) {
    if (CATEGORIES[cat]) {
      sources.push(...CATEGORIES[cat]);
    }
  }

  for (const src of customSources) {
    const s = src.trim().toLowerCase();
    if (s.startsWith('r/')) {
      sources.push({ name: `Reddit (/${s})`, url: `https://www.reddit.com/${s}/hot.json?limit=6`, type: 'reddit' });
    } else {
      sources.push({ name: `Website (${src})`, url: src, type: 'web' });
    }
  }

  // Deduplicate sources by URL
  const uniqueSources = Array.from(new Map(sources.map(item => [item.url, item])).values());
  // Limit sources to avoid extremely long response times / rate limits
  const limitedSources = uniqueSources.slice(0, 10);

  let contextStr = `LATEST BREAKING STORIES TODAY:\n`;

  const fetchPromises = limitedSources.map(async (source) => {
    let sourceContext = "";
    try {
      if (source.type === 'hn') {
        const hnRes = await fetch(source.url);
        const hnIds = await hnRes.json();
        const topIds = hnIds.slice(0, 6);
        const itemPromises = topIds.map((id: number) => 
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
        );
        const items = await Promise.all(itemPromises);
        items.forEach((item: any) => {
          if (item && item.title) {
            sourceContext += `- HN: ${item.title}\n`;
          }
        });
      } else if (source.type === 'reddit') {
        const redditRes = await fetch(source.url);
        const redditData = await redditRes.json();
        redditData?.data?.children?.forEach((post: any) => {
          if (post.data?.title) sourceContext += `- ${source.name}: ${post.data.title}\n`;
        });
      } else if (source.type === 'web') {
        sourceContext += `- Custom Source: Consider news from ${source.name}\n`;
      }
    } catch (e) {
      console.error(`Error fetching from ${source.name}`, e);
    }
    return sourceContext;
  });

  const results = await Promise.all(fetchPromises);
  contextStr += results.join("");

  return contextStr;
}
