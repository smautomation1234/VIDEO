"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Zap, Copy, Check, ExternalLink, Twitter, Linkedin, MessageSquare, Instagram, Bot, Activity, Newspaper, ChevronRight, Sprout, Images } from 'lucide-react';
import { addBriefToGrowthWorkspace } from '@/lib/growth-workspace';
import { RESEARCH_NICHES } from '@/lib/research-niches';
import { ErrorBanner } from '@/components/ui/Helpers';
import EmptyState from '@/components/ui/EmptyState';

const CATEGORIES = RESEARCH_NICHES;

const PLATFORMS = ['YouTube', 'LinkedIn', 'X/Twitter', 'Instagram', 'Reddit'];
const PLATFORM_COLORS: Record<string, string> = {
  YouTube: '#ff0000', LinkedIn: '#0077b5', Twitter: '#1da1f2', 'X/Twitter': '#111827', Instagram: '#e1306c', Reddit: '#ff4500',
};
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  YouTube: <span style={{ fontSize: 12 }}>▶</span>, LinkedIn: <Linkedin size={13} />, Twitter: <Twitter size={13} />, 'X/Twitter': <Twitter size={13} />,
  Instagram: <Instagram size={13} />, Reddit: <MessageSquare size={13} />,
};
const HOOK_COLORS: Record<string, string> = {
  'Contrarian': '#f43f5e', 'Curiosity Gap': '#8b5cf6', 'Data-Backed': '#3b82f6',
  'Social Proof': '#10b981', 'Insider Knowledge': '#f59e0b', 'Real Trend': '#10b981',
};

