"use client";
import React, { useState } from 'react';
import { PenTool, Check, Copy, RefreshCw, Type, Sparkles, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const SCRIPT_MODES = [
  { id: 'viral-reel', label: 'Viral Reels Script', desc: 'Under 30s scripts built for maximum shares', ink: 'var(--rose-ink)', bg: 'var(--rose-bg)', border: 'var(--rose)' },
  { id: 'carousel', label: 'Educational Carousel', desc: '10-slide outline built for saves', ink: 'var(--lavender-ink)', bg: 'var(--lavender-bg)', border: 'var(--lavender)' },
  { id: 'story-sequence', label: 'Story Sequence', desc: '7-part engaging story sequence', ink: 'var(--butter-ink)', bg: 'var(--butter-bg)', border: 'var(--butter)' },
  { id: 'seo-caption', label: 'SEO Caption Writer', desc: 'Keyword-rich captions optimized for search', ink: 'var(--sage-ink)', bg: 'var(--sage-bg)', border: 'var(--sage)' },
  { id: 'caption-style-pack', label: 'Caption Style Pack', desc: '6 different caption styles for the same post', ink: 'var(--sky-ink)', bg: 'var(--sky-bg)', border: 'var(--sky)' },
];

const CAPTION_FORMATS = ['LinkedIn Post', 'Twitter Thread', 'Instagram Caption', 'YouTube Script', 'Newsletter Idea'];

const TONES = ['Professional', 'Conversational', 'Controversial', 'Humorous', 'Data-Driven', 'Inspirational'];
const VIDEO_LENGTHS = ['SHORT: 3-5 min', 'MEDIUM: 8-12 min', 'LONG: 15-20 min'];
const SHORT_PLATFORMS = ['Instagram Reels', 'TikTok', 'YouTube Shorts'];
const SHORT_GOALS = ['Views & Followers', 'Sales', 'Traffic to long video', 'Brand Awareness'];

export default function ScriptWriterPage() {
  const [scriptMode, setScriptMode] = useState<string>('viral-reel');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState('LinkedIn Post');
  const [tone, setTone] = useState('Conversational');
  const [audience, setAudience] = useState('');
  const [videoLength, setVideoLength] = useState('MEDIUM: 8-12 min');
  const [shortPlatform, setShortPlatform] = useState('Instagram Reels');
  const [shortGoal, setShortGoal] = useState('Views & Followers');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ hook: true, promise: true, mainContent: true, cta: true });

  const generateScript = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: any = {
        topic, tone, targetAudience: audience, mode: scriptMode,
      };
      if (scriptMode === 'caption') { payload.format = format; }
      if (scriptMode === 'full-video') { payload.title = title; payload.videoLength = videoLength; }
      if (scriptMode === 'shortform') { payload.platform = shortPlatform; payload.tone = shortGoal; }

      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopiedMap((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const activeMode = SCRIPT_MODES.find(m => m.id === scriptMode);
  const activeInk = activeMode?.ink || 'var(--primary)';
  const activeBg = activeMode?.bg || 'var(--muted)';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
      <PageHeader
        eyebrow="Create"
        title="Script writer"
        description="Reel, carousel and short-form video scripts built from your topic."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {SCRIPT_MODES.map((m) => (
          <button key={m.id} onClick={() => { setScriptMode(m.id as any); setResult(null); }} style={{ padding: '14px 18px', borderRadius: 14, border: `2px solid ${scriptMode === m.id ? m.border : 'var(--border)'}`, background: scriptMode === m.id ? m.bg : 'var(--card)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: scriptMode === m.id ? m.ink : 'var(--foreground)', marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{m.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={15} color={activeInk} /> Configure Script
          </h2>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              <MessageSquare size={13} color={activeInk} />
              Topic or Idea *
            </label>
            <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder='Paste your rough ideas, research notes, or a news article here...' className="input-field" style={{ width: '100%', height: 120, fontSize: 13, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 6 }}>Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)} className="input-field" style={{ width: '100%', fontSize: 13 }}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label-muted" style={{ display: 'block', marginBottom: 6 }}>Target Audience</label>
                <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Founders, Marketers..." className="input-field" style={{ width: '100%', fontSize: 13 }} />
              </div>
            </div>

          <button onClick={generateScript} disabled={loading || !topic.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 4 }}>
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Writing...' : `Generate ${activeMode?.label}`}
          </button>

          {error && <div style={{ padding: 14, background: 'var(--rose-bg)', border: '1px solid var(--rose)', borderRadius: 8, color: 'var(--rose-ink)', fontSize: 13 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, opacity: 0.7 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse-soft" style={{ height: i === 2 ? 140 : 20, width: i === 1 ? '100%' : `${60 + i * 10}%`, background: 'var(--muted)', borderRadius: 6, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          ) : result ? (
            <>
              {result.mode !== 'none' && (
                <>
                  <div className="card" style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: activeInk, borderRadius: '12px 12px 0 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Type size={16} color={activeInk} /> Generated Content</h3>
                      <button onClick={() => copy(result.script, 'script')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: copiedMap['script'] ? 'var(--sage-bg)' : 'var(--muted)', border: `1px solid ${copiedMap['script'] ? 'var(--sage)' : 'var(--border)'}`, color: copiedMap['script'] ? 'var(--sage-ink)' : 'var(--muted-foreground)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>
                        {copiedMap['script'] ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy All</>}
                      </button>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.8, color: 'var(--foreground)', background: 'var(--muted)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', maxHeight: 500, overflowY: 'auto' }}>
                      {result.script}
                    </div>
                  </div>
                  {result.hooks?.length > 0 && <HooksList hooks={result.hooks} copy={copy} copiedMap={copiedMap} ink={activeInk} />}
                  {result.tips?.length > 0 && <TipsList tips={result.tips} />}
                </>
              )}

              {['carousel', 'story-sequence'].includes(result.mode) && (
                <>
                  <div className="card" style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: activeInk, borderRadius: '12px 12px 0 0' }} />
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{result.mode === 'carousel' ? 'Carousel Slides' : 'Story Sequence'}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {result.slides?.map((slide: any, i: number) => (
                        <div key={i} style={{ padding: 16, background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: activeInk }}>{slide.title || `SLIDE ${slide.slideNumber}`}</span>
                            <button onClick={() => copy(`Slide ${slide.slideNumber}\\nText: ${slide.text}\\nVisual: ${slide.visual}`, `slide-${i}`)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: copiedMap[`slide-${i}`] ? 'var(--sage-bg)' : 'var(--card)', border: `1px solid ${copiedMap[`slide-${i}`] ? 'var(--sage)' : 'var(--border)'}`, color: copiedMap[`slide-${i}`] ? 'var(--sage-ink)' : 'var(--muted-foreground)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>
                              {copiedMap[`slide-${i}`] ? <Check size={10} /> : <Copy size={10} />}
                            </button>
                          </div>
                          {slide.visual && <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', marginBottom: 6 }}>Visual: {slide.visual}</div>}
                          {slide.text && <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 6 }}>{slide.text}</div>}
                          {slide.interactive && <div style={{ fontSize: 12, color: 'var(--butter-ink)', background: 'var(--butter-bg)', padding: '4px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 6 }}>{slide.interactive}</div>}
                          {slide.microHook && <div style={{ fontSize: 12, color: 'var(--sky-ink)', fontWeight: 600 }}>Next: {slide.microHook}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {result.caption && (
                    <div className="card">
                      <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--sage-ink)', marginBottom: 10 }}>Carousel Caption</h3>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6 }}>{result.caption}</div>
                    </div>
                  )}
                  {result.hooks?.length > 0 && <HooksList hooks={result.hooks} copy={copy} copiedMap={copiedMap} ink={activeInk} />}
                  {result.tips?.length > 0 && <TipsList tips={result.tips} />}
                </>
              )}

              {result.mode === 'full-video' && (
                <>
                  {[
                    { key: 'hook', label: '[0:00] Hook — First 30 Seconds', ink: 'var(--rose-ink)', bg: 'var(--rose-bg)' },
                    { key: 'promise', label: '[0:30] Promise — Build Anticipation', ink: 'var(--butter-ink)', bg: 'var(--butter-bg)' },
                    { key: 'mainContent', label: '[1:00] Main Content', ink: 'var(--sky-ink)', bg: 'var(--sky-bg)' },
                    { key: 'callToAction', label: 'Call to Action', ink: 'var(--sage-ink)', bg: 'var(--sage-bg)' },
                  ].map(({ key, label, ink, bg }) => result[key] && (
                    <div key={key} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      <button onClick={() => setExpanded(p => ({ ...p, [key]: !p[key] }))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: bg, border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: ink, flex: 1 }}>{label}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={(e) => { e.stopPropagation(); copy(result[key], key); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: copiedMap[key] ? 'var(--sage-bg)' : 'var(--card)', border: `1px solid ${copiedMap[key] ? 'var(--sage)' : 'var(--border)'}`, color: copiedMap[key] ? 'var(--sage-ink)' : 'var(--muted-foreground)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>
                            {copiedMap[key] ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                          {expanded[key] ? <ChevronUp size={14} color="var(--muted-foreground)" /> : <ChevronDown size={14} color="var(--muted-foreground)" />}
                        </div>
                      </button>
                      {expanded[key] && (
                        <div style={{ padding: '14px 16px', whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.8, color: 'var(--foreground)', borderTop: '1px solid var(--border)' }}>
                          {result[key]}
                        </div>
                      )}
                    </div>
                  ))}
                  {result.retentionBoosters?.length > 0 && (
                    <div className="card">
                      <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--butter-ink)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Retention Boosters</h3>
                      {result.retentionBoosters.map((b: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: 'var(--butter-bg)', borderRadius: 6, marginBottom: 6, border: '1px solid var(--butter)', fontSize: 13, color: 'var(--foreground)' }}>
                          <span style={{ color: 'var(--butter-ink)', fontWeight: 700 }}>•</span> {b}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.hooks?.length > 0 && <HooksList hooks={result.hooks} copy={copy} copiedMap={copiedMap} ink="var(--rose-ink)" />}
                  {result.tips?.length > 0 && <TipsList tips={result.tips} />}
                </>
              )}

              {result.mode === 'shortform' && (
                <>
                  {[
                    { key: 'hook', label: '0-3s — Scroll-Stopping Hook', time: '3 seconds', ink: 'var(--rose-ink)', bg: 'var(--rose-bg)', border: 'var(--rose)' },
                    { key: 'setup', label: '3-15s — Problem Setup', time: '12 seconds', ink: 'var(--butter-ink)', bg: 'var(--butter-bg)', border: 'var(--butter)' },
                    { key: 'valueBomb', label: '15-45s — Value Bomb', time: '30 seconds', ink: 'var(--sky-ink)', bg: 'var(--sky-bg)', border: 'var(--sky)' },
                    { key: 'cta', label: '45-60s — CTA + Loop Hook', time: '15 seconds', ink: 'var(--sage-ink)', bg: 'var(--sage-bg)', border: 'var(--sage)' },
                  ].map(({ key, label, time, ink, bg, border }: any) => result[key] && (
                    <div key={key} style={{ padding: '14px 16px', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)', borderLeft: `4px solid ${border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: ink }}>{label}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{ fontSize: 10, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 8px', borderRadius: 20 }}>{time}</span>
                          <button onClick={() => copy(result[key], key)} style={{ display: 'flex', alignItems: 'center', gap: 3, background: copiedMap[key] ? 'var(--sage-bg)' : 'var(--muted)', border: `1px solid ${copiedMap[key] ? 'var(--sage)' : 'var(--border)'}`, color: copiedMap[key] ? 'var(--sage-ink)' : 'var(--muted-foreground)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}>
                            {copiedMap[key] ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result[key]}</div>
                    </div>
                  ))}
                  {result.onScreenText?.length > 0 && (
                    <div className="card">
                      <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--lavender-ink)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>On-Screen Text Overlays</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {result.onScreenText.map((t: string, i: number) => (
                          <button key={i} onClick={() => copy(t, `overlay-${i}`)} style={{ padding: '6px 14px', borderRadius: 20, background: copiedMap[`overlay-${i}`] ? 'var(--sage-bg)' : 'var(--lavender-bg)', border: `1px solid ${copiedMap[`overlay-${i}`] ? 'var(--sage)' : 'var(--lavender)'}`, color: copiedMap[`overlay-${i}`] ? 'var(--sage-ink)' : 'var(--lavender-ink)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {copiedMap[`overlay-${i}`] ? <Check size={11} /> : null} {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.hooks?.length > 0 && <HooksList hooks={result.hooks} copy={copy} copiedMap={copiedMap} ink="var(--rose-ink)" />}
                  {result.tips?.length > 0 && <TipsList tips={result.tips} />}
                </>
              )}
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, background: 'var(--card)', borderRadius: 16, border: '1px dashed var(--border)', gap: 16 }}>
              <PenTool size={48} color={activeInk} style={{ opacity: 0.25 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>Ready to Write</div>
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)', maxWidth: 280, lineHeight: 1.6 }}>
                  {scriptMode === 'full-video'
                    ? 'Generate a full YouTube video script with hooks, timestamps, retention boosters, and a CTA.'
                    : scriptMode === 'shortform'
                      ? 'Generate a 45-60s Reels/TikTok script with structured sections and on-screen text overlays.'
                      : 'Enter your topic to generate platform-optimized captions, posts, and scripts instantly.'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HooksList({ hooks, copy, copiedMap, ink }: any) {
  return (
    <div className="card">
      <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Alternative Hooks</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hooks.map((hook: string, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--muted)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: ink, fontWeight: 800 }}>{i + 1}.</span>
            <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>{hook}</div>
            <button onClick={() => copy(hook, `hook-${i}`)} style={{ background: copiedMap[`hook-${i}`] ? 'var(--sage-bg)' : 'var(--card)', border: `1px solid ${copiedMap[`hook-${i}`] ? 'var(--sage)' : 'var(--border)'}`, width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedMap[`hook-${i}`] ? 'var(--sage-ink)' : 'var(--muted-foreground)', cursor: 'pointer' }}>
              {copiedMap[`hook-${i}`] ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipsList({ tips }: { tips: string[] }) {
  return (
    <div style={{ padding: 14, background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: 8 }}>Pro Tips</div>
      {tips.map((tip: string, i: number) => (
        <div key={i} style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>• {tip}</div>
      ))}
    </div>
  );
}
