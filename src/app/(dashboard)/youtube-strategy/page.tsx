"use client";

import React, { useState, useEffect } from 'react';
import { Youtube, Check, Copy, Zap, PenTool, Film } from 'lucide-react';
import { addBriefToGrowthWorkspace } from '@/lib/growth-workspace';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

const FEATURES = [
  { id: '5', label: 'Video Titles', icon: PenTool, desc: '20 clickable title options' },
  { id: '7', label: 'Full Video Script', icon: Film, desc: 'Long-form YouTube script' },
  { id: '8', label: 'Shorts Script', icon: Film, desc: '45–60 second script' },
  { id: '9', label: 'Video Description', icon: PenTool, desc: 'Search-friendly description' },
];

type WorkflowBrief = {
  origin?: string;
  niche?: string;
  title?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  publishedAt?: string;
  youtubeAngle?: string;
  content?: string;
  hook?: string;
  evergreenReason?: string;
};

type GenerationResult = { content: string; error?: string };

export default function YouTubeStrategyPage() {
  const [activeTab, setActiveTab] = useState('5');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [importedBrief, setImportedBrief] = useState<WorkflowBrief | null>(null);

  const [profile, setProfile] = useState({
    channelName: '', niche: '', audience: '', pillars: '',
    videoLength: '8-12 min', uploadFrequency: 'Weekly',
    subscribers: '', goal: 'Grow subscribers & monetize',
    uniqueAngle: '', currentProblem: 'Low CTR', tone: 'Educational & Engaging'
  });

  const [inputs, setInputs] = useState<Record<string, string>>({});

  const handleInput = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const saved = localStorage.getItem('youtubeStrategySetup');
    if (saved) { try { setProfile(JSON.parse(saved)); } catch {} }
    const params = new URLSearchParams(window.location.search);
    const niche = params.get('niche');
    if (niche) {
      setProfile(current => ({ ...current, niche }));
      setInputs(current => ({
        ...current,
        p5_topic: niche,
        p7_title: niche,
        p7_topic: niche,
        p8_topic: niche,
        p9_desc: `Create a YouTube description about ${niche}.`,
      }));
    }
    const requestedTool = params.get('tool');
    if (requestedTool && FEATURES.some(feature => feature.id === requestedTool)) setActiveTab(requestedTool);
    if (params.get('useBrief') === '1') {
      const stored = localStorage.getItem('activeContentBrief');
      if (stored) {
        try {
          const brief = JSON.parse(stored) as WorkflowBrief;
          if (brief.origin === 'trend-scout' || brief.origin === 'evergreen-lab') {
            const title = brief.title || brief.sourceTitle || '';
            setImportedBrief(brief);
            setActiveTab(requestedTool || '5');
            setInputs(current => ({
              ...current,
              p5_topic: title,
              p7_topic: title,
              p7_title: title,
              p8_topic: title,
              p9_desc: brief.content || `Create a YouTube description about ${title}.`,
            }));
          }
        } catch {}
      }
    }
  }, []);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopiedMap(prev => ({ ...prev, [key]: false })), 2000);
  };

  const generate = async (promptId: number, payload: Record<string, unknown> = {}) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const workflowBrief = localStorage.getItem('activeContentBrief') || '';
      const res = await fetch('/api/youtube-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, profile, ...payload, workflowBrief }),
      });
      const data = (await res.json()) as GenerationResult;
      if (data.error) throw new Error(data.error);
      setResult(data);
      let priorBrief: Record<string, unknown> = {};
      try { priorBrief = JSON.parse(workflowBrief || '{}'); } catch {}
      const nextBrief = { ...priorBrief, title: String(priorBrief.title || `YouTube content: ${profile.niche}`), niche: profile.niche, platform: 'YouTube', promptId, generatedContent: data.content || '', content: data.content || priorBrief.content || '', savedAt: new Date().toISOString() };
      localStorage.setItem('activeContentBrief', JSON.stringify(nextBrief));
      addBriefToGrowthWorkspace(nextBrief);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Unable to generate YouTube content.'); }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      <PageHeader eyebrow="Platforms" title="YouTube" description="Turn topics into clickable titles, long-form scripts, Shorts hooks and search-friendly descriptions." />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', padding: '8px 12px', textTransform: 'uppercase' }}>Create for YouTube</div>
          {FEATURES.map(feat => {
            const Icon = feat.icon;
            const isActive = activeTab === feat.id;
            return (
              <button key={feat.id} onClick={() => { setActiveTab(feat.id); setResult(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: 'none', background: isActive ? 'var(--butter-bg)' : 'transparent', color: isActive ? 'var(--butter-ink)' : 'var(--muted-foreground)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s' }}>
                <Icon size={16} color={isActive ? 'var(--butter-ink)' : 'var(--muted-foreground)'} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{feat.label}</div>
                  <div style={{ fontSize: 11, marginTop: 2, opacity: 0.75 }}>{feat.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {importedBrief && (
            <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--butter)', background: 'var(--butter-bg)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--butter-ink)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>Live Trend Scout brief imported</div>
              <div style={{ fontSize: 15, fontWeight: 750, color: 'var(--foreground)', lineHeight: 1.45 }}>{importedBrief.title || importedBrief.sourceTitle}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                {importedBrief.publishedAt && <span>Published {new Date(importedBrief.publishedAt).toLocaleString()}</span>}
                {importedBrief.sourceUrl && <a href={importedBrief.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--butter-ink)', fontWeight: 700 }}>Open live source</a>}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>Video Titles is selected and pre-filled. The same topic is ready in Full Video Script, Shorts Script, and Video Description.</div>
            </div>
          )}
          <div className="card" style={{ padding: 24 }}>
            {activeTab === '5' && (
              <PromptSection loading={loading} title="Video Titles" desc="Generate 20 clickable YouTube title options for the selected topic." action={() => generate(5, { topic: inputs.p5_topic })} disabled={!inputs.p5_topic}>
                <InputField label="Video Topic" value={inputs.p5_topic || ''} onChange={(v:string) => handleInput('p5_topic', v)} />
              </PromptSection>
            )}
            {activeTab === '7' && (
              <PromptSection loading={loading} title="Full Video Script" desc="Write a complete long-form script with a strong hook, evidence, retention beats, and CTA." action={() => generate(7, { topic: inputs.p7_topic, title: inputs.p7_title, length: inputs.p7_length })} disabled={!inputs.p7_topic || !inputs.p7_title}>
                <InputField label="Video Title" value={inputs.p7_title || ''} onChange={(v:string) => handleInput('p7_title', v)} />
                <InputField label="Video Topic" value={inputs.p7_topic || ''} onChange={(v:string) => handleInput('p7_topic', v)} />
                <InputField label="Target Length" value={inputs.p7_length || '8-12 min'} onChange={(v:string) => handleInput('p7_length', v)} placeholder="e.g. 8-12 min" />
              </PromptSection>
            )}
            {activeTab === '8' && (
              <PromptSection loading={loading} title="Shorts Script" desc="Write a 45–60 second YouTube Shorts script with a fast hook and payoff." action={() => generate(8, { topic: inputs.p8_topic })} disabled={!inputs.p8_topic}>
                <InputField label="Shorts Topic" value={inputs.p8_topic || ''} onChange={(v:string) => handleInput('p8_topic', v)} />
              </PromptSection>
            )}
            {activeTab === '9' && (
              <PromptSection loading={loading} title="Video Description" desc="Write a search-friendly YouTube description with key points, chapters guidance, and CTA." action={() => generate(9, { contentDesc: inputs.p9_desc })} disabled={!inputs.p9_desc}>
                <div style={{ marginBottom: 12 }}>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>Video topic and key points</label>
                  <textarea value={inputs.p9_desc || ''} onChange={e => handleInput('p9_desc', e.target.value)} className="input-field" rows={3} placeholder="Describe your video/post..." />
                </div>
              </PromptSection>
            )}
          </div>

          {(loading || result || activeTab !== '0') && (
            <div>
              {loading ? (
                <SkeletonCard lines={2} />
              ) : error ? (
                <div className="card" style={{ color: 'var(--rose-ink)', whiteSpace: 'pre-wrap' }}>{error}</div>
              ) : result ? (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} /> AI Output</h3>
                    <button onClick={() => copy(result.content, 'result')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: copiedMap['result'] ? 'var(--sage-bg)' : 'var(--muted)', border: `1px solid ${copiedMap['result'] ? 'var(--sage)' : 'var(--border)'}`, color: copiedMap['result'] ? 'var(--sage-ink)' : 'var(--muted-foreground)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>
                      {copiedMap['result'] ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy All</>}
                    </button>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: 'var(--foreground)', background: 'var(--muted)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', maxHeight: 600, overflowY: 'auto' }}>
                    {result.content}
                  </div>
                </div>
              ) : activeTab !== '0' ? (
                <div className="card">
                  <EmptyState icon={Youtube} title="Ready to Generate" description="Fill in the details above and hit Generate." />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fade-in .3s ease forwards}`}</style>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="label" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
    </div>
  );
}

function PromptSection({ title, desc, children, action, disabled, loading }: { title: string; desc: string; children?: React.ReactNode; action: () => void; disabled?: boolean; loading: boolean }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>{desc}</p>
      {children}
      <button onClick={action} disabled={disabled || loading} className="btn-primary" style={{ marginTop: 16, width: '100%' }}>
        {loading ? 'Generating… this can take 30–60 seconds' : 'Generate'}
      </button>
    </div>
  );
}
