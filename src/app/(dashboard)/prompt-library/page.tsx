"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowRight, PenTool, Youtube, Instagram, Linkedin, Globe, Twitter, Layers, Film, Rocket, Image as ImageIcon, Activity, Zap, Target, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const CATEGORIES = [
  {
    id: 'instagram',
    title: 'Instagram Content Engine',
    icon: <Instagram size={20} color="#ec4899" />,
    color: '#ec4899',
    features: [
      { id: 105, title: 'Reel Script', icon: <Film size={18} />, path: '/instagram', desc: 'Create a concise hook-to-CTA short-form script.' },
      { id: 106, title: 'Instagram Carousel', icon: <Layers size={18} />, path: '/instagram', desc: 'Create 10 connected educational slides.' },
      { id: 107, title: 'Story Sequence', icon: <PenTool size={18} />, path: '/instagram', desc: 'Create 7 connected stories that drive action.' },
      { id: 108, title: 'Instagram Caption', icon: <PenTool size={18} />, path: '/instagram', desc: 'Write a search-friendly caption with CTA.' },
    ]
  },
  {
    id: 'linkedin',
    title: 'LinkedIn Content Engine',
    icon: <Linkedin size={20} color="#0077b5" />,
    color: '#0077b5',
    features: [
      { id: 201, title: 'LinkedIn Post', icon: <PenTool size={18} />, path: '/linkedin', desc: 'Generate a ready-to-publish evidence-led post.' },
      { id: 202, title: 'Document Carousel', icon: <Layers size={18} />, path: '/linkedin', desc: 'Create 8–12 connected educational slides.' },
      { id: 203, title: 'Native Video Script', icon: <Film size={18} />, path: '/linkedin', desc: 'Create a 60–90 second native video script.' },
    ]
  },
  {
    id: 'x',
    title: 'X Content Engine',
    icon: <Twitter size={20} color="#1da1f2" />,
    color: '#1da1f2',
    features: [
      { id: 304, title: 'X Post', icon: <Twitter size={18} />, path: '/x', desc: 'Write one concise, discussion-ready post.' },
      { id: 305, title: 'X Thread', icon: <Layers size={18} />, path: '/x', desc: 'Write 6–12 connected posts.' },
    ]
  },
  {
    id: 'youtube',
    title: 'YouTube Content Engine',
    icon: <Youtube size={20} color="#ff0000" />,
    color: '#ff0000',
    features: [
      { id: 405, title: 'Video Titles', icon: <PenTool size={18} />, path: '/youtube-strategy', desc: 'Generate 20 clickable title options.' },
      { id: 407, title: 'Full Video Script', icon: <Film size={18} />, path: '/youtube-strategy', desc: 'Create a complete long-form script.' },
      { id: 408, title: 'Shorts Script', icon: <Film size={18} />, path: '/youtube-strategy', desc: 'Create a 45–60 second Shorts script.' },
      { id: 409, title: 'Video Description', icon: <PenTool size={18} />, path: '/youtube-strategy', desc: 'Write a search-friendly description and CTA.' },
    ]
  },
  {
    id: 'omnichannel',
    title: 'Omnichannel & AI Tools',
    icon: <Globe size={20} color="#8b5cf6" />,
    color: '#8b5cf6',
    features: [
      { id: 502, title: 'AI Media Generation', icon: <ImageIcon size={18} />, path: '/ai-media', desc: 'Generate custom AI images and video assets.' },
      { id: 504, title: 'Personal Brand Automation', icon: <Rocket size={18} />, path: '/autopilot', desc: 'Set your entire content system on fully automated pilot.' },
      { id: 505, title: 'Weekly Progress Report', icon: <Activity size={18} />, path: '/performance/weekly-report', desc: 'AI-generated summary of your weekly growth.' },
      { id: 506, title: 'Viral Grader', icon: <CheckCircle size={18} />, path: '/viral-grader', desc: 'Grade your post against 10K viral posts before you publish.' },
      { id: 507, title: 'Pitchdeck Generator', icon: <FileText size={18} />, path: '/pitchdeck', desc: 'Generate stunning investor pitch decks instantly.' },
    ]
  }
];

