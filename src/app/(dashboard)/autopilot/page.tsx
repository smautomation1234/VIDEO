"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Radio, PenLine, Eye, SendHorizonal, CheckCircle2, Sparkles, RefreshCw, ArrowRight, Trophy } from 'lucide-react';
import { addBriefToGrowthWorkspace } from '@/lib/growth-workspace';

interface TrendTopic {
  id: number;
  topic: string;
  platform: string;
  virality: number;
  engagement: number;
  category: string;
  hook: string;
}

const HOOK_STYLES: Record<string, { bg: string; ink: string }> = {
  'Contrarian': { bg: 'var(--rose-bg)', ink: 'var(--rose-ink)' },
  'Curiosity Gap': { bg: 'var(--lavender-bg)', ink: 'var(--lavender-ink)' },
  'Insider Knowledge': { bg: 'var(--butter-bg)', ink: 'var(--butter-ink)' },
  'Data-Backed': { bg: 'var(--sky-bg)', ink: 'var(--sky-ink)' },
  'Social Proof': { bg: 'var(--sage-bg)', ink: 'var(--sage-ink)' },
  'Actionable Insight': { bg: 'var(--sky-bg)', ink: 'var(--sky-ink)' },
};

function hookStyle(hook: string) {
  return HOOK_STYLES[hook] ?? { bg: 'var(--muted)', ink: 'var(--muted-foreground)' };
}

function toUnicodeBold(str: string): string {
  return str.split('').map(c => {
    if (c >= 'A' && c <= 'Z') return String.fromCodePoint(c.charCodeAt(0) + 120211);
    if (c >= 'a' && c <= 'z') return String.fromCodePoint(c.charCodeAt(0) + 120205);
    if (c >= '0' && c <= '9') return String.fromCodePoint(c.charCodeAt(0) + 120764);
    return c;
  }).join('');
}

function processLinkedInFormatting(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, (_, p1) => toUnicodeBold(p1));
}

