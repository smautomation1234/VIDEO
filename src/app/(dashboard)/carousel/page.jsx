"use client";
import React, { useState, useRef } from 'react';
import LiCreatorSlide from '@/components/CreatorPostSlide';
import { creatorMarkup, creatorPlainText, creatorPostPrompt, creatorSourceText, creatorWordCount } from '@/lib/creator-post.mjs';

function parseJsonResponse(value) {
    const raw = String(value || '').trim();
    const withoutFence = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try { return JSON.parse(withoutFence); } catch {
        const start = withoutFence.indexOf('{');
        const end = withoutFence.lastIndexOf('}');
        if (start >= 0 && end > start) return JSON.parse(withoutFence.slice(start, end + 1));
        throw new Error('AI returned invalid JSON.');
    }
}

function cleanIndividualCopy(value, preserveBreaks = false) {
    const cleaned = String(value || '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\[h\](.*?)\[\/h\]/gi, '$1')
        .replace(/\[BIG\]|\[\/BIG\]/gi, '');
    return preserveBreaks
        ? cleaned.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
        : cleaned.replace(/\s+/g, ' ').trim();
}

function individualWordCount(value) {
    return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function normaliseFiveHashtags(value) {
    const fallbacks = ['#PersonalBrand', '#ContentCreator', '#FounderMarketing', '#InstagramTips', '#BuildInPublic'];
    const raw = Array.isArray(value) ? value : String(value || '').match(/#[\p{L}\p{N}_]+/gu) || [];
    const unique = [];
    raw.forEach(tag => {
        const cleaned = String(tag || '').trim().replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '');
        if (cleaned && !unique.some(item => item.toLowerCase() === `#${cleaned}`.toLowerCase())) unique.push(`#${cleaned}`);
    });
    fallbacks.forEach(tag => {
        if (unique.length < 5 && !unique.some(item => item.toLowerCase() === tag.toLowerCase())) unique.push(tag);
    });
    return unique.slice(0, 5);
}

// ─── Platforms ───────────────────────────────────────────────────────────────
const PLATFORMS = [
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YT Thumb (16:9)' },
    { id: 'reels', label: 'IG Reels' },
    { id: 'shorts', label: 'YT Shorts' },
    { id: 'infographic', label: 'Infographic' },
];

// ─── Style Modes ───────────────────────────────────────────────────────────────
const STYLE_MODES = [
    { id: 'magazine', label: 'Magazine Bold', desc: 'Dark · Impact type · Red highlights' },
    { id: 'minimal', label: 'Clean Minimal', desc: 'White · Editorial · Nano Banana style' },
    { id: 'editorial', label: 'Editorial', desc: 'Hand-drawn marks · High contrast' },
    { id: 'pillars', label: 'Dark Pillars', desc: '6-Grid Layout · In-depth Content' },
    { id: 'viral', label: 'Viral Story', desc: 'Text-only · Bold keywords · Story flow' },
    { id: 'viral-x', label: 'Viral X', desc: 'Twitter style · Yellow highlights' },
    { id: 'li-creator', label: 'Creator Post', desc: 'Full posts · Profile photo · Bold text' },
    { id: 'ai-clone', label: 'AI Layout Clone', desc: 'Exact HTML clone from Image' },
    { id: 'li-post', label: 'LinkedIn Post', desc: 'Social post style' },
    { id: 'retro', label: 'Retro Serif', desc: 'Big serif text with starburst logo' },
    { id: 'quote', label: 'Neon Quote', desc: 'Big typography quote style' },
    { id: 'promo', label: 'Promo Card', desc: 'High-conversion stats layout' },
    { id: 'cheatsheet', label: 'Cheat Sheet', desc: 'Structured lists & highlights' },
    { id: 'tweet-classic', label: 'Classic Tweet', desc: 'Authentic White Twitter post' },
    { id: 'tweet-dark', label: 'Dark Tweet', desc: 'Authentic Dark Twitter post' },
    { id: 'yt-thumb', label: 'YT Thumbnail', desc: 'Dedicated 16:9 Clickbait Card' },
    { id: 'infographic', label: 'Infographic', desc: 'Timeline · Facts · Images' },
    { id: 'gradient', label: 'Gradient Wave', desc: 'Bold gradients · Vibrant color blocks' },
    { id: 'cyberpunk', label: 'Cyberpunk', desc: 'Neon glow · Glitch · Dark tech' },
    { id: 'corporate', label: 'Corporate Pro', desc: 'Clean · Muted · Professional' },
    { id: 'brutalism', label: 'Brutalism Bold', desc: 'Raw · High Contrast · Borders' },
    { id: 'glassmorphism', label: 'Glassmorphism', desc: 'Frosted glass · Gradients · Depth' },
];

// ─── AI CLONE THEMES ───────────────────────────────────────────────────────────
const AICLONE_THEMES = [
    { id: 'custom-clone', name: 'Wait for Upload...', bg: '#ffffff', text: '#000000', sub: '#333333', accent: '#000000', muted: '#888888' }
];

const LIPOST_THEMES = [{ id: 'li-default', name: 'Classic Post', bg: '#ffffff', text: '#000000', sub: '#666666', accent: '#0a66c2', muted: '#999999', border: '#e0e0e0' }];
const RETRO_THEMES = [{ id: 'retro-default', name: 'Vintage Beige', bg: '#fcfaf6', text: '#11100e', sub: '#914231', accent: '#722d26', muted: '#aaaaaa', border: '#11100e' }];
const QUOTE_THEMES = [{ id: 'quote-default', name: 'Neon Pink Quotes', bg: '#000000', text: '#ffffff', sub: '#ffffff', accent: '#ff0066', muted: '#888888', border: '#333' }];
const PROMO_THEMES = [{ id: 'promo-default', name: 'Dark Analytics', bg: '#040a18', text: '#ffffff', sub: '#89b4f8', accent: '#4285f4', muted: '#555555', border: '#222' }];
const CHEATSHEET_THEMES = [{ id: 'cheat-default', name: 'Notion Style', bg: '#fcfaf6', text: '#1a1a1a', sub: '#1a1a1a', accent: '#da745a', muted: '#888', border: '#e0e0e0' }];
const TWEET_THEMES = [{ id: 'tweet-light', name: 'Classic White', bg: '#ffffff', text: '#0f1419', sub: '#536471', accent: '#1d9bf0', muted: '#536471', border: '#eff3f4' }];
const TWEET_DARK_THEMES = [{ id: 'tweet-dark-default', name: 'Classic Dark', bg: '#000000', text: '#e7e9ea', sub: '#71767b', accent: '#1d9bf0', muted: '#71767b', border: '#2f3336' }];
const YTTHUMB_THEMES = [{ id: 'yt-red', name: 'Clickbait Red', bg: '#111111', text: '#ffffff', sub: '#ff0000', accent: '#ff0000', muted: '#999999', border: '#222222' }];

// ─── INFOGRAPHIC THEMES ─────────────────────────────────────────────────────
const INFOGRAPHIC_THEMES = [
    { id: 'infog-dark', name: 'Dark Premium', bg: '#0a0a0a', text: '#ffffff', sub: '#e0e0e0', accent: '#ffd700', accentBg: 'rgba(255,215,0,0.12)', muted: '#777777', border: '#222222', cardBg: '#151515', dateBg: '#ffd700', dateText: '#0a0a0a', statsAccent: '#ffd700' },
    { id: 'infog-midnight', name: 'Midnight Blue', bg: '#0c1425', text: '#ffffff', sub: '#b8cce8', accent: '#4da6ff', accentBg: 'rgba(77,166,255,0.12)', muted: '#5a7099', border: '#1a2a44', cardBg: '#111d33', dateBg: '#4da6ff', dateText: '#0c1425', statsAccent: '#4da6ff' },
    { id: 'infog-cream', name: 'Warm Cream', bg: '#faf6ee', text: '#1a1612', sub: '#3d3329', accent: '#c4501a', accentBg: 'rgba(196,80,26,0.1)', muted: '#8a7a66', border: '#e0d8ca', cardBg: '#f0ebe0', dateBg: '#c4501a', dateText: '#faf6ee', statsAccent: '#c4501a' },
    { id: 'infog-emerald', name: 'Emerald Dark', bg: '#0a1a14', text: '#e0f5ec', sub: '#a0d8be', accent: '#34d399', accentBg: 'rgba(52,211,153,0.12)', muted: '#4a7a62', border: '#1a3328', cardBg: '#112a1f', dateBg: '#34d399', dateText: '#0a1a14', statsAccent: '#34d399' },
    { id: 'infog-tricolor', name: 'Tricolor', bg: '#0e0e0e', text: '#ffffff', sub: '#e0e0e0', accent: '#FF9933', accentBg: 'rgba(255,153,51,0.12)', muted: '#888888', border: '#222222', cardBg: '#1a1a1a', dateBg: '#FF9933', dateText: '#0e0e0e', statsAccent: '#138808', secondAccent: '#FF9933', thirdAccent: '#000080' },
];

// ─── GRADIENT WAVE THEMES ────────────────────────────────────────────────────
const GRADIENT_THEMES = [
    { id: 'grad-violet', name: 'Violet Burst', bg: '#0f0020', text: '#ffffff', sub: '#e0d0ff', accent: '#a855f7', accentGrad: 'linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)', muted: '#7c5a99', border: '#2d1a4d', cardBg: '#1a0a35' },
    { id: 'grad-ocean', name: 'Ocean Surge', bg: '#000d1a', text: '#ffffff', sub: '#b8e0ff', accent: '#0ea5e9', accentGrad: 'linear-gradient(135deg,#0369a1,#0ea5e9,#22d3ee)', muted: '#3a6080', border: '#001d33', cardBg: '#001528' },
    { id: 'grad-sunset', name: 'Sunset Flame', bg: '#0f0a00', text: '#ffffff', sub: '#ffe4b8', accent: '#f97316', accentGrad: 'linear-gradient(135deg,#dc2626,#f97316,#fbbf24)', muted: '#7a4a20', border: '#2a1500', cardBg: '#1a0d00' },
    { id: 'grad-emerald', name: 'Emerald Glow', bg: '#001a0e', text: '#ffffff', sub: '#a7f3d0', accent: '#10b981', accentGrad: 'linear-gradient(135deg,#059669,#10b981,#34d399)', muted: '#2a6a4a', border: '#002d18', cardBg: '#001f0f' },
    { id: 'grad-rose', name: 'Rose Gold', bg: '#1a0010', text: '#ffffff', sub: '#ffd6e7', accent: '#f43f5e', accentGrad: 'linear-gradient(135deg,#be123c,#f43f5e,#fb7185)', muted: '#7a2040', border: '#2d0020', cardBg: '#250018' },
];

// ─── CYBERPUNK THEMES ─────────────────────────────────────────────────────────
const CYBER_THEMES = [
    { id: 'cyber-green', name: 'Matrix Green', bg: '#000000', text: '#00ff88', sub: '#00cc66', accent: '#00ff88', muted: '#004422', border: '#003311', cardBg: '#050f08' },
    { id: 'cyber-pink', name: 'Neon Pink', bg: '#06000f', text: '#ff00cc', sub: '#ff66ee', accent: '#ff00cc', muted: '#550055', border: '#1a0025', cardBg: '#0d0018' },
    { id: 'cyber-blue', name: 'Electric Blue', bg: '#000510', text: '#00cfff', sub: '#80e8ff', accent: '#00cfff', muted: '#003355', border: '#001128', cardBg: '#000d20' },
    { id: 'cyber-gold', name: 'Cyber Gold', bg: '#0a0800', text: '#ffd700', sub: '#ffed80', accent: '#ffd700', muted: '#554400', border: '#1a1200', cardBg: '#120f00' },
];

// ─── CORPORATE PRO THEMES ─────────────────────────────────────────────────────
const CORP_THEMES = [
    { id: 'corp-slate', name: 'Slate Blue', bg: '#f8fafc', text: '#0f172a', sub: '#334155', accent: '#3b82f6', muted: '#94a3b8', border: '#e2e8f0', cardBg: '#ffffff' },
    { id: 'corp-dark', name: 'Dark Navy', bg: '#0f172a', text: '#f1f5f9', sub: '#cbd5e1', accent: '#60a5fa', muted: '#475569', border: '#1e293b', cardBg: '#1e293b' },
    { id: 'corp-teal', name: 'Teal Clean', bg: '#f0fdfa', text: '#134e4a', sub: '#115e59', accent: '#0d9488', muted: '#5eead4', border: '#ccfbf1', cardBg: '#ffffff' },
    { id: 'corp-charcoal', name: 'Charcoal', bg: '#1c1c1e', text: '#ffffff', sub: '#ebebf0', accent: '#ff9f0a', muted: '#636366', border: '#2c2c2e', cardBg: '#2c2c2e' },
];

// ─── BRUTALISM THEMES ─────────────────────────────────────────────────────────
const BRUTAL_THEMES = [
    { id: 'brutal-yellow', name: 'Raw Yellow', bg: '#e0e0e0', text: '#000000', sub: '#222222', accent: '#ffff00', muted: '#666666', border: '#000000', cardBg: '#ffffff' },
    { id: 'brutal-pink', name: 'Harsh Pink', bg: '#ffffff', text: '#111111', sub: '#111111', accent: '#ff00ff', muted: '#888888', border: '#111111', cardBg: '#e0e0e0' },
];

// ─── GLASSMORPHISM THEMES ──────────────────────────────────────────────────────
const GLASS_THEMES = [
    { id: 'glass-ocean', name: 'Ocean Depth', bg: '#0b132b', text: '#ffffff', sub: '#e0e5ec', accent: '#3a86ff', muted: '#8d99ae', border: 'rgba(255,255,255,0.2)', cardBg: 'rgba(255,255,255,0.1)' },
    { id: 'glass-sunset', name: 'Sunset Glow', bg: '#1a0b2e', text: '#ffffff', sub: '#f8edeb', accent: '#ff006e', muted: '#bc9cb0', border: 'rgba(255,255,255,0.2)', cardBg: 'rgba(255,255,255,0.08)' },
];

// ─── LINKEDIN CREATOR THEMES ─────────────────────────────────────────────────
const LICREATOR_THEMES = [
    { id: 'creator-light', name: 'Light Clean', bg: '#f5f5f0', text: '#0a0a0a', sub: '#888888', accent: '#0a66c2', muted: '#999999', border: '#e0e0e0', boldColor: '#0a0a0a' },
    { id: 'creator-white', name: 'Pure White', bg: '#ffffff', text: '#000000', sub: '#777777', accent: '#0a66c2', muted: '#aaaaaa', border: '#eeeeee', boldColor: '#000000' },
    { id: 'creator-dark', name: 'Dark Mode', bg: '#1b1f23', text: '#e8e8e8', sub: '#999999', accent: '#70b5f9', muted: '#666666', border: '#2d3236', boldColor: '#ffffff' },
    { id: 'creator-warm', name: 'Warm Cream', bg: '#faf6ee', text: '#1a1a1a', sub: '#8a8070', accent: '#b45309', muted: '#999999', border: '#e0ddd4', boldColor: '#1a1a1a' },
];

// ─── Highlight parser: renders [h]word[/h] as dark-boxed spans ────────────────
function parseHighlights(text, highlightBg = '#1a1a1a', highlightColor = '#f5f0e0', accentWord = '', accentColor = '#0077b5', styleMode = 'magazine') {
    if (!text) return null;
    // Split on [h]...[/h] pattern (case insensitive)
    const parts = text.split(/\[h\](.+?)\[\/h\]/gi);
    return parts.map((part, i) => {
        if (i % 2 === 1) {
            // This is a highlighted segment
            if (styleMode === 'editorial') {
                return (
                    <span key={i} style={{
                        position: 'relative', display: 'inline-block',
                        color: highlightBg, fontWeight: 900
                    }}>
                        <span style={{
                            position: 'absolute', inset: -4,
                            border: `3px solid ${highlightBg}`, // usually orange/red accent
                            borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px',
                            zIndex: -1, pointerEvents: 'none'
                        }} />
                        {part}
                    </span>
                );
            }
            if (styleMode === 'minimal') {
                return (
                    <span key={i} style={{ color: highlightBg, fontWeight: 900 }}>
                        {part}
                    </span>
                );
            }

            // Magazine & Pillars mode:
            // Each word is its own span (never wraps = no html2canvas multiline bug).
            // Use display:inline-block to fix html2canvas floating background issue.
            // Zero vertical padding prevents oversized overlapping boxes.
            return part.split(' ').map((word, wIdx, arr) => (
                <React.Fragment key={`${i}-${wIdx}`}>
                    <span style={{
                        backgroundColor: highlightBg, color: highlightColor,
                        padding: '0 0.2em',
                        borderRadius: 3,
                        display: 'inline-block',
                        lineHeight: 'inherit',
                    }}>{word}</span>
                    {wIdx < arr.length - 1 ? ' ' : ''}
                </React.Fragment>
            ));
        }
        // Check for accent word (e.g. "LinkedIn") inside plain text
        if (accentWord && part.includes(accentWord)) {
            const sub = part.split(accentWord);
            return sub.map((s, j) => j < sub.length - 1
                ? [<span key={`${i}-${j}`}>{s}</span>, <span key={`${i}-${j}-acc`} style={{ color: accentColor }}>{accentWord}</span>]
                : <span key={`${i}-${j}`}>{s}</span>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

// ─── MAGAZINE BOLD THEMES (reference image style) ─────────────────────────────
const MAG_THEMES = [
    { id: 'black-cream', name: 'Black & Cream', bg: '#0d0d0d', text: '#e8e4d0', sub: '#9a9a8a', accent: '#ff3b3b', accentBg: 'rgba(255,59,59,0.12)', muted: '#666660' },
    { id: 'black-white', name: 'Black & White', bg: '#000000', text: '#ffffff', sub: '#aaaaaa', accent: '#ff3030', accentBg: 'rgba(255,48,48,0.1)', muted: '#555555' },
    { id: 'black-gold', name: 'Black & Gold', bg: '#0c0b08', text: '#ffd700', sub: '#b8a060', accent: '#ffd700', accentBg: 'rgba(255,215,0,0.1)', muted: '#666655' },
    { id: 'black-lime', name: 'Black & Lime', bg: '#0a0d08', text: '#c8f135', sub: '#8aaa55', accent: '#c8f135', accentBg: 'rgba(200,241,53,0.1)', muted: '#445533' },
    { id: 'dark-blue', name: 'Dark & Blue', bg: '#080c14', text: '#e0eeff', sub: '#8899cc', accent: '#4d9fff', accentBg: 'rgba(77,159,255,0.12)', muted: '#334466' },
    { id: 'dark-rose', name: 'Dark & Rose', bg: '#0f0810', text: '#ffe0f0', sub: '#cc88aa', accent: '#ff4488', accentBg: 'rgba(255,68,136,0.12)', muted: '#553344' },
];

// ─── MINIMAL THEMES (Nano Banana style) ──────────────────────────────────────
const MIN_THEMES = [
    { id: 'pure-white', name: 'Pure White', bg: '#ffffff', text: '#111111', sub: '#444444', muted: '#888888', accent: '#7c3aed', border: '#e5e7eb', tagBg: '#ede9fe', tagText: '#7c3aed' },
    { id: 'warm-cream', name: 'Warm Cream', bg: '#fffbf0', text: '#1c1917', sub: '#44403c', muted: '#78716c', accent: '#d97706', border: '#e7e5e4', tagBg: '#fef3c7', tagText: '#d97706' },
    { id: 'linkedin-blue', name: 'LinkedIn Blue', bg: '#ffffff', text: '#000000', sub: '#333333', muted: '#666666', accent: '#0077b5', border: '#e0e0e0', tagBg: '#e8f5ff', tagText: '#0077b5' },
    { id: 'forest-green', name: 'Forest Green', bg: '#ffffff', text: '#111111', sub: '#374151', muted: '#6b7280', accent: '#059669', border: '#a7f3d0', tagBg: '#d1fae5', tagText: '#059669' },
    { id: 'rose-light', name: 'Rose Light', bg: '#ffffff', text: '#111111', sub: '#374151', muted: '#6b7280', accent: '#e11d48', border: '#fecdd3', tagBg: '#ffe4e6', tagText: '#e11d48' },
    { id: 'bold-black', name: 'Bold Black', bg: '#0a0a0a', text: '#ffffff', sub: '#d1d5db', muted: '#9ca3af', accent: '#ffffff', border: '#2d2d2d', tagBg: '#1f1f1f', tagText: '#ffffff' },
];

// ─── EDITORIAL THEMES ─────────────────────────────────────────────────────────
const ED_THEMES = [
    { id: 'news-white', name: 'Newsprint White', bg: '#f9f9f9', text: '#111111', sub: '#333333', muted: '#777777', accent: '#ff4500', accentBg: 'rgba(255,69,0,0.1)', border: '#dddddd' },
    { id: 'news-cream', name: 'Newsprint Cream', bg: '#f5f0e6', text: '#1c1c1c', sub: '#444444', muted: '#888888', accent: '#e63946', accentBg: 'rgba(230,57,70,0.1)', border: '#dcd3c6' },
];

// ─── PILLARS THEMES ───────────────────────────────────────────────────────────
const PIL_THEMES = [
    { id: 'neon-pink', name: 'Neon Pink', bg: '#0f0f0f', text: '#ffffff', sub: '#cccccc', cardBg: '#1a1a1a', accent: '#ff0055', muted: '#666666' },
    { id: 'neon-cyan', name: 'Neon Cyan', bg: '#0a0a14', text: '#ffffff', sub: '#c0c0d0', cardBg: '#151525', accent: '#00e5ff', muted: '#505070' },
];

// ─── VIRAL STORY THEMES ────────────────────────────────────────────────────────
const VIRAL_THEMES = [
    { id: 'viral-white', name: 'Clean White', bg: '#ffffff', text: '#0a0a0a', sub: '#444444', accent: '#0a66c2', muted: '#999999', border: '#e8e8e8', boldColor: '#0a0a0a' },
    { id: 'viral-dark', name: 'Midnight Dark', bg: '#0a0a0a', text: '#f2f2f2', sub: '#cccccc', accent: '#f2f2f2', muted: '#777777', border: '#1e1e1e', boldColor: '#ffffff' },
    { id: 'viral-cream', name: 'Warm Cream', bg: '#faf8f3', text: '#1a1a1a', sub: '#555555', accent: '#b45309', muted: '#888888', border: '#e0ddd6', boldColor: '#1a1a1a' },
    { id: 'viral-blue', name: 'Dark Blue', bg: '#1b1f23', text: '#e8e8e8', sub: '#aaaaaa', accent: '#70b5f9', muted: '#666666', border: '#2d3236', boldColor: '#70b5f9' },
];

// ─── VIRAL X THEMES ────────────────────────────────────────────────────────
const VIRALX_THEMES = [
    { id: 'x-light', name: 'X Default', bg: '#ffffff', text: '#0f1419', sub: '#536471', accent: '#fce83a', muted: '#536471', border: '#eff3f4' },
    { id: 'x-dim', name: 'X Dim', bg: '#15202b', text: '#ffffff', sub: '#8b98a5', accent: '#fce83a', muted: '#8b98a5', border: '#38444d' },
    { id: 'x-dark', name: 'X Lights Out', bg: '#000000', text: '#e7e9ea', sub: '#71767b', accent: '#fce83a', muted: '#71767b', border: '#2f3336' },
];

// ════════════════════════════════════════════════════════════════════
// MAGAZINE BOLD SLIDES
// ════════════════════════════════════════════════════════════════════

function MagCoverSlide({ slide, total, t, author, companyName, logo, website }) {
    // Parse title for [h] highlights — used for accent-color words
    const hasHighlight = slide?.title?.includes('[h]');

    return (
        <div style={{
            width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden',
            background: t.bg,   // Dark magazine theme bg — matches the preview card
            boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
        }}>
            {/* ── Subtle radial glow at top ── */}
            <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${t.accent}18, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {/* ── TOP: tag + slide count + company ── */}
            <div style={{
                position: 'relative', zIndex: 10,
                padding: `${22 * (t.scale || 1)}px ${28 * (t.scale || 1)}px 0`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{
                    fontSize: 11 * (t.scale || 1), fontWeight: 800, letterSpacing: 2 * (t.scale || 1),
                    color: t.accent, textTransform: 'uppercase',
                }}>
                    ⚡ {slide?.tag || 'Must Read'}
                </div>
                <div style={{ fontSize: 11 * (t.scale || 1), color: t.muted, fontWeight: 600 }}>
                    {companyName ? <span style={{ marginRight: 10 * (t.scale || 1), borderRight: `1px solid ${t.muted}`, paddingRight: 10 * (t.scale || 1) }}>{companyName}</span> : null}
                    {total} slides
                </div>
            </div>

            {/* ── GIANT headline — Anton display font ── */}
            <div style={{ position: 'relative', zIndex: 10, padding: `${20 * (t.scale || 1)}px ${28 * (t.scale || 1)}px 0` }}>
                <div style={{
                    fontFamily: "'Anton', 'Impact', sans-serif",
                    fontSize: ((slide?.title?.replace(/\[\/?h\]/g, '').length || 0) > 50 ? 44
                        : (slide?.title?.replace(/\[\/?h\]/g, '').length || 0) > 30 ? 56 : 68) * (t.scale || 1),
                    lineHeight: 1.0, color: t.sub || t.text,
                    textTransform: 'uppercase', letterSpacing: -1 * (t.scale || 1),
                }}>
                    {hasHighlight
                        ? parseHighlights(slide?.title, t.accent, t.bg, '', t.accent, 'magazine')
                        : slide?.title?.replace(/\[\/?h\]/g, '')
                    }
                </div>
            </div>

            {/* ── Accent divider ── */}
            <div style={{
                position: 'relative', zIndex: 10,
                margin: '18px 28px 0',
                height: 3, width: 52,
                background: `linear-gradient(90deg, ${t.accent}, ${t.accent}44)`,
                borderRadius: 2,
            }} />

            {/* ── Body / tagline — Playfair Display serif ── */}
            {slide?.body && (
                <div style={{
                    position: 'relative', zIndex: 10,
                    padding: '16px 28px 0',
                    fontSize: 17, lineHeight: 1.75,
                    color: t.sub,
                    fontFamily: "'Inter', sans-serif",
                    fontStyle: 'italic',
                    maxWidth: '85%',
                }}>
                    {parseBold(slide?.body, t.accent)}
                </div>
            )}

            {/* ── Author row at bottom ── */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
                padding: '0 28px 22px',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: t.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 14, color: t.bg, flexShrink: 0, overflow: 'hidden',
                    boxShadow: `0 0 16px ${t.accent}60`,
                }}>
                    {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: t.sub || t.text }}>@{(author || 'Your Name').replace(/\s+/g, '')}</div>
                    <div style={{ fontSize: 11, color: t.muted, fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>Swipe to read →</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: t.muted }}>1 / {total}</div>
            </div>

            {/* ── Bottom accent bar ── */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: t.accent }} />
        </div>
    );
}


function MagContentSlide({ slide, index, total, t, logo, website }) {
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            {/* Giant faded number watermark */}
            <div style={{
                position: 'absolute', right: -2 * (t.scale || 1) + 'vw', bottom: -5 * (t.scale || 1) + 'vh',
                fontSize: 300 * (t.scale || 1), fontWeight: 900, lineHeight: 1,
                color: t.sub || t.text, opacity: 0.03,
                letterSpacing: -10 * (t.scale || 1), userSelect: 'none', pointerEvents: 'none',
            }}>
                {index + 1}
            </div>

            {/* Header */}
            <div style={{ padding: `${22 * (t.scale || 1)}px ${28 * (t.scale || 1)}px 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                    fontSize: 10 * (t.scale || 1), fontWeight: 800, letterSpacing: 2 * (t.scale || 1), color: t.accent,
                    textTransform: 'uppercase', borderBottom: `${2 * (t.scale || 1)}px solid ${t.accent}`,
                    paddingBottom: 2 * (t.scale || 1),
                }}>
                    {slide?.tag || `#${index} Insight`}
                </div>
                <div style={{ fontSize: 11 * (t.scale || 1), color: t.muted, fontWeight: 700 }}>{index + 1} / {total}</div>
            </div>

            {/* Main headline - Anton font, huge */}
            <div style={{ padding: `${18 * (t.scale || 1)}px ${28 * (t.scale || 1)}px 0` }}>
                <div style={{
                    fontFamily: "'Anton', 'Impact', sans-serif",
                    fontSize: (slide?.title.length > 55 ? 32 : slide?.title.length > 35 ? 40 : slide?.title.length > 20 ? 46 : 56) * (t.scale || 1),
                    lineHeight: 1.0, color: t.sub || t.text,
                    textTransform: 'uppercase', letterSpacing: -0.5 * (t.scale || 1),
                    marginBottom: 18 * (t.scale || 1),
                }}>
                    {slide?.title?.replace(/\[\/?h\]/g, '')}
                </div>

                {/* Accent divider */}
                <div style={{ height: 2 * (t.scale || 1), width: 40 * (t.scale || 1), background: t.accent, marginBottom: 20 * (t.scale || 1) }} />
            </div>

            {/* Bullets */}
            {slide?.bullets && slide?.bullets.filter(b => b.trim()).length > 0 && (
                <div style={{ padding: `0 ${28 * (t.scale || 1)}px`, display: 'flex', flexDirection: 'column', gap: 14 * (t.scale || 1) }}>
                    {slide?.bullets.filter(b => b.trim()).map((b, i) => (
                        <div key={i} className="bullet-item" style={{ display: 'flex', gap: 14 * (t.scale || 1), alignItems: 'flex-start', transition: 'all 0.3s' }}>
                            <div style={{
                                width: 22 * (t.scale || 1), height: 22 * (t.scale || 1), borderRadius: '50%', background: t.accentBg,
                                color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13 * (t.scale || 1), fontWeight: 900, flexShrink: 0, overflow: 'hidden', marginTop: 2 * (t.scale || 1),
                            }}>
                                {i + 1}
                            </div>
                            <p style={{ fontSize: 17 * (t.scale || 1), lineHeight: 1.5, color: t.sub, margin: 0, fontWeight: 500 }}>{parseBold(b, t.accent)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Body fallback */}
            {slide?.body && (!slide?.bullets || slide?.bullets.filter(b => b.trim()).length === 0) && (
                <div style={{ padding: `0 ${28 * (t.scale || 1)}px`, fontSize: 18 * (t.scale || 1), lineHeight: 1.6, color: t.sub }}>
                    {parseBold(slide?.body, t.accent)}
                </div>
            )}

            {/* Swipe prompt */}
            <div style={{
                position: 'absolute', bottom: 22 * (t.scale || 1), right: 28 * (t.scale || 1),
                fontSize: 10 * (t.scale || 1), fontWeight: 800, color: t.muted, letterSpacing: 1 * (t.scale || 1),
            }}>
                NEXT INTEL →
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: t.accent, opacity: 0.4 }} />
        </div>
    );
}

function MagCTASlide({ slide, total, t, author, companyName, logo, website }) {
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            {/* Big concentric circles decoration */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 420 * (t.scale || 1), height: 420 * (t.scale || 1), borderRadius: '50%', border: `1px solid ${t.accent}15`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 310 * (t.scale || 1), height: 310 * (t.scale || 1), borderRadius: '50%', border: `1px solid ${t.accent}12`, pointerEvents: 'none' }} />

            {/* Top label */}
            <div style={{ padding: `${22 * (t.scale || 1)}px ${28 * (t.scale || 1)}px 0`, textAlign: 'center' }}>
                <div style={{ fontSize: 11 * (t.scale || 1), fontWeight: 800, letterSpacing: 2 * (t.scale || 1), color: t.accent, textTransform: 'uppercase' }}>{total} / {total}</div>
            </div>

            {/* Center content */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: `calc(100% - ${60 * (t.scale || 1)}px)`, gap: 18 * (t.scale || 1), padding: `0 ${36 * (t.scale || 1)}px`, textAlign: 'center' }}>
                {/* Icon */}
                <div style={{ fontSize: 44 * (t.scale || 1), lineHeight: 1 }}>{slide?.icon}</div>

                {/* Huge headline */}
                <div style={{
                    fontFamily: "'Anton', 'Impact', sans-serif",
                    fontSize: (slide?.title.length > 30 ? 36 : 48) * (t.scale || 1),
                    lineHeight: 1.0, color: t.sub || t.text,
                    textTransform: 'uppercase', letterSpacing: -0.5 * (t.scale || 1),
                }}>
                    {slide?.title?.replace(/\[\/?h\]/g, '')}
                </div>

                {/* Accent line */}
                <div style={{ height: 3 * (t.scale || 1), width: 50 * (t.scale || 1), background: t.accent, borderRadius: 2 * (t.scale || 1) }} />

                {/* Body */}
                {slide?.body && <div style={{
                    fontSize: 17 * (t.scale || 1), lineHeight: 1.75, color: t.sub, maxWidth: '80%',
                    fontFamily: "'Inter', sans-serif",
                    fontStyle: 'italic',
                }}>{parseBold(slide?.body, t.accent)}</div>}

                {/* CTA box */}
                {slide?.cta && (
                    <div style={{
                        marginTop: 6 * (t.scale || 1),
                        border: `${2 * (t.scale || 1)}px solid ${t.accent}`,
                        borderRadius: 4 * (t.scale || 1), padding: `${14 * (t.scale || 1)}px ${32 * (t.scale || 1)}px`,
                        fontSize: 15 * (t.scale || 1), fontWeight: 800, color: t.accent,
                        textTransform: 'uppercase',
                        fontFamily: "'Anton', 'Impact', sans-serif",
                        letterSpacing: 1 * (t.scale || 1),
                    }}>
                        {slide?.cta}
                    </div>
                )}

                {/* Author / Company */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 * (t.scale || 1), marginTop: 4 * (t.scale || 1) }}>
                    <div style={{ width: 30 * (t.scale || 1), height: 30 * (t.scale || 1), borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 * (t.scale || 1), fontWeight: 900, color: t.bg }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12 * (t.scale || 1), fontWeight: 700, color: t.sub }}>{author || 'Your Name'} {companyName ? ` | ${companyName}` : ''}</span>
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * (t.scale || 1), background: t.accent }} />
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// MINIMAL SLIDES (Nano Banana style)
// ════════════════════════════════════════════════════════════════════

function DotPattern({ color, opacity = 0.12 }) {
    return (
        <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `radial-gradient(circle, ${color} 1.5px, transparent 1.5px)`,
            backgroundSize: '22px 22px', opacity,
        }} />
    );
}

function MinCoverSlide({ slide, total, t, author, companyName, logo, website }) {
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <DotPattern color={t.accent} opacity={0.1} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5 * (t.scale || 1), background: t.accent }} />
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: `${30 * (t.scale || 1)}px ${36 * (t.scale || 1)}px` }}>
                <div style={{ background: t.tagBg, color: t.tagText, fontSize: 11 * (t.scale || 1), fontWeight: 800, letterSpacing: 1.2 * (t.scale || 1), textTransform: 'uppercase', padding: `${5 * (t.scale || 1)}px ${14 * (t.scale || 1)}px`, borderRadius: 4 * (t.scale || 1), alignSelf: 'flex-start', marginBottom: 24 * (t.scale || 1) }}>
                    {slide?.tag || '🔥 Thread'}
                </div>
                <div style={{ fontSize: 48 * (t.scale || 1), marginBottom: 14 * (t.scale || 1), lineHeight: 1 }}>{slide?.icon}</div>
                <div style={{ fontSize: 32 * (t.scale || 1), fontWeight: 900, lineHeight: 1.15, color: t.sub || t.text, letterSpacing: -0.6 * (t.scale || 1), flex: 1 }}>
                    {parseHighlights(slide?.title, t.accent, t.bg, '', t.accent, 'minimal')}
                </div>
                <div style={{ width: 52 * (t.scale || 1), height: 4 * (t.scale || 1), borderRadius: 2 * (t.scale || 1), background: t.accent, margin: `${18 * (t.scale || 1)}px 0 ${16 * (t.scale || 1)}px` }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 * (t.scale || 1) }}>
                    <div style={{ width: 40 * (t.scale || 1), height: 40 * (t.scale || 1), borderRadius: '50%', background: t.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15 * (t.scale || 1) }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: 13 * (t.scale || 1), fontWeight: 800, color: t.sub || t.text }}>{author || 'Your Name'}</div>
                        <div style={{ fontSize: 11 * (t.scale || 1), color: t.muted }}>{companyName || 'Founder'} · {total} slides →</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: t.tagBg, color: t.tagText, fontSize: 11 * (t.scale || 1), fontWeight: 800, padding: `${3 * (t.scale || 1)}px ${10 * (t.scale || 1)}px`, borderRadius: 20 * (t.scale || 1) }}>1 / {total}</div>
                </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * (t.scale || 1), background: t.accent, opacity: 0.25 }} />
        </div>
    );
}

