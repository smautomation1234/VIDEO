"use client";
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Zap, Target, BarChart2, Flame, Clock, Loader2, RefreshCw, AlertCircle, ChevronRight, Copy, Check } from "lucide-react";

const NICHES = ["Fitness","Food & Recipes","Finance","Business","Beauty & Fashion","Travel","Tech","Self-Improvement","Parenting","Real Estate"];
const DEADLINE_COLOR: Record<string,string> = { "Next 24 hours":"#DC2626", "Next 48 hours":"#D97706", "Next 72 hours":"#059669" };
const TRIGGER_COLOR: Record<string,string> = { "Curiosity Gap":"#7C3AED","Contrarian":"#DC2626","Social Proof":"#059669","POV":"#2563EB","Pain Point":"#EA580C","Transformation":"#0891B2" };
const DIFF_COLOR: Record<string,string> = { easy:"#059669", medium:"#D97706", hard:"#DC2626" };

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).catch(()=>{}); setDone(true); setTimeout(()=>setDone(false),1800); }}
      style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", background:done?"var(--sage-bg)":"var(--muted)", border:`1px solid ${done?"var(--sage)":"var(--border)"}`, borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", color:done?"#3D5E41":"var(--muted-foreground)" }}>
      {done ? <Check size={11}/> : <Copy size={11}/>}{done?"Copied!":"Copy"}
    </button>
  );
}

function PulseBadge({ label, value, color }: { label:string; value:string; color?:string }) {
  return (
    <div style={{ padding:"8px 12px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:8, minWidth:90 }}>
      <div style={{ fontSize:13, fontWeight:800, color:color||"var(--foreground)" }}>{value}</div>
      <div style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:1 }}>{label}</div>
    </div>
  );
}