function StepIndicator({ steps, current }: { steps: { icon: React.ComponentType<{ size?: number }>; label: string }[]; current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap' }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = s.icon;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: done ? 'var(--sage-bg)' : active ? 'var(--primary)' : 'var(--muted)',
                color: done ? 'var(--sage-ink)' : active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border: active ? '2px solid var(--primary)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease',
              }}>
                {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--foreground)' : done ? 'var(--sage-ink)' : 'var(--muted-foreground)', textAlign: 'center', maxWidth: 88 }}>{s.label}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 56, height: 2, background: done ? 'var(--sage)' : 'var(--border)', margin: '19px 6px 0', borderRadius: 1, transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ScanStep({ onSelect }: { onSelect: (t: TrendTopic) => void }) {
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct] = useState(0);
  const [found, setFound] = useState<TrendTopic | null>(null);
  const [scanMsg, setScanMsg] = useState('');
  const [allTrends, setAllTrends] = useState<TrendTopic[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Tech & AI']);
  const [userPreferredCategories, setUserPreferredCategories] = useState<string[]>([]);
  const [userCustomSources, setUserCustomSources] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [usePersonalized, setUsePersonalized] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [customTopicsList, setCustomTopicsList] = useState<string[]>([]);

  function handleCustomTopicAdd() {
    if (!customTopic.trim()) return;
    const lines = customTopic.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      setCustomTopicsList(prev => [...new Set([...prev, ...lines])]);
      setCustomTopic('');
    }
  }

  function handleCompileCustom(topic: string) {
    if (!topic.trim()) return;
    onSelect({
      id: Math.floor(Date.now() * Math.random()),
      topic: topic.trim(),
      platform: 'Your own topic',
      virality: 10,
      engagement: 0,
      category: 'Custom',
      hook: 'Actionable Insight',
    });
  }

  const CATEGORIES: Record<string, { name: string; url: string; type: string; hook: string }[]> = {
    'Tech & AI': [
      { name: 'Hacker News', url: 'https://hacker-news.firebaseio.com/v0/topstories.json', type: 'hn', hook: 'Insider Knowledge' },
      { name: 'Reddit (/r/artificial)', url: 'https://www.reddit.com/r/artificial/hot.json?limit=10', type: 'reddit', hook: 'Data-Backed' },
      { name: 'Reddit (/r/technology)', url: 'https://www.reddit.com/r/technology/hot.json?limit=10', type: 'reddit', hook: 'Curiosity Gap' }
    ],
    'Business & Startups': [
      { name: 'Reddit (/r/Entrepreneur)', url: 'https://www.reddit.com/r/Entrepreneur/hot.json?limit=10', type: 'reddit', hook: 'Actionable Insight' },
      { name: 'Reddit (/r/startups)', url: 'https://www.reddit.com/r/startups/hot.json?limit=10', type: 'reddit', hook: 'Social Proof' },
      { name: 'Reddit (/r/SaaS)', url: 'https://www.reddit.com/r/SaaS/hot.json?limit=10', type: 'reddit', hook: 'Contrarian' }
    ],
    'Politics & News': [
      { name: 'Reddit (/r/worldnews)', url: 'https://www.reddit.com/r/worldnews/hot.json?limit=10', type: 'reddit', hook: 'Contrarian' },
      { name: 'Reddit (/r/politics)', url: 'https://www.reddit.com/r/politics/hot.json?limit=10', type: 'reddit', hook: 'Insider Knowledge' },
      { name: 'Reddit (/r/news)', url: 'https://www.reddit.com/r/news/hot.json?limit=10', type: 'reddit', hook: 'Curiosity Gap' }
    ],
    'Marketing & Growth': [
      { name: 'Reddit (/r/marketing)', url: 'https://www.reddit.com/r/marketing/hot.json?limit=10', type: 'reddit', hook: 'Actionable Insight' },
      { name: 'Reddit (/r/socialmedia)', url: 'https://www.reddit.com/r/socialmedia/hot.json?limit=10', type: 'reddit', hook: 'Curiosity Gap' },
      { name: 'Reddit (/r/GrowthHacking)', url: 'https://www.reddit.com/r/GrowthHacking/hot.json?limit=10', type: 'reddit', hook: 'Social Proof' }
    ],
    'Finance & Investing': [
      { name: 'Reddit (/r/investing)', url: 'https://www.reddit.com/r/investing/hot.json?limit=10', type: 'reddit', hook: 'Data-Backed' },
      { name: 'Reddit (/r/personalfinance)', url: 'https://www.reddit.com/r/personalfinance/hot.json?limit=10', type: 'reddit', hook: 'Actionable Insight' }
    ],
    'Health & Science': [
      { name: 'Reddit (/r/science)', url: 'https://www.reddit.com/r/science/hot.json?limit=10', type: 'reddit', hook: 'Insider Knowledge' },
      { name: 'Reddit (/r/Futurology)', url: 'https://www.reddit.com/r/Futurology/hot.json?limit=10', type: 'reddit', hook: 'Curiosity Gap' }
    ],
    'Design & Product': [
      { name: 'Reddit (/r/design)', url: 'https://www.reddit.com/r/design/hot.json?limit=10', type: 'reddit', hook: 'Curiosity Gap' },
      { name: 'Reddit (/r/ProductManagement)', url: 'https://www.reddit.com/r/ProductManagement/hot.json?limit=10', type: 'reddit', hook: 'Actionable Insight' }
    ],
    'Leadership & Culture': [
      { name: 'Reddit (/r/Leadership)', url: 'https://www.reddit.com/r/Leadership/hot.json?limit=10', type: 'reddit', hook: 'Social Proof' },
      { name: 'Reddit (/r/management)', url: 'https://www.reddit.com/r/management/hot.json?limit=10', type: 'reddit', hook: 'Insider Knowledge' }
    ],
    'SaaS': [
      { name: 'Reddit (/r/SaaS)', url: 'https://www.reddit.com/r/SaaS/hot.json?limit=10', type: 'reddit', hook: 'Contrarian' },
      { name: 'Reddit (/r/microsaas)', url: 'https://www.reddit.com/r/microsaas/hot.json?limit=10', type: 'reddit', hook: 'Actionable Insight' }
    ],
    'Venture Capital': [
      { name: 'Reddit (/r/venturecapital)', url: 'https://www.reddit.com/r/venturecapital/hot.json?limit=10', type: 'reddit', hook: 'Insider Knowledge' },
      { name: 'Hacker News', url: 'https://hacker-news.firebaseio.com/v0/topstories.json', type: 'hn', hook: 'Data-Backed' }
    ],
    'Geo-Finance': [
      { name: 'Global news feed', url: '/api/antigravity/geo-finance', type: 'geo', hook: 'Data-Backed' }
    ],
    'Cybersecurity': [
      { name: 'Reddit (/r/cybersecurity)', url: 'https://www.reddit.com/r/cybersecurity/hot.json?limit=10', type: 'reddit', hook: 'Contrarian' },
      { name: 'Reddit (/r/netsec)', url: 'https://www.reddit.com/r/netsec/hot.json?limit=10', type: 'reddit', hook: 'Insider Knowledge' }
    ],
    'Future of Work': [
      { name: 'Reddit (/r/remotework)', url: 'https://www.reddit.com/r/remotework/hot.json?limit=10', type: 'reddit', hook: 'Curiosity Gap' },
      { name: 'Reddit (/r/digitalnomad)', url: 'https://www.reddit.com/r/digitalnomad/hot.json?limit=10', type: 'reddit', hook: 'Social Proof' }
    ],
  };

  const INTEREST_TO_CATEGORY: Record<string, string> = {
    'AI': 'Tech & AI', 'SaaS': 'SaaS', 'Marketing': 'Marketing & Growth',
    'Leadership': 'Leadership & Culture', 'Startups': 'Business & Startups',
    'Fintech': 'Finance & Investing', 'Venture Capital': 'Venture Capital',
    'Cybersecurity': 'Cybersecurity', 'Future of Work': 'Future of Work',
    'Health & Science': 'Health & Science', 'Design & Product': 'Design & Product'
  };

  useEffect(() => {
    fetch('/api/user/content-preferences')
      .then(r => r.json())
      .then(data => {
        const cats: string[] = data.preferred_categories ?? [];
        const sources: string[] = data.custom_sources ?? [];
        setUserPreferredCategories(cats);
        setUserCustomSources(sources);
        if (cats.length > 0) {
          const mappedCat = INTEREST_TO_CATEGORY[cats[0]] ?? Object.keys(CATEGORIES)[0];
          setSelectedCategories([mappedCat]);
          setUsePersonalized(true);
        }
        setPrefsLoaded(true);
      })
      .catch(() => setPrefsLoaded(true));
  }, []);

  async function startScan() {
    setScanning(true); setFound(null); setScanPct(0);
    setScanMsg('Preparing your feed...');

    const interval = setInterval(() => {
      setScanPct(p => Math.min(p + 6, 90));
    }, 400);

    const newTrends: TrendTopic[] = [];

    const categoriesToScan: string[] = userPreferredCategories.length > 0 && usePersonalized
      ? userPreferredCategories
          .map(cat => INTEREST_TO_CATEGORY[cat] ?? cat)
          .filter(cat => CATEGORIES[cat])
      : selectedCategories;

    const uniqueCats = [...new Set(categoriesToScan)];

    for (const catKey of uniqueCats) {
      const catSources = CATEGORIES[catKey] ?? [];
      for (const source of catSources) {
        setScanMsg(`Scanning ${source.name}...`);
        try {
          if (source.type === 'hn') {
            const hnRes = await fetch(source.url);
            const hnIds = await hnRes.json();
            const topHnIds = hnIds.slice(0, 8);
            for (const id of topHnIds) {
              const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
              const item = await itemRes.json();
              if (item && item.title) {
                newTrends.push({
                  id: item.id || Math.floor(Date.now() * Math.random()),
                  topic: item.title, platform: source.name,
                  virality: parseFloat(Math.min(9.9, ((item.score || 100) / 100) + 7.5).toFixed(1)),
                  engagement: item.score || 0,
                  category: catKey, hook: source.hook,
                });
              }
            }
          } else if (source.type === 'reddit') {
            const redditRes = await fetch(source.url);
            const redditData = await redditRes.json();
            const posts = redditData?.data?.children || [];
            for (const post of posts) {
              const item = post.data;
              if (item && item.title) {
                newTrends.push({
                  id: Math.floor(Date.now() * Math.random()),
                  topic: item.title, platform: source.name,
                  virality: parseFloat(Math.min(9.8, ((item.score || 100) / 1000) + 6.5).toFixed(1)),
                  engagement: item.score || 0,
                  category: catKey, hook: source.hook,
                });
              }
            }
          } else if (source.type === 'geo') {
            const geoRes = await fetch(source.url, { method: 'POST', body: JSON.stringify({ action: 'scan' }), headers: { 'Content-Type': 'application/json' } });
            const geoData = await geoRes.json();
            const newsItems = geoData.news || [];
            for (const item of newsItems.slice(0, 8)) {
               newTrends.push({
                 id: item.id || Math.floor(Date.now() * Math.random()),
                 topic: item.headline + (item.region ? ` (Region: ${item.region})` : ''),
                 platform: `Geo-finance (${String(item.category || '').replace('_', ' ')})`,
                 virality: parseFloat(Math.min(9.9, (item.impact_level === 'extreme' ? 9.2 : item.impact_level === 'high' ? 8.5 : 7.0)).toFixed(1)),
                 engagement: 0,
                 category: catKey, hook: source.hook,
               });
            }
          }
        } catch (e: unknown) {
          console.warn(`Fetch issue for ${source.name}:`, e);
        }
      }
    }

    const customRedditSources = userCustomSources.filter(s => s.toLowerCase().startsWith('r/'));
    for (const sub of customRedditSources) {
      const subName = sub.replace(/^r\//i, '');
      setScanMsg(`Scanning your custom source: ${sub}...`);
      try {
        const res = await fetch(`https://www.reddit.com/r/${subName}/hot.json?limit=10`);
        const data = await res.json();
        const posts = data?.data?.children || [];
        for (const post of posts) {
          const item = post.data;
          if (item && item.title) {
            newTrends.push({
              id: Math.floor(Date.now() * Math.random()),
              topic: item.title, platform: `Reddit (${sub})`,
              virality: parseFloat(Math.min(9.7, ((item.score || 100) / 1000) + 6.5).toFixed(1)),
              engagement: item.score || 0,
              category: 'Custom', hook: 'Actionable Insight',
            });
          }
        }
      } catch (e: unknown) {
        console.warn(`Fetch issue for custom source ${sub}:`, e);
      }
    }

    clearInterval(interval);
    setScanPct(100);
    setScanMsg(newTrends.length === 0 ? 'No live topics found. Try again or add your own topic.' : 'Ranking topics...');

    const uniqueTrends = Array.from(new Map(newTrends.map(item => [item.topic, item])).values());
    uniqueTrends.sort((a, b) => b.virality - a.virality);

    setTimeout(() => {
      setScanning(false);
      setAllTrends(uniqueTrends);
      setFound(uniqueTrends[0] ?? null);
    }, 800);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 680, margin: '0 auto' }}>
      {!scanning && !found && (
        <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 560 }}>
            <label className="label-muted">Have specific topics or a full script?</label>
            <textarea
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="Paste one or more topics (one per line), or paste a full script you want to turn into slides."
              className="input-field"
              style={{ minHeight: 80 }}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
              <button onClick={() => { if (customTopic.trim()) handleCompileCustom(customTopic.split('\n')[0]); }} disabled={!customTopic.trim()} className="btn-primary">Write first topic</button>
              <button onClick={() => { if (customTopic.trim()) handleCompileCustom(customTopic); }} disabled={!customTopic.trim()} className="btn-secondary">Use full script</button>
              <button onClick={handleCustomTopicAdd} disabled={!customTopic.trim()} className="btn-secondary">Add to list</button>
            </div>

            {customTopicsList.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <label className="label-muted">Saved topics ({customTopicsList.length})</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {customTopicsList.map((topic, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--muted)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{topic}</span>
                      <button onClick={() => handleCompileCustom(topic)} className="btn-primary" style={{ padding: '5px 14px', fontSize: 12 }}>Write</button>
                      <button title="Remove" aria-label="Remove" onClick={() => setCustomTopicsList(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 4, fontSize: 15 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 560 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span className="label-muted" style={{ margin: 0 }}>or scan live trends</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {prefsLoaded && userPreferredCategories.length > 0 && (
            <div className="card" style={{
              width: '100%', maxWidth: 560, padding: '14px 18px',
              background: usePersonalized ? 'var(--lavender-bg)' : 'var(--card)',
              borderColor: usePersonalized ? 'var(--lavender)' : 'var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 650, color: usePersonalized ? 'var(--lavender-ink)' : 'var(--foreground)' }}>
                  {usePersonalized ? 'Using your saved interests' : 'Using single category'}
                </span>
                <button onClick={() => setUsePersonalized(!usePersonalized)} className="badge" style={{ cursor: 'pointer', border: '1px solid var(--lavender)', background: 'var(--card)', color: 'var(--foreground)' }}>
                  {usePersonalized ? 'Switch to single' : 'Use my interests'}
                </button>
              </div>
              {usePersonalized ? (
                <p style={{ fontSize: 12, color: 'var(--lavender-ink)', margin: 0, lineHeight: 1.55 }}>
                  Scanning <strong>{userPreferredCategories.length} interest{userPreferredCategories.length > 1 ? 's' : ''}</strong>
                  {' '}{userPreferredCategories.slice(0, 4).join(', ')}{userPreferredCategories.length > 4 ? ` +${userPreferredCategories.length - 4} more` : ''}
                  {userCustomSources.length > 0 && (<> plus <strong>{userCustomSources.length} custom source{userCustomSources.length > 1 ? 's' : ''}</strong></>)}
                </p>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
                  You have saved interests.{' '}
                  <button onClick={() => setUsePersonalized(true)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0, textDecoration: 'underline' }}>Use them instead</button>
                </p>
              )}
            </div>
          )}

          {(!usePersonalized || userPreferredCategories.length === 0) && (
            <div style={{ width: '100%', maxWidth: 560 }}>
              <label className="label-muted">Pick categories</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.keys(CATEGORIES).map(cat => {
                  const on = selectedCategories.includes(cat);
                  return (
                    <button key={cat} onClick={() => {
                        if (on) { if (selectedCategories.length > 1) setSelectedCategories(prev => prev.filter(c => c !== cat)); }
                        else setSelectedCategories(prev => [...prev, cat]);
                      }}
                      style={{
                        padding: '8px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 550, cursor: 'pointer',
                        border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`,
                        background: on ? 'var(--primary)' : 'var(--card)',
                        color: on ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                        transition: 'all 0.15s', fontFamily: 'inherit',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={startScan} className="btn-primary" style={{ fontSize: 15, padding: '13px 36px' }}>
            <Radio size={16} /> Start scanning
          </button>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, marginTop: -8, textAlign: 'center' }}>
            Takes a few seconds · Public sources across {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
      )}
      {scanning && (
        <div className="card" style={{ textAlign: 'center', padding: '44px 32px', maxWidth: 480, margin: '0 auto' }}>
          <Radio size={30} style={{ color: 'var(--lavender-ink)', marginBottom: 16 }} />
          <div style={{ fontSize: 14, color: 'var(--foreground)', fontWeight: 600, marginBottom: 20 }}>{scanMsg}</div>
          <div style={{ height: 6, background: 'var(--muted)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${scanPct}%`, height: '100%', background: 'var(--primary)', borderRadius: 3, transition: 'width 0.35s ease' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{scanPct}%</div>
        </div>
      )}
      {found && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--butter-bg)' }}>
                <Trophy size={18} style={{ color: 'var(--butter-ink)' }} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.45, marginBottom: 10, color: 'var(--foreground)' }}>{found.topic}</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(() => { const hs = hookStyle(found.hook); return <span className="badge" style={{ background: hs.bg, color: hs.ink }}>{found.hook}</span>; })()}
                  <span className="badge badge-muted">{found.category}</span>
                  <span className="badge badge-neutral">{found.platform}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>{found.virality}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Potential / 10</div>
              </div>
            </div>
            {found.engagement > 0 && (
              <div style={{ display: 'inline-flex', flexDirection: 'column', background: 'var(--muted)', borderRadius: 'var(--radius-sm)', padding: '10px 18px', marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{found.engagement.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>Public engagements</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => onSelect(found)} className="btn-primary" style={{ flex: 1 }}>
                <PenLine size={15} /> Write a post on this topic
              </button>
              <button onClick={startScan} className="btn-secondary">
                <RefreshCw size={14} /> Rescan
              </button>
            </div>
          </div>
          {allTrends.length > 1 && (
            <div>
              <div className="label-muted" style={{ marginBottom: 10 }}>Other trending topics</div>
              {allTrends.slice(1, 12).map((t, idx) => (
                <div key={t.id} onClick={() => onSelect(t)} className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 700, width: 22 }}>#{idx + 2}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{t.topic}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)' }}>{t.virality}/10</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PLATFORM_PROMPTS: Record<string, (topic: string, fw: string) => string> = {
  linkedin: (topic, fw) => `Write a viral LinkedIn post about: "${topic}"\n\nUse the ${fw} framework. Make it engaging, insightful and professional. Include:\n- A powerful hook first line\n- Short paragraphs (1-2 sentences each)\n- Use → bullet points\n- End with a CTA or question\n- Add 3-5 highly relevant hashtags at the very bottom\n- 150-250 words\n- Use **bold** (double asterisks) around the title and key phrases.\n\nWrite ONLY the post content.`,
  twitter_thread: (topic, fw) => `Write a viral X thread about: "${topic}"\n\nUse the ${fw} framework. Format as a numbered thread (1/ through 7/). Each post under 280 characters. Short punchy sentences.\n\nWrite ONLY the thread content.`,
  twitter: (topic, fw) => `Write a single viral post for X about: "${topic}"\n\nUse the ${fw} framework. Under 280 characters. Punchy and contrarian.\n\nWrite ONLY the post.`,
  viral_story: (topic) => `Write a story-style post about: "${topic}"\n\nFormat:\n- 3-5 short paragraphs, each 2-3 lines max\n- Use **double asterisks** around 2-3 emotionally impactful words per paragraph\n- Conversational, personal narrative tone — like telling a true story\n- Start with a short hook scene or relatable moment\n- Build tension or insight across paragraphs\n- End with one powerful takeaway line\n- 120-200 words total; 2-3 hashtags at the very end only\n- No bullet points, no numbered lists, no jargon\n\nWrite ONLY the post content.`,
};

const FRAMEWORKS: Record<string, string> = {
  oem: 'OEM (Observation → Explanation → Model)',
  pas: 'PAS (Problem → Agitation → Solution)',
  thread: 'Thread (Hook → Insight → Example → Conclusion)',
};

function GenerateStep({ topic, onGenerated }: { topic: TrendTopic; onGenerated: (d: { content: string; platform: string; topic: TrendTopic }) => void }) {
  const [platform, setPlatform] = useState('linkedin');
  const [framework, setFramework] = useState('oem');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState('');
  const [streamText, setStreamText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PLATFORM_LABELS: Record<string, string> = { linkedin: 'LinkedIn post', twitter_thread: 'X thread', twitter: 'X post', carousel: 'Carousel (opens studio)', viral_story: 'Story-style post' };

  async function handleGenerate() {
    setError(''); setLoading(true); setGenerated(''); setStreamText('');
    if (platform === 'carousel') {
      setLoading(false);
      onGenerated({ content: '(carousel)', platform: 'carousel', topic });
      return;
    }
    const promptFn = PLATFORM_PROMPTS[platform];
    const fwLabel = FRAMEWORKS[framework].split(' ')[0];
    const prompt = promptFn(topic.topic, fwLabel);
    try {
      const res = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], max_tokens: 600 }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || `Request failed (${res.status})`); }
      const data = await res.json();
      const text = data.choices[0]?.message?.content?.trim() || '';
      let finalContent = text;
      if (platform === 'linkedin') finalContent = processLinkedInFormatting(finalContent);
      setGenerated(finalContent);
      let i = 0;
      intervalRef.current = setInterval(() => {
        i += 4;
        let currentText = text.slice(0, i);
        if (platform === 'linkedin') currentText = processLinkedInFormatting(currentText);
        setStreamText(currentText);
        if (i >= text.length) { if (intervalRef.current) clearInterval(intervalRef.current); setStreamText(finalContent); }
      }, 18);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not generate right now. Please try again.');
    } finally { setLoading(false); }
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div style={{ display: 'flex', gap: 24, maxWidth: 900, margin: '0 auto', width: '100%', flexWrap: 'wrap' }}>
      <div className="card" style={{ width: 280, flexShrink: 0, alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: 0 }}>Writing about:</p>
          <p style={{ color: 'var(--foreground)', fontSize: 14, fontWeight: 600, marginTop: 4, lineHeight: 1.5 }}>{topic.topic.slice(0, 80)}{topic.topic.length > 80 ? '…' : ''}</p>
        </div>
        <div>
          <label className="label-muted">Format</label>
          {Object.entries(PLATFORM_LABELS).map(([id, label]) => (
            <button key={id} onClick={() => setPlatform(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${platform === id ? 'var(--primary)' : 'var(--border)'}`, background: platform === id ? 'var(--primary)' : 'var(--card)', color: platform === id ? 'var(--primary-foreground)' : 'var(--muted-foreground)', fontWeight: 550, fontSize: 13, cursor: 'pointer', marginBottom: 6, textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${platform === id ? 'var(--primary-foreground)' : 'var(--border)'}`, background: platform === id ? 'var(--primary-foreground)' : 'transparent', flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>
        <div>
          <label className="label-muted">Structure</label>
          {Object.entries(FRAMEWORKS).map(([id, label]) => (
            <button key={id} onClick={() => setFramework(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', borderRadius: 'var(--radius-sm)', border: `1px solid ${framework === id ? 'var(--primary)' : 'var(--border)'}`, background: framework === id ? 'var(--primary-muted)' : 'var(--card)', color: framework === id ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: 550, fontSize: 12, cursor: 'pointer', marginBottom: 6, textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit', lineHeight: 1.45 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${framework === id ? 'var(--primary)' : 'var(--border)'}`, background: framework === id ? 'var(--primary)' : 'transparent', flexShrink: 0 }} />
              {label}
            </button>
          ))}
        </div>
        {error && <div role="alert" style={{ background: 'var(--rose-bg)', color: 'var(--rose-ink)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, lineHeight: 1.55 }}>{error}</div>}
        <button onClick={handleGenerate} disabled={loading} className="btn-primary" style={{ width: '100%' }}>
          <Sparkles size={15} /> {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>
      <div className="card" style={{ flex: 1, minWidth: 300, minHeight: 380, display: 'flex', flexDirection: 'column' }}>
        {!generated && !loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', gap: 12 }}>
            <PenLine size={26} />
            <p style={{ fontSize: 14, textAlign: 'center' }}>Your generated post will appear here.<br />You can edit every word before moving on.</p>
          </div>
        )}
        {loading && !streamText && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div className="animate-spin rounded-full" style={{ width: 26, height: 26, border: '2px solid var(--border)', borderTopColor: 'var(--primary)' }} />
            <p style={{ color: 'var(--muted-foreground)', fontWeight: 550, fontSize: 14 }}>Writing your post…</p>
          </div>
        )}
        {(streamText || generated) && (
          <>
            <textarea value={streamText || generated} onChange={e => setGenerated(e.target.value)} style={{ width: '100%', flex: 1, minHeight: 260, background: 'none', border: 'none', color: 'var(--foreground)', fontSize: 14, lineHeight: 1.75, fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
            <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 14 }}>
              <button onClick={() => onGenerated({ content: generated, platform, topic })} className="btn-primary" style={{ flex: 1 }}>
                Review <ArrowRight size={14} />
              </button>
              <button onClick={handleGenerate} className="btn-secondary">
                <RefreshCw size={13} /> Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PreviewStep({ data, onApprove }: { data: { content: string; platform: string; topic: TrendTopic }; onApprove: (d: typeof data) => void }) {
  const [content, setContent] = useState(data.content);
  const PLATFORM_LABELS: Record<string, string> = { linkedin: 'LinkedIn', twitter_thread: 'X thread', twitter: 'X', viral_story: 'Story post' };
  return (
    <div style={{ display: 'flex', gap: 24, maxWidth: 900, margin: '0 auto', width: '100%', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 300 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--foreground)' }}>Preview</h3>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lavender-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: 'var(--lavender-ink)' }}>You</div>
            <div>
              <div style={{ fontWeight: 650, fontSize: 14, color: 'var(--foreground)' }}>Your profile</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{PLATFORM_LABELS[data.platform] ?? 'Post'} preview</div>
            </div>
          </div>
          <div style={{ padding: '20px 22px', fontSize: 14, lineHeight: 1.75, color: 'var(--foreground)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</div>
        </div>
      </div>
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h4 style={{ fontWeight: 650, fontSize: 14, marginBottom: 10, color: 'var(--foreground)' }}>Edit before finishing</h4>
          <textarea value={content} onChange={e => setContent(e.target.value)} className="input-field" style={{ minHeight: 220, fontSize: 13, lineHeight: 1.65 }} />
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>{content.length} characters</div>
        </div>
        <button onClick={() => onApprove({ ...data, content })} className="btn-primary" style={{ justifyContent: 'center', marginTop: 'auto' }}>
          Looks good, continue <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function buildSlides(content: string, topic: TrendTopic): { headline: string; body: string; slide: number }[] {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const slides: { headline: string; body: string; slide: number }[] = [];
  slides.push({ headline: topic.topic.slice(0, 60), body: topic.hook, slide: 1 });
  const chunks = lines.reduce<string[][]>((acc, line) => {
    if (acc[acc.length - 1].length < 3) acc[acc.length - 1].push(line);
    else acc.push([line]);
    return acc;
  }, [[]]);
  chunks.slice(0, 5).forEach((chunk, i) => {
    slides.push({ headline: `Part ${i + 2}`, body: chunk.join(' '), slide: i + 2 });
  });
  slides.push({ headline: 'Save & share', body: 'Follow for more insights like this.', slide: slides.length + 1 });
  return slides;
}

function renderSlideToCanvas(slide: { headline: string; body: string; slide: number }, total: number, isReel: boolean = false): HTMLCanvasElement {
  const W = 1080, H = isReel ? 1920 : 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#FAF9F6'); grad.addColorStop(1, '#EFE9DF');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  const yStart = isReel ? 440 : 260;

  ctx.fillStyle = '#29251E'; ctx.beginPath(); ctx.arc(isReel ? W / 2 : 90, isReel ? yStart - 100 : 90, 40, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${slide.slide}/${total}`, isReel ? W / 2 : 90, isReel ? yStart - 100 : 90);

  ctx.fillStyle = '#29251E'; ctx.font = 'bold 68px sans-serif';
  ctx.textAlign = isReel ? 'center' : 'left';
  ctx.textBaseline = 'top';
  const maxW = W - 120;
  const words = slide.headline.split(' ');
  let line = ''; let y = yStart;
  for (const w of words) {
    const test = line + (line ? ' ' : '') + w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, isReel ? W / 2 : 60, y); line = w; y += 84; }
    else { line = test; }
  }
  if (line) { ctx.fillText(line, isReel ? W / 2 : 60, y); y += 84; }

  ctx.strokeStyle = '#B3402E'; ctx.lineWidth = 4; ctx.beginPath();
  if (isReel) { ctx.moveTo(W / 2 - 140, y + 20); ctx.lineTo(W / 2 + 140, y + 20); }
  else { ctx.moveTo(60, y + 20); ctx.lineTo(W - 60, y + 20); }
  ctx.stroke(); y += 56;

  ctx.fillStyle = 'rgba(41,37,30,0.72)'; ctx.font = '36px sans-serif';
  const bodyWords = slide.body.split(' ');
  let bLine = ''; let by = y;
  for (const w of bodyWords) {
    const test = bLine + (bLine ? ' ' : '') + w;
    if (ctx.measureText(test).width > maxW && bLine) { ctx.fillText(bLine, isReel ? W / 2 : 60, by); bLine = w; by += 48; }
    else { bLine = test; }
  }
  if (bLine) ctx.fillText(bLine, isReel ? W / 2 : 60, by);

  ctx.fillStyle = 'rgba(41,37,30,0.35)'; ctx.font = '22px sans-serif';
  ctx.textAlign = isReel ? 'center' : 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Made with The Personal Brand', isReel ? W / 2 : W - 40, H - 40);
  return canvas;
}

function DownloadKitButton({ data }: { data: { content: string; platform: string; topic: TrendTopic } }) {
  const [dlState, setDlState] = useState<'idle' | 'working' | 'done'>('idle');
  const [dlProgress, setDlProgress] = useState('');
  const [dlError, setDlError] = useState('');

  async function handleDownloadKit() {
    try {
      setDlState('working'); setDlError('');
      const slides = buildSlides(data.content, data.topic);
      const canvases = slides.map(s => renderSlideToCanvas(s, slides.length));

      setDlProgress('Generating slide images…');
      await new Promise(r => setTimeout(r, 60));
      for (let i = 0; i < canvases.length; i++) {
        const url = canvases[i].toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `carousel-slide-${i + 1}.png`;
        a.click();
        await new Promise(r => setTimeout(r, 120));
      }

      setDlProgress('Building PDF…');
      await new Promise(r => setTimeout(r, 80));
      let jsPDF: any;
      try {
        // @ts-ignore
        if (window.jspdf?.jsPDF) jsPDF = window.jspdf.jsPDF;
        else {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload = () => resolve(); s.onerror = reject;
            document.head.appendChild(s);
          });
          // @ts-ignore
          jsPDF = window.jspdf.jsPDF;
        }
        const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1080, 1080] });
        for (let i = 0; i < canvases.length; i++) {
          if (i > 0) doc.addPage();
          doc.addImage(canvases[i].toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 1080, 1080);
        }
        doc.save(`carousel-kit-${Date.now()}.pdf`);
      } catch (pdfErr) {
        console.warn('jsPDF load failed, skipping PDF:', pdfErr);
        setDlError('PDF skipped (library unavailable). Images still downloaded.');
      }

      setDlProgress('Recording video…');
      await new Promise(r => setTimeout(r, 60));
      try {
        const reelCanvases = slides.map(s => renderSlideToCanvas(s, slides.length, true));
        const W = 1080, H = 1920;
        const reelCanvas = document.createElement('canvas');
        reelCanvas.width = W; reelCanvas.height = H;
        const rCtx = reelCanvas.getContext('2d')!;
        const stream = reelCanvas.captureStream(30);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        const recDone = new Promise<void>(res => { recorder.onstop = () => res(); });
        recorder.start();

        const SLIDE_DURATION_MS = 2200;
        const FPS = 30;
        const FRAMES_PER_SLIDE = Math.round((SLIDE_DURATION_MS / 1000) * FPS);
        const TRANSITION_FRAMES = 12;

        for (let si = 0; si < reelCanvases.length; si++) {
          const curr = reelCanvases[si];
          const next = reelCanvases[si + 1] || null;
          for (let f = 0; f < FRAMES_PER_SLIDE - TRANSITION_FRAMES; f++) {
            const scale = 1 + f * 0.0003;
            const ox = (W * (scale - 1)) / 2;
            const oy = (H * (scale - 1)) / 2;
            rCtx.clearRect(0, 0, W, H);
            rCtx.drawImage(curr, -ox, -oy, W * scale, H * scale);
            await new Promise(r => setTimeout(r, 1000 / FPS));
          }
          if (next) {
            for (let tf = 0; tf < TRANSITION_FRAMES; tf++) {
              const alpha = tf / TRANSITION_FRAMES;
              rCtx.clearRect(0, 0, W, H);
              rCtx.globalAlpha = 1; rCtx.drawImage(curr, 0, 0, W, H);
              rCtx.globalAlpha = alpha; rCtx.drawImage(next, 0, 0, W, H);
              rCtx.globalAlpha = 1;
              await new Promise(r => setTimeout(r, 1000 / FPS));
            }
          }
        }
        rCtx.drawImage(reelCanvases[reelCanvases.length - 1], 0, 0, W, H);
        await new Promise(r => setTimeout(r, 800));
        recorder.stop();
        await recDone;
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `reel-${Date.now()}.webm`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (vidErr) {
        console.warn('Video recording failed:', vidErr);
        if (!dlError) setDlError('Video skipped (not supported here). Images downloaded.');
      }

      setDlState('done');
      setDlProgress('');
    } catch (err: any) {
      setDlState('idle');
      setDlError(err?.message || 'Download failed. Please try again.');
    }
  }

  return (
    <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>Download full kit</div>
      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: -8 }}>Slide images · PDF · short video — one tap</div>
      {dlState === 'working' && (
        <div style={{ background: 'var(--muted)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
          <div style={{ fontSize: 12, color: 'var(--foreground)', fontWeight: 600, marginBottom: 6 }}>{dlProgress}</div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '60%', background: 'var(--primary)', borderRadius: 2, animation: 'pulseSoft 1.2s ease-in-out infinite' }} />
          </div>
        </div>
      )}
      {dlState === 'done' && (
        <div className="badge badge-success" style={{ alignSelf: 'flex-start', padding: '6px 12px' }}>
          <CheckCircle2 size={12} /> All files downloaded
        </div>
      )}
      {dlError && (
        <div style={{ background: 'var(--butter-bg)', border: '1px solid var(--amber)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 11, color: 'var(--butter-ink)', lineHeight: 1.5 }}>
          {dlError}
        </div>
      )}
      <button id="download-full-kit-btn" onClick={handleDownloadKit} disabled={dlState === 'working'} className="btn-primary">
        {dlState === 'working' ? 'Building kit…' : dlState === 'done' ? 'Kit downloaded' : 'Download full kit'}
      </button>
    </div>
  );
}

function FinishStep({ data, onRestart }: { data: { content: string; platform: string; topic: TrendTopic }; onRestart: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaving(true);
    addBriefToGrowthWorkspace({
      origin: 'autopilot',
      niche: data.topic.category,
      platform: data.platform,
      title: data.topic.topic,
      sourceTitle: data.topic.platform,
      content: data.content,
      savedAt: new Date().toISOString(),
    });
    setTimeout(() => { setSaved(true); setSaving(false); }, 400);
  }

  if (saved) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '48px 20px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--sage-bg)' }}>
        <CheckCircle2 size={26} style={{ color: 'var(--sage-ink)' }} />
      </span>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)' }}>Saved to your pipeline</h3>
      <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.65, maxWidth: 360 }}>
        Find it under Home → Your content pipeline. To publish directly instead of exporting, connect an account in Settings.
      </p>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <DownloadKitButton data={data} />
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/plan" className="btn-secondary">Open calendar</Link>
        <Link href="/settings/connections" className="btn-secondary">Connect accounts</Link>
        <button onClick={onRestart} className="btn-ghost">Start another</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 28, maxWidth: 780, margin: '0 auto', width: '100%', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: 'var(--foreground)' }}>Save & export</h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Keep this post in your pipeline, or export it to publish manually.</p>
        </div>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 650, fontSize: 14, color: 'var(--foreground)' }}>Publish directly</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>Connect LinkedIn or X to post from here.</div>
            </div>
            <Link href="/settings/connections" className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>Connect</Link>
          </div>
        </div>
        <DownloadKitButton data={data} />
      </div>
      <div style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card">
          <div className="label-muted">Post summary</div>
          {[
            { label: 'Topic', val: data.topic.topic.slice(0, 40) + (data.topic.topic.length > 40 ? '…' : '') },
            { label: 'Format', val: data.platform },
            { label: 'Length', val: `${data.content.length} chars` },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>{m.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--foreground)', textAlign: 'right', maxWidth: '55%' }}>{m.val}</span>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '13px' }}>
          <SendHorizonal size={15} /> {saving ? 'Saving…' : 'Save to pipeline'}
        </button>
        <button onClick={onRestart} className="btn-ghost">Start over</button>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: Radio, label: 'Find topic' },
  { icon: PenLine, label: 'Generate' },
  { icon: Eye, label: 'Review' },
  { icon: SendHorizonal, label: 'Finish' },
];

export default function AutoPilotPage() {
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState<TrendTopic | null>(null);
  const [postData, setPostData] = useState<{ content: string; platform: string; topic: TrendTopic } | null>(null);
  const isCarousel = postData?.platform === 'carousel';

  function handleTopicSelect(t: TrendTopic) { setTopic(t); setStep(1); }
  function handleGenerated(data: { content: string; platform: string; topic: TrendTopic }) {
    setPostData(data);
    setStep(2);
  }
  function handleApproved(data: { content: string; platform: string; topic: TrendTopic }) { setPostData(data); setStep(3); }
  function resetAll() { setStep(0); setTopic(null); setPostData(null); }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>The Personal Brand</h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Guided flow: find a topic, generate the post, review, then save or export.</p>
        </div>
        {step > 0 && <button onClick={resetAll} className="btn-secondary" style={{ fontSize: 13 }}>Start over</button>}
      </div>
      <StepIndicator steps={STEPS} current={step} />
      <div style={{ minHeight: 400 }}>
        {step === 0 && <ScanStep onSelect={handleTopicSelect} />}
        {step === 1 && topic && <GenerateStep topic={topic} onGenerated={handleGenerated} />}
        {step === 2 && postData && isCarousel && (
          <div className="card" style={{ maxWidth: 560, margin: '48px auto', textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Continue in Carousel Studio</h3>
            <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 20, lineHeight: 1.6 }}>
              Carousels are built in the dedicated studio with live previews and export.
            </p>
            <Link href={`/carousel?topic=${encodeURIComponent(postData.topic.topic)}`} className="btn-primary">Open Carousel Studio</Link>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setStep(1)} className="btn-ghost">Back</button>
            </div>
          </div>
        )}
        {step === 2 && postData && !isCarousel && <PreviewStep data={postData} onApprove={handleApproved} />}
        {step === 3 && postData && <FinishStep data={postData} onRestart={resetAll} />}
      </div>
    </div>
  );
}
