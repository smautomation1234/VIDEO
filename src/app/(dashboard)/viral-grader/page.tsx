"use client";
import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

interface GraderBreakdown {
    hook: number;
    cta: number;
    pacing: number;
    retention: number;
}

export default function ViralGrader() {
    const [text, setText] = useState("");
    const [score, setScore] = useState(0);
    const [breakdown, setBreakdown] = useState<GraderBreakdown>({ hook: 0, cta: 0, pacing: 0, retention: 0 });
    const [verdict, setVerdict] = useState("");
    const [tips, setTips] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const analyzeScript = async () => {
        if (!text.trim()) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/antigravity/grader", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ script: text }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to analyze");

            setScore(data.total || 0);
            setBreakdown(data.breakdown || { hook: 0, cta: 0, pacing: 0, retention: 0 });
            setVerdict(data.verdict || "");
            setTips(data.tips || []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const getBandInk = () => {
        if (score >= 80) return "var(--sage-ink)";
        if (score >= 50) return "var(--butter-ink)";
        return "var(--rose-ink)";
    };

    return (
        <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
            <PageHeader
                eyebrow="Create"
                title="Script grader"
                description="Paste a script and get an honest breakdown of what works."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--foreground)', marginBottom: 12 }}>Paste your Reel/TikTok Script</div>
                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Type your hook, body, and CTA here to analyze its viral potential..."
                            className="input-field"
                            style={{ width: '100%', height: 350, lineHeight: 1.6, resize: 'vertical' }}
                        />
                        <button
                            onClick={analyzeScript}
                            disabled={loading || !text.trim()}
                            className="btn-primary"
                            style={{ width: '100%', marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {loading ? "Analyzing Script..." : "Analyze with AI"}
                        </button>
                        {error && <div style={{ marginTop: 12, color: 'var(--rose-ink)', fontSize: 13 }}>{error}</div>}
                    </div>

                    {tips.length > 0 && (
                        <div className="animate-in fade-in" style={{ background: 'var(--lavender-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--lavender-ink)', marginBottom: 12 }}>AI Improvement Tips</div>
                            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--foreground)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {tips.map((tip, idx) => (
                                    <li key={idx}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="label-muted" style={{ marginBottom: 16 }}>Viral Score</div>

                        <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--muted)" strokeWidth="8" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke={score === 0 ? "var(--muted)" : "var(--sage-ink)"} strokeWidth="8"
                                    strokeDasharray="283" strokeDashoffset={283 - (283 * score) / 100}
                                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', fontSize: 36, fontWeight: 900, color: 'var(--foreground)' }}>{score}</div>
                        </div>

                        <div style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: text.length === 0 ? 'var(--muted-foreground)' : getBandInk(), textAlign: 'center' }}>
                            {text.length === 0 ? "Paste script to evaluate" : verdict || (score >= 80 ? "Algorithm Loves This" : score >= 50 ? "Needs Optimization" : "Low Viral Potential")}
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--foreground)', marginBottom: 16 }}>Detailed Breakdown</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <MetricRow label="Hook Strength" score={breakdown.hook} max={30} textLen={text.length} />
                            <MetricRow label="Pacing / Length" score={breakdown.pacing} max={25} textLen={text.length} />
                            <MetricRow label="Retention Bait" score={breakdown.retention} max={20} textLen={text.length} />
                            <MetricRow label="CTA Strength" score={breakdown.cta} max={25} textLen={text.length} />
                        </div>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-in { opacity: 0; animation: fadeIn 0.5s forwards; }
            `}} />
        </div>
    );
}

function MetricRow({ label, score, max, textLen }: { label: string, score: number, max: number, textLen: number }) {
    const percent = max > 0 ? (score / max) * 100 : 0;
    const ink = percent >= 80 ? "var(--sage-ink)" : percent >= 50 ? "var(--butter-ink)" : "var(--rose-ink)";
    const wash = percent >= 80 ? "var(--sage-bg)" : percent >= 50 ? "var(--butter-bg)" : "var(--rose-bg)";

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
                <span>{label}</span>
                <span style={{ color: ink }}>{textLen === 0 ? "-" : score} / {max}</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--muted)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: textLen === 0 ? 0 : `${percent}%`, height: '100%', background: wash, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>
        </div>
    );
}
