"use client";

import { useLayoutEffect, useRef } from 'react';
import { creatorMarkup, creatorPlainText } from '@/lib/creator-post.mjs';

function FormattedText({ children }) {
    return creatorMarkup(children).split(/(\*\*[\s\S]+?\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4
            ? <strong key={i} style={{ fontWeight: 800 }}>{creatorPlainText(part)}</strong>
            : part.replace(/\*{1,3}|`|~~/g, ''));
}

export default function CreatorPostSlide({ slide, index, total, t, author, companyName, logo, profilePic, subtitle }) {
    const contentRef = useRef(null);
    const textRef = useRef(null);
    const width = t.width || 500;
    const height = t.height || 500;
    const scale = Math.min(width / 500, height / 500);
    const fontMultiplier = (t.scale || scale) / scale;
    const paragraphs = (slide?.body || '').split(/\n+/).filter(p => p.trim());
    const avatar = profilePic || logo;

    // Measure the actual text, so all slides and exported sizes use the same fit.
    useLayoutEffect(() => {
        const box = contentRef.current;
        const text = textRef.current;
        let disposed = false;
        const fit = () => {
            if (disposed || !box || !text) return;
            let low = 11 * scale;
            let high = Math.max(low, 23 * scale * fontMultiplier);
            for (let i = 0; i < 12; i++) {
                const size = (low + high) / 2;
                text.style.fontSize = `${size}px`;
                if (text.scrollHeight <= box.clientHeight && text.scrollWidth <= box.clientWidth) low = size;
                else high = size;
            }
            text.style.fontSize = `${low}px`;
            box.dataset.overflow = String(text.scrollHeight > box.clientHeight + 1);
        };
        fit();
        document.fonts.ready.then(fit);
        const observer = new ResizeObserver(fit);
        observer.observe(box);
        return () => { disposed = true; observer.disconnect(); };
    }, [slide, width, height, scale, fontMultiplier, t.fontFamily]);

    return <div data-creator-post style={{ width, height, padding: 25 * scale, boxSizing: 'border-box', background: t.bg, color: t.text, fontFamily: t.fontFamily || 'Arial, Helvetica, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 * scale, marginBottom: 24 * scale, flexShrink: 0 }}>
            <div style={{ width: 78 * scale, height: 78 * scale, borderRadius: '50%', overflow: 'hidden', background: t.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 28 * scale, fontWeight: 700 }}>
                {/* Local uploaded photos must remain available to image exports. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (author || 'Your Name').split(/\s+/).slice(0, 2).map(p => p[0]).join('')}
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 25 * scale, fontWeight: 800, lineHeight: 1.12, overflowWrap: 'anywhere' }}>{author || 'Your Name'}</div>
                {(subtitle || companyName) && <div style={{ marginTop: 6 * scale, fontSize: 17 * scale, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{subtitle || companyName}</div>}
            </div>
        </div>
        <div ref={contentRef} data-creator-content style={{ flex: 1, minHeight: 0 }}>
            <div ref={textRef} style={{ fontSize: 20 * scale, lineHeight: 1.25, overflowWrap: 'anywhere' }}>
                {slide?.title && <div style={{ fontSize: '1.58em', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em', marginBottom: '0.6em' }}>{creatorPlainText(slide.title)}</div>}
                {paragraphs.map((p, i) => <p key={i} style={{ margin: '0 0 0.65em' }}><FormattedText>{p}</FormattedText></p>)}
                {(slide?.bullets || []).filter(Boolean).map((p, i) => <p key={`b-${i}`} style={{ margin: '0 0 0.65em' }}><FormattedText>{p}</FormattedText></p>)}
                {index === total - 1 && slide?.cta && <p style={{ margin: 0, fontWeight: 800 }}><FormattedText>{slide.cta}</FormattedText></p>}
            </div>
        </div>
    </div>;
}