// ─── Post Generator Modal ────────────────────────────────────────────────────
function PostModal({ topic, onClose }: { topic: any; onClose: () => void }) {
  const [platform, setPlatform] = useState('LinkedIn');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async (plt: string) => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/trends/generate-post', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.topic, platform: plt, hook: topic.hook,
          category: topic.category, sourceUrl: topic.sourceUrl, whyItsTrending: topic.whyItsTrending }),
      });
      setResult(await res.json());
    } catch { setResult({ error: 'Failed to generate.' }); }
    setLoading(false);
  }, [topic]);

  useEffect(() => { generate(platform); }, []);

  const switchPlatform = (p: string) => { setPlatform(p); generate(p); };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(41,37,30,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 740, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Turn this trend into a post
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.45 }}>{topic.topic}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {topic.sourceName && <span style={{ fontSize: 11, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 8px', borderRadius: 10 }}>{topic.sourceName}</span>}
              {topic.whyItsTrending && <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>"{topic.whyItsTrending}"</span>}
            </div>
            {topic.postIdea && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, fontSize: 12, color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                Post angle: {topic.postIdea}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--foreground)', fontSize: 13 }}>✕</button>
        </div>

        {/* Platform tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => switchPlatform(p)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${platform === p ? PLATFORM_COLORS[p] : 'var(--border)'}`,
              background: platform === p ? `${PLATFORM_COLORS[p]}18` : 'var(--muted)',
              color: platform === p ? PLATFORM_COLORS[p] : 'var(--muted-foreground)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              {PLATFORM_ICONS[p]} {p}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 44 }}>
            <Bot size={28} color="#10b981" style={{ margin: '0 auto', animation: 'pulse 1.5s ease infinite' }} />
            <div style={{ color: 'var(--muted-foreground)', marginTop: 12, fontSize: 13 }}>
              Writing your {platform} post from real trend data...
            </div>
          </div>
        )}

        {result && !loading && (
          result.error ? (
            <ErrorBanner message={result.error} />
          ) : (
            <>
              {result.headline && <div style={{ fontSize: 13, fontWeight: 700, color: PLATFORM_COLORS[platform], marginBottom: 12 }}>{result.headline}</div>}
              <div style={{ background: 'var(--muted)', border: `1px solid ${PLATFORM_COLORS[platform]}40`, borderRadius: 10, padding: 18, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 380, overflowY: 'auto', color: 'var(--foreground)' }}>
                {result.post}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => { navigator.clipboard.writeText(result.post); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: copied ? '#10b981' : PLATFORM_COLORS[platform], color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Post</>}
                </button>
                {result.bestPostTime && <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Best time: <strong>{result.bestPostTime}</strong></span>}
                {result.estimatedReach && <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>{result.estimatedReach}</span>}
                {topic.sourceUrl && (
                  <a href={topic.sourceUrl} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted-foreground)', textDecoration: 'none' }}>
                    <ExternalLink size={11} /> View source
                  </a>
                )}
              </div>
              {result.tips?.length > 0 && (
                <div style={{ marginTop: 16, padding: 14, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>Pro tips</div>
                  {result.tips.map((tip: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>• {tip}</div>
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

// ─── Agent Log Panel ──────────────────────────────────────────────────────────
function AgentLog({ steps, loading, categoryColor }: { steps: string[]; loading: boolean; categoryColor: string }) {
  if (steps.length === 0 && !loading) return null;
  return (
    <div style={{ background: 'var(--muted)', border: `1px solid ${categoryColor}30`, borderRadius: 12, padding: 16, fontFamily: 'monospace', color: 'var(--muted-foreground)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Bot size={14} color={categoryColor} />
        <span style={{ fontSize: 12, fontWeight: 700, color: categoryColor }}>Agent Activity Log</span>
        {loading && <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>running...</span>}
      </div>
      {steps.map((step, i) => (
        <div key={i} style={{ fontSize: 12, color: i === steps.length - 1 ? 'var(--foreground)' : 'var(--muted-foreground)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChevronRight size={11} color={categoryColor} style={{ flexShrink: 0 }} />
          {step}
        </div>
      ))}
      {loading && (
        <div style={{ fontSize: 12, color: categoryColor, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChevronRight size={11} />
          <span style={{ animation: 'pulse 1s ease infinite' }}>Processing...</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrendsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('stock_market');
  const [topics, setTopics] = useState<any[]>([]);
  const [hooks, setHooks] = useState<any[]>([]);
  const [agentSteps, setAgentSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'table' | 'hooks'>('table');
  const [platform, setPlatform] = useState('youtube');
  const [mode, setMode] = useState<'topics' | 'audio'>('topics');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'urgencyScore', direction: 'desc' });
  const [rawCount, setRawCount] = useState(0);
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
  const [categoryMeta, setCategoryMeta] = useState<{ color: string; icon: string; label: string } | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [customNiche, setCustomNiche] = useState('');
  const [region, setRegion] = useState<'india' | 'world'>('india');
  const [newsMode, setNewsMode] = useState(true);
  const scanAbortRef = useRef<AbortController | null>(null);

  const scan = useCallback(async (catId: string, p: string = platform, m: string = mode, nicheOverride: string = customNiche, regionOverride: 'india' | 'world' = region) => {
    scanAbortRef.current?.abort();
    const controller = new AbortController();
    scanAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 18000);
    setLoading(true);
    setError(null);
    setTopics([]);
    setHooks([]);
    setAgentSteps([]);
    const cat = CATEGORIES.find(c => c.id === catId);
    if (catId === 'news') setCategoryMeta({ color: regionOverride === 'india' ? '#ea580c' : '#2563eb', icon: regionOverride === 'india' ? '🇮🇳' : '🌍', label: regionOverride === 'india' ? 'India News' : 'World News' });
    else if (nicheOverride.trim()) setCategoryMeta({ color: '#7c3aed', icon: '', label: nicheOverride.trim() });
    else if (cat) setCategoryMeta({ color: cat.color, icon: cat.icon, label: cat.label });

    try {
      const res = await fetch(`/api/trends?category=${encodeURIComponent(catId)}&platform=${p}&mode=${m}&region=${regionOverride}&niche=${encodeURIComponent(nicheOverride.trim())}`, { signal: controller.signal });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (scanAbortRef.current !== controller) return;
      setTopics(data.topics || []);
      setHooks(data.hooks || []);
      setAgentSteps(data.agentSteps || []);
      setRawCount(data.rawCount || 0);
      setFetchedAt(data.fetchedAt || null);
    } catch (e: any) {
      if (scanAbortRef.current !== controller) return;
      setError(e?.name === 'AbortError'
        ? 'This live scan is taking longer than expected. Please try again in a moment or choose another topic.'
        : (e?.message || 'Unable to load live trends right now.'));
    } finally {
      window.clearTimeout(timeout);
      if (scanAbortRef.current === controller) {
        scanAbortRef.current = null;
        setLoading(false);
      }
    }
  }, [platform, mode, customNiche]);

  useEffect(() => {
    const requested = (new URLSearchParams(window.location.search).get('niche') || '').toLowerCase();
    const exactPreset = CATEGORIES.find(item => item.id === requested || item.label.toLowerCase() === requested);
    const initialCategory = exactPreset?.id || (requested.includes('startup') || requested.includes('business') ? 'business'
      : requested.includes('crypto') || requested.includes('bitcoin') ? 'crypto'
      : requested.includes('finance') || requested.includes('money') ? 'finance_personal'
      : requested.includes('marketing') ? 'marketing'
      : requested.includes('creator') || requested.includes('youtube') ? 'creator'
      : requested.includes('real estate') || requested.includes('property') ? 'realestate'
      : requested.includes('health') || requested.includes('fitness') ? 'health'
      : requested.includes('leadership') || requested.includes('hr') ? 'leadership'
      : requested.includes('ai') || requested.includes('tech') ? 'ai_tech'
      : '');
    if (requested && !initialCategory) {
      setCustomNiche(requested);
      setActiveCategory('custom');
      scan('custom', platform, mode, requested);
    } else {
      const preset = initialCategory || 'stock_market';
      setActiveCategory('news');
      setNewsMode(true);
      scan('news', platform, mode, '', 'india');
    }
  }, []);

  const sendToPlatform = (topic: any, target: 'youtube' | 'linkedin') => {
    const content = target === 'youtube' ? topic.youtubeAngle : topic.linkedinAngle;
    const brief = {
      origin: 'trend-scout',
      niche: categoryMeta?.label || activeCategory,
      platform: target === 'youtube' ? 'YouTube' : 'LinkedIn',
      prompt: target === 'youtube' ? 'Live discussion video' : 'Live discussion post',
      title: topic.topic,
      sourceTitle: topic.sourceName || topic.topic,
      sourceUrl: topic.sourceUrl,
      publishedAt: topic.publishedAt || '',
      discussionReason: topic.discussionReason || '',
      youtubeAngle: topic.youtubeAngle || '',
      linkedinAngle: topic.linkedinAngle || '',
      content: content || '',
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('activeContentBrief', JSON.stringify(brief));
    addBriefToGrowthWorkspace(brief);
    const destination = target === 'youtube' ? '/youtube-strategy' : '/linkedin';
    const tool = target === 'youtube' ? '5' : '4';
    router.push(`${destination}?niche=${encodeURIComponent(categoryMeta?.label || activeCategory)}&useBrief=1&tool=${tool}`);
  };

  const sendToCarousel = (topic: any) => {
    const source = [
      `Headline: ${topic.topic}`,
      topic.discussionReason ? `Why it matters: ${topic.discussionReason}` : '',
      topic.whyItsTrending ? `Current context: ${topic.whyItsTrending}` : '',
      topic.postIdea ? `Post angle: ${topic.postIdea}` : '',
      topic.sourceUrl ? `Source: ${topic.sourceUrl}` : '',
    ].filter(Boolean).join('\n\n');
    const brief = {
      origin: 'trend-scout',
      niche: categoryMeta?.label || activeCategory,
      platform: 'Carousel',
      title: topic.topic,
      sourceTitle: topic.sourceName || topic.topic,
      sourceUrl: topic.sourceUrl,
      publishedAt: topic.publishedAt || '',
      content: source,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('activeContentBrief', JSON.stringify(brief));
    addBriefToGrowthWorkspace(brief);
    router.push(`/carousel?topic=${encodeURIComponent(source)}&returnTo=${encodeURIComponent('/research/trends')}`);
  };

  const saveOpportunity = (topic: any) => {
    const brief = {
      origin: 'trend-scout', niche: categoryMeta?.label || activeCategory, platform: 'YouTube, Instagram, LinkedIn, X',
      title: topic.topic, sourceTitle: topic.sourceName || topic.topic, sourceUrl: topic.sourceUrl,
      publishedAt: topic.publishedAt || '', content: topic.discussionReason || topic.whyItsTrending || '',
      youtubeAngle: topic.youtubeAngle || '', linkedinAngle: topic.linkedinAngle || '', savedAt: new Date().toISOString(),
    };
    localStorage.setItem('activeContentBrief', JSON.stringify(brief));
    addBriefToGrowthWorkspace(brief);
  };

  const cat = CATEGORIES.find(c => c.id === activeCategory);
  const accentColor = categoryMeta?.color || cat?.color || '#10b981';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {selectedTopic && <PostModal topic={selectedTopic} onClose={() => setSelectedTopic(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'sticky', top: 74, zIndex: 30, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', borderRadius: 12, padding: 5, border: '1px solid var(--border)', boxShadow: '0 8px 20px rgba(41,37,30,.08)' }}>
            <span style={{ padding: '6px 8px', fontSize: 11, fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: .5 }}>Trending news</span>
            <button type="button" onClick={() => { setRegion('india'); setNewsMode(true); setActiveCategory('news'); setCustomNiche(''); scan('news', platform, mode, '', 'india'); }} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: newsMode && region === 'india' ? '#ea580c' : 'transparent', color: newsMode && region === 'india' ? '#fff' : 'var(--muted-foreground)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>🇮🇳 India Trending</button>
            <button type="button" onClick={() => { setRegion('world'); setNewsMode(true); setActiveCategory('news'); setCustomNiche(''); scan('news', platform, mode, '', 'world'); }} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: newsMode && region === 'world' ? '#2563eb' : 'transparent', color: newsMode && region === 'world' ? '#fff' : 'var(--muted-foreground)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>🌍 World Trending</button>
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'var(--card)', borderRadius: 12, padding: 4, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {['youtube', 'instagram', 'linkedin', 'x'].map(p => (
              <button key={p} onClick={() => { setPlatform(p); scan(activeCategory, p, mode, customNiche, region); }} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: platform === p ? 'var(--primary)' : 'transparent', color: platform === p ? '#fff' : 'var(--muted-foreground)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {p === 'youtube' ? 'YouTube' : p === 'instagram' ? 'Instagram' : p === 'linkedin' ? 'LinkedIn' : 'X/Twitter'}
              </button>
            ))}
          </div>
          {platform === 'instagram' && (
            <div style={{ display: 'flex', background: 'var(--card)', borderRadius: 20, padding: 4, border: '1px solid var(--border)' }}>
              <button onClick={() => { setMode('topics'); scan(activeCategory, platform, 'topics', customNiche, region); }} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: mode === 'topics' ? 'var(--primary)' : 'transparent', color: mode === 'topics' ? '#fff' : 'var(--muted-foreground)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                Topics
              </button>
              <button onClick={() => { setMode('audio'); scan(activeCategory, platform, 'audio', customNiche, region); }} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: mode === 'audio' ? '#10b981' : 'transparent', color: mode === 'audio' ? '#fff' : 'var(--muted-foreground)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                Audio
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 5, display: 'flex', gap: 5, width: 'fit-content' }}>
        <button type="button" style={{ border: 0, borderRadius: 8, padding: '9px 14px', background: 'var(--primary)', color: '#fff', fontWeight: 850, cursor: 'pointer', display: 'flex', gap: 7, alignItems: 'center' }}><Activity size={14} /> Live topics</button>
        <button type="button" onClick={() => router.push(`/evergreen?niche=${encodeURIComponent(categoryMeta?.label || customNiche || cat?.label || '')}&platform=${platform}`)} style={{ border: 0, borderRadius: 8, padding: '9px 14px', background: 'transparent', color: 'var(--muted-foreground)', fontWeight: 850, cursor: 'pointer', display: 'flex', gap: 7, alignItems: 'center' }}><Sprout size={14} /> Evergreen ideas</button>
      </div>

      {/* Category Agent Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {CATEGORIES.map(c => {
          const isActive = activeCategory === c.id;
          return (
          <button key={c.id} onClick={() => { setCustomNiche(''); setNewsMode(false); setActiveCategory(c.id); scan(c.id, platform, mode, '', region); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12,
                border: `1px solid ${isActive ? c.color : 'var(--border)'}`,
                background: isActive ? `${c.color}15` : 'var(--card)',
                color: isActive ? c.color : 'var(--muted-foreground)',
                fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s', textAlign: 'left',
                boxShadow: isActive ? `0 0 12px ${c.color}25` : 'none',
              }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{c.label}</div>
                <div style={{ fontSize: 10, color: isActive ? `${c.color}90` : '#64748b', marginTop: 2 }}>
                  {isActive && loading ? 'Scanning...' : 'Click to scan'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
        <label style={{ display: 'grid', gap: 6, flex: '1 1 320px', fontSize: 12, fontWeight: 800 }}>Any custom niche
          <input value={customNiche} onChange={event => setCustomNiche(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && customNiche.trim()) { setActiveCategory('custom'); scan('custom', platform, mode, customNiche); } }} placeholder="e.g. legal tech, parenting, SaaS, gaming, education" />
        </label>
        <button type="button" disabled={!customNiche.trim() || loading} onClick={() => { setNewsMode(false); setActiveCategory('custom'); scan('custom', platform, mode, customNiche, region); }} style={{ border: 0, borderRadius: 9, padding: '11px 18px', background: '#7c3aed', color: '#fff', fontWeight: 800, cursor: customNiche.trim() ? 'pointer' : 'not-allowed', opacity: customNiche.trim() ? 1 : .5 }}>Find live discussions</button>
        <button type="button" disabled={!customNiche.trim()} onClick={() => router.push(`/evergreen?niche=${encodeURIComponent(customNiche.trim())}&platform=${platform}`)} style={{ border: '1px solid #16a34a', borderRadius: 9, padding: '10px 16px', background: 'rgba(22,163,74,.06)', color: '#15803d', fontWeight: 800, cursor: customNiche.trim() ? 'pointer' : 'not-allowed', opacity: customNiche.trim() ? 1 : .5 }}>Find evergreen ideas</button>
      </div>

      {/* Agent Log */}
      <AgentLog steps={agentSteps} loading={loading} categoryColor={accentColor} />

      {error && <ErrorBanner message={error} />}

      {/* Tabs */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderColor: accentColor, background: `${accentColor}08` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 20 }}>{newsMode ? (region === 'india' ? '🇮🇳' : '🌍') : categoryMeta?.icon || '📡'}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 850 }}>{newsMode ? `${region === 'india' ? 'India' : 'World'} trending news` : `${categoryMeta?.label || 'Live trends'}`}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{newsMode ? 'Select a story below to create a post or carousel.' : 'Live source-backed discussion topics.'}</div>
          </div>
        </div>
        {newsMode && <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => { setRegion('india'); setActiveCategory('news'); scan('news', platform, mode, '', 'india'); }} style={{ border: `1px solid ${region === 'india' ? '#ea580c' : 'var(--border)'}`, borderRadius: 8, padding: '7px 11px', background: region === 'india' ? '#ea580c' : 'var(--card)', color: region === 'india' ? '#fff' : 'var(--muted-foreground)', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>🇮🇳 India</button>
          <button type="button" onClick={() => { setRegion('world'); setActiveCategory('news'); scan('news', platform, mode, '', 'world'); }} style={{ border: `1px solid ${region === 'world' ? '#2563eb' : 'var(--border)'}`, borderRadius: 8, padding: '7px 11px', background: region === 'world' ? '#2563eb' : 'var(--card)', color: region === 'world' ? '#fff' : 'var(--muted-foreground)', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>🌍 World</button>
        </div>}
      </div>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'table', label: `Data table ${topics.length > 0 ? `(${topics.length})` : ''}` },
          { id: 'topics', label: `Trend cards ${topics.length > 0 ? `(${topics.length})` : ''}` },
          { id: 'hooks', label: `Viral hooks ${hooks.length > 0 ? `(${hooks.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
            padding: '10px 18px', background: 'none', border: 'none',
            borderBottom: `2px solid ${activeTab === t.id ? accentColor : 'transparent'}`,
            color: activeTab === t.id ? accentColor : 'var(--muted-foreground)',
            fontWeight: activeTab === t.id ? 700 : 400, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 10, background: 'var(--muted)', animation: 'pulse 1.5s ease infinite', opacity: 1 - i * 0.15 }} />
          ))}
          <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13, marginTop: 8 }}>
            <Newspaper size={16} style={{ display: 'inline', marginRight: 6 }} />
            Agent is scanning for {categoryMeta?.label || 'trends'}...
          </div>
        </div>
      )}

      {/* Topics */}
      {activeTab === 'topics' && !loading && topics.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              {categoryMeta?.icon} {categoryMeta?.label} — Top {mode === 'audio' ? 'Audio ' : ''}Trends
            </span>
          </div>
          {topics.map((t, i) => {
            const hc = HOOK_COLORS[t.hook] || accentColor;
            return (
              <div key={t.id || i} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 14, padding: '15px 20px',
                borderBottom: i < topics.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: accentColor }}>#{i + 1}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{t.topic}</div>
                  {mode === 'audio' && t.audioUrl && (
                    <audio controls style={{ height: 30, width: '100%' }}><source src={t.audioUrl} type="audio/mpeg" /></audio>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  <button onClick={() => sendToCarousel(t)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: accentColor, color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <Images size={13} /> Carousel
                  </button>
                  <button onClick={() => setSelectedTopic(t)} className="btn-primary" style={{ padding: '8px 12px', fontSize: 12 }}>
                    <Zap size={13} /> Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {activeTab === 'table' && !loading && topics.length > 0 && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--muted)', fontSize: 12, color: 'var(--muted-foreground)' }}>
                <th style={{ padding: '12px 20px' }}>Topic</th>
                <th style={{ padding: '12px 20px' }}>Why it matters now</th>
                <th style={{ padding: '12px 20px' }}>Create</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600 }}><div>{t.topic}</div><div style={{ marginTop: 5, fontSize: 10, fontWeight: 400, color: 'var(--muted-foreground)' }}>{t.publishedAt ? `Published ${new Date(t.publishedAt).toLocaleString()}` : 'Publication date unavailable'} · <a href={t.sourceUrl} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}>Open source</a></div></td>
                  <td style={{ padding: '16px 20px', color: 'var(--muted-foreground)', fontSize: 12, minWidth: 230 }}>{t.discussionReason || t.whyItsTrending || 'Current source-backed story. Verify the source before publishing.'}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      <button onClick={() => sendToPlatform(t, 'youtube')} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '7px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>▶ Video idea</button>
                      <button onClick={() => sendToPlatform(t, 'linkedin')} style={{ background: '#0a66c2', color: '#fff', border: 'none', padding: '7px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>LinkedIn post</button>
                      <button onClick={() => sendToCarousel(t)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: accentColor, color: '#fff', border: 'none', padding: '7px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}><Images size={12} /> Carousel</button>
                      <button onClick={() => saveOpportunity(t)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '7px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Save to workspace</button>
                      <button onClick={() => setSelectedTopic(t)} className="btn-primary" style={{ padding: '7px 10px', fontSize: 11 }}>More</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hooks */}
      {activeTab === 'hooks' && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {hooks.map((hook: any, idx: number) => {
            const hc = HOOK_COLORS[hook.framework] || accentColor;
            const isCopied = copiedHook === String(hook.id || idx);
            return (
              <div key={hook.id || idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: hc }} />
                <p style={{ fontSize: 15, lineHeight: 1.65, fontWeight: 600 }}>{hook.text}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: 11, padding: '2px 8px', borderRadius: 8 }}>{hook.category}</span>
                  <button onClick={() => { navigator.clipboard.writeText(hook.text); setCopiedHook(String(hook.id || idx)); setTimeout(() => setCopiedHook(null), 2000); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: isCopied ? `${hc}18` : 'var(--muted)', border: `1px solid ${isCopied ? hc : 'var(--border)'}`, color: isCopied ? hc : 'var(--muted-foreground)', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {isCopied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && topics.length === 0 && !error && (
        <EmptyState
          icon={Bot}
          title="Select a category above to launch the agent"
          description="The agent will scan Google News + Reddit and return real trends with post ideas"
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