function MinContentSlide({ slide, index, total, t, logo, website }) {
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <DotPattern color={t.accent} opacity={0.08} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5 * (t.scale || 1), background: t.accent }} />
            <div style={{
                position: 'absolute', right: -8 * (t.scale || 1), bottom: -24 * (t.scale || 1),
                fontSize: 220 * (t.scale || 1), fontWeight: 900, lineHeight: 1,
                color: t.accent, opacity: 0.05,
                fontFamily: 'Anton, Impact, sans-serif',
                userSelect: 'none', pointerEvents: 'none',
            }}>{index + 1}</div>
            <div style={{ position: 'relative', padding: `${24 * (t.scale || 1)}px ${36 * (t.scale || 1)}px`, height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 * (t.scale || 1) }}>
                    <div style={{ background: t.tagBg, color: t.tagText, fontSize: 10 * (t.scale || 1), fontWeight: 800, letterSpacing: 1 * (t.scale || 1), textTransform: 'uppercase', padding: `${4 * (t.scale || 1)}px ${10 * (t.scale || 1)}px`, borderRadius: 4 * (t.scale || 1) }}>
                        {slide?.tag || `Point #${index}`}
                    </div>
                    <div style={{ fontSize: 12 * (t.scale || 1), fontWeight: 700, color: t.muted }}>{index + 1} / {total}</div>
                </div>
                <div style={{ fontSize: ((slide?.title?.length || 0) > 50 ? 22 : (slide?.title?.length || 0) > 30 ? 26 : 30) * (t.scale || 1), fontWeight: 900, lineHeight: 1.2, color: t.sub || t.text, letterSpacing: -0.4 * (t.scale || 1), marginBottom: 16 * (t.scale || 1) }}>
                    {slide?.title?.replace(/\[\/?h\]/g, '')}
                </div>
                <div style={{ width: 36 * (t.scale || 1), height: 3 * (t.scale || 1), borderRadius: 2 * (t.scale || 1), background: t.accent, marginBottom: 18 * (t.scale || 1) }} />
                {slide?.bullets && slide?.bullets.filter(b => b.trim()).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 * (t.scale || 1) }}>
                        {slide?.bullets.filter(b => b.trim()).map((b, i) => (
                            <div key={i} className="bullet-item" style={{ display: 'flex', gap: 12 * (t.scale || 1), alignItems: 'flex-start', transition: 'all 0.3s' }}>
                                <div style={{ width: 22 * (t.scale || 1), height: 22 * (t.scale || 1), borderRadius: 6 * (t.scale || 1), flexShrink: 0, overflow: 'hidden', background: t.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 * (t.scale || 1), fontWeight: 900, marginTop: 1 * (t.scale || 1) }}>{i + 1}</div>
                                <p style={{ fontSize: 14 * (t.scale || 1), lineHeight: 1.6, color: t.sub, margin: 0, fontWeight: 500 }}>{parseBold(b, t.accent)}</p>
                            </div>
                        ))}
                    </div>
                )}
                {slide?.body && (!slide?.bullets || slide?.bullets.filter(b => b.trim()).length === 0) && (
                    <p style={{ fontSize: 16 * (t.scale || 1), lineHeight: 1.75, color: t.sub, margin: 0 }}>{parseBold(slide?.body, t.accent)}</p>
                )}
            </div>
            <div style={{ position: 'absolute', bottom: 14 * (t.scale || 1), right: 20 * (t.scale || 1), fontSize: 11 * (t.scale || 1), color: t.muted, fontWeight: 600 }}>Swipe →</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * (t.scale || 1), background: t.accent, opacity: 0.2 }} />
        </div>
    );
}

function MinCTASlide({ slide, total, t, author, companyName, logo, website }) {
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.accent, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, #fff 1.5px, transparent 1.5px)`, backgroundSize: '22px 22px', opacity: 0.08, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: -60 * (t.scale || 1), right: -60 * (t.scale || 1), width: 200 * (t.scale || 1), height: 200 * (t.scale || 1), borderRadius: '50%', border: `2px solid rgba(255,255,255,0.12)` }} />
            <div style={{ position: 'absolute', bottom: -40 * (t.scale || 1), left: -40 * (t.scale || 1), width: 160 * (t.scale || 1), height: 160 * (t.scale || 1), borderRadius: '50%', border: `2px solid rgba(255,255,255,0.1)` }} />
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${32 * (t.scale || 1)}px ${40 * (t.scale || 1)}px`, textAlign: 'center', gap: 18 * (t.scale || 1) }}>
                <div style={{ fontSize: 44 * (t.scale || 1), lineHeight: 1 }}>{slide?.icon}</div>
                <div style={{ fontSize: 28 * (t.scale || 1), fontWeight: 900, lineHeight: 1.2, color: '#fff', letterSpacing: -0.5 * (t.scale || 1) }}>{slide?.title?.replace(/\[\/?h\]/g, '')}</div>
                <div style={{ height: 3 * (t.scale || 1), width: 50 * (t.scale || 1), background: 'rgba(255,255,255,0.5)', borderRadius: 2 * (t.scale || 1) }} />
                {slide?.body && <div style={{ fontSize: 15 * (t.scale || 1), lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', maxWidth: '85%' }}>{parseBold(slide?.body, t.accent)}</div>}
                {slide?.cta && (
                    <div style={{ background: '#fff', color: t.accent, borderRadius: 12 * (t.scale || 1), padding: `${14 * (t.scale || 1)}px ${28 * (t.scale || 1)}px`, fontSize: 15 * (t.scale || 1), fontWeight: 900, boxShadow: `0 ${(8 * (t.scale || 1))}px ${(32 * (t.scale || 1))}px rgba(0,0,0,0.15)`, width: '100%', maxWidth: 300 * (t.scale || 1), textAlign: 'center' }}>
                        {slide?.cta}
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 * (t.scale || 1) }}>
                    <div style={{ width: 34 * (t.scale || 1), height: 34 * (t.scale || 1), borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: `2px solid rgba(255,255,255,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 * (t.scale || 1), color: '#fff' }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13 * (t.scale || 1), fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{author || 'Your Name'} {companyName ? `· ${companyName}` : ''}</div>
                    <div style={{ fontSize: 12 * (t.scale || 1), color: 'rgba(255,255,255,0.5)', marginLeft: 4 * (t.scale || 1) }}>{total}/{total}</div>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// EDITORIAL SLIDES (Newsprint / Image 2 style)
// ════════════════════════════════════════════════════════════════════

function EdCoverSlide({ slide, total, t, author, companyName, logo, website }) {
    const hasHighlight = slide?.title?.includes('[h]');
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8 * (t.scale || 1), background: t.accent }} />
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: `${36 * (t.scale || 1)}px ${40 * (t.scale || 1)}px` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 * (t.scale || 1), borderBottom: `${2 * (t.scale || 1)}px solid ${t.border}`, paddingBottom: 16 * (t.scale || 1) }}>
                    <div style={{ fontSize: 13 * (t.scale || 1), fontWeight: 900, letterSpacing: 1 * (t.scale || 1), textTransform: 'uppercase', color: t.sub || t.text, fontFamily: "'Inter', sans-serif" }}>
                        {companyName || 'Daily Insights'}
                    </div>
                    <div style={{ fontSize: 13 * (t.scale || 1), color: t.muted, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Vol. {total} — {slide?.tag || 'Exclusive'}</div>
                </div>

                <div style={{ fontSize: ((slide?.title?.replace(/\[\/?h\]/g, '').length || 0) > 40 ? 52 : 64) * (t.scale || 1), fontWeight: 900, lineHeight: 1.05, color: t.sub || t.text, letterSpacing: -1 * (t.scale || 1), flex: 1 }}>
                    {hasHighlight ? parseHighlights(slide?.title, t.accent, t.bg, '', t.accent, 'editorial') : slide?.title?.replace(/\[\/?h\]/g, '')}
                </div>

                {slide?.body && (
                    <div style={{ fontSize: 18 * (t.scale || 1), lineHeight: 1.6, color: t.sub, fontStyle: 'italic', marginBottom: 24 * (t.scale || 1), borderLeft: `${3 * (t.scale || 1)}px solid ${t.accent}`, paddingLeft: 16 * (t.scale || 1) }}>
                        {parseBold(slide?.body, t.accent)}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 * (t.scale || 1), borderTop: `${1 * (t.scale || 1)}px solid ${t.border}`, paddingTop: 20 * (t.scale || 1) }}>
                    <div style={{ width: 44 * (t.scale || 1), height: 44 * (t.scale || 1), borderRadius: '50%', background: t.text, color: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 * (t.scale || 1), fontFamily: "'Inter', sans-serif" }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: 14 * (t.scale || 1), fontWeight: 800, color: t.sub || t.text }}>By {author || 'Your Name'}</div>
                        <div style={{ fontSize: 12 * (t.scale || 1), color: t.muted, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>Read full story →</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 14 * (t.scale || 1), fontWeight: 900, color: t.accent }}>1 / {total}</div>
                </div>
            </div>
        </div>
    );
}

function EdContentSlide({ slide, index, total, t, logo, website }) {
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8 * (t.scale || 1), background: t.accent }} />
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: `${36 * (t.scale || 1)}px ${40 * (t.scale || 1)}px` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 * (t.scale || 1), borderBottom: `${2 * (t.scale || 1)}px solid ${t.border}`, paddingBottom: 12 * (t.scale || 1) }}>
                    <div style={{ fontSize: 12 * (t.scale || 1), fontWeight: 800, letterSpacing: 1 * (t.scale || 1), textTransform: 'uppercase', color: t.accent, fontFamily: "'Inter', sans-serif" }}>
                        {slide?.tag || `Page ${index + 1}`}
                    </div>
                    <div style={{ fontSize: 12 * (t.scale || 1), fontWeight: 700, color: t.muted, fontFamily: "'Inter', sans-serif" }}>{index + 1} / {total}</div>
                </div>

                <div style={{ fontSize: (slide?.title.length > 40 ? 36 : 42) * (t.scale || 1), fontWeight: 900, lineHeight: 1.1, color: t.sub || t.text, letterSpacing: -0.5 * (t.scale || 1), marginBottom: 20 * (t.scale || 1) }}>
                    {slide?.title?.replace(/\[\/?h\]/g, '')}
                </div>

                {slide?.bullets && slide?.bullets.filter(b => b.trim()).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 * (t.scale || 1) }}>
                        {slide?.bullets.filter(b => b.trim()).map((b, i) => (
                            <div key={i} className="bullet-item" style={{ display: 'flex', gap: 14 * (t.scale || 1), alignItems: 'flex-start', transition: 'all 0.3s' }}>
                                <div style={{ fontSize: 20 * (t.scale || 1), fontWeight: 900, color: t.accent, lineHeight: 1 }}>•</div>
                                <p style={{ fontSize: 17 * (t.scale || 1), lineHeight: 1.6, color: t.sub, margin: 0 }}>{parseBold(b, t.accent)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {slide?.body && (!slide?.bullets || slide?.bullets.filter(b => b.trim()).length === 0) && (
                    <p style={{ fontSize: 18 * (t.scale || 1), lineHeight: 1.7, color: t.sub, margin: 0, fontStyle: 'italic' }}>{parseBold(slide?.body, t.accent)}</p>
                )}

                <div style={{ position: 'absolute', bottom: 30 * (t.scale || 1), right: 40 * (t.scale || 1), fontSize: 12 * (t.scale || 1), fontWeight: 700, color: t.muted, fontFamily: "'Inter', sans-serif", borderBottom: `${1 * (t.scale || 1)}px solid ${t.muted}`, paddingBottom: 2 * (t.scale || 1) }}>TURN PAGE →</div>
            </div>
        </div>
    );
}

function EdCTASlide({ slide, total, t, author, companyName, logo, website }) {
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.text, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8 * (t.scale || 1), background: t.accent }} />
            <div style={{ position: 'absolute', inset: 16 * (t.scale || 1), border: `${1 * (t.scale || 1)}px solid rgba(255,255,255,0.15)`, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${40 * (t.scale || 1)}px`, textAlign: 'center' }}>
                <div style={{ fontSize: 56 * (t.scale || 1), marginBottom: 16 * (t.scale || 1), lineHeight: 1 }}>{slide?.icon}</div>
                <div style={{ fontSize: 44 * (t.scale || 1), fontWeight: 900, lineHeight: 1.1, color: t.bg, letterSpacing: -0.5 * (t.scale || 1), marginBottom: 20 * (t.scale || 1) }}>{slide?.title?.replace(/\[\/?h\]/g, '')}</div>

                {slide?.body && <div style={{ fontSize: 18 * (t.scale || 1), lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginBottom: 30 * (t.scale || 1), maxWidth: '90%' }}>{parseBold(slide?.body, t.accent)}</div>}

                {slide?.cta && (
                    <div style={{ background: t.accent, color: '#fff', padding: `${16 * (t.scale || 1)}px ${32 * (t.scale || 1)}px`, fontSize: 16 * (t.scale || 1), fontWeight: 900, fontFamily: "'Inter', sans-serif", letterSpacing: 1 * (t.scale || 1), textTransform: 'uppercase', marginBottom: 30 * (t.scale || 1), boxShadow: `${4 * (t.scale || 1)}px ${4 * (t.scale || 1)}px 0 ${t.bg}` }}>
                        {slide?.cta}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 * (t.scale || 1), borderTop: `${1 * (t.scale || 1)}px solid rgba(255,255,255,0.2)`, paddingTop: 20 * (t.scale || 1), width: '100%', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14 * (t.scale || 1), fontWeight: 700, color: t.bg, fontFamily: "'Inter', sans-serif" }}>{author || 'Your Name'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
                    <span style={{ fontSize: 14 * (t.scale || 1), fontWeight: 700, color: t.accent, fontFamily: "'Inter', sans-serif" }}>{companyName || 'Daily Insights'}</span>
                </div>
            </div>
            <div style={{ position: 'absolute', bottom: 12 * (t.scale || 1), right: 16 * (t.scale || 1), fontSize: 12 * (t.scale || 1), color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{total}/{total}</div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// PILLARS SLIDES (Dark / Image 3 style)
// ════════════════════════════════════════════════════════════════════

function PilCoverSlide({ slide, total, t, author, companyName, logo, website }) {
    const hasHighlight = slide?.title?.includes('[h]');
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            {/* Subtle grid background */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${t.muted}11 ${1 * (t.scale || 1)}px, transparent ${1 * (t.scale || 1)}px), linear-gradient(90deg, ${t.muted}11 ${1 * (t.scale || 1)}px, transparent ${1 * (t.scale || 1)}px)`, backgroundSize: `${40 * (t.scale || 1)}px ${40 * (t.scale || 1)}px` }} />

            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 200 * (t.scale || 1), height: 200 * (t.scale || 1), background: t.accent, filter: `blur(${120 * (t.scale || 1)}px)`, opacity: 0.15, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: `${40 * (t.scale || 1)}px` }}>
                <div style={{ alignSelf: 'center', background: t.accentBg, padding: `${6 * (t.scale || 1)}px ${16 * (t.scale || 1)}px`, borderRadius: 100 * (t.scale || 1), border: `${1 * (t.scale || 1)}px solid ${t.accent}40`, color: t.accent, fontSize: 12 * (t.scale || 1), fontWeight: 800, letterSpacing: 1.5 * (t.scale || 1), textTransform: 'uppercase', marginBottom: 40 * (t.scale || 1) }}>
                    {companyName || 'Framework'}
                </div>

                <div style={{ textAlign: 'center', fontSize: ((slide?.title?.replace(/\[\/?h\]/g, '').length || 0) > 40 ? 42 : 54) * (t.scale || 1), fontWeight: 900, lineHeight: 1.1, color: t.sub || t.text, letterSpacing: -1 * (t.scale || 1), marginBottom: 20 * (t.scale || 1) }}>
                    {hasHighlight ? parseHighlights(slide?.title, t.accent, t.bg, '', t.accent, 'magazine') : slide?.title?.replace(/\[\/?h\]/g, '')}
                </div>

                {slide?.body && (
                    <div style={{ textAlign: 'center', fontSize: 16 * (t.scale || 1), lineHeight: 1.6, color: t.sub, maxWidth: '90%', margin: '0 auto', marginBottom: 'auto' }}>
                        {parseBold(slide?.body, t.accent)}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `${1 * (t.scale || 1)}px solid ${t.muted}30`, paddingTop: 20 * (t.scale || 1) }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 * (t.scale || 1) }}>
                        <div style={{ width: 36 * (t.scale || 1), height: 36 * (t.scale || 1), borderRadius: 8 * (t.scale || 1), background: t.accent, color: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 * (t.scale || 1) }}>
                            {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 13 * (t.scale || 1), fontWeight: 700, color: t.sub || t.text }}>{author || 'Your Name'}</div>
                    </div>
                    <div style={{ fontSize: 12 * (t.scale || 1), fontWeight: 800, color: t.muted, letterSpacing: 1 * (t.scale || 1) }}>{total} SLIDES →</div>
                </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 * (t.scale || 1), background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)` }} />
        </div>
    );
}

function PilContentSlide({ slide, index, total, t, logo, website }) {
    // Parse bullets looking for "Title: Description" format
    const parsedBullets = (slide?.bullets || []).filter(b => b.trim()).map(b => {
        const splitIdx = b.indexOf(':');
        if (splitIdx > -1) {
            return { title: b.substring(0, splitIdx).trim(), desc: b.substring(splitIdx + 1).trim() };
        }
        return { title: b.substring(0, 20), desc: b }; // fallback
    });

    // Default fallback to 6 items if not enough generated
    const cards = parsedBullets.slice(0, 6);

    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4 * (t.scale || 1), background: `linear-gradient(90deg, ${t.bg}, ${t.accent}, ${t.bg})` }} />

            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: `${24 * (t.scale || 1)}px ${30 * (t.scale || 1)}px` }}>
                <div style={{ textAlign: 'center', marginBottom: 20 * (t.scale || 1) }}>
                    <div style={{ fontSize: 26 * (t.scale || 1), fontWeight: 900, color: t.sub || t.text, letterSpacing: -0.5 * (t.scale || 1), lineHeight: 1.1 }}>
                        {slide?.title?.replace(/\[\/?h\]/g, '')}
                    </div>
                    <div style={{ display: 'inline-block', background: t.accent, color: t.bg, padding: `${2 * (t.scale || 1)}px ${10 * (t.scale || 1)}px`, borderRadius: 4 * (t.scale || 1), fontSize: 10 * (t.scale || 1), fontWeight: 900, letterSpacing: 1 * (t.scale || 1), textTransform: 'uppercase', marginTop: 8 * (t.scale || 1) }}>
                        {slide?.tag || `Pillar ${index}`}
                    </div>
                </div>

                {cards.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 * (t.scale || 1), flex: 1 }}>
                        {cards.map((card, i) => (
                            <div key={i} className="bullet-item" style={{
                                background: t.cardBg, border: `${1 * (t.scale || 1)}px solid ${t.accent}50`, borderRadius: 12 * (t.scale || 1), padding: `${12 * (t.scale || 1)}px ${14 * (t.scale || 1)}px`,
                                display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
                            }}>
                                {/* Top colored edge on card */}
                                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3 * (t.scale || 1), background: t.accent }} />

                                <div style={{ fontSize: 13 * (t.scale || 1), fontWeight: 800, color: t.accent, marginBottom: 4 * (t.scale || 1), lineHeight: 1.2 }}>
                                    {parseBold(card.title, t.accent)}
                                </div>
                                <div style={{ fontSize: 11 * (t.scale || 1), color: t.sub, lineHeight: 1.4, flex: 1, overflow: 'hidden' }}>
                                    {parseBold(card.desc, t.sub)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontSize: 16 * (t.scale || 1), lineHeight: 1.6, color: t.sub, textAlign: 'center', padding: `0 ${20 * (t.scale || 1)}px`, marginTop: 40 * (t.scale || 1) }}>
                        {parseBold(slide?.body, t.accent)}
                    </div>
                )}

                <div style={{ position: 'absolute', bottom: 16 * (t.scale || 1), right: 30 * (t.scale || 1), fontSize: 10 * (t.scale || 1), fontWeight: 800, color: t.muted, letterSpacing: 1 * (t.scale || 1) }}>{index + 1} / {total}</div>
            </div>
        </div>
    );
}

function PilCTASlide({ slide, total, t, author, companyName, logo, website }) {
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${40 * (t.scale || 1)}px`, textAlign: 'center' }}>
            {/* Target reticle background */}
            <div style={{ position: 'absolute', inset: 0, border: `${1 * (t.scale || 1)}px solid ${t.muted}20`, margin: 20 * (t.scale || 1) }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1 * (t.scale || 1), background: `${t.muted}20` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1 * (t.scale || 1), background: `${t.muted}20` }} />

            <div style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ fontSize: 60 * (t.scale || 1), marginBottom: 20 * (t.scale || 1) }}>{slide?.icon}</div>
                <div style={{ fontSize: 40 * (t.scale || 1), fontWeight: 900, color: t.sub || t.text, letterSpacing: -1 * (t.scale || 1), lineHeight: 1.1, marginBottom: 16 * (t.scale || 1) }}>{slide?.title?.replace(/\[\/?h\]/g, '')}</div>
                {slide?.body && <div style={{ fontSize: 16 * (t.scale || 1), color: t.sub, marginBottom: 32 * (t.scale || 1), maxWidth: '90%', margin: `0 auto ${32 * (t.scale || 1)}px` }}>{parseBold(slide?.body, t.accent)}</div>}

                {slide?.cta && (
                    <div style={{ background: `linear-gradient(135deg, ${t.accent}, #ff55aa)`, color: '#fff', padding: `${16 * (t.scale || 1)}px ${36 * (t.scale || 1)}px`, borderRadius: 100 * (t.scale || 1), fontSize: 16 * (t.scale || 1), fontWeight: 900, letterSpacing: 1 * (t.scale || 1), textTransform: 'uppercase', display: 'inline-block', boxShadow: `0 ${(8 * (t.scale || 1))}px ${(32 * (t.scale || 1))}px ${t.accent}40`, marginBottom: 32 * (t.scale || 1) }}>
                        {slide?.cta}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 * (t.scale || 1) }}>
                    <div style={{ width: 32 * (t.scale || 1), height: 32 * (t.scale || 1), borderRadius: '50%', background: t.cardBg, border: `${2 * (t.scale || 1)}px solid ${t.accent}`, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 * (t.scale || 1) }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13 * (t.scale || 1), fontWeight: 700, color: t.sub || t.text }}>{author || 'Your Name'}</div>
                    <div style={{ width: 4 * (t.scale || 1), height: 4 * (t.scale || 1), background: t.muted, borderRadius: '50%' }} />
                    <div style={{ fontSize: 13 * (t.scale || 1), fontWeight: 700, color: t.accent }}>{companyName || 'Framework'}</div>
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 12 * (t.scale || 1), right: 20 * (t.scale || 1), fontSize: 10 * (t.scale || 1), color: t.muted, fontWeight: 800 }}>{total}/{total}</div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// VIRAL STORY SLIDES  (text-only, bold keywords, profile header)
// ════════════════════════════════════════════════════════════════════

// Parses **bold** markers into <strong> elements
function parseBold(text, boldColor) {
    if (!text) return null;
    const parts = creatorMarkup(text).split(/\*\*([\s\S]+?)\*\*/g);
    return parts.map((p, i) =>
        i % 2 === 1
            ? <strong key={i} style={{ fontWeight: 800, color: boldColor || 'inherit' }}>{p}</strong>
            : <React.Fragment key={i}>{p}</React.Fragment>
    );
}

