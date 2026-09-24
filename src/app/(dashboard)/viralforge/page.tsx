"use client";

import { useState, useRef } from "react";
import ContentGenerator from "@/components/viralforge/ContentGenerator";
import RemixEngine from "@/components/viralforge/RemixEngine";
import ViralFeed from "@/components/viralforge/ViralFeed";
import NicheIntelligence from "@/components/viralforge/NicheIntelligence";
import PatternAnalyzer from "@/components/viralforge/PatternAnalyzer";
import ClientDashboard from "@/components/viralforge/ClientDashboard";
import { Zap, Repeat2, TrendingUp, Brain, BarChart2, LayoutDashboard } from "lucide-react";

const TABS = [
  { id: "generate", label: "AI Content Generator", icon: Zap, desc: "Full post package in 10 seconds" },
  { id: "client", label: "Client Dashboard", icon: LayoutDashboard, desc: "Trending hooks + quick pipeline" },
  { id: "feed", label: "Viral Feed", icon: TrendingUp, desc: "Browse & remix trending posts" },
  { id: "remix", label: "Remix Engine", icon: Repeat2, desc: "Copy what's already viral" },
  { id: "intel", label: "Niche Intelligence", icon: Brain, desc: "500+ posts analyzed per niche" },
  { id: "patterns", label: "Pattern Analyzer", icon: BarChart2, desc: "Cross-niche viral science" },
];

export default function ViralForgePage() {
  const [activeTab, setActiveTab] = useState("generate");
  const [remixCaption, setRemixCaption] = useState("");
  const remixRef = useRef<HTMLDivElement>(null);

  function handleRemixFromFeed(post: any) {
    // Build a caption string from the post data
    const titleHeader = post.title ? `Title: ${post.title}\n\n` : '';
    const scriptText = post.script && Array.isArray(post.script) && post.script.length > 0 ? `Script:\n${post.script.map((l: string) => `- ${l}`).join('\n')}\n\n` : '';
    const styleText = post.style ? `Visual / Editing Style: ${post.style}\n\n` : '';
    const captionText = `${titleHeader}Hook: ${post.hook}\n\n${scriptText}${styleText}${post.caption}\n\nFormat: ${post.format} | Audio: ${post.audio}\nViews: ${post.views?.toLocaleString?.() || "viral"} | Viral Score: ${post.viralScore}/100`;
    setRemixCaption(captionText);
    setActiveTab("remix");
    setTimeout(() => remixRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "var(--sage)", filter: "blur(80px)", opacity: 0.25, borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>ViralForge AI</h1>
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>Go from topic → post-ready content in 5 minutes</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, background: "var(--sage-bg)", border: "1px solid var(--sage)", borderRadius: 8, padding: "6px 12px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3D5E41", display: "inline-block", animation: "pulse-soft 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#3D5E41" }}>AI Ready</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { icon: "⚡", label: "Avg Generation Time", val: "~10 sec" },
            { icon: "🎯", label: "Content Elements", val: "6 per post" },
            { icon: "📊", label: "Viral Score Accuracy", val: "87%" },
            { icon: "🔁", label: "Remix Engine", val: "Live" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "var(--muted)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 20px",
                background: active ? "var(--primary)" : "var(--card)",
                color: active ? "#fff" : "var(--muted-foreground)",
                border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                fontWeight: 600, fontSize: 14, transition: "all 0.15s",
              }}
            >
              <Icon size={16} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{tab.label}</div>
                <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 400 }}>{tab.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-fade-in" key={activeTab}>
        {activeTab === "generate" && <ContentGenerator />}
        {activeTab === "client" && <ClientDashboard />}
        {activeTab === "feed" && <ViralFeed onRemix={handleRemixFromFeed} />}
        {activeTab === "remix" && (
          <div ref={remixRef}>
            <RemixEngine prefillCaption={remixCaption} />
          </div>
        )}
        {activeTab === "intel" && <NicheIntelligence />}
        {activeTab === "patterns" && <PatternAnalyzer />}
      </div>
    </div>
  );
}
