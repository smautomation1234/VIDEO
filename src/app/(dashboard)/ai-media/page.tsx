"use client";
import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Image as ImageIcon, Video, Mic, Download, RefreshCw, Check, Play, Move, SlidersHorizontal, Info, Layers, Sparkles } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Toast from '@/components/ui/Toast';

const VOICES = [
  { id: 'alloy', label: 'Alloy', desc: 'Neutral, versatile, male-leaning' },
  { id: 'echo', label: 'Echo', desc: 'Warm, round, male' },
  { id: 'fable', label: 'Fable', desc: 'Expressive, British, male' },
  { id: 'onyx', label: 'Onyx', desc: 'Deep, authoritative, male' },
  { id: 'nova', label: 'Nova', desc: 'Energetic, professional, female' },
  { id: 'shimmer', label: 'Shimmer', desc: 'Clear, bright, female' },
];

const ASPECT_RATIOS = [
  { id: '1024x1024', label: 'Square (1:1)' },
  { id: '1792x1024', label: 'Landscape (16:9)' },
  { id: '1024x1792', label: 'Portrait (9:16)' },
];

const CAMERA_MOTIONS = [
  { id: 'zoom-in', label: 'Zoom In' },
  { id: 'zoom-out', label: 'Zoom Out' },
  { id: 'pan-left', label: 'Pan Left' },
  { id: 'pan-right', label: 'Pan Right' },
  { id: 'tilt-up', label: 'Tilt Up' },
  { id: 'tilt-down', label: 'Tilt Down' },
];

