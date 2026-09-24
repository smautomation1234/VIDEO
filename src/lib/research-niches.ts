export interface ResearchNiche {
  id: string;
  label: string;
  icon: string;
  color: string;
  searchQuery: string;
  terms: string[];
}

// Presets make common niches one click, while the custom-niche input keeps the
// research system open to any subject. Terms are deliberately concrete: they
// are used to reject unrelated headlines rather than to manufacture topics.
export const RESEARCH_NICHES: ResearchNiche[] = [
  { id: 'stock_market', label: 'Stock Market', icon: '📈', color: '#16a34a', searchQuery: 'latest named stock market developments, company earnings, share-price catalysts, index moves, IPOs, central-bank decisions, commodities, and exchange announcements', terms: ['stock', 'share', 'shares', 'equity', 'earnings', 'nasdaq', 's&p', 'dow', 'nyse', 'ipo', 'dividend', 'investor', 'market', 'revenue', 'profit', 'rate', 'fed', 'oil', 'gold'] },
  { id: 'finance_personal', label: 'Personal Finance', icon: '💰', color: '#f59e0b', searchQuery: 'latest named banking, investing, interest-rate, tax, retirement, credit, insurance, and personal-money developments', terms: ['finance', 'bank', 'invest', 'saving', 'money', 'mortgage', 'credit', 'tax', 'retirement', 'insurance', 'fund', 'interest rate'] },
  { id: 'crypto', label: 'Crypto & Web3', icon: '₿', color: '#eab308', searchQuery: 'latest named cryptocurrency, Bitcoin, Ethereum, blockchain, exchange, regulation, and digital-asset developments', terms: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'token', 'defi', 'coinbase', 'binance', 'digital asset', 'web3'] },
  { id: 'ai_tech', label: 'AI & Technology', icon: '🤖', color: '#8b5cf6', searchQuery: 'latest named AI, machine-learning, software, chip, robotics, cloud, cybersecurity, and technology developments', terms: ['ai', 'artificial intelligence', 'machine learning', 'software', 'chip', 'technology', 'robot', 'cloud', 'cyber'] },
  { id: 'marketing', label: 'Marketing & Growth', icon: '📣', color: '#10b981', searchQuery: 'latest named digital-marketing, advertising, SEO, brand, campaign, social-search, and growth developments', terms: ['marketing', 'advertising', 'seo', 'brand', 'campaign', 'social media', 'agency', 'search', 'growth'] },
  { id: 'business', label: 'Business & Startups', icon: '🚀', color: '#3b82f6', searchQuery: 'latest named startup, entrepreneurship, venture-capital, funding, founder, and business developments', terms: ['startup', 'business', 'company', 'founder', 'venture', 'funding', 'enterprise', 'entrepreneur'] },
  { id: 'creator', label: 'Creator Economy', icon: '🎬', color: '#ec4899', searchQuery: 'latest named creator-economy, YouTube, Instagram, TikTok, podcast, streaming, monetization, and influencer developments', terms: ['creator', 'youtube', 'instagram', 'tiktok', 'influencer', 'streamer', 'podcast', 'social media'] },
  { id: 'realestate', label: 'Real Estate', icon: '🏠', color: '#06b6d4', searchQuery: 'latest named real-estate, housing, mortgage, rent, property, and construction developments', terms: ['real estate', 'housing', 'home', 'property', 'mortgage', 'rent', 'construction'] },
  { id: 'health', label: 'Health & Wellness', icon: '💪', color: '#84cc16', searchQuery: 'latest named health, wellness, fitness, medical, mental-health, treatment, and research developments', terms: ['health', 'medical', 'medicine', 'hospital', 'wellness', 'fitness', 'drug', 'disease', 'study'] },
  { id: 'leadership', label: 'Leadership & HR', icon: '👔', color: '#f97316', searchQuery: 'latest named leadership, workplace, hiring, management, remote-work, employee, and labor developments', terms: ['leadership', 'workplace', 'hr', 'hiring', 'employee', 'management', 'remote work', 'labor'] },
  { id: 'education', label: 'Education', icon: '🎓', color: '#2563eb', searchQuery: 'latest named education, school, university, learning, teaching, curriculum, and edtech developments', terms: ['education', 'school', 'student', 'teacher', 'university', 'college', 'learning', 'curriculum', 'edtech', 'classroom', 'education policy', 'education funding'] },
  { id: 'parenting', label: 'Parenting & Family', icon: '👨‍👩‍👧', color: '#db2777', searchQuery: 'latest named parenting, childcare, family, child-development, and family-policy developments', terms: ['parent', 'parenting', 'child', 'children', 'family', 'baby', 'teen', 'childcare'] },
  { id: 'gaming', label: 'Gaming & Esports', icon: '🎮', color: '#7c3aed', searchQuery: 'latest named gaming, video-game, console, studio, launch, esports, and streaming developments', terms: ['game', 'gaming', 'esports', 'xbox', 'playstation', 'nintendo', 'steam', 'twitch', 'studio'] },
  { id: 'beauty', label: 'Beauty & Fashion', icon: '✨', color: '#f43f5e', searchQuery: 'latest named beauty, skincare, cosmetics, fashion, retail, runway, and personal-style developments', terms: ['beauty', 'skincare', 'cosmetic', 'fashion', 'style', 'makeup', 'retail', 'runway'] },
  { id: 'food', label: 'Food & Nutrition', icon: '🍲', color: '#ea580c', searchQuery: 'latest named food, cooking, restaurant, nutrition, grocery, recipe, and food-industry developments', terms: ['food', 'cooking', 'restaurant', 'nutrition', 'recipe', 'grocery', 'chef', 'diet'] },
  { id: 'travel', label: 'Travel', icon: '✈️', color: '#0891b2', searchQuery: 'latest named travel, tourism, airline, hotel, destination, visa, and hospitality developments', terms: ['travel', 'tourism', 'airline', 'flight', 'hotel', 'destination', 'visa', 'hospitality'] },
  { id: 'career', label: 'Careers & Jobs', icon: '💼', color: '#475569', searchQuery: 'latest named career, job-market, skills, recruitment, workplace, salary, and professional-development developments', terms: ['career', 'job', 'hiring', 'recruit', 'salary', 'skill', 'workplace', 'employment'] },
  { id: 'saas', label: 'SaaS & B2B', icon: '☁️', color: '#4f46e5', searchQuery: 'latest named SaaS, B2B software, enterprise software, product-led growth, cloud, and software-company developments', terms: ['saas', 'b2b', 'software', 'enterprise', 'cloud', 'subscription', 'product-led'] },
  { id: 'ecommerce', label: 'Ecommerce & Retail', icon: '🛒', color: '#0f766e', searchQuery: 'latest named ecommerce, online-shopping, marketplace, retail, consumer-brand, and direct-to-consumer developments', terms: ['ecommerce', 'e-commerce', 'retail', 'shopping', 'marketplace', 'consumer', 'd2c', 'store'] },
  { id: 'legal', label: 'Legal & Policy', icon: '⚖️', color: '#92400e', searchQuery: 'latest named legal, court, law, regulation, policy, compliance, and justice developments', terms: ['legal', 'law', 'court', 'judge', 'regulation', 'policy', 'compliance', 'justice'] },
  { id: 'sports', label: 'Sports', icon: '🏆', color: '#dc2626', searchQuery: 'latest named sports, team, athlete, league, tournament, match, and sports-business developments', terms: ['sport', 'team', 'league', 'match', 'tournament', 'athlete', 'football', 'cricket', 'basketball'] },
  { id: 'science', label: 'Science & Space', icon: '🔬', color: '#0369a1', searchQuery: 'latest named science, research, climate, space, astronomy, physics, and discovery developments', terms: ['science', 'research', 'space', 'climate', 'nasa', 'discovery', 'study', 'astronomy', 'physics'] },
];

export const RESEARCH_NICHE_TERMS: Record<string, string[]> = Object.fromEntries(
  RESEARCH_NICHES.map(niche => [niche.id, niche.terms]),
);
