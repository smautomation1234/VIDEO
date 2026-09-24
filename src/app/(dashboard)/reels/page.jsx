"use client";
import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';

// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ 
// VIRAL REEL MAKER — Purpose-built for Instagram Reels & YouTube Shorts
// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  

const REEL_STYLES = [
    { id: 'viral-top-box', name: 'Top Box Hook', bg1: '#111111', bg2: '#000000', text: '#ffffff', accent: '#ff0055', sub: '#000000', font: "'Impact', 'Anton', sans-serif" },
    { id: 'viral-mid-stack', name: 'Mid Stack Text', bg1: '#1f1f1f', bg2: '#0a0a0a', text: '#ffffff', accent: '#ff0055', sub: '#cccccc', font: "'Impact', 'Anton', sans-serif" },
    { id: 'cinematic-split', name: 'Cinematic Split', bg1: '#1a1005', bg2: '#0d0802', text: '#ffffff', accent: '#d4af37', sub: '#e8dab2', font: "'Playfair Display', serif" },
    { id: 'elegant-minimal', name: 'Minimal Centered', bg1: '#2a2a2a', bg2: '#111111', text: '#ffffff', accent: '#ffffff', sub: '#aaaaaa', font: "'Inter', sans-serif" },
    { id: 'elegant-serif', name: 'Aesthetic Serif', bg1: '#3d3024', bg2: '#1a140f', text: '#ffffff', accent: '#e8dab2', sub: '#cccccc', font: "'Playfair Display', serif" },
    { id: 'elegant-quote', name: 'Framed Quote', bg1: '#000000', bg2: '#1a1a1a', text: '#111111', accent: '#ffffff', sub: '#666666', font: "'Playfair Display', serif" },
    { id: 'elegant-chat', name: 'Chat Message', bg1: '#111111', bg2: '#000000', text: '#ffffff', accent: '#d4af37', sub: '#aaaaaa', font: "'Inter', sans-serif" },
    { id: 'elegant-paper', name: 'Torn Paper Note', bg1: '#000000', bg2: '#222222', text: '#111111', accent: '#ffffff', sub: '#666666', font: "'Courier New', Courier, monospace" },
    { id: 'aesthetic-polaroid', name: 'Polaroid Collage', bg1: '#151515', bg2: '#0a0a0a', text: '#ffffff', accent: '#d4af37', sub: '#cccccc', font: "'Inter', sans-serif" },
    { id: 'aesthetic-definition', name: 'Definition Card', bg1: '#d7d5cb', bg2: '#c4c1b5', text: '#1a1a1a', accent: '#111111', sub: '#555555', font: "'Helvetica Neue', Helvetica, 'Inter', sans-serif" },
    { id: 'aesthetic-envelope', name: 'Envelope Reveal', bg1: '#0f0f0f', bg2: '#000000', text: '#111111', accent: '#8b0000', sub: '#222222', font: "'Courier New', Courier, monospace" },
    { id: 'aesthetic-journal', name: 'Scrapbook Journal', bg1: '#e8e6e1', bg2: '#d5d2ca', text: '#1a1a1a', accent: '#f4f1ea', sub: '#555555', font: "'Playfair Display', serif" },
    { id: 'aesthetic-brush', name: 'Painted Brush', bg1: '#2c3e50', bg2: '#1a252f', text: '#111111', accent: '#ffffff', sub: '#333333', font: "'Playfair Display', serif" },
    { id: 'aesthetic-shadow', name: 'Cinematic Shadow', bg1: '#111111', bg2: '#000000', text: '#ffffff', accent: '#000000', sub: '#999999', font: "'Impact', 'Anton', sans-serif" },
    { id: 'aesthetic-triple', name: 'Three Panel Split', bg1: '#ffffff', bg2: '#f5f5f5', text: '#111111', accent: '#ffffff', sub: '#555555', font: "'Inter', sans-serif" },
    { id: 'aesthetic-vlog', name: 'Cinematic Vlog', bg1: '#0a0a0a', bg2: '#050505', text: '#ffffff', accent: '#fdfdfd', sub: '#cccccc', font: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
    { id: 'aesthetic-handwritten', name: 'Handwritten Focus', bg1: '#1a1614', bg2: '#0d0b0a', text: '#ffffff', accent: '#ffffff', sub: '#bbbbbb', font: "'Caveat', 'Cedarville Cursive', cursive" },
    { id: 'aesthetic-neon', name: 'Cyberpunk Neon', bg1: '#09090b', bg2: '#18181b', text: '#ffffff', accent: '#06b6d4', sub: '#a1a1aa', font: "'Inter', sans-serif" },
    { id: 'aesthetic-glass', name: 'Glassmorphism UI', bg1: '#000000', bg2: '#111111', text: '#ffffff', accent: '#a855f7', sub: '#d1d5db', font: "'Helvetica Neue', Helvetica, 'Inter', sans-serif" },
    { id: 'aesthetic-vintage', name: 'Vintage Film', bg1: '#3c3226', bg2: '#241a10', text: '#f3e8d6', accent: '#d97736', sub: '#b5a99c', font: "'Courier New', Courier, monospace" },
    { id: 'aesthetic-magazine', name: 'Editorial Magazine', bg1: '#ffffff', bg2: '#f4f4f5', text: '#000000', accent: '#ef4444', sub: '#52525b', font: "'Playfair Display', serif" },
    { id: 'corporate-minimal', name: 'Corporate Minimal', bg1: '#ffffff', bg2: '#f0f0f0', text: '#000000', accent: '#0055ff', sub: '#333333', font: "'Inter', sans-serif" },
    { id: 'gradient-holographic', name: 'Gradient Hologram', bg1: '#845ec2', bg2: '#ff9671', text: '#ffffff', accent: '#f9f871', sub: '#eeeeee', font: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
    { id: 'luxury-black', name: 'Luxury Black', bg1: '#0a0a0a', bg2: '#000000', text: '#d4af37', accent: '#ffffff', sub: '#aaaaaa', font: "'Oswald', sans-serif" },
    { id: 'news-alert', name: 'Breaking News', bg1: '#d32f2f', bg2: '#b71c1c', text: '#ffffff', accent: '#ffffff', sub: '#ffeb3b', font: "'Space Mono', monospace" },
    { id: 'neon-cyber', name: 'Neon Cyberpunk 2.0', bg1: '#110022', bg2: '#000000', text: '#00ffff', accent: '#ff00ff', sub: '#cccccc', font: "'Space Mono', monospace" },
];

const FONTS = [
    { id: 'default', name: 'Template Default' },
    { id: "'Inter', sans-serif", name: 'Inter (Clean)' },
    { id: "'Playfair Display', serif", name: 'Playfair (Elegant)' },
    { id: "'Impact', 'Anton', sans-serif", name: 'Impact (Bold)' },
    { id: "'Courier New', Courier, monospace", name: 'Courier (Typewriter)' },
    { id: "'Caveat', 'Cedarville Cursive', cursive", name: 'Handwritten' },
    { id: "'Helvetica Neue', Helvetica, 'Inter', sans-serif", name: 'Helvetica' },
    { id: "'Pacifico', cursive", name: 'Pacifico (Casual)' },
    { id: "'Oswald', sans-serif", name: 'Oswald (Bold)' },
    { id: "'Space Mono', monospace", name: 'Space Mono (Tech)' },
];

const VOICES = [
    { id: 'alloy', name: 'Alloy (Neutral)', provider: 'openai' },
    { id: 'echo', name: 'Echo (Male)', provider: 'openai' },
    { id: 'nova', name: 'Nova (Female)', provider: 'openai' },
    { id: 'onyx', name: 'Onyx (Deep)', provider: 'openai' },
    { id: 'shimmer', name: 'Shimmer (Warm)', provider: 'openai' },
];

const ELEVENLABS_VOICES = [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Narration)', provider: 'elevenlabs' },
    { id: '29vD33N1CtxCmqQRPOZB', name: 'Drew (News)', provider: 'elevenlabs' },
    { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde (War veteran)', provider: 'elevenlabs' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Soft)', provider: 'elevenlabs' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Well-rounded)', provider: 'elevenlabs' },
    { id: 'JBFqnCBcs6TWre3Znt2g', name: 'Marcus (Authoritative)', provider: 'elevenlabs' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Deep)', provider: 'elevenlabs' },
];

const AESTHETIC_IMAGES = [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&h=1920&q=80', // dark laptop setup
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0be2?auto=format&fit=crop&w=1080&h=1920&q=80', // luxury car interior
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1080&h=1920&q=80', // elegant abstract dark
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1080&h=1920&q=80', // podcast microphone
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1080&h=1920&q=80', // luxury minimal / gym
    'https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&w=1080&h=1920&q=80', // cyberpunk neon city
    'https://images.unsplash.com/photo-1497215848147-797eea1bd2d6?auto=format&fit=crop&w=1080&h=1920&q=80', // dark coffee desk
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1080&h=1920&q=80', // luxury watch closeup
    'https://images.unsplash.com/photo-1621501104860-264627ea49eb?auto=format&fit=crop&w=1080&h=1920&q=80', // crypto neon
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1080&h=1920&q=80', // dark architecture
];

const QUICK_TOPICS = [
    '5 Money Mistakes', 'Morning Routine Secrets', 'Side Hustle Ideas',
    'Productivity Hacks', 'Mindset Shifts', 'Fitness in 10 Min/Day',
    'Crypto Basics', 'Travel Hacks', 'Confidence Tips', 'Build in Public',
];

const ASPECT_RATIOS = [
    { id: '9:16', label: '9:16', w: 360, h: 640, ew: 1080, eh: 1920 },
    { id: '1:1',  label: '1:1',  w: 360, h: 360, ew: 1080, eh: 1080 },
    { id: '16:9', label: '16:9', w: 360, h: 202, ew: 1080, eh: 607  },
];

const HOOK_TEMPLATES = [
    'Nobody talks about this...',
    'I tried this for 30 days and...',
    'Stop doing this if you want to...',
    'The #1 reason most people fail at...',
    'This one thing changed everything for me...',
    'What they don\'t teach you about...',
    'I went from 0 to ___ in 90 days by...',
    'Here\'s the truth about...',
];

const BGM_TRACKS = [
    { id: 'lofi', name: 'Lo-Fi Chill', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3' },
    { id: 'epic', name: 'Epic Cinematic', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2d1e3e1a7a.mp3?filename=epic-cinematic-main-9007.mp3' },
    { id: 'upbeat', name: 'Upbeat Pop', url: 'https://cdn.pixabay.com/download/audio/2022/01/27/audio_d0a46e9e61.mp3?filename=happy-day-113985.mp3' },
    { id: 'dark', name: 'Dark Trap', url: 'https://cdn.pixabay.com/download/audio/2023/02/28/audio_a5e4fce3db.mp3?filename=hip-hop-beat-140bpm-167921.mp3' },
    { id: 'piano', name: 'Emotional Piano', url: 'https://cdn.pixabay.com/download/audio/2022/11/22/audio_febc508520.mp3?filename=sad-piano-background-144998.mp3' },
];

const LANGUAGES = [
    { id: 'en', name: 'English' }, { id: 'hi', name: 'Hindi' },
    { id: 'es', name: 'Spanish' }, { id: 'fr', name: 'French' },
    { id: 'de', name: 'German' }, { id: 'pt', name: 'Portuguese' },
    { id: 'ar', name: 'Arabic' }, { id: 'zh', name: 'Chinese' },
];

// --- Algorithm Signals ---
const ENGAGEMENT_CTAS = [
    { type: 'Save', emoji: '🔖', cta: 'Save this before you forget it', why: 'Saves signal high value to algo' },
    { type: 'Save', emoji: '📌', cta: 'Save for later — you\'ll need this', why: 'Creates urgency to save' },
    { type: 'Share', emoji: '📤', cta: 'Share this with someone who needs to hear it', why: 'Shares are the #1 reach multiplier' },
    { type: 'Share', emoji: '🔁', cta: 'Send this to your best friend RIGHT NOW', why: 'Direct share = algorithm loves it' },
    { type: 'Comment', emoji: '💬', cta: 'Comment your answer below 👇', why: 'Comments boost ranking fast' },
    { type: 'Comment', emoji: '🗣️', cta: 'Which one applies to you? 1, 2, or 3?', why: 'Numbered answers = easy to comment' },
    { type: 'Follow', emoji: '🤝', cta: 'Follow for daily tips like this', why: 'Follow rate = niche authority signal' },
    { type: 'Watch', emoji: '🔄', cta: 'Watch again — you missed something', why: 'Replays = massive watch time boost' },
    { type: 'Watch', emoji: '⏱️', cta: 'Stay till the end — best part is last', why: 'Completion rate is key ranking factor' },
];

const POSTING_TIMES = [
    { day: 'Mon', times: ['6–8 AM', '8–10 PM'], score: 72 },
    { day: 'Tue', times: ['7–9 AM', '7–9 PM'], score: 88 },
    { day: 'Wed', times: ['11 AM–1 PM', '8–10 PM'], score: 95 },
    { day: 'Thu', times: ['12–2 PM', '7–9 PM'], score: 91 },
    { day: 'Fri', times: ['11 AM–1 PM', '6–8 PM'], score: 85 },
    { day: 'Sat', times: ['9–11 AM', '8–10 PM'], score: 70 },
    { day: 'Sun', times: ['10 AM–12 PM', '7–9 PM'], score: 75 },
];

const TRENDING_AUDIO = [
    { category: 'Motivational', search: '"you got this" OR "dont give up" reel audio 2025', examples: ['Eye of the Tiger remix', 'David Goggins speech cut', 'Rocky training beat'] },
    { category: 'LoFi Study', search: 'lofi hip hop beats trending reels 2025', examples: ['Night Owl beat', 'Rainy day lofi', 'Tokyo Study vibes'] },
    { category: 'Trending Pop', search: 'trending song instagram reels this week', examples: ['APT - Rose', 'Espresso - Sabrina', 'Luther - Kendrick'] },
    { category: 'Cinematic Drama', search: 'cinematic dramatic music reel trending', examples: ['Hans Zimmer-style build', 'Epic orchestral drop', 'Interstellar beat'] },
    { category: 'Funny/Meme', search: 'meme sound viral reels trending audio', examples: ['NPC sound', 'Comic timing hit', 'Vine boom effect'] },
];

const ALGORITHM_SIGNALS = [
    { id: 'hook', label: 'Hook Strength (1-3s)', icon: '🎣', tip: 'First 3 seconds must stop the scroll. Use a shocking stat, bold claim, or question.' },
    { id: 'save', label: 'Save-Bait Value', icon: '🔖', tip: 'Include a list, secret, or step-by-step that people want to save.' },
    { id: 'share', label: 'Share Trigger', icon: '📤', tip: 'Include relatable content people want to tag someone in.' },
    { id: 'comment', label: 'Comment Bait', icon: '💬', tip: 'Ask a question or give a prompt that\'s easy to answer.' },
    { id: 'completion', label: 'Completion Rate', icon: '⏱️', tip: 'Add a cliffhanger or "stay till the end" before the last scene.' },
    { id: 'caption', label: 'Caption Hook', icon: '✍️', tip: 'Caption should start with a hook, not a description.' },
    { id: 'trend', label: 'Trending Relevance', icon: '📈', tip: 'Use a trending audio + relevant niche hashtags.' },
    { id: 'length', label: 'Ideal Length', icon: '📐', tip: 'Aim for 7-15s for feed boost, 30-60s for Explore page push.' },
];

// --- PHOTO CLONE LAYOUT — renders uploaded image as full bleed with branded overlay ---
function PhotoCloneScene({ scene, index, total, style, w, h, uploadedPhoto, brandHandle }) {
    const isHook = index === 0;
    const isCTA = index === total - 1;
    const mainText = scene.main || '';
    const accent = style.accent || '#ff0055';
    const textColor = style.text || '#ffffff';
    const fontFamily = style.font || "'Inter', sans-serif";
    const bgOverlayColor = style.bg1 ? style.bg1 + 'cc' : 'rgba(0,0,0,0.75)';

    return (
        <div style={{
            width: w, height: h, position: 'relative', overflow: 'hidden',
            background: uploadedPhoto ? `url('${uploadedPhoto}') no-repeat` : style.bg1,
            fontFamily,
        }}>
            {/* Dark gradient overlay so text is always readable */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.85) 100%)`,
                zIndex: 1,
            }} />

            {/* Top accent bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 6,
                background: accent, zIndex: 10,
            }} />

            {/* Scene number badge */}
            <div style={{
                position: 'absolute', top: 18, left: 20, zIndex: 10,
                background: accent, color: '#fff', fontWeight: 900,
                fontSize: w * 0.028, padding: '4px 12px', borderRadius: 4,
                letterSpacing: 1, textTransform: 'uppercase',
            }}>
                {isHook ? 'REEL START' : isCTA ? 'ACTION' : `TIP ${index}`}
            </div>

            {/* Brand handle top right */}
            {brandHandle && (
                <div style={{
                    position: 'absolute', top: 18, right: 16, zIndex: 10,
                    color: 'rgba(255,255,255,0.85)', fontSize: w * 0.025,
                    fontWeight: 700, background: 'rgba(0,0,0,0.4)',
                    padding: '4px 10px', borderRadius: 20, letterSpacing: 0.5,
                }}>{brandHandle}</div>
            )}

            {/* Bottom content block - exact design recreation */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                zIndex: 10, padding: `${h * 0.04}px ${w * 0.06}px ${h * 0.06}px`,
                background: `linear-gradient(to top, ${bgOverlayColor} 0%, rgba(0,0,0,0) 100%)`,
            }}>
                {/* Tag line */}
                {scene.tag && (
                    <div style={{
                        color: accent, fontSize: w * 0.035, fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: 2, marginBottom: h * 0.008,
                    }}>{scene.tag}</div>
                )}

                {/* Main headline — large, bold, exactly like reference */}
                <div style={{
                    color: textColor, fontSize: w * 0.085, fontWeight: 900,
                    lineHeight: 1.08, letterSpacing: -1,
                    textShadow: '0 2px 16px rgba(0,0,0,0.9)',
                    marginBottom: h * 0.015,
                    wordBreak: 'break-word',
                }}>
                    {mainText.split('\n').map((line, i) => (
                        <div key={i}>{line.replace(/\*\*/g, '')}</div>
                    ))}
                </div>

                {/* Sub text */}
                {scene.sub && (
                    <div style={{
                        borderLeft: `4px solid ${accent}`,
                        paddingLeft: 14, color: 'rgba(255,255,255,0.88)',
                        fontSize: w * 0.038, lineHeight: 1.45,
                        marginBottom: isCTA && scene.cta ? h * 0.025 : 0,
                        fontWeight: 400,
                    }}>{scene.sub}</div>
                )}

                {/* CTA button */}
                {isCTA && scene.cta && (
                    <div style={{
                        marginTop: h * 0.025,
                        background: accent, color: '#fff',
                        fontSize: w * 0.04, fontWeight: 900,
                        padding: `${h * 0.018}px ${w * 0.05}px`,
                        borderRadius: 8, textTransform: 'uppercase',
                        display: 'inline-block', letterSpacing: 1,
                        boxShadow: `0 4px 20px ${accent}88`,
                    }}>{scene.cta}</div>
                )}
            </div>

            {/* Scene progress dots */}
            <div style={{
                position: 'absolute', bottom: h * 0.025, left: 0, right: 0,
                display: 'flex', justifyContent: 'center', gap: 6, zIndex: 20,
            }}>
                {Array.from({ length: total }, (_, i) => (
                    <div key={i} style={{
                        width: i === index ? 28 : 8, height: 4, borderRadius: 2,
                        background: i === index ? accent : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.3s',
                    }} />
                ))}
            </div>
        </div>
    );
}

// --- Scene Component: Renders a single reel scene ---
function ReelScene({ scene, index, total, style, w, h, showBgImage, brandHandle, kenBurns, captionBurnMode, uploadedPhoto }) {
    const isHook = index === 0;
    const isCTA = index === total - 1;
    const mainText = scene.main || '';
    
    // Auto-hide internal generation labels
    const displayTag = (() => {
        if (!scene.tag) return null;
        const upper = scene.tag.trim().toUpperCase();
        const invalidTags = ['HOOK', 'VALUE', 'BODY', 'BUILDUP', 'CTA', 'SCENE', 'INSIGHT', 'PROBLEM', 'SOLUTION', 'OUTRO'];
        if (invalidTags.some(invalid => upper === invalid || upper.startsWith(invalid + ' '))) return null;
        return scene.tag;
    })();
    scene = { ...scene, tag: displayTag }; // Apply globally to all layouts

    const kenBurnsStyle = kenBurns ? { animation: 'kenburns 6s ease-in-out infinite alternate' } : {};
    const watermark = brandHandle ? (
        <div style={{
            position: 'absolute', bottom: 12, right: 12,
            fontSize: Math.max(8, w * 0.025), fontWeight: 800, color: 'rgba(255,255,255,0.6)',
            background: 'rgba(0,0,0,0.35)', padding: '2px 7px', borderRadius: 20,
            letterSpacing: 0.5, pointerEvents: 'none', zIndex: 99,
        }}>{brandHandle}</div>
    ) : null;

    // ==========================================
    // LAYOUT 1: VIRAL TOP BOX (Image 1)
    // ==========================================
    if (style.id === 'viral-top-box') {
        const fontSize = mainText.length > 30 ? 46 : 58;
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];

        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `linear-gradient(to bottom, ${style.bg1}dd, ${style.bg2}ee), url('${bgUrl}')`
                    : `radial-gradient(circle at 50% 30%, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontFamily: style.font,
                display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                paddingTop: h * 0.1, alignItems: 'center', textAlign: 'center'
            }}>
                {/* Chalk/Paper Texture overlay */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.15, mixBlendMode: 'overlay', pointerEvents: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }} />

                <div style={{ position: 'relative', zIndex: 10, width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Top Pink Tag */}
                    {(displayTag) && (
                        <div style={{
                            color: style.accent, fontSize: w * 0.045, fontWeight: 900,
                            letterSpacing: 1, textTransform: 'uppercase', marginBottom: h * 0.01,
                            textAlign: 'center', width: '100%', wordWrap: 'break-word'
                        }}>
                            {displayTag}
                        </div>
                    )}

                    {/* Massive Bold White Text */}
                    <div style={{
                        color: style.text, fontSize: fontSize * (w / 400), fontWeight: 900,
                        textTransform: 'uppercase', lineHeight: 1, textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                        fontFamily: style.font, marginBottom: h * 0.015, letterSpacing: -1
                    }}>
                        {mainText.split('\n').map((line, i) => (
                            <div key={i}>{line.replace(/\*\*/g, '')}</div>
                        ))}
                    </div>

                    {/* Solid White Box Subtext */}
                    {scene.sub && (
                        <div style={{
                            background: '#ffffff', color: '#000000', fontSize: w * 0.045,
                            fontWeight: 900, textTransform: 'uppercase', padding: `${h * 0.01}px ${w * 0.04}px`,
                            fontFamily: style.font, letterSpacing: 0.5,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                            width: '100%', boxSizing: 'border-box', textAlign: 'center'
                        }}>
                            {scene.sub}
                        </div>
                    )}

                    {/* CTA */}
                    {isCTA && scene.cta && (
                        <div style={{
                            marginTop: h * 0.03, background: style.accent, color: '#fff',
                            fontSize: w * 0.045, fontWeight: 900, padding: `${h * 0.02}px ${w * 0.04}px`,
                            borderRadius: 6, textTransform: 'uppercase', fontFamily: style.font,
                            width: '100%', boxSizing: 'border-box', textAlign: 'center', lineHeight: 1.3
                        }}>
                            {scene.cta}
                        </div>
                    )}
                </div>

                {/* Bottom user space placeholder */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: h * 0.05
                }}>
                    <div style={{
                        display: 'flex', gap: 6, opacity: 0.3
                    }}>
                        {Array.from({ length: total }, (_, i) => (
                            <div key={i} style={{
                                width: i === index ? 30 : 8, height: 4, borderRadius: 2,
                                background: '#ffffff', transition: 'all 0.3s'
                            }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 2: VIRAL MID STACK (Image 2)
    // ==========================================
    if (style.id === 'viral-mid-stack') {
        const fontSize = mainText.length > 25 ? 54 : 64;
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[(index + 3) % AESTHETIC_IMAGES.length];

        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `linear-gradient(135deg, ${style.bg1}dd, ${style.bg2}ee), url('${bgUrl}')`
                    : `linear-gradient(135deg, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontFamily: style.font,
                display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'center', alignItems: 'center', textAlign: 'center'
            }}>
                {/* Chalk/Paper Texture overlay */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.15, mixBlendMode: 'overlay', pointerEvents: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }} />

                <div style={{ position: 'relative', zIndex: 10, width: '95%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        color: style.text, fontSize: fontSize * (w / 400), fontWeight: 900,
                        textTransform: 'uppercase', lineHeight: 0.95, textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                        fontFamily: style.font, letterSpacing: -1
                    }}>
                        {mainText.split('\n').map((line, i) => (
                            <div key={i}>{line.replace(/\*\*/g, '')}</div>
                        ))}
                    </div>

                    {/* Pink Highlight Subtext */}
                    {scene.sub && (
                        <div style={{
                            color: style.accent, fontSize: (fontSize * 0.6) * (w / 400), fontWeight: 900,
                            textTransform: 'uppercase', lineHeight: 1, textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                            fontFamily: style.font, letterSpacing: -0.5, marginTop: h * 0.005
                        }}>
                            {scene.sub}
                        </div>
                    )}

                    {isCTA && scene.cta && (
                        <div style={{
                            marginTop: h * 0.04, border: `3px solid ${style.accent}`, color: style.accent,
                            fontSize: w * 0.045, fontWeight: 900, padding: `${h * 0.015}px ${w * 0.04}px`,
                            textTransform: 'uppercase', fontFamily: style.font, background: 'rgba(0,0,0,0.5)',
                            width: '100%', boxSizing: 'border-box', textAlign: 'center', lineHeight: 1.3
                        }}>
                            {scene.cta}
                        </div>
                    )}
                </div>

                <div style={{
                    position: 'absolute', bottom: h * 0.04, display: 'flex', gap: 6, opacity: 0.3
                }}>
                    {Array.from({ length: total }, (_, i) => (
                        <div key={i} style={{ width: i === index ? 30 : 8, height: 4, borderRadius: 2, background: '#ffffff' }} />
                    ))}
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 3: CINEMATIC SPLIT
    // ==========================================
    if (style.id === 'cinematic-split') {
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[(index + 1) % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('${bgUrl}')`
                    : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontFamily: style.font,
                display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
            }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: w * 0.08 }}>
                    <div style={{
                        color: style.text, fontSize: mainText.length > 30 ? w * 0.08 : w * 0.1, fontWeight: 700,
                        lineHeight: 1.2, textShadow: '0 4px 20px rgba(0,0,0,0.8)', textAlign: 'center'
                    }}>
                        {mainText.split('\n').map((line, i) => (
                            <div key={i}>{line.replace(/\*\*/g, '')}</div>
                        ))}
                    </div>
                </div>
                
                <div style={{
                    background: style.bg2 || '#000', padding: `${h * 0.05}px ${w * 0.08}px`,
                    display: 'flex', flexDirection: 'column', gap: 10, borderTop: `2px solid ${style.accent}`
                }}>
                    {scene.tag && (
                        <div style={{ color: style.accent, fontSize: w * 0.035, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
                            {scene.tag}
                        </div>
                    )}
                    {scene.sub && (
                        <div style={{ color: style.sub, fontSize: w * 0.04, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                            {scene.sub}
                        </div>
                    )}
                    {isCTA && scene.cta && (
                        <div style={{
                            marginTop: 10, background: style.accent, color: '#111', fontSize: w * 0.045, fontWeight: 800,
                            padding: '12px', textAlign: 'center', borderRadius: 4, textTransform: 'uppercase'
                        }}>
                            {scene.cta}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 4: ELEGANT MINIMAL (Image 1 new)
    // ==========================================
    if (style.id === 'elegant-minimal') {
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${bgUrl}')`
                    : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center'
            }}>
                {/* Top Logo/Tag */}
                <div style={{
                    position: 'absolute', top: h * 0.15, color: '#ffffff', fontSize: w * 0.03,
                    fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.9
                }}>
                    {scene.tag || 'GROWTH OS'}
                    <div style={{ fontSize: w * 0.015, fontWeight: 400, letterSpacing: 5, marginTop: 4, opacity: 0.7 }}>STUDIOS</div>
                </div>

                <div style={{
                    color: style.text, fontSize: w * 0.06, fontWeight: 500, lineHeight: 1.4,
                    width: '75%', textShadow: '0 2px 10px rgba(0,0,0,0.5)', opacity: 0.95
                }}>
                    {mainText.split('\n').map((line, i) => (
                        <div key={i}>{line.replace(/\*\*/g, '')}</div>
                    ))}
                </div>

                {isCTA && scene.cta && (
                    <div style={{
                        marginTop: h * 0.04, color: '#ffffff', borderBottom: '1px solid #ffffff',
                        fontSize: w * 0.035, fontWeight: 400, paddingBottom: 4, letterSpacing: 1,
                        textTransform: 'uppercase'
                    }}>
                        {scene.cta}
                    </div>
                )}

                {/* Bottom handle */}
                <div style={{
                    position: 'absolute', bottom: h * 0.08, color: '#ffffff', fontSize: w * 0.025,
                    fontWeight: 400, letterSpacing: 1, opacity: 0.7
                }}>
                    @reallygreatsite
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 5: AESTHETIC SERIF (Image 2 new)
    // ==========================================
    if (style.id === 'elegant-serif') {
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[(index + 2) % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `linear-gradient(to bottom, rgba(30,20,10,0.3), rgba(30,20,10,0.6)), url('${bgUrl}')`
                    : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center'
            }}>
                <div style={{
                    color: style.text, fontSize: w * 0.07, fontStyle: 'italic', fontWeight: 400,
                    lineHeight: 1.3, width: '80%', textShadow: '0 2px 15px rgba(0,0,0,0.6)'
                }}>
                    {mainText.split('\n').map((line, i) => (
                        <div key={i}>{line.replace(/\*\*/g, '')}</div>
                    ))}
                </div>

                {isCTA && scene.cta && (
                    <div style={{
                        marginTop: h * 0.05, background: 'rgba(255,255,255,0.1)', color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)', padding: '10px 24px', borderRadius: 100,
                        fontSize: w * 0.035, fontStyle: 'italic', letterSpacing: 1, backdropFilter: 'blur(10px)'
                    }}>
                        {scene.cta}
                    </div>
                )}

                <div style={{
                    position: 'absolute', bottom: h * 0.06, color: 'rgba(255,255,255,0.6)', fontSize: w * 0.02,
                    fontWeight: 400, letterSpacing: 2, textTransform: 'uppercase'
                }}>
                    WWW.REALLYGREATSITE.COM
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 6: FRAMED QUOTE (Image 3 new)
    // ==========================================
    if (style.id === 'elegant-quote') {
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[(index + 4) % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('${bgUrl}')`
                    : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center'
            }}>
                <div style={{
                    position: 'relative', width: '85%', background: '#ffffff', borderRadius: 24,
                    padding: `${h * 0.08}px ${w * 0.08}px ${h * 0.06}px`, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    {/* Floating Avatar */}
                    <div style={{
                        position: 'absolute', top: -35, width: 70, height: 70, borderRadius: '50%',
                        backgroundColor: '#333', backgroundImage: 'url("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80")',
                        backgroundSize: 'cover', backgroundPosition: 'center', border: '4px solid #ffffff',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }} />

                    <div style={{
                        color: style.text, fontSize: w * 0.055, lineHeight: 1.4, fontWeight: 400,
                    }}>
                        {mainText.split('\n').map((line, i) => (
                            <div key={i}>{line.replace(/\*\*/g, '')}</div>
                        ))}
                    </div>

                    {isCTA && scene.cta && (
                        <div style={{
                            marginTop: 20, color: style.text, fontSize: w * 0.04, fontStyle: 'italic',
                            borderBottom: `1px solid ${style.text}`, paddingBottom: 2
                        }}>
                            {scene.cta}
                        </div>
                    )}
                </div>

                <div style={{
                    position: 'absolute', bottom: h * 0.08, color: 'rgba(255,255,255,0.7)', fontSize: w * 0.03,
                    fontWeight: 400, fontFamily: "'Inter', sans-serif"
                }}>
                    @sitioincreible
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 7: CHAT MESSAGE (Image 4 new)
    // ==========================================
    if (style.id === 'elegant-chat') {
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[(index + 6) % AESTHETIC_IMAGES.length];
        const lines = mainText.split('\n').filter(l => l.trim().length > 0);

        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('${bgUrl}')`
                    : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                justifyContent: 'center', padding: w * 0.08
            }}>
                {lines.map((line, i) => {
                    const isSender = i % 2 !== 0; // Alternate sides
                    return (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24,
                            alignSelf: isSender ? 'flex-end' : 'flex-start', maxWidth: '85%'
                        }}>
                            {!isSender && (
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    backgroundColor: '#333', backgroundImage: 'url("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80")',
                                    backgroundSize: 'cover', border: '2px solid rgba(255,255,255,0.2)'
                                }} />
                            )}
                            <div style={{
                                background: isSender ? '#c09c7a' : '#000000',
                                color: isSender ? '#ffffff' : '#ffffff',
                                padding: '16px 20px', borderRadius: isSender ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                fontSize: w * 0.035, lineHeight: 1.4, fontWeight: 500, boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                            }}>
                                {line.replace(/\*\*/g, '')}
                            </div>
                            {isSender && (
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                    backgroundColor: '#333', backgroundImage: 'url("https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80")',
                                    backgroundSize: 'cover', border: '2px solid rgba(255,255,255,0.2)'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    // ==========================================
    // LAYOUT 8: TORN PAPER (Image 5 new)
    // ==========================================
    if (style.id === 'elegant-paper') {
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[(index + 8) % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url('${bgUrl}')`
                    : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(0.3)',
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{ position: 'relative', width: '80%' }}>
                    {/* Fake masking tape */}
                    <div style={{
                        position: 'absolute', top: -15, left: -20, width: 80, height: 25,
                        background: 'rgba(255,255,255,0.4)', transform: 'rotate(-15deg)', zIndex: 20,
                        backdropFilter: 'blur(2px)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }} />

                    {/* Paper Body */}
                    <div style={{
                        background: '#f4f1ea', borderRadius: '4px 12px 12px 4px', padding: '30px 24px',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.5)', position: 'relative', zIndex: 10,
                        borderLeft: '15px solid #e0dbce', // Notebook spine effect
                    }}>
                        {/* Notebook holes */}
                        <div style={{ position: 'absolute', left: -8, top: 40, width: 12, height: 12, borderRadius: '50%', background: '#222', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }} />
                        <div style={{ position: 'absolute', left: -8, top: 80, width: 12, height: 12, borderRadius: '50%', background: '#222', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }} />
                        <div style={{ position: 'absolute', left: -8, top: 120, width: 12, height: 12, borderRadius: '50%', background: '#222', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }} />
                        <div style={{ position: 'absolute', left: -8, top: 160, width: 12, height: 12, borderRadius: '50%', background: '#222', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }} />

                        <div style={{
                            color: style.text, fontSize: w * 0.04, lineHeight: 1.8, fontWeight: 600,
                            backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px)',
                            backgroundSize: '100% 1.8em', backgroundPosition: '0 1.2em'
                        }}>
                            {mainText.split('\n').map((line, i) => (
                                <div key={i}>{line.replace(/\*\*/g, '')}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 9: AESTHETIC POLAROID
    // ==========================================
    if (style.id === 'aesthetic-polaroid') {
        const bg1 = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        const bg2 = AESTHETIC_IMAGES[(index + 1) % AESTHETIC_IMAGES.length];
        const bg3 = AESTHETIC_IMAGES[(index + 2) % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                background: '#151515', fontFamily: style.font, color: style.text
            }}>
                {/* Paper texture */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`, mixBlendMode: 'overlay', zIndex: 1 }} />

                {/* Polaroids */}
                <div style={{ position: 'absolute', top: h * 0.12, left: w * 0.1, width: w * 0.45, background: '#fdfdfd', padding: '12px 12px 35px', transform: 'rotate(-4deg)', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', zIndex: 10 }}>
                    <div style={{ width: '100%', aspectRatio: '1/1', background: `url(${bg1})` }} />
                    <div style={{ position: 'absolute', top: -12, left: '30%', width: 50, height: 25, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', transform: 'rotate(3deg)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} />
                </div>

                <div style={{ position: 'absolute', top: h * 0.28, right: w * 0.1, width: w * 0.4, background: '#fdfdfd', padding: '10px 10px 30px', transform: 'rotate(7deg)', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', zIndex: 12 }}>
                    <div style={{ width: '100%', aspectRatio: '1/1', background: `url(${bg2})` }} />
                    <div style={{ position: 'absolute', top: -10, left: '25%', width: 45, height: 20, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', transform: 'rotate(-5deg)', border: '1px solid rgba(255,255,255,0.4)' }} />
                </div>

                <div style={{ position: 'absolute', top: h * 0.5, left: w * 0.25, width: w * 0.35, background: '#fdfdfd', padding: '10px 10px 25px', transform: 'rotate(-2deg)', boxShadow: '0 15px 35px rgba(0,0,0,0.6)', zIndex: 14 }}>
                    <div style={{ width: '100%', aspectRatio: '1/1.1', background: `url(${bg3})` }} />
                </div>

                {/* Bottom text & badge */}
                <div style={{ position: 'absolute', bottom: h * 0.18, left: w * 0.15, zIndex: 20, width: w * 0.7 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: w * 0.04, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{scene.main || 'Black Friday'}</div>
                    <div style={{ fontSize: w * 0.04, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>{scene.sub || 'ë¸”ëž™ í”„ë ¼ì ´ë °ì ´ ì„¸ì ¼'}</div>
                    {(scene.cta || isCTA) && (
                        <div style={{ display: 'inline-block', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 100, padding: '4px 16px', fontSize: w * 0.03, letterSpacing: 1 }}>
                            {scene.cta || '11.28 - 12.01'}
                        </div>
                    )}
                </div>

                {/* Crown badge */}
                <div style={{ position: 'absolute', bottom: h * 0.05, right: w * 0.1, zIndex: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: '1px solid #333' }}>👑</div>
                    {/* Scribble line */}
                    <div style={{ position: 'absolute', bottom: 10, right: 30, width: 80, height: 40, borderBottom: '1px solid rgba(255,255,255,0.3)', borderRight: '1px solid rgba(255,255,255,0.3)', borderRadius: '0 0 50% 0', transform: 'rotate(15deg)', pointerEvents: 'none' }} />
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 10: AESTHETIC DEFINITION
    // ==========================================
    if (style.id === 'aesthetic-definition') {
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `linear-gradient(to bottom, rgba(50,50,50,0.6), rgba(20,20,20,0.8)), url('${bgUrl}')`
                    : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontFamily: style.font, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    width: w * 0.8, height: h * 0.75, background: '#eadecd', borderRadius: 24,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `${h * 0.05}px ${w * 0.08}px`,
                    boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', color: '#222'
                }}>
                    <div style={{ fontSize: w * 0.03, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
                        {scene.tag || 'THE GREAT'}
                    </div>
                    <div style={{ fontSize: w * 0.08, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
                        {mainText || 'INSPIRATION'}
                    </div>
                    <div style={{ fontSize: w * 0.035, fontFamily: "'Courier New', monospace", color: '#555', marginBottom: h * 0.04 }}>
                        {scene.sub || "[in.spÉª'reÉª.ÊƒÉ™n]"}
                    </div>

                    <div style={{ fontSize: w * 0.028, lineHeight: 1.5, textAlign: 'center', color: '#444', marginBottom: h * 0.04 }}>
                        {scene.cta || "Inspiration is the spark that ignites creativity and drives us to achieve our goals. It can come from anywhere, at any time, and often when we least expect it."}
                    </div>

                    <div style={{ flex: 1, width: '100%', background: `url(${AESTHETIC_IMAGES[(index + 1) % AESTHETIC_IMAGES.length]})`, borderRadius: 8, filter: 'grayscale(100%) brightness(0.9)' }} />
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 11: AESTHETIC ENVELOPE
    // ==========================================
    if (style.id === 'aesthetic-envelope') {
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                background: '#111111', fontFamily: "'Courier New', Courier, monospace", color: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                {/* Silk texture */}
                <div style={{ position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.6) 100%), linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent)`, backgroundSize: '100px 100px' }} />

                <div style={{ position: 'relative', width: w * 0.9, height: h * 0.7, zIndex: 10 }}>
                    {/* Letter Card (Protruding out) */}
                    <div style={{ position: 'absolute', top: 0, left: '5%', width: '90%', height: '70%', background: '#f5f5f0', borderRadius: 2, padding: '30px', boxSizing: 'border-box', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', transform: 'rotate(-2deg)' }}>
                        <div style={{ fontSize: w * 0.025, letterSpacing: 2, textTransform: 'uppercase', color: '#555', marginBottom: 15 }}>{scene.tag || 'VIMBERG FASHION'}</div>
                        <div style={{ fontSize: w * 0.07, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, fontFamily: "'Inter', sans-serif", marginBottom: 20 }}>
                            {mainText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                        </div>
                        <div style={{ fontSize: w * 0.03, color: '#444', lineHeight: 1.4, marginBottom: 25, maxWidth: '80%', margin: '0 auto' }}>
                            {scene.sub || 'A new grunge drop with dark tones and a bold, rebellious vibe.'}
                        </div>
                        {(scene.cta || isCTA) && (
                            <div style={{ display: 'inline-block', border: '2px solid #111', borderRadius: 100, padding: '6px 20px', fontSize: w * 0.03, fontWeight: 700 }}>
                                {scene.cta || 'STAY TUNED'}
                            </div>
                        )}
                    </div>

                    {/* Envelope Flap Back */}
                    <div style={{ position: 'absolute', bottom: '15%', left: '-5%', width: '110%', height: '45%', background: '#ebe8de', clipPath: 'polygon(0 0, 50% 40%, 100% 0, 100% 100%, 0 100%)', boxShadow: '0 -2px 10px rgba(0,0,0,0.2)' }} />

                    {/* Envelope Lower Flap */}
                    <div style={{ position: 'absolute', bottom: '15%', left: '-5%', width: '110%', height: '45%', background: '#f0ede4', clipPath: 'polygon(0 100%, 50% 30%, 100% 100%)', filter: 'drop-shadow(0 -5px 5px rgba(0,0,0,0.1))' }} />

                    {/* Wax Seal */}
                    <div style={{ position: 'absolute', bottom: '34%', left: '50%', transform: 'translateX(-50%)', width: 45, height: 45, background: '#7a1f1f', borderRadius: '50%', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5), 0 3px 6px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 35, height: 35, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 20 }}>
                            â €
                        </div>
                    </div>

                    {/* Overlapping Polaroid */}
                    <div style={{ position: 'absolute', bottom: 0, right: '10%', width: '60%', background: '#fff', padding: '10px 10px 25px', transform: 'rotate(15deg)', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', zIndex: 20 }}>
                        <div style={{ width: '100%', aspectRatio: '1/1', background: `url(${bgUrl})`, filter: 'grayscale(50%)' }} />
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 12: AESTHETIC JOURNAL
    // ==========================================
    if (style.id === 'aesthetic-journal') {
        const bgUrl = uploadedPhoto || AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                background: '#ecebe8', display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxSizing: 'border-box', paddingTop: h * 0.1
            }}>
                {/* Lined paper pattern */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '100% 40px', backgroundPosition: '0 20px', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', left: w * 0.1, top: 0, bottom: 0, width: 2, background: 'rgba(255,0,0,0.1)', pointerEvents: 'none' }} />

                <div style={{ fontSize: w * 0.1, fontFamily: "'Inter', sans-serif", fontWeight: 300, color: '#333', letterSpacing: -1, zIndex: 10 }}>
                    {scene.tag || 'Daily Journal'}
                </div>
                <div style={{ fontSize: w * 0.035, fontFamily: "'Courier New', Courier", color: '#666', marginTop: 5, zIndex: 10, fontStyle: 'italic' }}>
                    {scene.sub || '10/07/2031'}
                </div>

                {/* Highlighter text */}
                <div style={{ position: 'relative', width: w * 0.8, textAlign: 'center', marginTop: h * 0.08, zIndex: 10 }}>
                    {/* Yellow highlighter mark */}
                    <div style={{ position: 'absolute', top: 5, left: '10%', width: '80%', height: '1.2em', background: '#eefa2a', opacity: 0.8, transform: 'rotate(-1deg)', zIndex: -1, borderRadius: 3 }} />
                    <div style={{ fontFamily: "'Cedarville Cursive', 'Caveat', cursive, serif", fontSize: w * 0.055, color: '#222', lineHeight: 1.6, fontStyle: 'italic' }}>
                        {mainText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                </div>

                {/* Photos */}
                <div style={{ position: 'absolute', bottom: h * 0.18, left: w * 0.18, zIndex: 15 }}>
                    <div style={{ position: 'absolute', bottom: 20, left: 30, width: w * 0.5, padding: '10px 10px 30px', background: '#fff', transform: 'rotate(8deg)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: '100%', aspectRatio: '1/1', background: `url(${AESTHETIC_IMAGES[(index + 1) % AESTHETIC_IMAGES.length]})` }} />
                    </div>
                    <div style={{ position: 'relative', width: w * 0.5, padding: '10px 10px 30px', background: '#fff', transform: 'rotate(-4deg)', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
                        <div style={{ width: '100%', aspectRatio: '1/1', background: `url(${bgUrl})` }} />
                    </div>
                </div>

                {/* Scribbles */}
                <svg style={{ position: 'absolute', bottom: h * 0.2, right: -20, width: 150, height: 150, zIndex: 12 }} viewBox="0 0 100 100">
                    <path d="M10,50 Q30,10 50,50 T90,50 Q70,90 50,50 T10,50 Q50,0 90,50" fill="none" stroke="#222" strokeWidth="1" />
                    <path d="M20,60 Q40,20 60,60 T80,40" fill="none" stroke="#222" strokeWidth="0.8" />
                </svg>

                <div style={{ position: 'absolute', bottom: h * 0.05, border: '1px solid #999', borderRadius: 100, padding: '6px 20px', fontSize: w * 0.04, color: '#555', fontFamily: "'Playfair Display', serif", fontStyle: 'italic', zIndex: 10 }}>
                    {scene.cta || 'cool vibes always'}
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 13: AESTHETIC BRUSH
    // ==========================================
    if (style.id === 'aesthetic-brush') {
        const bgUrl = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `url('${bgUrl}')`
                    : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                fontFamily: style.font, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {/* Rainy window effect / blur overlay */}
                <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(3px)', background: 'rgba(50,70,90,0.2)' }} />

                <div style={{
                    position: 'relative', zIndex: 10, width: w * 0.9, height: h * 0.35,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: '#222'
                }}>
                    {/* SVG Brush stroke behind text */}
                    <div style={{
                        position: 'absolute', inset: 0, opacity: 0.95, zIndex: -1,
                        background: '#ffffff', clipPath: 'polygon(5% 15%, 95% 5%, 100% 30%, 90% 85%, 15% 95%, 0% 80%, 8% 50%, 0% 15%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'url(#roughEdge)'
                    }}>
                        <svg width="0" height="0">
                            <filter id="roughEdge">
                                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
                                <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
                            </filter>
                        </svg>
                        {/* Inner roughening lines */}
                        <div style={{ width: '100%', height: '100%', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 20px)' }} />
                    </div>

                    <div style={{ fontSize: w * 0.05, letterSpacing: 5, fontWeight: 300, fontFamily: "'Inter', sans-serif" }}>
                        {scene.tag || '2030'}
                    </div>
                    <div style={{ fontSize: w * 0.18, fontFamily: "'Caveat', cursive, serif", transform: 'rotate(-5deg)', margin: '-10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {mainText || 'Dubai'}
                    </div>
                    <div style={{ fontSize: w * 0.05, letterSpacing: 2, fontWeight: 300, fontFamily: "'Inter', sans-serif", textTransform: 'uppercase' }}>
                        {scene.sub || 'Travel highlights'}
                    </div>
                </div>

                {/* Pause button decoration */}
                <div style={{ position: 'absolute', bottom: 30, left: 30, width: 40, height: 40, background: 'rgba(0,0,0,0.5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, zIndex: 10 }}>
                    â ¸
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 14: AESTHETIC SHADOW
    // ==========================================
    if (style.id === 'aesthetic-shadow') {
        const bgUrl = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage
                    ? `url('${bgUrl}')`
                    : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                fontFamily: style.font, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
                <div style={{
                    position: 'relative', zIndex: 10, width: w * 0.9, textAlign: 'center',
                    color: style.text, textShadow: '4px 4px 0px rgba(0,0,0,1)'
                }}>
                    <div style={{ fontSize: w * 0.15, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1, letterSpacing: -2 }}>
                        {mainText.split('\n').map((line, i) => <div key={i}>{line.replace(/\*\*/g, '')}</div>)}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 15: AESTHETIC TRIPLE
    // ==========================================
    if (style.id === 'aesthetic-triple') {
        const bg1 = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        const bg2 = AESTHETIC_IMAGES[(index + 1) % AESTHETIC_IMAGES.length];
        const bg3 = AESTHETIC_IMAGES[(index + 2) % AESTHETIC_IMAGES.length];
        return (
            <div style={{ width: w, height: h, display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: style.font }}>
                <div style={{ flex: 1, backgroundImage: showBgImage ? `url(${bg1})` : style.bg1, borderBottom: '4px solid #fff' }} />
                <div style={{ flex: 1, backgroundImage: showBgImage ? `url(${bg2})` : style.bg2, filter: 'grayscale(0.5)' }} />
                <div style={{ flex: 1, backgroundImage: showBgImage ? `url(${bg3})` : '#ccc', borderTop: '4px solid #fff' }} />
                
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '15px 30px', boxSizing: 'border-box', borderRadius: 4, width: '80%', textAlign: 'center', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                    <div style={{ fontSize: w * 0.05, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>{mainText}</div>
                    {scene.sub && <div style={{ fontSize: w * 0.03, color: '#666', marginTop: 8 }}>{scene.sub}</div>}
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 16: AESTHETIC VLOG
    // ==========================================
    if (style.id === 'aesthetic-vlog') {
        const bgUrl = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage ? `url('${bgUrl}')` : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                fontFamily: style.font, display: 'flex', flexDirection: 'column', padding: w * 0.08, boxSizing: 'border-box'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))' }} />
                <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', textAlign: 'left', color: '#fff' }}>
                    <div style={{ fontSize: w * 0.06, fontWeight: 500, lineHeight: 1.3, marginBottom: 8, letterSpacing: -0.5 }}>{mainText.toLowerCase()}</div>
                    {scene.sub && <div style={{ fontSize: w * 0.03, opacity: 0.7, letterSpacing: 1 }}>{`> ${scene.sub.toLowerCase()}`}</div>}
                </div>
                {/* REC element */}
                <div style={{ position: 'absolute', top: w * 0.08, right: w * 0.08, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff0000', animation: 'blink 1s infinite' }} />
                    <div style={{ color: '#fff', fontSize: w * 0.03, fontWeight: 700 }}>REC</div>
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 17: AESTHETIC HANDWRITTEN
    // ==========================================
    if (style.id === 'aesthetic-handwritten') {
        const bgUrl = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage ? `url('${bgUrl}')` : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                fontFamily: style.font, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,15,10,0.7)', backdropFilter: 'blur(2px)' }} />
                <div style={{ position: 'relative', zIndex: 10, width: '85%', textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: w * 0.09, lineHeight: 1.4, transform: 'rotate(-2deg)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                        {mainText.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 18: CYBERPUNK NEON
    // ==========================================
    if (style.id === 'aesthetic-neon') {
        const bgUrl = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage ? `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('${bgUrl}')` : '#09090b',
                fontFamily: style.font, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                {/* Grid background */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
                
                <div style={{ position: 'relative', zIndex: 10, width: w * 0.9, textAlign: 'center', color: '#fff' }}>
                    {scene.tag && <div style={{ fontSize: w * 0.035, letterSpacing: 4, color: style.accent, textTransform: 'uppercase', marginBottom: 12, textShadow: `0 0 10px ${style.accent}, 0 0 20px ${style.accent}` }}>{scene.tag}</div>}
                    
                    <div style={{ fontSize: w * 0.08, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, lineHeight: 1.2, margin: '15px 0' }}>
                        {mainText.split('\n').map((line, i) => (
                            <div key={i} style={{ 
                                textShadow: i % 2 === 0 ? `0 0 15px ${style.accent}, 0 0 30px ${style.accent}` : `0 0 15px #ec4899, 0 0 30px #ec4899`,
                                color: '#fff'
                            }}>
                                {line.replace(/\*\*/g, '')}
                            </div>
                        ))}
                    </div>

                    {scene.sub && <div style={{ fontSize: w * 0.035, color: '#a1a1aa', marginTop: 15, border: `1px solid ${style.accent}`, padding: '8px 16px', display: 'inline-block', borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>{scene.sub}</div>}
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 19: GLASSMORPHISM UI
    // ==========================================
    if (style.id === 'aesthetic-glass') {
        const bgUrl = AESTHETIC_IMAGES[(index + 3) % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage ? `url('${bgUrl}')` : `linear-gradient(135deg, ${style.bg1}, ${style.bg2})`,
                fontFamily: style.font, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {/* Floating orbs behind */}
                <div style={{ position: 'absolute', top: '10%', left: '-10%', width: w*0.6, height: w*0.6, background: style.accent, borderRadius: '50%', filter: 'blur(60px)', opacity: 0.5 }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: w*0.7, height: w*0.7, background: '#3b82f6', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4 }} />

                <div style={{ 
                    position: 'relative', zIndex: 10, width: w * 0.85, padding: w * 0.08, boxSizing: 'border-box',
                    background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    color: '#fff', display: 'flex', flexDirection: 'column'
                }}>
                    {scene.tag && (
                        <div style={{ display: 'inline-block', alignSelf: 'flex-start', background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 100, fontSize: w * 0.03, fontWeight: 500, letterSpacing: 0.5, marginBottom: 16 }}>
                            {scene.tag}
                        </div>
                    )}
                    
                    <div style={{ fontSize: w * 0.065, fontWeight: 600, lineHeight: 1.3, marginBottom: 16 }}>
                        {mainText.split('\n').map((line, i) => <div key={i}>{line.replace(/\*\*/g, '')}</div>)}
                    </div>
                    
                    {scene.sub && <div style={{ fontSize: w * 0.035, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, borderLeft: `2px solid ${style.accent}`, paddingLeft: 12 }}>{scene.sub}</div>}
                    
                    {isCTA && scene.cta && (
                         <div style={{ marginTop: 24, padding: '12px 0', background: style.accent, borderRadius: 12, textAlign: 'center', fontWeight: 600, fontSize: w * 0.035, color: '#fff' }}>
                             {scene.cta}
                         </div>
                    )}
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 20: VINTAGE FILM
    // ==========================================
    if (style.id === 'aesthetic-vintage') {
        const bgUrl = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage ? `url('${bgUrl}')` : style.bg1,
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(100, 60, 20, 0.3)', mixBlendMode: 'color' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`, opacity: 0.3, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
                
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: w * 0.08, background: '#111', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
                    {Array.from({ length: 15 }).map((_, i) => <div key={i} style={{ width: w * 0.04, height: w * 0.03, background: '#fff', borderRadius: 2 }} />)}
                </div>
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: w * 0.08, background: '#111', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
                    {Array.from({ length: 15 }).map((_, i) => <div key={i} style={{ width: w * 0.04, height: w * 0.03, background: '#fff', borderRadius: 2 }} />)}
                </div>

                <div style={{ position: 'absolute', bottom: h * 0.15, left: '50%', transform: 'translateX(-50%)', width: '70%', textAlign: 'center' }}>
                    <div style={{ background: '#f5e8d3', padding: '15px 20px', borderRadius: 4, boxSizing: 'border-box', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', position: 'relative', color: '#333' }}>
                        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#d97736', color: '#fff', fontSize: w * 0.025, padding: '2px 8px', borderRadius: 2, fontWeight: 700, letterSpacing: 1 }}>{scene.tag || 'SCENE ' + (index + 1)}</div>
                        <div style={{ fontSize: w * 0.045, fontWeight: 700, lineHeight: 1.3 }}>{mainText}</div>
                        {scene.sub && <div style={{ fontSize: w * 0.03, fontStyle: 'italic', marginTop: 8, color: '#666' }}>{scene.sub}</div>}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 21: EDITORIAL MAGAZINE
    // ==========================================
    if (style.id === 'aesthetic-magazine') {
        const bgUrl = AESTHETIC_IMAGES[(index + 4) % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                background: '#ffffff', fontFamily: style.font, display: 'flex', flexDirection: 'column', padding: w * 0.06, boxSizing: 'border-box'
            }}>
                {/* Magazine header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 15 }}>
                    <div style={{ fontSize: w * 0.03, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontFamily: "'Inter', sans-serif" }}>VOGUE ISSUE</div>
                    <div style={{ fontSize: w * 0.03, color: '#666', fontFamily: "'Inter', sans-serif" }}>OCT {new Date().getFullYear()}</div>
                </div>

                <div style={{ flex: 1, position: 'relative', marginBottom: 20 }}>
                     <div style={{ width: '100%', height: '100%', backgroundImage: showBgImage ? `url('${bgUrl}')` : style.bg2, filter: 'grayscale(20%)' }} />
                     
                     {/* Text overlay box */}
                     <div style={{ position: 'absolute', bottom: -10, right: -10, background: '#fff', padding: '20px', boxSizing: 'border-box', width: '85%', boxShadow: '-5px -5px 0 rgba(0,0,0,0.1)' }}>
                         <div style={{ fontSize: w * 0.07, fontWeight: 900, lineHeight: 1.1, color: '#000', marginBottom: 10, fontStyle: 'italic' }}>
                             {mainText.split('\n').map((line, i) => <div key={i}>{line.replace(/\*\*/g, '')}</div>)}
                         </div>
                         {scene.sub && <div style={{ fontSize: w * 0.03, fontFamily: "'Inter', sans-serif", color: '#444', lineHeight: 1.4 }}>{scene.sub}</div>}
                     </div>
                </div>

                {isCTA && scene.cta && (
                    <div style={{ alignSelf: 'center', border: '1px solid #000', padding: '8px 24px', fontSize: w * 0.035, textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginTop: 10 }}>
                        {scene.cta}
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // LAYOUT 22: CORPORATE MINIMAL
    // ==========================================
    if (style.id === 'corporate-minimal') {
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                background: `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                padding: w * 0.08, alignItems: 'flex-start', justifyContent: 'center'
            }}>
                <div style={{
                    color: style.accent, fontSize: w * 0.04, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: h * 0.02
                }}>
                    {scene.tag || 'BUSINESS INSIGHT'}
                </div>
                <div style={{
                    color: style.text, fontSize: w * 0.08, fontWeight: 800, lineHeight: 1.2, marginBottom: h * 0.02
                }}>
                    {mainText.split('\n').map((line, i) => (
                        <div key={i}>{line.replace(/\*\*/g, '')}</div>
                    ))}
                </div>
                <div style={{
                    color: style.sub, fontSize: w * 0.045, fontWeight: 400, lineHeight: 1.4, borderLeft: `3px solid ${style.accent}`, paddingLeft: 10
                }}>
                    {scene.sub}
                </div>
                {isCTA && scene.cta && (
                    <div style={{
                        marginTop: h * 0.04, background: style.accent, color: '#ffffff', fontSize: w * 0.04, fontWeight: 600, padding: `${h * 0.015}px ${w * 0.06}px`, borderRadius: 4
                    }}>
                        {scene.cta}
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // LAYOUT 23: GRADIENT HOLOGRAPHIC
    // ==========================================
    if (style.id === 'gradient-holographic') {
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                background: `linear-gradient(135deg, ${style.bg1}, ${style.bg2}, ${style.accent})`,
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: w * 0.08
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} />
                <div style={{ position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.2)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <div style={{
                        color: style.text, fontSize: w * 0.09, fontWeight: 900, lineHeight: 1.1, textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}>
                        {mainText.split('\n').map((line, i) => (
                            <div key={i}>{line.replace(/\*\*/g, '')}</div>
                        ))}
                    </div>
                    {scene.sub && (
                        <div style={{
                            color: style.text, fontSize: w * 0.04, fontWeight: 500, marginTop: h * 0.02, opacity: 0.9
                        }}>
                            {scene.sub}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ==========================================
    // LAYOUT 24: LUXURY BLACK
    // ==========================================
    if (style.id === 'luxury-black') {
        const bgUrl = AESTHETIC_IMAGES[(index + 5) % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage ? `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.95)), url('${bgUrl}')` : `linear-gradient(to bottom, ${style.bg1}, ${style.bg2})`,
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: w * 0.1
            }}>
                <div style={{
                    width: '100%', borderTop: `1px solid ${style.text}`, borderBottom: `1px solid ${style.text}`, padding: '20px 0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <div style={{ color: style.text, fontSize: w * 0.08, fontWeight: 300, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: 2 }}>
                        {mainText.split('\n').map((line, i) => <div key={i}>{line.replace(/\*\*/g, '')}</div>)}
                    </div>
                </div>
                {scene.sub && (
                    <div style={{ color: style.accent, fontSize: w * 0.035, letterSpacing: 4, marginTop: 30, textTransform: 'uppercase', opacity: 0.8 }}>
                        {scene.sub}
                    </div>
                )}
                {isCTA && scene.cta && (
                    <div style={{ marginTop: 40, border: `1px solid ${style.text}`, color: style.text, padding: '10px 25px', fontSize: w * 0.03, letterSpacing: 2, textTransform: 'uppercase' }}>
                        {scene.cta}
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // LAYOUT 25: BREAKING NEWS
    // ==========================================
    if (style.id === 'news-alert') {
        const bgUrl = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage ? `url('${bgUrl}')` : '#ffffff',
                fontFamily: style.font, display: 'flex', flexDirection: 'column'
            }}>
                {showBgImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />}
                
                <div style={{ position: 'absolute', bottom: 100, left: 0, width: '100%', zIndex: 20 }}>
                    <div style={{ background: '#ffffff', color: '#000', padding: '5px 15px', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                        <div style={{ background: style.bg1, color: '#fff', padding: '2px 8px', marginRight: 10, fontSize: w * 0.03 }}>BREAKING</div>
                        <div style={{ fontSize: w * 0.03, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scene.tag || 'LATEST UPDATE'}</div>
                    </div>
                    <div style={{ background: style.bg1, color: '#ffffff', padding: '15px 20px', fontSize: w * 0.05, fontWeight: 700, lineHeight: 1.2 }}>
                        {mainText}
                    </div>
                    {scene.sub && (
                         <div style={{ background: '#000000', color: style.sub, padding: '8px 20px', fontSize: w * 0.035, fontWeight: 500 }}>
                             {scene.sub}
                         </div>
                    )}
                </div>
                
                {isCTA && scene.cta && (
                    <div style={{ position: 'absolute', top: 50, right: 20, background: '#ffeb3b', color: '#000', padding: '10px 20px', fontSize: w * 0.04, fontWeight: 'bold', zIndex: 20, boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                        {scene.cta}
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // LAYOUT 26: NEON CYBERPUNK 2.0
    // ==========================================
    if (style.id === 'neon-cyber') {
        const bgUrl = AESTHETIC_IMAGES[index % AESTHETIC_IMAGES.length];
        return (
            <div style={{
                width: w, height: h, position: 'relative', overflow: 'hidden',
                backgroundImage: showBgImage ? `linear-gradient(to bottom, rgba(17,0,34,0.8), rgba(0,0,0,0.9)), url('${bgUrl}')` : `radial-gradient(circle at 50% 50%, ${style.bg1}, ${style.bg2})`,
                fontFamily: style.font, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
                alignItems: 'center', justifyContent: 'center', padding: w * 0.08
            }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.05) 2px, rgba(0,255,255,0.05) 4px)', pointerEvents: 'none' }} />
                
                <div style={{
                    color: style.text, fontSize: w * 0.07, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center',
                    textShadow: `0 0 5px ${style.text}, 0 0 10px ${style.text}, 0 0 20px ${style.text}`, zIndex: 10, lineHeight: 1.2
                }}>
                    {mainText.split('\n').map((line, i) => <div key={i}>{line.replace(/\*\*/g, '')}</div>)}
                </div>
                
                {scene.sub && (
                    <div style={{
                        marginTop: 20, background: 'rgba(255,0,255,0.1)', color: style.accent, padding: '10px 20px', fontSize: w * 0.035,
                        border: `1px solid ${style.accent}`, textShadow: `0 0 5px ${style.accent}`, boxShadow: `0 0 10px rgba(255,0,255,0.3), inset 0 0 10px rgba(255,0,255,0.3)`, zIndex: 10
                    }}>
                        {scene.sub}
                    </div>
                )}
                
                {isCTA && scene.cta && (
                    <div style={{
                        marginTop: 40, borderBottom: `2px solid ${style.text}`, color: '#ffffff', paddingBottom: 5, fontSize: w * 0.04, textTransform: 'uppercase', letterSpacing: 2, zIndex: 10
                    }}>
                        {scene.cta}
                    </div>
                )}
            </div>
        );
    }

    // ==========================================
    // FALLBACK
    // ==========================================
    return (
        <div style={{
            width: w, height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#111', color: '#fff', fontFamily: style.font, padding: 20, textAlign: 'center'
        }}>
            <div style={{ fontSize: w * 0.08, fontWeight: 'bold', marginBottom: 20 }}>{mainText.split('\n').map((line, i) => <div key={i}>{line.replace(/\*\*/g, '')}</div>)}</div>
            {scene.sub && <div style={{ fontSize: w * 0.04, color: '#aaa', marginTop: 10 }}>{scene.sub}</div>}
            {isCTA && scene.cta && <div style={{ marginTop: 20, color: style.accent, fontSize: w * 0.045, fontWeight: 'bold' }}>{scene.cta}</div>}
        </div>
    );
}

// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  
// REEL MODE PICKER
// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  
const REEL_MODES = [
    {
        id: 'faceless',
        emoji: '🎭',
        title: 'Faceless Reel',
        desc: 'Text-card style, voiceover-friendly. No face needed.',
        detail: '5 scenes · Best for info/tips content',
        scenes: 5,
        color: '#6366f1',
    },
    {
        id: 'short',
        emoji: '⚡',
        title: '5-Second Snack',
        desc: 'Ultra-punchy, 3 scenes. Hook → Payoff → CTA.',
        detail: '3 scenes · Best for trending/meme content',
        scenes: 3,
        color: '#f59e0b',
    },
    {
        id: 'long',
        emoji: '🎬',
        title: '60-Sec Story',
        desc: 'Full narrative arc: hook, story, insights, CTA.',
        detail: '8 scenes · Best for storytelling/tutorial',
        scenes: 8,
        color: '#10b981',
    },
];

function ModePicker({ onSelect }) {
    const [hovered, setHovered] = React.useState(null);
    return (
        <div style={{
            minHeight: '80vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', sans-serif", padding: '40px 20px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>Create Your Reel</h1>
                <p style={{ color: '#64748b', marginTop: 10, fontSize: 15, maxWidth: 400, margin: '10px auto 0' }}>
                    Choose a format. The AI will write a script optimised for it.
                </p>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 860 }}>
                {REEL_MODES.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => onSelect(mode)}
                        onMouseEnter={() => setHovered(mode.id)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                            width: 240, padding: '28px 22px', borderRadius: 20,
                            border: `2px solid ${hovered === mode.id ? mode.color : mode.color + '33'}`,
                            background: hovered === mode.id ? `${mode.color}08` : '#ffffff',
                            cursor: 'pointer', textAlign: 'left',
                            boxShadow: hovered === mode.id ? `0 12px 40px ${mode.color}2a` : '0 4px 20px rgba(0,0,0,0.06)',
                            transform: hovered === mode.id ? 'translateY(-4px)' : 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <div style={{ fontSize: 36, marginBottom: 14 }}>{mode.emoji}</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{mode.title}</div>
                        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 14 }}>{mode.desc}</div>
                        <div style={{
                            display: 'inline-block', fontSize: 11, fontWeight: 700,
                            background: `${mode.color}18`, color: mode.color,
                            padding: '4px 12px', borderRadius: 100, letterSpacing: 0.3
                        }}>{mode.detail}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  
// MAIN COMPONENT
// ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═  
export default function ReelMaker({ onBack }) {
    const [reelMode, setReelMode] = useState(null); // null = show mode picker
    const [topic, setTopic] = useState('');
    const [customScript, setCustomScript] = useState('');
    const [openAiKey, setOpenAiKey] = useState('');
    const [selectedFont, setSelectedFont] = useState(FONTS[0].id);
    const [isBold, setIsBold] = useState(false);
    const [scenes, setScenes] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState('');
    const [error, setError] = useState('');
    const [currentScene, setCurrentScene] = useState(0);
    const [style, setStyle] = useState(REEL_STYLES[0]);
    const [brandHandle, setBrandHandle] = useState('@yourhandle');
    const [showBgImage, setShowBgImage] = useState(true);
    const [kenBurns, setKenBurns] = useState(true);
    const [captionBurnMode, setCaptionBurnMode] = useState(true);
    const [accentOverride, setAccentOverride] = useState('');
    const [bg1Override, setBg1Override] = useState('');
    const [bg2Override, setBg2Override] = useState('');
    const [textOverride, setTextOverride] = useState('');
    const [sceneCount, setSceneCount] = useState(5);
    const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
    const [activeTab, setActiveTab] = useState('style');
    const [uploadedPhoto, setUploadedPhoto] = useState(null);
    const [uploadedMediaType, setUploadedMediaType] = useState('image'); // 'image' | 'video'
    const [trendingCategory, setTrendingCategory] = useState('SaaS');
    const [trendingTopics, setTrendingTopics] = useState(QUICK_TOPICS.slice(0, 5));
    const [fetchingTrends, setFetchingTrends] = useState(false);
    // ── Publish States ──
    const [caption, setCaption] = useState('');
    const [captionLoading, setCaptionLoading] = useState(false);
    const [platform, setPlatform] = useState('instagram');
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleSuccess, setScheduleSuccess] = useState(false);
    // ── Style Copy States ──
    const [styleCopyFile, setStyleCopyFile] = useState(null);       // File object
    const [styleCopyPreview, setStyleCopyPreview] = useState(null); // Object URL
    const [styleCopyMediaType, setStyleCopyMediaType] = useState('image');
    const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
    const [styleCopyResult, setStyleCopyResult] = useState(null);
    const [styleCopyError, setStyleCopyError] = useState('');
    const [clonedBgUrl, setClonedBgUrl] = useState(null); // The actual uploaded image used as bg
    const exportRefs = useRef([]);
    const photoInputRef = useRef(null);
    const styleCopyInputRef = useRef(null);

    // Read prefill from ViralTemplates via localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem('reel_prefill');
            if (raw) {
                const prefill = JSON.parse(raw);
                if (prefill.topic) setTopic(prefill.topic);
                localStorage.removeItem('reel_prefill');
            }
        } catch {}

        // Check query parameters
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const topicParam = params.get('topic');
            if (topicParam) {
                const cleanTopic = topicParam.trim();
                setTopic(cleanTopic);
                
                // Automatically select first mode: Faceless Reel
                const defaultMode = REEL_MODES[0];
                setReelMode(defaultMode);
                setSceneCount(defaultMode.scenes);
                
                // Trigger AI generation
                generateReels(cleanTopic, defaultMode.id, defaultMode.scenes);
            }
        }
    }, []);

    // Show mode picker until user selects one
    if (!reelMode) {
        return (
            <ModePicker onSelect={(mode) => {
                setReelMode(mode);
                setSceneCount(mode.scenes);
            }} />
        );
    }

    function handlePhotoUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (uploadedPhoto) URL.revokeObjectURL(uploadedPhoto);
        const url = URL.createObjectURL(file);
        setUploadedMediaType(file.type.startsWith('video/') ? 'video' : 'image');
        setUploadedPhoto(url);
        setShowBgImage(true);
    }

    const fetchTrendingTopics = async () => {
        setFetchingTrends(true);
        if (trendingCategory === 'Geo-Finance') {
            try {
                const res = await fetch('/api/antigravity/geo-finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'scan' }) });
                const data = await res.json();
                setTrendingTopics((data.news || []).slice(0, 5).map(n => n.headline + ' (Geo-Finance)'));
            } catch (e) {
                console.error(e);
                setTrendingTopics(['Escalating Trade War Impacts Tech Stocks', 'New Sanctions Cause Market Shock', 'Central Bank Rate Hike Rocks Crypto']);
            }
            setFetchingTrends(false);
            return;
        }

        setTimeout(() => {
            const nicheMap = {
                'SaaS': ['SaaS hacks that feel illegal to know', 'Why most SaaS startups fail in 2026', 'How I scaled my SaaS to $10k/mo', 'The absolute best AI tools for SaaS', 'Stop doing this if you own a SaaS'],
                'Finance': ['5 money mistakes keeping you broke', 'How to manipulate credit cards legally', 'The dark truth about index funds', 'Why wealthy people love debt', 'Start investing with $0 today'],
                'Real Estate': ['How to buy property with 0% down', 'The biggest real estate crash is coming', 'Why renting is technically a scam', 'Secret tax loops for property owners', 'Real estate vs Stocks in 2026'],
                'E-commerce': ['How dropshipping actually works', 'The only e-com strategy you need', 'Scaling Shopify to $100k/day', 'Why your store is losing money', 'TikTok Shop is a printing press'],
                'Fitness': ['The most useless exercises you do', 'How to actually lose fat eating pizza', 'Why gym bros are wrong about protein', 'The only 3 supplements you need', 'Stop stretching before lifting']
            };
            setTrendingTopics(nicheMap[trendingCategory] || QUICK_TOPICS.slice(0, 5));
            setFetchingTrends(false);
        }, 800);
    };

    function removeUploadedPhoto() {
        if (uploadedPhoto) URL.revokeObjectURL(uploadedPhoto);
        setUploadedPhoto(null);
        if (photoInputRef.current) photoInputRef.current.value = '';
    }

    function handleStyleCopyUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (styleCopyPreview) URL.revokeObjectURL(styleCopyPreview);
        const url = URL.createObjectURL(file);
        setStyleCopyFile(file);
        setStyleCopyPreview(url);
        setStyleCopyMediaType(file.type.startsWith('video/') ? 'video' : 'image');
        setStyleCopyResult(null);
        setStyleCopyError('');
    }

    function removeStyleCopyMedia() {
        if (styleCopyPreview) URL.revokeObjectURL(styleCopyPreview);
        setStyleCopyFile(null);
        setStyleCopyPreview(null);
        setStyleCopyResult(null);
        setStyleCopyError('');
        if (styleCopyInputRef.current) styleCopyInputRef.current.value = '';
    }

    async function analyzeAndCopyStyle() {
        if (!styleCopyFile) { setStyleCopyError('Please upload a reference photo or video first.'); return; }
        setIsAnalyzingStyle(true);
        setStyleCopyResult(null);
        setStyleCopyError('');
        try {
            // For video: extract a frame as a canvas
            let base64 = '';
            let resolvedMimeType = 'image/jpeg';

            if (styleCopyMediaType === 'video') {
                // Capture a frame from the video at 1 second
                const video = document.createElement('video');
                video.src = styleCopyPreview;
                video.crossOrigin = 'anonymous';
                await new Promise((res, rej) => {
                    video.onloadeddata = () => { video.currentTime = 1; };
                    video.onseeked = res;
                    video.onerror = rej;
                    video.load();
                });
                const canvas = document.createElement('canvas');
                canvas.width = 1080; canvas.height = 1920;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
                resolvedMimeType = 'image/jpeg';
            } else {
                // Read image file as base64
                base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(styleCopyFile);
                });
                resolvedMimeType = styleCopyFile.type || 'image/jpeg';
            }

            const res = await fetch('/api/generate/analyze-style', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: base64,
                    mimeType: resolvedMimeType,
                    openAiKey: openAiKey.trim(),
                    topic: topic.trim() || null,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Style analysis failed');

            // Use the uploaded image as the full-bleed background of the reel.
            // The style template will overlay content on top with extracted colors.
            if (styleCopyMediaType === 'image') {
                if (clonedBgUrl) URL.revokeObjectURL(clonedBgUrl);
                const newBgUrl = URL.createObjectURL(styleCopyFile);
                setClonedBgUrl(newBgUrl);
                // Set as the reel background image too
                if (uploadedPhoto) URL.revokeObjectURL(uploadedPhoto);
                setUploadedPhoto(newBgUrl);
                setUploadedMediaType('image');
                setShowBgImage(true);
            } else {
                setShowBgImage(false);
            }
            // Force the special photo-clone layout so the uploaded image fills the frame
            const cloneStyle = {
                id: 'photo-clone',
                name: 'Photo Clone',
                bg1: data.bgColor1 || '#111111',
                bg2: data.bgColor2 || '#000000',
                text: data.textColor || '#ffffff',
                accent: data.accentColor || '#ff0055',
                sub: data.textColor || '#cccccc',
                font: data.fontId && data.fontId !== 'default' ? data.fontId : (REEL_STYLES[0].font),
            };
            setStyle(cloneStyle);
            if (data.accentColor) setAccentOverride(data.accentColor);
            if (data.bgColor1) setBg1Override(data.bgColor1);
            if (data.bgColor2) setBg2Override(data.bgColor2);
            if (data.textColor) setTextOverride(data.textColor);
            if (data.fontId) setSelectedFont(data.fontId);
            
            const finalTopic = data.suggestedTopic || topic.trim() || 'Visual Aesthetics';
            if (data.suggestedTopic && !topic.trim()) setTopic(data.suggestedTopic);
            
            setStyleCopyResult(data);

            // AUTO-GENERATE THE SCRIPTS & SCENES:
            generateReels(finalTopic);

            // Automatically switch to builder tab to show the result
            setActiveTab('builder');
        } catch (err) {
            setStyleCopyError(err.message || 'Analysis failed. Check your API key.');
        } finally {
            setIsAnalyzingStyle(false);
        }
    }

    const EXPORT_W = aspectRatio.ew;
    const EXPORT_H = aspectRatio.eh;
    const activeStyle = { 
        ...style, 
        bg1: bg1Override || style.bg1,
        bg2: bg2Override || style.bg2,
        text: textOverride || style.text,
        accent: accentOverride || style.accent,
        font: selectedFont !== 'default' ? selectedFont : style.font
    };
    const isPhotoClone = activeStyle.id === 'photo-clone';

    async function generateReels(overrideTopic = null, overrideMode = null, overrideSceneCount = null) {
        const topicToUse = typeof overrideTopic === 'string' ? overrideTopic : topic.trim();
        if (!topicToUse) { setError('Please enter a topic first.'); return; }
        setLoading(true); setError(''); setScenes(null); setCurrentScene(0);
        const modeToUse = overrideMode || reelMode?.id || 'faceless';
        const countToUse = typeof overrideSceneCount === 'number' ? overrideSceneCount : sceneCount;
        try {
            const res = await fetch('/api/generate/reels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topicToUse, customScript, sceneCount: countToUse, openAiKey: openAiKey.trim(), reelMode: modeToUse }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Generation failed');
            setScenes(data.scenes);
        } catch (e) {
            setError(e.message || 'Failed to generate. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    async function generateCaption() {
        if (!topic) { setError('Need to generate a reel first to know the topic.'); return; }
        setCaptionLoading(true); setCaption(''); setScheduleSuccess(false);
        try {
            const res = await fetch('/api/antigravity/caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, platform }),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Caption generation failed');
            setCaption(data.caption);
        } catch (e) {
            setError(e.message);
        } finally {
            setCaptionLoading(false);
        }
    }

    async function scheduleReel() {
        setIsScheduling(true);
        // Simulate API call to schedule the post
        await new Promise(r => setTimeout(r, 1500));
        setIsScheduling(false);
        setScheduleSuccess(true);
        setTimeout(() => setScheduleSuccess(false), 3000);
    }

    async function downloadReels() {
        if (!scenes || exportRefs.current.length === 0) return;
        setIsDownloading(true);
        try {
            const htmlToImage = await import('html-to-image');
            const zip = new JSZip();
            for (let i = 0; i < exportRefs.current.length; i++) {
                const el = exportRefs.current[i];
                if (!el) continue;
                const dataUrl = await htmlToImage.toJpeg(el, {
                    pixelRatio: 1,
                    backgroundColor: '#000000',
                    fontEmbedCSS: '',
                    quality: 0.9,
                    useCORS: true,
                    allowTaint: true,
                });
                zip.file(`scene-${i + 1}.jpg`, dataUrl.split(',')[1], { base64: true });
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reels-${(topic || 'content').replace(/\\s+/g, '-').toLowerCase()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            setError('Failed to package reel scenes. Try changing the style or images.');
        } finally {
            setIsDownloading(false);
        }
    }

    async function exportFullReel() {
        if (!scenes || exportRefs.current.length === 0) return;
        setIsExporting(true);
        setExportProgress('Capturing scenes...');
        try {
            // Capture all scene frames as images
            const htmlToImage = await import('html-to-image');
            const frames = [];
            const isVideoBg = uploadedMediaType === 'video' && showBgImage;
            const videoEl = isVideoBg ? document.getElementById('uploaded-video-bg') : null;

            for (let i = 0; i < exportRefs.current.length; i++) {
                const el = exportRefs.current[i];
                if (!el) continue;
                setExportProgress(`Rendering scene ${i + 1} of ${scenes.length}...`);
                const dataUrl = await htmlToImage.toPng(el, {
                    pixelRatio: 1,
                    backgroundColor: isVideoBg ? null : '#000000',
                    fontEmbedCSS: '',
                    useCORS: true,
                    allowTaint: true,
                });
                const img = new Image();
                img.src = dataUrl;
                await new Promise((resolve) => { img.onload = resolve; });
                frames.push(img);
            }

            // Set up output canvas matching first frame dimensions
            setExportProgress('Encoding video...');
            const outCanvas = document.createElement('canvas');
            outCanvas.width = frames[0].naturalWidth;
            outCanvas.height = frames[0].naturalHeight;
            const ctx = outCanvas.getContext('2d');

            const stream = outCanvas.captureStream(30);
            const mp4Supported = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4');
            const recorderMime = mp4Supported ? 'video/mp4' : 'video/webm;codecs=vp9';
            const recorder = new MediaRecorder(stream, { mimeType: recorderMime, videoBitsPerSecond: 8000000 });
            const chunks = [];
            recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.start();

            const SCENE_DURATION = 3000; // ms per scene
            const FADE_FRAMES = 20;     // frames for fade transition

            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                const drawFrame = (alpha) => {
                    ctx.clearRect(0, 0, outCanvas.width, outCanvas.height);
                    if (isVideoBg && videoEl) {
                        ctx.globalAlpha = 1;
                        ctx.drawImage(videoEl, 0, 0, outCanvas.width, outCanvas.height);
                    } else if (!isVideoBg) {
                        ctx.globalAlpha = 1;
                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
                    }
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(frame, 0, 0, outCanvas.width, outCanvas.height);
                };

                // Fade in
                for (let f = 0; f <= FADE_FRAMES; f++) {
                    drawFrame(f / FADE_FRAMES);
                    await new Promise(r => setTimeout(r, 1000 / 30));
                }

                // Hold
                const holdStart = performance.now();
                while (performance.now() - holdStart < SCENE_DURATION - (FADE_FRAMES / 30 * 1000)) {
                    drawFrame(1);
                    await new Promise(r => setTimeout(r, 1000 / 30));
                }

                // Fade out (except last)
                if (i < frames.length - 1) {
                    for (let f = FADE_FRAMES; f >= 0; f--) {
                        drawFrame(f / FADE_FRAMES);
                        await new Promise(r => setTimeout(r, 1000 / 30));
                    }
                }
            }

            recorder.stop();
            await new Promise(r => { recorder.onstop = r; });

            const mimeType = recorder.mimeType || 'video/webm';
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
            a.download = `reel-${(topic || 'content').replace(/\s+/g, '-').toLowerCase()}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            setError('Video export failed. Your browser may not support MediaRecorder.');
        } finally {
            setIsExporting(false);
            setExportProgress('');
        }
    }

    const panelStyle = {
        background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
    };
    const labelStyle = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 2 };
    const inputStyle = {
        background: '#f8f9fa', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a',
        padding: '9px 12px', fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none',
    };
    const btnPrimary = {
        background: 'linear-gradient(135deg, #ff0055, #ff6600)', color: '#fff', border: 'none',
        borderRadius: 10, padding: '12px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer',
        width: '100%', letterSpacing: 0.5,
    };
    const btnSec = {
        background: '#f8f9fa', color: '#1e293b', border: '1px solid #e2e8f0',
        borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
    };

    return (
        <div style={{ display: 'flex', gap: 20, width: '100%', minHeight: '80vh', color: '#111', fontFamily: "'Inter', sans-serif" }}>

            {/* ── LEFT PANEL ── */}
            <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', paddingRight: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={onBack} style={{ ...btnSec, alignSelf: 'flex-start' }}>← Back</button>
                    {reelMode && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
                                background: `${reelMode.color}18`, color: reelMode.color, border: `1px solid ${reelMode.color}33`
                            }}>{reelMode.emoji} {reelMode.title}</span>
                            <button onClick={() => setReelMode(null)} style={{
                                background: 'none', border: 'none', color: '#94a3b8', fontSize: 11,
                                cursor: 'pointer', textDecoration: 'underline', padding: 0
                            }}>Change</button>
                        </div>
                    )}
                </div>

                <div style={panelStyle}>
                    <div style={labelStyle}>🔑 OpenAI API Key</div>
                    <input type="password" value={openAiKey} onChange={e => setOpenAiKey(e.target.value)}
                        placeholder="sk-proj-..." style={{ ...inputStyle, marginBottom: 8 }} />
                    
                    <div style={labelStyle}>📈 Trending Topics Summary</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                        <select value={trendingCategory} onChange={e => setTrendingCategory(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            <option value="SaaS">SaaS</option>
                            <option value="Finance">Finance</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="E-commerce">E-commerce</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Geo-Finance">Geo-Finance 🌍</option>
                        </select>
                        <button onClick={fetchTrendingTopics} disabled={fetchingTrends} style={{ ...btnSec, fontSize: 11, padding: '4px 8px', background: '#e2e8f0', color: '#0f172a' }}>
                            {fetchingTrends ? 'Scanning...' : 'Fetch Trending Summary'}
                        </button>
                    </div>
                    {trendingTopics.length > 0 && (
                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, fontSize: 12, color: '#334155', border: '1px solid #cbd5e1', marginBottom: 12 }}>
                            <strong style={{ display: 'block', marginBottom: 6, color: '#0f172a' }}>🔥 Top Market Trends:</strong>
                            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                                {trendingTopics.map(t => (
                                    <li key={t} style={{ cursor: 'pointer', color: '#ff0055' }} onClick={() => setTopic(t)}>{t}</li>
                                ))}
                            </ul>
                            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>Click any trend to use it as your reel hook.</div>
                        </div>
                    )}

                    <div style={labelStyle}>🎯 Topic / Hook</div>
                    <textarea value={topic} onChange={e => setTopic(e.target.value)}
                        placeholder="e.g. 5 finance mistakes that keep you broke"
                        rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} />
                    
                    <div style={labelStyle}>📝 Quick Generate From Script (Optional)</div>
                    <textarea value={customScript} onChange={e => setCustomScript(e.target.value)}
                        placeholder="Paste your exact script here to bypass AI and generate reels instantly..."
                        rows={4} style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }} />
                    
                    <div style={labelStyle}>🎬 Scenes: {sceneCount}</div>
                    <input type="range" min={3} max={8} value={sceneCount}
                        onChange={e => setSceneCount(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#ff0055', marginBottom: 12 }} />
                    <button onClick={generateReels} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
                        {loading ? '✨ Generating...' : '⚡ Generate Reel'}
                    </button>
                    {error && <div style={{ color: '#ff4466', fontSize: 13, background: '#ffe6eb', padding: 8, borderRadius: 6, marginTop: 8 }}>⚠ {error}</div>}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[['style', '🎨 Style'], ['copy', '🪄 Clone Photo/Video Style'], ['algo', '📈 Algo'], ['scenes', '✏️ Edit'], ['publish', '🚀 Publish']].map(([tab, label]) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            flex: tab === 'copy' ? '1 1 100%' : '1 1 calc(50% - 6px)',
                            padding: '7px 0', fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: 'pointer',
                            background: tab === 'copy'
                                ? (activeTab === tab ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.12))')
                                : (activeTab === tab ? 'rgba(255,0,85,0.1)' : '#f8f9fa'),
                            color: tab === 'copy' ? (activeTab === tab ? '#fff' : '#7c3aed') : (activeTab === tab ? '#ff0055' : '#64748b'),
                            border: tab === 'copy' ? (activeTab === tab ? '1px solid #7c3aed' : '1px solid rgba(124,58,237,0.3)') : (activeTab === tab ? '1px solid rgba(255,0,85,0.4)' : '1px solid #e2e8f0'),
                        }}>{label}</button>
                    ))}
                </div>

                {/* ═══════════════════════════════════════════════════
                    STYLE COPY TAB — AI Vision Style Cloner
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'copy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Header card */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                            borderRadius: 12, padding: 14, color: '#fff'
                        }}>
                            <div style={{ fontSize: 22, marginBottom: 6 }}>🪄</div>
                            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>AI Style Cloner</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                                Upload any photo or video. Our AI will analyze its visual DNA — colors, layout, mood — and automatically configure your reel to match that style.
                            </div>
                        </div>

                        {/* Upload zone */}
                        <div style={panelStyle}>
                            <div style={labelStyle}>📸 Reference Photo / Video</div>
                            <input
                                ref={styleCopyInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleStyleCopyUpload}
                                style={{ display: 'none' }}
                                id="style-copy-input"
                            />
                            {styleCopyPreview ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{
                                        width: '100%', aspectRatio: '9/16', maxHeight: 200, borderRadius: 10,
                                        overflow: 'hidden', position: 'relative',
                                        border: '2px solid #7c3aed', background: '#000'
                                    }}>
                                        {styleCopyMediaType === 'video'
                                            ? <video src={styleCopyPreview} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <img src={styleCopyPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Reference" />
                                        }
                                        <div style={{
                                            position: 'absolute', top: 6, right: 6,
                                            background: 'rgba(124,58,237,0.9)', color: '#fff',
                                            borderRadius: '50%', width: 22, height: 22, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: 13,
                                            cursor: 'pointer', fontWeight: 900, lineHeight: 1
                                        }} onClick={removeStyleCopyMedia}>✕</div>
                                        {/* Overlay badge */}
                                        <div style={{
                                            position: 'absolute', bottom: 8, left: 8,
                                            background: 'rgba(124,58,237,0.85)', color: '#fff',
                                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20
                                        }}>{styleCopyMediaType === 'video' ? '🎥 Video' : '📸 Photo'}</div>
                                    </div>

                                    {/* Result display */}
                                    {styleCopyResult && (
                                        <div style={{
                                            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                            border: '1px solid #86efac', borderRadius: 10, padding: 12
                                        }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: '#166534', marginBottom: 6 }}>✅ Style Cloned!</div>
                                            <div style={{ fontSize: 11, color: '#15803d', lineHeight: 1.5, marginBottom: 8 }}>🎨 {styleCopyResult.mood}</div>
                                            <div style={{ fontSize: 11, color: '#166534', lineHeight: 1.5 }}>{styleCopyResult.reasoning}</div>
                                            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                                {styleCopyResult.accentColor && (
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                        background: '#fff', borderRadius: 6, padding: '3px 8px',
                                                        border: '1px solid #d1fae5', fontSize: 10, fontWeight: 700
                                                    }}>
                                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: styleCopyResult.accentColor, border: '1px solid rgba(0,0,0,0.1)' }} />
                                                        {styleCopyResult.accentColor}
                                                    </div>
                                                )}
                                                {styleCopyResult.bgColor1 && (
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                        background: '#fff', borderRadius: 6, padding: '3px 8px',
                                                        border: '1px solid #d1fae5', fontSize: 10, fontWeight: 700
                                                    }}>
                                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: styleCopyResult.bgColor1, border: '1px solid rgba(0,0,0,0.1)' }} />
                                                        BG
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {styleCopyError && (
                                        <div style={{ color: '#dc2626', fontSize: 12, background: '#fef2f2', padding: 10, borderRadius: 8, border: '1px solid #fecaca' }}>
                                            ⚠ {styleCopyError}
                                        </div>
                                    )}

                                    <button
                                        onClick={analyzeAndCopyStyle}
                                        disabled={isAnalyzingStyle}
                                        style={{
                                            ...btnPrimary,
                                            background: isAnalyzingStyle
                                                ? '#94a3b8'
                                                : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                            opacity: isAnalyzingStyle ? 0.8 : 1,
                                            fontSize: 13, padding: '12px 0',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        {isAnalyzingStyle ? (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <span style={{
                                                    display: 'inline-block', width: 14, height: 14,
                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                    borderTopColor: '#fff', borderRadius: '50%',
                                                    animation: 'spin 0.8s linear infinite'
                                                }} />
                                                Analyzing Visual DNA...
                                            </span>
                                        ) : styleCopyResult ? '🔄 Re-Analyze Style' : '🪄 Clone This Style'}
                                    </button>
                                    <button onClick={() => styleCopyInputRef.current?.click()} style={{ ...btnSec, fontSize: 12 }}>📁 Change Reference</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div
                                        onClick={() => styleCopyInputRef.current?.click()}
                                        style={{
                                            border: '2px dashed rgba(124,58,237,0.4)',
                                            borderRadius: 12, padding: '28px 16px',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            gap: 8, cursor: 'pointer', background: 'rgba(124,58,237,0.04)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontSize: 32 }}>📎</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>Upload Reference</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>Any reel, short, or photo whose style you want to copy</div>
                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>JPG · PNG · MP4 · MOV · WEBM</div>
                                    </div>
                                    {styleCopyError && (
                                        <div style={{ color: '#dc2626', fontSize: 12, background: '#fef2f2', padding: 10, borderRadius: 8 }}>⚠ {styleCopyError}</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* How it works */}
                        <div style={{ ...panelStyle, background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)' }}>
                            <div style={{ ...labelStyle, color: '#7c3aed' }}>⚡ HOW IT WORKS</div>
                            {[
                                ['1', '📸', 'Upload any reel, photo, or video frame as reference'],
                                ['2', '🧠', 'GPT-4 Vision analyzes colors, layout, mood & typography'],
                                ['3', '🎨', 'Template, fonts & accent colors are auto-applied'],
                                ['4', '⚡', 'Click Generate — your reel is created in that exact style'],
                            ].map(([step, icon, text]) => (
                                <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                        color: '#fff', fontSize: 10, fontWeight: 800,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>{step}</div>
                                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                                        <span style={{ marginRight: 4 }}>{icon}</span>{text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STYLE TAB */}
                {activeTab === 'style' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={panelStyle}>
                            <div style={labelStyle}>📐 Aspect Ratio</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {ASPECT_RATIOS.map(ar => (
                                    <button key={ar.id} onClick={() => setAspectRatio(ar)} style={{
                                        flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                                        background: aspectRatio.id === ar.id ? '#ff0055' : '#f8f9fa',
                                        color: aspectRatio.id === ar.id ? '#fff' : '#1e293b', border: aspectRatio.id === ar.id ? '1px solid #ff0055' : '1px solid #e2e8f0',
                                    }}>{ar.label}</button>
                                ))}
                            </div>
                        </div>
                        <div style={panelStyle}>
                            <div style={labelStyle}>📷/🎥 Your Media Background</div>
                            <input
                                ref={photoInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handlePhotoUpload}
                                style={{ display: 'none' }}
                                id="photo-upload-input"
                            />
                            {uploadedPhoto ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{
                                        width: '100%', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden',
                                        background: uploadedMediaType === 'image' ? `url('${uploadedPhoto}')` : '#000',
                                        border: '2px solid #ff0055', position: 'relative'
                                    }}>
                                        {uploadedMediaType === 'video' && <video src={uploadedPhoto} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                        <div style={{
                                            position: 'absolute', top: 6, right: 6,
                                            background: 'rgba(255,0,85,0.9)', color: '#fff',
                                            borderRadius: '50%', width: 22, height: 22, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', fontSize: 13,
                                            cursor: 'pointer', fontWeight: 900, lineHeight: 1
                                        }} onClick={removeUploadedPhoto}>✕</div>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>✅ Your custom background is active</div>
                                    <button onClick={() => photoInputRef.current?.click()} style={{ ...btnSec, fontSize: 12 }}>🔄 Change Media</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>Upload an image or a short video to act as your B-Roll background.</div>
                                    <button
                                        onClick={() => photoInputRef.current?.click()}
                                        style={{
                                            ...btnPrimary, fontSize: 13, padding: '10px 0',
                                            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                                        }}
                                    >♻️ Upload Media Background</button>
                                </div>
                            )}
                        </div>
                        <div style={panelStyle}>
                            <div style={labelStyle}>🎨 Template</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                                {REEL_STYLES.map(s => (
                                    <button key={s.id} onClick={() => setStyle(s)} style={{
                                        padding: '7px 6px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, textAlign: 'center',
                                        border: style.id === s.id ? '2px solid #ff0055' : '1px solid #e2e8f0',
                                        background: style.id === s.id ? 'rgba(255,0,85,0.1)' : '#ffffff',
                                        color: '#1e293b',
                                    }}>{s.name}</button>
                                ))}
                            </div>
                        </div>
                        <div style={panelStyle}>
                            <div style={labelStyle}>🔤 Font Family</div>
                            <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)} style={{ ...inputStyle, fontFamily: selectedFont !== 'default' ? selectedFont : 'inherit' }}>
                                {FONTS.map(f => <option key={f.id} value={f.id} style={{ fontFamily: f.id !== 'default' ? f.id : 'inherit', color: '#111' }}>{f.name}</option>)}
                            </select>
                            <div style={labelStyle}>✏️ Brand Handle</div>
                            <input value={brandHandle} onChange={e => setBrandHandle(e.target.value)} placeholder="@yourhandle" style={inputStyle} />
                            <div style={labelStyle}>🎨 Accent Color</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="color" value={accentOverride || style.accent} onChange={e => setAccentOverride(e.target.value)}
                                    style={{ width: 40, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 2 }} />
                                {accentOverride && <button onClick={() => setAccentOverride('')} style={{ ...btnSec, fontSize: 11 }}>Reset</button>}
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {[['showBgImage', setShowBgImage, showBgImage, '🖼 BG Image'],
                                  ['kenBurns', setKenBurns, kenBurns, '🌊 Ken Burns'],
                                  ['captionBurnMode', setCaptionBurnMode, captionBurnMode, '📝 Caption'],
                                  ['isBold', setIsBold, isBold, '🅱️ Bold Text']].map(([key, setter, val, label]) => (
                                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                                        <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)} style={{ accentColor: '#ff0055' }} />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        {scenes && (
                            <button onClick={() => navigator.clipboard.writeText(
                                `#${(topic || 'content').replace(/\s+/g, '')} #viral #reels #contentcreator #${style.name.replace(/\s+/g, '').toLowerCase()} #shorts #trending #growthhack #socialmedia #marketing`
                            )} style={btnPrimary}>📋 Copy Hashtags</button>
                        )}
                    </div>
                )}

                {/* ALGO TAB */}
                {activeTab === 'algo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={panelStyle}>
                            <div style={labelStyle}>📈 Algorithm Signals</div>
                            {ALGORITHM_SIGNALS.map(sig => (
                                <div key={sig.id} style={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{sig.icon} {sig.label}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{sig.tip}</div>
                                </div>
                            ))}
                        </div>
                        <div style={panelStyle}>
                            <div style={labelStyle}>⏰ Best Posting Times</div>
                            {POSTING_TIMES.map(pt => (
                                <div key={pt.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                                    <span style={{ fontWeight: 700, width: 36, color: '#1e293b' }}>{pt.day}</span>
                                    <span style={{ color: '#64748b', flex: 1 }}>{pt.times[0]}</span>
                                    <span style={{ background: pt.score >= 90 ? '#22c55e' : pt.score >= 80 ? '#f59e0b' : '#6b7280', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{pt.score}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SCENES EDIT TAB */}
                {activeTab === 'scenes' && (
                    <div style={panelStyle}>
                        {!scenes ? (
                            <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>Generate a reel first to edit scenes</div>
                        ) : scenes.map((scene, i) => (
                            <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 10, border: i === currentScene ? '1px solid #ff0055' : '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontWeight: 700, fontSize: 12, color: i === currentScene ? '#ff0055' : '#555' }}>SCENE {i + 1}</span>
                                    <button onClick={() => setCurrentScene(i)} style={{ ...btnSec, fontSize: 11, padding: '3px 8px' }}>Preview</button>
                                </div>
                                <input value={scene.main || ''} onChange={e => { const u = [...scenes]; u[i] = { ...u[i], main: e.target.value }; setScenes(u); }}
                                    style={{ ...inputStyle, fontSize: 12, marginBottom: 4 }} placeholder="Main text" />
                                <input value={scene.sub || ''} onChange={e => { const u = [...scenes]; u[i] = { ...u[i], sub: e.target.value }; setScenes(u); }}
                                    style={{ ...inputStyle, fontSize: 12, marginBottom: 4 }} placeholder="Sub text" />
                                <input value={scene.cta || ''} onChange={e => { const u = [...scenes]; u[i] = { ...u[i], cta: e.target.value }; setScenes(u); }}
                                    style={{ ...inputStyle, fontSize: 12 }} placeholder="CTA text" />
                            </div>
                        ))}
                    </div>
                )}

                {/* PUBLISH TAB */}
                {activeTab === 'publish' && (
                    <div style={panelStyle}>
                        {!scenes ? (
                            <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>Generate a reel first to publish</div>
                        ) : (
                            <>
                                <div style={labelStyle}>1. Platform</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    {['instagram', 'youtube', 'linkedin', 'x'].map(p => (
                                        <button key={p} onClick={() => { setPlatform(p); setCaption(''); }} style={{
                                            ...btnSec, textTransform: 'capitalize', fontSize: 11,
                                            border: platform === p ? '1px solid #7c3aed' : '1px solid #e2e8f0',
                                            background: platform === p ? 'rgba(124, 58, 237, 0.1)' : '#f8f9fa',
                                            color: platform === p ? '#7c3aed' : '#1e293b'
                                        }}>{p === 'x' ? 'X (Twitter)' : p}</button>
                                    ))}
                                </div>

                                <div style={{ ...labelStyle, marginTop: 8 }}>2. Caption & Hashtags</div>
                                <button onClick={generateCaption} disabled={captionLoading} style={{ ...btnSec, background: captionLoading ? '#f1f5f9' : '#fff', color: '#7c3aed', borderColor: '#7c3aed' }}>
                                    {captionLoading ? '✨ Drafting...' : '✨ Draft AI Caption'}
                                </button>
                                {caption && (
                                    <textarea value={caption} onChange={e => setCaption(e.target.value)} style={{ ...inputStyle, fontSize: 12, minHeight: 120, resize: 'vertical' }} />
                                )}

                                <div style={{ ...labelStyle, marginTop: 8 }}>3. Export Video</div>
                                <button onClick={exportFullReel} disabled={isExporting} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: 13, padding: '10px 0' }}>
                                    {isExporting ? `🎞️ ${exportProgress}` : '🎬 Export Full Video (.mp4)'}
                                </button>

                                <div style={{ ...labelStyle, marginTop: 8 }}>4. Schedule to Platform</div>
                                <button onClick={scheduleReel} disabled={!caption || isScheduling || isExporting} style={{
                                    ...btnPrimary, background: caption ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#cbd5e1', fontSize: 13, padding: '10px 0', opacity: caption ? 1 : 0.5
                                }}>
                                    {scheduleSuccess ? '✅ Scheduled Successfully!' : isScheduling ? '⏳ Scheduling...' : `🗓️ Schedule on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── CENTER: CANVAS PREVIEW ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                {isBold && <style>{`.force-bold * { font-weight: 900 !important; }`}</style>}
                {uploadedMediaType === 'video' && showBgImage && <style>{`.video-bg-active > div { background: transparent !important; }`}</style>}
                <div className={`${isBold ? 'force-bold' : ''} ${uploadedMediaType === 'video' && showBgImage ? 'video-bg-active' : ''}`} style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)', maxWidth: aspectRatio.w, width: '100%', position: 'relative' }}>
                    {uploadedMediaType === 'video' && showBgImage && uploadedPhoto && (
                        <video id="uploaded-video-bg" src={uploadedPhoto} autoPlay loop muted playsInline crossOrigin="anonymous" data-html2canvas-ignore="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
                        {scenes ? (
                            isPhotoClone ? (
                                <PhotoCloneScene
                                    scene={scenes[currentScene]} index={currentScene} total={scenes.length}
                                    style={activeStyle} w={aspectRatio.w} h={aspectRatio.h}
                                    uploadedPhoto={uploadedPhoto} brandHandle={brandHandle}
                                />
                            ) : (
                                <ReelScene
                                    scene={scenes[currentScene]} index={currentScene} total={scenes.length}
                                    style={activeStyle} w={aspectRatio.w} h={aspectRatio.h}
                                    showBgImage={showBgImage} brandHandle={brandHandle} kenBurns={kenBurns} captionBurnMode={captionBurnMode}
                                    uploadedPhoto={uploadedPhoto}
                                />
                            )
                        ) : (
                            <div style={{ width: aspectRatio.w, height: aspectRatio.h, background: 'linear-gradient(135deg, #0d0d0d, #1a1a1a)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 48 }}>
                                <div>🎬</div>
                                <div style={{ fontSize: 14, marginTop: 12, color: '#444' }}>{loading ? 'Generating scenes...' : 'Enter a topic & hit Generate'}</div>
                            </div>
                        )}
                    </div>
                </div>

                {scenes && (
                    <>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button onClick={() => setCurrentScene(Math.max(0, currentScene - 1))} disabled={currentScene === 0}
                                style={{ ...btnSec, opacity: currentScene === 0 ? 0.3 : 1, fontSize: 18, padding: '6px 14px' }}>‹</button>
                            {scenes.map((_, i) => (
                                <button key={i} onClick={() => setCurrentScene(i)} style={{
                                    width: i === currentScene ? 28 : 10, height: 10, borderRadius: 5, border: 'none', cursor: 'pointer',
                                    background: i === currentScene ? '#ff0055' : '#ccc', transition: 'all 0.2s', padding: 0,
                                }} />
                            ))}
                            <button onClick={() => setCurrentScene(Math.min(scenes.length - 1, currentScene + 1))} disabled={currentScene === scenes.length - 1}
                                style={{ ...btnSec, opacity: currentScene === scenes.length - 1 ? 0.3 : 1, fontSize: 18, padding: '6px 14px' }}>›</button>
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                            Scene {currentScene + 1} of {scenes.length} — <span style={{ color: '#0f172a', fontWeight: 600 }}>{scenes[currentScene]?.tag || 'Scene'}</span>
                        </div>
                        <button onClick={downloadReels} disabled={isDownloading || isExporting} style={{ ...btnPrimary, width: 'auto', padding: '11px 22px', marginTop: 10, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            {isDownloading ? '⏳ Compiling...' : '📥 Download Scenes (ZIP)'}
                        </button>
                        <button onClick={exportFullReel} disabled={isExporting || isDownloading} style={{ ...btnPrimary, width: 'auto', padding: '11px 22px', marginTop: 4, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                            {isExporting ? `🎞️ ${exportProgress}` : '🎬 Export Full Reel (Video)'}
                        </button>
                    </>
                )}
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
                <div style={panelStyle}>
                    <div style={labelStyle}>🎣 Hook Templates</div>
                    {HOOK_TEMPLATES.map((h, i) => (
                        <button key={i} onClick={() => setTopic(h)} style={{ ...btnSec, fontSize: 12, textAlign: 'left', padding: '8px 10px', whiteSpace: 'normal', lineHeight: 1.4 }}>{h}</button>
                    ))}
                </div>
                <div style={panelStyle}>
                    <div style={labelStyle}>🎵 Trending Audio</div>
                    {TRENDING_AUDIO.map((a, i) => (
                        <div key={i} style={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>🎧 {a.category}</div>
                            {a.examples.map((ex, j) => <div key={j} style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>• {ex}</div>)}
                        </div>
                    ))}
                </div>

                {/* Hidden export container */}
                {scenes && (
                    <div style={{ position: 'fixed', left: -9999, top: -9999, pointerEvents: 'none', zIndex: -1, opacity: 0 }}>
                        {scenes.map((s, i) => (
                            <div key={i} ref={el => exportRefs.current[i] = el} style={{ position: 'relative' }} className={uploadedMediaType === 'video' && showBgImage ? 'video-bg-active' : ''}>
                                {isPhotoClone ? (
                                    <PhotoCloneScene scene={s} index={i} total={scenes.length} style={activeStyle}
                                        w={EXPORT_W} h={EXPORT_H} uploadedPhoto={uploadedPhoto} brandHandle={brandHandle} />
                                ) : (
                                    <ReelScene scene={s} index={i} total={scenes.length} style={activeStyle}
                                        w={EXPORT_W} h={EXPORT_H} showBgImage={showBgImage} brandHandle={brandHandle} kenBurns={kenBurns}
                                        uploadedPhoto={uploadedPhoto} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

