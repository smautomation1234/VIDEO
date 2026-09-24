"use client";
import React, { useState } from "react";
import { BarChart2, RefreshCw, Sparkles, Copy, Check, TrendingUp, TrendingDown, Search, Target, Calendar, Zap } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

const TRAFFIC_SOURCES = ["Browse Features", "Search", "Suggested Videos", "External", "Direct / Other"];
const POSTING_FREQS = ["Daily", "3-4x per week", "2x per week", "Weekly", "Less than weekly"];

function ScoreBadge({ score }: { score: number }) {
  return (
    <div style={{ position: "relative", width: 100, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--muted)" strokeWidth="8" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--sage-ink)" strokeWidth="8"
          strokeDasharray="276" strokeDashoffset={276 - (276 * score) / 100}
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--sage-ink)" }}>{score}</div>
        <div style={{ fontSize: 9, color: "var(--muted-foreground)", fontWeight: 600 }}>/ 100</div>
      </div>
    </div>
  );
}

function ListSection({ title, wash, ink, icon: Icon, items, renderItem }: any) {
  if (!items?.length) return null;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", background: wash, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={14} color={ink} />
        <span style={{ fontSize: 13, fontWeight: 700, color: ink }}>{title}</span>
      </div>
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item: any, i: number) => renderItem(item, i))}
      </div>
    </div>
  );
}

