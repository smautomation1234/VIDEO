import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUserId } from "@/lib/social-tokens";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/auto-dm/subscribe
 * Subscribes a Facebook Page to Instagram comment webhooks.
 * This must be called once per Instagram account when the user connects.
 */
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { ig_account_id, ig_account_username, fb_page_id, page_access_token } = await req.json();

  if (!ig_account_id || !fb_page_id || !page_access_token) {
    return NextResponse.json(
      { error: "ig_account_id, fb_page_id, and page_access_token are required" },
      { status: 400 }
    );
  }

  // Step 1: Subscribe the Facebook Page to comment webhooks
  const subscribeRes = await fetch(
    `https://graph.facebook.com/v21.0/${fb_page_id}/subscribed_apps`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscribed_fields: "comments",
        access_token: page_access_token,
      }),
    }
  );
  const subscribeData = await subscribeRes.json();

  if (subscribeData.error) {
    return NextResponse.json(
      { error: "subscription_failed", details: subscribeData.error.message },
      { status: 400 }
    );
  }

  // Step 2: Save subscription record
  await db()
    .from("ig_webhook_subscriptions")
    .upsert(
      {
        user_id: userId,
        ig_account_id,
        ig_account_username,
        fb_page_id,
        is_active: true,
        subscribed_at: new Date().toISOString(),
      },
      { onConflict: "ig_account_id" }
    );

  return NextResponse.json({ success: true, subscribed: subscribeData.success });
}

/**
 * GET /api/auto-dm/subscribe
 * Returns which IG accounts are currently subscribed to webhooks.
 */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data } = await db()
    .from("ig_webhook_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  return NextResponse.json({ subscriptions: data || [] });
}