function ViralStorySlide({ slide, index, total, t, author, companyName, logo, website }) {
    const sc = t.scale || 1;
    const isCover = index === 0;
    const isLast = index === total - 1;
    const rawBody = creatorPlainText(slide?.body || '');
    const rawParagraphs = rawBody.split(/\n{1,2}/).map(p => p.trim()).filter(Boolean);
    const paragraphs = rawParagraphs.length > 1
        ? rawParagraphs
        : rawBody.split(/(?<=[.!?])\s+/).reduce((groups, sentence) => {
            const current = groups[groups.length - 1] || '';
            const next = `${current} ${sentence}`.trim();
            if (!current || (next.split(/\s+/).length <= 32 && groups.length < 2)) {
                if (groups.length) groups[groups.length - 1] = next;
                else groups.push(next);
            } else groups.push(sentence);
            return groups;
        }, []).filter(Boolean);
    const avatarBg = t.accent === t.text ? t.text : t.accent;
    const avatarColor = t.bg;
    const sectionLabel = isCover ? 'OPENING TAKE' : isLast ? 'THE TAKEAWAY' : `FIELD NOTE 0${index}`;

    return (
        <div style={{
            width: t.width || 500, height: t.height || 500,
            background: t.bg, color: t.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            position: 'relative', overflow: 'hidden', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
        }}>
            <div style={{ height: 6 * sc, background: t.accent, flexShrink: 0 }} />
            <div style={{ padding: `${18 * sc}px ${26 * sc}px 0`, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* ── Profile header ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 * sc, flexShrink: 0 }}>
                <div style={{
                    width: 42 * sc, height: 42 * sc, borderRadius: '50%',
                    background: avatarBg, color: avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 15 * sc, flexShrink: 0, overflow: 'hidden',
                }}>
                    {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14 * sc, color: t.sub || t.text, lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 4 * sc }}>
                        {author || 'Your Name'}
                        <span style={{ fontSize: 13 * sc, color: t.accent }}>✔</span>
                    </div>
                    <div style={{ fontSize: 11 * sc, color: t.muted, marginTop: 1 }}>Just now · 🌐</div>
                </div>
                </div>
                <div style={{ height: 1, background: t.border || '#e0e0e0', margin: `${14 * sc}px 0 ${17 * sc}px`, flexShrink: 0 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 * sc, flexShrink: 0 }}>
                    <span style={{ fontSize: 10 * sc, letterSpacing: 1.8 * sc, fontWeight: 800, color: t.accent }}>{sectionLabel}</span>
                    <span style={{ fontSize: 11 * sc, color: t.muted, fontWeight: 700 }}>{index + 1} / {total}</span>
                </div>

                {/* ── Story content ── */}
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {slide?.title && (
                        <div style={{ fontSize: (isCover ? 29 : 23) * sc, fontWeight: 850, color: t.text, lineHeight: 1.12, letterSpacing: -0.5 * sc, marginBottom: 16 * sc, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
                            {parseBold(slide.title, t.boldColor || t.text)}
                        </div>
                    )}
                    <div style={{ width: 42 * sc, height: 4 * sc, background: t.accent, marginBottom: 16 * sc, borderRadius: 99 * sc, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 * sc, overflow: 'hidden', maxHeight: (isCover ? 16.5 : 15.5) * 1.42 * 3 * sc }}>
                        {paragraphs.map((para, pi) => (
                            <div key={pi} style={{ fontSize: (isCover ? 16.5 : 15.5) * sc, lineHeight: 1.42, color: t.sub || t.text, fontWeight: 400 }}>
                                {parseBold(para, t.boldColor || t.text)}
                            </div>
                        ))}
                        {slide?.bullets && slide.bullets.length > 0 && (
                            <ul style={{ paddingLeft: 18 * sc, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 * sc }}>
                                {slide.bullets.map((b, i) => <li key={i} style={{ fontSize: 15 * sc, lineHeight: 1.42, color: t.sub || t.text }}>{parseBold(b, t.boldColor || t.text)}</li>)}
                            </ul>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${t.border || '#e0e0e0'}`, padding: `${12 * sc}px 0 ${14 * sc}px`, marginTop: 12 * sc, flexShrink: 0 }}>
                    <span style={{ fontSize: 10 * sc, color: t.muted, fontWeight: 700, letterSpacing: 0.8 * sc }}>{companyName || 'FIELD NOTES'}</span>
                    <span style={{ fontSize: 11 * sc, color: t.accent, fontWeight: 800 }}>{isLast ? (slide?.cta || 'FOLLOW FOR MORE') : 'SWIPE FOR NEXT →'}</span>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// VIRAL X STYLE SLIDES (Tweet thread)
// ════════════════════════════════════════════════════════════════════

function parseXBold(text, color) {
    if (!text) return null;
    const normalized = text.replace(/\[\/?h\]/g, '**');
    const parts = normalized.split(/\*\*([\s\S]+?)\*\*/g);
    return parts.map((p, i) =>
        i % 2 === 1
            ? <strong key={i} style={{ fontWeight: 900, color: color || 'inherit' }}>{p}</strong>
            : <React.Fragment key={i}>{p}</React.Fragment>
    );
}

function ViralXSlide({ slide, index, total, t, author, companyName, logo, website }) {
    const sc = t.scale || 1;
    const isCover = index === 0;
    const cleanedBullets = (slide?.bullets || []).filter(b => b.trim()).map(b => b.replace(/^Point\s*\d+:\s*/i, ''));
    const hasBullets = cleanedBullets.length > 0;

    return (
        <div style={{
            width: t.width || 500,
            height: t.height || 500,
            background: t.bg,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            boxSizing: 'border-box',
            overflow: 'hidden',
            padding: `${14 * sc}px ${18 * sc}px ${10 * sc}px`,
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            gap: 0,
        }}>

            {/* ── ROW 1: Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 * sc, paddingBottom: 8 * sc }}>
                <div style={{ width: 34 * sc, height: 34 * sc, borderRadius: '50%', background: t.text, color: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13 * sc, flexShrink: 0, overflow: 'hidden' }}>
                    {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 * sc }}>
                        <span style={{ fontWeight: 700, fontSize: 13 * sc, color: t.text, whiteSpace: 'nowrap', lineHeight: 1.2 }}>{author || 'Your Name'}</span>
                        <span style={{ color: '#1d9bf0', fontSize: 13 * sc, display: 'flex', alignItems: 'center' }}>
                            <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.918 4 .585 0 1.14-.136 1.645-.377C10.058 22.125 11.004 22.5 12 22.5c.998 0 1.944-.375 2.898-.822.506.24 1.06.376 1.644.376 2.21 0 3.918-1.79 3.918-4 0-.174-.012-.344-.033-.513 1.158-.69 1.943-1.99 1.943-3.487zm-11.45 6.04L6.2 13.68l1.45-1.45 3.4 3.4 7.29-7.3 1.46 1.46-8.75 8.75z" /></svg>
                        </span>
                    </div>
                    <span style={{ fontSize: 11 * sc, color: t.sub, lineHeight: 1.2 }}>@{author?.replace(/\s+/g, '') || 'yourhandle'} · {index + 1}h</span>
                </div>
            </div>

            {/* ── ROW 2: Main Content — centered vertically in the remaining space ── */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden', padding: `${4 * sc}px 0` }}>
                {slide?.title && !slide?.title.includes('Hook line') && (
                    <div style={{ fontWeight: 800, fontSize: (isCover ? 24 : 20) * sc, lineHeight: 1.25, marginBottom: 7 * sc, color: t.text }}>
                        {parseXBold(slide.title, t.text)}
                    </div>
                )}
                <div style={{ fontSize: (isCover ? 17 : 15.5) * sc, lineHeight: 1.35, color: t.sub || t.text }}>
                    {hasBullets ? (
                        <ul style={{ paddingLeft: 14 * sc, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 * sc }}>
                            {cleanedBullets.slice(0, 3).map((b, i) => (
                                <li key={i} style={{ overflow: 'hidden' }}>{parseXBold(b, t.text)}</li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 * sc }}>
                            {slide?.body && slide.body.split('\n').map(p => p.trim()).filter(Boolean).slice(0, 2).map((p, i) => (
                                <div key={i}>{parseXBold(p, t.text)}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── ROW 3: Footer — always at bottom ── */}
            <div>
                <div style={{ borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: `${4 * sc}px 0`, display: 'flex', gap: 12 * sc, fontSize: 11 * sc, color: t.sub }}>
                    <span><strong style={{ color: t.text }}>{total * 3}.5K</strong> Retweets</span>
                    <span><strong style={{ color: t.text }}>{total * 15}K</strong> Likes</span>
                    <span><strong style={{ color: t.text }}>{total * 1.2}K</strong> Bookmarks</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${5 * sc}px 8% 0`, color: t.sub, fontSize: 13 * sc }}>
                    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" /></svg>
                    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" /></svg>
                    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" /></svg>
                    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z" /></svg>
                    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" /></svg>
                </div>
            </div>

        </div>
    );
}



// ─── Branding Overlay ────────────────────────────────────────────────────────
function BrandingOverlay({ website, t, scale = 1 }) {
    if (!website) return null;
    return (
        <div style={{
            position: 'absolute', bottom: 12 * scale, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
        }}>
            <span style={{ fontSize: 11 * scale, fontWeight: 700, color: t.sub || t.text, fontFamily: "'Inter', sans-serif", letterSpacing: 1 * scale }}>{website.replace(/^https?:\/\//, '')}</span>
        </div>
    );
}

// ─── LINKEDIN POST SLIDE ──────────────────────────────
function LiPostSlide({ slide, index, total, t, author, logo }) {
    const sc = t.scale || 1;
    function parseText(txt) {
        if (!txt) return null;
        const normalized = creatorMarkup(txt);
        const parts = normalized.split(/\*\*([\s\S]+?)\*\*/g);
        return parts.map((p, i) => i % 2 === 1 ? <strong key={i} style={{ fontWeight: 900, color: t.accent }}>{p}</strong> : <React.Fragment key={i}>{p}</React.Fragment>);
    }
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, background: t.bg, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', padding: 28 * sc, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 * sc, marginBottom: 20 * sc }}>
                <div style={{ width: 48 * sc, height: 48 * sc, borderRadius: '50%', background: t.accent, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.bg, fontWeight: 900, fontSize: 18 * sc }}>
                    {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'A').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 * sc, fontSize: 16 * sc, fontWeight: 700, color: t.text }}>
                        <span style={{ whiteSpace: 'nowrap' }}>{author || 'Your Name'}</span>
                        <svg viewBox="0 0 24 24" width={16 * sc} height={16 * sc} fill="#0a66c2" style={{ flexShrink: 0 }}><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.918 4 .585 0 1.14-.136 1.645-.377C10.058 22.125 11.004 22.5 12 22.5c.998 0 1.944-.375 2.898-.822.506.24 1.06.376 1.644.376 2.21 0 3.918-1.79 3.918-4 0-.174-.012-.344-.033-.513 1.158-.69 1.943-1.99 1.943-3.487zm-11.45 6.04L6.2 13.68l1.45-1.45 3.4 3.4 7.29-7.3 1.46 1.46-8.75 8.75z" /></svg>
                    </div>
                    <div style={{ fontSize: 12 * sc, color: t.muted }}>Just now • 🌍</div>
                </div>
            </div>
            <div style={{ fontFamily: "'Montserrat', 'Inter', sans-serif", fontSize: (index === 0 ? 36 : 22) * sc, fontWeight: index === 0 ? 900 : 800, color: t.text, lineHeight: 1.4, wordWrap: 'break-word', letterSpacing: index === 0 ? -0.5 * sc : 0 }}>
                {parseText(slide.title)}
            </div>
            {(slide.body || (slide.bullets && slide.bullets.length > 0)) && (
                <div style={{ marginTop: 24 * sc, fontSize: 20 * sc, color: t.sub || t.text, lineHeight: 1.6 }}>
                    {slide.body && <div>{parseText(slide.body)}</div>}
                    {slide.bullets && slide.bullets.length > 0 && <ul style={{ marginTop: 16 * sc, paddingLeft: 20 * sc }}>{slide.bullets.map((b, i) => <li key={i}>{parseText(b)}</li>)}</ul>}
                </div>
            )}
            {index === 0 && (
                <div style={{ position: 'absolute', bottom: 28 * sc, right: 28 * sc, color: t.muted, fontSize: 14 * sc, background: t.bg, padding: '6px 14px', borderRadius: 20, border: `1px solid ${t.border}` }}>
                    Continue Reading &gt;
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// LINKEDIN CREATOR POST SLIDE (profile pic + verified + bold body)
// ════════════════════════════════════════════════════════════════════

// ─── RETRO SERIF SLIDE ──────────────────────────────
function RetroSlide({ slide, index, total, t }) {
    const sc = t.scale || 1;
    function parseRetro(txt) {
        if (!txt) return null;
        const normalized = txt.replace(/\[\/?h\]/g, '**');
        const parts = normalized.split(/\*\*([\s\S]+?)\*\*/g);
        return parts.map((p, i) => i % 2 === 1 ? <span key={i} style={{ color: '#da745a' }}>{p}</span> : <span key={i}>{p}</span>);
    }
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, background: t.bg, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', padding: 40 * sc, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={100 * sc} height={100 * sc} viewBox="0 0 100 100" style={{ position: 'absolute', top: -10 * sc, left: -20 * sc, fill: '#da745a' }}>
                <path d="M50 0 L54 38 L90 20 L62 50 L90 80 L54 62 L50 100 L46 62 L10 80 L38 50 L10 20 L46 38 Z" />
            </svg>
            <div style={{ position: 'absolute', top: 20 * sc, right: 20 * sc, background: '#444', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12 * sc, fontWeight: 700 }}>
                {index + 1}/{total}
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: (index === 0 ? 46 : 30) * sc, textAlign: 'center', lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: -1 * sc, color: t.text }}>
                {parseRetro(slide.title)}
            </div>
            {slide.body && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 24 * sc, textAlign: 'center', marginTop: 16 * sc, fontStyle: 'italic', color: t.sub }}>{parseRetro(slide.body)}</div>}
            {slide.bullets && slide.bullets.length > 0 && (
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18 * sc, color: t.text, marginTop: 16 * sc, textAlign: 'center' }}>
                    {slide.bullets.map((b, i) => <div key={i}>• {parseRetro(b)}</div>)}
                </div>
            )}
            <div style={{ position: 'absolute', bottom: -20 * sc, right: -20 * sc, opacity: 0.9 }}>
                <svg width={140 * sc} height={140 * sc} viewBox="0 0 64 64" fill="none" stroke={t.text} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M32 8 C 45 8, 56 19, 56 32 C 56 45, 45 56, 32 56 C 19 56, 8 45, 8 32 C 8 19, 19 8, 32 8 Z" />
                    <circle cx="32" cy="32" r="12" fill={t.text} />
                </svg>
            </div>
        </div>
    );
}


// ─── NEON QUOTE SLIDE ──────────────────────────────
function QuoteSlide({ slide, index, total, t, author }) {
    const sc = t.scale || 1;
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, background: t.bg, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', padding: 40 * sc, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 130 * sc, color: t.accent, lineHeight: 0.5, marginBottom: 20 * sc, letterSpacing: -4 * sc, fontWeight: 900 }}>
                &ldquo;
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 34 * sc, lineHeight: 1.25, color: t.text, letterSpacing: -0.5 * sc }}>
                {slide.title?.replace(/[\[\/?h\]\*]/g, '')}
            </div>
            {slide.body && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 24 * sc, lineHeight: 1.4, color: t.text, marginTop: 16 * sc }}>{slide.body?.replace(/[\[\/?h\]\*]/g, '')}</div>}
            <div style={{ marginTop: 32 * sc, fontSize: 16 * sc, color: t.sub || '#ccc', fontFamily: "'Inter', sans-serif" }}>
                - {author || 'Inspirational Leader'}
            </div>
        </div>
    );
}

// ─── PROMO CARD SLIDE ──────────────────────────────
function PromoSlide({ slide, index, total, t }) {
    const sc = t.scale || 1;
    function parsePromo(txt) {
        if (!txt) return null;
        const normalized = txt.replace(/\[\/?h\]/g, '**');
        const parts = normalized.split(/\*\*([\s\S]+?)\*\*/g);
        return parts.map((p, i) => i % 2 === 1 ? <span key={i} style={{ color: t.accent }}>{p}</span> : <span key={i}>{p}</span>);
    }
    // Parse bullets for stat display
    const statBullets = (slide.bullets || []).filter(b => b.trim()).map(b => {
        const colonIdx = b.indexOf(':');
        const dashIdx = b.indexOf(' - ');
        if (colonIdx > 0 && colonIdx < 25) {
            return { stat: b.substring(0, colonIdx).trim(), label: b.substring(colonIdx + 1).trim() };
        } else if (dashIdx > 0 && dashIdx < 25) {
            return { stat: b.substring(0, dashIdx).trim(), label: b.substring(dashIdx + 3).trim() };
        }
        return { stat: '', label: b };
    });

    return (
        <div style={{ width: t.width || 500, height: t.height || 500, background: t.bg, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', padding: `${30 * sc}px ${20 * sc}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'-apple-system', sans-serif" }}>
            <div style={{ fontSize: 32 * sc, fontWeight: 800, textAlign: 'center', color: t.text, lineHeight: 1.2, marginTop: 20 * sc }}>
                {parsePromo(slide.title)}
            </div>

            {statBullets.length > 0 && statBullets[0].stat ? (
                <div style={{ width: '85%', background: '#fff', borderRadius: 12 * sc, margin: `${20 * sc}px 0`, padding: 16 * sc, boxShadow: `0 8px 32px ${t.accent}40`, display: 'flex', flexDirection: 'column', gap: 10 * sc, alignSelf: 'center' }}>
                    {statBullets.slice(0, 3).map((b, i) => (
                        <div key={i} className="bullet-item" style={{ display: 'flex', alignItems: 'center', gap: 10 * sc, paddingBottom: i < Math.min(statBullets.length, 3) - 1 ? 10 * sc : 0, borderBottom: i < Math.min(statBullets.length, 3) - 1 ? '1px solid #eee' : 'none' }}>
                            {b.stat && <div style={{ fontSize: 24 * sc, fontWeight: 900, color: t.accent, fontFamily: "'Anton', 'Impact', sans-serif", minWidth: 60 * sc }}>{b.stat}</div>}
                            <div style={{ fontSize: 13 * sc, color: '#333', fontWeight: 500, lineHeight: 1.4, flex: 1 }}>{b.label || b.stat}</div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 8 * sc, height: 40 * sc }}>
                        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 50">
                            <path d="M0 45 Q 20 40, 40 25 T 80 10 L 100 5" fill="none" stroke={t.accent} strokeWidth="3" />
                        </svg>
                    </div>
                </div>
            ) : (
                <div style={{ width: '85%', background: '#fff', borderRadius: 12 * sc, margin: `${20 * sc}px 0`, padding: `${20 * sc}px ${24 * sc}px`, boxShadow: `0 8px 32px ${t.accent}40`, display: 'flex', flexDirection: 'column', alignSelf: 'center' }}>
                    <div style={{ fontSize: 16 * sc, color: '#333', fontWeight: 500, lineHeight: 1.5, textAlign: 'center' }}>
                        {parseBold(slide?.body || slide?.bullets?.join(' '), t.accent)}
                    </div>
                </div>
            )}

            <div style={{ fontSize: 26 * sc, fontWeight: 700, textAlign: 'center', color: t.text, lineHeight: 1.3, marginBottom: 20 * sc }}>
                {slide.body || 'We will build the ultimate growth channel for you in 90 days.'}
            </div>
        </div>
    );
}






// ─── CHEAT SHEET SLIDE ──────────────────────────────
function CheatsheetSlide({ slide, index, total, t, author }) {
    const sc = t.scale || 1;
    const colors = ['#2563eb', '#d97706', '#059669', '#b45309', '#be185d', '#7c3aed'];

    return (
        <div style={{ width: t.width || 500, height: t.height || 500, background: t.bg, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', padding: 24 * sc, fontFamily: "'-apple-system', 'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 * sc, marginBottom: 16 * sc }}>
                <svg width={40 * sc} height={40 * sc} viewBox="0 0 100 100" style={{ fill: t.accent, flexShrink: 0 }}>
                    <path d="M50 0 L54 38 L90 20 L62 50 L90 80 L54 62 L50 100 L46 62 L10 80 L38 50 L10 20 L46 38 Z" />
                </svg>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 * sc, color: t.sub }}>The Anatomy of a</div>
                    <div style={{ fontSize: 20 * sc, fontWeight: 900, color: t.bg, background: t.accent, padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>
                        {slide.title?.replace(/[\[\/?h\]\*]/g, '')}
                    </div>
                </div>
                <div style={{ background: '#333', color: '#fff', borderRadius: '50px', padding: '4px 12px', fontSize: 12 * sc }}>{index + 1}/{total}</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12 * sc, padding: 16 * sc, boxShadow: '0 4px 16px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 12 * sc, flex: 1, overflow: 'hidden' }}>
                {slide.bullets && slide.bullets.length > 0 ? slide.bullets.slice(0, 5).map((bullet, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 12 * sc, paddingBottom: i !== slide.bullets.length - 1 ? 12 * sc : 0, borderBottom: i !== slide.bullets.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ width: 4 * sc, background: colors[i % colors.length], borderRadius: 2 }} />
                        <div style={{ flex: 1, fontSize: 13 * sc, color: '#333', lineHeight: 1.4 }}>{bullet?.replace(/[\[\/?h\]\*]/g, '')}</div>
                        <div style={{ fontSize: 14 * sc, fontWeight: 800, color: colors[i % colors.length], width: 80 * sc }}>Step {i + 1}</div>
                    </div>
                )) : (
                    <div style={{ fontSize: 14 * sc, color: t.sub }}>{slide.body}</div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 * sc, marginTop: 16 * sc }}>
                <div style={{ width: 30 * sc, height: 30 * sc, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 * sc, color: t.bg, fontWeight: 700 }}>{author ? author.charAt(0) : 'A'}</div>
                <div style={{ fontSize: 12 * sc, color: t.sub, fontWeight: 700 }}>{author || 'Author Name'}</div>
            </div>
        </div>
    );
}

// ─── CLASSIC TWEET SLIDE ──────────────────────────────
function TweetClassicSlide({ slide, index, total, t, author, logo }) {
    const sc = t.scale || 1;
    function parseXBold(text) {
        if (!text) return null;
        let normalized = text.replace(/\[\/?h\]/g, '**');
        const parts = normalized.split(/\*\*([\s\S]+?)\*\*/g);
        return parts.map((p, i) => i % 2 === 1 ? <strong key={i} style={{ fontWeight: 900, color: t.accent }}>{p}</strong> : <span key={i}>{p}</span>);
    }
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, background: t.bg, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ flex: 1, padding: 32 * sc, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 * sc, marginBottom: 20 * sc }}>
                    <div style={{ width: 48 * sc, height: 48 * sc, borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 * sc, flexShrink: 0, overflow: 'hidden' }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'FI').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 * sc }}>
                            <span style={{ fontWeight: 800, fontSize: 17 * sc, color: '#0f1419' }}>{author || 'Your Name'}</span>
                            <span style={{ color: '#1d9bf0', fontSize: 17 * sc, display: 'flex', alignItems: 'center' }}>
                                <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.918 4 .585 0 1.14-.136 1.645-.377C10.058 22.125 11.004 22.5 12 22.5c.998 0 1.944-.375 2.898-.822.506.24 1.06.376 1.644.376 2.21 0 3.918-1.79 3.918-4 0-.174-.012-.344-.033-.513 1.158-.69 1.943-1.99 1.943-3.487zm-11.45 6.04L6.2 13.68l1.45-1.45 3.4 3.4 7.29-7.3 1.46 1.46-8.75 8.75z" /></svg>
                            </span>
                        </div>
                        <span style={{ fontSize: 15 * sc, color: '#536471' }}>@{author?.replace(/\s+/g, '')?.toLowerCase() || 'yourhandle'} · {index + 1}h</span>
                    </div>
                </div>

                <div style={{ fontSize: 24 * sc, lineHeight: 1.45, color: '#0f1419', flex: 1, letterSpacing: -0.2 * sc }}>
                    {slide.title && !slide.title.includes('Hook line') && <div style={{ marginBottom: 16 * sc }}>{parseXBold(slide.title)}</div>}
                    {slide.body && slide.body.split('\n').filter(Boolean).map((p, i) => (
                        <div key={i} style={{ marginBottom: 14 * sc }}>{parseXBold(p)}</div>
                    ))}
                    {slide.bullets && slide.bullets.length > 0 && <ul style={{ paddingLeft: 20 * sc, margin: 0 }}>{slide.bullets.map((b, i) => <li style={{ marginBottom: 10 * sc }} key={i}>{parseXBold(b)}</li>)}</ul>}
                </div>

                <div style={{ borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: `${16 * sc}px 0`, marginTop: 24 * sc, display: 'flex', gap: 24 * sc, fontSize: 16 * sc, color: t.sub }}>
                    <span><strong style={{ color: t.text }}>{total * 3}.5K</strong> Retweets</span>
                    <span><strong style={{ color: t.text }}>{total * 15}K</strong> Likes</span>
                    <span><strong style={{ color: t.text }}>{total * 1.2}K</strong> Bookmarks</span>
                </div>
            </div>
        </div>
    );
}

// ─── DARK TWEET SLIDE ──────────────────────────────
function TweetDarkSlide({ slide, index, total, t, author, logo }) {
    const sc = t.scale || 1;
    function parseXBold(text) {
        if (!text) return null;
        let normalized = text.replace(/\[\/?h\]/g, '**');
        const parts = normalized.split(/\*\*([\s\S]+?)\*\*/g);
        return parts.map((p, i) => i % 2 === 1 ? <strong key={i} style={{ fontWeight: 900, color: t.text }}>{p}</strong> : <span key={i}>{p}</span>);
    }
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, background: t.bg, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", padding: 32 * sc }}>
            <div style={{ flex: 1, padding: 32 * sc, border: `1px solid ${t.border}`, borderRadius: 24 * sc, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 * sc, marginBottom: 20 * sc }}>
                    <div style={{ width: 48 * sc, height: 48 * sc, borderRadius: '50%', background: '#1c1c1c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 * sc, flexShrink: 0, overflow: 'hidden' }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'FI').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 * sc }}>
                            <span style={{ fontWeight: 800, fontSize: 17 * sc, color: t.text, whiteSpace: 'nowrap', lineHeight: 1.2 }}>{author || 'Your Name'}</span>
                            <span style={{ color: t.accent, fontSize: 17 * sc, display: 'flex', alignItems: 'center', marginLeft: 4 * sc, flexShrink: 0 }}>
                                <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.918 4 .585 0 1.14-.136 1.645-.377C10.058 22.125 11.004 22.5 12 22.5c.998 0 1.944-.375 2.898-.822.506.24 1.06.376 1.644.376 2.21 0 3.918-1.79 3.918-4 0-.174-.012-.344-.033-.513 1.158-.69 1.943-1.99 1.943-3.487zm-11.45 6.04L6.2 13.68l1.45-1.45 3.4 3.4 7.29-7.3 1.46 1.46-8.75 8.75z" /></svg>
                            </span>
                        </div>
                        <span style={{ fontSize: 15 * sc, color: t.sub, whiteSpace: 'nowrap', lineHeight: 1.2, marginTop: 2 * sc }}>@{author?.replace(/\s+/g, '')?.toLowerCase() || 'yourhandle'} · {index + 1}/{total}</span>
                    </div>
                </div>

                <div style={{ fontSize: 24 * sc, lineHeight: 1.45, color: t.text, flex: 1, letterSpacing: -0.2 * sc }}>
                    {slide.title && !slide.title.includes('Hook line') && <div style={{ marginBottom: 16 * sc }}>{parseXBold(slide.title)}</div>}
                    {slide.body && slide.body.split('\n').filter(Boolean).map((p, i) => (
                        <div key={i} style={{ marginBottom: 14 * sc }}>{parseXBold(p)}</div>
                    ))}
                    {slide.bullets && slide.bullets.length > 0 && <ul style={{ paddingLeft: 20 * sc, margin: 0 }}>{slide.bullets.map((b, i) => <li style={{ marginBottom: 10 * sc }} key={i}>{parseXBold(b)}</li>)}</ul>}
                </div>
            </div>
        </div>
    );
}

// ─── YT THUMBNAIL SLIDE ──────────────────────────────
function YTThumbSlide({ slide, index, total, t }) {
    const sc = t.scale || 1;
    function parseHighlights(txt) {
        if (!txt) return null;
        let normalized = txt.replace(/\[\/?h\]/gi, '**');
        const parts = normalized.split(/\*\*([\s\S]+?)\*\*/g);
        return parts.map((p, i) => i % 2 === 1 ? <span key={i} style={{ color: t.accent }}>{p}</span> : <span key={i}>{p}</span>);
    }
    return (
        <div style={{ width: t.width || 1280, height: t.height || 720, background: t.bg, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', padding: 60 * sc, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: "'Anton', 'Impact', sans-serif" }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: '40%', background: `linear-gradient(90deg, ${t.bg}, transparent)`, zIndex: 1 }} />

            <div style={{ position: 'relative', zIndex: 10, maxWidth: '85%' }}>
                <div style={{ fontSize: 130 * sc, color: t.text, lineHeight: 1.05, textTransform: 'uppercase', textShadow: `0 8px 30px rgba(0,0,0,0.8)` }}>
                    {parseHighlights(slide.title)}
                </div>
                {slide.body && (
                    <div style={{ fontSize: 40 * sc, color: '#ffffff', background: t.accent, display: 'inline-block', padding: '10px 20px', marginTop: 30 * sc, transform: 'rotate(-2deg)' }}>
                        {slide.body}
                    </div>
                )}
            </div>
            <div style={{ position: 'relative', zIndex: 10, alignSelf: 'flex-start', marginTop: 30 * sc, display: 'flex', gap: 10 * sc }}>
                {slide.bullets && slide.bullets.slice(0, 3).map((b, i) => (
                    <div key={i} style={{ background: '#fff', color: '#000', padding: '8px 16px', borderRadius: 8, fontSize: 32 * sc }}>{b.replace(/[\[\/?h\]\*]/g, '')}</div>
                ))}
            </div>
        </div>
    );
}

// ─── AI CLONE SLIDE COMPONENT ─────────────────────────────────────────────────
function AiCloneSlide({ slide, index, total, t, author, companyName, logo, website }) {
    if (!t.customHtml) {
        return (
            <div style={{ width: t.width || 500, height: t.height || 500, background: t.bg || '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
                <h2 style={{ color: t.text || '#000', fontSize: 24, fontWeight: 800 }}>Upload an Image First</h2>
                <p style={{ color: t.sub || '#666', fontSize: 13, marginTop: 8 }}>The AI will extract the exact structure to render your slides.</p>
            </div>
        );
    }

    let bulletsHtml = '';
    if (slide.bullets && slide.bullets.length > 0) {
        bulletsHtml = slide.bullets.map(b => `<div style="margin-bottom: 12px; display: flex; text-align: left;"><span style="color: ${t.accent}; margin-right: 8px; font-weight: bold;">•</span><span style="color: ${t.text || '#000'}">${b}</span></div>`).join('');
    }

    let html = t.customHtml
        .replace(/\{\{TITLE\}\}/gi, slide.title ? slide.title.replace(/[\[\/?h\]]/g, '') : '')
        .replace(/\{\{BODY\}\}/gi, slide.body || '')
        .replace(/\{\{BULLETS_HTML\}\}/gi, bulletsHtml)
        .replace(/\{\{AUTHOR\}\}/gi, author || 'Your Name')
        .replace(/\{\{COMPANY\}\}/gi, companyName || '')
        .replace(/\{\{WEBSITE\}\}/gi, website || '')
        .replace(/\{\{SLIDE_NUMBER\}\}/gi, String(index + 1))
        .replace(/\{\{TOTAL_SLIDES\}\}/gi, String(total))
        .replace(/\{\{TAG\}\}/gi, slide.tag || '')
        .replace(/\{\{ICON\}\}/gi, slide.icon || '')
        .replace(/\{\{LOGO\}\}/gi, logo ? `<img src="${logo}" style="max-height: 24px; max-width: 100px; object-fit: contain" />` : '');

    return (
        <div
            style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

// ════════════════════════════════════════════════════════════════════
// INFOGRAPHIC SLIDES (Timeline · Facts · Stats · Images)
// ════════════════════════════════════════════════════════════════════

function InfographicCoverSlide({ slide, total, t, author, companyName, logo, website }) {
    const sc = t.scale || 1;
    const hasHighlight = /\[\/?h\]/gi.test(slide?.title);
    const tricolor = t.id === 'infog-tricolor';
    return (
        <div style={{
            width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden',
            background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
        }}>
            {/* Background image if slide has one */}
            {slide?.image && (
                <div style={{
                    position: 'absolute', right: 0, bottom: 0,
                    width: '45%', height: '65%',
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)',
                    WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)',
                    opacity: 0.8, pointerEvents: 'none',
                }} />
            )}
            {/* Decorative accent line at top */}
            {tricolor ? (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6 * sc, display: 'flex' }}>
                    <div style={{ flex: 1, background: '#FF9933' }} />
                    <div style={{ flex: 1, background: '#ffffff' }} />
                    <div style={{ flex: 1, background: '#138808' }} />
                </div>
            ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4 * sc, background: `linear-gradient(90deg, ${t.accent}, ${t.accent}66)` }} />
            )}
            {/* Radial glow */}
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 50% at 30% 40%, ${t.accent}15, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: `${36 * sc}px ${32 * sc}px`, zIndex: 10 }}>
                {/* Top bar: company + slide count */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 * sc }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 * sc }}>
                        {logo && <div style={{ width: 28 * sc, height: 28 * sc, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>}
                        <span style={{ fontSize: 11 * sc, fontWeight: 800, color: t.accent, letterSpacing: 1.5 * sc, textTransform: 'uppercase' }}>
                            {companyName || 'Infographic'}
                        </span>
                    </div>
                    <div style={{ fontSize: 10 * sc, color: t.muted, fontWeight: 700 }}>{total} slides</div>
                </div>
                {/* Giant headline */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{
                        fontFamily: "'Montserrat', 'Inter', sans-serif",
                        fontSize: ((slide?.title?.replace(/\[\/?h\]/gi, '').length || 0) > 50 ? 38 : (slide?.title?.replace(/\[\/?h\]/gi, '').length || 0) > 30 ? 48 : 60) * sc,
                        fontWeight: 900,
                        lineHeight: 1.1, color: t.text,
                        textTransform: 'uppercase', letterSpacing: -1 * sc,
                    }}>
                        {hasHighlight
                            ? parseHighlights(slide?.title, t.accent, t.bg, '', t.accent, 'magazine')
                            : slide?.title?.replace(/\[\/?h\]/gi, '')}
                    </div>
                    {/* Accent divider */}
                    <div style={{ height: 4 * sc, width: 60 * sc, background: t.accent, borderRadius: 2 * sc, marginTop: 18 * sc, marginBottom: 14 * sc }} />
                    {/* Body tagline */}
                    {slide?.body && (
                        <div style={{ fontSize: 15 * sc, lineHeight: 1.7, color: t.sub, maxWidth: '80%', fontStyle: 'italic' }}>
                            {slide.body}
                        </div>
                    )}
                </div>
                {/* Author row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 * sc }}>
                    <div style={{
                        width: 36 * sc, height: 36 * sc, borderRadius: '50%',
                        background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 13 * sc, color: t.bg, flexShrink: 0, overflow: 'hidden',
                    }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: 12 * sc, fontWeight: 800, color: t.text }}>{author || 'Your Name'}</div>
                        <div style={{ fontSize: 10 * sc, color: t.muted }}>Swipe to explore →</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 11 * sc, fontWeight: 700, color: t.muted }}>1 / {total}</div>
                </div>
            </div>
            {/* Bottom accent line */}
            {tricolor ? (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 * sc, display: 'flex' }}>
                    <div style={{ flex: 1, background: '#FF9933' }} />
                    <div style={{ flex: 1, background: '#ffffff' }} />
                    <div style={{ flex: 1, background: '#138808' }} />
                </div>
            ) : (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * sc, background: t.accent }} />
            )}
        </div>
    );
}