export default function ClientDashboard() {
  const [niche, setNiche] = useState("Fitness");
  const [trending, setTrending] = useState<any>(null);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [trendErr, setTrendErr] = useState("");

  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [genErr, setGenErr] = useState("");

  const [pipeline, setPipeline] = useState<any[]>([]);

  const fetchTrending = useCallback(async (n: string) => {
    setLoadingTrend(true); setTrendErr(""); setTrending(null);
    try {
      const r = await fetch(`/api/generate/trending?niche=${encodeURIComponent(n)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setTrending(d);
    } catch(e:any) { setTrendErr(e.message); }
    finally { setLoadingTrend(false); }
  }, []);

  useEffect(() => { fetchTrending(niche); }, [niche, fetchTrending]);

  const generateContent = async (t: string) => {
    if (!t.trim()) return;
    setGenerating(true); setGenErr(""); setGenResult(null);
    try {
      const r = await fetch("/api/generate/viralforge", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ topic: t, platform:"tiktok", niche, vibe:"Educational", brand_voice:"casual", followers:5000 }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Generation failed");
      setGenResult(d);
      setPipeline(prev => [{ ...d, id: Date.now(), topic:t, status:"draft", createdAt: new Date().toISOString() }, ...prev].slice(0,10));
    } catch(e:any) { setGenErr(e.message); }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* ── Niche Selector ── */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <span style={{ fontSize:13, fontWeight:700, color:"var(--muted-foreground)", whiteSpace:"nowrap" }}>YOUR NICHE</span>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", flex:1 }}>
          {NICHES.map(n => (
            <button key={n} onClick={() => setNiche(n)}
              style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${niche===n?"var(--primary)":"var(--border)"}`, background:niche===n?"var(--primary)":"var(--card)", color:niche===n?"#fff":"var(--muted-foreground)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
              {n}
            </button>
          ))}
        </div>
        <button onClick={() => fetchTrending(niche)} disabled={loadingTrend}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", color:"var(--muted-foreground)" }}>
          <RefreshCw size={13} style={loadingTrend?{animation:"spin 1s linear infinite"}:{}}/>Refresh
        </button>
      </div>

      {/* ── Niche Pulse ── */}
      {trending?.niche_pulse && (
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <PulseBadge label="Momentum" value={trending.niche_pulse.momentum} color="#059669"/>
          <PulseBadge label="Saturation" value={trending.niche_pulse.saturation}/>
          <PulseBadge label="Best Platform" value={trending.niche_pulse.best_platform} color="#7C3AED"/>
          <PulseBadge label="Top Format" value={trending.niche_pulse.top_format}/>
          <PulseBadge label="Weekly Change" value={trending.niche_pulse.weekly_change} color="#D97706"/>
        </div>
      )}

      {/* ── Trending Now ── */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <TrendingUp size={17} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800 }}>Trending in {niche} RIGHT NOW</div>
            <div style={{ fontSize:12, color:"var(--muted-foreground)" }}>Live hook intelligence — act before the window closes</div>
          </div>
        </div>

        {loadingTrend && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 0", color:"var(--muted-foreground)", fontSize:13 }}>
            <Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>Scanning {niche} trends…
          </div>
        )}
        {trendErr && (
          <div style={{ display:"flex", gap:8, padding:"10px 14px", background:"#DC262610", border:"1px solid #DC262630", borderRadius:8 }}>
            <AlertCircle size={15} color="#DC2626"/><span style={{ fontSize:13, color:"#DC2626" }}>{trendErr}</span>
          </div>
        )}

        {trending?.hot_hooks?.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
            {trending.hot_hooks.map((hook:any, i:number) => {
              const dlColor = DEADLINE_COLOR[hook.deadline] || "#D97706";
              const trColor = TRIGGER_COLOR[hook.trigger] || "#7C3AED";
              return (
                <div key={i} style={{ border:"1px solid var(--border)", borderRadius:10, padding:14, display:"flex", flexDirection:"column", gap:10, background:"var(--card)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", background:`${trColor}15`, color:trColor, border:`1px solid ${trColor}30`, borderRadius:5 }}>{hook.trigger}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", background:"var(--muted)", color:"var(--muted-foreground)", border:"1px solid var(--border)", borderRadius:5 }}>{hook.platform}</span>
                    </div>
                    <span style={{ fontSize:15, fontWeight:800, color:"#059669" }}>{hook.score}/100</span>
                  </div>

                  <div style={{ fontSize:14, fontWeight:700, lineHeight:1.4, color:"var(--foreground)" }}>{hook.pattern}</div>

                  {hook.example && (
                    <div style={{ fontSize:11, color:"var(--muted-foreground)", fontStyle:"italic", background:"var(--muted)", borderRadius:6, padding:"6px 10px" }}>e.g. {hook.example}</div>
                  )}

                  <div style={{ display:"flex", gap:12 }}>
                    <div style={{ fontSize:11, color:"var(--muted-foreground)" }}>📊 {hook.usage_count?.toLocaleString()} uses</div>
                    <div style={{ fontSize:11, color:"#059669", fontWeight:600 }}>📈 +{hook.growth_rate}%</div>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", background:`${dlColor}10`, border:`1px solid ${dlColor}30`, borderRadius:6 }}>
                    <Clock size={11} color={dlColor}/>
                    <span style={{ fontSize:11, fontWeight:700, color:dlColor }}>Use within: {hook.deadline}</span>
                  </div>

                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => generateContent(hook.pattern)} disabled={generating}
                      style={{ flex:1, padding:"8px 12px", background:"var(--primary)", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:generating?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6, opacity:generating?0.7:1 }}>
                      <Zap size={12}/>Use This Hook
                    </button>
                    <CopyBtn text={hook.pattern}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Generate ── */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Zap size={17} color="#fff"/>
          </div>
          <div style={{ fontSize:15, fontWeight:800 }}>Quick Generate</div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <input type="text" value={topic} onChange={e=>setTopic(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&generateContent(topic)}
            placeholder={`What do you want to create? e.g. "morning routine for ${niche.toLowerCase()}"`}
            style={{ flex:1, padding:"10px 14px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:8, fontSize:13, color:"var(--foreground)", fontFamily:"inherit", outline:"none" }}/>
          <button onClick={()=>generateContent(topic)} disabled={generating||!topic.trim()}
            style={{ padding:"10px 20px", background:"var(--primary)", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:generating||!topic.trim()?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, opacity:generating||!topic.trim()?0.7:1 }}>
            {generating?<Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>:<Zap size={14}/>}
            {generating?"Generating…":"Generate"}
          </button>
        </div>

        {/* Quick idea chips from trending */}
        {trending?.quick_ideas?.length > 0 && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"var(--muted-foreground)", marginBottom:8 }}>QUICK IDEAS FROM YOUR NICHE</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {trending.quick_ideas.map((idea:any, i:number) => (
                <button key={i} onClick={()=>generateContent(idea.topic)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:20, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit", color:"var(--foreground)", transition:"all 0.15s" }}>
                  {idea.topic}
                  <span style={{ fontSize:10, color:DIFF_COLOR[idea.difficulty]||"#D97706", fontWeight:700 }}>· {idea.estimated_views}</span>
                  <ChevronRight size={11} color="var(--muted-foreground)"/>
                </button>
              ))}
            </div>
          </div>
        )}

        {genErr && (
          <div style={{ marginTop:12, display:"flex", gap:8, padding:"10px 14px", background:"#DC262610", border:"1px solid #DC262630", borderRadius:8 }}>
            <AlertCircle size={15} color="#DC2626"/><span style={{ fontSize:13, color:"#DC2626" }}>{genErr}</span>
          </div>
        )}

        {/* Quick result preview */}
        {genResult && (
          <div style={{ marginTop:16, padding:16, background:"var(--muted)", border:"1px solid var(--border)", borderRadius:10, display:"flex", flexDirection:"column", gap:12 }}>
            {/* Topic & Score Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Topic:</span>
                <span style={{ fontSize:13, fontWeight:700, background:"var(--sage-bg)", color:"#3D5E41", padding:"3px 8px", borderRadius:5, border:"1px solid var(--sage)" }}>{genResult.topic}</span>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:800, color:"#059669" }}>{genResult.viralScore}/100</span>
                <span style={{ fontSize:11, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.05em" }}>viral score</span>
              </div>
            </div>

            {/* Best Hook */}
            {genResult.hooks?.[0]?.text && (
              <div style={{ padding:"10px 12px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", color:"var(--muted-foreground)", letterSpacing:"0.05em" }}>Best Hook</span>
                  <CopyBtn text={genResult.hooks[0].text}/>
                </div>
                <div style={{ fontSize:14, fontWeight:700, fontStyle:"italic" }}>"{genResult.hooks[0].text}"</div>
              </div>
            )}

            {/* Video Script */}
            {genResult.script && (
              <div style={{ padding:"10px 12px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", color:"var(--muted-foreground)", letterSpacing:"0.05em" }}>Video Script</span>
                  <CopyBtn text={genResult.script}/>
                </div>
                <div style={{ fontSize:13, lineHeight:1.6, color:"var(--foreground)", whiteSpace:"pre-wrap" }}>{genResult.script}</div>
              </div>
            )}

            {/* Post Caption */}
            {genResult.caption && (
              <div style={{ padding:"10px 12px", background:"var(--card)", border:"1px solid var(--border)", borderRadius:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", color:"var(--muted-foreground)", letterSpacing:"0.05em" }}>Post Caption</span>
                  <CopyBtn text={genResult.caption}/>
                </div>
                <div style={{ fontSize:13, lineHeight:1.6, color:"var(--foreground)", whiteSpace:"pre-wrap" }}>{genResult.caption}</div>
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              {[{label:"Min",val:genResult.predictions?.min},{label:"Likely",val:genResult.predictions?.likely,hi:true},{label:"Max",val:genResult.predictions?.max}].map(s=>(
                <div key={s.label} style={{ padding:"8px 12px", background:s.hi?"var(--sage-bg)":"var(--card)", border:`1px solid ${s.hi?"var(--sage)":"var(--border)"}`, borderRadius:7 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:s.hi?"#3D5E41":"var(--foreground)" }}>{s.val>=1000000?`${(s.val/1000000).toFixed(1)}M`:s.val>=1000?`${(s.val/1000).toFixed(0)}K`:String(s.val||0)}</div>
                  <div style={{ fontSize:10, color:"var(--muted-foreground)" }}>{s.label} Views</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content Pipeline ── */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Target size={17} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800 }}>Content Pipeline</div>
            <div style={{ fontSize:12, color:"var(--muted-foreground)" }}>Generated drafts — ready to post</div>
          </div>
          <span style={{ marginLeft:"auto", padding:"3px 10px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:6, fontSize:12, fontWeight:700 }}>{pipeline.length} drafts</span>
        </div>

        {pipeline.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 0", color:"var(--muted-foreground)", fontSize:13 }}>
            No drafts yet — generate content above to fill your pipeline
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {pipeline.map((item, i) => (
              <div key={item.id||i} style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", background:"var(--muted)", borderRadius:9, border:"1px solid var(--border)" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#D97706", flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.topic}</div>
                  <div style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:2 }}>
                    Score: {item.viralScore}/100 · ~{item.predictions?.likely>=1000?`${(item.predictions.likely/1000).toFixed(0)}K`:item.predictions?.likely||"?"} views · {new Date(item.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", background:"#D97706" +"15", color:"#D97706", border:"1px solid #D97706" +"30", borderRadius:5 }}>DRAFT</span>
                <CopyBtn text={item.caption||""}/>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Analytics Stub ── */}
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <BarChart2 size={17} color="#fff"/>
          </div>
          <div style={{ fontSize:15, fontWeight:800 }}>Performance</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
          {[
            { icon:"📝", label:"Drafts Generated", val: pipeline.length },
            { icon:"⚡", label:"Avg Viral Score", val: pipeline.length ? Math.round(pipeline.reduce((a,p)=>a+(p.viralScore||0),0)/pipeline.length)+"/100" : "—" },
            { icon:"👁", label:"Est. Total Views", val: pipeline.length ? (() => { const t=pipeline.reduce((a,p)=>a+(p.predictions?.likely||0),0); return t>=1000000?`${(t/1000000).toFixed(1)}M`:t>=1000?`${(t/1000).toFixed(0)}K`:"0"; })() : "—" },
            { icon:"🎯", label:"Top Hook Pattern", val: pipeline[0]?.hooks?.[0]?.pattern || "—" },
          ].map(s => (
            <div key={s.label} style={{ padding:"12px 14px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:9 }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:15, fontWeight:800, color:"var(--foreground)" }}>{s.val}</div>
              <div style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
