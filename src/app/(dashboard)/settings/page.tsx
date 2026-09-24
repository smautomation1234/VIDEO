"use client";

import { useEffect, useState } from "react";
import { Link2, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import Toggle from "@/components/ui/Toggle";
import { createClient } from "@/lib/supabase-browser";

export default function SettingsPage() {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [postingTime, setPostingTime] = useState("08:00");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [notifEmail, setNotifEmail] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("brand_profile")
        .select("posting_time, timezone, notification_email")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setPostingTime(data.posting_time ?? "08:00");
        setTimezone(data.timezone ?? "Asia/Kolkata");
        setNotifEmail(data.notification_email ?? true);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("brand_profile").upsert({
      user_id: user.id,
      posting_time: postingTime,
      timezone,
      notification_email: notifEmail,
    }, { onConflict: "user_id" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  return (
    <div className="max-w-[640px] mx-auto animate-fade-in">
      <div className="flex justify-end mb-7">
        <button onClick={handleSave} disabled={saving || loading} className="btn-primary text-sm">
          {saving ? <><RefreshCw size={13} className="animate-spin" /> Saving...</> : <><Save size={13} /> {saved ? "Saved" : "Save"}</>}
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link2 size={15} className="text-muted-foreground" />
              <h2 className="text-[0.9375rem] font-semibold text-foreground">Connected platforms</h2>
            </div>
            <Link href="/settings/connections" className="btn-ghost text-[0.8125rem]">
              Manage
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect LinkedIn and YouTube to publish content automatically.
          </p>
        </div>

        <div className="card">
          <h2 className="text-[0.9375rem] font-semibold text-foreground mb-4">Default posting time</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Time</label>
              <input
                type="time" value={postingTime}
                onChange={e => setPostingTime(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Timezone</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input-field">
                <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                <option value="America/New_York">EST (UTC-5)</option>
                <option value="America/Los_Angeles">PST (UTC-8)</option>
                <option value="Europe/London">GMT (UTC+0)</option>
                <option value="Europe/Paris">CET (UTC+1)</option>
                <option value="Asia/Dubai">GST (UTC+4)</option>
                <option value="Asia/Singapore">SGT (UTC+8)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-[0.9375rem] font-semibold text-foreground mb-4">Notifications</h2>
          <Toggle
            checked={notifEmail}
            onChange={setNotifEmail}
            label="Email notifications"
            description="Get notified when posts publish or fail"
          />
        </div>

        <div className="card bg-muted">
          <p className="text-sm text-muted-foreground leading-relaxed">
            To update your AI persona and niche description, go to{" "}
            <Link href="/settings/brand" className="text-foreground font-medium underline">
              Brand profile
            </Link>
            . These settings impact how the AI writes your posts.
          </p>
        </div>
      </div>
    </div>
  );
}