function InfographicTimelineSlide({ slide, index, total, t, author, logo }) {
    const sc = t.scale || 1;
    const tricolor = t.id === 'infog-tricolor';
    const rawBullets = (slide?.bullets && slide.bullets.length > 0) 
        ? slide.bullets 
        : (slide?.body ? slide.body.split('\n') : []);
        
    const timelineItems = rawBullets.filter(b => b.trim() && b.trim() !== '-').map((b, idx) => {
        let text = b.trim();
        if (text.startsWith('- ')) text = text.substring(2).trim();
        if (text.startsWith('* ')) text = text.substring(2).trim();

        const colonIdx = text.indexOf(':');
        const dashIdx = text.indexOf(' - ');
        if (colonIdx > 0 && colonIdx < 40) {
            return { date: text.substring(0, colonIdx).replace(/\*\*/g, '').trim(), desc: text.substring(colonIdx + 1).trim() };
        } else if (dashIdx > 0 && dashIdx < 40) {
            return { date: text.substring(0, dashIdx).replace(/\*\*/g, '').trim(), desc: text.substring(dashIdx + 3).trim() };
        }
        return { date: `STEP ${idx + 1}`, desc: text };
    });

    const accentColors = tricolor ? ['#FF9933', '#138808', '#000080', '#FF9933', '#138808', '#000080'] : null;

    return (
        <div style={{
            width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden',
            background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
        }}>
            {/* Background image */}
            {slide?.image && (
                <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0,
                    width: '35%',
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    maskImage: 'linear-gradient(to left, rgba(0,0,0,0.45), transparent)',
                    WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.45), transparent)',
                    opacity: 0.7, pointerEvents: 'none',
                }} />
            )}
            {/* Top bar */}
            {tricolor ? (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4 * sc, display: 'flex' }}>
                    <div style={{ flex: 1, background: '#FF9933' }} />
                    <div style={{ flex: 1, background: '#ffffff' }} />
                    <div style={{ flex: 1, background: '#138808' }} />
                </div>
            ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4 * sc, background: `linear-gradient(90deg, ${t.bg}, ${t.accent}, ${t.bg})` }} />
            )}

            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: `${24 * sc}px ${28 * sc}px`, zIndex: 10 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 * sc }}>
                    <div style={{
                        fontSize: 10 * sc, fontWeight: 800, letterSpacing: 2 * sc, color: t.accent,
                        textTransform: 'uppercase', borderBottom: `2px solid ${t.accent}`, paddingBottom: 2 * sc,
                    }}>
                        {slide?.tag || `Timeline`}
                    </div>
                    <div style={{ fontSize: 11 * sc, color: t.muted, fontWeight: 700 }}>{index + 1} / {total}</div>
                </div>

                {/* Title */}
                <div style={{
                    fontFamily: "'Montserrat', 'Inter', sans-serif",
                    fontSize: (slide?.title?.length > 45 ? 26 : slide?.title?.length > 25 ? 32 : 38) * sc,
                    fontWeight: 900,
                    lineHeight: 1.1, color: t.text,
                    textTransform: 'uppercase', letterSpacing: -0.5 * sc,
                    marginBottom: 14 * sc,
                }}>
                    {parseBold(slide?.title?.replace(/\[\/?h\]/gi, ''), t.accent)}
                </div>
                <div style={{ height: 3 * sc, width: 40 * sc, background: t.accent, borderRadius: 2, marginBottom: 16 * sc }} />

                {/* Timeline items */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 * sc, overflow: 'hidden' }}>
                    {timelineItems.map((item, i) => {
                        const itemAccent = accentColors ? accentColors[i % accentColors.length] : t.accent;
                        return (
                            <div key={i} className="bullet-item" style={{ display: 'flex', gap: 12 * sc, alignItems: 'flex-start' }}>
                                {/* Timeline connector */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 18 * sc }}>
                                    <div style={{
                                        width: 12 * sc, height: 12 * sc, borderRadius: '50%',
                                        background: itemAccent, border: `2px solid ${itemAccent}`,
                                        boxShadow: `0 0 8px ${itemAccent}50`,
                                    }} />
                                    {i < timelineItems.length - 1 && (
                                        <div style={{ width: 2 * sc, flex: 1, background: `${t.muted}40`, marginTop: 4 * sc }} />
                                    )}
                                </div>
                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {item.date && (
                                        <div style={{
                                            fontFamily: "'Montserrat', 'Inter', sans-serif",
                                            fontSize: (item.date.length > 10 ? 18 : 24) * sc,
                                            fontWeight: 900, color: itemAccent,
                                            lineHeight: 1.1, marginBottom: 4 * sc,
                                            textTransform: 'uppercase', letterSpacing: 0.5 * sc,
                                        }}>
                                            {item.date}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 13 * sc, color: t.sub, lineHeight: 1.5, fontWeight: 500 }}>
                                        {parseBold(item.desc, t.text)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 * sc, paddingTop: 8 * sc, borderTop: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 10 * sc, fontWeight: 700, color: t.muted }}>SWIPE →</div>
                </div>
            </div>
            {tricolor ? (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * sc, display: 'flex' }}>
                    <div style={{ flex: 1, background: '#FF9933' }} />
                    <div style={{ flex: 1, background: '#ffffff' }} />
                    <div style={{ flex: 1, background: '#138808' }} />
                </div>
            ) : (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * sc, background: t.accent, opacity: 0.5 }} />
            )}
        </div>
    );
}

function InfographicStatsSlide({ slide, index, total, t, author, logo }) {
    const sc = t.scale || 1;
    const tricolor = t.id === 'infog-tricolor';
    // Parse bullets into stat cards: "Number: Label" or "Stat - Description"
    const rawBullets = (slide?.bullets && slide.bullets.length > 0) 
        ? slide.bullets 
        : (slide?.body ? slide.body.split('\n') : []);
        
    const stats = rawBullets.filter(b => b.trim() && b.trim() !== '-').map((b, idx) => {
        let text = b.trim();
        if (text.startsWith('- ')) text = text.substring(2).trim();
        if (text.startsWith('* ')) text = text.substring(2).trim();

        const colonIdx = text.indexOf(':');
        const dashIdx = text.indexOf(' - ');
        
        if (colonIdx > 0 && colonIdx < 40) {
            return { stat: text.substring(0, colonIdx).replace(/\*\*/g, '').trim(), label: text.substring(colonIdx + 1).trim() };
        } else if (dashIdx > 0 && dashIdx < 40) {
            return { stat: text.substring(0, dashIdx).replace(/\*\*/g, '').trim(), label: text.substring(dashIdx + 3).trim() };
        }
        
        const firstWord = text.split(/\s+/)[0];
        const isNumeric = /^[\d$€£%+.,]+[KkMmBb%+x]*$/.test(firstWord.replace(/\*\*/g, ''));
        if (isNumeric) {
            return { stat: firstWord.replace(/\*\*/g, ''), label: text.substring(firstWord.length).trim() };
        }
        
        return { stat: `0${idx + 1}`, label: text };
    });

    const accentColors = tricolor ? ['#FF9933', '#138808', '#000080'] : null;

    return (
        <div style={{
            width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden',
            background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
        }}>
            {/* Background image */}
            {slide?.image && (
                <div style={{
                    position: 'absolute', left: 0, bottom: 0, width: '100%', height: '60%',
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    maskImage: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                    WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                    opacity: 0.5, pointerEvents: 'none',
                }} />
            )}
            {tricolor ? (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4 * sc, display: 'flex' }}>
                    <div style={{ flex: 1, background: '#FF9933' }} />
                    <div style={{ flex: 1, background: '#ffffff' }} />
                    <div style={{ flex: 1, background: '#138808' }} />
                </div>
            ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4 * sc, background: `linear-gradient(90deg, ${t.bg}, ${t.accent}, ${t.bg})` }} />
            )}

            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: `${24 * sc}px ${28 * sc}px`, zIndex: 10 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 * sc }}>
                    <div style={{ fontSize: 10 * sc, fontWeight: 800, letterSpacing: 2 * sc, color: t.accent, textTransform: 'uppercase' }}>
                        {slide?.tag || 'Key Facts'}
                    </div>
                    <div style={{ fontSize: 11 * sc, color: t.muted, fontWeight: 700 }}>{index + 1} / {total}</div>
                </div>

                <div style={{
                    fontFamily: "'Montserrat', 'Inter', sans-serif",
                    fontSize: (slide?.title?.length > 40 ? 24 : 30) * sc,
                    fontWeight: 900,
                    lineHeight: 1.1, color: t.text, textTransform: 'uppercase',
                    letterSpacing: -0.5 * sc, marginBottom: 14 * sc,
                }}>
                    {parseBold(slide?.title?.replace(/\[\/?h\]/gi, ''), t.accent)}
                </div>
                <div style={{ height: 3 * sc, width: 40 * sc, background: t.accent, borderRadius: 2, marginBottom: 16 * sc }} />

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: stats.length > 4 ? '1fr 1fr' : stats.length === 3 ? '1fr 1fr' : '1fr 1fr', gap: 10 * sc, flex: 1, alignContent: 'start' }}>
                    {stats.map((s, i) => {
                        const cardAccent = accentColors ? accentColors[i % accentColors.length] : t.accent;
                        return (
                            <div key={i} className="bullet-item" style={{
                                background: t.cardBg || `${t.accent}08`, border: `1px solid ${cardAccent}40`,
                                borderRadius: 12 * sc, padding: `${14 * sc}px ${16 * sc}px`,
                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden',
                                gridColumn: (stats.length === 3 && i === 2) ? 'span 2' : undefined,
                            }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 * sc, background: cardAccent }} />
                                <div style={{
                                    fontFamily: "'Montserrat', 'Inter', sans-serif",
                                    fontSize: (s.stat && s.stat.length > 6 ? 20 : 28) * sc, fontWeight: 900, color: cardAccent,
                                    lineHeight: 1.1, marginBottom: 4 * sc,
                                }}>
                                    {s.stat}
                                </div>
                                <div style={{ fontSize: 11 * sc, color: t.sub, lineHeight: 1.4, fontWeight: 500 }}>
                                    {parseBold(s.label, t.text)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Body text below stats */}
                {slide?.body && (!slide?.bullets || stats.length === 0) && (
                    <div style={{ fontSize: 15 * sc, lineHeight: 1.65, color: t.sub, marginTop: 12 * sc }}>
                        {parseBold(slide.body, t.text)}
                    </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 * sc }}>
                    <div style={{ fontSize: 10 * sc, fontWeight: 800, color: t.muted, letterSpacing: 1 * sc }}>NEXT →</div>
                </div>
            </div>
            {tricolor ? (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * sc, display: 'flex' }}>
                    <div style={{ flex: 1, background: '#FF9933' }} />
                    <div style={{ flex: 1, background: '#ffffff' }} />
                    <div style={{ flex: 1, background: '#138808' }} />
                </div>
            ) : (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * sc, background: t.accent, opacity: 0.4 }} />
            )}
        </div>
    );
}

function InfographicCTASlide({ slide, total, t, author, companyName, logo, website }) {
    const sc = t.scale || 1;
    const tricolor = t.id === 'infog-tricolor';
    return (
        <div style={{
            width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden',
            background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
        }}>
            {/* Background image */}
            {slide?.image && (
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${slide.image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, transparent 80%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, transparent 80%)',
                    opacity: 0.6, pointerEvents: 'none',
                }} />
            )}
            {/* Top gradient glow */}
            <div style={{
                position: 'absolute', top: -50 * sc, left: '50%', transform: 'translateX(-50%)',
                width: 300 * sc, height: 300 * sc, borderRadius: '50%',
                background: t.accent, filter: `blur(${100 * sc}px)`, opacity: 0.15, pointerEvents: 'none',
            }} />
            {/* Decorative rings */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 350 * sc, height: 350 * sc, borderRadius: '50%', border: `1px solid ${t.accent}12`, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 250 * sc, height: 250 * sc, borderRadius: '50%', border: `1px solid ${t.accent}08`, pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${36 * sc}px`, textAlign: 'center', gap: 18 * sc }}>
                {/* Icon */}
                <div style={{ fontSize: 52 * sc, lineHeight: 1 }}>{slide?.icon}</div>

                {/* Giant headline */}
                <div style={{
                    fontFamily: "'Montserrat', 'Inter', sans-serif",
                    fontSize: (slide?.title?.length > 30 ? 34 : 44) * sc,
                    fontWeight: 900,
                    lineHeight: 1.1, color: t.text,
                    textTransform: 'uppercase', letterSpacing: -0.5 * sc,
                }}>
                    {slide?.title?.replace(/\[\/?h\]/gi, '')}
                </div>

                <div style={{ height: 4 * sc, width: 50 * sc, background: t.accent, borderRadius: 2 * sc }} />

                {slide?.body && <div style={{ fontSize: 15 * sc, lineHeight: 1.7, color: t.sub, maxWidth: '85%' }}>{slide.body}</div>}

                {/* CTA Button */}
                {slide?.cta && (
                    <div style={{
                        marginTop: 8 * sc,
                        background: t.accent, color: t.bg,
                        padding: `${14 * sc}px ${32 * sc}px`,
                        borderRadius: 8 * sc, fontSize: 14 * sc, fontWeight: 900,
                        textTransform: 'uppercase', letterSpacing: 1 * sc,
                        boxShadow: `0 ${6 * sc}px ${24 * sc}px ${t.accent}40`,
                    }}>
                        {slide.cta}
                    </div>
                )}

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 * sc, marginTop: 8 * sc }}>
                    <div style={{
                        width: 32 * sc, height: 32 * sc, borderRadius: '50%',
                        background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 12 * sc, color: t.bg, flexShrink: 0, overflow: 'hidden',
                    }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12 * sc, fontWeight: 700, color: t.sub }}>
                        {author || 'Your Name'}{companyName ? ` · ${companyName}` : ''}
                    </span>
                    <span style={{ fontSize: 11 * sc, color: t.muted }}>{total}/{total}</span>
                </div>
            </div>
            {tricolor ? (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 * sc, display: 'flex' }}>
                    <div style={{ flex: 1, background: '#FF9933' }} />
                    <div style={{ flex: 1, background: '#ffffff' }} />
                    <div style={{ flex: 1, background: '#138808' }} />
                </div>
            ) : (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * sc, background: t.accent }} />
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// GRADIENT WAVE SLIDES
// ════════════════════════════════════════════════════════════════════
function GradientSlide({ slide, index, total, t, author, companyName, logo }) {
    const sc = t.scale || 1;
    const grad = t.accentGrad || t.accent;
    const isCover = index === 0;
    const isCTA = index === total - 1;
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            {/* Giant gradient blob */}
            <div style={{ position: 'absolute', top: isCover ? '-10%' : '60%', left: isCover ? '-10%' : '50%', width: 340 * sc, height: 340 * sc, borderRadius: '50%', background: grad, filter: `blur(${90 * sc}px)`, opacity: 0.35, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: 220 * sc, height: 220 * sc, borderRadius: '50%', background: grad, filter: `blur(${70 * sc}px)`, opacity: 0.2, pointerEvents: 'none' }} />
            {/* Top bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4 * sc, background: grad }} />
            <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: `${32 * sc}px ${36 * sc}px` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 * sc }}>
                    <div style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 11 * sc, fontWeight: 800, letterSpacing: 2 * sc, textTransform: 'uppercase' }}>{slide?.tag || (isCover ? '✦ Featured' : isCTA ? '✦ Done' : `✦ Point ${index}`)}</div>
                    <div style={{ fontSize: 11 * sc, color: t.muted, fontWeight: 700 }}>{index + 1}/{total}</div>
                </div>
                <div style={{ fontSize: (isCover ? (slide?.title?.length > 40 ? 36 : 48) : (slide?.title?.length > 40 ? 26 : 32)) * sc, fontWeight: 900, lineHeight: 1.15, color: t.text, letterSpacing: -0.5 * sc, marginBottom: 18 * sc, flex: isCTA ? 0 : 1 }}>
                    {isCover ? <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{slide?.title?.replace(/\[\/?\w\]/g, '')}</span> : slide?.title?.replace(/\[\/?\w\]/g, '')}
                </div>
                {!isCTA && slide?.bullets?.filter(b => b.trim()).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 * sc }}>
                        {slide.bullets.filter(b => b.trim()).map((b, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12 * sc, alignItems: 'flex-start' }}>
                                <div style={{ width: 24 * sc, height: 24 * sc, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 * sc, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                                <p style={{ fontSize: 14 * sc, lineHeight: 1.6, color: t.sub, margin: 0 }}>{parseBold(b, t.accent)}</p>
                            </div>
                        ))}
                    </div>
                )}
                {!isCTA && slide?.body && (!slide?.bullets || slide.bullets.filter(b => b.trim()).length === 0) && (
                    <p style={{ fontSize: 16 * sc, lineHeight: 1.7, color: t.sub, margin: 0 }}>{parseBold(slide.body, t.accent)}</p>
                )}
                {isCTA && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 18 * sc }}>
                        <div style={{ fontSize: 44 * sc }}>{slide?.icon || '🚀'}</div>
                        <div style={{ fontSize: 28 * sc, fontWeight: 900, color: t.text }}>{slide?.title?.replace(/\[\/?\w\]/g, '')}</div>
                        <div style={{ height: 3 * sc, width: 60 * sc, background: grad, borderRadius: 2 * sc }} />
                        {slide?.body && <p style={{ fontSize: 15 * sc, color: t.sub, lineHeight: 1.6 }}>{slide.body}</p>}
                        {slide?.cta && <div style={{ background: grad, color: '#fff', borderRadius: 50 * sc, padding: `${14 * sc}px ${32 * sc}px`, fontSize: 14 * sc, fontWeight: 900 }}>{slide.cta}</div>}
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 * sc, marginTop: 'auto', paddingTop: 16 * sc, borderTop: `1px solid ${t.border}` }}>
                    <div style={{ width: 32 * sc, height: 32 * sc, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 * sc, fontWeight: 900, color: '#fff', overflow: 'hidden' }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12 * sc, fontWeight: 700, color: t.muted }}>{author || 'Your Name'}{companyName ? ` · ${companyName}` : ''}</span>
                </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 * sc, background: grad }} />
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// CYBERPUNK SLIDES
// ════════════════════════════════════════════════════════════════════
function CyberpunkSlide({ slide, index, total, t, author, companyName, logo }) {
    const sc = t.scale || 1;
    const isCover = index === 0;
    const isCTA = index === total - 1;
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Share Tech Mono', monospace" }}>
            {/* Scanline overlay */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)', pointerEvents: 'none', zIndex: 1 }} />
            {/* Neon glow blobs */}
            <div style={{ position: 'absolute', top: -40 * sc, right: -40 * sc, width: 200 * sc, height: 200 * sc, borderRadius: '50%', background: t.accent, filter: `blur(${80 * sc}px)`, opacity: 0.25, pointerEvents: 'none' }} />
            {/* Corner brackets */}
            {[['top:0,left:0', 'top', 'left'], ['top:0,right:0', 'top', 'right'], ['bottom:0,left:0', 'bottom', 'left'], ['bottom:0,right:0', 'bottom', 'right']].map((_, ci) => {
                const pos = ci === 0 ? { top: 8 * sc, left: 8 * sc } : ci === 1 ? { top: 8 * sc, right: 8 * sc } : ci === 2 ? { bottom: 8 * sc, left: 8 * sc } : { bottom: 8 * sc, right: 8 * sc };
                return <div key={ci} style={{ position: 'absolute', ...pos, width: 20 * sc, height: 20 * sc, borderTop: ci < 2 ? `2px solid ${t.accent}` : 'none', borderBottom: ci >= 2 ? `2px solid ${t.accent}` : 'none', borderLeft: ci % 2 === 0 ? `2px solid ${t.accent}` : 'none', borderRight: ci % 2 === 1 ? `2px solid ${t.accent}` : 'none', opacity: 0.7, zIndex: 2 }} />;
            })}
            <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: `${32 * sc}px ${36 * sc}px` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 * sc }}>
                    <span style={{ color: t.accent, fontSize: 10 * sc, fontWeight: 700, letterSpacing: 3 * sc, textTransform: 'uppercase', textShadow: `0 0 ${10 * sc}px ${t.accent}` }}>{slide?.tag || (isCover ? 'SYS_BOOT' : isCTA ? 'END_TX' : `NODE_${String(index).padStart(2, '0')}`)}</span>
                    <span style={{ color: t.muted, fontSize: 10 * sc }}>[{index + 1}/{total}]</span>
                </div>
                <div style={{ fontFamily: "'Anton','Impact',sans-serif", fontSize: (isCover ? (slide?.title?.length > 35 ? 40 : 52) : (slide?.title?.length > 35 ? 28 : 36)) * sc, fontWeight: 900, lineHeight: 1.05, color: t.text, letterSpacing: -0.5 * sc, textTransform: 'uppercase', textShadow: `0 0 ${20 * sc}px ${t.accent}60`, marginBottom: 16 * sc, flex: isCTA ? 0 : 1 }}>
                    {slide?.title?.replace(/\[\/?\w\]/g, '')}
                </div>
                <div style={{ height: 1 * sc, background: `linear-gradient(90deg, ${t.accent}, transparent)`, marginBottom: 16 * sc, boxShadow: `0 0 ${8 * sc}px ${t.accent}` }} />
                {!isCTA && slide?.bullets?.filter(b => b.trim()).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 * sc }}>
                        {slide.bullets.filter(b => b.trim()).map((b, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10 * sc, alignItems: 'flex-start' }}>
                                <span style={{ color: t.accent, fontSize: 12 * sc, flexShrink: 0, textShadow: `0 0 ${8 * sc}px ${t.accent}` }}>▶</span>
                                <p style={{ fontSize: 13 * sc, lineHeight: 1.5, color: t.sub, margin: 0, fontFamily: "'Inter',sans-serif" }}>{parseBold(b, t.accent)}</p>
                            </div>
                        ))}
                    </div>
                )}
                {!isCTA && slide?.body && (!slide?.bullets || slide.bullets.filter(b => b.trim()).length === 0) && (
                    <p style={{ fontSize: 15 * sc, lineHeight: 1.65, color: t.sub, fontFamily: "'Inter',sans-serif" }}>{parseBold(slide.body, t.accent)}</p>
                )}
                {isCTA && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 * sc }}>
                        <div style={{ fontSize: 42 * sc }}>{slide?.icon || '⚡'}</div>
                        <div style={{ fontFamily: "'Anton','Impact',sans-serif", fontSize: 32 * sc, fontWeight: 900, color: t.text, textTransform: 'uppercase', textShadow: `0 0 ${20 * sc}px ${t.accent}80` }}>{slide?.title?.replace(/\[\/?\w\]/g, '')}</div>
                        {slide?.cta && <div style={{ border: `2px solid ${t.accent}`, color: t.accent, padding: `${12 * sc}px ${28 * sc}px`, fontSize: 13 * sc, fontWeight: 800, letterSpacing: 2 * sc, textTransform: 'uppercase', boxShadow: `0 0 ${16 * sc}px ${t.accent}40, inset 0 0 ${16 * sc}px ${t.accent}10` }}>{slide.cta}</div>}
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 * sc, marginTop: 'auto', paddingTop: 12 * sc }}>
                    <div style={{ width: 28 * sc, height: 28 * sc, borderRadius: 4 * sc, border: `1px solid ${t.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 * sc, fontWeight: 900, color: t.accent, overflow: 'hidden' }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 11 * sc, color: t.muted, fontFamily: "'Inter',sans-serif" }}>{author || 'USER'}{companyName ? ` // ${companyName}` : ''}</span>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// CORPORATE PRO SLIDES
