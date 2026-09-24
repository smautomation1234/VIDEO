"use client";

import React, { useState, useEffect } from 'react';
import { Check, Copy, Zap, Twitter, List } from 'lucide-react';
import { addBriefToGrowthWorkspace } from '@/lib/growth-workspace';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

const FEATURES = [
  { id: '4', label: 'X Post', icon: Twitter, desc: 'Single concise post' },
  { id: '5', label: 'X Thread', icon: List, desc: '6–12 connected posts' },
];

type GenerationResult = { content: string; error?: string };

export default function XSystemPage() {
  const [activeTab, setActiveTab] = useState('4');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  const [profile, setProfile] = useState({
    name: '', bio: '', industry: '', audience: '', pillars: '',
    buildingInPublic: '', contentTypes: 'Single tweets, Threads',
    frequency: 'Daily', followers: '', goal: 'Audience for a product',
    uniqueAngle: '', currentProblem: 'Low reach', tone: 'Blunt-honest & Data-driven'
  });

  const [p4Topic, setP4Topic] = useState('');
  const [p4Angle, setP4Angle] = useState('Contrarian take');
  const [p5Topic, setP5Topic] = useState('');
  const [p5Goal, setP5Goal] = useState('Teach a framework');

  useEffect(() => {
    const saved = localStorage.getItem('xProfileSetup');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch {}
    }
    const params = new URLSearchParams(window.location.search);
    const niche = params.get('niche');
    const requestedTool = params.get('tool');
    if (requestedTool && FEATURES.some(feature => feature.id === requestedTool)) setActiveTab(requestedTool);
    if (niche) {
      setProfile(current => ({ ...current, industry: niche }));
      setP4Topic(niche); setP5Topic(niche);
    }
    if (params.get('useBrief') === '1') {
      const stored = localStorage.getItem('activeContentBrief');
      if (stored) {
        try {
          const brief = JSON.parse(stored) as { origin?: string; title?: string; sourceTitle?: string; content?: string; hook?: string };
          if (brief.origin === 'evergreen-lab' || brief.origin === 'trend-scout') {
            const title = brief.title || brief.sourceTitle || niche || '';
            setP4Topic(title); setP4Angle(brief.hook || 'Evidence-led practical takeaway');
            setP5Topic(title); setP5Goal(brief.content || 'Teach a framework');
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
      const res = await fetch('/api/x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, profile, ...payload, workflowBrief }),
      });
      const data = (await res.json()) as GenerationResult;
      if (data.error) throw new Error(data.error);
      setResult(data);
      let priorBrief: Record<string, unknown> = {};
      try { priorBrief = JSON.parse(workflowBrief || '{}'); } catch {}
      const nextBrief = { ...priorBrief, title: String(priorBrief.title || `X content: ${profile.industry}`), niche: profile.industry, platform: 'X/Twitter', promptId, generatedContent: data.content || '', content: data.content || priorBrief.content || '', savedAt: new Date().toISOString() };
      localStorage.setItem('activeContentBrief', JSON.stringify(nextBrief));
      addBriefToGrowthWorkspace(nextBrief);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to generate X content.');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      <PageHeader eyebrow="Platforms" title="X" description="Write concise posts and connected threads backed by live web research." />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', padding: '8px 12px', textTransform: 'uppercase' }}>Create for X</div>
          {FEATURES.map(feat => {
            const Icon = feat.icon;
            const isActive = activeTab === feat.id;
            return (
              <button 
                key={feat.id} 
                onClick={() => { setActiveTab(feat.id); setResult(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, border: 'none',
                  background: isActive ? 'var(--lavender-bg)' : 'transparent',
                  color: isActive ? 'var(--lavender-ink)' : 'var(--muted-foreground)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s'
                }}
              >
                <Icon size={16} color={isActive ? 'var(--lavender-ink)' : 'var(--muted-foreground)'} />
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
            
            {activeTab === '4' && (
              <PromptSection title="X Post" desc="Write a concise post with a strong hook and discussion prompt." action={() => generate(4, { topic: p4Topic, angle: p4Angle })} disabled={!p4Topic}>
                <InputField label="Topic" value={p4Topic} onChange={setP4Topic} />
                <InputField label="Angle" value={p4Angle} onChange={setP4Angle} placeholder="e.g. Contrarian take, Hard lesson..." />
              </PromptSection>
            )}

            {activeTab === '5' && (
              <PromptSection title="X Thread" desc="Write a 6–12 post thread with a clear narrative and CTA." action={() => generate(5, { topic: p5Topic, goal: p5Goal })} disabled={!p5Topic}>
                <InputField label="Topic" value={p5Topic} onChange={setP5Topic} />
                <InputField label="Goal" value={p5Goal} onChange={setP5Goal} placeholder="e.g. Teach a framework, Tell a story..." />
              </PromptSection>
            )}

          </div>

          {(loading || result || activeTab !== '0') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {loading ? (
                <SkeletonCard lines={2} />
              ) : error ? (
                <div className="card" style={{ color: 'var(--rose-ink)', whiteSpace: 'pre-wrap' }}>{error}</div>
              ) : result ? (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} /> AI Result</h3>
                    <button 
                      onClick={() => copy(result.content, 'result')} 
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: copiedMap['result'] ? 'var(--sage-bg)' : 'var(--muted)', border: `1px solid ${copiedMap['result'] ? 'var(--sage)' : 'var(--border)'}`, color: copiedMap['result'] ? 'var(--sage-ink)' : 'var(--muted-foreground)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
                    >
                      {copiedMap['result'] ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy All</>}
                    </button>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: 'var(--foreground)', background: 'var(--muted)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', maxHeight: 600, overflowY: 'auto' }}>
                    {result.content}
                  </div>
                </div>
              ) : activeTab !== '0' ? (
                <div className="card">
                  <EmptyState icon={Twitter} title="Ready to Generate" description="Fill in the details above and hit Generate to see your result." />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .animate-fade-in { animation: fade-in 0.3s ease forwards; }
      `}</style>
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
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--foreground)' }}>{title}</h2>
      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>{desc}</p>
      {children}
      <button onClick={action} disabled={disabled} className="btn-primary" style={{ marginTop: 16, width: '100%' }}>
        Generate
      </button>
    </div>
  );
}
