"use client";

import { useEffect, useState, useCallback } from "react";
import { Linkedin, Youtube, CheckCircle, AlertCircle, Clock, ExternalLink, Instagram, Facebook, KeyRound } from "lucide-react";

interface PlatformStatus {
  connected: boolean;
  accountName?: string;
  channelTitle?: string;
  profilePicture?: string;
  expiresAt?: string;
  status?: string;
}

interface Connections {
  linkedin: PlatformStatus;
  youtube: PlatformStatus;
  facebook: PlatformStatus;
}

function daysUntil(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiresAt, platform }: { expiresAt?: string; platform?: string }) {
  if (!expiresAt) return null;
  if (platform === "youtube") {
    return <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Auto-refreshes</span>;
  }
  const days = daysUntil(expiresAt);
  if (days < 0) return <span className="text-xs font-medium" style={{ color: "var(--rose-ink)" }}>Token expired — reconnect</span>;
  if (days === 0) return <span className="text-xs font-medium" style={{ color: "var(--butter-ink)" }}>Expires today</span>;
  if (days < 14) return <span className="text-xs font-medium" style={{ color: "var(--butter-ink)" }}>Expires in {days} days</span>;
  return <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Expires in {days} days</span>;
}

function PlatformCard({
  platform,
  icon: Icon,
  iconColor,
  label,
  status,
  features,
  connectHref,
  onDisconnect,
  disconnecting,
}: {
  platform: string;
  icon: any;
  iconColor: string;
  label: string;
  status: PlatformStatus;
  features: string[];
  connectHref: string;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  return (
    <div className="card flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon size={20} style={{ color: iconColor }} />
          <span className="font-semibold text-[0.9375rem] text-foreground">{label}</span>
        </div>
        {status.connected ? (
          <span className="badge badge-success">
            <CheckCircle size={11} /> Connected
          </span>
        ) : (
          <span className="badge badge-muted">
            Not connected
          </span>
        )}
      </div>

      {status.connected ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            {status.profilePicture && (
              <img src={status.profilePicture} alt="" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)" }} />
            )}
            <div>
              <p className="font-medium text-sm text-foreground">
                {status.channelTitle ?? status.accountName ?? "Account"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock size={11} style={{ color: "var(--muted-foreground)" }} />
                <ExpiryBadge expiresAt={status.expiresAt} platform={platform} />
              </div>
            </div>
          </div>
          <div className="flex gap-2.5">
            {platform !== "youtube" && (
                platform === "facebook" ? (
                  <button onClick={() => {
                    const fbScopes = [
                      'instagram_basic',
                      'instagram_content_publish',
                      'pages_show_list',
                      'pages_read_engagement',
                      'pages_manage_posts',
                      'business_management',
                      'public_profile'
                    ].join(',');
                    const redirectUri = `${window.location.origin}/facebook-callback`;
                    const fbUrl = `https://www.facebook.com/dialog/oauth?client_id=1426197448778804&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(fbScopes)}&auth_type=rerequest&response_type=code`;
                    window.location.href = fbUrl;
                  }} className="btn-secondary text-[0.8125rem]">
                    Reconnect
                  </button>
                ) : (
                  <a href={connectHref} className="btn-secondary text-[0.8125rem]">
                    Reconnect
                  </a>
                )
            )}
            <button
              onClick={onDisconnect}
              disabled={disconnecting}
              className="btn-danger text-[0.8125rem]"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="list-none p-0 m-0 flex flex-col gap-1.5">
            {features.map(f => (
              <li key={f} className="text-[0.8125rem] text-muted-foreground">
                {f}
              </li>
            ))}
          </ul>
          {platform === "youtube" ? (
              <a href="/api/auth/youtube" className="btn-primary self-start">
                Connect YouTube
                <ExternalLink size={13} />
              </a>
          ) : platform === "facebook" ? (
              <button
                onClick={() => {
                  const fbScopes = [
                    'instagram_basic',
                    'instagram_content_publish',
                    'pages_show_list',
                    'pages_read_engagement',
                    'pages_manage_posts',
                    'business_management',
                    'public_profile'
                  ].join(',');
                  const redirectUri = `${window.location.origin}/facebook-callback`;
                  const fbUrl = `https://www.facebook.com/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '1426197448778804'}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(fbScopes)}&auth_type=rerequest&response_type=code`;
                  window.location.href = fbUrl;
                }}
                className="btn-primary self-start">
                Connect Instagram
                <ExternalLink size={13} />
              </button>
          ) : (
              <a href={connectHref} className="btn-primary self-start">
                Connect {label}
                <ExternalLink size={13} />
              </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connections | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<"linkedin" | "youtube" | "facebook" | null>(null);
  const [igPages, setIgPages] = useState<any[] | null>(null);
  const [fbPages, setFbPages] = useState<any[] | null>(null);
  const [pagesDebug, setPagesDebug] = useState<any>(null);
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);
  const [linkedinPages, setLinkedinPages] = useState<any[] | null>(null);
  const [loadingLiPages, setLoadingLiPages] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/settings/connections")
      .then(r => r.json())
      .then(d => {
        if (d && d.linkedin && d.youtube && d.facebook) {
          setConnections(d);
        } else if (d) {
          setConnections({
            linkedin: d.linkedin || { connected: false },
            youtube: d.youtube || { connected: false },
            facebook: d.facebook || { connected: false },
          });
        } else {
          setConnections({
            linkedin: { connected: false },
            youtube: { connected: false },
            facebook: { connected: false },
          });
        }
      })
      .catch(() => {
        setConnections({
          linkedin: { connected: false },
          youtube: { connected: false },
          facebook: { connected: false },
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const captureFacebookToken = async () => {
       const { createClient } = await import("@/lib/supabase-browser");
       const supabase = createClient();
       const { data: { session } } = await supabase.auth.getSession();

       const params = new URLSearchParams(window.location.search);
       const isConnectingFacebook = params.get("connected") === "facebook";

       if (session?.provider_token && session?.user?.app_metadata?.provider === "facebook" && isConnectingFacebook) {
          await fetch('/api/settings/connections/facebook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  accessToken: session.provider_token,
                  accountName: session.user.user_metadata?.name || session.user.email,
                  profilePicture: session.user.user_metadata?.avatar_url
              })
          });
       }

       load();
       if (params.get("connected")) {
         window.history.replaceState({}, "", "/settings/connections");
       }
    };

    captureFacebookToken();
  }, [load]);

  useEffect(() => {
    if (connections?.facebook?.connected) {
      setLoadingPages(true);
      setIgPages(null);
      setFbPages(null);
      setPagesDebug(null);
      setPagesError(null);
      fetch('/api/social/instagram/pages')
        .then(res => res.json())
        .then(data => {
            if (data.pages) setIgPages(data.pages);
            if (data.fbPages) setFbPages(data.fbPages);
            if (data.debug) setPagesDebug(data.debug);
            if (data.error) setPagesError(data.details || data.hint || data.error);
        })
        .catch(err => setPagesError(err.message))
        .finally(() => setLoadingPages(false));
    }
  }, [connections?.facebook?.connected]);

  useEffect(() => {
    if (connections?.linkedin?.connected) {
      setLoadingLiPages(true);
      fetch('/api/social/linkedin/pages')
        .then(res => res.json())
        .then(data => {
            if (data.pages) setLinkedinPages(data.pages);
        })
        .finally(() => setLoadingLiPages(false));
    }
  }, [connections?.linkedin?.connected]);

  const handleDisconnect = async (platform: "linkedin" | "youtube" | "facebook") => {
    if (!confirm(`Disconnect ${platform}? You can reconnect anytime.`)) return;
    setDisconnecting(platform);
    await fetch(`/api/settings/connections?platform=${platform}`, { method: "DELETE" });
    setDisconnecting(null);
    if (platform === "facebook") {
        setIgPages(null);
        setFbPages(null);
        setPagesDebug(null);
        setPagesError(null);
    }
    if (platform === "linkedin") {
        setLinkedinPages(null);
    }
    load();
  };

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map(i => (
            <div key={i} className="card bg-muted animate-pulse-soft" style={{ height: 200 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!connections) return null;

  return (
    <div className="max-w-[720px] mx-auto animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <PlatformCard
          platform="linkedin"
          icon={Linkedin}
          iconColor="#0A66C2"
          label="LinkedIn"
          status={connections.linkedin}
          features={["Post text and images", "Auto-publish on schedule", "Analytics sync every 4 hours"]}
          connectHref="/api/auth/linkedin"
          onDisconnect={() => handleDisconnect("linkedin")}
          disconnecting={disconnecting === "linkedin"}
        />
        <PlatformCard
          platform="youtube"
          icon={Youtube}
          iconColor="#FF0000"
          label="YouTube"
          status={connections.youtube}
          features={["Upload AI-generated videos", "AI-written titles and descriptions", "Auto SEO tags"]}
          connectHref="/api/auth/youtube"
          onDisconnect={() => handleDisconnect("youtube")}
          disconnecting={disconnecting === "youtube"}
        />
        <PlatformCard
          platform="facebook"
          icon={Instagram}
          iconColor="#E1306C"
          label="Instagram via Facebook"
          status={connections.facebook}
          features={["Post to multiple IG accounts", "Auto-publish Reels", "Fetch connected pages"]}
          connectHref="#"
          onDisconnect={() => handleDisconnect("facebook")}
          disconnecting={disconnecting === "facebook"}
        />
      </div>

      {connections.facebook.connected && (
          <div className="mb-6 flex flex-col gap-4">

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Facebook size={18} style={{ color: "#1877F2" }} />
                <h3 className="text-[0.9375rem] font-semibold text-foreground">Your Facebook Pages</h3>
              </div>

              {loadingPages ? (
                <div className="text-[0.8125rem] text-muted-foreground">Scanning Facebook for your Pages...</div>
              ) : pagesError ? (
                <div className="text-[0.8125rem] px-3 py-3 rounded-md" style={{ background: "var(--rose-bg)", color: "var(--rose-ink)" }}>
                  Error: {pagesError}<br />
                  <span style={{ color: "var(--muted-foreground)" }}>Try clicking Reconnect above with updated permissions.</span>
                </div>
              ) : fbPages && fbPages.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {fbPages.map(page => (
                    <div key={page.id} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-muted">
                      <div className="text-sm font-medium text-foreground">{page.name}</div>
                      {page.hasInstagram ? (
                        <span className="badge badge-success">Instagram linked</span>
                      ) : (
                        <span className="badge badge-muted">No Instagram linked</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[0.8125rem] px-3 py-3 rounded-md leading-relaxed" style={{ background: "var(--rose-bg)", color: "var(--rose-ink)" }}>
                  No Facebook Pages found for your account.<br />
                  <span style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                    You need to be an Admin of a Facebook Page to use Instagram publishing.
                    <br />1. Go to <strong>facebook.com/pages/create</strong> to create one
                    <br />2. Link your Instagram Professional account to that Page
                    <br />3. Click <strong>Reconnect</strong> above
                  </span>
                </div>
              )}

              {pagesDebug && (
                <details className="mt-3">
                  <summary className="text-xs font-medium cursor-pointer" style={{ color: "var(--muted-foreground)" }}>Connection details</summary>
                  <pre className="mt-2 px-3 py-2.5 rounded-md overflow-x-auto text-[0.6875rem]" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{JSON.stringify(pagesDebug, null, 2)}</pre>
                </details>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Instagram size={18} style={{ color: "#E1306C" }} />
                <h3 className="text-[0.9375rem] font-semibold text-foreground">Your Connected Instagram Pages</h3>
              </div>

              {loadingPages ? (
                <div className="text-[0.8125rem] text-muted-foreground">Scanning Meta Graph for linked Instagram accounts...</div>
              ) : igPages && igPages.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {igPages.map(page => (
                    <div key={page.id} className="flex items-center justify-between p-3 rounded-md bg-muted">
                      <div className="flex items-center gap-3">
                        {page.profilePicture ? (
                          <img src={page.profilePicture} alt={page.username} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border)" }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Instagram size={18} color="white" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-foreground">@{page.username || page.fbPageName}</div>
                          <div className="text-xs text-muted-foreground">Via Page: {page.fbPageName}</div>
                          {page.followersCount && <div className="text-xs text-muted-foreground">{page.followersCount.toLocaleString()} followers</div>}
                        </div>
                      </div>
                      <span className="badge badge-success">Ready to automate</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-3 rounded-md" style={{ background: "var(--butter-bg)", border: "1px solid var(--butter)" }}>
                  <div className="text-[0.8125rem] font-medium mb-2" style={{ color: "var(--butter-ink)" }}>No Instagram accounts found</div>
                  <div className="text-[0.8125rem] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {fbPages && fbPages.length > 0 ? (
                      <>Your Facebook Pages were found but none have an Instagram account linked.<br />
                      <strong>To fix:</strong> Go to your Facebook Page → Settings → Linked Accounts → Link Instagram. Make sure Instagram is set to a <strong>Professional (Business or Creator)</strong> account.</>
                    ) : (
                      <>Connect a Facebook Page first, then link your Instagram Professional account to it.</>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
      )}

      {connections.linkedin.connected && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
               <Linkedin size={18} style={{ color: "#0A66C2" }} />
               <h3 className="text-[0.9375rem] font-semibold text-foreground">Your Connected LinkedIn Pages</h3>
            </div>

            {loadingLiPages ? (
                 <div className="text-[0.8125rem] text-muted-foreground">Scanning LinkedIn for managed company pages...</div>
            ) : linkedinPages && linkedinPages.length > 0 ? (
                 <div className="flex flex-col gap-3">
                    {linkedinPages.map(page => (
                        <div key={page.id} className="flex items-center justify-between p-3 rounded-md bg-muted">
                             <div className="flex items-center gap-3">
                                 <div className="flex items-center justify-center border border-border rounded-md bg-card" style={{ width: 32, height: 32 }}>
                                     <Linkedin size={18} style={{ color: "#0A66C2" }} />
                                 </div>
                                 <div>
                                     <div className="text-sm font-medium text-foreground">{page.name}</div>
                                     <div className="text-xs text-muted-foreground">ID: {page.id}</div>
                                 </div>
                             </div>
                             <span className="badge badge-neutral">Company page</span>
                        </div>
                    ))}
                 </div>
            ) : (
                 <div className="text-[0.8125rem] text-muted-foreground">No LinkedIn Company Pages found. You must be an admin of a LinkedIn Page.</div>
            )}
          </div>
      )}

      <div className="mb-6">
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <KeyRound size={18} className="text-muted-foreground" />
              <span className="font-semibold text-[0.9375rem] text-foreground">OpenAI API Key</span>
            </div>
            <span className="badge badge-success">
              <CheckCircle size={11} /> Server managed
            </span>
          </div>
          <p className="text-[0.8125rem] text-muted-foreground leading-relaxed">
            The AI key is configured only on the server through environment variables. It is never displayed or saved in browser storage. If AI generation is unavailable, ask the workspace administrator to configure <code>OPENAI_API_KEY</code> and redeploy.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-lg border border-border" style={{ background: "var(--muted)" }}>
        <AlertCircle size={14} style={{ color: "var(--muted-foreground)", marginTop: 2, flexShrink: 0 }} />
        <p className="text-[0.8125rem] text-muted-foreground leading-relaxed">
          Credentials are stored securely per account and are only used to post on your behalf. We never store your password.
        </p>
      </div>
    </div>
  );
}
