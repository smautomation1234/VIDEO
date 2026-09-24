"use client";
import React, { useState, useRef, useCallback } from 'react';

// ─── THUMBNAIL STYLES ──────────────────────────────────────────────────────────
const THUMB_STYLES = [
    { id: 'bold-clickbait', label: 'Bold Clickbait', desc: 'Massive Impact text · Diagonal accent' },
    { id: 'face-react', label: 'Face Reaction', desc: 'Split layout · Reaction + text' },
    { id: 'versus', label: 'VS Battle', desc: 'Side-by-side · Comparison style' },
    { id: 'dark-mystery', label: 'Dark Mystery', desc: 'Moody gradient · Suspense vibe' },
    { id: 'list-number', label: 'Listicle', desc: 'Big number · Top N style' },
    { id: 'tutorial', label: 'Tutorial', desc: 'Step badge · Clean modern' },
    { id: 'breaking-news', label: 'Breaking News', desc: 'News ticker · Urgent banner' },
    { id: 'minimal-clean', label: 'Minimal Clean', desc: 'Centered serif · Gradient wash' },
];

// ─── THEMES PER STYLE ──────────────────────────────────────────────────────────
const THEMES = {
    'bold-clickbait': [
        { id: 'bc-red', name: 'YouTube Red', bg: '#0a0a0a', text: '#ffffff', accent: '#ff0000', sub: '#ffcc00', badge: '#ff0000' },
        { id: 'bc-electric', name: 'Electric Blue', bg: '#0a0f1c', text: '#ffffff', accent: '#00d4ff', sub: '#fffa65', badge: '#00d4ff' },
        { id: 'bc-fire', name: 'Fire Orange', bg: '#1a0800', text: '#ffffff', accent: '#ff6600', sub: '#ffe600', badge: '#ff6600' },
        { id: 'bc-neon', name: 'Neon Green', bg: '#050f05', text: '#ffffff', accent: '#39ff14', sub: '#ffffff', badge: '#39ff14' },
    ],
    'face-react': [
        { id: 'fr-shock', name: 'Shock Yellow', bg: '#0a0a0a', text: '#ffffff', accent: '#ffe600', sub: '#ff3333', badge: '#ffe600' },
        { id: 'fr-wow', name: 'Wow Purple', bg: '#0e0520', text: '#ffffff', accent: '#bf5af2', sub: '#ff6b9d', badge: '#bf5af2' },
        { id: 'fr-fire', name: 'Fire', bg: '#120000', text: '#ffffff', accent: '#ff4444', sub: '#ffaa00', badge: '#ff4444' },
    ],
    'versus': [
        { id: 'vs-classic', name: 'Classic Red/Blue', bg: '#0a0a0a', text: '#ffffff', accent: '#ff0044', sub: '#0066ff', badge: '#ffe600' },
        { id: 'vs-gold', name: 'Gold Battle', bg: '#0f0a00', text: '#ffffff', accent: '#ffd700', sub: '#c41e3a', badge: '#ffd700' },
        { id: 'vs-neon', name: 'Neon Clash', bg: '#050505', text: '#ffffff', accent: '#39ff14', sub: '#ff00ff', badge: '#ffffff' },
    ],
    'dark-mystery': [
        { id: 'dm-red', name: 'Blood Red', bg: '#0a0000', text: '#ffffff', accent: '#cc0000', sub: '#ff6666', badge: '#cc0000' },
        { id: 'dm-blue', name: 'Deep Ocean', bg: '#000814', text: '#ffffff', accent: '#0077b6', sub: '#90e0ef', badge: '#0077b6' },
        { id: 'dm-purple', name: 'Void Purple', bg: '#0d001a', text: '#ffffff', accent: '#7b2ff7', sub: '#c77dff', badge: '#7b2ff7' },
    ],
    'list-number': [
        { id: 'ln-red', name: 'Hot Red', bg: '#111111', text: '#ffffff', accent: '#ff0033', sub: '#ffffff', badge: '#ff0033' },
        { id: 'ln-yellow', name: 'Pop Yellow', bg: '#111111', text: '#ffffff', accent: '#ffe600', sub: '#ffffff', badge: '#ffe600' },
        { id: 'ln-cyan', name: 'Cyber Cyan', bg: '#0a1014', text: '#ffffff', accent: '#00f5d4', sub: '#ffffff', badge: '#00f5d4' },
    ],
    'tutorial': [
        { id: 'tu-blue', name: 'Tech Blue', bg: '#f0f5ff', text: '#0f1729', accent: '#2563eb', sub: '#475569', badge: '#2563eb' },
        { id: 'tu-dark', name: 'Dark Mode', bg: '#0f172a', text: '#f8fafc', accent: '#38bdf8', sub: '#94a3b8', badge: '#38bdf8' },
        { id: 'tu-green', name: 'Dev Green', bg: '#0a1a0a', text: '#ffffff', accent: '#22c55e', sub: '#86efac', badge: '#22c55e' },
    ],
    'breaking-news': [
        { id: 'bn-red', name: 'Alert Red', bg: '#1a0000', text: '#ffffff', accent: '#ff0000', sub: '#ffffff', badge: '#ff0000' },
        { id: 'bn-blue', name: 'News Blue', bg: '#000d1a', text: '#ffffff', accent: '#0055ff', sub: '#ffffff', badge: '#0055ff' },
        { id: 'bn-gold', name: 'Gold Alert', bg: '#1a1400', text: '#ffffff', accent: '#ffc800', sub: '#ffffff', badge: '#ffc800' },
    ],
    'minimal-clean': [
        { id: 'mc-dark', name: 'Elegant Dark', bg: '#111111', text: '#ffffff', accent: '#d4af37', sub: '#cccccc', badge: '#d4af37' },
        { id: 'mc-light', name: 'Clean White', bg: '#fafafa', text: '#111111', accent: '#e63946', sub: '#555555', badge: '#e63946' },
        { id: 'mc-gradient', name: 'Sunset', bg: '#1a0a2e', text: '#ffffff', accent: '#ff6b6b', sub: '#ffd93d', badge: '#ff6b6b' },
    ],
};