// ════════════════════════════════════════════════════════════════════
function CorporateSlide({ slide, index, total, t, author, companyName, logo }) {
    const sc = t.scale || 1;
    const isCover = index === 0;
    const isCTA = index === total - 1;
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            {/* Left accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 5 * sc, background: t.accent }} />
            {/* Top header strip */}
            <div style={{ position: 'absolute', top: 0, left: 5 * sc, right: 0, height: 52 * sc, background: t.cardBg, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', padding: `0 ${28 * sc}px`, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 * sc }}>
                    <div style={{ width: 28 * sc, height: 28 * sc, borderRadius: 6 * sc, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 * sc, fontWeight: 900, color: '#fff', overflow: 'hidden' }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12 * sc, fontWeight: 700, color: t.sub }}>{companyName || 'Your Brand'}</span>
                </div>
                <span style={{ fontSize: 11 * sc, color: t.muted }}>{index + 1} / {total}</span>
            </div>
            {/* Main content */}
            <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', padding: `${70 * sc}px ${28 * sc}px ${28 * sc}px ${32 * sc}px` }}>
                {!isCTA && (
                    <>
                        <div style={{ fontSize: 10 * sc, fontWeight: 800, color: t.accent, textTransform: 'uppercase', letterSpacing: 2 * sc, marginBottom: 12 * sc }}>{slide?.tag || (isCover ? 'Overview' : `Section ${index}`)}</div>
                        <div style={{ fontSize: (isCover ? (slide?.title?.length > 40 ? 28 : 36) : (slide?.title?.length > 40 ? 22 : 28)) * sc, fontWeight: 800, lineHeight: 1.25, color: t.text, letterSpacing: -0.3 * sc, marginBottom: 16 * sc }}>{slide?.title?.replace(/\[\/?\w\]/g, '')}</div>
                        <div style={{ width: 40 * sc, height: 3 * sc, background: t.accent, borderRadius: 2 * sc, marginBottom: 20 * sc }} />
                        {slide?.bullets?.filter(b => b.trim()).length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 * sc }}>
                                {slide.bullets.filter(b => b.trim()).map((b, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12 * sc, alignItems: 'flex-start', background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 8 * sc, padding: `${10 * sc}px ${14 * sc}px` }}>
                                        <div style={{ width: 20 * sc, height: 20 * sc, borderRadius: '50%', background: t.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 * sc, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                                        <p style={{ fontSize: 13 * sc, lineHeight: 1.55, color: t.sub, margin: 0 }}>{parseBold(b, t.accent)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : slide?.body ? (
                            <p style={{ fontSize: 15 * sc, lineHeight: 1.75, color: t.sub, margin: 0 }}>{parseBold(slide.body, t.accent)}</p>
                        ) : null}
                    </>
                )}
                {isCTA && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 20 * sc }}>
                        <div style={{ fontSize: 44 * sc }}>{slide?.icon || '🎯'}</div>
                        <div style={{ fontSize: 30 * sc, fontWeight: 800, color: t.text, lineHeight: 1.2 }}>{slide?.title?.replace(/\[\/?\w\]/g, '')}</div>
                        <div style={{ width: 50 * sc, height: 3 * sc, background: t.accent, borderRadius: 2 * sc }} />
                        {slide?.body && <p style={{ fontSize: 14 * sc, color: t.sub, lineHeight: 1.65, maxWidth: '85%' }}>{parseBold(slide.body, t.accent)}</p>}
                        {slide?.cta && <div style={{ background: t.accent, color: '#fff', borderRadius: 8 * sc, padding: `${14 * sc}px ${30 * sc}px`, fontSize: 14 * sc, fontWeight: 800 }}>{slide.cta}</div>}
                        <div style={{ fontSize: 12 * sc, color: t.muted }}>{author || 'Your Name'}{companyName ? ` · ${companyName}` : ''}</div>
                    </div>
                )}
                {!isCTA && <div style={{ marginTop: 'auto', fontSize: 10 * sc, color: t.muted, textAlign: 'right' }}>Swipe →</div>}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 5 * sc, right: 0, height: 2 * sc, background: t.border }} />
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// BRUTALISM SLIDES
// ════════════════════════════════════════════════════════════════════
function BrutalismSlide({ slide, index, total, t, author, companyName, logo }) {
    const sc = t.scale || 1;
    const isCover = index === 0;
    const isCTA = index === total - 1;
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", border: `${8 * sc}px solid ${t.border}`, display: 'flex', flexDirection: 'column' }}>
            {/* Top Bar */}
            <div style={{ borderBottom: `${4 * sc}px solid ${t.border}`, padding: `${12 * sc}px ${20 * sc}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.accent }}>
                <span style={{ fontSize: 14 * sc, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: -0.5 * sc }}>{slide?.tag || (isCover ? 'START' : isCTA ? 'END' : `VOL.${index}`)}</span>
                <span style={{ fontSize: 14 * sc, fontWeight: 900, color: t.text }}>{index + 1} / {total}</span>
            </div>
            {/* Main */}
            <div style={{ flex: 1, padding: `${32 * sc}px`, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: (isCover ? 48 : 32) * sc, fontWeight: 900, lineHeight: 1, color: t.text, textTransform: 'uppercase', marginBottom: 24 * sc, letterSpacing: -1 * sc }}>{slide?.title?.replace(/\[\/?\w\]/g, '')}</div>
                {!isCTA && slide?.bullets?.filter(b => b.trim()).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 * sc }}>
                        {slide.bullets.filter(b => b.trim()).map((b, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12 * sc, alignItems: 'flex-start', background: t.cardBg, border: `${3 * sc}px solid ${t.border}`, padding: `${12 * sc}px`, boxShadow: `${4 * sc}px ${4 * sc}px 0 ${t.border}` }}>
                                <div style={{ fontSize: 18 * sc, fontWeight: 900, color: t.border }}>{i + 1}</div>
                                <p style={{ fontSize: 15 * sc, fontWeight: 700, color: t.sub, margin: 0 }}>{parseBold(b, t.accent)}</p>
                            </div>
                        ))}
                    </div>
                )}
                {!isCTA && slide?.body && (!slide?.bullets || slide.bullets.filter(b => b.trim()).length === 0) && (
                    <div style={{ background: t.cardBg, border: `${4 * sc}px solid ${t.border}`, padding: `${20 * sc}px`, boxShadow: `${6 * sc}px ${6 * sc}px 0 ${t.border}` }}>
                        <p style={{ fontSize: 18 * sc, fontWeight: 700, color: t.sub, margin: 0, lineHeight: 1.4 }}>{parseBold(slide.body, t.accent)}</p>
                    </div>
                )}
                {isCTA && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 24 * sc }}>
                        <div style={{ fontSize: 64 * sc }}>{slide?.icon || '🏁'}</div>
                        {slide?.body && <div style={{ fontSize: 18 * sc, fontWeight: 800, color: t.text, background: t.accent, padding: `${10 * sc}px ${20 * sc}px`, border: `${3 * sc}px solid ${t.border}`, boxShadow: `${4 * sc}px ${4 * sc}px 0 ${t.border}` }}>{slide.body}</div>}
                        {slide?.cta && <div style={{ border: `${4 * sc}px solid ${t.border}`, background: t.cardBg, color: t.text, padding: `${16 * sc}px ${32 * sc}px`, fontSize: 20 * sc, fontWeight: 900, textTransform: 'uppercase', boxShadow: `${6 * sc}px ${6 * sc}px 0 ${t.border}` }}>{slide.cta}</div>}
                    </div>
                )}
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12 * sc, borderTop: `${4 * sc}px solid ${t.border}`, paddingTop: 16 * sc }}>
                    <div style={{ width: 40 * sc, height: 40 * sc, borderRadius: '50%', border: `${3 * sc}px solid ${t.border}`, overflow: 'hidden', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 * sc, fontWeight: 900, color: t.text }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14 * sc, fontWeight: 900, color: t.text, textTransform: 'uppercase' }}>{author || 'USER'} {companyName ? `* ${companyName}` : ''}</div>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════
// GLASSMORPHISM SLIDES
// ════════════════════════════════════════════════════════════════════
function GlassmorphismSlide({ slide, index, total, t, author, companyName, logo }) {
    const sc = t.scale || 1;
    const isCover = index === 0;
    const isCTA = index === total - 1;
    return (
        <div style={{ width: t.width || 500, height: t.height || 500, position: 'relative', overflow: 'hidden', background: t.bg, boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}>
            {/* Ambient background blur blobs */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 250 * sc, height: 250 * sc, background: t.accent, borderRadius: '50%', filter: `blur(${60 * sc}px)`, opacity: 0.5, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 300 * sc, height: 300 * sc, background: t.muted, borderRadius: '50%', filter: `blur(${80 * sc}px)`, opacity: 0.4, pointerEvents: 'none' }} />
            
            {/* Glass Container */}
            <div style={{ margin: `${20 * sc}px`, height: `calc(100% - ${40 * sc}px)`, background: t.cardBg, backdropFilter: `blur(${16 * sc}px)`, WebkitBackdropFilter: `blur(${16 * sc}px)`, border: `1px solid ${t.border}`, borderRadius: 24 * sc, padding: `${32 * sc}px`, display: 'flex', flexDirection: 'column', boxShadow: `0 8px 32px 0 rgba(0,0,0,0.3)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 * sc }}>
                    <span style={{ background: `linear-gradient(90deg, ${t.accent}, #ffffff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 12 * sc, fontWeight: 800, letterSpacing: 2 * sc, textTransform: 'uppercase' }}>{slide?.tag || (isCover ? 'INTRODUCTION' : isCTA ? 'CONCLUSION' : `PART ${index}`)}</span>
                    <span style={{ color: t.sub, fontSize: 12 * sc, fontWeight: 600 }}>{index + 1} / {total}</span>
                </div>
                
                <div style={{ fontSize: (isCover ? 42 : 30) * sc, fontWeight: 800, lineHeight: 1.2, color: t.text, marginBottom: 20 * sc, letterSpacing: -0.5 * sc }}>{slide?.title?.replace(/\[\/?\w\]/g, '')}</div>
                
                {!isCTA && slide?.bullets?.filter(b => b.trim()).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 * sc }}>
                        {slide.bullets.filter(b => b.trim()).map((b, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12 * sc, alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 12 * sc, padding: `${12 * sc}px ${16 * sc}px` }}>
                                <div style={{ width: 24 * sc, height: 24 * sc, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 * sc, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: `0 0 10px ${t.accent}` }}>{i + 1}</div>
                                <p style={{ fontSize: 14 * sc, lineHeight: 1.5, color: t.sub, margin: 0 }}>{parseBold(b, t.text)}</p>
                            </div>
                        ))}
                    </div>
                )}
                {!isCTA && slide?.body && (!slide?.bullets || slide.bullets.filter(b => b.trim()).length === 0) && (
                    <p style={{ fontSize: 16 * sc, lineHeight: 1.7, color: t.sub, margin: 0 }}>{parseBold(slide.body, t.text)}</p>
                )}
                
                {isCTA && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 20 * sc }}>
                        <div style={{ fontSize: 50 * sc }}>{slide?.icon || '✨'}</div>
                        {slide?.body && <p style={{ fontSize: 16 * sc, color: t.sub, lineHeight: 1.6 }}>{slide.body}</p>}
                        {slide?.cta && <div style={{ background: t.accent, color: '#fff', padding: `${14 * sc}px ${32 * sc}px`, borderRadius: 100 * sc, fontSize: 15 * sc, fontWeight: 700, boxShadow: `0 4px 16px ${t.accent}60`, letterSpacing: 1 * sc }}>{slide.cta}</div>}
                    </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 * sc, marginTop: 'auto', paddingTop: 20 * sc, borderTop: `1px solid rgba(255,255,255,0.1)` }}>
                    <div style={{ width: 36 * sc, height: 36 * sc, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: `1px solid rgba(255,255,255,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 * sc, fontWeight: 900, color: t.text, overflow: 'hidden' }}>
                        {logo ? <img src={logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'JC').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13 * sc, fontWeight: 600, color: t.sub }}>{author || 'USER'} {companyName ? `| ${companyName}` : ''}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Slide Dispatcher ─────────────────────────────────────────────────────────
function Slide({ slide, index, total, theme, styleMode, author, companyName, logo, website, profilePic, subtitle }) {
    const cleanSlide = {
        ...slide,
        title: creatorSourceText(slide?.title || ''),
        body: creatorSourceText(slide?.body || ''),
        bullets: Array.isArray(slide?.bullets) ? slide.bullets.map(item => creatorSourceText(item)) : [],
    };
    slide = cleanSlide;
    if (styleMode === 'magazine') {
        if (index === 0) return <MagCoverSlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        if (index === total - 1) return <MagCTASlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        return <MagContentSlide slide={slide} index={index} total={total} t={theme} />;
    } else if (styleMode === 'minimal') {
        if (index === 0) return <MinCoverSlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        if (index === total - 1) return <MinCTASlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        return <MinContentSlide slide={slide} index={index} total={total} t={theme} />;
    } else if (styleMode === 'editorial') {
        if (index === 0) return <EdCoverSlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        if (index === total - 1) return <EdCTASlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        return <EdContentSlide slide={slide} index={index} total={total} t={theme} />;
    } else if (styleMode === 'pillars') {
        if (index === 0) return <PilCoverSlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        if (index === total - 1) return <PilCTASlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        return <PilContentSlide slide={slide} index={index} total={total} t={theme} />;
    } else if (styleMode === 'viral') {
        return <ViralStorySlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'viral-x') {
        return <ViralXSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'ai-clone') {
        return <AiCloneSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'li-post') {
        return <LiPostSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'retro') {
        return <RetroSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'quote') {
        return <QuoteSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'promo') {
        return <PromoSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'cheatsheet') {
        return <CheatsheetSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'li-creator') {
        return <LiCreatorSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} profilePic={profilePic} subtitle={subtitle} />;
    } else if (styleMode === 'tweet-classic') {
        return <TweetClassicSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'tweet-dark') {
        return <TweetDarkSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'yt-thumb') {
        return <YTThumbSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
    } else if (styleMode === 'infographic') {
        if (index === 0) return <InfographicCoverSlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        if (index === total - 1) return <InfographicCTASlide slide={slide} total={total} t={theme} author={author} companyName={companyName} logo={logo} website={website} />;
        // Alternate between timeline and stats for content slides
        if (index % 2 === 1) return <InfographicTimelineSlide slide={slide} index={index} total={total} t={theme} author={author} logo={logo} />;
        return <InfographicStatsSlide slide={slide} index={index} total={total} t={theme} author={author} logo={logo} />;
    } else if (styleMode === 'gradient') {
        return <GradientSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} />;
    } else if (styleMode === 'cyberpunk') {
        return <CyberpunkSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} />;
    } else if (styleMode === 'corporate') {
        return <CorporateSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} />;
    } else if (styleMode === 'brutalism') {
        return <BrutalismSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} />;
    } else if (styleMode === 'glassmorphism') {
        return <GlassmorphismSlide slide={slide} index={index} total={total} t={theme} author={author} companyName={companyName} logo={logo} />;
    }
    return null;
}

function SafeZonesOverlay() {
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
            {/* Top UI Area */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '12%', borderBottom: '1.5px dashed rgba(255,80,80,0.6)' }}>
                <span style={{ position: 'absolute', bottom: 4, right: 8, fontSize: 8, color: 'rgba(255,80,80,0.7)', fontWeight: 700 }}>TOP UI</span>
            </div>
            {/* Right Side UI */}
            <div style={{ position: 'absolute', right: 0, bottom: '15%', top: '35%', width: '14%', borderLeft: '1.5px dashed rgba(255,80,80,0.6)' }}>
                <span style={{ position: 'absolute', top: 4, left: 4, fontSize: 8, color: 'rgba(255,80,80,0.7)', fontWeight: 700, writingMode: 'vertical-rl' }}>BUTTONS</span>
            </div>
            {/* Bottom UI Area */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', borderTop: '1.5px dashed rgba(255,80,80,0.6)' }}>
                <span style={{ position: 'absolute', top: 4, left: 8, fontSize: 8, color: 'rgba(255,80,80,0.7)', fontWeight: 700 }}>CAPTION AREA</span>
            </div>
        </div>
    );
}

