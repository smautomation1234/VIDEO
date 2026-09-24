"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Search, Newspaper, Users, Zap, Copy, Check, ExternalLink, RefreshCw, Bot, ChevronRight, Sparkles, LayoutGrid, TrendingUp, Activity, Target, Layers } from 'lucide-react';
import { ErrorBanner } from '@/components/ui/Helpers';
import EmptyState from '@/components/ui/EmptyState';

const FORMAT_COLORS: Record<string, string> = {
  'Reel': '#ec4899', 'Carousel': '#8b5cf6', 'LinkedIn Post': '#0077b5',
  'Twitter Thread': '#1da1f2', 'YouTube Short': '#ef4444', 'YouTube': '#ef4444',
  'Trending': '#ef4444', 'Evergreen': '#10b981',
};
const CATEGORY_COLORS: Record<string, string> = {
  'Educational': '#3b82f6', 'Entertaining': '#ec4899', 'Inspiring': '#f59e0b',
  'Controversial': '#ef4444', 'How-To': '#10b981',
};
const DIFFICULTY_COLORS: Record<string, string> = {
  'Easy': '#10b981', 'Medium': '#f59e0b', 'Hard': '#ef4444',
};
const URGENCY_COLORS: Record<string, string> = {
  'Post today': '#ef4444', 'Post this week': '#f59e0b',
};

const NICHE_PRESETS = [
  'Real Estate', 'Finance & Investing', 'AI & Tech', 'SaaS Founders',
  'Digital Marketing', 'Health & Fitness', 'Personal Development',
  'E-Commerce', 'Leadership', 'Content Creation',
];

const MODES = [
  { id: 'niche_ideas',    icon: <Lightbulb size={18} />,    label: 'Niche Ideas',      desc: '40 ideas — 10 per platform (LinkedIn, IG, X, YouTube)', color: '#8b5cf6' },
  { id: 'top_creators',   icon: <Users size={18} />,        label: 'Top Creators',     desc: 'Find top creators & steal their best angles',             color: '#3b82f6' },
  { id: 'competitor_gap', icon: <Target size={18} />,       label: 'Competitor Gap',   desc: 'Input 3 competitors → 10 ranked opportunities', color: '#f59e0b' },
  { id: 'evergreen_vs_trending', icon: <Layers size={18} />, label: 'Evergreen vs Trending', desc: 'Paste topic list → classified & sorted', color: '#10b981' },
  { id: 'news_to_ideas',  icon: <Newspaper size={18} />,    label: 'News → Ideas',     desc: '40 ideas from today\'s news — 10 per platform',           color: '#10b981' },
  { id: 'viral_formula',  icon: <Sparkles size={18} />,     label: 'Viral Formula',    desc: 'Decode the hook & emotion formulas for IG',               color: '#ec4899' },
  { id: 'trending_now',   icon: <TrendingUp size={18} />,   label: 'Trending Now',     desc: 'Real signals from Google News + Reddit — zero fake data', color: '#ef4444' },
];

const HOOK_COLORS: Record<string, string> = {
  'Contrarian': '#f43f5e', 'Curiosity Gap': '#8b5cf6', 'Data-Backed': '#3b82f6',
  'Social Proof': '#10b981', 'Insider Knowledge': '#f59e0b',
};

