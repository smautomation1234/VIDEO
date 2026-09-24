import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUserId } from "@/lib/social-tokens";

export const dynamic = "force-dynamic";

/**
 * GET /api/auto-dm/page-token?fb_page_id=xxx
 * Returns the Page Access Token for a given Facebook Page ID.
 * Used by the UI to subscribe a page to webhooks.
 */
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fbPageId = searchParams.get("fb_page_id");
  if (!fbPageId) return NextResponse.json({ error: "fb_page_id required" }, { status: 400 });

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the user's Facebook/Instagram OAuth token
  const { data: tokenRows } = await db
    .from("social_accounts")
    .select("access_token_encrypted")
    .eq("user_id", userId)
    .in("platform", ["instagram", "facebook"])
    .eq("status", "active")
    .limit(1);

  const userToken = tokenRows?.[0]?.access_token_encrypted;
  if (!userToken) {
    return NextResponse.json({ error: "instagram_not_connected" }, { status: 400 });
  }

  // Exchange user token for a page access token
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${fbPageId}?fields=access_token&access_token=${userToken}`
  );
  const data = await res.json();

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 400 });
  }

  return NextResponse.json({ page_token: data.access_token || userToken });
}