// ─── Main CarouselBuilder ──────────────────────────────────────────────────────
// ─── Standalone Page Wrapper ────────────────────────────────────────────────
// When navigated to directly at /carousel (no props), show topic + API key inputs
function CarouselPageWrapper() {
    const [topicInput, setTopicInput] = useState('');
    const [apiKeyInput] = useState('');
    const [started, setStarted] = useState(false);
    const [useExactText, setUseExactText] = useState(false);
    const [initialCreationMode, setInitialCreationMode] = useState('carousel');
    const [returnTo, setReturnTo] = useState('');

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const topicParam = params.get('topic');
            const modeParam = params.get('mode');
            const returnParam = params.get('returnTo');
            if (modeParam === 'images') setInitialCreationMode('image-set');
            if (returnParam && returnParam.startsWith('/')) setReturnTo(returnParam);
            if (topicParam) {
                setTopicInput(topicParam.trim());
                setStarted(true);
            }
        }
    }, []);

    function handleStart() {
        if (!topicInput.trim()) return;
        setStarted(true);
    }

    if (started) {
        return (
            <CarouselBuilder
                topic={{ topic: topicInput }}
                apiKey={apiKeyInput}
                useExactText={useExactText}
                initialCreationMode={initialCreationMode}
                onBack={() => {
                    if (returnTo) {
                        window.location.assign(returnTo);
                        return;
                    }
                    setTopicInput('');
                    setStarted(false);
                }}
            />
        );
    }

    return (
        <div style={{ maxWidth: 560, margin: '60px auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
                <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Carousel Studio</h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.6 }}>
                    Turn any topic into a stunning LinkedIn or Instagram carousel with AI.
                </p>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                        Your Topic / Idea
                    </label>
                    <textarea
                        value={topicInput}
                        onChange={e => setTopicInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleStart()}
                        placeholder="e.g. Why 90% of startups fail in their first year"
                        className="input-field"
                        style={{ minHeight: 80, fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
                    />
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input 
                            type="checkbox" 
                            id="exactTextMode" 
                            checked={useExactText} 
                            onChange={e => setUseExactText(e.target.checked)} 
                            style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <label htmlFor="exactTextMode" style={{ fontSize: 13, color: 'var(--muted-foreground)', cursor: 'pointer', fontWeight: 600 }}>
                            Use exact content (Bypass AI rewriting)
                        </label>
                    </div>
                </div>


                <button
                    onClick={handleStart}
                    disabled={!topicInput.trim()}
                    className="btn btn-primary"
                    style={{ justifyContent: 'center', opacity: topicInput.trim() ? 1 : 0.5 }}
                >
                    Open Carousel Builder
                </button>
            </div>
        </div>
    );
}

export default CarouselPageWrapper;

// ─── Main CarouselBuilder (also used by AutoPilot) ───────────────────────────
function themesForStyle(mode) {
    if (mode === 'magazine') return MAG_THEMES;
    if (mode === 'minimal') return MIN_THEMES;
    if (mode === 'editorial') return ED_THEMES;
    if (mode === 'viral') return VIRAL_THEMES;
    if (mode === 'viral-x') return VIRALX_THEMES;
    if (mode === 'li-creator') return LICREATOR_THEMES;
    if (mode === 'tweet-classic') return TWEET_THEMES;
    if (mode === 'tweet-dark') return TWEET_DARK_THEMES;
    if (mode === 'yt-thumb') return YTTHUMB_THEMES;
    if (mode === 'ai-clone') return AICLONE_THEMES;
    if (mode === 'li-post') return LIPOST_THEMES;
    if (mode === 'retro') return RETRO_THEMES;
    if (mode === 'quote') return QUOTE_THEMES;
    if (mode === 'promo') return PROMO_THEMES;
    if (mode === 'cheatsheet') return CHEATSHEET_THEMES;
    if (mode === 'infographic') return INFOGRAPHIC_THEMES;
    if (mode === 'gradient') return GRADIENT_THEMES;
    if (mode === 'cyberpunk') return CYBER_THEMES;
    if (mode === 'corporate') return CORP_THEMES;
    if (mode === 'brutalism') return BRUTAL_THEMES;
    if (mode === 'glassmorphism') return GLASS_THEMES;
    return PIL_THEMES;
}

export function CarouselBuilder({ topic = { topic: '' }, apiKey = '', useExactText = false, onBack, initialCreationMode = 'carousel' }) {
    const [styleMode, setStyleMode] = useState('li-creator');
    const [platform, setPlatform] = useState('linkedin');
    const [creationMode, setCreationMode] = useState(initialCreationMode === 'image-set' ? 'image-set' : 'carousel');
    const themes = themesForStyle(styleMode);
    const [slideImages, setSlideImages] = useState({});
    const [theme, setTheme] = useState(LICREATOR_THEMES[0]);
    const [slides, setSlides] = useState(null);
    const [captionData, setCaptionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [slideCount, setSlideCount] = useState(8);
    const [individualPosts, setIndividualPosts] = useState(() => [topic.topic || '', '', '', '', '', '']);
    const [individualImageSet, setIndividualImageSet] = useState(null);
    const [individualLoading, setIndividualLoading] = useState(false);
    const [copiedCaptionIndex, setCopiedCaptionIndex] = useState(null);
    const [customFontFamily, setCustomFontFamily] = useState("");
    const [customFontSizeMultiplier, setCustomFontSizeMultiplier] = useState(1);
    const [author, setAuthor] = useState(() => {
        if (typeof window === 'undefined') return '';
        try { return localStorage.getItem('carousel_author') || ''; } catch { return ''; }
    });
    const [companyName, setCompanyName] = useState(() => {
        if (typeof window === 'undefined') return '';
        try { return localStorage.getItem('carousel_company') || ''; } catch { return ''; }
    });
    const [website, setWebsite] = useState(() => {
        if (typeof window === 'undefined') return '';
        try { return localStorage.getItem('carousel_website') || ''; } catch { return ''; }
    });
    const [logo, setLogo] = useState(() => {
        if (typeof window === 'undefined') return '';
        try { return localStorage.getItem('carousel_logo') || ''; } catch { return ''; }
    });

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                setLogo(base64);
                if (typeof window !== 'undefined') localStorage.setItem('carousel_logo', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const [profilePic, setProfilePic] = useState(() => {
        if (typeof window === 'undefined') return '';
        try { return localStorage.getItem('carousel_profilepic') || ''; } catch { return ''; }
    });
    const [subtitle, setSubtitle] = useState(() => {
        if (typeof window === 'undefined') return '';
        try { return localStorage.getItem('carousel_subtitle') || ''; } catch { return ''; }
    });

    const handleProfilePicUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                setProfilePic(base64);
                if (typeof window !== 'undefined') localStorage.setItem('carousel_profilepic', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const [isExtracting, setIsExtracting] = useState(false);

    const handleThemeExtraction = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsExtracting(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const base64Image = event.target.result;
                    const res = await fetch('/api/openai/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'gpt-4o',
                            messages: [{
                                role: 'user',
                                content: [
                                    { type: 'text', text: 'Analyze this social media carousel slide design. Recreate it exactly using robust HTML and inline CSS. Return ONLY a valid JSON object with: 1. "bg", "text", "accent", "border", "muted", "sub" hex colors mapped precisely. 2. "customHtml": A raw HTML string representing the slide container. It MUST use inline CSS styles matching the image\'s padding, border-radius, font alignments, shadows, visual aesthetic, and layered structures. DO NOT use external classes. The outermost container MUST have exactly this inline style: `width: 100%; height: 100%; box-sizing: border-box; position: relative; display: flex; flex-direction: column; background: ${bg};`. Place the following exact placeholders where text/logos should go so they can be injected dynamically: {{TITLE}}, {{BODY}}, {{BULLETS_HTML}}, {{AUTHOR}}, {{COMPANY}}, {{WEBSITE}}, {{ICON}}, {{TAG}}, {{LOGO}}, {{SLIDE_NUMBER}}, {{TOTAL_SLIDES}}. Assume {{BULLETS_HTML}} will contain literal HTML <div> items. Do NOT wrap the JSON output in markdown code blocks or quotes.' },
                                    { type: 'image_url', image_url: { url: base64Image } }
                                ]
                            }],
                            max_tokens: 1500,
                            response_format: { type: 'json_object' }
                        })
                    });

                    if (!res.ok) throw new Error('API Error');
                    const data = await res.json();

                    const colors = JSON.parse(data.choices[0].message.content);
                    const extractedTheme = {
                        id: 'custom-' + Date.now(),
                        name: 'Custom Cloned Theme',
                        bg: colors.bg || '#ffffff',
                        text: colors.text || '#000000',
                        accent: colors.accent || '#3b82f6',
                        border: colors.border || '#e5e7eb',
                        sub: colors.sub || colors.text || '#4b5563',
                        muted: colors.muted || '#9ca3af',
                        customHtml: colors.customHtml || ''
                    };

                    setStyleMode('ai-clone');
                    setTheme(extractedTheme);
                } catch (err) {
                    setError('Vision Extraction failed. Try another image.');
                } finally {
                    setIsExtracting(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError('File read failed.');
            setIsExtracting(false);
        }
    };

    const [editMode, setEditMode] = useState(false);
    const [editingSlide, setEditingSlide] = useState(null);
    const [videoSettings, setVideoSettings] = useState({ voice: 'alloy', bgm: true, safeZones: false, length: 'long', subtitles: true });
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const slideRefs = useRef([]);
    const exportRefs = useRef([]);
    const individualExportRefs = useRef([]);
    const fileInputRef = useRef(null);

    const isVertical = platform === 'reels' || platform === 'shorts';
    const isYoutube = platform === 'youtube';

    // For vertical (Shorts/Reels), we render the hidden canvas container at 1080x1920 
    // instead of scaling up a 500px wide box, so the relative font sizes and spacing are correct.
    const computedTheme = {
        ...theme,
        fontFamily: customFontFamily || theme.fontFamily,
        width: isVertical ? 1080 : isYoutube ? 1280 : 500,
        height: isVertical ? 1920 : isYoutube ? 720 : 500,
        scale: (isVertical ? 2.16 : isYoutube ? 1.44 : 1) * customFontSizeMultiplier // Use this scale variable to adjust fonts natively in the components
    };

    // Preview theme: smaller native size for on-screen display (no CSS transform needed)
    const previewTheme = isVertical
        ? { ...theme, fontFamily: customFontFamily || theme.fontFamily, width: 400, height: 711, scale: 0.8 * customFontSizeMultiplier }
        : isYoutube
            ? { ...theme, fontFamily: customFontFamily || theme.fontFamily, width: 560, height: 315, scale: 0.63 * customFontSizeMultiplier }
            : { ...theme, fontFamily: customFontFamily || theme.fontFamily, width: 500, height: 500, scale: 1 * customFontSizeMultiplier };

    const individualImageTheme = {
        ...theme,
        fontFamily: customFontFamily || theme.fontFamily,
        width: 500,
        height: 500,
        scale: 1 * customFontSizeMultiplier,
    };

    function switchStyle(mode) {
        setStyleMode(mode);
        const tList = themesForStyle(mode);
        setTheme(tList[0]);
    }

    const CAROUSEL_PROMPT = (topic, count, mode, plat) => {
        if (mode === 'li-creator') return creatorPostPrompt(topic, count);
        if (mode === 'yt-thumb') {
            return `Generate ${count} compelling YouTube thumbnail concepts and catchy titles for a video about: "${topic}"
            
Return ONLY a raw JSON object:
{
  "caption": "Write 2-3 sentences for a YouTube video description.",
  "hashtags": "#Hook #Video",
  "slides": [
    {
      "title": "Massive Bold Hook Title. Wrap 1-2 words in [h]...[/h] to highlight.",
      "body": "Short punchy subtitle text. Use **double asterisks** to bold key words.",
      "icon": "🔥", "tag": "Thumbnail Idea", "bullets": ["**Sub text 1**", "**Sub text 2**"]
    }
  ]
}

CRITICAL RULES:
- Focus on high-CTR, clickbait-style phrasing.
- If asking for ${count} slides, return exactly ${count} completely distinct thumbnail options.
- DO NOT wrap the JSON in \`\`\`json markdown blocks, just return raw JSON!
`;
        }

        // ── Infographic style (timeline, facts, stats) ──────────────
        if (mode === 'infographic') {
            return `Act as an expert Infographic Content Designer. Generate a data-rich educational infographic carousel about: "${topic}"

Return ONLY a raw JSON object:
{
  "caption": "Write a 2-3 sentence educational caption that hooks the reader into learning more.",
  "hashtags": "#Infographic #Education #DidYouKnow",
  "slides": [
    {
      "title": "Rewrite '${topic.replace(/['"]/g, '')}' into a powerful 5-10 word headline. Wrap 2-3 key words in [h]...[/h].",
      "body": "A compelling 1-2 sentence intro that sets the context.",
      "imagePrompt": "A highly detailed, visually stunning 3D render representing the cover topic (e.g. 'golden scales of justice on dark background 3d render')",
      "icon": "📊", "tag": "🔍 Deep Dive", "bullets": []
    },
    {
      "title": "KEY TIMELINE OR MILESTONES TITLE. Wrap 1-2 words in [h]...[/h].",
      "body": "Short intro context. Use **double asterisks** to bold key phrases.",
      "imagePrompt": "A detailed cinematic image representing this specific timeline era or event",
      "icon": "📅", "tag": "Timeline",
      "bullets": [
        "**Date/Year:** Description of what happened at this point",
        "**Date/Year:** Another important milestone or event",
        "**Date/Year:** Third milestone with details",
        "**Date/Year:** Fourth milestone with context"
      ]
    },
    {
      "title": "KEY NUMBERS AND STATS. Wrap 1-2 words in [h]...[/h].",
      "body": "Short intro context. Use **double asterisks** to bold key phrases.",
      "imagePrompt": "Abstract dynamic 3d shapes or related objects representing growth and statistics",
      "icon": "📈", "tag": "Key Facts",
      "bullets": [
        "**2,000+:** Brief description of what this number represents",
        "**85%:** What this percentage means",
        "**10x:** Description of this multiplier or comparison",
        "**$1.2M:** What this monetary figure relates to"
      ]
    },
    ... alternate between timeline slides (bullets as "**Date:** Description") and stats slides (bullets as "**Number:** Label") for ${count - 2} content slides total. Include visual 'imagePrompt's for every slide.
    {
      "title": "SHARE THIS WITH SOMEONE WHO NEEDS IT",
      "body": "Spread knowledge! Tag a friend who would find this fascinating.",
      "imagePrompt": "A futuristic glowing share icon or social connection network 3d render",
      "icon": "🚀", "tag": "Share",
      "bullets": [],
      "cta": "👉 Follow for more infographics"
    }
  ]
}

CRITICAL RULES:
- Exactly ${count} slides total
- ALL content strictly about: "${topic}"
- Slide 1 (COVER): Bold headline with [h]...[/h] tags + short intro body
- Content slides MUST alternate between:
  * TIMELINE slides: bullets formatted STRICTLY as "Date/Period: Description" 
  * STATS slides: bullets formatted STRICTLY as "Number/Stat: Description"
- Each content slide: 3-5 bullets maximum. Each slide MUST have a rich visual \`imagePrompt\`.
- Use real, accurate data and dates whenever possible
- Maintain educational, authoritative tone
- Return ONLY the raw JSON, no markdown formatting`;
        }

        // ── Viral X style ──────────────────────────────────────
        if (mode === 'viral-x') {
            return `Generate a Twitter/X style viral thread carousel about: "${topic}"

Return ONLY a raw JSON object:
{
  "caption": "Write a 3-4 line post caption hook (NOT the slides). Line 1: ONE bold controversial or surprising claim. Line 2: A short agitating follow-up line. Line 3: A curiosity gap line that makes them NEED to read. Line 4: 'Here's what I learned 👇' or similar pull-through. Use **double asterisks** to bold key phrases. Each line separated by \\n.",
  "hashtags": "#Hashtag1 #Hashtag2 #Hashtag3",
      "slides": [
    {
      "title": "Opening hook sentence. Use **double asterisks** around 2-3 key words to bold them.",
      "body": "Explain the claim in 1-2 concise sentences. Add the source-supported context and one clear takeaway, using **bold emphasis** naturally.",
      "icon": "", "tag": "Thread", "bullets": []
    },
    ... repeat until ${count} slides
  ]
}

CRITICAL RULES:
- Exactly ${count} slides total
- ALL slides strictly about: "${topic}"
- The "title" is the opening sentence. The "body" is the rest, separated by \\n\\n for paragraph breaks.
- Every slide must be a complete, useful social post: 18-32 words total including title and body. Keep the visible copy to 5 lines maximum: a short headline plus 1–2 concise sentences. Never use a one-line placeholder such as "Same ICUs." or repeat the title as the body.
- Boldly emphasize 2-4 emotionally important phrases per slide using **double asterisks** tags.
- Caption MUST be 3-4 punchy lines that create an open curiosity loop — force them to swipe!
- Conversational, personal, punchy thread tone.
- Return ONLY the JSON object, no other text`;
        }

        // ── Viral Story mode: narrative paragraph slides (like the screenshots) ──
        if (mode === 'viral') {
            const platLabel = plat === 'instagram' ? 'Instagram' : 'LinkedIn';
            return `Generate a ${platLabel} viral story carousel about: "${topic}"

Return ONLY a raw JSON object:
{
  "caption": "Write a highly engaging 1-2 sentence introductory caption for the social media post itself (not the slides).",
  "hashtags": "#Hashtag1 #Hashtag2 #Hashtag3",
  "slides": [
    {
      "title": "Opening hook line. Wrap 1-2 words in [h]...[/h].",
      "body": "Build the story in 1-2 short sentences. Explain the source-supported tension or business implication, then end with a takeaway that moves the reader to the next slide.",
      "icon": "", "tag": "Story", "bullets": []
    },
    { "title": "Wrap 1-2 words in [h]...[/h]", "body": "Continuation of story.\\n\\n**Bold emotional word** in context.\\n\\nNext beat of the story.", "icon": "", "tag": "", "bullets": [] },
    ... repeat until ${count - 1} story slides
    { "title": "Wrap 1-2 words in [h]...[/h]", "body": "Final lesson or insight from the story. Use **double asterisks** for impact.", "icon": "", "tag": "", "bullets": [], "cta": "👉 Follow for more stories" }
  ]
}

CRITICAL RULES:
- Exactly ${count} slides total
- ALL slides strictly about: "${topic}"
- Each slide must contain 18-32 words total including its title. Use 1–2 short sentences with one distinct development and takeaway. Never return a title-only or a slide longer than 5 visible lines.
- Bold 2-4 emotionally important words per slide using **double asterisks**
- Conversational, personal, story-telling tone — NO jargon, NO bullets, NO statistics
- Story flows naturally slide to slide
- Return ONLY the JSON object, no other text`;
        }

        // ── Short-Form Video script (Reels/Shorts hook system) ──
        if (plat === 'reels' || plat === 'shorts') {
            const vidType = plat === 'reels' ? 'Instagram Reel' : 'YouTube Short';
            return `Act as a Top 1% Short-Form Video Scriptwriter. Write a highly engaging ${vidType} script about: "${topic}"

Return ONLY a raw JSON object formatted as storyboard frames. This script will be spoken aloud to the viewer.
{
  "caption": "Write an engaging social media caption to accompany the video with 3 relevant hashtags.",
  "hashtags": "#Shorts #Viral",
  "slides": [
    {
      "title": "MASSIVE VISUAL HOOK. 5-7 words. Wrap 2 bold words in [h]...[/h].",
      "body": "Your 3-Second Verbal Hook to speak aloud! E.g., 'Stop scrolling. If you do this one thing, you will 10x your results.'",
      "icon": "🛑", "tag": "The Hook", "bullets": []
    },
    {
      "title": "Keep text HUGE and minimal (3-5 words).",
      "body": "Verbal script part 2. Keep the script fast-paced, punchy, and build intense curiosity.",
      "icon": "👀", "tag": "Retain", "bullets": ["Optional visual text 1", "Optional visual text 2"]
    },
    ... Repeat for ${count - 2} fast-paced, high retention scenes.
    {
      "title": "Drop a 🤯 if this helped!",
      "body": "Verbal CTA: 'Subscribe if this blew your mind!'",
      "icon": "🔥", "tag": "CTA", "bullets": [], "cta": "Follow for more!"
    }
  ]
}

CRITICAL RULES:
- Exactly ${count} slides total representing scenes in the video.
- "title" is the large ON-SCREEN text. Keep it UNDER 10 words. Highlight 1-2 words using [h]...[/h] tags!
- "body" is the SPOKEN SCRIPT for that scene. It must be energetic and natural to speak aloud!
- Optimize for extreme watch retention! No boring intros! Agitate a problem quickly.
- DO NOT wrap the JSON in \`\`\`json markdown blocks, just return raw JSON!`;
        }

        let contentSlideInstruction = `{ 
          "title": "PUNCHY TITLE. Wrap 1-2 words in [h]...[/h].", 
          "body": "Two short paragraphs explaining the context, why it matters, and the practical takeaway. Use **bold emphasis** naturally.", 
          "icon": "💡", 
          "tag": "Key Insight", 
          "bullets": [
            "**Core Concept:** Explain the central idea with useful context.",
            "**Action Step:** Show what this means in practice.",
            "**Key Result:** Close with a specific takeaway."
          ] 
        },`;

        let ruleInstruction = `- Content MUST fit on page without getting cut off.\n- Keep every slide to 5 visible lines maximum: a specific 5–8 word title and 1–2 concise sentences or 2 short bullets.\n- Aim for 18 to 32 words total across each slide (title + body + bullets).\n- Use **double asterisks** to bold one important phrase naturally.\n- DO NOT literally write 'Point 1:', 'Point 2:'.`;

        if (mode === 'pillars') {
            contentSlideInstruction = `{ 
              "title": "FRAMEWORK TITLE. Wrap 1-2 words in [h]...[/h]", 
              "body": "Explain the framework in two concise paragraphs: what the source shows, why it matters, and how the reader should interpret it.", 
              "icon": "💡", 
              "tag": "Framework", 
              "bullets": [
                "**Concept:** Explain the central idea with source-supported context.",
                "**Action:** Show the practical implication for the reader.",
                "**Metric:** Close with a specific source-supported takeaway."
              ] 
            },`;
            ruleInstruction = `- Each slide must fit within 5 visible lines and stay between 20 and 32 words total. Use a specific title plus two or three compact, meaningful bullets. Never duplicate the title.`;
        } else if (mode.includes('tweet') || mode === 'viral-x') {
            contentSlideInstruction = `{ 
              "title": "Short Hook Headline", 
              "body": "Line 1 with **bold keyword**.\\n\\nLine 2 explaining the main point.\\n\\nLine 3 summarizing takeaway.", 
              "icon": "🐦", 
              "tag": "Tweet", 
              "bullets": [
                "**Key Insight:** Short 1-line point.",
                "**Strategic Move:** Short 1-line point.",
                "**Summary:** Short 1-line takeaway."
              ] 
            },`;
            ruleInstruction = `- Write 18-32 words per slide including title and body, with a maximum of 5 visible lines. Use one hook, one supporting sentence and one takeaway; never use a one-line placeholder or repeat the title as the body.\n- Bold one key phrase using **double asterisks**.\n- DO NOT write 'Point 1:', 'Point 2:'.`;
        }

        let platInstruction = `a viral LinkedIn carousel post`;
        let ctaInstruction = `"👉 Follow for Daily Insights"`;
        if (plat === 'instagram') {
            platInstruction = `a viral Instagram carousel post`;
            ctaInstruction = `"👉 Follow & Save for later"`;
        } else if (plat === 'youtube') {
            platInstruction = `a viral YouTube Community carousel post`;
            ctaInstruction = `"👉 Subscribe for more"`;
        } else if (plat === 'reels') {
            platInstruction = `a viral Instagram Reels vertical storyboard (9:16)`;
            ctaInstruction = `"👉 Follow & Save for later"`;
        } else if (plat === 'shorts') {
            platInstruction = `a viral YouTube Shorts vertical storyboard (9:16)`;
            ctaInstruction = `"👉 Subscribe for more"`;
        } else if (plat === 'infographic') {
            platInstruction = `an educational infographic carousel post`;
            ctaInstruction = `"👉 Follow for more infographics"`;
        }

        return `Act as a Top 1% Viral Social Media Ghostwriter. Generate ${platInstruction} strictly about the topic: "${topic}"

Return ONLY a raw JSON object:
{
  "caption": "Write an irresistibly engaging 1-2 sentence opening hook for the post caption. Start with a contrarian statement, a bold claim, or an open curiosity loop that forces them to read.",
  "hashtags": "#Viral #Growth #Trends",
  "slides": [
    {
      "title": "Rewrite the topic '${topic.replace(/['"]/g, '')}' into a hyper-viral, clickbait-style 5-10 word hook. wrap 2-3 of the most emotionally charged words in [h]...[/h] tags. It MUST trigger intense curiosity.",
      "body": "2-3 punchy sentences that establish the problem, explain why it matters, and create a reason to swipe right.",
      "icon": "🧠", "tag": "🔥 Must Read", "bullets": []
    },
    ${contentSlideInstruction}
    ... repeat ${count - 2} content slides. Each slide MUST deliver high-value, actionable dopamine hits. No fluff.
    { "title": "Did This Blow Your Mind?", "body": "Drop a 🤯 in the comments if you learned something new today or tag a friend who needs to see this.", "icon": "🚀", "tag": "Engagement", "bullets": [], "cta": ${ctaInstruction} }
  ]
}

CRITICAL RULES:
- Exactly ${count} slides total.
- Maintain a highly energetic, authoritative, and punchy 'Creator' tone.
- Avoid boring, academic language. Use short, sharp, easily digestible sentences.
- Optimize the Cover Slide for maximum CTR (Click-Through Rate) using psychological curiosity gaps.
- Slide 1 (COVER) MUST use [h]...[/h] tags around the 2 most powerful words to highlight them!
${ruleInstruction}
- Return ONLY the raw JSON object, no markdown formatting.`;
    };

    async function generateSlides() {
        /* API Key required bypass */
        setLoading(true); setError('');

        if (useExactText) {
            try {
                const rawText = creatorSourceText(topic.topic);
                let blocks = [];
                if (rawText.includes('---')) {
                    blocks = rawText.split('---').map(b => b.trim()).filter(Boolean);
                } else if (styleMode === 'li-creator') {
                    blocks = [rawText];
                } else {
                    blocks = rawText.split(/\n\n+/).map(b => b.trim()).filter(Boolean);
                }

                const generatedSlides = blocks.map((block, i) => {
                    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
                    const title = lines[0] || `Slide ${i + 1}`;
                    const bodyLines = lines.slice(1);
                    return {
                        title: title,
                        body: bodyLines.join('\n\n'),
                        icon: i === 0 ? "🔥" : "💡", 
                        tag: i === 0 ? "Cover" : "Detail", 
                        bullets: []
                    };
                });
                
                if (generatedSlides.length === 0) {
                     generatedSlides.push({ title: "No Content", body: "Please enter content.", icon: "⚠️", tag: "Error", bullets: [] });
                }

                setSlides(generatedSlides);
                setCurrentSlide(0);
                setCaptionData({ caption: '', hashtags: '' });
            } catch (e) {
                setError('Failed to parse content.');
            } finally {
                setLoading(false);
            }
            return;
        }

        try {
            const res = await fetch('/api/openai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: CAROUSEL_PROMPT(creatorSourceText(topic.topic), slideCount, styleMode, platform) }],
                    max_tokens: 3500, temperature: 0.78,
                    response_format: { type: 'json_object' },
                }),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(typeof e.error === 'string' ? e.error : e.error?.message || `API error ${res.status}`); }
            const data = await res.json();
            let parsed = parseJsonResponse(data.choices[0].message.content);
            if (!Array.isArray(parsed.slides) || !parsed.slides.length) throw new Error('No slides returned. Please try again.');
            if (parsed.slides.length !== slideCount) throw new Error(`Expected ${slideCount} slides, received ${parsed.slides.length}.`);

            // Some styles used to satisfy the old prompt with a title plus one
            // sentence. Give regular social slides a repair pass before they
            // reach the renderer; thumbnails and video storyboards intentionally
            // stay compact because their text is spoken or overlaid on media.
            const compactStyle = ['yt-thumb', 'reels', 'shorts'].includes(styleMode);
            const needsExpansion = !compactStyle && parsed.slides.some(s => creatorWordCount(s) < 16 || creatorWordCount(s) > 36);
            if (needsExpansion) {
                const expansionRes = await fetch('/api/openai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [{
                            role: 'user',
                            content: `Rewrite this carousel into exactly ${slideCount} finished social-media slides.
Return JSON only: {"caption":"...","hashtags":"...","slides":[{"title":"...","body":"...","bullets":[]}]}
- Every slide must contain 18-32 words total including its title.
- Give every slide a specific 5-8 word headline and 1-2 concise sentences with context and takeaway. Keep visible copy under 5 lines.
- Each slide must develop a distinct angle; never repeat the title as the body, use a one-line placeholder, or put the whole source into slide 1.
- Use only facts in SOURCE. Preserve names, numbers and qualifications. Do not invent facts.
- Use paired **bold** markers for one important phrase, but never output [h], [BIG], HTML, layout notes, editing instructions or escaped financial symbols such as \\~.
- Keep the same ${styleMode} visual tone, but prioritize complete, readable copy.

SOURCE:
${creatorSourceText(topic.topic)}

DRAFT TO REPAIR:
${JSON.stringify(parsed.slides)}`
                        }],
                        max_tokens: 4500,
                        temperature: 0.55,
                        response_format: { type: 'json_object' },
                    }),
                });
                if (!expansionRes.ok) throw new Error(`Slide expansion failed (${expansionRes.status}).`);
                const expansionData = await expansionRes.json();
                const expanded = parseJsonResponse(expansionData.choices[0].message.content);
                if (!Array.isArray(expanded.slides) || expanded.slides.length !== slideCount || expanded.slides.some(s => creatorWordCount(s) < 16 || creatorWordCount(s) > 36)) {
                    throw new Error('The generated slides are too short.');
                }
                parsed = expanded;
            }
            if (styleMode === 'li-creator' && parsed.slides.some(s => creatorWordCount(s) < 18 || creatorWordCount(s) > 36)) {
                throw new Error('The generated slides are too short. Add more source detail or request fewer slides, then regenerate.');
            }
            const enrichedSlides = (parsed.slides || []).map(s => {
                if (styleMode === 'li-creator') return s;
                const keyword = s.imagePrompt || s.title || topic.topic;
                if (!s.image) {
                    s.image = `https://pollinations.ai/p/${encodeURIComponent(keyword)}?width=1080&height=1080&nologo=1`;
                }
                return s;
            });
            setSlides(enrichedSlides);
            setCurrentSlide(0);
            setCaptionData({ caption: parsed.caption || '', hashtags: parsed.hashtags || '' });
        } catch (e) {
            const msg = e.message || '';
            // Last AI retry: this uses a deliberately simple prompt so a
            // malformed first response or a style-specific prompt cannot
            // degrade the carousel into one sentence per slide.
            if (!['yt-thumb', 'reels', 'shorts'].includes(styleMode)) {
                try {
                    const retryRes = await fetch('/api/openai/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'gpt-4o',
                            messages: [{
                                role: 'user',
                                content: `Create exactly ${slideCount} finished social-media carousel slides from SOURCE.
Return JSON only: {"caption":"...","hashtags":"...","slides":[{"title":"...","body":"...","bullets":[]}]}
- Every slide must contain 18-32 words total including the headline.
- Use a specific 5-8 word headline and 1-2 concise sentences with context and takeaway. Keep visible copy under 5 lines.
- Each slide must cover a different angle. Never put all source material on slide 1, repeat the headline as the body, or return a one-line placeholder.
- Use only facts in SOURCE. Preserve names, numbers, qualifiers and approximate values. Do not invent facts.
- Use paired **bold** markers for one important phrase. Do not output [h], [BIG], HTML, layout notes or editing instructions.

SOURCE:
${creatorSourceText(topic.topic)}`
                            }],
                            max_tokens: 4500,
                            temperature: 0.5,
                            response_format: { type: 'json_object' },
                        }),
                    });
                    if (!retryRes.ok) throw new Error(`AI retry failed (${retryRes.status}).`);
                    const retryData = await retryRes.json();
                    const retryParsed = parseJsonResponse(retryData.choices[0].message.content);
                    if (!Array.isArray(retryParsed.slides) || retryParsed.slides.length !== slideCount || retryParsed.slides.some(s => creatorWordCount(s) < 16 || creatorWordCount(s) > 36)) {
                        throw new Error('AI retry returned thin slides.');
                    }
                    const retrySlides = retryParsed.slides.map(s => {
                        if (styleMode === 'li-creator') return s;
                        const keyword = s.imagePrompt || s.title || topic.topic;
                        return s.image ? s : { ...s, image: `https://pollinations.ai/p/${encodeURIComponent(keyword)}?width=1080&height=1080&nologo=1` };
                    });
                    setSlides(retrySlides);
                    setCurrentSlide(0);
                    setCaptionData({ caption: retryParsed.caption || '', hashtags: retryParsed.hashtags || '' });
                    setError('');
                    return;
                } catch (retryError) {
                    console.warn('Final carousel AI retry failed; using source fallback.', retryError);
                }
            }
            // Keep the builder usable when the optional AI provider is
            // unavailable. The source-structuring route returns a deterministic
            // carousel from the user's text and itself falls back without AI.
            try {
                const fallbackRes = await fetch('/api/generate/tweet-carousel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: creatorSourceText(topic.topic),
                        tone: styleMode === 'li-creator' ? 'Clear editorial social post' : 'Clear and authoritative',
                        slideCount,
                        style: styleMode,
                    }),
                });
                if (!fallbackRes.ok) throw new Error('Source fallback failed');
                const fallbackData = await fallbackRes.json();
                if (!Array.isArray(fallbackData.slides) || !fallbackData.slides.length) throw new Error('No fallback slides returned');
                const fallbackSlides = fallbackData.slides.map((slide, index) => ({
                    ...slide,
                    title: slide.title || `Slide ${index + 1}`,
                    body: slide.body || '',
                    icon: index === 0 ? '🔥' : index === fallbackData.slides.length - 1 ? '🚀' : '💡',
                    tag: index === 0 ? 'Cover' : index === fallbackData.slides.length - 1 ? 'Takeaway' : 'Detail',
                    bullets: Array.isArray(slide.bullets) ? slide.bullets : [],
                }));
                setSlides(fallbackSlides);
                setCurrentSlide(0);
                setCaptionData({ caption: '', hashtags: '' });
                setError(fallbackData.source === 'source-structured'
                    ? 'AI could not complete the rewrite, so the carousel was structured from your source text.'
                    : '');
            } catch {
                setError(msg.toLowerCase().includes('fetch') ? 'Network error — check your API key and internet' : (msg || 'Failed. Try again.'));
            }
        } finally { setLoading(false); }
    }

    function updateIndividualPost(index, value) {
        setIndividualPosts(prev => prev.map((post, postIndex) => postIndex === index ? value : post));
    }

    function resetIndividualSet() {
        setIndividualImageSet(null);
        setCopiedCaptionIndex(null);
        setError('');
    }

    async function generateIndividualImageSet() {
        const requestedPosts = individualPosts.map(post => post.trim());
        if (requestedPosts.some(post => !post)) {
            setError('Add all six post ideas before generating your image set.');
            return;
        }

        setIndividualLoading(true);
        setError('');
        setIndividualImageSet(null);

        try {
            const prompt = `You are a senior Instagram content strategist and art director. Turn the six post ideas below into six separate, ready-to-publish square Instagram graphics.

The images must feel like one cohesive campaign using the selected visual system: ${styleMode} / ${theme.name}. Keep the subject matter different, but use the same design DNA: color treatment, typography energy, composition and level of polish.

Return ONLY valid JSON:
{
  "posts": [
    {
      "title": "A sharp 4-8 word on-image hook",
      "body": "Two short, useful sentences that add context and a practical takeaway, 18-30 words total. Separate the sentences with a line break.",
      "icon": "one relevant emoji",
      "tag": "a 1-3 word content label",
      "imagePrompt": "Detailed text-free visual art direction for the background image only; no typography, no logo, no words",
      "caption": "A complete Instagram caption of 60-90 words. Start with a strong first-line hook, add specific useful context, then finish with one clear call to comment, save or share. Use short paragraphs. Do not include hashtags here.",
      "hashtags": ["#one", "#two", "#three", "#four", "#five"]
    }
  ]
}

Rules:
- Return exactly 6 posts in exactly the same order as the six inputs.
- Every title and body must be clean plain text. Never use markdown, asterisks, [h] tags, HTML or design instructions in title/body.
- Treat each input as a rough idea, not finished copy. Expand it with a clear point of view, specific context and a useful takeaway.
- Make each graphic understandable at a glance, but do not reduce the body to a vague one-liner. Use two compact sentences and no lists.
- Every caption must be a complete, current, specific and human Instagram caption—not a title, summary fragment or generic AI copy.
- Keep captions between 60 and 90 words, with 3-5 short paragraphs and a natural engagement CTA.
- Keep the on-image body between 18 and 30 words total, split into two short sentences.
- hashtags must contain exactly five relevant hashtags, each beginning with #.

POST 1: ${requestedPosts[0]}
POST 2: ${requestedPosts[1]}
POST 3: ${requestedPosts[2]}
POST 4: ${requestedPosts[3]}
POST 5: ${requestedPosts[4]}
POST 6: ${requestedPosts[5]}`;

            const response = await fetch('/api/openai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 3600,
                    temperature: 0.72,
                    response_format: { type: 'json_object' },
                }),
            });
            if (!response.ok) {
                const details = await response.json().catch(() => ({}));
                throw new Error(typeof details.error === 'string' ? details.error : 'The content generator is unavailable.');
            }

            const data = await response.json();
            const parsed = parseJsonResponse(data.choices?.[0]?.message?.content);
            if (!Array.isArray(parsed.posts) || parsed.posts.length !== 6) {
                throw new Error('The generator did not return six complete image posts. Please try again.');
            }

            const preparedPosts = parsed.posts.map((post, index) => ({
                title: cleanIndividualCopy(post.title) || `Post ${index + 1}`,
                body: cleanIndividualCopy(post.body, true),
                icon: cleanIndividualCopy(post.icon) || '✦',
                tag: cleanIndividualCopy(post.tag) || 'INSIGHT',
                imagePrompt: cleanIndividualCopy(post.imagePrompt),
                caption: cleanIndividualCopy(post.caption, true),
                hashtags: normaliseFiveHashtags(post.hashtags),
                image: '',
                imageError: false,
            }));

            // If the first response is technically valid but still thin, ask the AI
            // for an enrichment pass before rendering anything. This prevents short
            // placeholder copy from reaching the six-post result grid.
            const needsEnrichment = preparedPosts.some(post => individualWordCount(post.body) < 14 || individualWordCount(post.caption) < 45);
            let finalPosts = preparedPosts;
            if (needsEnrichment) {
                const enrichmentResponse = await fetch('/api/openai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [{ role: 'user', content: `Enrich these six Instagram post drafts into complete, ready-to-publish content. Return ONLY valid JSON in exactly this shape: {"posts":[{"title":"...","body":"...","icon":"...","tag":"...","imagePrompt":"...","caption":"...","hashtags":["#one","#two","#three","#four","#five"]}]}\n\nRules:\n- Return exactly 6 posts in the same order.\n- Keep every title sharp and 5-9 words.\n- Make every body 18-30 words total, two useful sentences separated by a line break.\n- Make every caption 60-90 words with 3-5 short paragraphs: hook, specific insight, practical takeaway, and one natural CTA.\n- Keep the writing specific to each original idea and do not invent unsupported facts.\n- Keep exactly five relevant hashtags per post.\n- Do not add markdown, layout notes, hashtags inside captions, or placeholder phrases.\n\nDRAFTS:\n${JSON.stringify(finalPosts)}` }],
                        max_tokens: 5000,
                        temperature: 0.55,
                        response_format: { type: 'json_object' },
                    }),
                });
                if (enrichmentResponse.ok) {
                    const enrichmentData = await enrichmentResponse.json();
                    const enriched = parseJsonResponse(enrichmentData.choices?.[0]?.message?.content);
                    if (Array.isArray(enriched.posts) && enriched.posts.length === 6) {
                        finalPosts = enriched.posts.map((post, index) => ({
                            ...preparedPosts[index],
                            title: cleanIndividualCopy(post.title) || preparedPosts[index].title,
                            body: cleanIndividualCopy(post.body, true) || preparedPosts[index].body,
                            icon: cleanIndividualCopy(post.icon) || preparedPosts[index].icon,
                            tag: cleanIndividualCopy(post.tag) || preparedPosts[index].tag,
                            imagePrompt: cleanIndividualCopy(post.imagePrompt) || preparedPosts[index].imagePrompt,
                            caption: cleanIndividualCopy(post.caption, true) || preparedPosts[index].caption,
                            hashtags: normaliseFiveHashtags(post.hashtags),
                        }));
                    }
                }
            }

            // The graphic templates already create a usable branded post. A generated
            // backdrop is an enhancement, so one failed image request never blocks all six.
            const withImages = await Promise.all(finalPosts.map(async (post, index) => {
                if (!post.imagePrompt) return post;
                try {
                    const imageResponse = await fetch('/api/carousel/retry-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imagePrompt: post.imagePrompt, slideIndex: index }),
                    });
                    if (!imageResponse.ok) throw new Error('Background image unavailable');
                    const imageData = await imageResponse.json();
                    if (!imageData.imageB64) throw new Error('No background image returned');
                    return {
                        ...post,
                        image: imageData.imageB64.startsWith('data:')
                            ? imageData.imageB64
                            : `data:image/png;base64,${imageData.imageB64}`,
                    };
                } catch {
                    return { ...post, imageError: true };
                }
            }));

            setIndividualImageSet(withImages);
        } catch (generationError) {
            setError(generationError?.message || 'Could not generate the six individual images. Please try again.');
        } finally {
            setIndividualLoading(false);
        }
    }

    async function exportIndividualImages() {
        if (!individualImageSet?.length) return;
        setExporting(true);
        try {
            await document.fonts.ready;
            const htmlToImage = await import('html-to-image');
            const JSZipModule = (await import('jszip')).default;
            const zip = new JSZipModule();
            const folder = zip.folder(`instagram-image-set-${Date.now()}`);

            for (let index = 0; index < individualImageSet.length; index++) {
                const element = individualExportRefs.current[index];
                if (!element) continue;
                const imageData = await htmlToImage.toPng(element, {
                    pixelRatio: 1,
                    backgroundColor: theme.bg || '#ffffff',
                    fontEmbedCSS: '',
                });
                folder.file(`post-${String(index + 1).padStart(2, '0')}.png`, imageData.split(',')[1], { base64: true });
            }

            const archive = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
            const url = URL.createObjectURL(archive);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'instagram-image-set.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (exportError) {
            setError(`Image export failed: ${exportError?.message || 'Please try again.'}`);
        } finally {
            setExporting(false);
        }
    }

    async function copyIndividualCaption(post, index) {
        try {
            await navigator.clipboard.writeText(`${post.caption}\n\n${post.hashtags.join(' ')}`.trim());
            setCopiedCaptionIndex(index);
            setTimeout(() => setCopiedCaptionIndex(null), 1600);
        } catch {
            setError('Could not copy the caption. Select and copy it manually.');
        }
    }

    React.useEffect(() => {
        if (creationMode === 'carousel' && topic.topic && !slides && !loading) {
            generateSlides();
        }
    }, [topic.topic, creationMode]);

    async function exportToPDF() {
        if (!slides) return;
        setExporting(true);
        try {
            // Wait for fonts to be fully loaded before capturing
            await document.fonts.ready;

            const htmlToImage = await import('html-to-image');
            const { jsPDF } = await import('jspdf');

            // Export elements are already the correct native size (computedTheme.width x computedTheme.height)
            const SLIDE_W = computedTheme.width;   // 500 (square) or 1080 (vertical)
            const SLIDE_H = computedTheme.height;  // 500 (square) or 1920 (vertical)
            const pdf = new jsPDF({ orientation: isVertical ? 'portrait' : 'square', format: [SLIDE_W, SLIDE_H], unit: 'px' });

            for (let i = 0; i < slides.length; i++) {
                // Use exportRefs (hidden full-size renders), not slideRefs (thumbnails)
                const el = exportRefs.current[i];
                if (!el) continue;
                const imgData = await htmlToImage.toPng(el, {
                    pixelRatio: 1,
                    backgroundColor: theme.bg,
                    fontEmbedCSS: '',
                });
                if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], isVertical ? 'portrait' : 'square');
                pdf.addImage(imgData, 'PNG', 0, 0, SLIDE_W, SLIDE_H, undefined, 'FAST');
            }
            pdf.save(`carousel-${topic.topic.slice(0, 28).replace(/[^a-z0-9]+/gi, '-')}.pdf`);
        } catch (e) { setError('Export failed: ' + e.message); }
        finally { setExporting(false); }
    }

    async function exportToImages() {
        if (!slides) return;
        setExporting(true);
        try {
            await document.fonts.ready;
            const htmlToImage = await import('html-to-image');
            const JSZipModule = (await import('jszip')).default;
            const zip = new JSZipModule();
            const folderName = `carousel-${topic.topic.slice(0, 20).replace(/[^a-z0-9]+/gi, '-')}`;
            const folder = zip.folder(folderName);

            for (let i = 0; i < slides.length; i++) {
                const el = exportRefs.current[i];
                if (!el) continue;

                // Yield to browser event loop to allow GC to run between slides
                await new Promise(r => setTimeout(r, 50));

                // Use JPEG at 85% quality — dramatically lower memory vs PNG
                let dataUrl = null;
                try {
                    dataUrl = await htmlToImage.toJpeg(el, {
                        pixelRatio: 1,
                        backgroundColor: theme.bg || '#ffffff',
                        fontEmbedCSS: '',
                        quality: 0.85,
                    });
                } catch (captureErr) {
                    console.warn(`Slide ${i + 1} capture failed, skipping`, captureErr);
                    continue;
                }

                const slideName = i === 0 ? '01-cover.jpg'
                    : i === slides.length - 1 ? `${String(i + 1).padStart(2, '0')}-cta.jpg`
                        : `${String(i + 1).padStart(2, '0')}-slide.jpg`;

                // Only extract base64 string — don't hold the full dataUrl
                folder.file(slideName, dataUrl.split(',')[1], { base64: true });
                dataUrl = null; // Explicitly free reference
            }

            // Generate ZIP with minimal compression to reduce CPU/memory peak
            const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.download = `${folderName}.zip`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Delay revoke to ensure download starts
            setTimeout(() => URL.revokeObjectURL(url), 5000);

        } catch (e) { setError('Export failed: ' + e.message); }
        finally { setExporting(false); }
    }


    async function exportToVideo() {
        if (!slides) return;
        setExporting(true);
        try {
            await document.fonts.ready;
            const htmlToImage = await import('html-to-image');

            const VIDEO_W = 1080, VIDEO_H = 1920, FPS = 30;
            
            const prevMode = styleMode;
            if (videoSettings.reelTheme && videoSettings.reelTheme !== styleMode) {
                switchStyle(videoSettings.reelTheme);
                await new Promise(r => setTimeout(r, 600)); // allow DOM refresh
            }

            // 1. Setup Audio Engine
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            // Resume AudioContext (Chrome requires user-gesture activation)
            if (audioCtx.state === 'suspended') await audioCtx.resume();
            const dest = audioCtx.createMediaStreamDestination();

            // Always connect a silent oscillator so audioCtx.currentTime advances
            // even when no TTS / BGM audio is playing (critical for 5-sec short mode).
            const silentOsc = audioCtx.createOscillator();
            const silentGain = audioCtx.createGain();
            silentGain.gain.value = 0; // completely silent
            silentOsc.connect(silentGain);
            silentGain.connect(dest);
            silentOsc.start(0);

            let bgmSource = null;
            if (videoSettings.bgm) {
                try {
                    const bgmRes = await fetch('https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3');
                    const arrayBuffer = await bgmRes.arrayBuffer();
                    const bgmBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    bgmSource = audioCtx.createBufferSource();
                    bgmSource.buffer = bgmBuffer;
                    bgmSource.loop = true;
                    const bgmGain = audioCtx.createGain();
                    bgmGain.gain.value = 0.04; // Very low so TTS is king
                    bgmSource.connect(bgmGain);
                    bgmGain.connect(dest);
                    bgmSource.start(0);
                } catch (e) { console.error('BGM load failed', e); }
            }

                // Fetch TTS for all slides mapped to duration
            const slideAudio = await Promise.all(slides.map(async (s) => {
                let text = (s.title || '').replace(/[\[\/?h\]]/g, '');
                if (s.body) text += '. ' + s.body;
                if (s.bullets) text += '. ' + s.bullets.join('. ');
                if (s.cta) text += '. ' + s.cta;

                let buffer = null;
                let duration = videoSettings.length === 'short' ? (5.0 / slides.length) : 3.0;
                
                if (videoSettings.length !== 'short' && videoSettings.voice) {
                    try {
                        const res = await fetch('/api/openai/speech', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ model: 'tts-1', input: text, voice: videoSettings.voice })
                        });
                        if (res.ok) {
                            const ab = await res.arrayBuffer();
                            buffer = await audioCtx.decodeAudioData(ab);
                            duration = buffer.duration + 0.4; // Small pause between slides
                        }
                    } catch (e) { console.error('TTS failed', e); }
                }
                return { buffer, text, duration: videoSettings.length === 'short' ? duration : Math.max(duration, 2) };
            }));

            // 2. Setup an offscreen canvas for the final video frames
            const canvas = document.createElement('canvas');
            canvas.width = VIDEO_W;
            canvas.height = VIDEO_H;
            const ctx = canvas.getContext('2d');

            // We capture the raw slides up front to avoid lag during playback
            // Now we take progressive snapshots for bullet animations!
            const capturedCanvases = [];
            const captureElement = async (el) => {
                const dataUrl = await htmlToImage.toPng(el, {
                    pixelRatio: VIDEO_W / computedTheme.width,
                    backgroundColor: theme.bg,
                    fontEmbedCSS: '',
                });
                const img = new Image();
                img.src = dataUrl;
                await new Promise(res => { img.onload = res; });
                return img;
            };

            for (let i = 0; i < slides.length; i++) {
                const el = exportRefs.current[i];
                if (!el) { capturedCanvases.push([]); continue; }

                const slideSteps = [];
                const bulletItems = el.querySelectorAll('.bullet-item');

                if (bulletItems.length === 0) {
                    const img = await captureElement(el);
                    slideSteps.push(img);
                } else {
                    // Hide all bullets initially
                    bulletItems.forEach(b => {
                        b.style.opacity = '0.2';
                        b.style.filter = 'blur(4px)';
                        b.style.transform = 'scale(0.95)';
                    });

                    // Progressive reveal!
                    for (let step = 0; step < bulletItems.length; step++) {
                        bulletItems[step].style.opacity = '1';
                        bulletItems[step].style.filter = 'none';
                        bulletItems[step].style.transform = 'none';
                        const img = await captureElement(el);
                        slideSteps.push(img);
                    }

                    // Reset to normal just in case
                    bulletItems.forEach(b => {
                        b.style.opacity = '1';
                        b.style.filter = 'none';
                        b.style.transform = 'none';
                    });
                }
                capturedCanvases.push(slideSteps);
            }

            // 3. Setup MediaRecorder on our hidden canvas stream + mixed audio stream
            const stream = canvas.captureStream(FPS);
            const combinedStream = new MediaStream([
                ...stream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]);

            const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' });
            const chunks = [];
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

            const recordingPromise = new Promise((resolve, reject) => {
                mediaRecorder.onstop = () => {
                    if (audioCtx.state === 'running') audioCtx.close();
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    const link = document.createElement('a');
                    link.download = `video-${topic.topic.slice(0, 15).replace(/[^a-z0-9]+/gi, '-')}.webm`;
                    link.href = URL.createObjectURL(blob);
                    link.click();
                    resolve();
                };
                mediaRecorder.onerror = e => reject(e);
            });

            mediaRecorder.start();

            // 4. Realtime rendering loop bound to AudioContext time
            const startTime = audioCtx.currentTime;
            let currentSlideIndex = 0;
            let slideStartTime = startTime;
            let nextSlideTime = slideStartTime + slideAudio[0].duration;

            function playSlideAudio(index) {
                const voiceBuffer = slideAudio[index].buffer;
                if (voiceBuffer) {
                    const voiceSource = audioCtx.createBufferSource();
                    voiceSource.buffer = voiceBuffer;
                    voiceSource.connect(dest);
                    voiceSource.start(0);
                }
            }

            playSlideAudio(0); // Kick off first slide audio

            function drawFrame() {
                const now = audioCtx.currentTime;

                if (now >= nextSlideTime) {
                    currentSlideIndex++;
                    if (currentSlideIndex >= slides.length) {
                        if (bgmSource) bgmSource.stop();
                        silentOsc.stop();
                        mediaRecorder.stop();
                        return;
                    }
                    slideStartTime = now;
                    nextSlideTime = now + slideAudio[currentSlideIndex].duration;
                    playSlideAudio(currentSlideIndex);
                }

                const captList = capturedCanvases[currentSlideIndex];
                if (captList && captList.length > 0) {
                    const progress = (now - slideStartTime) / slideAudio[currentSlideIndex].duration;
                    const stepIndex = Math.min(Math.floor(progress * captList.length), captList.length - 1);
                    const capt = captList[stepIndex];
                    if (capt) {
                        // Letterbox to ensure 9:16 aspect ratio is always respected gracefully
                        ctx.fillStyle = theme.bg;
                        ctx.fillRect(0, 0, VIDEO_W, VIDEO_H);
                        
                        const srcRatio = (capt.naturalWidth || capt.width) / (capt.naturalHeight || capt.height);
                        const destRatio = VIDEO_W / VIDEO_H;
                        
                        let drawW = VIDEO_W;
                        let drawH = VIDEO_H;
                        let offsetX = 0;
                        let offsetY = 0;
                        
                        if (srcRatio > destRatio) {
                            // Source is wider than destination (e.g. square 1:1 fitting into tall 9:16)
                            drawH = VIDEO_W / srcRatio;
                            offsetY = (VIDEO_H - drawH) / 2;
                        } else {
                            // Source is taller than destination 
                            drawW = VIDEO_H * srcRatio;
                            offsetX = (VIDEO_W - drawW) / 2;
                        }
                        
                        ctx.drawImage(capt, offsetX, offsetY, drawW, drawH);
                        
                        if (videoSettings.subtitles) {
                            let subText = slideAudio[currentSlideIndex]?.text || slides[currentSlideIndex]?.title || '';
                            subText = subText.length > 60 ? subText.substring(0, 60) + "..." : subText;
                            if (subText) {
                                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                                ctx.fillRect(20, VIDEO_H - 400, VIDEO_W - 40, 160);
                                ctx.font = "bold 50px Arial";
                                ctx.fillStyle = "#ffffff";
                                ctx.textAlign = "center";
                                ctx.textBaseline = "middle";
                                ctx.fillText(subText, VIDEO_W / 2, VIDEO_H - 320, VIDEO_W - 80);
                            }
                        }
                    }

                    // Optional Abstract B-Roll Overlay
                    if (videoSettings.bRoll) {
                        const timeOffset = now * 50;
                        const grad = ctx.createLinearGradient(0, 0, VIDEO_W, VIDEO_H);
                        grad.addColorStop(0, `rgba(255,255,255,0.0)`);
                        grad.addColorStop(0.5, `rgba(255,255,255,0.02)`);
                        grad.addColorStop(1, `rgba(255,255,255,0.0)`);
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.arc(VIDEO_W / 2 + Math.sin(timeOffset / 100) * 150, VIDEO_H / 2 + Math.cos(timeOffset / 100) * 150, Math.abs(Math.sin(timeOffset / 50) * 200) + 400, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Simple progress bar
                    ctx.fillStyle = theme.accent + '80';
                    ctx.fillRect(0, VIDEO_H - 10, VIDEO_W * progress, 10);
                }

                requestAnimationFrame(drawFrame);
            }

            drawFrame();
            await recordingPromise;
            
            if (videoSettings.reelTheme && videoSettings.reelTheme !== prevMode) {
                switchStyle(prevMode);
            }

        } catch (e) {
            setError('Video Export failed: ' + e.message + '. (Note: Safari may not support webm capture)');
        } finally {
            setExporting(false);
        }
    }

    async function exportFullKit() {
        if (!slides) return;
        setExporting(true);
        try {
            await document.fonts.ready;
            const htmlToImage = await import('html-to-image');
            const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const JSZip = !isMobile ? (await import('jszip')).default : null;
            
            // 1. Capture all slides ONCE to optimize performance vastly
            let SLIDE_W = computedTheme.width;
            let SLIDE_H = computedTheme.height;
            let capturedCanvases = [];
            for (let i = 0; i < slides.length; i++) {
                const el = exportRefs.current[i];
                if (!el) { capturedCanvases.push(null); continue; }
                const dataUrl = await htmlToImage.toPng(el, {
                    pixelRatio: 1,
                    backgroundColor: theme.bg,
                    fontEmbedCSS: '',
                });
                const img = new Image();
                img.src = dataUrl;
                await new Promise(res => { img.onload = res; });
                capturedCanvases.push(img);
            }
            
            // 2. Generate PDF
            try {
                let jsPDFModule;
                // @ts-ignore
                if (window.jspdf?.jsPDF) jsPDFModule = window.jspdf.jsPDF;
                else {
                    await new Promise((resolve, reject) => {
                        const s = document.createElement('script');
                        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                        s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
                    });
                    // @ts-ignore
                    jsPDFModule = window.jspdf.jsPDF;
                }
                const isVerticalSlide = SLIDE_H > SLIDE_W;
                const pdf = new jsPDFModule({ orientation: isVerticalSlide ? 'portrait' : 'square', format: [SLIDE_W, SLIDE_H], unit: 'px' });
                for (let i = 0; i < capturedCanvases.length; i++) {
                    if (!capturedCanvases[i]) continue;
                    const imgData = capturedCanvases[i].src;
                    if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], isVerticalSlide ? 'portrait' : 'square');
                    pdf.addImage(imgData, 'PNG', 0, 0, SLIDE_W, SLIDE_H, undefined, 'FAST');
                }
                pdf.save(`carousel-kit-${Date.now()}.pdf`);
            } catch (e) { console.warn('PDF failed in kit', e); }

            // 3. Generate ZIP of PNGs
            try {
                const folderName = `carousel-kit-${Date.now()}`;
                if (!isMobile) {
                    const zip = new JSZip();
                    const folder = zip.folder(folderName);
                    for (let i = 0; i < capturedCanvases.length; i++) {
                        if (!capturedCanvases[i]) continue;
                        const response = await fetch(capturedCanvases[i].src);
                        const blob = await response.blob();
                        const slideName = i === 0 ? '01-cover.png' : i === slides.length - 1 ? `${String(i + 1).padStart(2, '0')}-cta.png` : `${String(i + 1).padStart(2, '0')}-slide.png`;
                        folder.file(slideName, blob);
                    }
                    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
                    const link = document.createElement('a');
                    link.download = `${folderName}.zip`; link.href = URL.createObjectURL(zipBlob); link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 5000);
                } else {
                     capturedCanvases.forEach((c, idx) => {
                          if (!c) return;
                          setTimeout(() => {
                              const url = c.src;
                              const link = document.createElement('a');
                              link.download = `slide-${idx+1}.png`; link.href = url; link.click();
                          }, idx * 400);
                     });
                }
            } catch (e) { console.warn('Zip failed in kit', e); }

            // 3b. Re-capture if Reel Style Override is present
            const prevMode = styleMode;
            if (videoSettings.reelTheme && videoSettings.reelTheme !== styleMode) {
                switchStyle(videoSettings.reelTheme);
                // Give React a moment to render the new state into the DOM
                await new Promise(r => setTimeout(r, 600));
                
                // Re-capture specifically for the Reel
                capturedCanvases = [];
                // Dimensions might have changed due to theme override layout (e.g. padding changes)
                const newExportEl = exportRefs.current[0];
                if (newExportEl) {
                    SLIDE_W = newExportEl.offsetWidth || SLIDE_W;
                    SLIDE_H = newExportEl.offsetHeight || SLIDE_H;
                }
                
                for (let i = 0; i < slides.length; i++) {
                    const el = exportRefs.current[i];
                    if (!el) { capturedCanvases.push(null); continue; }
                    const dataUrl = await htmlToImage.toPng(el, {
                        pixelRatio: 1,
                        backgroundColor: '#000000',
                        fontEmbedCSS: '',
                    });
                    const img = new Image();
                    img.src = dataUrl;
                    await new Promise(res => { img.onload = res; });
                    capturedCanvases.push(img);
                }
            }

            // 4. Generate 9:16 Reel Video with AI Voiceover and BGM
            try {
                const VIDEO_W = 1080, VIDEO_H = 1920, FPS = 30;
                
                // 4a. Setup Audio Engine
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioContext();
                // Resume AudioContext (Chrome requires user-gesture activation)
                if (audioCtx.state === 'suspended') await audioCtx.resume();
                const dest = audioCtx.createMediaStreamDestination();
                
                // Always connect a silent oscillator so audioCtx.currentTime advances
                // even when no TTS / BGM audio is playing (critical for 5-sec short mode).
                const silentOsc = audioCtx.createOscillator();
                const silentGain = audioCtx.createGain();
                silentGain.gain.value = 0; // completely silent
                silentOsc.connect(silentGain);
                silentGain.connect(dest);
                silentOsc.start(0);
                
                let bgmSource = null;
                if (videoSettings.bgm) {
                    try {
                        const bgmRes = await fetch('https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3');
                        const arrayBuffer = await bgmRes.arrayBuffer();
                        const bgmBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                        bgmSource = audioCtx.createBufferSource();
                        bgmSource.buffer = bgmBuffer;
                        bgmSource.loop = true;
                        const bgmGain = audioCtx.createGain();
                        bgmGain.gain.value = 0.04;
                        bgmSource.connect(bgmGain);
                        bgmGain.connect(dest);
                        bgmSource.start(0);
                    } catch (e) { console.error('BGM load failed in kit', e); }
                }

                // Fetch TTS
                const slideAudio = await Promise.all(slides.map(async (s) => {
                    let text = (s.title || '').replace(/[\[\/?h\]]/g, '');
                    if (s.body) text += '. ' + s.body;
                    if (s.bullets) text += '. ' + s.bullets.join('. ');
                    if (s.cta) text += '. ' + s.cta;

                    let buffer = null;
                    let duration = videoSettings.length === 'short' ? (5.0 / slides.length) : 3.0;

                    if (videoSettings.length !== 'short' && videoSettings.voice) {
                        try {
                            const res = await fetch('/api/openai/speech', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ model: 'tts-1', input: text, voice: videoSettings.voice })
                            });
                            if (res.ok) {
                                const ab = await res.arrayBuffer();
                                buffer = await audioCtx.decodeAudioData(ab);
                                duration = buffer.duration + 0.4;
                            }
                        } catch (e) { console.error('TTS failed in kit', e); }
                    }
                    return { buffer, text, duration: videoSettings.length === 'short' ? duration : Math.max(duration, 2) };
                }));

                const vCanvas = document.createElement('canvas'); vCanvas.width = VIDEO_W; vCanvas.height = VIDEO_H;
                const vCtx = vCanvas.getContext('2d');

                // We capture the raw slides up front to avoid lag during playback
                // Now we take progressive snapshots for bullet animations!
                const videoCapturedCanvases = [];
                const captureReelElement = async (el) => {
                    const dataUrl = await htmlToImage.toPng(el, {
                        pixelRatio: VIDEO_W / computedTheme.width,
                        backgroundColor: theme.bg,
                        fontEmbedCSS: '',
                    });
                    const img = new Image();
                    img.src = dataUrl;
                    await new Promise(res => { img.onload = res; });
                    return img;
                };

                for (let i = 0; i < slides.length; i++) {
                    const el = exportRefs.current[i];
                    if (!el) { videoCapturedCanvases.push([]); continue; }

                    const slideSteps = [];
                    const bulletItems = el.querySelectorAll('.bullet-item');

                    if (bulletItems.length === 0) {
                        const img = await captureReelElement(el);
                        slideSteps.push(img);
                    } else {
                        // Hide all bullets initially
                        bulletItems.forEach(b => {
                            b.style.opacity = '0.2';
                            b.style.filter = 'blur(4px)';
                            b.style.transform = 'scale(0.95)';
                        });

                        // Progressive reveal!
                        for (let step = 0; step < bulletItems.length; step++) {
                            bulletItems[step].style.opacity = '1';
                            bulletItems[step].style.filter = 'none';
                            bulletItems[step].style.transform = 'none';
                            const img = await captureReelElement(el);
                            slideSteps.push(img);
                        }

                        // Reset to normal just in case
                        bulletItems.forEach(b => {
                            b.style.opacity = '1';
                            b.style.filter = 'none';
                            b.style.transform = 'none';
                        });
                    }
                    videoCapturedCanvases.push(slideSteps);
                }

                const stream = vCanvas.captureStream(FPS);
                
                // Combine Audio & Video streams
                const combinedStream = new MediaStream([
                    ...stream.getVideoTracks(),
                    ...dest.stream.getAudioTracks()
                ]);
                
                const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
                const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
                const chunks = [];
                mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                
                const recordingPromise = new Promise((resolve, reject) => {
                    mediaRecorder.onstop = () => {
                        if (audioCtx.state === 'running') audioCtx.close();
                        const blob = new Blob(chunks, { type: mimeType });
                        const link = document.createElement('a');
                        link.download = `reel-${topic.topic.slice(0, 15).replace(/[^a-z0-9]+/gi, '-')}.webm`;
                        link.href = URL.createObjectURL(blob);
                        link.click();
                        resolve();
                    };
                    mediaRecorder.onerror = e => reject(e);
                });

                mediaRecorder.start();

                // 4. Realtime rendering loop bound to AudioContext time
                const startTime = audioCtx.currentTime;
                let currentSlideIndex = 0;
                let slideStartTime = startTime;
                let nextSlideTime = slideStartTime + slideAudio[0].duration;

                function playSlideAudio(index) {
                    const voiceBuffer = slideAudio[index].buffer;
                    if (voiceBuffer && audioCtx.state === 'running') {
                        const voiceSource = audioCtx.createBufferSource();
                        voiceSource.buffer = voiceBuffer;
                        voiceSource.connect(dest);
                        voiceSource.start(0);
                    }
                }

                playSlideAudio(0); // Kick off first slide audio

                function drawFrame() {
                    const now = audioCtx.currentTime;

                    if (now >= nextSlideTime) {
                        currentSlideIndex++;
                        if (currentSlideIndex >= slides.length) {
                            if (bgmSource) bgmSource.stop();
                            silentOsc.stop();
                            mediaRecorder.stop();
                            return;
                        }
                        slideStartTime = now;
                        nextSlideTime = now + slideAudio[currentSlideIndex].duration;
                        playSlideAudio(currentSlideIndex);
                    }

                    const captList = videoCapturedCanvases[currentSlideIndex];
                    if (captList && captList.length > 0) {
                        const progress = (now - slideStartTime) / slideAudio[currentSlideIndex].duration;
                        const stepIndex = Math.min(Math.floor(progress * captList.length), captList.length - 1);
                        const capt = captList[stepIndex];
                        if (capt) {
                            vCtx.fillStyle = theme.bg;
                            vCtx.fillRect(0, 0, VIDEO_W, VIDEO_H);
                            
                             const srcRatio = (capt.naturalWidth || capt.width) / (capt.naturalHeight || capt.height);
                            const destRatio = VIDEO_W / VIDEO_H;
                            
                            let drawW = VIDEO_W;
                            let drawH = VIDEO_H;
                            let offsetX = 0;
                            let offsetY = 0;
                            
                            if (srcRatio > destRatio) {
                                drawH = VIDEO_W / srcRatio;
                                offsetY = (VIDEO_H - drawH) / 2;
                            } else {
                                drawW = VIDEO_H * srcRatio;
                                offsetX = (VIDEO_W - drawW) / 2;
                            }
                            
                            vCtx.drawImage(capt, offsetX, offsetY, drawW, drawH);
                            
                            if (videoSettings.subtitles) {
                                let subText = slideAudio[currentSlideIndex]?.text || slides[currentSlideIndex]?.title || '';
                                subText = subText.length > 60 ? subText.substring(0, 60) + "..." : subText;
                                if (subText) {
                                    vCtx.fillStyle = 'rgba(0,0,0,0.7)';
                                    vCtx.fillRect(20, VIDEO_H - 400, VIDEO_W - 40, 160);
                                    vCtx.font = "bold 50px Arial";
                                    vCtx.fillStyle = "#ffffff";
                                    vCtx.textAlign = "center";
                                    vCtx.textBaseline = "middle";
                                    vCtx.fillText(subText, VIDEO_W / 2, VIDEO_H - 320, VIDEO_W - 80);
                                }
                            }
                        }

                        if (videoSettings.bRoll) {
                            const timeOffset = now * 50;
                            const grad = vCtx.createLinearGradient(0, 0, VIDEO_W, VIDEO_H);
                            grad.addColorStop(0, `rgba(255,255,255,0.0)`);
                            grad.addColorStop(0.5, `rgba(255,255,255,0.02)`);
                            grad.addColorStop(1, `rgba(255,255,255,0.0)`);
                            vCtx.fillStyle = grad;
                            vCtx.beginPath();
                            vCtx.arc(VIDEO_W / 2 + Math.sin(timeOffset / 100) * 150, VIDEO_H / 2 + Math.cos(timeOffset / 100) * 150, Math.abs(Math.sin(timeOffset / 50) * 200) + 400, 0, Math.PI * 2);
                            vCtx.fill();
                        }

                        vCtx.fillStyle = theme.accent + '80';
                        vCtx.fillRect(0, VIDEO_H - 10, VIDEO_W * progress, 10);
                    }

                    requestAnimationFrame(drawFrame);
                }

                drawFrame();
                await recordingPromise;
                
                // Restore theme if it was overridden
                if (videoSettings.reelTheme && videoSettings.reelTheme !== prevMode) {
                    switchStyle(prevMode);
                }
            } catch (vidErr) { console.warn('Video failed in kit', vidErr); }

        } catch (err) {
            setError('Full Kit Export failed: ' + err.message);
        } finally {
            setExporting(false);
        }
    }

    function saveEdit() {
        if (!editingSlide) return;
        setSlides(prev => prev.map((s, i) => i === editingSlide.index ? editingSlide.data : s));
        setEditingSlide(null); setEditMode(false);
    }

    const accentColor = theme.accent;

    return (
        <>
            <style>{`
                .carousel-builder-container { display: flex; gap: 28px; max-width: 1120px; margin: 0 auto; width: 100%; transition: all 0.3s; padding: 20px; box-sizing: border-box; }
                .carousel-left-panel { width: 270px; flex-shrink: 0; overflow: hidden; display: flex; flex-direction: column; gap: 14px; }
                .carousel-right-panel { flex: 1; display: flex; flex-direction: column; gap: 14px; align-items: center; width: 100%; max-width: 100vw; overflow-x: hidden; }
                .carousel-preview-scaler { transform-origin: top center; transition: all 0.3s; width: 100%; display: flex; flex-direction: column; align-items: center; }
                @media (max-width: 850px) {
                    .carousel-builder-container { flex-direction: column-reverse; padding: 10px; gap: 40px; }
                    .carousel-left-panel { width: 100%; }
                    .carousel-preview-scaler { transform: scale(0.65); margin-bottom: -180px; }
                }
                @media (max-width: 500px) {
                    .carousel-preview-scaler { transform: scale(0.48); margin-bottom: -260px; }
                }
            `}</style>
            <div className="carousel-builder-container">
                {/* ── Left Panel ── */}
                <div className="carousel-left-panel">
                    <div>
                        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 8 }}>← Back</button>
                        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{creationMode === 'image-set' ? 'Image Post Studio' : 'Carousel Studio'}</h3>
                        <p style={{ color: 'var(--muted-foreground)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                            {creationMode === 'image-set' ? 'Six individual posts. One visual system.' : `${topic.topic.slice(0, 50)}${topic.topic.length > 50 ? '…' : ''}`}
                        </p>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Create</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 4, borderRadius: 10, background: 'var(--muted)' }}>
                            <button onClick={() => { setCreationMode('carousel'); setError(''); }} style={{ padding: '9px 6px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 800, color: creationMode === 'carousel' ? 'var(--background)' : 'var(--muted-foreground)', background: creationMode === 'carousel' ? 'var(--primary)' : 'transparent' }}>
                                Carousel
                            </button>
                            <button onClick={() => { setCreationMode('image-set'); setPlatform('instagram'); setError(''); }} style={{ padding: '9px 6px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 800, color: creationMode === 'image-set' ? 'var(--background)' : 'var(--muted-foreground)', background: creationMode === 'image-set' ? 'var(--primary)' : 'transparent' }}>
                                6 Image Posts
                            </button>
                        </div>
                    </div>

                    {/* Platform mode */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Platform</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {PLATFORMS.map(p => (
                                <button key={p.id} onClick={() => { setPlatform(p.id); if (p.id === 'infographic') switchStyle('infographic'); }} style={{
                                    flex: 1, padding: '9px 6px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                                    border: `2px solid ${platform === p.id ? accentColor : 'var(--border)'}`,
                                    background: platform === p.id ? `${accentColor}15` : 'var(--card)',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: platform === p.id ? accentColor : 'var(--muted-foreground)' }}>{p.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {creationMode === 'image-set' && (
                        <div style={{ padding: 12, borderRadius: 12, border: '1px solid var(--sky)', background: 'var(--sky-bg)', display: 'flex', flexDirection: 'column', gap: 9 }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 850, color: 'var(--sky-ink)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Six individual post ideas</div>
                                <p style={{ fontSize: 11, lineHeight: 1.45, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>Each idea becomes a standalone square graphic in the style you choose below.</p>
                            </div>
                            {individualPosts.map((post, index) => (
                                <label key={index} style={{ display: 'block' }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--sky-ink)', display: 'block', marginBottom: 4 }}>POST {index + 1}</span>
                                    <textarea value={post} onChange={event => updateIndividualPost(index, event.target.value)} placeholder={`Idea for post ${index + 1}`} className="input-field" style={{ minHeight: 58, resize: 'vertical', fontSize: 11, lineHeight: 1.45, padding: 8 }} />
                                </label>
                            ))}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 750, color: 'var(--sky-ink)' }}>✦ Every post includes a viral-style Instagram caption and exactly 5 hashtags.</div>
                        </div>
                    )}

                    {/* Style mode */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Style</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                            {STYLE_MODES.map(m => (
                                <button key={m.id} onClick={() => switchStyle(m.id)} style={{
                                    padding: '9px 6px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                                    border: `2px solid ${styleMode === m.id ? 'var(--primary)' : 'var(--border)'}`,
                                    background: styleMode === m.id ? 'var(--primary-muted)' : 'var(--card)',
                                    textAlign: 'center',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: styleMode === m.id ? 'var(--primary)' : 'var(--foreground)' }}>{m.label}</div>
                                    <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>{m.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Author */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span>Your Name / Handle</span>
                            {author && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sage-ink)', letterSpacing: 0.5 }}>✓ Saved</span>}
                        </label>
                        <input
                            value={author}
                            onChange={e => {
                                setAuthor(e.target.value);
                                if (typeof window !== 'undefined') localStorage.setItem('carousel_author', e.target.value);
                            }}
                            placeholder="e.g. JohnDoe"
                            className="input-field" style={{ fontSize: 13 }}
                        />
                    </div>

                    {/* Company Name */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span>Company / Brand Name</span>
                            {companyName && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sage-ink)', letterSpacing: 0.5 }}>✓ Saved</span>}
                        </label>
                        <input
                            value={companyName}
                            onChange={e => {
                                setCompanyName(e.target.value);
                                if (typeof window !== 'undefined') localStorage.setItem('carousel_company', e.target.value);
                            }}
                            placeholder="e.g. Acme Corp"
                            className="input-field" style={{ fontSize: 13 }}
                        />
                    </div>

                    {/* Profile Picture & Subtitle (for Creator Post style) */}
                    {styleMode === 'li-creator' && (
                        <div style={{ background: 'var(--sky-bg)', border: '1px solid var(--sky)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--sky-ink)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                Creator Profile
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                    <span>Profile Picture</span>
                                    {profilePic && <button onClick={() => { setProfilePic(''); localStorage.removeItem('carousel_profilepic'); }} style={{ fontSize: 9, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', outline: 'none' }}>Remove</button>}
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {profilePic && (
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            background: 'var(--border)',
                                            padding: 2, flexShrink: 0,
                                        }}>
                                            <img src={profilePic} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--card)' }} />
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleProfilePicUpload} style={{ fontSize: 11, flex: 1, color: 'var(--muted-foreground)' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', display: 'block', marginBottom: 5 }}>Subtitle / Bio</label>
                                <input
                                    value={subtitle}
                                    onChange={e => {
                                        setSubtitle(e.target.value);
                                        if (typeof window !== 'undefined') localStorage.setItem('carousel_subtitle', e.target.value);
                                    }}
                                    placeholder="e.g. Investment banking x Fund Raising x M&A"
                                    className="input-field" style={{ fontSize: 12 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Branding: Logo & Website */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span>Brand Logo</span>
                            {logo && <button onClick={() => { setLogo(''); localStorage.removeItem('carousel_logo'); }} style={{ fontSize: 9, background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', outline: 'none' }}>Remove</button>}
                        </label>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: 11, width: '100%', padding: '6px 0', color: 'var(--muted-foreground)' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span>Website URL</span>
                            {website && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sage-ink)', letterSpacing: 0.5 }}>✓ Saved</span>}
                        </label>
                        <input
                            value={website}
                            onChange={e => {
                                setWebsite(e.target.value);
                                if (typeof window !== 'undefined') localStorage.setItem('carousel_website', e.target.value);
                            }}
                            placeholder="e.g. acme.com"
                            className="input-field" style={{ fontSize: 13 }}
                        />
                    </div>

                    {/* Slide count */}
                    {creationMode === 'carousel' && <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>
                            Slides: <span style={{ color: accentColor }}>{slideCount}</span>
                        </label>
                        <input type="range" min={styleMode === 'li-creator' ? 1 : 5} max={12} value={slideCount} onChange={e => setSlideCount(Number(e.target.value))} style={{ width: '100%', accentColor }} />
                    </div>}

                    <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>
                            Font Family
                        </label>
                        <select value={customFontFamily} onChange={e => setCustomFontFamily(e.target.value)} className="input-field" style={{ width: '100%', padding: '6px', fontSize: 12, borderRadius: 6 }}>
                            <option value="">Default (Theme Preset)</option>
                            <option value="'Inter', sans-serif">Inter (Modern Sans)</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
                            <option value="'Merriweather', serif">Merriweather (Serif)</option>
                            <option value="'Anton', 'Impact', sans-serif">Anton / Impact (Bold)</option>
                            <option value="monospace">Monospace</option>
                        </select>
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>
                            Text Size Scale: <span style={{ color: accentColor }}>{customFontSizeMultiplier.toFixed(1)}x</span>
                        </label>
                        <input type="range" min={0.5} max={2.0} step={0.1} value={customFontSizeMultiplier} onChange={e => setCustomFontSizeMultiplier(Number(e.target.value))} style={{ width: '100%', accentColor }} />
                    </div>

                    {/* Theme grid */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 7 }}>Color</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {theme.id && theme.id.startsWith('custom') && (
                                <button onClick={() => setTheme(theme)} style={{
                                    padding: '8px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                                    border: `2px solid ${theme.accent}`,
                                    background: `${theme.accent}14`,
                                    display: 'flex', alignItems: 'center', gap: 7, gridColumn: 'span 2'
                                }}>
                                    <div style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, overflow: 'hidden', background: theme.bg, border: `3px solid ${theme.accent}`, boxShadow: `0 0 8px ${theme.accent}60` }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, lineHeight: 1.3, textAlign: 'left' }}>Custom Cloned Theme</span>
                                </button>
                            )}
                            {themes.map(t => (
                                <button key={t.id} onClick={() => setTheme(t)} style={{
                                    padding: '8px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                                    border: `2px solid ${theme.id === t.id ? t.accent : 'var(--border)'} `,
                                    background: theme.id === t.id ? `${t.accent} 14` : 'var(--card)',
                                    display: 'flex', alignItems: 'center', gap: 7,
                                }}>
                                    <div style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, overflow: 'hidden', background: t.bg, border: `3px solid ${t.accent} `, boxShadow: theme.id === t.id ? `0 0 8px ${t.accent} 60` : 'none' }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, color: theme.id === t.id ? t.accent : 'var(--muted-foreground)', lineHeight: 1.3, textAlign: 'left' }}>{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Color Extraction File Input */}
                    {isExtracting ? (
                        <div style={{ padding: '12px', background: 'var(--sky-bg)', border: '1px solid var(--sky)', borderRadius: 12, textAlign: 'center', fontSize: 11, color: 'var(--sky-ink)', fontWeight: 800, marginTop: 10 }}>
                            <div style={{ width: 16, height: 16, border: '2px solid var(--sky)', borderTopColor: 'var(--sky-ink)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 4px' }} />
                            Extracting colors & style…
                        </div>
                    ) : (
                        <div style={{ marginTop: 10 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky-ink)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <span>Clone Design from Image</span>
                            </label>
                            <div style={{ background: 'var(--card)', padding: '6px', borderRadius: 8, border: '1px solid var(--border)' }}>
                                <input type="file" accept="image/*" onChange={handleThemeExtraction} style={{ fontSize: 11, width: '100%', color: 'var(--muted-foreground)' }} />
                            </div>
                        </div>
                    )}

                    {/* Video Settings (always visible for Full Kit / Video exports) */}
                    {creationMode === 'carousel' && <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginTop: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            Video Settings
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* Reel Length Toggle */}
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--foreground)' }}>
                                <span title="5 seconds generates instantly without TTS. Long mode fetches AI Voiceover.">Reel Length</span>
                                <select value={videoSettings.length || 'long'} onChange={e => setVideoSettings(s => ({ ...s, length: e.target.value }))} className="input-field" style={{ padding: '4px 8px', fontSize: 12, width: 110 }}>
                                    <option value="short">5 Seconds (Fast)</option>
                                    <option value="long">Voiceover Paced</option>
                                </select>
                            </label>

                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--foreground)' }}>
                                <span>AI Voiceover</span>
                                <select disabled={videoSettings.length === 'short'} value={videoSettings.voice} onChange={e => setVideoSettings(s => ({ ...s, voice: e.target.value }))} className="input-field" style={{ padding: '4px 8px', fontSize: 12, width: 110, opacity: videoSettings.length === 'short' ? 0.4 : 1 }}>
                                    <option value="alloy">Alloy (Neutral)</option>
                                    <option value="echo">Echo (Male)</option>
                                    <option value="nova">Nova (Female)</option>
                                    <option value="onyx">Onyx (Deep)</option>
                                </select>
                            </label>

                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--foreground)', cursor: 'pointer' }}>
                                <span>Background Music</span>
                                <input type="checkbox" checked={videoSettings.bgm} onChange={e => setVideoSettings(s => ({ ...s, bgm: e.target.checked }))} style={{ width: 16, height: 16, accentColor }} />
                            </label>
                            
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--foreground)', cursor: 'pointer' }}>
                                <span>Subtitles Overlay</span>
                                <input type="checkbox" checked={videoSettings.subtitles} onChange={e => setVideoSettings(s => ({ ...s, subtitles: e.target.checked }))} style={{ width: 16, height: 16, accentColor }} />
                            </label>

                            {/* Override Theme for video/reel specifically */}
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--foreground)' }}>
                                <span title="Use a different template exclusively for the Reel video output">Reel Style</span>
                                <select value={videoSettings.reelTheme || ''} onChange={e => setVideoSettings(s => ({ ...s, reelTheme: e.target.value }))} className="input-field" style={{ padding: '4px 8px', fontSize: 12, width: 110 }}>
                                    <option value="">(Match Carousel)</option>
                                    {STYLE_MODES.map(m => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--foreground)', cursor: 'pointer' }}>
                                <span>Safe Zones Overlay</span>
                                <input type="checkbox" checked={videoSettings.safeZones} onChange={e => setVideoSettings(s => ({ ...s, safeZones: e.target.checked }))} style={{ width: 16, height: 16, accentColor }} />
                            </label>
                        </div>
                    </div>}

                    {error && <div style={{ background: 'var(--rose-bg)', border: '1px solid var(--rose)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--rose-ink)', lineHeight: 1.5 }}>{error}</div>}

                    <button onClick={creationMode === 'image-set' ? generateIndividualImageSet : generateSlides} disabled={loading || individualLoading} className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', opacity: loading || individualLoading ? 0.7 : 1, background: accentColor, borderColor: accentColor }}>
                        {creationMode === 'image-set'
                            ? (individualLoading ? 'Creating 6 image posts…' : individualImageSet ? 'Regenerate 6 Image Posts' : 'Generate 6 Image Posts')
                            : (loading ? 'Writing slides…' : slides ? 'Regenerate' : 'Generate Carousel')}
                    </button>

                    {creationMode === 'image-set' && individualImageSet && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button onClick={exportIndividualImages} disabled={exporting} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 8px' }}>
                                {exporting ? 'Preparing download…' : 'Download 6 PNG Images'}
                            </button>
                            <button onClick={resetIndividualSet} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Create another 6 posts</button>
                            <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Close studio</button>
                        </div>
                    )}

                    {slides && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button onClick={exportFullKit} disabled={exporting} className="btn btn-primary" style={{
                                padding: '16px 10px', fontWeight: 800, fontSize: 13,
                                width: '100%', justifyContent: 'center', boxShadow: exporting ? 'none' : 'var(--shadow-md)',
                                transition: 'all 0.3s ease', opacity: exporting ? 0.7 : 1, fontFamily: 'inherit',
                             }}>
                                {exporting ? 'Formatting Kit…' : 'Download Full Kit (PDF + PNG Zip + Reel)'}
                            </button>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={exportToPDF} title="Best for LinkedIn" disabled={exporting} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '10px 4px', fontSize: 12 }}>
                                    {exporting ? '…' : 'PDF'}
                                </button>
                                <button onClick={exportToImages} title="Best for Instagram / YouTube" disabled={exporting} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '10px 4px', fontSize: 12 }}>
                                    {exporting ? '…' : 'PNGs'}
                                </button>
                                <button onClick={exportToVideo} title="Best for Reels / Shorts" disabled={exporting} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '10px 4px', fontSize: 12, background: 'var(--lavender-bg)', borderColor: 'var(--lavender)', color: 'var(--lavender-ink)' }}>
                                    {exporting ? '…' : 'Video'}
                                </button>
                            </div>
                            <button onClick={() => { setEditMode(true); setEditingSlide({ index: currentSlide, data: { ...slides[currentSlide], bullets: [...(slides[currentSlide].bullets || [])] } }); }}
                                className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                                Edit Slide {currentSlide + 1}
                            </button>
                            <button onClick={() => setIsPublishModalOpen(true)} className="btn btn-secondary btn-sm"
                                style={{ width: '100%', justifyContent: 'center', background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                                Publish to Socials
                            </button>
                            <button onClick={() => { setSlides(null); setCaptionData(null); setCurrentSlide(0); setError(''); }} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                                Create another carousel
                            </button>
                            <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                                Close studio
                            </button>
                        </div>
                    )}

                    {slides && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>All Slides</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
                                {slides.map((s, i) => (
                                    <button key={i} onClick={() => setCurrentSlide(i)} style={{
                                        textAlign: 'left', padding: '7px 9px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                                        border: `1px solid ${i === currentSlide ? accentColor : 'var(--border)'} `,
                                        background: i === currentSlide ? `${accentColor} 10` : 'var(--card)',
                                    }}>
                                        <div style={{ fontSize: 10, color: i === currentSlide ? accentColor : 'var(--muted-foreground)', fontWeight: 700 }}>{s.icon} {i === 0 ? 'COVER' : i === slides.length - 1 ? 'CTA' : `SLIDE ${i + 1} `}</div>
                                        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{(styleMode === 'li-creator' ? creatorPlainText(s.title) : s.title?.replace(/[\[\/?h\]]/g, ''))?.slice(0, 28)}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right Preview ── */}
                <div className="carousel-right-panel">
                    {creationMode === 'image-set' && (
                        <div style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {!individualImageSet && !individualLoading && (
                                <div style={{ minHeight: 360, display: 'grid', placeItems: 'center', padding: 28, borderRadius: 18, border: '1px dashed var(--border)', background: 'var(--card)', textAlign: 'center' }}>
                                    <div>
                                        <div style={{ width: 54, height: 54, borderRadius: 16, margin: '0 auto 14px', display: 'grid', placeItems: 'center', background: `${accentColor}18`, color: accentColor, fontSize: 24 }}>✦</div>
                                        <h2 style={{ fontSize: 22, margin: 0 }}>Six posts. One recognisable look.</h2>
                                        <p style={{ maxWidth: 420, color: 'var(--muted-foreground)', fontSize: 13, lineHeight: 1.6, margin: '10px auto 0' }}>Add six ideas in the left panel, choose a style, then generate six individual Instagram-ready images with matching captions.</p>
                                    </div>
                                </div>
                            )}

                            {individualLoading && (
                                <div style={{ minHeight: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, borderRadius: 18, background: 'var(--card)', border: '1px solid var(--border)' }}>
                                    <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: accentColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    <div style={{ textAlign: 'center' }}><strong style={{ fontSize: 16, color: accentColor }}>Creating your six-post campaign…</strong><p style={{ margin: '6px 0 0', color: 'var(--muted-foreground)', fontSize: 12 }}>Writing captions and building the visual direction for every post.</p></div>
                                </div>
                            )}

                            {individualImageSet && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'end', flexWrap: 'wrap' }}>
                                        <div><div style={{ fontSize: 11, fontWeight: 850, color: accentColor, letterSpacing: 1, textTransform: 'uppercase' }}>Instagram image set</div><h2 style={{ fontSize: 22, margin: '4px 0 0' }}>Six different ideas. One visual campaign.</h2></div>
                                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 750 }}>{theme.name} · Square posts</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                                        {individualImageSet.map((post, index) => (
                                            <article key={`${post.title}-${index}`} style={{ border: '1px solid var(--border)', borderRadius: 15, overflow: 'hidden', background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}>
                                                <div style={{ position: 'relative', height: 280, overflow: 'hidden', background: theme.bg }}>
                                                    <div style={{ width: 500, height: 500, transform: 'scale(0.56)', transformOrigin: 'top left' }}>
                                                        <Slide slide={post} index={0} total={1} theme={individualImageTheme} styleMode={styleMode} author={author} companyName={companyName} logo={logo} website={website} profilePic={profilePic} subtitle={subtitle} />
                                                        <BrandingOverlay logo={logo} website={website} t={individualImageTheme} scale={individualImageTheme.scale || 1} />
                                                    </div>
                                                    <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 7px', borderRadius: 999, fontSize: 10, fontWeight: 800 }}>POST {index + 1}</span>
                                                </div>
                                                <div style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 9 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}><span style={{ fontSize: 10, fontWeight: 850, color: 'var(--muted-foreground)', letterSpacing: 0.7 }}>INSTAGRAM CAPTION</span><button onClick={() => copyIndividualCaption(post, index)} className="btn btn-secondary btn-sm" style={{ fontSize: 10, padding: '4px 7px' }}>{copiedCaptionIndex === index ? 'Copied!' : 'Copy'}</button></div>
                                                    <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--foreground)', margin: 0, whiteSpace: 'pre-wrap' }}>{post.caption}</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{post.hashtags.map(tag => <span key={tag} style={{ fontSize: 10, fontWeight: 750, color: accentColor, padding: '4px 6px', borderRadius: 999, background: `${accentColor}12` }}>{tag}</span>)}</div>
                                                    {post.imageError && <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>The branded template was used while the optional visual backdrop was unavailable.</span>}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {creationMode !== 'image-set' && <>
                    {!slides && !loading && (
                        <div className="carousel-preview-scaler" style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', width: '100%' }}>
                            {/* Live preview */}
                            <div style={{
                                width: 500, height: isVertical ? 500 : 260, position: 'relative', overflow: 'hidden', borderRadius: 12,
                                background: theme.bg,
                                boxShadow: styleMode === 'magazine' ? `0 0 0 1px ${theme.accent} 30, var(--shadow-lg)` : 'var(--shadow-md)',
                                border: styleMode === 'minimal' ? `1px solid ${theme.border || '#e5e7eb'} ` : 'none',
                            }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: styleMode === 'magazine' ? 3 : 5, background: theme.accent }} />
                                <div style={{ padding: '24px 30px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: theme.accent, textTransform: 'uppercase', marginBottom: 14 }}>Preview</div>
                                    {styleMode === 'magazine' ? (
                                        <div style={{ fontFamily: "'Anton', 'Impact', sans-serif", fontSize: 48, lineHeight: 0.95, color: theme.text, textTransform: 'uppercase', letterSpacing: -1 }}>
                                            {topic.topic.split(' ').slice(0, 4).join(' ')}<br />
                                            <span style={{ color: theme.accent }}>{topic.topic.split(' ').slice(4, 7).join(' ')}</span>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 26, fontWeight: 900, color: theme.text, lineHeight: 1.2, letterSpacing: -0.4 }}>
                                            {topic.topic.slice(0, 42)}{topic.topic.length > 42 ? '…' : ''}
                                        </div>
                                    )}
                                    <div style={{ width: 40, height: 3, background: theme.accent, marginTop: 16, borderRadius: 2 }} />
                                    <div style={{ fontSize: 12, color: theme.sub || theme.muted, marginTop: 10 }}>{theme.name} · {slideCount} slides</div>
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: theme.accent, opacity: styleMode === 'magazine' ? 1 : 0.3 }} />
                            </div>
                            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, textAlign: 'center' }}>
                                Enter your name → select a color → <strong style={{ color: accentColor }}>Generate Carousel</strong>
                            </p>
                        </div>
                    )
                    }

                    {
                        loading && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 500 }}>
                                <div style={{ width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: accentColor, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                <p style={{ fontWeight: 800, fontSize: 16, color: accentColor }}>Writing {slideCount} slides…</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[0, 0.15, 0.3].map(d => <div key={d} style={{ width: 9, height: 9, borderRadius: '50%', background: accentColor, animation: `bounce - dot 1s ${d}s infinite` }} />)}
                                </div>
                                <p style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>Crafting your slides…</p>
                            </div>
                        )
                    }

                    {
                        slides && (
                            <>
                                {styleMode === 'li-creator' && !useExactText && slides.some(s => creatorWordCount(s) < 18) && (
                                    <div role="status" style={{ width: '100%', padding: 16, background: 'var(--sky-bg)', borderRadius: 12 }}>
                                        <p style={{ marginBottom: 10 }}>Some slides need a little more context. Rebuild the carousel with concise, complete social copy.</p>
                                        <button className="btn-primary" disabled={loading} onClick={generateSlides}>{loading ? 'Rewriting slides…' : 'Rebuild concise carousel'}</button>
                                    </div>
                                )}
                                {/* Main slide — use previewTheme so fonts/sizes are correct at preview scale */}
                                <div className="carousel-preview-scaler" style={{ position: 'relative' }}>
                                    {/* Prev Button */}
                                    {currentSlide > 0 && (
                                        <button onClick={() => setCurrentSlide(i => i - 1)} style={{
                                            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                            zIndex: 10, background: theme.accent, color: theme.bg,
                                            border: 'none', borderRadius: '50%', width: 40, height: 40,
                                            fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: 'var(--shadow-md)', transition: 'opacity 0.2s',
                                        }}>‹</button>
                                    )}
                                    {/* Next Button */}
                                    {currentSlide < slides.length - 1 && (
                                        <button onClick={() => setCurrentSlide(i => i + 1)} style={{
                                            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                            zIndex: 10, background: theme.accent, color: theme.bg,
                                            border: 'none', borderRadius: '50%', width: 40, height: 40,
                                            fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: 'var(--shadow-md)', transition: 'opacity 0.2s',
                                        }}>›</button>
                                    )}
                                    <div style={{
                                        boxShadow: styleMode === 'magazine'
                                            ? `0 0 0 1px ${theme.accent}30, var(--shadow-lg)`
                                            : 'var(--shadow-lg)',
                                        borderRadius: 12, overflow: 'hidden', position: 'relative',
                                        width: previewTheme.width,
                                        height: previewTheme.height,
                                    }}>
                                        <div ref={el => slideRefs.current[currentSlide] = el} style={{ animation: 'pop-in 0.25s ease', position: 'relative', width: previewTheme.width, height: previewTheme.height }}>
                                            <Slide slide={slides[currentSlide]} index={currentSlide} total={slides.length} theme={previewTheme} styleMode={styleMode} author={author} companyName={companyName} logo={logo} website={website} profilePic={profilePic} subtitle={subtitle} />
                                            <BrandingOverlay logo={logo} website={website} t={previewTheme} scale={previewTheme.scale || 1} />
                                        </div>
                                        {isVertical && videoSettings.safeZones && <SafeZonesOverlay />}
                                    </div>
                                    {/* Slide counter pill */}
                                    <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 700 }}>
                                        {currentSlide + 1} / {slides.length}
                                    </div>
                                </div>


                                {/* Caption & Hashtags */}
                                {captionData && (captionData.caption || captionData.hashtags) && (
                                    <div style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 4, boxShadow: 'var(--shadow-xs)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Post Caption</span>
                                            <button
                                                onClick={(e) => { navigator.clipboard.writeText(captionData.caption + '\n\n' + captionData.hashtags); e.target.innerText = 'Copied!'; setTimeout(() => e.target.innerText = 'Copy', 2000); }}
                                                className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>
                                                Copy
                                            </button>
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                            {captionData.caption}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--sky-ink)', fontWeight: 600, marginTop: 8 }}>
                                            {captionData.hashtags}
                                        </div>
                                    </div>
                                )}

                                {/* Prev / Next */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <button onClick={() => setCurrentSlide(i => Math.max(0, i - 1))} disabled={currentSlide === 0} className="btn btn-secondary btn-sm" style={{ opacity: currentSlide === 0 ? 0.3 : 1 }}>← Prev</button>
                                    <span style={{ fontSize: 13, color: 'var(--muted-foreground)', fontWeight: 700, minWidth: 60, textAlign: 'center' }}>{currentSlide + 1} / {slides.length}</span>
                                    <button onClick={() => setCurrentSlide(i => Math.min(slides.length - 1, i + 1))} disabled={currentSlide === slides.length - 1} className="btn btn-secondary btn-sm" style={{ opacity: currentSlide === slides.length - 1 ? 0.3 : 1 }}>Next →</button>
                                </div>

                                {/* Thumbnail strip */}
                                <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, width: '100%', justifyContent: 'center' }}>
                                    {slides.map((s, i) => {
                                        const isActive = i === currentSlide;
                                        return (
                                            <div key={i}
                                                ref={el => { if (i !== currentSlide) slideRefs.current[i] = el; }}
                                                onClick={() => setCurrentSlide(i)}
                                                style={{
                                                    width: 72, height: 72, borderRadius: 8, flexShrink: 0, overflow: 'hidden', cursor: 'pointer',
                                                    background: i === slides.length - 1 && styleMode === 'minimal' ? theme.accent : theme.bg,
                                                    border: `2px solid ${isActive ? theme.accent : 'var(--border)'}`,
                                                    boxShadow: isActive ? `0 0 12px ${theme.accent} 60` : 'var(--shadow-sm)',
                                                    overflow: 'hidden', position: 'relative',
                                                    display: 'flex', flexDirection: 'column', padding: 7, gap: 3,
                                                    transition: 'all 0.2s',
                                                }}>
                                                <div style={{ fontSize: 15 }}>{s.icon}</div>
                                                <div style={{
                                                    fontSize: 8, fontWeight: 700, lineHeight: 1.3, overflow: 'hidden',
                                                    fontFamily: styleMode === 'magazine' ? "'Anton', Impact, sans-serif" : 'inherit',
                                                    color: i === slides.length - 1 && styleMode === 'minimal' ? '#fff' : (theme.text || '#fff'),
                                                }}>
                                                    {(styleMode === 'li-creator' ? creatorPlainText(s.title) : s.title?.replace(/\[\/?h\]/g, ''))?.slice(0, 22)}
                                                </div>
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: theme.accent }} />
                                                <div style={{ position: 'absolute', top: 4, right: 5, fontSize: 8, color: theme.accent, fontWeight: 800 }}>{i + 1}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )
                    }
                    </>}
                </div >

                {/* Edit Modal */}
                {
                    editMode && editingSlide && (() => {
                        // Ctrl+B bold handler: wraps selected text in **...**
                        function handleBold(e, field, isArray = false, arrayIndex = null) {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                                e.preventDefault();
                                const el = e.target;
                                const start = el.selectionStart;
                                const end = el.selectionEnd;
                                const val = el.value;
                                if (start === end) return; // no selection
                                const selected = val.slice(start, end);
                                const newVal = val.slice(0, start) + '**' + selected + '**' + val.slice(end);
                                if (isArray && arrayIndex === null) {
                                    // bullets array
                                    setEditingSlide(p => ({ ...p, data: { ...p.data, [field]: newVal.split('\n') } }));
                                } else {
                                    setEditingSlide(p => ({ ...p, data: { ...p.data, [field]: newVal } }));
                                }
                            }
                        }
                        return (
                            <div className="modal-overlay" onClick={() => setEditMode(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(41,37,30,0.35)' }}>
                                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', padding: 24, maxHeight: '85vh', overflowY: 'auto' }}>
                                    <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Edit {editingSlide.index === 0 ? 'Cover' : editingSlide.index === slides.length - 1 ? 'CTA' : `Slide ${editingSlide.index + 1}`}</h3>
                                        <button className="modal-close" onClick={() => setEditMode(false)} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--lavender-ink)', marginBottom: 10, background: 'var(--lavender-bg)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--lavender)' }}>
                                        <strong>Tip:</strong> Select any word and press <kbd style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontSize: 11 }}>Ctrl+B</kbd> to bold it in the slide
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>ICON</label>
                                            <input value={editingSlide.data.icon || ''} onChange={e => setEditingSlide(p => ({ ...p, data: { ...p.data, icon: e.target.value } }))} className="input-field" style={{ fontSize: 20, width: 80 }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>TAG</label>
                                            <input value={editingSlide.data.tag || ''} onChange={e => setEditingSlide(p => ({ ...p, data: { ...p.data, tag: e.target.value } }))} className="input-field" placeholder="Must Read" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>HEADLINE <span style={{ fontWeight: 400, opacity: 0.6 }}>(Ctrl+B to bold selection)</span></label>
                                            <textarea
                                                value={editingSlide.data.title || ''}
                                                onChange={e => setEditingSlide(p => ({ ...p, data: { ...p.data, title: e.target.value } }))}
                                                onKeyDown={e => handleBold(e, 'title')}
                                                className="input-field" style={{ minHeight: 70 }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>BODY <span style={{ fontWeight: 400, opacity: 0.6 }}>(Ctrl+B to bold selection)</span></label>
                                            <textarea
                                                value={editingSlide.data.body || ''}
                                                onChange={e => setEditingSlide(p => ({ ...p, data: { ...p.data, body: e.target.value } }))}
                                                onKeyDown={e => handleBold(e, 'body')}
                                                className="input-field" style={{ minHeight: 80 }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>BULLETS <span style={{ fontWeight: 400, opacity: 0.6 }}>(one per line · Ctrl+B to bold)</span></label>
                                            <textarea
                                                value={(editingSlide.data.bullets || []).join('\n')}
                                                onChange={e => setEditingSlide(p => ({ ...p, data: { ...p.data, bullets: e.target.value.split('\n') } }))}
                                                onKeyDown={e => handleBold(e, 'bullets', true)}
                                                className="input-field" style={{ minHeight: 80 }}
                                            />
                                        </div>
                                        {editingSlide.data.cta !== undefined && (
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>CTA TEXT</label>
                                                <input value={editingSlide.data.cta || ''} onChange={e => setEditingSlide(p => ({ ...p, data: { ...p.data, cta: e.target.value } }))} className="input-field" />
                                            </div>
                                        )}
                                        {/* Slide Image Upload */}
                                        <div style={{ background: 'var(--sky-bg)', border: '1px solid var(--sky)', borderRadius: 12, padding: 12 }}>
                                            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--sky-ink)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                Slide Image
                                            </label>
                                            {editingSlide.data.image && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                    <img src={editingSlide.data.image} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                                                    <button onClick={() => setEditingSlide(p => ({ ...p, data: { ...p.data, image: '' } }))} style={{ fontSize: 10, background: 'var(--rose-bg)', border: '1px solid var(--rose)', borderRadius: 6, padding: '4px 10px', color: 'var(--rose-ink)', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                                                        Remove Image
                                                    </button>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={e => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                        setEditingSlide(p => ({ ...p, data: { ...p.data, image: ev.target.result } }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} style={{ fontSize: 11, width: '100%', color: 'var(--muted-foreground)' }} />
                                            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 4 }}>
                                                Upload an image to use as a background for this slide. Best for infographic style.
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                        <button onClick={saveEdit} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: accentColor, borderColor: accentColor }}>Save</button>
                                        <button onClick={() => setEditMode(false)} className="btn btn-secondary">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                }
                {/* ══ Hidden off-screen container: full-size slides for crisp PDF/PNG export ══
                 Each slide div is exactly computedTheme.width x computedTheme.height so
                 html2canvas captures the correct dimensions with no clipping. ══ */}
                {
                    slides && (
                        <div style={{
                            position: 'fixed', left: -9999, top: -9999,
                            width: computedTheme.width,   // must match slide width exactly
                            pointerEvents: 'none', zIndex: -1,
                        }}>
                            {slides.map((s, i) => (
                                <div key={i} ref={el => exportRefs.current[i] = el}
                                    style={{
                                        width: computedTheme.width,
                                        height: computedTheme.height,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        flexShrink: 0, overflow: 'hidden',
                                    }}>
                                    <Slide
                                        slide={s} index={i} total={slides.length}
                                        theme={computedTheme} styleMode={styleMode}
                                        author={author} companyName={companyName}
                                        logo={logo} website={website}
                                        profilePic={profilePic} subtitle={subtitle}
                                    />
                                    <BrandingOverlay logo={logo} website={website} t={computedTheme} scale={computedTheme.scale || 1} />
                                    {/* Swipe indicator — baked into every slide except the last for PDF export */}
                                    {i < slides.length - 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            gap: 4 * (computedTheme.scale || 1),
                                            background: 'rgba(0,0,0,0.55)',
                                            borderRadius: `${12 * (computedTheme.scale || 1)}px 0 0 ${12 * (computedTheme.scale || 1)}px`,
                                            padding: `${14 * (computedTheme.scale || 1)}px ${10 * (computedTheme.scale || 1)}px`,
                                            zIndex: 20,
                                        }}>
                                            {/* Right-pointing chevron arrow only — no text */}
                                            <svg width={26 * (computedTheme.scale || 1)} height={26 * (computedTheme.scale || 1)} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                }
                {individualImageSet && (
                    <div style={{ position: 'fixed', left: -9999, top: -9999, width: 500, pointerEvents: 'none', zIndex: -1 }}>
                        {individualImageSet.map((post, index) => (
                            <div key={`${post.title}-export-${index}`} ref={element => individualExportRefs.current[index] = element} style={{ position: 'relative', width: 500, height: 500, overflow: 'hidden' }}>
                                <Slide slide={post} index={0} total={1} theme={individualImageTheme} styleMode={styleMode} author={author} companyName={companyName} logo={logo} website={website} profilePic={profilePic} subtitle={subtitle} />
                                <BrandingOverlay logo={logo} website={website} t={individualImageTheme} scale={individualImageTheme.scale || 1} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