function TrendCard({ trend, onCopy, copied }: { trend: any; onCopy: () => void; copied: boolean }) {
  const router = useRouter();
  const score = typeof trend.trendScore === 'number' ? trend.trendScore : 8.5;
  const hc = HOOK_COLORS[trend.hookType] || '#ef4444';
  const uc = trend.urgency === 'Post today' ? '#ef4444' : '#f59e0b';
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: `3px solid ${hc}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: `${hc}18`, color: hc, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{trend.hookType || 'Trending'}</span>
          {trend.urgency && <span style={{ background: `${uc}18`, color: uc, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{trend.urgency}</span>}
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: score >= 9 ? '#ef4444' : score >= 8 ? '#f59e0b' : '#10b981' }}>Potential {score.toFixed(1)}/10</span>
      </div>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, lineHeight: 1.45 }}>{trend.headline}</h3>
        {trend.whyTrending && <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5, marginBottom: 6 }}>{trend.whyTrending}</p>}
        {trend.contentAngle && (
          <div style={{ fontSize: 12, color: '#f59e0b', fontStyle: 'italic', padding: '6px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
            {trend.contentAngle}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {trend.platform && <span style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: 11, padding: '2px 8px', borderRadius: 8 }}>{trend.platform}</span>}
          {trend.sourceName && <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{String(trend.sourceName).slice(0, 30)}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {trend.sourceUrl && (
            <a href={trend.sourceUrl} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '5px 10px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(16,185,129,0.2)' }}>
              <ExternalLink size={10} /> View Source
            </a>
          )}
          <button onClick={() => router.push(`/studio?topic=${encodeURIComponent(trend.headline || '')}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', border: 'none' }}>
            <Zap size={11} /> Create Post
          </button>
          <button onClick={onCopy}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? 'rgba(16,185,129,0.1)' : 'var(--muted)', border: `1px solid ${copied ? '#10b981' : 'var(--border)'}`, color: copied ? '#10b981' : 'var(--muted-foreground)', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function IdeaCard({ idea, copied, onCopy }: { idea: any; copied: boolean; onCopy: () => void }) {
  const router = useRouter();
  const fc = FORMAT_COLORS[idea.format] || '#8b5cf6';
  const cc = CATEGORY_COLORS[idea.category] || '#64748b';
  const dc = DIFFICULTY_COLORS[idea.difficulty] || '#64748b';
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden', borderTop: `3px solid ${fc}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ background: `${fc}18`, color: fc, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{idea.format}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {idea.difficulty && <span style={{ background: `${dc}18`, color: dc, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>{idea.difficulty}</span>}
          {idea.estimatedReach && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>{idea.estimatedReach}</span>}
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>{idea.title}</h3>
        {idea.hook && (
          <div style={{ fontSize: 13, color: '#f59e0b', fontStyle: 'italic', marginBottom: 6, padding: '6px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
            "{idea.hook}"
          </div>
        )}
        {idea.angle && <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{idea.angle}</p>}
        {idea.whyItWorks && <p style={{ fontSize: 12, color: '#10b981', marginTop: 6 }}>✓ {idea.whyItWorks}</p>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: 11, padding: '2px 8px', borderRadius: 8 }}>{idea.platform}</span>
          {idea.category && <span style={{ background: `${cc}15`, color: cc, fontSize: 11, padding: '2px 8px', borderRadius: 8 }}>{idea.category}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => router.push(`/studio?topic=${encodeURIComponent(idea.title)}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', border: 'none' }}>
            <Zap size={11} /> Create Post
          </button>
          <button onClick={() => router.push(`/carousel?topic=${encodeURIComponent(idea.title)}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#8b5cf6', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', border: 'none' }}>
            <LayoutGrid size={11} /> Carousel
          </button>
          <button onClick={onCopy}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? 'rgba(16,185,129,0.1)' : 'var(--muted)', border: `1px solid ${copied ? '#10b981' : 'var(--border)'}`, color: copied ? '#10b981' : 'var(--muted-foreground)', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy Idea</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreatorCard({ creator }: { creator: any }) {
  const [copied, setCopied] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const color = creator.color || '#8b5cf6';
  const isVideoPlatform = (creator.platform || '').toLowerCase().match(/youtube|instagram|tiktok/);
  const contentType = isVideoPlatform ? 'Videos' : 'Posts';
  
  let profileUrl = creator.profileUrl;
  if (!profileUrl && creator.username) {
    const cleanUser = creator.username.replace(/^@/, '').trim();
    const plat = (creator.platform || '').toLowerCase();
    if (plat.includes('youtube')) profileUrl = `https://youtube.com/@${cleanUser}`;
    else if (plat.includes('instagram')) profileUrl = `https://instagram.com/${cleanUser}`;
    else if (plat.includes('twitter') || plat.includes('x')) profileUrl = `https://twitter.com/${cleanUser}`;
    else if (plat.includes('linkedin')) profileUrl = `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(creator.name || cleanUser)}`;
    else profileUrl = `https://google.com/search?q=${encodeURIComponent(cleanUser + ' ' + creator.platform)}`;
  } else if (!profileUrl) {
    profileUrl = `https://google.com/search?q=${encodeURIComponent(creator.name + ' ' + (creator.platform || ''))}`;
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {creator.name?.[0] || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            {profileUrl ? (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--foreground)', textDecoration: 'none' }} className="hover:underline">
                {creator.name}
              </a>
            ) : (
              <span>{creator.name}</span>
            )}
            {profileUrl && (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted-foreground)' }}>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ background: `${color}15`, color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{creator.platform}</span>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{creator.followers}</span>
            {creator.growthRate && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>{creator.growthRate}</span>}
          </div>
        </div>
      </div>
      {creator.contentStyle && <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}><strong>Style:</strong> {creator.contentStyle}</p>}
      {creator.bestPerforming && <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}><strong>Best:</strong> {creator.bestPerforming}</p>}
      {creator.stealAndSpin && (
        <div style={{ padding: '10px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, borderLeft: '3px solid #10b981' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>Remix this idea</div>
          <p style={{ fontSize: 12, color: 'var(--foreground)', lineHeight: 1.5 }}>{creator.stealAndSpin}</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        <button onClick={() => { navigator.clipboard.writeText(creator.stealAndSpin || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? 'rgba(16,185,129,0.1)' : 'var(--muted)', border: `1px solid ${copied ? '#10b981' : 'var(--border)'}`, color: copied ? '#10b981' : 'var(--muted-foreground)', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy Idea</>}
        </button>
        {creator.topVideos && creator.topVideos.length > 0 && (
          <button onClick={() => setShowVideos(!showVideos)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            {showVideos ? `Hide ${contentType}` : `View Top ${contentType}`}
          </button>
        )}
      </div>

      {showVideos && creator.topVideos && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--card)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', maxHeight: 300, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground)', marginBottom: 2, position: 'sticky', top: -12, background: 'var(--card)', paddingTop: 12, paddingBottom: 4, zIndex: 2 }}>5 Most Popular {contentType}</div>
          {creator.topVideos.map((video: any, i: number) => {
            if (!isVideoPlatform) {
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8, borderBottom: i !== creator.topVideos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: color }}>•</span> {video.title}
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--muted-foreground)' }}>
                    <span>{video.views} views</span>
                    <span>{video.date}</span>
                  </div>
                </div>
              );
            }

            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(creator.name + ' ' + video.title)}`;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8, borderBottom: i !== creator.topVideos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <a href={searchUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: 6 }} className="hover:underline">
                  <span style={{ color: color }}>▶</span> {video.title}
                </a>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--muted-foreground)' }}>
                  <span>{video.views} views</span>
                  <span>{video.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewsIdeaCard({ item }: { item: any }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const uc = URGENCY_COLORS[item.urgency] || '#f59e0b';
  const fc = FORMAT_COLORS[item.format] || '#8b5cf6';
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: `3px solid ${uc}` }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {item.urgency && <span style={{ background: `${uc}18`, color: uc, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{item.urgency}</span>}
        <span style={{ background: `${fc}18`, color: fc, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{item.format}</span>
      </div>
      {item.newsHeadline && (
        <div style={{ padding: '8px 10px', background: 'var(--muted)', borderRadius: 6, borderLeft: '3px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase' }}>
            {item.newsSource}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{item.newsHeadline}</div>
          {item.newsUrl && (
            <a href={item.newsUrl} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, textDecoration: 'none' }}>
              <ExternalLink size={10} /> Read more
            </a>
          )}
        </div>
      )}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{item.contentIdea}</h3>
        {item.hook && <div style={{ fontSize: 12, color: '#f59e0b', fontStyle: 'italic', marginBottom: 5 }}>Hook: "{item.hook}"</div>}
        {item.angle && <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{item.angle}</p>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: 11, padding: '2px 8px', borderRadius: 8 }}>{item.platform}</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => router.push(`/studio?topic=${encodeURIComponent(item.contentIdea)}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', border: 'none' }}>
            <Zap size={11} /> Create Post
          </button>
          <button onClick={() => router.push(`/carousel?topic=${encodeURIComponent(item.contentIdea)}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#8b5cf6', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', border: 'none' }}>
            <LayoutGrid size={11} /> Carousel
          </button>
          <button onClick={() => { navigator.clipboard.writeText(`${item.contentIdea}\n\nHook: "${item.hook}"\n\nAngle: ${item.angle}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? 'rgba(16,185,129,0.1)' : 'var(--muted)', border: `1px solid ${copied ? '#10b981' : 'var(--border)'}`, color: copied ? '#10b981' : 'var(--muted-foreground)', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IdeasEnginePage() {
  const [niche, setNiche] = useState('');
  const [country, setCountry] = useState('IN');
  const platform = 'Instagram';
  const [mode, setMode] = useState('niche_ideas');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [agentLog, setAgentLog] = useState<string[]>([]);

  const run = async () => {
    if (!niche.trim()) return;
    setLoading(true); setResult(null); setError(null);
    const steps = [
      `Agent activated for: "${niche}"`,
      `Searching the web via ChatGPT...`,
    ];
    setAgentLog(steps);

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim(), mode, country, platform, workflowContext: localStorage.getItem('activeContentBrief') || '' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      localStorage.setItem('activeContentBrief', JSON.stringify({ niche: niche.trim(), platform, mode, content: JSON.stringify(data), savedAt: new Date().toISOString() }));
      setAgentLog(prev => [
        ...prev,
        mode === 'trending_now'
          ? `Scraped ${data.rawSignalCount || 0} real signals (Google News + Reddit)`
          : `Web search complete — ${data.citations?.length || 0} sources found`,
        mode === 'trending_now'
          ? `Ranked ${(data.trends || []).length} real trending topics — zero fake data`
          : `Generated ${(data.ideas || data.creators || data.newsIdeas || []).length} ideas`,
      ]);
    } catch (e: any) {
      setError(e.message);
      setAgentLog(prev => [...prev, `Error: ${e.message}`]);
    }
    setLoading(false);
  };

  const currentMode = MODES.find(m => m.id === mode)!;
  const accentColor = currentMode.color;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderRadius: 12,
            border: `1px solid ${mode === m.id ? m.color : 'var(--border)'}`,
            background: mode === m.id ? `${m.color}12` : 'var(--card)',
            color: mode === m.id ? m.color : 'var(--muted-foreground)',
            fontWeight: mode === m.id ? 700 : 500, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s', textAlign: 'left',
            boxShadow: mode === m.id ? `0 0 16px ${m.color}20` : 'none',
          }}>
            <div style={{ color: m.color }}>{m.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 400 }}>{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--foreground)' }}>
          {mode === 'competitor_gap' ? 'Enter 3 competitors' : mode === 'evergreen_vs_trending' ? 'Paste topic list' : 'Enter your niche'}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder={
              mode === 'competitor_gap' ? 'e.g. @mkbhd, @mrwhosetheboss, @dave2d' :
              mode === 'evergreen_vs_trending' ? 'Paste topics (e.g. AI tools, productivity, setup tour)' :
              'e.g. "Real Estate", "AI Tools", "SaaS Founders"...'
            }
            value={niche}
            onChange={e => setNiche(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            style={{ flex: '1 1 200px', padding: '12px 16px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 14, outline: 'none' }}
          />
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 14, outline: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <option value="IN">India</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="ZA">South Africa</option>
            <option value="WW">Worldwide</option>
          </select>
          {/* Platform selector removed - Instagram only */}
          <button onClick={run} disabled={loading || !niche.trim()} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: loading ? 'var(--muted)' : accentColor,
            color: loading ? 'var(--muted-foreground)' : '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700,
            fontSize: 14, cursor: loading || !niche.trim() ? 'not-allowed' : 'pointer', flexShrink: 0,
          }}>
            {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Bot size={16} />}
            {loading ? 'Agent Searching...' : 'Generate Ideas'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {NICHE_PRESETS.map(p => (
            <button key={p} onClick={() => setNiche(p)}
              style={{ padding: '5px 12px', background: niche === p ? accentColor : 'var(--muted)', color: niche === p ? '#fff' : 'var(--muted-foreground)', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Log */}
      {agentLog.length > 0 && (
        <div style={{ background: 'var(--muted)', border: `1px solid ${accentColor}30`, borderRadius: 12, padding: 16, color: 'var(--muted-foreground)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Bot size={14} color={accentColor} />
            <span style={{ fontSize: 12, fontWeight: 700, color: accentColor, fontFamily: 'monospace' }}>Agent Log</span>
          </div>
          {agentLog.map((step, i) => (
            <div key={i} style={{ fontSize: 12, color: i === agentLog.length - 1 ? 'var(--foreground)' : 'var(--muted-foreground)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace' }}>
              <ChevronRight size={10} color={accentColor} style={{ flexShrink: 0 }} />{step}
            </div>
          ))}
          {loading && (
            <div style={{ fontSize: 12, color: accentColor, marginTop: 3, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChevronRight size={10} /><span style={{ animation: 'pulse 1s ease infinite' }}>Processing real-time web data...</span>
            </div>
          )}
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Summary */}
          {result.summary && (
            <div style={{ padding: '16px 20px', background: `${accentColor}10`, border: `1px solid ${accentColor}30`, borderRadius: 12, fontSize: 14, color: 'var(--foreground)', lineHeight: 1.65 }}>
              <span style={{ color: accentColor, fontWeight: 700 }}>Summary: </span>{result.summary}
            </div>
          )}

          {/* Niche Ideas, Competitor Gap, Evergreen vs Trending, Viral Formula (All return 'ideas') */}
          {['niche_ideas', 'competitor_gap', 'evergreen_vs_trending', 'viral_formula'].includes(mode) && result.ideas?.length > 0 && (
            <>
              {result.topFormats?.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {result.topFormats.map((tf: any, i: number) => (
                    <div key={i} style={{ padding: '10px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: FORMAT_COLORS[tf.format] || '#8b5cf6' }}>{tf.format}</span>
                      <span style={{ color: '#10b981', fontWeight: 700, margin: '0 6px' }}>{tf.avgViews}</span>
                      <span style={{ color: 'var(--muted-foreground)' }}>avg views · {tf.reason}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {result.ideas.map((idea: any, i: number) => (
                  <IdeaCard key={idea.id || i} idea={idea}
                    copied={copiedId === String(idea.id || i)}
                    onCopy={() => { navigator.clipboard.writeText(`${idea.title}\n\nHook: "${idea.hook}"\n\nAngle: ${idea.angle}\n\nFormat: ${idea.format} on ${idea.platform}`); setCopiedId(String(idea.id || i)); setTimeout(() => setCopiedId(null), 2000); }} />
                ))}
              </div>
            </>
          )}

          {/* Top Creators */}
          {mode === 'top_creators' && result.creators?.length > 0 && (
            <>
              {result.patterns?.length > 0 && (
                <div style={{ padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, marginBottom: 8 }}>Common patterns among top creators</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {result.patterns.map((p: string, i: number) => (
                      <span key={i} style={{ fontSize: 12, background: 'var(--muted)', color: 'var(--muted-foreground)', padding: '4px 10px', borderRadius: 20 }}>• {p}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {result.creators.map((c: any, i: number) => <CreatorCard key={c.id || i} creator={c} />)}
              </div>
            </>
          )}

          {/* News to Ideas */}
          {mode === 'news_to_ideas' && result.newsIdeas?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {result.newsIdeas.map((item: any, i: number) => <NewsIdeaCard key={item.id || i} item={item} />)}
            </div>
          )}

          {/* Trending Now — Real Signal Cards */}
          {mode === 'trending_now' && result.trends?.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10 }}>
                <Activity size={14} color="#ef4444" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>LIVE DATA</span>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                  {result.rawSignalCount || result.citations?.length || 0} real signals scraped from Google News + Reddit · Ranked by GPT-5.6
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {result.trends.map((trend: any, i: number) => (
                  <TrendCard key={trend.id || i} trend={trend}
                    copied={copiedId === String(trend.id || i)}
                    onCopy={() => { navigator.clipboard.writeText(`${trend.headline}\n\nWhy trending: ${trend.whyTrending}\n\nContent angle: ${trend.contentAngle}\n\nSource: ${trend.sourceUrl}`); setCopiedId(String(trend.id || i)); setTimeout(() => setCopiedId(null), 2000); }} />
                ))}
              </div>
            </>
          )}

          {/* Citations */}
          {result.citations?.length > 0 && (
            <div style={{ padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: 8 }}>Sources used</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.citations.slice(0, 8).map((c: any, i: number) => (
                  <a key={i} href={c.url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: accentColor, background: `${accentColor}10`, padding: '3px 10px', borderRadius: 20, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ExternalLink size={9} />{c.title?.slice(0, 30) || 'Source'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !result && !error && (
        <EmptyState
          icon={Lightbulb}
          title="Enter your niche to get started"
          description="The AI agent will search the web and generate ideas tailored to your space"
        />
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
