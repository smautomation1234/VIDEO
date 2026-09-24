"use client";

import { useEffect, useState } from "react";
import { Save, RefreshCw, Target, Check } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function BrandPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [persona, setPersona] = useState("");
  const [niche, setNiche] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [writingStyle, setWritingStyle] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentGoals, setContentGoals] = useState("");
  const [avoidTopics, setAvoidTopics] = useState("");

  const [sample1, setSample1] = useState("");
  const [sample2, setSample2] = useState("");
  const [sample3, setSample3] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("users")
        .select("full_name, persona, niche_description, linkedin_url, writing_style, target_audience, content_goals, avoid_topics, writing_sample_1, writing_sample_2, writing_sample_3")
        .eq("id", user.id)
        .single();
      if (data) {
        setName(data.full_name ?? "");
        setPersona(data.persona ?? "");
        setNiche(data.niche_description ?? "");
        setLinkedinUrl(data.linkedin_url ?? "");
        setWritingStyle(data.writing_style ?? "");
        setTargetAudience(data.target_audience ?? "");
        setContentGoals(data.content_goals ?? "");
        setAvoidTopics(data.avoid_topics ?? "");
        setSample1(data.writing_sample_1 ?? "");
        setSample2(data.writing_sample_2 ?? "");
        setSample3(data.writing_sample_3 ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not signed in"); setSaving(false); return; }
    const { error: err } = await supabase
      .from("users")
      .update({
        full_name: name,
        persona,
        niche_description: niche,
        linkedin_url: linkedinUrl,
        writing_style: writingStyle,
        target_audience: targetAudience,
        content_goals: contentGoals,
        avoid_topics: avoidTopics,
        writing_sample_1: sample1,
        writing_sample_2: sample2,
        writing_sample_3: sample3,
      })
      .eq("id", user.id);
    if (err) setError(err.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-[700px] mx-auto">
        {[1, 2, 3, 4].map(i => <div key={i} className="card animate-pulse-soft bg-muted" style={{ height: 120, marginBottom: "1rem" }} />)}
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto animate-fade-in">
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-[0.8125rem]" style={{ background: "var(--rose-bg)", border: "1px solid var(--rose)", color: "var(--rose-ink)" }}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-5">

        <div className="card">
          <p className="label-muted">Who you are</p>
          <p className="text-xs text-muted-foreground mb-4">Basic information the AI uses to personalize every post</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Your name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g. Rahul Sharma" />
            </div>
            <div>
              <label className="label">LinkedIn profile URL</label>
              <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} className="input-field" placeholder="https://linkedin.com/in/yourhandle" />
            </div>
          </div>
          <div>
            <label className="label">Role, background, story</label>
            <textarea
              value={persona} onChange={e => setPersona(e.target.value)}
              className="input-field" rows={3}
              placeholder="e.g. I'm a 2x startup founder currently building an AI SaaS for enterprise sales teams. Previously raised a $4M seed round. I write from hard-earned experience, not theory."
            />
          </div>
        </div>

        <div className="card">
          <p className="label-muted">What you write about</p>
          <p className="text-xs text-muted-foreground mb-4">What you post about, who reads it, and why</p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Niche / topics you cover</label>
              <textarea
                value={niche} onChange={e => setNiche(e.target.value)}
                className="input-field" rows={2}
                placeholder="e.g. B2B SaaS, startup fundraising, founder mindset, AI tools for enterprise, product-led growth"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                These topics shape the posts themselves — the AI also scouts news from them when you generate a post
              </p>
            </div>
            <div>
              <label className="label">Target audience <span className="font-normal text-muted-foreground">(who reads your posts)</span></label>
              <input
                type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                className="input-field"
                placeholder="e.g. Series A/B founders, VCs, B2B SaaS operators, enterprise IT buyers"
              />
            </div>
            <div>
              <label className="label">Content goals <span className="font-normal text-muted-foreground">(why you post)</span></label>
              <input
                type="text" value={contentGoals} onChange={e => setContentGoals(e.target.value)}
                className="input-field"
                placeholder="e.g. Build thought leadership, attract inbound enterprise leads, grow LinkedIn following to 10k"
              />
            </div>
            <div>
              <label className="label">Topics to <strong>never</strong> post about</label>
              <input
                type="text" value={avoidTopics} onChange={e => setAvoidTopics(e.target.value)}
                className="input-field"
                placeholder="e.g. Politics, crypto/web3, consumer apps, personal life, salary discussions"
              />
            </div>
          </div>
        </div>

        <ContentInterestsSection />

        <div className="card">
          <p className="label-muted">Voice &amp; samples</p>
          <p className="text-xs text-muted-foreground mb-4">How you write — the AI mimics this exactly, learning most from your real posts</p>

          <label className="label">Describe your writing style</label>
          <textarea
            value={writingStyle} onChange={e => setWritingStyle(e.target.value)}
            className="input-field" rows={3}
            placeholder="e.g. Direct and confident, slightly contrarian. I use short sentences. I like data and specific numbers. I don't use corporate jargon. I sometimes use self-deprecating humor. I write like I'm talking to one person, not a crowd."
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            The more specific, the better. Describe sentence length, tone, vocabulary, humor level, etc.
          </p>

          <hr className="my-5" style={{ border: "none", borderTop: "1px solid var(--border)" }} />

          <label className="label">Writing samples</label>
          <p className="text-xs text-muted-foreground mb-3">Paste up to 3 of your best LinkedIn posts</p>
          <div className="flex flex-col gap-4">
            {[
              { label: "Best post #1", value: sample1, onChange: setSample1, placeholder: "Paste your best-performing LinkedIn post here..." },
              { label: "Best post #2", value: sample2, onChange: setSample2, placeholder: "Paste another strong post..." },
              { label: "Best post #3 (optional)", value: sample3, onChange: setSample3, placeholder: "One more if you have it..." },
            ].map((s, i) => (
              <div key={i}>
                <label className="label">{s.label}</label>
                <textarea
                  value={s.value} onChange={e => s.onChange(e.target.value)}
                  className="input-field" rows={4}
                  placeholder={s.placeholder}
                />
                {s.value && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {s.value.split(/\s+/).filter(Boolean).length} words
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 px-4 py-3 rounded-lg bg-muted text-[0.8125rem] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">How AI uses these:</strong> Each time you generate a post, the AI reads your samples to match your sentence rhythm, vocabulary, hook style, and ending pattern. It learns what makes your posts sound like <em>you</em>, not a generic AI.
          </div>
        </div>

      </div>

      <div className="flex justify-end mt-6">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <><RefreshCw size={13} className="animate-spin" /> Saving...</> : <><Save size={13} /> {saved ? "Saved" : "Save profile"}</>}
        </button>
      </div>
    </div>
  );
}

const ALL_CATEGORIES = [
  "Tech & AI",
  "Business & Startups",
  "Marketing & Growth",
  "Politics & News",
  "Finance & Investing",
  "Health & Science",
  "Design & Product",
  "Leadership & Culture",
  "SaaS",
  "Venture Capital",
  "Future of Work",
  "Cybersecurity",
];

function ContentInterestsSection() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customSources, setCustomSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sourceError, setSourceError] = useState("");

  useEffect(() => {
    fetch("/api/user/content-preferences")
      .then(r => r.json())
      .then(data => {
        setSelectedCategories(data.preferred_categories ?? []);
        setCustomSources(data.custom_sources ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const validateSource = (src: string): boolean => {
    const s = src.trim().toLowerCase();
    if (s.startsWith("r/") && s.length > 2) return true;
    try {
      new URL(src.startsWith("http") ? src : "https://" + src);
      return true;
    } catch {
      return false;
    }
  };

  const addSource = () => {
    const trimmed = newSource.trim();
    if (!trimmed) return;
    if (!validateSource(trimmed)) {
      setSourceError("Enter a valid URL (e.g. techcrunch.com) or subreddit (e.g. r/MachineLearning)");
      return;
    }
    if (customSources.includes(trimmed)) { setSourceError("Already added"); return; }
    if (customSources.length >= 10) { setSourceError("Max 10 custom sources"); return; }
    setCustomSources(prev => [...prev, trimmed]);
    setNewSource("");
    setSourceError("");
  };

  const removeSource = (src: string) => setCustomSources(prev => prev.filter(s => s !== src));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/content-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_categories: selectedCategories,
          custom_sources: customSources,
        }),
      });
      const data = await res.json();
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return <div className="card animate-pulse-soft bg-muted" style={{ height: 200 }} />;
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="label-muted">News &amp; sources</p>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-muted-foreground" />
            <h2 className="text-[0.9375rem] font-semibold text-foreground">Content interests</h2>
            <span className="badge badge-info">Personalized feed</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Where The Personal Brand scans for fresh news and material. Separate from the topics above, which shape the posts themselves.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-secondary text-[0.8125rem] shrink-0"
        >
          {saving ? <><RefreshCw size={12} className="animate-spin" /> Saving...</> : <><Save size={12} /> {saved ? "Saved" : "Save interests"}</>}
        </button>
      </div>

      <div className="mb-6">
        <label className="label">
          News categories <span className="font-normal text-muted-foreground">— select all that apply</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.4rem 0.875rem", borderRadius: 9999, cursor: "pointer",
                  fontSize: "0.8125rem", fontWeight: isSelected ? 600 : 400,
                  border: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                  background: isSelected ? "var(--primary)" : "transparent",
                  color: isSelected ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  transition: "all 0.15s",
                }}
              >
                {cat}
                {isSelected && <Check size={12} />}
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: selectedCategories.length === 0 ? "var(--butter-ink)" : "var(--muted-foreground)" }}>
          {selectedCategories.length === 0
            ? "No categories selected — The Personal Brand will default to Tech & AI"
            : `${selectedCategories.length} ${selectedCategories.length === 1 ? "category" : "categories"} selected`}
        </p>
      </div>

      <div>
        <label className="label">
          Custom sources <span className="font-normal text-muted-foreground">— subreddits or websites to track (max 10)</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2.5">
          Examples:&nbsp;
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">r/MachineLearning</code>&nbsp;
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">techcrunch.com</code>&nbsp;
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">r/SaaS</code>
        </p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSource}
            onChange={e => { setNewSource(e.target.value); setSourceError(""); }}
            onKeyDown={e => e.key === "Enter" && addSource()}
            placeholder="r/ChatGPT or mashable.com"
            className="input-field flex-1 text-sm"
          />
          <button
            onClick={addSource}
            className="btn-secondary text-sm whitespace-nowrap"
          >
            Add
          </button>
        </div>
        {sourceError && (
          <p className="text-error mb-2">{sourceError}</p>
        )}
        {customSources.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {customSources.map(src => (
              <span key={src} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium text-foreground">
                {src}
                <button
                  onClick={() => removeSource(src)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 15, lineHeight: 1, padding: 0, marginLeft: 2 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic mt-1.5">
            No custom sources yet
          </p>
        )}
      </div>
    </div>
  );
}