export default function PromptLibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [nicheInput, setNicheInput] = useState('');
  const [niches, setNiches] = useState<string[]>([]);
  const [activeNiche, setActiveNiche] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('contentResearchNiches');
    queueMicrotask(() => {
      if (saved) {
        try {
          const values = JSON.parse(saved);
          if (Array.isArray(values)) setNiches(values.filter(value => typeof value === 'string'));
        } catch { /* ignore malformed local preferences */ }
      }
      setActiveNiche(localStorage.getItem('activeContentNiche') || '');
    });
  }, []);

  const addNiche = () => {
    const value = nicheInput.trim();
    if (!value) return;
    const next = [value, ...niches.filter(item => item.toLowerCase() !== value.toLowerCase())].slice(0, 12);
    setNiches(next);
    setActiveNiche(value);
    setNicheInput('');
    localStorage.setItem('contentResearchNiches', JSON.stringify(next));
    localStorage.setItem('activeContentNiche', value);
  };

  const selectNiche = (value: string) => {
    setActiveNiche(value);
    localStorage.setItem('activeContentNiche', value);
  };

  const resolveLaunch = (categoryId: string, feature: { id: number; path: string }) => {
    if (categoryId === 'instagram' && feature.id >= 101 && feature.id <= 116) {
      const tools: Record<number, string> = {
        101: '1', 102: '1', 103: '2', 104: '8', 105: '3', 106: '4', 107: '5', 108: '6',
        109: '7', 110: '9', 111: '13', 112: '14', 113: '10', 114: '11', 115: '15', 116: '16',
      };
      return { path: '/instagram', tool: tools[feature.id], mode: feature.id === 102 ? 'audio' : '' };
    }
    if (categoryId === 'x') return { path: '/x', tool: String(feature.id - 300), mode: '' };
    if (categoryId === 'youtube') return { path: '/youtube-strategy', tool: String(feature.id - 400), mode: '' };
    if (categoryId === 'linkedin' && feature.id === 201) return { path: '/linkedin', tool: '4', mode: '' };
    if (categoryId === 'linkedin' && feature.id === 202) return { path: '/linkedin', tool: '5', mode: '' };
    if (categoryId === 'linkedin' && feature.id === 203) return { path: '/linkedin', tool: '6', mode: '' };
    return { path: feature.path, tool: '', mode: '' };
  };

  const launchFeature = (categoryId: string, feature: { id: number; title: string; path: string }) => {
    const launch = resolveLaunch(categoryId, feature);
    const params = new URLSearchParams();
    if (activeNiche) params.set('niche', activeNiche);
    if (launch.tool) params.set('tool', launch.tool);
    if (launch.mode) params.set('mode', launch.mode);
    params.set('library', '1');
    let existing: Record<string, unknown> = {};
    try { existing = JSON.parse(localStorage.getItem('activeContentBrief') || '{}'); } catch {}
    const keepEvidence = Boolean(existing.sourceUrl) && (!activeNiche || existing.niche === activeNiche);
    const platform = categoryId === 'x' ? 'X/Twitter' : categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
    localStorage.setItem('activeContentBrief', JSON.stringify({
      ...(keepEvidence ? existing : {}),
      origin: keepEvidence ? 'trend-scout' : 'master-prompt',
      niche: activeNiche || existing.niche || '',
      platform,
      promptId: launch.tool || feature.id,
      promptTitle: feature.title,
      savedAt: new Date().toISOString(),
    }));
    params.set('useBrief', '1');
    const query = params.toString();
    router.push(query ? `${launch.path}${launch.path.includes('?') ? '&' : '?'}${query}` : launch.path);
  };

  const visibleCategories = activeTab === 'all' ? CATEGORIES : CATEGORIES.filter(c => c.id === activeTab);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      <PageHeader
        eyebrow="Create"
        title="Prompt library"
        description="Ready-made prompts and shortcuts to every tool."
        actions={
          <select
            id="platform-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="input-field"
            style={{ minWidth: 200, cursor: 'pointer' }}
          >
            <option value="all">All platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="x">X (Twitter)</option>
            <option value="youtube">YouTube</option>
            <option value="omnichannel">Omnichannel & AI</option>
          </select>
        }
      />

      <div className="card" style={{ marginBottom: 34, padding: 20, border: '1px solid var(--sky)', background: 'var(--sky-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--card)', color: 'var(--sky-ink)', flexShrink: 0 }}><Zap size={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--foreground)' }}>Every prompt follows the Live Evidence → Action system</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10, marginTop: 12 }}>
              {[
                ['1. Research', 'Search current public web sources for the prompt and niche.'],
                ['2. Analyze', 'Separate confirmed evidence from assumptions and gaps.'],
                ['3. Act', 'Return Today, This week, and Validate action points.'],
                ['4. Verify', 'Show source URLs and timestamps so you can check them.'],
              ].map(([title, description]) => <div key={title} style={{ padding: 11, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)' }}><div style={{ fontSize: 11, fontWeight: 900, color: 'var(--sky-ink)' }}>{title}</div><div style={{ fontSize: 11, lineHeight: 1.45, color: 'var(--muted-foreground)', marginTop: 4 }}>{description}</div></div>)}
            </div>
            <div style={{ marginTop: 11, fontSize: 11, color: 'var(--muted-foreground)' }}>No social connection is required. Private platform analytics are excluded from this research mode.</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 34, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}><Target size={18} style={{ color: 'var(--sky-ink)' }} /><div style={{ fontSize: 15, fontWeight: 900, color: 'var(--foreground)' }}>Research niches</div></div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 13 }}>Add your niches once, select one, and it will be passed into every launched prompt.</div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          <input value={nicheInput} onChange={event => setNicheInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') addNiche(); }} placeholder="e.g. AI tools for small businesses" style={{ flex: '1 1 280px', minWidth: 0, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)' }} />
          <button type="button" onClick={addNiche} style={{ border: 0, borderRadius: 9, padding: '10px 15px', background: 'var(--primary)', color: 'var(--background)', fontWeight: 800, cursor: 'pointer' }}>Add niche</button>
        </div>
        {niches.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 13 }}>{niches.map(niche => <button type="button" key={niche} onClick={() => selectNiche(niche)} style={{ border: `1px solid ${activeNiche === niche ? 'var(--sky-ink)' : 'var(--border)'}`, borderRadius: 999, padding: '7px 11px', background: activeNiche === niche ? 'var(--sky-bg)' : 'transparent', color: activeNiche === niche ? 'var(--sky-ink)' : 'var(--foreground)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{activeNiche === niche ? '✓ ' : ''}{niche}</button>)}</div>}
        <div style={{ marginTop: 11, fontSize: 11, color: activeNiche ? 'var(--sky-ink)' : 'var(--muted-foreground)' }}>{activeNiche ? `Active niche: ${activeNiche}` : 'No active niche selected yet.'}</div>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 50 }}>
        {visibleCategories.map(category => (
          <div key={category.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: `2px solid ${category.color}30`, paddingBottom: 10 }}>
              <div style={{ background: `${category.color}15`, padding: 8, borderRadius: 8 }}>
                {category.icon}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>{category.title}</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {category.features.map((feat) => (
                <div key={feat.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 20, border: '1px solid var(--border)', background: 'var(--card)', transition: 'all 0.2s', cursor: 'pointer', borderRadius: '12px' }}
                  onClick={() => launchFeature(category.id, feat)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = category.color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px -8px ${category.color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${category.color}15`, color: category.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {feat.icon}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.3 }}>{feat.title}</h3>
                      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4, lineHeight: 1.5 }}>{feat.desc}</p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)' }}>Live web + action points</span>
                    <ArrowRight size={16} color={category.color} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