export default function ChannelAuditPage() {
  const [mode, setMode] = useState<"post" | "account" | "profile-seo">("post");
  const platform = "Instagram";
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  const [videoTitle, setVideoTitle] = useState("");
  const [views, setViews] = useState("");
  const [shares, setShares] = useState("");
  const [saves, setSaves] = useState("");
  const [impressions, setImpressions] = useState("");
  const [subscribersGained, setSubscribersGained] = useState("");
  const [nonFollowerReach, setNonFollowerReach] = useState("");

  const [niche, setNiche] = useState("");
  const [totalVideos, setTotalVideos] = useState("");
  const [subscribers, setSubscribers] = useState("");
  const [avgViews, setAvgViews] = useState("");
  const [bestVideo, setBestVideo] = useState("");
  const [worstVideo, setWorstVideo] = useState("");
  const [postingFrequency, setPostingFrequency] = useState("Weekly");
  const [problems, setProblems] = useState("");

  const [handle, setHandle] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [currentBio, setCurrentBio] = useState("");
  const [currentKeywords, setCurrentKeywords] = useState("");

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopiedMap((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let payload: any = { mode };
      if (mode === "post") {
        payload.videoData = { platform, title: videoTitle, views, impressions, subscribersGained, shares, saves, nonFollowerReach };
      } else if (mode === "account") {
        payload.channelData = { platform, niche, totalVideos, subscribers, avgViews, bestVideo, worstVideo, postingFrequency, problems };
      } else {
        payload.channelData = { platform, handle, niche, targetAudience, currentBio, currentKeywords };
      }

      const res = await fetch("/api/generate/channel-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const canSubmit = mode === "post" ? videoTitle.trim().length > 0 : mode === "account" ? niche.trim().length > 0 : handle.trim().length > 0;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100, margin: "0 auto" }}>
      <div className="tab-bar" style={{ alignSelf: "flex-start", flexWrap: "wrap" }}>
        {[
          { id: "post", label: "Post Analyzer" },
          { id: "account", label: "Account Full Audit" },
          { id: "profile-seo", label: "Profile SEO" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setMode(tab.id as any); setResult(null); }}
            className={`tab-item ${mode === tab.id ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={15} color="var(--sky-ink)" /> {mode === "post" ? "Content Data" : mode === "account" ? "Account Data" : "Profile Data"}
          </h2>

          {mode === "post" ? (
            <>
              <Field label="Post Hook / Idea *" value={videoTitle} onChange={setVideoTitle} placeholder="e.g. 7 AI Tools That Made Me $10K" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Views" value={views} onChange={setViews} placeholder="e.g. 12,400" />
                <Field label="Saves" value={saves} onChange={setSaves} placeholder="e.g. 450" />
                <Field label="Shares / DM Sends" value={shares} onChange={setShares} placeholder="e.g. 800" />
                <Field label="Impressions/Reach" value={impressions} onChange={setImpressions} placeholder="e.g. 295,000" />
                <Field label="Followers Gained" value={subscribersGained} onChange={setSubscribersGained} placeholder="e.g. 240" />
                <Field label="Non-Follower Reach %" value={nonFollowerReach} onChange={setNonFollowerReach} placeholder="e.g. 85%" />
              </div>
            </>
          ) : mode === "account" ? (
            <>
              <Field label="Niche *" value={niche} onChange={setNiche} placeholder="e.g. Finance & Investing" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Total Posts" value={totalVideos} onChange={setTotalVideos} placeholder="e.g. 45" />
                <Field label="Followers" value={subscribers} onChange={setSubscribers} placeholder="e.g. 12,400" />
                <Field label="Avg Reach/Views" value={avgViews} onChange={setAvgViews} placeholder="e.g. 3,200" />
              </div>
              <Field label="Best Performing Post" value={bestVideo} onChange={setBestVideo} placeholder="Topic + view count" />
              <Field label="Worst Performing Post" value={worstVideo} onChange={setWorstVideo} placeholder="Topic + view count" />
              <div>
                <label className="label-muted">Posting Frequency</label>
                <select className="input-field" value={postingFrequency} onChange={(e) => setPostingFrequency(e.target.value)}>
                  {POSTING_FREQS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="label-muted">Current Problems</label>
                <textarea className="input-field" value={problems} onChange={(e) => setProblems(e.target.value)} placeholder="Describe your main issues (low reach, low engagement, slow growth...)" />
              </div>
            </>
          ) : (
            <>
              <Field label="Handle / Username *" value={handle} onChange={setHandle} placeholder="e.g. @username" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Niche" value={niche} onChange={setNiche} placeholder="e.g. SaaS Founders" />
                <Field label="Target Audience" value={targetAudience} onChange={setTargetAudience} placeholder="e.g. Startup CEOs" />
              </div>
              <Field label="Keywords Target (Optional)" value={currentKeywords} onChange={setCurrentKeywords} placeholder="e.g. Marketing, Growth" />
              <div>
                <label className="label-muted">Current Bio</label>
                <textarea className="input-field" value={currentBio} onChange={(e) => setCurrentBio(e.target.value)} placeholder="Paste your current bio here..." />
              </div>
            </>
          )}

          <button
            onClick={analyze}
            disabled={loading || !canSubmit}
            className="btn-primary"
            style={{ width: "100%" }}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <BarChart2 size={16} />}
            {loading ? "Analyzing..." : mode === "post" ? "Analyze Content" : mode === "account" ? "Audit Account" : "Optimize Profile"}
          </button>

          {error && (
            <div style={{ padding: 12, background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: "var(--radius-sm)", color: "var(--rose-ink)", fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="animate-pulse-soft" style={{ height: 80, background: "var(--muted)", borderRadius: "var(--radius-lg)" }} />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse-soft" style={{ height: 100, background: "var(--muted)", borderRadius: "var(--radius)", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          ) : result ? (
            <>
              <div className="card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {result.channelScore !== undefined && <ScoreBadge score={result.channelScore} />}
                <div style={{ flex: 1 }}>
                  {result.overallRating && <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)", marginBottom: 6 }}>{result.overallRating}</div>}
                  {result.primaryProblem && (
                    <div style={{ padding: "8px 12px", background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--rose-ink)", marginBottom: 8 }}>
                      <strong>Main problem:</strong> {result.primaryProblem}
                    </div>
                  )}
                  {result.benchmarkComparison && <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0, lineHeight: 1.6 }}>{result.benchmarkComparison}</p>}
                  {result.urgentAction && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--butter-bg)", border: "1px solid var(--butter)", borderRadius: "var(--radius-sm)", fontSize: 13, color: "var(--butter-ink)" }}>
                      <strong>Do this first:</strong> {result.urgentAction}
                    </div>
                  )}
                </div>
              </div>

              {result.diagnosis && (
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}><Target size={15} color="var(--sky-ink)" /> Diagnosis</h3>
                  {Object.entries(result.diagnosis).map(([key, val]) => (
                    <div key={key} style={{ padding: "10px 14px", background: "var(--muted)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sky-ink)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.6 }}>{val as string}</div>
                    </div>
                  ))}
                </div>
              )}

              {result.prescription && (
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 8 }}><Zap size={15} color="var(--butter-ink)" /> Prescription</h3>
                  {[
                    { label: "Stop doing", key: "stopDoing", ink: "var(--rose-ink)", wash: "var(--rose-bg)" },
                    { label: "Start doing", key: "startDoing", ink: "var(--sage-ink)", wash: "var(--sage-bg)" },
                    { label: "Improve", key: "improve", ink: "var(--sky-ink)", wash: "var(--sky-bg)" },
                  ].map(({ label, key, ink, wash }) => result.prescription[key]?.length > 0 && (
                    <div key={key}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: ink, marginBottom: 6 }}>{label}</div>
                      {result.prescription[key].map((item: string, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "6px 10px", borderRadius: "var(--radius-sm)", marginBottom: 4, background: wash }}>
                          <span style={{ fontSize: 11, color: ink, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>•</span>
                          <span style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {result.titleAlternatives && (
                <ListSection title="Better Title Options" wash="var(--lavender-bg)" ink="var(--lavender-ink)" icon={Target} items={result.titleAlternatives} renderItem={(item: any, i: number) => (
                  <div key={i} style={{ padding: "12px 14px", background: "var(--muted)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.4 }}>{item.title}</div>
                      <button onClick={() => copy(item.title, `ta-${i}`)} style={{ background: copiedMap[`ta-${i}`] ? "var(--sage-bg)" : "var(--card)", border: `1px solid ${copiedMap[`ta-${i}`] ? "var(--sage)" : "var(--border)"}`, color: copiedMap[`ta-${i}`] ? "var(--sage-ink)" : "var(--muted-foreground)", borderRadius: "var(--radius-sm)", padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                        {copiedMap[`ta-${i}`] ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                    {item.reason && <div style={{ fontSize: 12, color: "var(--lavender-ink)", marginTop: 4, fontStyle: "italic" }}>{item.reason}</div>}
                  </div>
                )} />
              )}

              {result.strengths && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <ListSection title="What's Working" wash="var(--sage-bg)" ink="var(--sage-ink)" icon={TrendingUp} items={result.strengths} renderItem={(item: any, i: number) => (
                    <div key={i} style={{ padding: "10px 12px", background: "var(--sage-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--sage)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{item.item}</div>
                      <div style={{ fontSize: 11, color: "var(--sage-ink)" }}>→ {item.action}</div>
                    </div>
                  )} />
                  <ListSection title="What's Not Working" wash="var(--rose-bg)" ink="var(--rose-ink)" icon={TrendingDown} items={result.weaknesses} renderItem={(item: any, i: number) => (
                    <div key={i} style={{ padding: "10px 12px", background: "var(--rose-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--rose)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{item.item}</div>
                      <div style={{ fontSize: 11, color: "var(--rose-ink)" }}>→ {item.action}</div>
                    </div>
                  )} />
                </div>
              )}

              {result.contentGaps && (
                <ListSection title="Content Gaps — Topics Your Audience Wants" wash="var(--butter-bg)" ink="var(--butter-ink)" icon={Search} items={result.contentGaps} renderItem={(item: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: "var(--muted)", borderRadius: "var(--radius)", border: "1px solid var(--border)", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{item.topic}</div>
                      <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{item.why}</div>
                    </div>
                    <span className={`badge ${item.opportunity === "High" ? "badge-success" : item.opportunity === "Medium" ? "badge-warning" : "badge-muted"}`.trim()} style={{ flexShrink: 0 }}>
                      {item.opportunity} opportunity
                    </span>
                  </div>
                )} />
              )}

              {result.thirtyDayPlan && (
                <div className="card">
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={15} color="var(--sky-ink)" /> 30-Day Action Plan
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {result.thirtyDayPlan.map((week: any, i: number) => (
                      <div key={i} style={{ padding: 14, background: "var(--muted)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sky-ink)", marginBottom: 6 }}>Week {week.week} — {week.focus}</div>
                        {week.tasks?.map((task: string, j: number) => (
                          <div key={j} style={{ display: "flex", gap: 6, fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4, lineHeight: 1.4 }}>
                            <span style={{ color: "var(--sky-ink)", flexShrink: 0 }}>•</span> {task}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.nextVideoRecommendation && (
                <div style={{ padding: "14px 18px", background: "var(--lavender-bg)", border: "1px solid var(--lavender)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--foreground)", lineHeight: 1.6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--lavender-ink)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Next Post Recommendation</div>
                  {result.nextVideoRecommendation}
                </div>
              )}

              {result.audienceInsight && (
                <div style={{ padding: "14px 18px", background: "var(--sage-bg)", border: "1px solid var(--sage)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--foreground)", lineHeight: 1.6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sage-ink)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Audience Insight</div>
                  {result.audienceInsight}
                </div>
              )}
            </>
          ) : result?.mode === "profile-seo" ? (
            <>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Profile SEO Analysis</h3>
                <div style={{ padding: "12px 16px", background: "var(--rose-bg)", borderRadius: "var(--radius)", border: "1px solid var(--rose)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--rose-ink)", marginBottom: 4 }}>CURRENT DIAGNOSIS</div>
                  <div style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.6 }}>{result.seoDiagnosis}</div>
                </div>
                {result.urgentAction && (
                  <div style={{ padding: "12px 16px", background: "var(--butter-bg)", borderRadius: "var(--radius)", border: "1px solid var(--butter)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--butter-ink)", marginBottom: 4 }}>URGENT ACTION</div>
                    <div style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 600 }}>{result.urgentAction}</div>
                  </div>
                )}
              </div>

              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 12 }}>Name Field Optimization</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: "10px 14px", background: "var(--muted)", borderRadius: "var(--radius-sm)", fontSize: 13 }}>
                    <span style={{ color: "var(--muted-foreground)" }}>Current:</span> <span style={{ textDecoration: "line-through", opacity: 0.6 }}>{result.nameFieldOptimization?.current}</span>
                  </div>
                  <div style={{ padding: 14, background: "var(--sage-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--sage)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sage-ink)", marginBottom: 4 }}>RECOMMENDED FORMAT</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>{result.nameFieldOptimization?.recommendation}</div>
                    </div>
                    <button onClick={() => copy(result.nameFieldOptimization?.recommendation, 'name')} style={{ display: "flex", alignItems: "center", gap: 5, background: copiedMap['name'] ? "var(--sage-bg)" : "var(--card)", border: `1px solid ${copiedMap['name'] ? "var(--sage)" : "var(--border)"}`, color: copiedMap['name'] ? "var(--sage-ink)" : "var(--muted-foreground)", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                      {copiedMap['name'] ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--sage-ink)", fontStyle: "italic" }}>{result.nameFieldOptimization?.why}</div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 12 }}>Bio Rewrite</h3>
                <div style={{ background: "var(--muted)", padding: 16, borderRadius: "var(--radius)", border: "1px solid var(--border)", position: "relative" }}>
                  <button onClick={() => copy(`${result.bioRewrite?.line1}\\n${result.bioRewrite?.line2}\\n${result.bioRewrite?.line3}\\n${result.bioRewrite?.line4}`, 'bio')} style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 5, background: copiedMap['bio'] ? "var(--card)" : "var(--card)", border: `1px solid ${copiedMap['bio'] ? "var(--sage)" : "var(--border)"}`, color: copiedMap['bio'] ? "var(--sage-ink)" : "var(--muted-foreground)", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                    {copiedMap['bio'] ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>{result.bioRewrite?.line1}</div>
                  <div style={{ fontSize: 14, color: "var(--foreground)", marginBottom: 6 }}>{result.bioRewrite?.line2}</div>
                  <div style={{ fontSize: 14, color: "var(--foreground)", marginBottom: 6 }}>{result.bioRewrite?.line3}</div>
                  <div style={{ fontSize: 14, color: "var(--sky-ink)", fontWeight: 600 }}>{result.bioRewrite?.line4}</div>
                </div>
              </div>

              {result.keywordBank && (
                <div className="card">
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 12 }}>Keyword Bank</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {result.keywordBank.map((kw: string, i: number) => (
                      <span key={i} style={{ padding: "6px 12px", background: "var(--lavender-bg)", color: "var(--lavender-ink)", borderRadius: 9999, fontSize: 12, fontWeight: 600, border: "1px solid var(--lavender)" }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.pinnedContentStrategy && (
                <div style={{ padding: 16, background: "var(--sky-bg)", border: "1px solid var(--sky)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--foreground)", lineHeight: 1.6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sky-ink)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Pinned Content Strategy</div>
                  {result.pinnedContentStrategy}
                </div>
              )}
            </>
          ) : (
            <div className="card">
              <EmptyState
                icon={BarChart2}
                title={mode === "post" ? "Content Performance Diagnosis" : mode === "account" ? "Full Account Strategy Audit" : "Profile SEO Audit"}
                description={
                  mode === "post"
                    ? "Enter your post metrics to get a detailed diagnosis and prescription for your next post."
                    : mode === "account"
                    ? "Enter your account stats for an honest audit with a 30-day action plan."
                    : "Optimize your bio, name, and keywords for search engine discovery."
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="label-muted">{label}</label>
      <input className="input-field" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
