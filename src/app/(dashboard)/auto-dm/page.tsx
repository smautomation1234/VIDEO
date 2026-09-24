"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageCircle,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Key,
  Hash,
  Activity,
  RefreshCw,
  Instagram,
  Info,
  Copy,
  Check,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface IgPage {
  id: string;
  username: string;
  fbPageId: string;
  fbPageName: string;
  profilePicture?: string;
  followersCount?: number;
}

interface AutoDmRule {
  id: string;
  rule_name: string;
  ig_account_id: string;
  ig_account_username?: string;
  trigger_type: "any_comment" | "keyword";
  keywords: string[];
  target_post_id?: string;
  dm_message: string;
  daily_limit: number;
  is_active: boolean;
  total_sent: number;
  today_sent: number;
  created_at: string;
}

interface Subscription {
  ig_account_id: string;
  ig_account_username?: string;
  is_active: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";
const WEBHOOK_URL = `${APP_URL}/api/auto-dm/webhook`;

export default function AutoDmPage() {
  const [igPages, setIgPages] = useState<IgPage[]>([]);
  const [rules, setRules] = useState<AutoDmRule[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "error"; msg: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    rule_name: "",
    ig_account_id: "",
    trigger_type: "any_comment" as "any_comment" | "keyword",
    keywords: "",
    target_post_id: "",
    dm_message: "",
    daily_limit: 50,
  });

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadPages = useCallback(async () => {
    try {
      const res = await fetch("/api/social/instagram/pages");
      const data = await res.json();
      setIgPages(data.pages || []);
    } catch { /* ignore */ }
  }, []);

  const loadRules = useCallback(async () => {
    try {
      const res = await fetch("/api/auto-dm/rules");
      const data = await res.json();
      setRules(data.rules || []);
    } catch { /* ignore */ }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      const res = await fetch("/api/auto-dm/subscribe");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([loadPages(), loadRules(), loadSubscriptions()]).finally(() =>
      setLoading(false)
    );
  }, [loadPages, loadRules, loadSubscriptions]);

