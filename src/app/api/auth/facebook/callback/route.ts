import { NextResponse } from "next/server";
import { getSessionUserId, saveSocialToken } from "@/lib/social-tokens";

export const dynamic = "force-dynamic";

// Helper: read a cookie from the raw Request header
function getCookieFromRequest(req: Request, name: string): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.split(";").find(c => c.trim().startsWith(`${name}=`));
  return match ? match.trim().split("=")[1] : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = req.headers.get("host") || new URL(req.url).host;
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  let baseUrl = `${protocol}://${host}`;
  if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

  if (error || !code) {
    console.error("Facebook OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/settings/connections?fb_error=access_denied`);
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID || "1426197448778804";
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

  try {
    // 1. Exchange code for a short-lived user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData.error);
      return NextResponse.redirect(`${baseUrl}/settings/connections?fb_error=token_exchange_failed`);
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange for a long-lived token (60 days)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`
    );
    const longTokenData = await longTokenRes.json();
    const finalToken = longTokenData.access_token || shortLivedToken;
    const expiresIn = longTokenData.expires_in || 60 * 24 * 3600; // default 60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Fetch user profile name and picture
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=name,picture.type(large)&access_token=${finalToken}`
    );
    const profileData = await profileRes.json();

    // 4. Try to get the Supabase user ID and save directly
    const userId = await getSessionUserId();

    if (userId) {
      // Supabase session exists — save directly to DB
      await saveSocialToken(userId, "facebook", {
        accessToken: finalToken,
        expiresAt,
        accountName: profileData.name || "Facebook User",
        profilePicture: profileData.picture?.data?.url,
      });
      return NextResponse.redirect(`${baseUrl}/settings/connections?connected=facebook`);
    }

    // 5. No Supabase session (Quick Access user) — read quick_access cookie from request headers
    const isQuickAccess = getCookieFromRequest(req, "quick_access") === "true";

    if (isQuickAccess) {
      const payload = JSON.stringify({
        accessToken: finalToken,
        expiresAt,
        accountName: profileData.name || "Facebook User",
        profilePicture: profileData.picture?.data?.url,
      });

      const response = NextResponse.redirect(`${baseUrl}/settings/connections?connected=facebook`);
      // Store for 5 minutes — just long enough for the page to pick it up
      response.cookies.set("fb_pending_token", payload, {
        httpOnly: false, // must be readable by client JS
        maxAge: 300,
        path: "/",
        sameSite: "lax",
      });
      return response;
    }

    // Not quick-access and no Supabase session — redirect to login
      return NextResponse.redirect(`${baseUrl}/settings/connections`);

  } catch (err: any) {
    console.error("Facebook callback error:", err);
    return NextResponse.redirect(`${baseUrl}/settings/connections?fb_error=internal`);
  }
}
