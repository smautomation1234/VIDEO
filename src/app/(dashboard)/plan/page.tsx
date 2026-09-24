"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Wand2, Calendar as CalendarIcon, RefreshCw, Bot, Sparkles, Hash, Clock, Target, Check } from "lucide-react";
import { addBriefToGrowthWorkspace } from "@/lib/growth-workspace";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface CalPost {
  date: string;
  platform: string;
  topic: string;
  contentType: string;
  hookIdea: string;
  titleDraft: string;
  hashtags: string[];
  bestPostTime: string;
  primaryGoal: string;
  color: string;
}

export default function CalendarPage() {
  const today = new Date();
  const [date, setDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [posts, setPosts] = useState<CalPost[]>([]);
  
  // Generator State
  const [mode, setMode] = useState<"monthly-calendar" | "trial-reels">("monthly-calendar");
  const [showGenerator, setShowGenerator] = useState(false);
  const [niche, setNiche] = useState("");
  const platforms = ["Instagram"];
  const [frequency, setFrequency] = useState("3x a week");
  const [pillars, setPillars] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [theme, setTheme] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedPost, setSelectedPost] = useState<CalPost | null>(null);
  const [savedToPipeline, setSavedToPipeline] = useState(false);

  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();



  const generateCalendar = async () => {
    if (!niche || platforms.length === 0 || !pillars) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/generate/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          niche,
          platforms,
          frequency,
          pillars,
          month: MONTHS[month],
          year
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setTheme(data.theme || "");
      setSummary(data.summary || "");
      setPosts(data.posts || []);
      setShowGenerator(false);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const getPostsForDate = (day: number): CalPost[] => {
    const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return posts.filter(p => p.date === ds);
  };

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--foreground)", display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarIcon size={24} style={{ color: 'var(--lavender-ink)' }} /> Content calendar
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)", marginTop: 4 }}>
            Generate a full month of post ideas based on your niche and content pillars
          </p>
        </div>
        <button onClick={() => setShowGenerator(!showGenerator)} className="btn-primary" style={{ textDecoration:"none", fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wand2 size={16} /> {showGenerator ? 'Hide generator' : 'AI generator'}
        </button>
      </div>

      {/* Generator Panel */}
      {showGenerator && (
        <div className="card" style={{ padding: 24, background: 'var(--lavender-bg)', borderColor: 'var(--lavender)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Bot size={20} style={{ color: 'var(--lavender-ink)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--lavender-ink)' }}>AI calendar generator</h2>
          </div>

          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setMode("monthly-calendar")} style={{ flex: 1, padding: "10px", borderRadius: 9999, border: `1px solid ${mode === "monthly-calendar" ? 'var(--primary)' : 'var(--border)'}`, background: mode === "monthly-calendar" ? 'var(--primary)' : 'var(--card)', color: mode === "monthly-calendar" ? 'var(--primary-foreground)' : 'var(--muted-foreground)', fontWeight: 600, fontSize: 13, cursor: "pointer" }}>30-day calendar</button>
            <button onClick={() => setMode("trial-reels")} style={{ flex: 1, padding: "10px", borderRadius: 9999, border: `1px solid ${mode === "trial-reels" ? 'var(--primary)' : 'var(--border)'}`, background: mode === "trial-reels" ? 'var(--primary)' : 'var(--card)', color: mode === "trial-reels" ? 'var(--primary-foreground)' : 'var(--muted-foreground)', fontWeight: 600, fontSize: 13, cursor: "pointer" }}>5-reel starter plan</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <div>
              <label className="label-muted">Niche / target audience</label>
              <input type="text" value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. SaaS founders, real estate agents" className="input-field" />
            </div>
            {mode === "monthly-calendar" && (
              <>
                <div>
                  <label className="label-muted">Content pillars (comma separated)</label>
                  <input type="text" value={pillars} onChange={e => setPillars(e.target.value)} placeholder="e.g. Growth marketing, tool reviews, mindset" className="input-field" />
                </div>
                <div>
                  <label className="label-muted">Posting frequency</label>
                  <select value={frequency} onChange={e => setFrequency(e.target.value)} className="input-field">
                    <option value="Daily">Daily</option>
                    <option value="3x a week">3x a week</option>
                    <option value="5x a week">5x a week</option>
                    <option value="Twice a day">Twice a day</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {error && <div style={{ marginTop: 16, color: 'var(--rose-ink)', fontSize: 13, background: 'var(--rose-bg)', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}

          <button onClick={generateCalendar} disabled={loading || !niche || (mode === "monthly-calendar" && (!pillars || platforms.length === 0))}
            className="btn-primary" style={{ marginTop: 20 }}>
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Generating strategy...' : mode === 'trial-reels' ? 'Generate reel plan' : `Generate calendar for ${MONTHS[month]} ${year}`}
          </button>
        </div>
      )}

      {/* Theme Banner */}
      {theme && (
        <div style={{ background: 'var(--sage-bg)', border: '1px solid var(--sage)', borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Sparkles size={22} style={{ color: 'var(--sage-ink)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sage-ink)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Monthly theme</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', marginBottom: 4 }}>{theme}</h3>
            <p style={{ fontSize: 14, color: 'var(--foreground)', lineHeight: 1.5, opacity: 0.8 }}>{summary}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        
        {/* Left: Calendar Grid or Reels List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === "trial-reels" ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 style={{ fontWeight: 800, fontSize: 20, color:"var(--foreground)", marginBottom: 8 }}>
                The 5-reel starter plan
              </h2>
              {posts.map((p, idx) => (
                <div key={idx} onClick={() => setSelectedPost(p)} style={{
                  padding: "14px 18px", background: selectedPost === p ? "rgba(236,72,153,0.08)" : "var(--card)", border: `1px solid ${selectedPost === p ? "#ec4899" : "var(--border)"}`, borderRadius: 12,
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 12, alignItems: 'center'
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(236,72,153,0.15)", color: "#ec4899", display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 2 }}>{p.date}</div>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{p.titleDraft}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Month nav */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding: '0 8px' }}>
                <h2 style={{ fontWeight: 800, fontSize: 20, color:"var(--foreground)" }}>
                  {MONTHS[month]} {year}
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost" style={{ padding:"8px", background: 'var(--card)', border: '1px solid var(--border)' }} onClick={() => setDate(new Date(year, month-1, 1))}>
                    <ChevronLeft size={16} />
                  </button>
                  <button className="btn-ghost" style={{ padding:"8px", background: 'var(--card)', border: '1px solid var(--border)' }} onClick={() => setDate(new Date(year, month+1, 1))}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="card" style={{ padding:0, overflow:"hidden" }}>
                {/* Day headers */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid var(--border)", background: 'var(--muted)' }}>
                  {DAYS.map(d => (
                    <div key={d} style={{ padding:"12px 8px", textAlign:"center", fontSize: 12, fontWeight: 700, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing: 1 }}>
                      {d}
                    </div>
                  ))}
                </div>
                {/* Day cells */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
                  {cells.map((day, i) => {
                    const dayPosts = day ? getPostsForDate(day) : [];
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    return (
                      <div key={i} style={{
                        minHeight: 110, padding: 8,
                        borderRight: (i+1)%7 !== 0 ? "1px solid var(--border)" : "none",
                        borderBottom: i < cells.length - 7 ? "1px solid var(--border)" : "none",
                        background: !day ? "var(--muted)" : isToday ? "var(--sky-bg)" : "transparent",
                      }}>
                        {day && (
                          <>
                            <div style={{
                              display:"inline-flex", alignItems:"center", justifyContent:"center",
                              width: 26, height: 26, borderRadius: "50%", marginBottom: 6,
                              fontSize: 13, fontWeight: isToday ? 800 : 500,
                              color: isToday ? "var(--primary-foreground)" : "var(--muted-foreground)",
                              background: isToday ? "var(--primary)" : "transparent",
                            }}>
                              {day}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {dayPosts.map((p, idx) => (
                                <div key={idx} onClick={() => setSelectedPost(p)} style={{
                                  padding: "4px 6px", background: `${p.color || '#8b5cf6'}15`, borderLeft: `3px solid ${p.color || '#8b5cf6'}`, borderRadius: "0 4px 4px 0",
                                  fontSize: 10, color: "var(--foreground)", fontWeight: 500, cursor: 'pointer',
                                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", transition: 'all 0.1s'
                                }} title={p.titleDraft} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'} onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                                  {p.platform}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Post Details Panel */}
        <div>
          {selectedPost ? (
            <div className="card" style={{ position: 'sticky', top: 24, borderTop: `4px solid ${selectedPost.color || '#8b5cf6'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, background: `${selectedPost.color || '#8b5cf6'}20`, color: selectedPost.color || '#8b5cf6', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
                  {selectedPost.contentType}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600 }}>{selectedPost.date}</span>
              </div>
              
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, lineHeight: 1.4 }}>{selectedPost.titleDraft}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>{selectedPost.topic}</p>
              
              <div style={{ padding: 12, background: 'var(--muted)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Hook idea</div>
                <div style={{ fontSize: 13, color: 'var(--foreground)', fontStyle: 'italic' }}>"{selectedPost.hookIdea}"</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                  <Target size={14} style={{ color: 'var(--sky-ink)' }} /> <strong>Goal:</strong> {selectedPost.primaryGoal}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                  <Clock size={14} style={{ color: 'var(--butter-ink)' }} /> <strong>Best time:</strong> {selectedPost.bestPostTime}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                  <Hash size={14} style={{ color: 'var(--sage-ink)' }} /> <strong>Tags:</strong> {selectedPost.hashtags?.join(' ')}
                </div>
              </div>

              <button onClick={() => {
                addBriefToGrowthWorkspace({
                  origin: 'calendar',
                  niche,
                  platform: selectedPost.platform,
                  title: selectedPost.titleDraft,
                  content: selectedPost.hookIdea,
                  savedAt: new Date().toISOString(),
                });
                setSavedToPipeline(true);
                setTimeout(() => setSavedToPipeline(false), 2500);
              }} className="btn-primary" style={{ flex: 1, width: '100%', padding: '8px', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Check size={14} /> {savedToPipeline ? 'Saved to pipeline' : 'Save to pipeline'}
              </button>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: 'var(--muted-foreground)', minHeight: 300 }}>
              <CalendarIcon size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No Post Selected</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Click on a post in the calendar to view its details.</div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
