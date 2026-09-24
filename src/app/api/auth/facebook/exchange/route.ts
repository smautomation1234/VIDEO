import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getOrCreateUserId(): Promise<string | null> {
  const db = serviceClient();

  const { data: firstUser } = await db
    .from("users")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (firstUser?.id) return firstUser.id;

  try {
    const { data: authList } = await db.auth.admin.listUsers({ perPage: 1 });
    if (authList?.users?.[0]?.id) return authList.users[0].id;
  } catch {}

  try {
    const { data: created } = await db.auth.admin.createUser({
      email: "quick-access@marketing567.local",
      password: Math.random().toString(36) + Math.random().toString(36),
      email_confirm: true,
    });
    if (created?.user?.id) return created.user.id;
  } catch (err) {
    console.error("Failed to create Quick Access user:", err);
  }

  return null;
}

export async function POST(req: Request) {
  const clientId = process.env.FACEBOOK_CLIENT_ID || "1426197448778804";
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

  // Guard: secret missing
  if (!clientSecret) {
    console.error("FACEBOOK_CLIENT_SECRET is not set in environment variables");
    return NextResponse.json(
      {
        error: "config_error",
        details:
          "FACEBOOK_CLIENT_SECRET env var is missing on the server. Add it to Vercel environment variables.",
      },
      { status: 500 }
    );
  }

  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "missing_code" }, { status: 400 });
    }

    const host = req.headers.get("host") || "";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${protocol}://${host}`;
    const redirectUri = `${baseUrl}/facebook-callback`;

    // 1. Exchange code for short-lived token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("FB token exchange failed:", JSON.stringify(tokenData));
      return NextResponse.json(
        {
          error: "token_exchange_failed",
          fb_error_code: tokenData.error?.code,
          fb_error_type: tokenData.error?.type,
          details: tokenData.error?.message || "No access_token returned",
          redirect_uri_used: redirectUri,
        },
        { status: 400 }
      );
    }

    // 2. Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json();
    const finalToken = longData.access_token || tokenData.access_token;
    const expiresIn = longData.expires_in || 60 * 24 * 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Get Facebook user profile
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=name,picture.type(large)&access_token=${finalToken}`
    );
    const profileData = await profileRes.json();

    // 4. Get or create user ID
    const userId = await getOrCreateUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "could_not_resolve_user" },
        { status: 500 }
      );
    }

    const db = serviceClient();

    // 5. Ensure user row exists
    await db.from("users").upsert(
      {
        id: userId,
        email: "quick-access@marketing567.local",
        full_name: profileData.name || "Admin",
      },
      { onConflict: "id" }
    );

    // 6. Save Facebook token
    const { error: saveError } = await db.from("social_accounts").upsert(
      {
        user_id: userId,
        platform: "instagram",
        access_token_encrypted: finalToken,
        expires_at: expiresAt,
        platform_account_name: profileData.name || "Facebook User",
        profile_picture: profileData.picture?.data?.url ?? null,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" }
    );

    if (saveError) {
      console.error("Save token error:", saveError);
      return NextResponse.json(
        { error: "db_error", details: saveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Facebook exchange unhandled error:", err);
    return NextResponse.json(
      { error: "internal", details: err.message },
      { status: 500 }
    );
  }
}
