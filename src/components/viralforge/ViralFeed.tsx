"use client";

import { useState, useCallback } from "react";
import { RefreshCw, Repeat2, TrendingUp, Eye, Heart, MessageCircle, Share2, Music } from "lucide-react";

const NICHES = ["Fitness", "Food & Recipes", "Finance", "Business", "Beauty & Fashion", "Travel", "Tech", "Self-Improvement", "Real Estate"];
const PLATFORMS = ["TikTok", "Instagram", "YouTube"];

function fmtNum(n: number): string {
  if (!n) return "–";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

interface Post {
  id: string;
  creator: string;
  title?: string;
  topic?: string;
  caption: string;
  hook: string;
  script?: string[];
  style?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  viralScore: number;
  format: string;
  audio: string;
  hashtags: string[];
  postedAgo: string;
  trend: string;
  trendColor: string;
}

interface ViralFeedProps {
  onRemix: (post: Post) => void;
}

export default function ViralFeed({ onRemix }: ViralFeedProps) {
  const [niche, setNiche] = useState("Fitness");
  const [platform, setPlatform] = useState("TikTok");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchFeed = useCallback(async (n = niche, p = platform) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/generate/viral-feed?niche=${encodeURIComponent(n)}&platform=${encodeURIComponent(p)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setPosts(data.posts || []);
      setFetched(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [niche, platform]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Filter bar */}
      <div className="card" style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label className="label">Niche</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {NICHES.map((n) => (
              <button key={n} onClick={() => setNiche(n)} style={{ padding: "6px 11px", borderRadius: 7, border: `1px solid ${niche === n ? "var(--primary)" : "var(--border)"}`, background: niche === n ? "var(--primary)" : "var(--card)", color: niche === n ? "#fff" : "var(--muted-foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>{n}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Platform</label>
          <div style={{ display: "flex", gap: 6 }}>
            {PLATFORMS.map((p) => (
              <button key={p} onClick={() => setPlatform(p)} style={{ padding: "6px 11px", borderRadius: 7, border: `1px solid ${platform === p ? "var(--primary)" : "var(--border)"}`, background: platform === p ? "var(--primary)" : "var(--card)", color: platform === p ? "#fff" : "var(--muted-foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>{p}</button>
            ))}
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => fetchFeed(niche, platform)}
          disabled={loading}
          style={{ height: 40, paddingLeft: 20, paddingRight: 20, fontSize: 13, flexShrink: 0 }}
        >
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <TrendingUp size={15} />}
          {loading ? "Scanning..." : fetched ? "Refresh Feed" : "Scan Viral Posts"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 8, fontSize: 13, color: "#7A3A2A", fontWeight: 500 }}>⚠️ {error}</div>
      )}

      {/* Empty state */}
      {!fetched && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted-foreground)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Discover What's Going Viral</div>
          <div style={{ fontSize: 14 }}>Select your niche and platform, then hit "Scan Viral Posts" to see AI-curated trending content.</div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 240, background: "var(--muted)", animation: "pulse-soft 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {/* Posts grid */}
      {!loading && posts.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3D5E41", display: "inline-block", animation: "pulse-soft 2s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#3D5E41" }}>Showing {posts.length} viral posts in {niche} · {platform}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {posts.map((post) => (
              <div key={post.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden", padding: 18 }}>
                {/* Trend badge */}
                <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: post.trendColor, background: `${post.trendColor}18`, border: `1px solid ${post.trendColor}40`, padding: "3px 8px", borderRadius: 20 }}>
                    {post.trend}
                  </span>
                </div>

                {/* Creator + time */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--muted)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--muted-foreground)", flexShrink: 0 }}>
                    {post.creator?.[1]?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{post.creator}</div>
                    <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{post.postedAgo}</div>
                  </div>
                </div>

                {/* Title */}
                {post.title && (
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: "2px 0 0 0", color: "var(--foreground)", lineHeight: 1.3 }}>
                    {post.title}
                  </h3>
                )}

                {/* Topic */}
                {post.topic && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Topic:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, background: "var(--sage-bg)", color: "#3D5E41", padding: "3px 8px", borderRadius: 5, border: "1px solid var(--sage)" }}>{post.topic}</span>
                  </div>
                )}

                {/* Hook & Caption */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ padding: "10px 12px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: 3 }}>Opening Hook</div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{post.hook}"</p>
                  </div>

                  {post.script && post.script.length > 0 && (
                    <div style={{ padding: "10px 12px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: 4 }}>Script Lines</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {post.script.map((line, idx) => (
                          <div key={idx} style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.4, borderLeft: "2px solid var(--primary)", paddingLeft: 8 }}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {post.style && (
                    <div style={{ padding: "10px 12px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: 3 }}>Visual / Editing Style</div>
                      <p style={{ fontSize: 12, color: "var(--foreground)", margin: 0, lineHeight: 1.4 }}>{post.style}</p>
                    </div>
                  )}

                  {post.caption && (
                    <div style={{ padding: "10px 12px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)", marginBottom: 3 }}>Full Caption</div>
                      <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0, lineHeight: 1.4 }}>{post.caption}</p>
                    </div>
                  )}
                </div>

                {/* Format + Audio */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ padding: "4px 9px", background: "var(--lavender-bg)", border: "1px solid var(--lavender)", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#50487A" }}>📹 {post.format}</span>
                  <span style={{ padding: "4px 9px", background: "var(--rose-bg)", border: "1px solid var(--rose)", borderRadius: 6, fontSize: 11, fontWeight: 600, color: "#7A3A2A" }}><Music size={10} style={{ display: "inline", marginRight: 3 }} />{post.audio}</span>
                </div>

                {/* Engagement stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { icon: <Eye size={12} />, val: fmtNum(post.views), label: "Views" },
                    { icon: <Heart size={12} />, val: fmtNum(post.likes), label: "Likes" },
                    { icon: <MessageCircle size={12} />, val: fmtNum(post.comments), label: "Comments" },
                    { icon: <Share2 size={12} />, val: fmtNum(post.shares), label: "Shares" },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: "center", padding: "7px 4px", background: "var(--muted)", borderRadius: 7, border: "1px solid var(--border)" }}>
                      <div style={{ color: "var(--muted-foreground)", marginBottom: 2 }}>{s.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: "var(--muted-foreground)", fontWeight: 600 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Viral score bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Viral Score</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: post.viralScore >= 85 ? "#3D5E41" : post.viralScore >= 70 ? "#7A5A2A" : "var(--muted-foreground)" }}>{post.viralScore}/100</span>
                  </div>
                  <div style={{ height: 5, background: "var(--muted)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${post.viralScore}%`, height: "100%", background: post.viralScore >= 85 ? "#3D5E41" : post.viralScore >= 70 ? "#D97706" : "#9CA3AF", borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                </div>

                {/* Hashtags */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {(post.hashtags || []).slice(0, 4).map((tag, i) => (
                    <span key={i} style={{ fontSize: 11, color: "var(--muted-foreground)", background: "var(--muted)", padding: "2px 7px", borderRadius: 10, border: "1px solid var(--border)" }}>#{tag.replace(/^#/, "")}</span>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => onRemix(post)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  <Repeat2 size={15} />
                  Remix This Post
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