  const showToast = (type: "ok" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Subscribe an IG account to webhooks ──────────────────────────────────
  const subscribeAccount = async (page: IgPage) => {
    // We need the page access token — fetch it from the pages API
    try {
      const tokenRes = await fetch(`/api/auto-dm/page-token?fb_page_id=${page.fbPageId}`);
      const tokenData = await tokenRes.json();
      const pageToken = tokenData.page_token;

      const res = await fetch("/api/auto-dm/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ig_account_id: page.id,
          ig_account_username: page.username,
          fb_page_id: page.fbPageId,
          page_access_token: pageToken,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error + (data.details ? ": " + data.details : ""));
      showToast("ok", `@${page.username} subscribed to comment webhooks!`);
      await loadSubscriptions();
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  // ── Create rule ───────────────────────────────────────────────────────────
  const createRule = async () => {
    if (!form.ig_account_id || !form.dm_message.trim()) {
      showToast("error", "Please select an Instagram account and write a DM message.");
      return;
    }
    setSaving(true);
    try {
      const page = igPages.find((p) => p.id === form.ig_account_id);
      const res = await fetch("/api/auto-dm/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rule_name: form.rule_name || `Rule for @${page?.username}`,
          ig_account_id: form.ig_account_id,
          ig_account_username: page?.username,
          trigger_type: form.trigger_type,
          keywords: form.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          target_post_id: form.target_post_id.trim() || null,
          dm_message: form.dm_message.trim(),
          daily_limit: form.daily_limit,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast("ok", "Auto-DM rule created!");
      setShowForm(false);
      setForm({
        rule_name: "",
        ig_account_id: "",
        trigger_type: "any_comment",
        keywords: "",
        target_post_id: "",
        dm_message: "",
        daily_limit: 50,
      });
      await loadRules();
    } catch (e: any) {
      showToast("error", e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle rule active ────────────────────────────────────────────────────
  const toggleRule = async (rule: AutoDmRule) => {
    try {
      const res = await fetch(`/api/auto-dm/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
      );
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  // ── Delete rule ───────────────────────────────────────────────────────────
  const deleteRule = async (ruleId: string) => {
    if (!confirm("Delete this Auto-DM rule? This cannot be undone.")) return;
    try {
      await fetch(`/api/auto-dm/rules/${ruleId}`, { method: "DELETE" });
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      showToast("ok", "Rule deleted.");
    } catch (e: any) {
      showToast("error", e.message);
    }
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const isSubscribed = (igId: string) =>
    subscriptions.some((s) => s.ig_account_id === igId && s.is_active);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="auto-dm-page">
      {/* Toast */}
      {toast && (
        <div className={`auto-dm-toast ${toast.type === "ok" ? "toast-ok" : "toast-err"}`}>
          {toast.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="auto-dm-header">
        <div className="header-left">
          <div className="header-icon">
            <MessageCircle size={22} />
          </div>
          <div>
            <h1 className="header-title">Instagram Auto-DM</h1>
            <p className="header-sub">
              Auto-send DMs when someone comments on your posts — no third-party apps
            </p>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(true)}
          id="btn-create-rule"
        >
          <Plus size={16} />
          New Rule
        </button>
      </div>

      {/* Webhook Setup Card */}
      <div className="setup-card">
        <div className="setup-card-header">
          <Key size={18} style={{ color: "var(--lavender-ink)" }} />
          <span className="setup-card-title">Meta Webhook Setup</span>
          <span className="badge-required">Required once</span>
        </div>
        <p className="setup-card-desc">
          Paste these into your{" "}
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent"
          >
            Meta App Dashboard
          </a>{" "}
          → Webhooks → Instagram → Subscribe to <strong>comments</strong>.
        </p>
        <div className="setup-fields">
          <div className="setup-field">
            <label className="field-label">Callback URL</label>
            <div className="field-copy-row">
              <code className="field-value">{WEBHOOK_URL}</code>
              <button
                className="btn-copy"
                onClick={() => copyText(WEBHOOK_URL)}
                id="btn-copy-webhook-url"
              >
                {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <div className="setup-field">
            <label className="field-label">Verify Token</label>
            <div className="field-copy-row">
              <code className="field-value">Your verify token</code>
            </div>
            <p className="field-hint">
              Set META_WEBHOOK_VERIFY_TOKEN when configuring the Meta webhook.
            </p>
          </div>
        </div>
        <div className="setup-info">
          <Info size={13} />
          After adding the webhook, subscribe each Instagram account below so it starts receiving events.
        </div>
      </div>

      {/* Instagram Accounts */}
      <div className="section-label">Instagram Accounts</div>
      {loading ? (
        <div className="loading-row">
          <RefreshCw size={16} className="spin" />
          <span>Loading accounts…</span>
        </div>
      ) : igPages.length === 0 ? (
        <div className="empty-accounts">
          <Instagram size={32} className="empty-icon" />
          <p>No Instagram accounts connected yet.</p>
          <a href="/settings/connections" className="btn-outline">
            Connect Instagram →
          </a>
        </div>
      ) : (
        <div className="accounts-grid">
          {igPages.map((page) => {
            const subscribed = isSubscribed(page.id);
            return (
              <div key={page.id} className="account-card">
                <div className="account-avatar">
                  {page.profilePicture ? (
                    <img src={page.profilePicture} alt={page.username} />
                  ) : (
                    <Instagram size={20} />
                  )}
                </div>
                <div className="account-info">
                  <p className="account-name">@{page.username}</p>
                  <p className="account-sub">{page.fbPageName}</p>
                  {page.followersCount && (
                    <p className="account-followers">
                      {page.followersCount.toLocaleString()} followers
                    </p>
                  )}
                </div>
                <div className="account-actions">
                  {subscribed ? (
                    <span className="badge-subscribed">
                      <CheckCircle2 size={12} /> Subscribed
                    </span>
                  ) : (
                    <button
                      className="btn-subscribe"
                      onClick={() => subscribeAccount(page)}
                      id={`btn-subscribe-${page.id}`}
                    >
                      <Zap size={14} />
                      Subscribe
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Rule Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <Plus size={18} /> Create Auto-DM Rule
            </h2>

            <div className="form-grid">
              {/* Rule Name */}
              <div className="form-group">
                <label className="form-label">Rule Name</label>
                <input
                  id="rule-name"
                  className="form-input"
                  placeholder="e.g. Free Guide DM"
                  value={form.rule_name}
                  onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
                />
              </div>

              {/* IG Account */}
              <div className="form-group">
                <label className="form-label">Instagram Account *</label>
                <select
                  id="rule-ig-account"
                  className="form-input"
                  value={form.ig_account_id}
                  onChange={(e) => setForm({ ...form, ig_account_id: e.target.value })}
                >
                  <option value="">— Select account —</option>
                  {igPages.map((p) => (
                    <option key={p.id} value={p.id}>
                      @{p.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trigger */}
              <div className="form-group">
                <label className="form-label">Trigger When…</label>
                <div className="radio-group">
                  <label className="radio-opt">
                    <input
                      type="radio"
                      name="trigger_type"
                      value="any_comment"
                      checked={form.trigger_type === "any_comment"}
                      onChange={() => setForm({ ...form, trigger_type: "any_comment" })}
                    />
                    <span>Anyone comments</span>
                  </label>
                  <label className="radio-opt">
                    <input
                      type="radio"
                      name="trigger_type"
                      value="keyword"
                      checked={form.trigger_type === "keyword"}
                      onChange={() => setForm({ ...form, trigger_type: "keyword" })}
                    />
                    <span>Comment contains keyword(s)</span>
                  </label>
                </div>
              </div>

              {/* Keywords */}
              {form.trigger_type === "keyword" && (
                <div className="form-group">
                  <label className="form-label">
                    <Hash size={13} /> Keywords (comma separated)
                  </label>
                  <input
                    id="rule-keywords"
                    className="form-input"
                    placeholder="free, guide, link, drop"
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  />
                </div>
              )}

              {/* Target Post (optional) */}
              <div className="form-group">
                <label className="form-label">
                  Target Post ID{" "}
                  <span className="label-optional">(leave blank = all posts)</span>
                </label>
                <input
                  id="rule-post-id"
                  className="form-input"
                  placeholder="Instagram Media ID (optional)"
                  value={form.target_post_id}
                  onChange={(e) => setForm({ ...form, target_post_id: e.target.value })}
                />
              </div>

              {/* DM Message */}
              <div className="form-group form-group-full">
                <label className="form-label">
                  DM Message *
                </label>
                <textarea
                  id="rule-dm-message"
                  className="form-textarea"
                  placeholder="Hey! Thanks for commenting 🙌 Here's the free link you asked for: https://..."
                  rows={4}
                  value={form.dm_message}
                  onChange={(e) => setForm({ ...form, dm_message: e.target.value })}
                />
                <p className="char-count">{form.dm_message.length} chars</p>
              </div>

              {/* Daily Limit */}
              <div className="form-group">
                <label className="form-label">Daily DM Limit</label>
                <input
                  id="rule-daily-limit"
                  type="number"
                  min={1}
                  max={200}
                  className="form-input"
                  value={form.daily_limit}
                  onChange={(e) =>
                    setForm({ ...form, daily_limit: parseInt(e.target.value) || 50 })
                  }
                />
                <p className="field-hint">Keep ≤50/day to avoid Instagram restrictions</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={createRule}
                disabled={saving}
                id="btn-save-rule"
              >
                {saving ? (
                  <RefreshCw size={15} className="spin" />
                ) : (
                  <Send size={15} />
                )}
                {saving ? "Saving…" : "Create Rule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="section-label" style={{ marginTop: "2rem" }}>
        Active Rules{" "}
        <span className="badge-count">{rules.length}</span>
      </div>

      {rules.length === 0 ? (
        <div className="empty-rules">
          <MessageCircle size={36} className="empty-icon" />
          <p>No rules yet. Create one and your DMs go out on autopilot.</p>
        </div>
      ) : (
        <div className="rules-list">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`rule-card ${rule.is_active ? "rule-active" : "rule-inactive"}`}
            >
              {/* Rule Header */}
              <div className="rule-header">
                <div className="rule-left">
                  <div
                    className={`rule-status-dot ${rule.is_active ? "dot-green" : "dot-gray"}`}
                  />
                  <div>
                    <p className="rule-name">{rule.rule_name}</p>
                    <p className="rule-account">
                      @{rule.ig_account_username || rule.ig_account_id}
                    </p>
                  </div>
                </div>
                <div className="rule-right">
                  {/* Stats */}
                  <div className="rule-stats">
                    <span className="stat">
                      <Activity size={12} /> {rule.today_sent}/{rule.daily_limit} today
                    </span>
                    <span className="stat total">
                      {rule.total_sent} total
                    </span>
                  </div>
                  {/* Toggle */}
                  <button
                    className="btn-icon"
                    onClick={() => toggleRule(rule)}
                    title={rule.is_active ? "Pause" : "Activate"}
                    id={`btn-toggle-${rule.id}`}
                  >
                    {rule.is_active ? (
                      <ToggleRight size={22} style={{ color: "var(--sage-ink)" }} />
                    ) : (
                      <ToggleLeft size={22} style={{ color: "var(--muted-foreground)" }} />
                    )}
                  </button>
                  {/* Expand */}
                  <button
                    className="btn-icon"
                    onClick={() =>
                      setExpandedRule(expandedRule === rule.id ? null : rule.id)
                    }
                    id={`btn-expand-${rule.id}`}
                  >
                    {expandedRule === rule.id ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  {/* Delete */}
                  <button
                    className="btn-icon"
                    style={{ color: "var(--rose-ink)" }}
                    onClick={() => deleteRule(rule.id)}
                    id={`btn-delete-${rule.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedRule === rule.id && (
                <div className="rule-detail">
                  <div className="detail-row">
                    <span className="detail-label">Trigger</span>
                    <span className="detail-val">
                      {rule.trigger_type === "any_comment"
                        ? "Any comment"
                        : `Keywords: ${rule.keywords.join(", ")}`}
                    </span>
                  </div>
                  {rule.target_post_id && (
                    <div className="detail-row">
                      <span className="detail-label">Post ID</span>
                      <span className="detail-val">{rule.target_post_id}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">DM Message</span>
                    <span className="detail-val message-preview">{rule.dm_message}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created</span>
                    <span className="detail-val">
                      {new Date(rule.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* How it Works */}
      <div className="how-it-works">
        <h3 className="how-title">How It Works</h3>
        <div className="how-steps">
          {[
            {
              step: "1",
              title: "Connect Instagram",
              desc: "Link your Instagram Business account via Settings → Connections",
            },
            {
              step: "2",
              title: "Add Webhook",
              desc: "Paste the Callback URL and Verify Token in your Meta App Dashboard",
            },
            {
              step: "3",
              title: "Subscribe Account",
              desc: "Click Subscribe next to your Instagram account above",
            },
            {
              step: "4",
              title: "Create a Rule",
              desc: "Choose trigger (any comment or keyword) and write your DM",
            },
            {
              step: "5",
              title: "Auto-DMs Go Out",
              desc: "Every time someone comments, they get your DM instantly",
            },
          ].map((s) => (
            <div key={s.step} className="how-step">
              <div className="step-num">{s.step}</div>
              <div>
                <p className="step-title">{s.title}</p>
                <p className="step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .auto-dm-page {
          max-width: 860px;
          margin: 0 auto;
          padding-bottom: 4rem;
        }
        /* Toast */
        .auto-dm-toast {
          position: fixed;
          top: 1.2rem;
          right: 1.2rem;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          animation: slideIn 0.25s ease;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border);
        }
        .toast-ok { background: var(--sage-bg); color: var(--sage-ink); }
        .toast-err { background: var(--rose-bg); color: var(--rose-ink); }
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Header */
        .auto-dm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--background);
          flex-shrink: 0;
        }
        .header-title {
          font-size: 1.45rem;
          font-weight: 700;
          margin: 0;
          color: var(--foreground);
        }
        .header-sub {
          font-size: 0.82rem;
          color: var(--muted-foreground);
          margin: 0;
        }

        /* Buttons */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1.2rem;
          background: var(--primary);
          color: var(--background);
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1.1rem;
          border: 1px solid var(--border);
          color: var(--foreground);
          background: var(--card);
          border-radius: 8px;
          font-size: 0.83rem;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.15s;
        }
        .btn-outline:hover { background: var(--muted); }

        .btn-ghost {
          padding: 0.6rem 1.1rem;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted-foreground);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-ghost:hover { background: var(--muted); }

        .btn-icon {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--muted-foreground);
          padding: 0.3rem;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          display: flex;
        }
        .btn-icon:hover { background: var(--muted); color: var(--foreground); }

        .btn-copy {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.6rem;
          background: var(--lavender-bg);
          border: none;
          border-radius: 6px;
          color: var(--lavender-ink);
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-copy:hover { opacity: 0.8; }

        .btn-subscribe {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.4rem 0.85rem;
          background: var(--primary);
          border: none;
          border-radius: 7px;
          color: var(--background);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-subscribe:hover { opacity: 0.85; }

        /* Setup Card */
        .setup-card {
          background: var(--lavender-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.75rem;
        }
        .setup-card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.6rem;
        }
        .setup-card-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--foreground);
        }
        .badge-required {
          margin-left: auto;
          font-size: 0.72rem;
          background: var(--card);
          color: var(--lavender-ink);
          padding: 0.18rem 0.6rem;
          border-radius: 99px;
          font-weight: 600;
        }
        .setup-card-desc {
          font-size: 0.83rem;
          color: var(--muted-foreground);
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .link-accent { color: var(--lavender-ink); }
        .setup-fields {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .setup-field { flex: 1; min-width: 200px; }
        .field-label {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted-foreground);
          display: block;
          margin-bottom: 0.3rem;
        }
        .field-copy-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
        }
        .field-value {
          font-size: 0.78rem;
          font-family: monospace;
          flex: 1;
          word-break: break-all;
          color: var(--foreground);
        }
        .setup-info {
          display: flex;
          align-items: flex-start;
          gap: 0.45rem;
          margin-top: 0.9rem;
          font-size: 0.78rem;
          color: var(--muted-foreground);
          line-height: 1.5;
        }

        /* Section Label */
        .section-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          font-weight: 700;
          color: var(--muted-foreground);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .badge-count {
          background: var(--lavender-bg);
          color: var(--lavender-ink);
          padding: 0.1rem 0.5rem;
          border-radius: 99px;
          font-size: 0.7rem;
        }

        /* Loading / Empty */
        .loading-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--muted-foreground);
          font-size: 0.85rem;
          padding: 1rem 0;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .empty-accounts, .empty-rules {
          text-align: center;
          padding: 2.5rem 1rem;
          border: 1px dashed var(--border);
          border-radius: 12px;
          color: var(--muted-foreground);
          background: var(--card);
        }
        .empty-icon { margin: 0 auto 0.75rem; opacity: 0.3; display: block; }

        /* Accounts Grid */
        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 0.85rem;
          margin-bottom: 1.75rem;
        }
        .account-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          transition: border-color 0.15s;
        }
        .account-card:hover { border-color: var(--sage); }
        .account-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--background);
          flex-shrink: 0;
          overflow: hidden;
        }
        .account-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .account-info { flex: 1; min-width: 0; }
        .account-name { font-weight: 600; font-size: 0.88rem; margin: 0; color: var(--foreground); }
        .account-sub { font-size: 0.75rem; color: var(--muted-foreground); margin: 0; }
        .account-followers { font-size: 0.72rem; color: var(--sage-ink); margin: 0; }
        .badge-subscribed {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.73rem;
          background: var(--sage-bg);
          color: var(--sage-ink);
          padding: 0.25rem 0.65rem;
          border-radius: 99px;
          font-weight: 600;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(41,37,30,0.45);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .modal-box {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 2rem;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0 0 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--foreground);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        .form-group-full { grid-column: 1 / -1; }
        .form-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--muted-foreground);
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .label-optional { font-weight: 400; font-size: 0.72rem; }
        .form-input, .form-textarea {
          background: var(--background);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0.6rem 0.85rem;
          font-size: 0.88rem;
          color: var(--foreground);
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }
        .form-input:focus, .form-textarea:focus {
          border-color: var(--primary);
        }
        .form-textarea { resize: vertical; }
        .radio-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .radio-opt {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.86rem;
          cursor: pointer;
          color: var(--foreground);
        }
        .char-count {
          font-size: 0.72rem;
          color: var(--muted-foreground);
          text-align: right;
          margin: 0;
        }
        .field-hint {
          font-size: 0.72rem;
          color: var(--butter-ink);
          margin: 0.3rem 0 0;
          line-height: 1.4;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        /* Rules List */
        .rules-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .rule-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.15s;
          background: var(--card);
        }
        .rule-active { border-color: var(--sage); }
        .rule-inactive { opacity: 0.65; }
        .rule-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.2rem;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .rule-left { display: flex; align-items: center; gap: 0.75rem; }
        .rule-status-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dot-green { background: var(--sage-ink); }
        .dot-gray { background: var(--muted-foreground); }
        .rule-name { font-weight: 600; font-size: 0.9rem; margin: 0; color: var(--foreground); }
        .rule-account { font-size: 0.78rem; color: var(--sage-ink); margin: 0; }
        .rule-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .rule-stats { display: flex; align-items: center; gap: 0.6rem; }
        .stat {
          font-size: 0.73rem;
          color: var(--muted-foreground);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .stat.total { color: var(--lavender-ink); }
        .rule-detail {
          padding: 1rem 1.2rem;
          border-top: 1px solid var(--border);
          background: var(--background);
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .detail-row { display: flex; gap: 0.75rem; align-items: flex-start; }
        .detail-label {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          color: var(--muted-foreground);
          min-width: 80px;
          flex-shrink: 0;
        }
        .detail-val { font-size: 0.85rem; flex: 1; color: var(--foreground); }
        .message-preview {
          background: var(--lavender-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          white-space: pre-wrap;
          font-size: 0.83rem;
          line-height: 1.5;
        }

        /* How it Works */
        .how-it-works {
          margin-top: 3rem;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xs);
          padding: 1.5rem;
        }
        .how-title {
          font-size: 0.9rem;
          font-weight: 700;
          margin: 0 0 1.25rem;
          color: var(--muted-foreground);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .how-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .how-step {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
        }
        .step-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--primary);
          color: var(--background);
          font-size: 0.78rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .step-title { font-weight: 600; font-size: 0.88rem; margin: 0; color: var(--foreground); }
        .step-desc { font-size: 0.8rem; color: var(--muted-foreground); margin: 0; }
      `}</style>
    </div>
  );
}
