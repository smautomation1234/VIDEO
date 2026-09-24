export type GrowthPlatform = 'youtube' | 'instagram' | 'linkedin' | 'x';
export type CampaignStage = 'opportunity' | 'creating' | 'ready' | 'scheduled' | 'published' | 'measured';
export type EvidenceKind = 'verified-public' | 'connected-account' | 'user-entered' | 'ai-analysis';

export interface GrowthEvidence {
  title: string;
  url: string;
  source?: string;
  publishedAt?: string;
  kind: EvidenceKind;
}

export interface PlatformContent {
  title: string;
  hook: string;
  body: string;
  description: string;
  hashtags: string[];
  cta: string;
  format: string;
  visualDirection?: string;
}

export interface ContentPackage {
  generatedAt: string;
  strategy: string;
  youtube: PlatformContent;
  instagram: PlatformContent;
  linkedin: PlatformContent;
  x: PlatformContent;
  factCheck: string[];
  repurposePlan: string[];
}

export interface CampaignMetrics {
  views?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  watchTimeMinutes?: number;
  followersGained?: number;
  recordedAt: string;
  source: 'manual' | 'csv' | 'connected-account';
}

export interface GrowthCampaign {
  id: string;
  title: string;
  niche: string;
  audience: string;
  goal: string;
  platforms: GrowthPlatform[];
  stage: CampaignStage;
  origin: string;
  summary: string;
  hook?: string;
  evergreenReason?: string;
  keywords: string[];
  evidence: GrowthEvidence[];
  contentPackage?: ContentPackage;
  scheduledFor?: string;
  publishedUrl?: string;
  metrics?: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthExperiment {
  id: string;
  name: string;
  campaignId?: string;
  hypothesis: string;
  variantA: string;
  variantB: string;
  metric: string;
  result?: string;
  status: 'planned' | 'running' | 'completed';
  createdAt: string;
}

export interface CompetitorWatch {
  id: string;
  name: string;
  url: string;
  niche: string;
  platform: GrowthPlatform;
  createdAt: string;
}

export interface GrowthWorkspace {
  version: 1;
  campaigns: GrowthCampaign[];
  experiments: GrowthExperiment[];
  watchlist: CompetitorWatch[];
  updatedAt: string;
}

export type ContentBrief = Record<string, unknown>;

export const GROWTH_WORKSPACE_KEY = 'growthWorkspaceV1';
export const GROWTH_WORKSPACE_EVENT = 'growth-workspace-updated';

function now() { return new Date().toISOString(); }
function id(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyGrowthWorkspace(): GrowthWorkspace {
  return { version: 1, campaigns: [], experiments: [], watchlist: [], updatedAt: now() };
}

export function loadGrowthWorkspace(): GrowthWorkspace {
  if (typeof window === 'undefined') return emptyGrowthWorkspace();
  try {
    const parsed = JSON.parse(localStorage.getItem(GROWTH_WORKSPACE_KEY) || '{}');
    return {
      version: 1,
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : [],
      experiments: Array.isArray(parsed.experiments) ? parsed.experiments : [],
      watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
      updatedAt: String(parsed.updatedAt || now()),
    };
  } catch { return emptyGrowthWorkspace(); }
}

export function saveGrowthWorkspace(workspace: GrowthWorkspace): GrowthWorkspace {
  const saved = { ...workspace, version: 1 as const, updatedAt: now() };
  if (typeof window !== 'undefined') {
    localStorage.setItem(GROWTH_WORKSPACE_KEY, JSON.stringify(saved));
    window.dispatchEvent(new CustomEvent(GROWTH_WORKSPACE_EVENT));
  }
  return saved;
}

function stringValue(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }

function normalizePlatform(value: string): GrowthPlatform[] {
  const lower = value.toLowerCase();
  const platforms: GrowthPlatform[] = [];
  if (lower.includes('youtube')) platforms.push('youtube');
  if (lower.includes('instagram')) platforms.push('instagram');
  if (lower.includes('linkedin')) platforms.push('linkedin');
  if (lower.includes('twitter') || lower === 'x' || lower.includes('x/')) platforms.push('x');
  return platforms.length ? platforms : ['youtube', 'instagram', 'linkedin', 'x'];
}

export function campaignFromBrief(brief: ContentBrief): GrowthCampaign {
  const createdAt = stringValue(brief.savedAt) || now();
  const sourceUrl = stringValue(brief.sourceUrl);
  const sourceTitle = stringValue(brief.sourceTitle) || stringValue(brief.title);
  const title = stringValue(brief.title) || sourceTitle || stringValue(brief.niche) || 'Untitled content opportunity';
  const evidence: GrowthEvidence[] = sourceUrl ? [{
    title: sourceTitle || title,
    url: sourceUrl,
    source: stringValue(brief.sourceChannel),
    publishedAt: stringValue(brief.publishedAt),
    kind: 'verified-public',
  }] : [];
  const keywords = Array.isArray(brief.keywords) ? brief.keywords.map(String).filter(Boolean).slice(0, 12) : [];
  return {
    id: stringValue(brief.campaignId) || id('campaign'),
    title,
    niche: stringValue(brief.niche) || 'General',
    audience: stringValue(brief.audience) || 'Relevant niche audience',
    goal: stringValue(brief.goal) || 'Grow attention and build authority',
    platforms: normalizePlatform(stringValue(brief.platform)),
    stage: stringValue(brief.generatedContent) ? 'creating' : 'opportunity',
    origin: stringValue(brief.origin) || stringValue(brief.prompt) || 'manual',
    summary: stringValue(brief.content) || stringValue(brief.description),
    hook: stringValue(brief.hook),
    evergreenReason: stringValue(brief.evergreenReason),
    keywords,
    evidence,
    createdAt,
    updatedAt: now(),
  };
}

export function addBriefToGrowthWorkspace(brief: ContentBrief): GrowthCampaign {
  const workspace = loadGrowthWorkspace();
  const incoming = campaignFromBrief(brief);
  const duplicate = workspace.campaigns.find(item =>
    item.title.toLowerCase() === incoming.title.toLowerCase()
    && item.niche.toLowerCase() === incoming.niche.toLowerCase(),
  );
  if (duplicate) {
    const merged: GrowthCampaign = {
      ...duplicate,
      ...incoming,
      id: duplicate.id,
      createdAt: duplicate.createdAt,
      evidence: [...new Map([...duplicate.evidence, ...incoming.evidence].map(item => [item.url || item.title, item])).values()],
      updatedAt: now(),
    };
    saveGrowthWorkspace({ ...workspace, campaigns: workspace.campaigns.map(item => item.id === duplicate.id ? merged : item) });
    return merged;
  }
  saveGrowthWorkspace({ ...workspace, campaigns: [incoming, ...workspace.campaigns] });
  return incoming;
}

export function updateGrowthCampaign(campaignId: string, patch: Partial<GrowthCampaign>): GrowthWorkspace {
  const workspace = loadGrowthWorkspace();
  return saveGrowthWorkspace({
    ...workspace,
    campaigns: workspace.campaigns.map(item => item.id === campaignId ? { ...item, ...patch, id: item.id, updatedAt: now() } : item),
  });
}

export function deleteGrowthCampaign(campaignId: string): GrowthWorkspace {
  const workspace = loadGrowthWorkspace();
  return saveGrowthWorkspace({ ...workspace, campaigns: workspace.campaigns.filter(item => item.id !== campaignId) });
}

export function addGrowthExperiment(input: Omit<GrowthExperiment, 'id' | 'createdAt'>): GrowthWorkspace {
  const workspace = loadGrowthWorkspace();
  return saveGrowthWorkspace({ ...workspace, experiments: [{ ...input, id: id('experiment'), createdAt: now() }, ...workspace.experiments] });
}

export function updateGrowthExperiment(experimentId: string, patch: Partial<GrowthExperiment>): GrowthWorkspace {
  const workspace = loadGrowthWorkspace();
  return saveGrowthWorkspace({ ...workspace, experiments: workspace.experiments.map(item => item.id === experimentId ? { ...item, ...patch, id: item.id } : item) });
}

export function addCompetitorWatch(input: Omit<CompetitorWatch, 'id' | 'createdAt'>): GrowthWorkspace {
  const workspace = loadGrowthWorkspace();
  const watch: CompetitorWatch = { ...input, id: id('watch'), createdAt: now() };
  return saveGrowthWorkspace({ ...workspace, watchlist: [watch, ...workspace.watchlist] });
}

export function deleteCompetitorWatch(watchId: string): GrowthWorkspace {
  const workspace = loadGrowthWorkspace();
  return saveGrowthWorkspace({ ...workspace, watchlist: workspace.watchlist.filter(item => item.id !== watchId) });
}

export function workspaceToCsv(workspace: GrowthWorkspace): string {
  const header = ['Title','Niche','Platforms','Stage','Scheduled','Published URL','Views','Impressions','Likes','Comments','Shares','Saves','Evidence'];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = workspace.campaigns.map(campaign => [
    campaign.title, campaign.niche, campaign.platforms.join('|'), campaign.stage, campaign.scheduledFor || '', campaign.publishedUrl || '',
    campaign.metrics?.views || '', campaign.metrics?.impressions || '', campaign.metrics?.likes || '', campaign.metrics?.comments || '',
    campaign.metrics?.shares || '', campaign.metrics?.saves || '', campaign.evidence.map(item => item.url).join('|'),
  ].map(escape).join(','));
  return [header.map(escape).join(','), ...rows].join('\n');
}