// ─── THUMBNAIL RENDERERS ───────────────────────────────────────────────────────

function BoldClickbaitThumb({ title, subtitle, t, bgImage, sc = 1 }) {
    return (
        <div style={{ width: 1280 * sc, height: 720 * sc, background: bgImage ? `url(${bgImage}) center/cover no-repeat` : `linear-gradient(135deg, ${t.bg}, ${t.accent}22)`, position: 'relative', overflow: 'hidden', fontFamily: "'Impact', 'Anton', 'Bebas Neue', sans-serif" }}>
            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: bgImage ? 'rgba(0,0,0,0.55)' : 'transparent' }} />
            {/* Diagonal accent stripe */}
            <div style={{ position: 'absolute', top: -100 * sc, right: -60 * sc, width: 400 * sc, height: 900 * sc, background: t.accent, transform: 'rotate(15deg)', opacity: 0.25 }} />
            {/* Bottom gradient */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: `linear-gradient(transparent, ${t.bg}ee)` }} />
            {/* Text */}
            <div style={{ position: 'absolute', bottom: 50 * sc, left: 60 * sc, right: 60 * sc, zIndex: 10 }}>
                <div style={{ fontSize: 90 * sc, color: t.text, lineHeight: 0.95, textTransform: 'uppercase', textShadow: `0 6px 30px rgba(0,0,0,0.9), 0 0 60px ${t.accent}40`, letterSpacing: -2 * sc, maxHeight: 290 * sc, overflow: 'hidden' }}>
                    {title || 'YOUR VIRAL TITLE HERE'}
                </div>
                {subtitle && (
                    <div style={{ marginTop: 20 * sc, display: 'inline-block' }}>
                        <span style={{ fontSize: 36 * sc, fontFamily: "'Arial Black', sans-serif", color: t.bg, background: t.sub, padding: `${6 * sc}px ${20 * sc}px`, transform: 'rotate(-1deg)', display: 'inline-block' }}>
                            {subtitle}
                        </span>
                    </div>
                )}
            </div>
            {/* Corner badge */}
            <div style={{ position: 'absolute', top: 30 * sc, right: 30 * sc, background: t.accent, color: t.bg === '#0a0a0a' ? '#fff' : t.bg, padding: `${10 * sc}px ${24 * sc}px`, borderRadius: 8 * sc, fontSize: 24 * sc, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", boxShadow: `0 4px 20px ${t.accent}80`, zIndex: 10 }}>
                🔥 MUST WATCH
            </div>
        </div>
    );
}

