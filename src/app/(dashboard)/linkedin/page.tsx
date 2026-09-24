"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, Check, Copy, Zap, Edit3, Film, List
} from 'lucide-react';
import Link from 'next/link';
import { addBriefToGrowthWorkspace } from '@/lib/growth-workspace';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';

const FEATURES = [
  { id: '4', label: 'LinkedIn Post', icon: Edit3, desc: 'Ready-to-publish text post' },
  { id: '5', label: 'Document Carousel', icon: List, desc: '8–12 connected slides' },
  { id: '6', label: 'Native Video Script', icon: Film, desc: '60–90 second script' },
];

type WorkflowBrief = {
  origin?: string;
  niche?: string;
  title?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  publishedAt?: string;
  linkedinAngle?: string;
  content?: string;
  hook?: string;
  evergreenReason?: string;
};

type LinkedInProfile = {
  name: string;
  headline: string;
  industry: string;
  audience: string;
  pillars: string;
  contentTypes: string;
  frequency: string;
  followers: string;
  goal: string;
  uniqueAngle: string;
  currentProblem: string;
  tone: string;
};

type LinkedInResult = {
  content: string;
  liveData?: boolean;
  dataMode?: string;
};

export default function LinkedInSystemPage() {
  const [activeTab, setActiveTab] = useState('4');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkedInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [importedBrief, setImportedBrief] = useState<WorkflowBrief | null>(null);
  const [showSetupCta, setShowSetupCta] = useState(false);
  const autoGenerateRef = useRef(false);

  const [profile, setProfile] = useState<LinkedInProfile>({
    name: '', headline: '', industry: '', audience: '', pillars: '',
    contentTypes: 'Text posts, Carousels', frequency: '3x week',
    followers: '', goal: 'Thought leadership',
    uniqueAngle: '', currentProblem: 'Low reach', tone: 'Professional & Warm'
  });

  const [p4Topic, setP4Topic] = useState('');
  const [p4Format, setP4Format] = useState('Personal story');
  const [p5Topic, setP5Topic] = useState('');
  const [p6Topic, setP6Topic] = useState('');

  useEffect(() => {
    let loadedProfile = profile;
    const saved = localStorage.getItem('linkedinProfileSetup');
    if (saved) {
      try {
        loadedProfile = { ...loadedProfile, ...(JSON.parse(saved) as Partial<LinkedInProfile>) };
        setProfile(loadedProfile);
      } catch {}
    }
    const params = new URLSearchParams(window.location.search);
    setShowSetupCta(!localStorage.getItem('linkedinProfileSetup') && params.get('setupDone') !== '1');
    const niche = params.get('niche');
    if (niche) {
      loadedProfile = { ...loadedProfile, industry: niche };
      setProfile(loadedProfile);
      setP4Topic(niche); setP5Topic(niche); setP6Topic(niche);
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
            const format = brief.linkedinAngle || brief.hook || brief.content || 'Evidence-led analysis with a professional implication and a discussion question';
            setImportedBrief(brief);
            setActiveTab(requestedTool || '4');
            setP4Topic(title);
            setP4Format(format);
            if ((requestedTool || '4') === '4' && title && !autoGenerateRef.current) {
              autoGenerateRef.current = true;
              void generate(4, { topic: title, format }, loadedProfile, stored);
            }
          }
        } catch {}
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- URL/local-storage import intentionally runs once on entry.

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopiedMap(prev => ({ ...prev, [key]: false })), 2000);
  };

  async function generate(promptId: number, payload: Record<string, unknown>, profileOverride = profile, workflowBriefOverride?: string) {
    setLoading(true); setError(null); setResult(null);
    try {
      const workflowBrief = workflowBriefOverride ?? localStorage.getItem('activeContentBrief') ?? '';
      const res = await fetch('/api/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, profile: profileOverride, ...payload, workflowBrief }),
      });
      const data = await res.json() as LinkedInResult & { error?: string };
      if (data.error) throw new Error(data.error);
      setResult(data);
      let priorBrief: Record<string, unknown> = {};
      try { priorBrief = JSON.parse(workflowBrief || '{}'); } catch {}
      const nextBrief = { ...priorBrief, title: String(priorBrief.title || `LinkedIn content: ${profileOverride.industry}`), niche: profileOverride.industry, platform: 'LinkedIn', promptId, generatedContent: data.content || '', content: data.content || priorBrief.content || '', savedAt: new Date().toISOString() };
      localStorage.setItem('activeContentBrief', JSON.stringify(nextBrief));
      addBriefToGrowthWorkspace(nextBrief);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'LinkedIn generation failed.'); }
    setLoading(false);
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      <PageHeader eyebrow="Platforms" title="LinkedIn" description="Write authority posts, carousels and video scripts that sound like you." />

      {showSetupCta && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '12px 18px', background: 'var(--sky-bg)', border: '1px solid var(--sky)', borderRadius: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--sky-ink)' }}>Train the AI on your profile so posts match your voice.</span>
          <Link href="/linkedin/setup" className="btn-primary" style={{ fontSize: 13 }}>Set up your profile</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', padding: '8px 12px', textTransform: 'uppercase' }}>Create for LinkedIn</div>
          {FEATURES.map(feat => {
            const Icon = feat.icon;
            const isActive = activeTab === feat.id;
            return (
              <button key={feat.id} onClick={() => { setActiveTab(feat.id); setResult(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: 'none', background: isActive ? 'var(--sky-bg)' : 'transparent', color: isActive ? 'var(--sky-ink)' : 'var(--muted-foreground)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s' }}>
                <Icon size={16} color={isActive ? 'var(--sky-ink)' : 'var(--muted-foreground)'} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{feat.label}</div>
                  <div style={{ fontSize: 11, marginTop: 2, opacity: 0.78 }}>{feat.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {importedBrief && (
            <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--sky)', background: 'var(--sky-bg)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--sky-ink)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>{importedBrief.origin === 'evergreen-lab' ? 'Evergreen Content Lab brief imported' : 'Live Trend Scout brief imported'}</div>
              <div style={{ fontSize: 15, fontWeight: 750, color: 'var(--foreground)', lineHeight: 1.45 }}>{importedBrief.title || importedBrief.sourceTitle}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                {importedBrief.publishedAt && <span>Published {new Date(importedBrief.publishedAt).toLocaleString()}</span>}
                {importedBrief.sourceUrl && <a href={importedBrief.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sky-ink)', fontWeight: 700 }}>Open live source</a>}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>{loading ? 'Generating the LinkedIn post automatically…' : result ? 'LinkedIn post generated from this research brief.' : 'Text Post Writer is ready with this research brief.'}</div>
            </div>
          )}
          <div className="card" style={{ padding: 24 }}>
            {activeTab === '4' && (
              <PromptSection title="LinkedIn Post" desc="Generate one source-backed, ready-to-publish text post." action={() => generate(4, { topic: p4Topic, format: p4Format })} disabled={!p4Topic}>
                <InputField label="Topic" value={p4Topic} onChange={setP4Topic} />
                <InputField label="Format / Angle" value={p4Format} onChange={setP4Format} placeholder="e.g. Personal story, Contrarian take, Data-backed..." />
              </PromptSection>
            )}
            {activeTab === '5' && (
              <PromptSection title="Document Carousel" desc="Generate an 8–12 slide LinkedIn document carousel." action={() => generate(5, { topic: p5Topic })} disabled={!p5Topic}>
                <InputField label="Topic" value={p5Topic} onChange={setP5Topic} />
              </PromptSection>
            )}
            {activeTab === '6' && (
              <PromptSection title="Native Video Script" desc="Generate a focused 60–90 second LinkedIn video script." action={() => generate(6, { topic: p6Topic })} disabled={!p6Topic}>
                <InputField label="Topic" value={p6Topic} onChange={setP6Topic} />
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
                    <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}><Zap size={16} /> {importedBrief && activeTab === '4' ? 'Generated LinkedIn post' : 'Web research result'} {(result.liveData || (importedBrief && activeTab === '4')) && <span className="badge badge-success">Live research</span>}</h3>
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
                  <EmptyState icon={Briefcase} title="Ready to Generate" description="Fill in the details above and hit Generate." />
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
