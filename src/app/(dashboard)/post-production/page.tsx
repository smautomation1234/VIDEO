"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Scissors, BarChart2, Wand2, Check, RefreshCw, Copy, Scissors as ScissorsIcon, PlayCircle, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function PostProductionPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'edit' | 'analytics'>('upload');

  // --- Upload Assistant State ---
  const [videoSummary, setVideoSummary] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('YouTube');
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaResult, setMetaResult] = useState<any>(null);

  // --- Text Editor State ---
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [editorProcessing, setEditorProcessing] = useState(false);
  const [videoRendered, setVideoRendered] = useState(false);
  
  const ffmpegRef = useRef<any>(null);
  useEffect(() => {
    ffmpegRef.current = new FFmpeg();
  }, []);

  // --- Analytics State ---
  const dummyAnalytics = JSON.stringify({
    views: 14500,
    avgViewDuration: "0:45",
    retentionAt3s: "40%",
    ctr: "3.2%",
    topKeywords: ["AI", "Tech", "Future"]
  }, null, 2);
  const [analyticsData, setAnalyticsData] = useState(dummyAnalytics);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsResult, setAnalyticsResult] = useState<any>(null);

  const generateMetadata = async () => {
    if (!videoSummary.trim()) return;
    setMetaLoading(true); setMetaResult(null);
    try {
      const res = await fetch('/api/post-production/metadata', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoSummary, targetPlatform })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMetaResult(data);
    } catch (e: any) { alert(e.message); }
    setMetaLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setTranscribing(true);
    setTranscript([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/post-production/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTranscript(data.transcript);
      setVideoRendered(false);
    } catch (e: any) {
      alert(e.message);
    }
    setTranscribing(false);
  };

  const processVideoCuts = async () => {
    if (!videoFile || transcript.length === 0) return;
    setEditorProcessing(true);
    
    try {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg.loaded) {
        await ffmpeg.load();
      }

      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

      // Calculate segments to KEEP
      const segmentsToKeep: {start: number, end: number}[] = [];
      let currentStart = 0;
      let keeping = false;

      transcript.forEach((word) => {
        if (word.keep && !keeping) {
          currentStart = word.start;
          keeping = true;
        } else if (!word.keep && keeping) {
          // Add small buffer to avoid cutting words off
          segmentsToKeep.push({ start: currentStart, end: word.start });
          keeping = false;
        }
      });
      if (keeping) {
        segmentsToKeep.push({ start: currentStart, end: transcript[transcript.length - 1].end + 0.5 });
      }

      if (segmentsToKeep.length === 0) {
        setEditorProcessing(false);
        return;
      }

      // Generate FFmpeg filter complex string
      let filterComplex = '';
      let concatInputs = '';
      
      segmentsToKeep.forEach((seg, i) => {
        filterComplex += `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}];`;
        filterComplex += `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}];`;
        concatInputs += `[v${i}][a${i}]`;
      });
      
      filterComplex += `${concatInputs}concat=n=${segmentsToKeep.length}:v=1:a=1[outv][outa]`;

      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-map', '[outa]',
        'output.mp4'
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      setVideoUrl(URL.createObjectURL(blob));
      setVideoRendered(true);
      setTranscript(prev => prev.filter(w => w.keep));

    } catch (e: any) {
      console.error(e);
      alert('Error trimming video. Ensure your terminal server was restarted to apply next.config.ts COEP headers.');
    }
    
    setEditorProcessing(false);
  };

  const generateAnalytics = async () => {
    if (!analyticsData.trim()) return;
    setAnalyticsLoading(true); setAnalyticsResult(null);
    try {
      const res = await fetch('/api/post-production/analytics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyticsData })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalyticsResult(data);
    } catch (e: any) { alert(e.message); }
    setAnalyticsLoading(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
      
      {/* Header matching prompt screenshot */}
      <div style={{ background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)', borderRadius: 16, padding: 28, border: '1px solid #991b1b', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: '#ef4444', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wand2 size={24} color="#fca5a5" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>AI in editing, uploading, and analytics</h1>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fecaca', fontSize: 14 }}>
                <div style={{ background: '#ef4444', borderRadius: '50%', padding: 2, display: 'flex' }}><Check size={12} color="#fff" /></div>
                Write captions, titles, and subtitles faster
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fecaca', fontSize: 14 }}>
                <div style={{ background: '#ef4444', borderRadius: '50%', padding: 2, display: 'flex' }}><Check size={12} color="#fff" /></div>
                Edit your videos faster using AI
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fecaca', fontSize: 14 }}>
                <div style={{ background: '#ef4444', borderRadius: '50%', padding: 2, display: 'flex' }}><Check size={12} color="#fff" /></div>
                Understand what’s actually 'WORKING' in your content
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, background: 'var(--card)', padding: 6, borderRadius: 12, border: '1px solid var(--border)' }}>
        {[
          { id: 'upload', label: 'Upload Assistant', icon: <Upload size={16}/>, color: '#8b5cf6' },
          { id: 'edit', label: 'Text-Based Editor', icon: <Scissors size={16}/>, color: '#ef4444' },
          { id: 'analytics', label: 'AI Analyst', icon: <BarChart2 size={16}/>, color: '#10b981' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px',
            borderRadius: 8, border: 'none', background: activeTab === t.id ? `${t.color}15` : 'transparent',
            color: activeTab === t.id ? t.color : 'var(--muted-foreground)', fontWeight: activeTab === t.id ? 700 : 500,
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, minHeight: 500 }}>
        
        {/* --- UPLOAD TAB --- */}
        {activeTab === 'upload' && (
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Platform</label>
                <select value={targetPlatform} onChange={e => setTargetPlatform(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}>
                  <option>YouTube</option>
                  <option>TikTok</option>
                  <option>Instagram Reels</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Raw Video Summary or Transcript</label>
                <textarea value={videoSummary} onChange={e => setVideoSummary(e.target.value)} placeholder="Paste the script, summary, or rough ideas of the video you are about to upload..." style={{ width: '100%', height: 200, padding: '12px', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 14, outline: 'none', resize: 'vertical' }} />
              </div>
              <button onClick={generateMetadata} disabled={metaLoading || !videoSummary} style={{ background: metaLoading ? '#334155' : '#8b5cf6', color: '#fff', border: 'none', padding: '14px', borderRadius: 10, fontWeight: 700, cursor: metaLoading || !videoSummary ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {metaLoading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }}/> : <Wand2 size={18}/>} Generate Metadata
              </button>
            </div>
            
            <div style={{ background: 'var(--background)', borderRadius: 12, padding: 24, border: '1px solid var(--border)', overflowY: 'auto', maxHeight: 600 }}>
              {metaLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b5cf6', gap: 16 }}>
                  <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite' }} />
                  <div>Optimizing SEO and writing titles...</div>
                </div>
              ) : metaResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 8 }}>🔥 Optimized Titles</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {metaResult.titles.map((t: string, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--muted)', padding: '12px', borderRadius: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{t}</span>
                          <button onClick={() => copyText(t)} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer' }}><Copy size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 8 }}>📝 Description</div>
                    <div style={{ position: 'relative' }}>
                      <textarea readOnly value={metaResult.description} style={{ width: '100%', height: 150, padding: '12px', borderRadius: 8, background: 'var(--muted)', border: 'none', color: 'var(--foreground)', fontSize: 14, resize: 'none' }} />
                      <button onClick={() => copyText(metaResult.description)} style={{ position: 'absolute', top: 12, right: 12, background: 'var(--card)', border: '1px solid var(--border)', padding: '6px', borderRadius: 6, color: '#8b5cf6', cursor: 'pointer' }}><Copy size={14}/></button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 8 }}>🏷️ Tags</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {metaResult.tags.map((t: string, i: number) => <span key={i} style={{ fontSize: 11, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '4px 8px', borderRadius: 20 }}>{t}</span>)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 8 }}>⏱️ Timestamps</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--muted)', padding: 12, borderRadius: 8 }}>
                        {metaResult.timestamps?.map((ts: any, i: number) => (
                          <div key={i} style={{ fontSize: 12, color: '#8b5cf6', fontFamily: 'monospace' }}>{ts.time} <span style={{ color: 'var(--foreground)' }}>{ts.label}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)' }}>
                  <Upload size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <div>Paste your summary to generate metadata.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- EDIT TAB --- */}
        {activeTab === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
            <div style={{ maxWidth: 800, width: '100%' }}>
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Text-Based Video Editor</h2>
                <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Upload an MP4 to transcribe, click on filler words (red) to delete them, then render your cut.</p>
              </div>

              {!videoFile ? (
                 <div style={{ width: '100%', height: 250, border: '2px dashed var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
                    <input type="file" accept="video/mp4,video/webm" onChange={handleFileUpload} style={{ marginBottom: 16 }} />
                    <div>Select an MP4 file to begin editing.</div>
                 </div>
              ) : (
                <>
                  {/* Video Player */}
                  <div style={{ width: '100%', height: 400, background: '#000', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                    <video src={videoUrl || undefined} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    
                    {editorProcessing && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444', gap: 12, zIndex: 10 }}>
                        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                        <div style={{ fontWeight: 700 }}>Trimming via ffmpeg.wasm...</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>This happens entirely locally in your browser.</div>
                      </div>
                    )}
                  </div>

                  {/* Transcript Editor */}
                  {transcribing ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#ef4444', background: 'var(--background)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                      <div style={{ fontWeight: 700 }}>AI is transcribing your video...</div>
                      <div style={{ fontSize: 13, marginTop: 8, opacity: 0.8 }}>Generating word-level timestamps using Whisper</div>
                    </div>
                  ) : (
                    <div style={{ padding: 24, background: 'var(--background)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      {videoRendered && (
                        <div style={{ marginBottom: 16, padding: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                          <Check size={18} /> Rendered video is ready above!
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 18, lineHeight: 1.6 }}>
                        {transcript.map((word, i) => (
                          <span 
                            key={i} 
                            onClick={() => !videoRendered && setTranscript(prev => prev.map((w, idx) => idx === i ? { ...w, keep: !w.keep } : w))}
                            style={{ 
                              cursor: videoRendered ? 'default' : 'pointer', 
                              padding: '2px 6px', 
                              borderRadius: 6,
                              background: word.keep ? 'transparent' : 'rgba(239,68,68,0.2)',
                              color: word.keep ? 'var(--foreground)' : '#ef4444',
                              textDecoration: word.keep ? 'none' : 'line-through',
                              transition: 'all 0.2s'
                            }}
                          >
                            {word.text}
                          </span>
                        ))}
                        {transcript.length === 0 && (
                          <div style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>No speech detected.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <button onClick={processVideoCuts} disabled={editorProcessing || transcribing || videoRendered || transcript.length === 0} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: editorProcessing || transcribing || videoRendered ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: (editorProcessing || transcribing || videoRendered) ? 0.5 : 1 }}>
                      <ScissorsIcon size={20} /> {videoRendered ? 'Cut Complete' : 'Cut Dead Air & Render'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- ANALYTICS TAB --- */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Raw Analytics (JSON)</label>
                <textarea value={analyticsData} onChange={e => setAnalyticsData(e.target.value)} style={{ width: '100%', height: 300, padding: '12px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', fontFamily: 'monospace', fontSize: 12, outline: 'none', resize: 'vertical' }} />
              </div>
              <button onClick={generateAnalytics} disabled={analyticsLoading || !analyticsData} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                {analyticsLoading ? <RefreshCw size={16} className="animate-spin"/> : <BarChart2 size={16}/>} Analyze data
              </button>
            </div>
            
            <div style={{ background: 'var(--background)', borderRadius: 12, padding: 32, border: '1px solid var(--border)', overflowY: 'auto', maxHeight: 600 }}>
              {analyticsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#10b981', gap: 16 }}>
                  <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite' }} />
                  <div>Parsing data and identifying trends...</div>
                </div>
              ) : analyticsResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.5, borderLeft: '4px solid #10b981', paddingLeft: 16 }}>
                    {analyticsResult.summary}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', padding: 20, borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 700, marginBottom: 12 }}><TrendingUp size={18}/> What's Working</div>
                      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--foreground)', fontSize: 14 }}>
                        {analyticsResult.workingWell.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: 20, borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 700, marginBottom: 12 }}><AlertTriangle size={18}/> Needs Improvement</div>
                      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--foreground)', fontSize: 14 }}>
                        {analyticsResult.needsImprovement.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--foreground)' }}><Lightbulb size={20} color="#f59e0b" /> Actionable Strategy</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {analyticsResult.actionableTips.map((tip: any, i: number) => (
                        <div key={i} style={{ background: 'var(--muted)', padding: '16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#f59e0b' }}>{tip.title}</div>
                          <div style={{ fontSize: 14, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{tip.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)' }}>
                  <BarChart2 size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <div>Click Analyze to process your raw data into insights.</div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
