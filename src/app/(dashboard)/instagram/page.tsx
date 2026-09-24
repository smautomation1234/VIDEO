"use client";

import React, { useState, useEffect } from 'react';
import { 
  Instagram, Check, Copy, Zap, PenTool, MessageSquare, Film, Image
} from 'lucide-react';
import { addBriefToGrowthWorkspace } from '@/lib/growth-workspace';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

const FEATURES = [
  { id: '3', label: 'Reel Script', icon: Film, desc: 'Short-form video script' },
  { id: '4', label: 'Carousel', icon: Image, desc: '10 connected slides' },
  { id: '5', label: 'Story Sequence', icon: MessageSquare, desc: '7 connected stories' },
  { id: '6', label: 'Caption', icon: PenTool, desc: 'Search-friendly caption' },
];

type GenerationResult = { content: string; error?: string };

export default function InstagramSystemPage() {
  const [activeTab, setActiveTab] = useState('3');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  const [profile, setProfile] = useState({
    handle: '', niche: '', audience: '', pillars: '',
    contentTypes: 'Reels, Carousels', frequency: 'Daily',
    followers: '', goal: 'Grow audience & get brand deals',
    uniqueAngle: '', currentProblem: 'Low reach on Reels', tone: 'Educational & Inspiring'
  });

  const [p3Topic, setP3Topic] = useState('');
  const [p3Tone, setP3Tone] = useState('Educational');
  const [p4Topic, setP4Topic] = useState('');
  const [p5Topic, setP5Topic] = useState('');
  const [p6Topic, setP6Topic] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('instagramProfileSetup');
    if (saved) { try { setProfile(JSON.parse(saved)); } catch {} }
    const params = new URLSearchParams(window.location.search);
    const niche = params.get('niche');
    const requestedTool = params.get('tool');
    if (requestedTool && FEATURES.some(feature => feature.id === requestedTool)) setActiveTab(requestedTool);
    if (niche) {
      setProfile(current => ({ ...current, niche }));
      setP3Topic(niche); setP4Topic(niche); setP5Topic(niche); setP6Topic(niche);
    }
    if (params.get('useBrief') === '1') {
      const stored = localStorage.getItem('activeContentBrief');
      if (stored) {
        try {
          const brief = JSON.parse(stored) as { origin?: string; title?: string; sourceTitle?: string; content?: string };
          if (brief.origin === 'evergreen-lab' || brief.origin === 'trend-scout') {
            const title = brief.title || brief.sourceTitle || niche || '';
            setP3Topic(title); setP4Topic(title); setP5Topic(title); setP6Topic(title);
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

  const generate = async (promptId: number, payload: Record<string, unknown>) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const workflowBrief = localStorage.getItem('activeContentBrief') || '';
      const res = await fetch('/api/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, profile, ...payload, workflowBrief }),
      });
      const data = (await res.json()) as GenerationResult;
      if (data.error) throw new Error(data.error);
      setResult(data);
      let priorBrief: Record<string, unknown> = {};
      try { priorBrief = JSON.parse(workflowBrief || '{}'); } catch {}
      const nextBrief = { ...priorBrief, title: String(priorBrief.title || `Instagram content: ${profile.niche}`), niche: profile.niche, platform: 'Instagram', promptId, generatedContent: data.content || '', content: data.content || priorBrief.content || '', savedAt: new Date().toISOString() };
      localStorage.setItem('activeContentBrief', JSON.stringify(nextBrief));
      addBriefToGrowthWorkspace(nextBrief);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Unable to generate Instagram content.'); }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      <PageHeader eyebrow="Platforms" title="Instagram" description="Create Reel scripts, carousels, story sequences and captions built to earn saves and shares." />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', padding: '8px 12px', textTransform: 'uppercase' }}>Create for Instagram</div>
          {FEATURES.map(feat => {
            const Icon = feat.icon;
            const isActive = activeTab === feat.id;
            return (
              <button key={feat.id} onClick={() => { setActiveTab(feat.id); setResult(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: 'none', background: isActive ? 'var(--rose-bg)' : 'transparent', color: isActive ? 'var(--rose-ink)' : 'var(--muted-foreground)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s' }}>
                <Icon size={16} color={isActive ? 'var(--rose-ink)' : 'var(--muted-foreground)'} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{feat.label}</div>
                  <div style={{ fontSize: 11, marginTop: 2, opacity: 0.75 }}>{feat.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            {activeTab === '3' && (
              <PromptSection title="Reel Script" desc="Create a concise hook-to-CTA short-form video script." action={() => generate(3, { topic: p3Topic, tone: p3Tone })} disabled={!p3Topic}>
                <InputField label="Topic" value={p3Topic} onChange={setP3Topic} />
                <InputField label="Tone" value={p3Tone} onChange={setP3Tone} placeholder="e.g. Educational, Funny, Inspirational..." />
              </PromptSection>
            )}
            {activeTab === '4' && (
              <PromptSection title="Instagram Carousel" desc="Create a 10-slide educational carousel built for saves." action={() => generate(4, { topic: p4Topic })} disabled={!p4Topic}>
                <InputField label="Topic" value={p4Topic} onChange={setP4Topic} />
              </PromptSection>
            )}
            {activeTab === '5' && (
              <PromptSection title="Story Sequence" desc="Create a 7-story sequence that drives replies and action." action={() => generate(5, { topic: p5Topic })} disabled={!p5Topic}>
                <InputField label="Topic" value={p5Topic} onChange={setP5Topic} />
              </PromptSection>
            )}
            {activeTab === '6' && (
              <PromptSection title="Instagram Caption" desc="Write a keyword-rich caption with a strong opening and CTA." action={() => generate(6, { topic: p6Topic })} disabled={!p6Topic}>
                <InputField label="Topic / Post" value={p6Topic} onChange={setP6Topic} />
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
                    <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} /> Web research result</h3>
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
                  <EmptyState icon={Instagram} title="Ready to Generate" description="Fill in the details above and hit Generate." />
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

function PromptSection({ title, desc, children, action, disabled }: { title: string; desc: string; children?: React.ReactNode; action: () => void; disabled?: boolean }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>{desc}</p>
      {children}
      <button onClick={action} disabled={disabled} className="btn-primary" style={{ marginTop: 16, width: '100%' }}>Generate</button>
    </div>
  );
}