export default function AIMediaPage() {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio' | 'carousel'>('image');
  const [toast, setToast] = useState<string | null>(null);

  // Image State
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgStyle, setImgStyle] = useState('vivid');
  const [imgSize, setImgSize] = useState('1024x1024');
  const [imgQuality, setImgQuality] = useState('standard');
  const [imgLoading, setImgLoading] = useState(false);
  const [imgResult, setImgResult] = useState<{ url: string; revisedPrompt: string } | null>(null);

  // Audio State
  const [audioText, setAudioText] = useState('');
  const [voice, setVoice] = useState('onyx');
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Video State
  const [videoSourceImg, setVideoSourceImg] = useState<string | null>(null);
  const [cameraMotion, setCameraMotion] = useState('zoom-in');
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoResult, setVideoResult] = useState<boolean>(false);

  // Carousel State
  const [carPrompt, setCarPrompt] = useState('');
  const [carTheme, setCarTheme] = useState('dark');
  const [carSlides, setCarSlides] = useState(5);
  const [carLoading, setCarLoading] = useState(false);
  const [carResult, setCarResult] = useState<any[] | null>(null);
  const [carReferenceImg, setCarReferenceImg] = useState<string | null>(null);
  const [carCustomDesign, setCarCustomDesign] = useState<any | null>(null);
  const [carName, setCarName] = useState('Your Name');
  const [carHandle, setCarHandle] = useState('@handle');
  const [carAvatar, setCarAvatar] = useState<string | null>(null);

  const handleCarAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCarAvatar(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCarImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCarReferenceImg(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateCarousel = async () => {
    if (!carPrompt.trim()) return;
    setCarLoading(true); setCarResult(null); setCarCustomDesign(null);
    try {
      const res = await fetch('/api/media/carousel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: carPrompt, theme: carTheme, slideCount: carSlides, referenceImage: carReferenceImg })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCarResult(data.slides);
      if (data.design) setCarCustomDesign(data.design);
    } catch (e: any) { setToast(e.message); }
    setCarLoading(false);
  };

  const getContainerBg = () => {
    if (carCustomDesign?.background && typeof carCustomDesign.background === 'string' && carCustomDesign.background.startsWith('#')) {
      return carCustomDesign.background;
    }
    switch (carTheme) {
      case 'light': return '#f1f5f9';
      case 'cyberpunk': return '#050014';
      case 'corporate': return '#f8fafc';
      case 'brutalism': return '#000000';
      case 'sunset': return '#1a0b16';
      case 'glass':
      case 'dark':
      default:
        return '#0f172a';
    }
  };

  const downloadSlide = async (index: number) => {
    const el = document.getElementById(`slide-${index}`);
    if (!el) return;
    try {
      const containerBg = getContainerBg();
      const url = await toPng(el, { backgroundColor: containerBg, pixelRatio: 2, fontEmbedCSS: '' });
      const a = document.createElement('a');
      a.href = url;
      a.download = `carousel-slide-${index + 1}.png`;
      a.click();
    } catch (e) {
      console.error('Failed to download slide', e);
    }
  };

  const downloadAllSlides = async () => {
    if (!carResult) return;
    for (let i = 0; i < carResult.length; i++) {
      await downloadSlide(i);
      await new Promise(r => setTimeout(r, 600)); // Delay to prevent browser popup block
    }
  };

  const downloadAllSlidesPDF = async () => {
    if (!carResult) return;
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [340, 420]
      });

      const containerBg = getContainerBg();

      for (let i = 0; i < carResult.length; i++) {
        const el = document.getElementById(`slide-${i}`);
        if (!el) continue;
        
        const imgData = await toPng(el, { backgroundColor: containerBg, pixelRatio: 2, fontEmbedCSS: '' });
        
        if (i > 0) pdf.addPage([340, 420], 'portrait');
        pdf.addImage(imgData, 'PNG', 0, 0, 340, 420);
      }
      
      pdf.save('carousel-slides.pdf');
    } catch (e) {
      console.error('Failed to generate PDF', e);
      setToast('Failed to generate PDF. Check console for details.');
    }
  };

  const generateImage = async () => {
    if (!imgPrompt.trim()) return;
    setImgLoading(true); setImgResult(null);
    try {
      const res = await fetch('/api/media/image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imgPrompt, style: imgStyle, size: imgSize, quality: imgQuality })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImgResult(data);
      if (data.url) setVideoSourceImg(data.url); // Auto-feed into video tab
    } catch (e: any) { setToast(e.message); }
    setImgLoading(false);
  };

  const generateAudio = async () => {
    if (!audioText.trim()) return;
    setAudioLoading(true); setAudioUrl(null);
    try {
      const res = await fetch('/api/media/audio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: audioText, voice, speed: audioSpeed })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAudioUrl(data.audioUrl);
    } catch (e: any) { setToast(e.message); }
    setAudioLoading(false);
  };

  const generateVideo = () => {
    if (!videoSourceImg) { setToast("Generate or upload an image first!"); return; }
    setVideoLoading(true); setVideoResult(false);
    setTimeout(() => {
      setVideoLoading(false);
      setVideoResult(true);
    }, 2000); // Simulated processing
  };

  // Helper to determine CSS animation class based on camera motion
  const getMotionAnimation = () => {
    switch (cameraMotion) {
      case 'zoom-in': return `motionZoomIn ${videoDuration}s ease-in-out infinite alternate`;
      case 'zoom-out': return `motionZoomOut ${videoDuration}s ease-in-out infinite alternate`;
      case 'pan-left': return `motionPanLeft ${videoDuration}s ease-in-out infinite alternate`;
      case 'pan-right': return `motionPanRight ${videoDuration}s ease-in-out infinite alternate`;
      case 'tilt-up': return `motionTiltUp ${videoDuration}s ease-in-out infinite alternate`;
      case 'tilt-down': return `motionTiltDown ${videoDuration}s ease-in-out infinite alternate`;
      default: return `motionZoomIn ${videoDuration}s ease-in-out infinite alternate`;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader eyebrow="Create" title="AI media studio" description="Generate images, audio and visual assets for your content." />

      {/* Tabs */}
      <div className="tab-bar" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
        {[
          { id: 'image', label: 'Thumbnails & Visuals', icon: <ImageIcon size={16}/> },
          { id: 'video', label: 'Image to Video', icon: <Video size={16}/> },
          { id: 'audio', label: 'Voiceovers', icon: <Mic size={16}/> },
          { id: 'carousel', label: 'Carousel Studio', icon: <Layers size={16}/> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`tab-item ${activeTab === t.id ? 'active' : ''}`} style={{
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar Controls */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* IMAGE CONTROLS */}
          {activeTab === 'image' && (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Director's Prompt</label>
                  <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}><Sparkles size={12}/> Enhance</button>
                </div>
                <textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)} placeholder="E.g., A cinematic wide shot of a futuristic city at sunset, neon lights reflecting on wet streets, 8k resolution, photorealistic..." className="input-field" style={{ width: '100%', height: 120, fontSize: 14, resize: 'vertical' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Aspect Ratio</label>
                  <select value={imgSize} onChange={e => setImgSize(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontSize: 13 }}>
                    {ASPECT_RATIOS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Render Quality</label>
                  <select value={imgQuality} onChange={e => setImgQuality(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontSize: 13 }}>
                    <option value="standard">Standard (Fast)</option>
                    <option value="hd">Ultra HD (Detailed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}><SlidersHorizontal size={14}/> Art Direction Style</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => setImgStyle('vivid')} style={{ padding: '12px', borderRadius: 8, background: imgStyle === 'vivid' ? 'var(--primary-muted)' : 'var(--muted)', color: imgStyle === 'vivid' ? 'var(--primary)' : 'var(--muted-foreground)', border: `1px solid ${imgStyle === 'vivid' ? 'var(--primary)' : 'transparent'}`, cursor: 'pointer', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 14 }}>Vivid</span>
                    <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 400 }}>Hyper-real, Dramatic</span>
                  </button>
                  <button onClick={() => setImgStyle('natural')} style={{ padding: '12px', borderRadius: 8, background: imgStyle === 'natural' ? 'var(--primary-muted)' : 'var(--muted)', color: imgStyle === 'natural' ? 'var(--primary)' : 'var(--muted-foreground)', border: `1px solid ${imgStyle === 'natural' ? 'var(--primary)' : 'transparent'}`, cursor: 'pointer', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 14 }}>Natural</span>
                    <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 400 }}>Cinematic, Realism</span>
                  </button>
                </div>
              </div>
              
              <button onClick={generateImage} disabled={imgLoading || !imgPrompt} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15 }}>
                {imgLoading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }}/> : <Sparkles size={18}/>} Generate HD Visual
              </button>
            </>
          )}

          {/* VIDEO CONTROLS */}
          {activeTab === 'video' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Base Keyframe (Source Image)</label>
                {videoSourceImg ? (
                  <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '16/9' }}>
                    <img src={videoSourceImg} alt="Source" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--sage-bg)', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: 'var(--sage-ink)', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12}/> Ready</div>
                  </div>
                ) : (
                  <div style={{ aspectRatio: '16/9', border: '2px dashed var(--border)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', fontSize: 13, gap: 8 }}>
                    <ImageIcon size={24} style={{ opacity: 0.5 }} />
                    <span>Generate an image in the first tab</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--foreground)' }}><Move size={14}/> Camera Motion Path</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {CAMERA_MOTIONS.map(m => (
                    <button key={m.id} onClick={() => setCameraMotion(m.id)} style={{ padding: '10px 4px', borderRadius: 8, background: cameraMotion === m.id ? 'var(--rose-bg)' : 'var(--muted)', color: cameraMotion === m.id ? 'var(--rose-ink)' : 'var(--foreground)', border: `1px solid ${cameraMotion === m.id ? 'var(--rose)' : 'var(--border)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Scene Duration</label>
                  <span style={{ fontSize: 12, color: 'var(--rose-ink)', fontWeight: 600 }}>{videoDuration}s</span>
                </div>
                <input type="range" min="2" max="10" step="1" value={videoDuration} onChange={e => setVideoDuration(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--rose-ink)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>
                  <span>2s (Fast)</span><span>10s (Slow)</span>
                </div>
              </div>

              <div style={{ padding: 12, background: 'var(--rose-bg)', border: '1px dashed var(--rose)', borderRadius: 8, fontSize: 12, color: 'var(--rose-ink)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Info size={16} color="var(--rose-ink)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>This preview animates your image in the browser. Real MP4 rendering is not included yet.</div>
              </div>

              <button onClick={generateVideo} disabled={videoLoading || !videoSourceImg} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15 }}>
                {videoLoading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }}/> : <Video size={18}/>} 
                {videoLoading ? 'Rendering…' : 'Generate Video Preview'}
              </button>
            </>
          )}

          {/* AUDIO CONTROLS */}
          {activeTab === 'audio' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Voiceover Script</label>
                <textarea value={audioText} onChange={e => setAudioText(e.target.value)} placeholder="Type or paste the script you want the AI to read..." className="input-field" style={{ width: '100%', height: 140, fontSize: 14, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Voice Talent (TTS-1 HD)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                  {VOICES.map(v => (
                    <button key={v.id} onClick={() => setVoice(v.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: voice === v.id ? 'var(--sage-bg)' : 'var(--muted)', border: `1px solid ${voice === v.id ? 'var(--sage)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'left' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: voice === v.id ? 'var(--sage-ink)' : 'var(--foreground)' }}>{v.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{v.desc}</div>
                      </div>
                      {voice === v.id && <Check size={16} color="var(--sage-ink)" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Speaking Speed</label>
                  <span style={{ fontSize: 12, color: 'var(--sage-ink)', fontWeight: 600 }}>{audioSpeed.toFixed(2)}x</span>
                </div>
                <input type="range" min="0.5" max="2.0" step="0.1" value={audioSpeed} onChange={e => setAudioSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--sage-ink)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>
                  <span>0.5x (Slow)</span><span>1.0x (Normal)</span><span>2.0x (Fast)</span>
                </div>
              </div>

              <button onClick={generateAudio} disabled={audioLoading || !audioText} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15 }}>
                {audioLoading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }}/> : <Mic size={18}/>} Generate Audio
              </button>
            </>
          )}

          {/* CAROUSEL CONTROLS */}
          {activeTab === 'carousel' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Carousel Topic / Prompt</label>
                <textarea value={carPrompt} onChange={e => setCarPrompt(e.target.value)} placeholder="E.g., 5 reasons why SaaS founders should invest in SEO..." className="input-field" style={{ width: '100%', height: 120, fontSize: 14, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Design Theme</label>
                <select value={carTheme} onChange={e => setCarTheme(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontSize: 13 }}>
                  <option value="dark">Dark Mode & Neon</option>
                  <option value="light">Clean Light Mode</option>
                  <option value="brutalism">Bold Brutalism</option>
                  <option value="glass">Glassmorphism</option>
                  <option value="minimal">Ultra Minimalist</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                  <option value="corporate">Corporate Blue</option>
                  <option value="sunset">Sunset Gradient</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>AI Design Extraction (Optional)</label>
                <div style={{ padding: '12px', borderRadius: 8, border: '1px dashed var(--border)', background: 'var(--muted)' }}>
                  <input type="file" accept="image/*" onChange={handleCarImageUpload} style={{ fontSize: 12, width: '100%' }} />
                  {carReferenceImg && <div style={{ fontSize: 11, color: 'var(--sage-ink)', marginTop: 8, fontWeight: 600 }}>Reference image loaded</div>}
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 8 }}>Upload a design screenshot. The AI will extract its colors and styles to build your carousel.</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Number of Slides</label>
                <select value={carSlides} onChange={e => setCarSlides(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontSize: 13 }}>
                  <option value={3}>3 Slides (Short)</option>
                  <option value={5}>5 Slides (Standard)</option>
                  <option value={7}>7 Slides (In-Depth)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>Creator Profile</label>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input type="text" value={carName} onChange={e => setCarName(e.target.value)} placeholder="Display Name" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontSize: 13 }} />
                  <input type="text" value={carHandle} onChange={e => setCarHandle(e.target.value)} placeholder="@username" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontSize: 13 }} />
                  <div style={{ padding: '8px 12px', borderRadius: 8, border: '1px dashed var(--border)', background: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="file" accept="image/*" onChange={handleCarAvatarUpload} style={{ fontSize: 11, width: '100%' }} />
                    {carAvatar && <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}><img src={carAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/></div>}
                  </div>
                </div>
              </div>

              <button onClick={generateCarousel} disabled={carLoading || !carPrompt} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: 15 }}>
                {carLoading ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }}/> : <Layers size={18}/>} Generate Carousel
              </button>
            </>
          )}
        </div>

        {/* Results Viewer */}
        <div className="card" style={{ minHeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', padding: 0 }}>
          
          {/* Image Result */}
          {activeTab === 'image' && (
            imgLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'var(--primary)' }}>
                <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontWeight: 600, fontSize: 16 }}>Generating your image…</div>
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>This usually takes a few seconds</div>
              </div>
            ) : imgResult ? (
              <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--muted)' }}>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={imgResult.url} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                
                {/* Prompt & Download */}
                <div style={{ padding: '20px 24px', background: 'var(--card)', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Refined prompt used</div>
                      <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6, maxHeight: 80, overflowY: 'auto', paddingRight: 10 }}>{imgResult.revisedPrompt}</div>
                    </div>
                    <a href={imgResult.url} download="thumbnail.png" target="_blank" rel="noreferrer" className="btn-primary" style={{ flexShrink: 0, textDecoration: 'none' }}>
                      <Download size={16} /> Download Source
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>
                <ImageIcon size={56} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>Image generation</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Use the controls on the left to create artwork.</div>
              </div>
            )
          )}

          {/* Video Result */}
          {activeTab === 'video' && (
            videoLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'var(--rose-ink)' }}>
                <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontWeight: 600, fontSize: 16 }}>Building your preview…</div>
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Applying {cameraMotion.replace('-', ' ')} motion</div>
              </div>
            ) : videoResult && videoSourceImg ? (
              <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Simulated video wrapper */}
                <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                  {/* The actual image with dynamic CSS motion */}
                  <img src={videoSourceImg} alt="Scene" style={{ width: '100%', height: '100%', objectFit: 'cover', animation: getMotionAnimation(), transformOrigin: 'center' }} />
                </div>
                
                {/* UI Overlays */}
                <div style={{ position: 'absolute', top: 20, left: 20, background: 'var(--rose-bg)', color: 'var(--rose-ink)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Play size={12} fill="currentColor" /> Preview
                </div>
                <div style={{ position: 'absolute', top: 20, right: 20, background: 'var(--primary)', color: 'var(--primary-foreground)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                  Motion: {cameraMotion.toUpperCase()} | {videoDuration}s
                </div>
                <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--muted)', color: 'var(--muted-foreground)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                  Preview animation only — not a rendered video.
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>
                <Video size={56} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>Image to video</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Pick a camera motion to animate a still image.</div>
              </div>
            )
          )}

          {/* Audio Result */}
          {activeTab === 'audio' && (
            audioLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'var(--sage-ink)' }}>
                <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontWeight: 600, fontSize: 16 }}>Generating audio…</div>
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Voice: {voice}</div>
              </div>
            ) : audioUrl ? (
              <div style={{ width: '100%', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, flex: 1, background: 'var(--card)' }}>
                
                {/* Audio Waveform Viz (Simulated) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 60 }}>
                  {[...Array(30)].map((_, i) => (
                    <div key={i} style={{ width: 6, height: Math.random() * 40 + 10, background: 'var(--sage-ink)', borderRadius: 4, animation: 'pulse 1s infinite alternate', animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>

                <div style={{ width: '100%', maxWidth: 450, background: 'var(--card)', padding: 24, borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--sage-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sage-ink)' }}>
                      <Mic size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{VOICES.find(v => v.id === voice)?.label} Output</div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Speed: {audioSpeed}x • Format: MP3 HQ</div>
                    </div>
                  </div>
                  
                  <audio controls src={audioUrl} style={{ width: '100%', marginBottom: 20, height: 40 }} />
                  
                  <a href={audioUrl} download="studio-voiceover.mp3" className="btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
                    <Download size={16} /> Download Audio
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>
                <Mic size={56} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>Voiceovers</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Type a script and pick a voice to generate speech.</div>
              </div>
            )
          )}

          {/* Carousel Result */}
          {activeTab === 'carousel' && (
            carLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'var(--lavender-ink)' }}>
                <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontWeight: 600, fontSize: 16 }}>Writing your carousel…</div>
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Structuring hooks and content</div>
              </div>
            ) : carResult ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Carousel Actions Header */}
                <div style={{ padding: '16px 40px', background: 'var(--muted)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                  <button onClick={downloadAllSlides} className="btn-secondary" style={{ fontSize: 14 }}>
                    <Download size={16} /> Download PNGs
                  </button>
                  <button onClick={downloadAllSlidesPDF} className="btn-primary" style={{ fontSize: 14 }}>
                    <Download size={16} /> Download PDF
                  </button>
                </div>
                
                {/* Slides Container */}
                <div style={{ width: '100%', flex: 1, padding: 40, display: 'flex', gap: 24, overflowX: 'auto', background: carCustomDesign ? '#000' : carTheme === 'light' ? '#f1f5f9' : carTheme === 'glass' ? 'radial-gradient(circle at center, rgba(236,72,153,0.15), transparent)' : '#0f172a', alignItems: 'center' }}>
                  {carResult.map((slide: any, i: number) => {
                    const isGlass = carTheme === 'glass';
                  const isLight = carTheme === 'light';
                  const isBrutal = carTheme === 'brutalism';
                  const isMinimal = carTheme === 'minimal';
                  const isCyberpunk = carTheme === 'cyberpunk';
                  const isCorporate = carTheme === 'corporate';
                  const isSunset = carTheme === 'sunset';
                  
                  // Custom Design Overrides
                  let slideBg = 'rgba(0,0,0,0.4)';
                  if (isGlass) slideBg = 'rgba(255,255,255,0.05)';
                  else if (isLight || isMinimal) slideBg = '#ffffff';
                  else if (isBrutal) slideBg = slide.color;
                  else if (isCyberpunk) slideBg = '#050014';
                  else if (isCorporate) slideBg = '#f8fafc';
                  else if (isSunset) slideBg = 'linear-gradient(135deg, #ff7e5f, #feb47b)';
                  if (carCustomDesign) slideBg = carCustomDesign.background;

                  let slideColor = '#ffffff';
                  if (isLight || isMinimal || isCorporate) slideColor = '#0f172a';
                  else if (isBrutal) slideColor = '#000';
                  else if (isCyberpunk) slideColor = '#00ff99';
                  if (carCustomDesign) slideColor = carCustomDesign.textColor;

                  let accent = slide.color;
                  if (isCyberpunk) accent = '#ff00ff';
                  else if (isCorporate) accent = '#2563eb';
                  else if (isSunset) accent = '#ffffff';
                  if (carCustomDesign) accent = carCustomDesign.accentColor;

                  let border = `1px solid ${slide.color}`;
                  if (isGlass) border = '1px solid rgba(255,255,255,0.1)';
                  else if (isLight) border = '1px solid #e2e8f0';
                  else if (isBrutal) border = '4px solid #000';
                  else if (isMinimal) border = 'none';
                  else if (isCyberpunk) border = '1px solid #00ff99';
                  else if (isCorporate) border = '1px solid #cbd5e1';
                  else if (isSunset) border = 'none';
                  if (carCustomDesign) border = carCustomDesign.border === 'none' ? 'none' : carCustomDesign.border;

                  let borderRadius = 16;
                  if (isBrutal || isMinimal) borderRadius = 0;
                  else if (isCorporate) borderRadius = 4;
                  if (carCustomDesign) borderRadius = carCustomDesign.borderRadius;

                  let boxShadow = 'none';
                  if (isBrutal) boxShadow = '8px 8px 0px #000';
                  else if (isLight || isCorporate) boxShadow = '0 10px 30px rgba(0,0,0,0.05)';
                  else if (isCyberpunk) boxShadow = '0 0 20px rgba(0,255,153,0.2)';
                  else if (isMinimal) boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
                  if (carCustomDesign) boxShadow = carCustomDesign.boxShadow;

                  let fontFamily = 'inherit';
                  if (isCyberpunk) fontFamily = '"Courier New", Courier, monospace';
                  else if (isMinimal || isCorporate) fontFamily = 'inherit';
                  if (carCustomDesign) fontFamily = carCustomDesign.fontFamily;

                  let textAlign: any = 'left';
                  if (isMinimal) textAlign = 'center';
                  if (carCustomDesign) textAlign = carCustomDesign.textAlign;

                  return (
                    <div id={`slide-${i}`} key={i} style={{ minWidth: 340, maxWidth: 340, height: 420, background: slideBg, border, borderRadius, padding: 36, display: 'flex', flexDirection: 'column', color: slideColor, boxShadow, backdropFilter: (!carCustomDesign && isGlass) ? 'blur(10px)' : 'none', flexShrink: 0, position: 'relative', fontFamily, textAlign }}>
                      
                      {/* Premium Header / Profile Avatar Area */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, alignSelf: textAlign === 'center' ? 'center' : 'flex-start' }}>
                         {carAvatar ? (
                           <div style={{ width: 36, height: 36, borderRadius: '50%', background: accent, overflow: 'hidden', flexShrink: 0, border: `2px solid ${accent}` }}>
                             <img src={carAvatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           </div>
                         ) : (
                           <div style={{ width: 36, height: 36, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{slide.icon}</div>
                         )}
                         <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{carName}</div>
                            <div style={{ fontSize: 11, opacity: 0.6 }}>{carHandle}</div>
                         </div>
                      </div>

                      <h3 style={{ fontSize: 26, fontWeight: (!carCustomDesign && isBrutal) ? 900 : 800, marginBottom: 16, lineHeight: 1.3 }}>{slide.title}</h3>
                      <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.85 }}>{slide.text}</p>
                      
                      <div style={{ position: 'absolute', bottom: 24, left: 36, right: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.5 }}>{i + 1} / {carResult.length}</span>
                        <span style={{ width: 40, height: 5, background: accent, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--muted-foreground)', textAlign: 'center' }}>
                <Layers size={56} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>Carousel Studio</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Input a prompt and select a theme to generate a multi-slide carousel.</div>
              </div>
            )
          )}
        </div>
      </div>

      {toast && <Toast message={toast} tone="error" onClose={() => setToast(null)} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pulse { 0% { opacity: 0.3; transform: scaleY(0.5); } 100% { opacity: 1; transform: scaleY(1); } }
        
        /* Expert Camera Motion Animations */
        @keyframes motionZoomIn { 0% { transform: scale(1); } 100% { transform: scale(1.3); } }
        @keyframes motionZoomOut { 0% { transform: scale(1.3); } 100% { transform: scale(1); } }
        @keyframes motionPanLeft { 0% { transform: scale(1.2) translateX(5%); } 100% { transform: scale(1.2) translateX(-5%); } }
        @keyframes motionPanRight { 0% { transform: scale(1.2) translateX(-5%); } 100% { transform: scale(1.2) translateX(5%); } }
        @keyframes motionTiltUp { 0% { transform: scale(1.2) translateY(5%); } 100% { transform: scale(1.2) translateY(-5%); } }
        @keyframes motionTiltDown { 0% { transform: scale(1.2) translateY(-5%); } 100% { transform: scale(1.2) translateY(5%); } }
      `}</style>
    </div>
  );
}