function FaceReactThumb({ title, subtitle, t, bgImage, sc = 1 }) {
    return (
        <div style={{ width: 1280 * sc, height: 720 * sc, background: bgImage ? `url(${bgImage}) center/cover no-repeat` : t.bg, position: 'relative', overflow: 'hidden', fontFamily: "'Impact', 'Anton', sans-serif" }}>
            <div style={{ position: 'absolute', inset: 0, background: bgImage ? 'rgba(0,0,0,0.5)' : 'transparent' }} />
            {/* Split layout — left text, right circle for face */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `0 ${60 * sc}px`, zIndex: 10 }}>
                <div style={{ fontSize: 80 * sc, color: t.text, lineHeight: 0.95, textTransform: 'uppercase', textShadow: `0 4px 20px rgba(0,0,0,0.8), 0 0 40px ${t.accent}30`, letterSpacing: -1 * sc }}>
                    {title || 'YOUR TITLE HERE'}
                </div>
                {subtitle && (
                    <div style={{ marginTop: 24 * sc, fontSize: 34 * sc, color: t.sub, fontFamily: "'Arial Black', sans-serif", textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                        {subtitle}
                    </div>
                )}
            </div>
            {/* Reaction emoji / placeholder circle */}
            <div style={{ position: 'absolute', right: 40 * sc, top: '50%', transform: 'translateY(-50%)', width: 340 * sc, height: 340 * sc, borderRadius: '50%', background: `linear-gradient(135deg, ${t.accent}30, ${t.accent}60)`, border: `6px solid ${t.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 140 * sc, zIndex: 10, boxShadow: `0 0 60px ${t.accent}40` }}>
                😱
            </div>
            {/* Bottom stripe */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8 * sc, background: `linear-gradient(90deg, ${t.accent}, ${t.sub})` }} />
        </div>
    );
}

function VersusThumb({ title, subtitle, t, bgImage, sc = 1 }) {
    return (
        <div style={{ width: 1280 * sc, height: 720 * sc, background: t.bg, position: 'relative', overflow: 'hidden', fontFamily: "'Impact', 'Anton', sans-serif" }}>
            {bgImage && <div style={{ position: 'absolute', inset: 0, background: `url(${bgImage}) center/cover`, opacity: 0.2 }} />}
            {/* Left side */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '45%', background: `linear-gradient(135deg, ${t.accent}30, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                <div style={{ fontSize: 100 * sc, textAlign: 'center', color: t.text, textTransform: 'uppercase', lineHeight: 0.95, textShadow: `0 4px 20px ${t.accent}60`, padding: `0 ${30 * sc}px` }}>
                    {(title || 'OPTION A').split(' vs ')[0] || title || 'OPTION A'}
                </div>
            </div>
            {/* Right side */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', background: `linear-gradient(225deg, ${t.sub}30, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                <div style={{ fontSize: 100 * sc, textAlign: 'center', color: t.text, textTransform: 'uppercase', lineHeight: 0.95, textShadow: `0 4px 20px ${t.sub}60`, padding: `0 ${30 * sc}px` }}>
                    {(title || 'OPTION B').split(' vs ')[1] || subtitle || 'OPTION B'}
                </div>
            </div>
            {/* Center VS badge */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 20, width: 160 * sc, height: 160 * sc, borderRadius: '50%', background: t.badge, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 80px ${t.badge}80, 0 0 160px ${t.badge}40` }}>
                <span style={{ fontSize: 72 * sc, fontWeight: 900, color: t.bg, fontFamily: "'Impact', sans-serif" }}>VS</span>
            </div>
            {/* Lightning bolts */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 4 * sc, background: `linear-gradient(${t.badge}, transparent, ${t.badge})`, transform: 'translateX(-50%)', zIndex: 10, opacity: 0.5 }} />
            {subtitle && !title?.includes(' vs ') && (
                <div style={{ position: 'absolute', bottom: 24 * sc, left: 0, right: 0, textAlign: 'center', fontSize: 30 * sc, color: t.badge, fontFamily: "'Arial Black', sans-serif", zIndex: 15, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                    {subtitle}
                </div>
            )}
        </div>
    );
}

function DarkMysteryThumb({ title, subtitle, t, bgImage, sc = 1 }) {
    return (
        <div style={{ width: 1280 * sc, height: 720 * sc, background: bgImage ? `url(${bgImage}) center/cover` : `radial-gradient(ellipse at center, ${t.accent}15 0%, ${t.bg} 70%)`, position: 'relative', overflow: 'hidden', fontFamily: "'Georgia', 'Playfair Display', serif" }}>
            {bgImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />}
            {/* Vignette */}
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, transparent 30%, ${t.bg} 100%)` }} />
            {/* Subtle grain texture overlay */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.04, background: 'repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%) 0 0/4px 4px' }} />
            {/* Center content */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `0 ${80 * sc}px`, zIndex: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 18 * sc, fontWeight: 600, letterSpacing: 8 * sc, textTransform: 'uppercase', color: t.accent, marginBottom: 30 * sc, fontFamily: "'Arial', sans-serif" }}>
                    ▬▬▬ THE TRUTH ▬▬▬
                </div>
                <div style={{ fontSize: 78 * sc, color: t.text, lineHeight: 1.05, textShadow: `0 0 80px ${t.accent}50, 0 4px 20px rgba(0,0,0,0.8)`, letterSpacing: -1 * sc, fontWeight: 700 }}>
                    {title || 'WHAT THEY DON\'T TELL YOU'}
                </div>
                {subtitle && (
                    <div style={{ marginTop: 30 * sc, fontSize: 30 * sc, color: t.sub, fontStyle: 'italic', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        {subtitle}
                    </div>
                )}
            </div>
            {/* Top/bottom cinematic bars */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 30 * sc, background: t.bg }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30 * sc, background: t.bg }} />
        </div>
    );
}

function ListNumberThumb({ title, subtitle, t, bgImage, sc = 1 }) {
    const numberMatch = title?.match(/(\d+)/);
    const number = numberMatch ? numberMatch[1] : '10';
    const textWithoutNumber = title?.replace(/^\d+\s*/, '') || 'THINGS YOU MUST KNOW';
    return (
        <div style={{ width: 1280 * sc, height: 720 * sc, background: bgImage ? `url(${bgImage}) center/cover` : `linear-gradient(135deg, ${t.bg}, ${t.accent}15)`, position: 'relative', overflow: 'hidden', fontFamily: "'Impact', 'Anton', sans-serif" }}>
            {bgImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />}
            {/* Giant number behind */}
            <div style={{ position: 'absolute', left: -20 * sc, top: '50%', transform: 'translateY(-50%)', fontSize: 500 * sc, fontWeight: 900, color: t.accent, opacity: 0.12, lineHeight: 0.8, zIndex: 1 }}>
                {number}
            </div>
            {/* Main content */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', zIndex: 10, padding: `0 ${70 * sc}px` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 50 * sc }}>
                    {/* Number circle */}
                    <div style={{ width: 200 * sc, height: 200 * sc, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 60px ${t.accent}60, inset 0 -8px 20px rgba(0,0,0,0.3)` }}>
                        <span style={{ fontSize: 120 * sc, fontWeight: 900, color: t.bg === '#111111' ? '#fff' : '#000' }}>{number}</span>
                    </div>
                    {/* Text */}
                    <div>
                        <div style={{ fontSize: 80 * sc, color: t.text, lineHeight: 0.95, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.7)', letterSpacing: -1 * sc }}>
                            {textWithoutNumber}
                        </div>
                        {subtitle && (
                            <div style={{ marginTop: 20 * sc, fontSize: 32 * sc, color: t.sub, fontFamily: "'Arial Black', sans-serif" }}>
                                {subtitle}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TutorialThumb({ title, subtitle, t, bgImage, sc = 1 }) {
    return (
        <div style={{ width: 1280 * sc, height: 720 * sc, background: bgImage ? `url(${bgImage}) center/cover` : t.bg, position: 'relative', overflow: 'hidden', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            {bgImage && <div style={{ position: 'absolute', inset: 0, background: t.bg === '#f0f5ff' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)' }} />}
            {/* Accent left bar */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10 * sc, background: t.accent }} />
            {/* Grid pattern */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.03, background: `linear-gradient(${t.text} 1px, transparent 1px), linear-gradient(90deg, ${t.text} 1px, transparent 1px)`, backgroundSize: `${40 * sc}px ${40 * sc}px` }} />
            {/* Content */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: `0 ${80 * sc}px`, zIndex: 10 }}>
                <div style={{ flex: 1 }}>
                    {/* Step badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 * sc, marginBottom: 24 * sc, background: t.accent, color: '#fff', padding: `${8 * sc}px ${20 * sc}px`, borderRadius: 50, fontSize: 20 * sc, fontWeight: 800 }}>
                        📚 FULL TUTORIAL
                    </div>
                    <div style={{ fontSize: 68 * sc, fontWeight: 900, color: t.text, lineHeight: 1.1, letterSpacing: -2 * sc, maxWidth: 900 * sc }}>
                        {title || 'How to Build This from Scratch'}
                    </div>
                    {subtitle && (
                        <div style={{ marginTop: 24 * sc, fontSize: 28 * sc, color: t.sub, fontWeight: 500, maxWidth: 700 * sc }}>
                            {subtitle}
                        </div>
                    )}
                </div>
                {/* Right side icon block */}
                <div style={{ width: 200 * sc, height: 200 * sc, borderRadius: 24 * sc, background: `${t.accent}18`, border: `3px solid ${t.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 * sc, flexShrink: 0 }}>
                    🎯
                </div>
            </div>
        </div>
    );
}

function BreakingNewsThumb({ title, subtitle, t, bgImage, sc = 1 }) {
    return (
        <div style={{ width: 1280 * sc, height: 720 * sc, background: bgImage ? `url(${bgImage}) center/cover` : `linear-gradient(180deg, ${t.bg}, #000)`, position: 'relative', overflow: 'hidden', fontFamily: "'Impact', 'Arial Black', sans-serif" }}>
            {bgImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />}
            {/* Top ticker bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 50 * sc, background: t.accent, display: 'flex', alignItems: 'center', padding: `0 ${30 * sc}px`, zIndex: 20 }}>
                <span style={{ fontSize: 22 * sc, fontWeight: 900, color: '#fff', letterSpacing: 2 * sc, textTransform: 'uppercase' }}>
                    ⚡ BREAKING · BREAKING · BREAKING · BREAKING · BREAKING · BREAKING · BREAKING ⚡
                </span>
            </div>
            {/* Main content area */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 50 * sc, display: 'flex', alignItems: 'center', padding: `0 ${80 * sc}px`, zIndex: 10 }}>
                <div>
                    <div style={{ display: 'inline-block', background: t.accent, color: '#fff', padding: `${8 * sc}px ${20 * sc}px`, fontSize: 20 * sc, fontWeight: 800, marginBottom: 20 * sc, letterSpacing: 2 * sc }}>
                        🔴 LIVE
                    </div>
                    <div style={{ fontSize: 80 * sc, color: t.text, lineHeight: 0.95, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.8)', maxWidth: 1000 * sc }}>
                        {title || 'BREAKING NEWS HEADLINE'}
                    </div>
                    {subtitle && (
                        <div style={{ marginTop: 24 * sc, fontSize: 32 * sc, color: t.sub, fontFamily: "'Arial', sans-serif", fontWeight: 400 }}>
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>
            {/* Bottom news ticker */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 * sc, background: '#111', borderTop: `3px solid ${t.accent}`, display: 'flex', alignItems: 'center', padding: `0 ${30 * sc}px`, zIndex: 20 }}>
                <div style={{ display: 'flex', gap: 30 * sc }}>
                    <span style={{ background: t.accent, color: '#fff', padding: `${4 * sc}px ${14 * sc}px`, fontSize: 16 * sc, fontWeight: 700 }}>ALERT</span>
                    <span style={{ fontSize: 18 * sc, color: '#ddd', fontFamily: 'Arial, sans-serif' }}>This changes EVERYTHING • You need to see this NOW</span>
                </div>
            </div>
        </div>
    );
}

function MinimalCleanThumb({ title, subtitle, t, bgImage, sc = 1 }) {
    return (
        <div style={{ width: 1280 * sc, height: 720 * sc, background: bgImage ? `url(${bgImage}) center/cover` : `linear-gradient(135deg, ${t.bg}, ${t.accent}12)`, position: 'relative', overflow: 'hidden', fontFamily: "'Georgia', 'Playfair Display', serif" }}>
            {bgImage && <div style={{ position: 'absolute', inset: 0, background: t.bg === '#fafafa' ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.6)' }} />}
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -100 * sc, right: -100 * sc, width: 400 * sc, height: 400 * sc, borderRadius: '50%', border: `2px solid ${t.accent}20` }} />
            <div style={{ position: 'absolute', bottom: -80 * sc, left: -80 * sc, width: 300 * sc, height: 300 * sc, borderRadius: '50%', border: `2px solid ${t.accent}15` }} />
            {/* Center content */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `0 ${100 * sc}px`, zIndex: 10, textAlign: 'center' }}>
                <div style={{ width: 60 * sc, height: 3 * sc, background: t.accent, marginBottom: 30 * sc }} />
                <div style={{ fontSize: 72 * sc, color: t.text, lineHeight: 1.1, fontWeight: 700, letterSpacing: -1 * sc }}>
                    {title || 'Your Elegant Title Here'}
                </div>
                {subtitle && (
                    <div style={{ marginTop: 28 * sc, fontSize: 28 * sc, color: t.sub, fontFamily: "'Inter', sans-serif", fontWeight: 400, fontStyle: 'italic' }}>
                        {subtitle}
                    </div>
                )}
                <div style={{ width: 60 * sc, height: 3 * sc, background: t.accent, marginTop: 30 * sc }} />
            </div>
        </div>
    );
}

// ─── RENDERER DISPATCHER ───────────────────────────────────────────────────────
function ThumbnailRenderer({ style, title, subtitle, theme, bgImage, sc = 1 }) {
    const props = { title, subtitle, t: theme, bgImage, sc };
    switch (style) {
        case 'bold-clickbait': return <BoldClickbaitThumb {...props} />;
        case 'face-react': return <FaceReactThumb {...props} />;
        case 'versus': return <VersusThumb {...props} />;
        case 'dark-mystery': return <DarkMysteryThumb {...props} />;
        case 'list-number': return <ListNumberThumb {...props} />;
        case 'tutorial': return <TutorialThumb {...props} />;
        case 'breaking-news': return <BreakingNewsThumb {...props} />;
        case 'minimal-clean': return <MinimalCleanThumb {...props} />;
        default: return null;
    }
}

// ─── ELEMENT LIBRARY ───────────────────────────────────────────────────────────
const ELEMENT_CATEGORIES = [
    { id: 'stickers', label: 'Stickers' },
    { id: 'shapes', label: 'Shapes' },
    { id: 'arrows', label: 'Arrows' },
    { id: 'badges', label: 'Badges' },
    { id: 'photos', label: 'Photos' },
];

const ELEMENT_ITEMS = {
    stickers: [
        { id: 'e-fire', content: '🔥', type: 'emoji', defaultSize: 80 },
        { id: 'e-shock', content: '😱', type: 'emoji', defaultSize: 80 },
        { id: 'e-money', content: '💰', type: 'emoji', defaultSize: 80 },
        { id: 'e-rocket', content: '🚀', type: 'emoji', defaultSize: 80 },
        { id: 'e-100', content: '💯', type: 'emoji', defaultSize: 80 },
        { id: 'e-brain', content: '🧠', type: 'emoji', defaultSize: 80 },
        { id: 'e-crown', content: '👑', type: 'emoji', defaultSize: 80 },
        { id: 'e-eyes', content: '👀', type: 'emoji', defaultSize: 80 },
        { id: 'e-skull', content: '💀', type: 'emoji', defaultSize: 80 },
        { id: 'e-star', content: '⭐', type: 'emoji', defaultSize: 80 },
        { id: 'e-bomb', content: '💣', type: 'emoji', defaultSize: 80 },
        { id: 'e-warn', content: '⚠️', type: 'emoji', defaultSize: 80 },
        { id: 'e-check', content: '✅', type: 'emoji', defaultSize: 70 },
        { id: 'e-x', content: '❌', type: 'emoji', defaultSize: 70 },
        { id: 'e-point', content: '👉', type: 'emoji', defaultSize: 80 },
        { id: 'e-clap', content: '👏', type: 'emoji', defaultSize: 80 },
    ],
    shapes: [
        { id: 's-circle-red', type: 'shape', shape: 'circle', color: '#ff0000', defaultSize: 100 },
        { id: 's-circle-yellow', type: 'shape', shape: 'circle', color: '#ffe600', defaultSize: 100 },
        { id: 's-circle-blue', type: 'shape', shape: 'circle', color: '#0088ff', defaultSize: 100 },
        { id: 's-circle-green', type: 'shape', shape: 'circle', color: '#00cc44', defaultSize: 100 },
        { id: 's-square-red', type: 'shape', shape: 'square', color: '#ff0000', defaultSize: 90 },
        { id: 's-square-yellow', type: 'shape', shape: 'square', color: '#ffe600', defaultSize: 90 },
        { id: 's-star-gold', type: 'shape', shape: 'star', color: '#ffd700', defaultSize: 100 },
        { id: 's-star-red', type: 'shape', shape: 'star', color: '#ff0033', defaultSize: 100 },
    ],
    arrows: [
        { id: 'a-right', type: 'arrow', direction: 'right', color: '#ff0000', defaultSize: 90 },
        { id: 'a-left', type: 'arrow', direction: 'left', color: '#ff0000', defaultSize: 90 },
        { id: 'a-down', type: 'arrow', direction: 'down', color: '#ffe600', defaultSize: 90 },
        { id: 'a-up', type: 'arrow', direction: 'up', color: '#00ff88', defaultSize: 90 },
        { id: 'a-curve', type: 'arrow', direction: 'curve', color: '#ff4444', defaultSize: 90 },
        { id: 'a-right-w', type: 'arrow', direction: 'right', color: '#ffffff', defaultSize: 90 },
    ],
    badges: [
        { id: 'b-new', type: 'badge', text: 'NEW', bg: '#ff0000', color: '#fff', defaultSize: 80 },
        { id: 'b-free', type: 'badge', text: 'FREE', bg: '#00cc44', color: '#fff', defaultSize: 80 },
        { id: 'b-hot', type: 'badge', text: '🔥 HOT', bg: '#ff6600', color: '#fff', defaultSize: 90 },
        { id: 'b-no1', type: 'badge', text: '#1', bg: '#ffd700', color: '#000', defaultSize: 80 },
        { id: 'b-live', type: 'badge', text: '🔴 LIVE', bg: '#cc0000', color: '#fff', defaultSize: 90 },
        { id: 'b-sub', type: 'badge', text: 'SUBSCRIBE', bg: '#ff0000', color: '#fff', defaultSize: 120 },
        { id: 'b-wow', type: 'badge', text: 'WOW', bg: '#bf5af2', color: '#fff', defaultSize: 80 },
        { id: 'b-secret', type: 'badge', text: '🤫 SECRET', bg: '#111', color: '#fff', defaultSize: 100 },
    ],
    photos: [], // filled dynamically via upload
};

function renderElementContent(el) {
    const sz = el.size || el.defaultSize || 80;
    if (el.type === 'emoji') return <span style={{ fontSize: sz, lineHeight: 1, userSelect: 'none' }}>{el.content}</span>;
    if (el.type === 'shape') {
        if (el.shape === 'circle') return <div style={{ width: sz, height: sz, borderRadius: '50%', background: el.color, boxShadow: `0 0 20px ${el.color}60` }} />;
        if (el.shape === 'square') return <div style={{ width: sz, height: sz, borderRadius: 8, background: el.color, boxShadow: `0 0 20px ${el.color}60` }} />;
        if (el.shape === 'star') return <span style={{ fontSize: sz, color: el.color, filter: `drop-shadow(0 0 10px ${el.color}80)` }}>★</span>;
    }
    if (el.type === 'arrow') {
        const arrows = { right: '→', left: '←', down: '↓', up: '↑', curve: '↗' };
        return <span style={{ fontSize: sz, color: el.color, fontWeight: 900, filter: `drop-shadow(0 2px 8px ${el.color}80)`, lineHeight: 1 }}>{arrows[el.direction] || '→'}</span>;
    }
    if (el.type === 'badge') return (
        <div style={{ background: el.bg, color: el.color, padding: `${sz * 0.12}px ${sz * 0.3}px`, borderRadius: 8, fontSize: sz * 0.35, fontWeight: 900, fontFamily: "'Impact', 'Arial Black', sans-serif", whiteSpace: 'nowrap', boxShadow: `0 4px 16px ${el.bg}80`, letterSpacing: 1 }}>
            {el.text}
        </div>
    );
    if (el.type === 'image') return <img src={el.src} style={{ width: sz, height: sz, objectFit: 'contain', borderRadius: 8 }} />;
    return null;
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ThumbnailMaker() {
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [topic, setTopic] = useState('');
    const [style, setStyle] = useState('bold-clickbait');
    const [theme, setTheme] = useState(THEMES['bold-clickbait'][0]);
    const [bgImage, setBgImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);
    const [generatedOptions, setGeneratedOptions] = useState(null);

    const exportRef = useRef(null);
    const previewContainerRef = useRef(null);
    const apiKey = '';

    // Elements state
    const [placedElements, setPlacedElements] = useState([]);
    const [elementCategory, setElementCategory] = useState('stickers');
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [draggingId, setDraggingId] = useState(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    function addElement(item) {
        const newEl = {
            ...item,
            instanceId: Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            x: 40 + Math.random() * 30, // % position
            y: 30 + Math.random() * 30,
            size: item.defaultSize || 80,
        };
        setPlacedElements(prev => [...prev, newEl]);
        setSelectedElementId(newEl.instanceId);
    }

    function removeElement(instanceId) {
        setPlacedElements(prev => prev.filter(e => e.instanceId !== instanceId));
        if (selectedElementId === instanceId) setSelectedElementId(null);
    }

    function resizeElement(instanceId, delta) {
        setPlacedElements(prev => prev.map(e =>
            e.instanceId === instanceId ? { ...e, size: Math.max(20, Math.min(300, (e.size || 80) + delta)) } : e
        ));
    }

    function handleElementPhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            addElement({ id: 'photo-' + Date.now(), type: 'image', src: ev.target.result, defaultSize: 150 });
        };
        reader.readAsDataURL(file);
    }

    // Drag handling for placed elements on preview
    const handleDragStart = useCallback((e, instanceId) => {
        e.preventDefault();
        e.stopPropagation();
        const container = previewContainerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const el = placedElements.find(el => el.instanceId === instanceId);
        if (!el) return;
        const elXPx = (el.x / 100) * rect.width;
        const elYPx = (el.y / 100) * rect.height;
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        dragOffset.current = { x: clientX - rect.left - elXPx, y: clientY - rect.top - elYPx };
        setDraggingId(instanceId);
        setSelectedElementId(instanceId);

        const handleMove = (ev) => {
            const cx = ev.type.includes('touch') ? ev.touches[0].clientX : ev.clientX;
            const cy = ev.type.includes('touch') ? ev.touches[0].clientY : ev.clientY;
            const newX = ((cx - rect.left - dragOffset.current.x) / rect.width) * 100;
            const newY = ((cy - rect.top - dragOffset.current.y) / rect.height) * 100;
            setPlacedElements(prev => prev.map(el =>
                el.instanceId === instanceId ? { ...el, x: Math.max(-10, Math.min(110, newX)), y: Math.max(-10, Math.min(110, newY)) } : el
            ));
        };
        const handleEnd = () => {
            setDraggingId(null);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }, [placedElements]);

    function switchStyle(s) {
        setStyle(s);
        setTheme(THEMES[s][0]);
    }

    function handleBgUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setBgImage(ev.target.result);
        reader.readAsDataURL(file);
    }

    async function generateTitles() {
        if (!topic.trim()) return;
        setLoading(true);
        setError('');
        setGeneratedOptions(null);
        try {
            const styleDesc = THUMB_STYLES.find(s => s.id === style)?.label || style;
            const res = await fetch('/api/openai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{
                        role: 'user',
                        content: `Generate 4 ultra-viral YouTube thumbnail text options for a video about: "${topic}"
                        
The thumbnail style is: "${styleDesc}"

Return ONLY a raw JSON object:
{
  "options": [
    { "title": "MASSIVE BOLD TITLE (max 6-8 words, ALL CAPS, ultra clickbait)", "subtitle": "Short punchy subtitle (max 5-6 words)" },
    { "title": "...", "subtitle": "..." },
    { "title": "...", "subtitle": "..." },
    { "title": "...", "subtitle": "..." }
  ]
}

CRITICAL RULES:
- Title MUST be ALL CAPS, short, punchy, and designed for maximum CTR
- Use curiosity gaps, shock value, and emotional triggers
- Include numbers when possible (e.g., "10X", "$1M", "99%")
- Subtitle should complement the title with additional context
- Think like MrBeast, Ali Abdaal, Marques Brownlee for thumbnail text
- DO NOT wrap in markdown, return raw JSON only`
                    }],
                    max_tokens: 600,
                    temperature: 0.9,
                    response_format: { type: 'json_object' },
                }),
            });
            if (!res.ok) throw new Error('API error');
            const data = await res.json();
            const parsed = JSON.parse(data.choices[0].message.content);
            setGeneratedOptions(parsed.options || []);
            if (parsed.options?.length > 0) {
                setTitle(parsed.options[0].title);
                setSubtitle(parsed.options[0].subtitle);
            }
        } catch (e) {
            setError('Generation failed: ' + (e.message || 'Try again'));
        } finally {
            setLoading(false);
        }
    }

    async function exportPNG() {
        if (!exportRef.current) return;
        setExporting(true);
        try {
            await document.fonts.ready;
            const htmlToImage = await import('html-to-image');
            const dataUrl = await htmlToImage.toPng(exportRef.current, {
                pixelRatio: 2,
                backgroundColor: theme.bg,
                fontEmbedCSS: '',
            });
            const link = document.createElement('a');
            link.download = `thumbnail-${(title || topic || 'untitled').slice(0, 30).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            setError('Export failed: ' + e.message);
        } finally {
            setExporting(false);
        }
    }

    // Preview scale to fit in viewport
    const previewScale = 560 / 1280; // ~0.4375

    return (
        <>
            <style>{`
                .thumb-builder { display: flex; gap: 28px; max-width: 1120px; margin: 0 auto; width: 100%; padding: 20px; box-sizing: border-box; }
                .thumb-left { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; }
                .thumb-right { flex: 1; display: flex; flex-direction: column; gap: 14px; align-items: center; }
                @media (max-width: 900px) {
                    .thumb-builder { flex-direction: column-reverse; padding: 10px; gap: 20px; }
                    .thumb-left { width: 100%; }
                }
                .thumb-option-btn { 
                    text-align: left; padding: 10px 14px; border-radius: 10px; cursor: pointer; 
                    font-family: inherit; border: 2px solid var(--border); background: var(--card);
                    transition: all 0.15s; width: 100%; 
                }
                .thumb-option-btn:hover { border-color: var(--primary); background: var(--primary-muted); }
                .thumb-option-btn.active { border-color: var(--primary); background: var(--primary-muted); }
                @keyframes thumb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>

            <div className="thumb-builder">
                {/* LEFT PANEL */}
                <div className="thumb-left">
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                            Thumbnail Maker
                        </h3>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                            Create click-worthy YouTube thumbnails in seconds
                        </p>
                    </div>

                    {/* Title Input */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                            Thumbnail Title
                        </label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. I QUIT MY $200K JOB"
                            className="input-field"
                            style={{ fontSize: 14, fontWeight: 700 }}
                        />
                    </div>

                    {/* Subtitle Input */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                            Subtitle / Tagline
                        </label>
                        <input
                            value={subtitle}
                            onChange={e => setSubtitle(e.target.value)}
                            placeholder="e.g. Here's what happened..."
                            className="input-field"
                            style={{ fontSize: 13 }}
                        />
                    </div>

                    {/* AI Generate Section */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                            AI Generate from Topic
                        </label>
                        <textarea
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && e.ctrlKey && generateTitles()}
                            placeholder="e.g. How I grew from 0 to 100K subscribers in 90 days"
                            className="input-field"
                            style={{ minHeight: 60, fontSize: 13, resize: 'vertical', marginBottom: 8 }}
                        />
                        <button
                            onClick={generateTitles}
                            disabled={loading || !topic.trim()}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', opacity: loading || !topic.trim() ? 0.6 : 1 }}
                        >
                            {loading ? 'Generating titles…' : 'Generate Title Ideas'}
                        </button>
                    </div>

                    {/* Generated Options */}
                    {generatedOptions && generatedOptions.length > 0 && (
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                                Pick a Title Option
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {generatedOptions.map((opt, i) => (
                                    <button
                                        key={i}
                                        className={`thumb-option-btn ${title === opt.title ? 'active' : ''}`}
                                        onClick={() => { setTitle(opt.title); setSubtitle(opt.subtitle); }}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.3 }}>{opt.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3 }}>{opt.subtitle}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Style Selector */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                            Viral Style
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                            {THUMB_STYLES.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => switchStyle(s.id)}
                                    style={{
                                        padding: '10px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                                        border: `2px solid ${style === s.id ? 'var(--primary)' : 'var(--border)'}`,
                                        background: style === s.id ? 'var(--primary-muted)' : 'var(--card)',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div style={{ fontSize: 12, fontWeight: 800, color: style === s.id ? 'var(--primary)' : 'var(--foreground)' }}>{s.label}</div>
                                    <div style={{ fontSize: 9, color: 'var(--muted-foreground)', marginTop: 2 }}>{s.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Picker */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                            Color Theme
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                            {(THEMES[style] || []).map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t)}
                                    style={{
                                        padding: 8, borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                                        border: `2px solid ${theme.id === t.id ? t.accent : 'var(--border)'}`,
                                        background: theme.id === t.id ? `${t.accent}14` : 'var(--card)',
                                        display: 'flex', alignItems: 'center', gap: 7,
                                    }}
                                >
                                    <div style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: t.bg, border: `3px solid ${t.accent}`, boxShadow: theme.id === t.id ? `0 0 8px ${t.accent}60` : 'none' }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, color: theme.id === t.id ? t.accent : 'var(--muted-foreground)', lineHeight: 1.3, textAlign: 'left' }}>{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Background Image */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span>Background Image</span>
                            {bgImage && <button onClick={() => setBgImage('')} style={{ fontSize: 9, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>Remove</button>}
                        </label>
                        <input type="file" accept="image/*" onChange={handleBgUpload} style={{ fontSize: 11, width: '100%', padding: '6px 0', color: 'var(--muted-foreground)' }} />
                    </div>

                    {/* ── ELEMENTS PANEL ── */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            Add Elements
                        </div>
                        {/* Category tabs */}
                        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                            {ELEMENT_CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setElementCategory(cat.id)} style={{
                                    padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                                    border: `1.5px solid ${elementCategory === cat.id ? 'var(--primary)' : 'var(--border)'}`,
                                    background: elementCategory === cat.id ? 'var(--primary-muted)' : 'transparent',
                                    fontSize: 11, fontWeight: 700, color: elementCategory === cat.id ? 'var(--primary)' : 'var(--muted-foreground)',
                                }}>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        {/* Item grid */}
                        {elementCategory === 'photos' ? (
                            <div>
                                <input type="file" accept="image/*" onChange={handleElementPhotoUpload} style={{ fontSize: 11, width: '100%', padding: '6px 0', color: 'var(--muted-foreground)' }} />
                                <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 4 }}>Upload a photo/cutout to place on thumbnail</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                                {(ELEMENT_ITEMS[elementCategory] || []).map(item => (
                                    <button key={item.id} onClick={() => addElement(item)} style={{
                                        aspectRatio: '1', borderRadius: 8, cursor: 'pointer', border: '1.5px solid var(--border)',
                                        background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: item.type === 'emoji' ? 28 : 20, transition: 'all 0.15s', padding: 4,
                                    }} title={`Add ${item.content || item.text || item.shape || ''}`}>
                                        {item.type === 'emoji' && item.content}
                                        {item.type === 'shape' && item.shape === 'circle' && <div style={{ width: 24, height: 24, borderRadius: '50%', background: item.color }} />}
                                        {item.type === 'shape' && item.shape === 'square' && <div style={{ width: 22, height: 22, borderRadius: 4, background: item.color }} />}
                                        {item.type === 'shape' && item.shape === 'star' && <span style={{ color: item.color }}>★</span>}
                                        {item.type === 'arrow' && <span style={{ color: item.color, fontWeight: 900 }}>{{ right: '→', left: '←', down: '↓', up: '↑', curve: '↗' }[item.direction]}</span>}
                                        {item.type === 'badge' && <span style={{ fontSize: 8, fontWeight: 800, color: item.color, background: item.bg, padding: '2px 5px', borderRadius: 4 }}>{item.text}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Placed Elements List */}
                    {placedElements.length > 0 && (
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Placed ({placedElements.length})</span>
                                <button onClick={() => { setPlacedElements([]); setSelectedElementId(null); }} style={{ fontSize: 9, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>Clear All</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 160, overflowY: 'auto' }}>
                                {placedElements.map(el => (
                                    <div key={el.instanceId} onClick={() => setSelectedElementId(el.instanceId)} style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                                        border: `1.5px solid ${selectedElementId === el.instanceId ? 'var(--primary)' : 'var(--border)'}`,
                                        background: selectedElementId === el.instanceId ? 'var(--primary-muted)' : 'transparent',
                                    }}>
                                        <span style={{ fontSize: 18, flexShrink: 0 }}>{el.content || el.text || el.shape || '📷'}</span>
                                        <span style={{ flex: 1, fontSize: 10, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {el.type} · {el.size}px
                                        </span>
                                        <button onClick={(e) => { e.stopPropagation(); resizeElement(el.instanceId, -15); }} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                        <button onClick={(e) => { e.stopPropagation(); resizeElement(el.instanceId, 15); }} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, width: 22, height: 22, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                        <button onClick={(e) => { e.stopPropagation(); removeElement(el.instanceId); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div style={{ background: 'var(--rose-bg)', border: '1px solid var(--rose)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--rose-ink)', lineHeight: 1.5 }}>{error}</div>}

                    {/* Export */}
                    <button
                        onClick={exportPNG}
                        disabled={exporting}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {exporting ? 'Exporting…' : 'Export as PNG (1280×720)'}
                    </button>
                </div>

                {/* RIGHT PANEL — PREVIEW */}
                <div className="thumb-right">
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, alignSelf: 'flex-start' }}>
                        Live Preview (16:9)
                    </div>
                    <div ref={previewContainerRef} style={{
                        width: 560,
                        height: 315,
                        borderRadius: 12,
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-lg)',
                        position: 'relative',
                        background: theme.bg,
                    }}>
                        <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: 1280, height: 720 }}>
                            <ThumbnailRenderer style={style} title={title} subtitle={subtitle} theme={theme} bgImage={bgImage} sc={1} />
                        </div>
                        {/* Elements overlay */}
                        {placedElements.map(el => (
                            <div
                                key={el.instanceId}
                                onMouseDown={(e) => handleDragStart(e, el.instanceId)}
                                onTouchStart={(e) => handleDragStart(e, el.instanceId)}
                                style={{
                                    position: 'absolute',
                                    left: `${el.x}%`, top: `${el.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    cursor: draggingId === el.instanceId ? 'grabbing' : 'grab',
                                    zIndex: selectedElementId === el.instanceId ? 50 : 30,
                                    outline: selectedElementId === el.instanceId ? '2px solid var(--primary)' : '1px dashed var(--card)',
                                    outlineOffset: 3,
                                    borderRadius: 6,
                                    padding: 2,
                                    transition: draggingId === el.instanceId ? 'none' : 'outline 0.15s',
                                    userSelect: 'none',
                                }}
                            >
                                <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'center center' }}>
                                    {renderElementContent(el)}
                                </div>
                            </div>
                        ))}
                        {placedElements.length > 0 && (
                            <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 9, padding: '3px 10px', borderRadius: 20, zIndex: 60, pointerEvents: 'none' }}>
                                Drag elements to reposition
                            </div>
                        )}
                    </div>

                    {/* Quick tips */}
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
                        padding: 16, width: '100%', maxWidth: 560
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                            Viral Thumbnail Tips
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {[
                                'Keep titles under 8 words',
                                'Use numbers & $ signs',
                                'Contrast = Attention',
                                'Add your face photo as BG',
                                'Curiosity gaps drive clicks',
                                'ALL CAPS for urgency',
                            ].map((tip, i) => (
                                <div key={i} style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{tip}</div>
                            ))}
                        </div>
                    </div>

                    {/* Style gallery — show all 8 styles as mini previews */}
                    <div style={{ width: '100%', maxWidth: 560 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                            Quick Style Preview
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                            {THUMB_STYLES.map(s => {
                                const t = THEMES[s.id][0];
                                const isActive = s.id === style;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => switchStyle(s.id)}
                                        style={{
                                            width: '100%', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden',
                                            cursor: 'pointer', position: 'relative',
                                            border: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                                            boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ transform: 'scale(0.0859375)', transformOrigin: 'top left', width: 1280, height: 720, pointerEvents: 'none' }}>
                                            <ThumbnailRenderer style={s.id} title={title || 'YOUR TITLE'} subtitle={subtitle} theme={t} bgImage={''} sc={1} />
                                        </div>
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            background: 'var(--primary)', padding: '3px 6px',
                                            fontSize: 8, fontWeight: 700, color: 'var(--primary-foreground)', textAlign: 'center',
                                        }}>
                                            {s.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden full-size render for export */}
            <div style={{ position: 'fixed', left: -9999, top: -9999, pointerEvents: 'none', zIndex: -1, opacity: 0 }}>
                <div ref={exportRef} style={{ width: 1280, height: 720, overflow: 'hidden', position: 'relative' }}>
                    <ThumbnailRenderer style={style} title={title} subtitle={subtitle} theme={theme} bgImage={bgImage} sc={1} />
                    {/* Export elements at full size */}
                    {placedElements.map(el => (
                        <div key={el.instanceId} style={{
                            position: 'absolute',
                            left: `${el.x}%`, top: `${el.y}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 30,
                        }}>
                            {renderElementContent(el)}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
