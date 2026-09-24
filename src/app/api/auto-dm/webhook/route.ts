import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Meta sends a GET request to verify the webhook endpoint
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // The verify token must match what you entered in the Meta App Dashboard
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "auto_dm_verify_2024";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Instagram webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Meta sends POST requests with real-time comment events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Only process Instagram comment changes
    if (body.object !== "instagram") {
      return NextResponse.json({ status: "ignored" });
    }

    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    for (const entry of body.entry || []) {
      const igAccountId = entry.id;

      for (const change of entry.changes || []) {
        // We only care about comments
        if (change.field !== "comments") continue;

        const val = change.value;
        const commentId = val.id;
        const commentText: string = val.text || "";
        const commenterId = val.from?.id;
        const commenterUsername = val.from?.username;
        const mediaId = val.media?.id || val.parent_id;

        if (!commenterId || !mediaId || !commentId) continue;

        // Find all active rules for this IG account
        const { data: rules } = await db
          .from("ig_auto_dm_rules")
          .select("*")
          .eq("ig_account_id", igAccountId)
          .eq("is_active", true);

        if (!rules || rules.length === 0) continue;

        for (const rule of rules) {
          // Check post targeting (null = all posts)
          if (rule.target_post_id && rule.target_post_id !== mediaId) continue;

          // Check keyword match if required
          if (rule.trigger_type === "keyword") {
            const keywords: string[] = rule.keywords || [];
            const matches = keywords.some((kw: string) =>
              commentText.toLowerCase().includes(kw.toLowerCase())
            );
            if (!matches) continue;
          }

          // Prevent duplicate DMs (one per commenter per post per rule)
          const { data: existing } = await db
            .from("ig_auto_dm_log")
            .select("id")
            .eq("rule_id", rule.id)
            .eq("commenter_id", commenterId)
            .eq("post_id", mediaId)
            .single();

          if (existing) {
            console.log(`⏭ Skipping duplicate DM to ${commenterUsername} for rule ${rule.id}`);
            continue;
          }

          // Check daily limit
          const today = new Date().toISOString().split("T")[0];
          const { count: todayCount } = await db
            .from("ig_auto_dm_log")
            .select("id", { count: "exact", head: true })
            .eq("rule_id", rule.id)
            .gte("sent_at", `${today}T00:00:00Z`);

          if ((todayCount ?? 0) >= (rule.daily_limit ?? 50)) {
            console.log(`⚠️ Daily limit reached for rule ${rule.id}`);
            continue;
          }

          // Get the Instagram page token to send DMs
          const { data: socialAccount } = await db
            .from("social_accounts")
            .select("access_token_encrypted, metadata")
            .eq("user_id", rule.user_id)
            .in("platform", ["instagram", "facebook"])
            .eq("status", "active")
            .single();

          if (!socialAccount?.access_token_encrypted) {
            console.error(`❌ No active token for user ${rule.user_id}`);
            continue;
          }

          const userToken = socialAccount.access_token_encrypted;
          // Get the page access token for this specific IG account
          let pageToken = userToken;
          const metadata = socialAccount.metadata as any;
          if (metadata?.pages) {
            const pageInfo = metadata.pages.find(
              (p: any) => p.ig_account_id === igAccountId
            );
            if (pageInfo?.page_token) pageToken = pageInfo.page_token;
          }

          // Send the DM via Instagram Graph API
          let dmStatus = "sent";
          let dmError: string | undefined;

          try {
            const dmRes = await fetch(
              `https://graph.facebook.com/v21.0/${igAccountId}/messages`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  recipient: { id: commenterId },
                  message: { text: rule.dm_message },
                  access_token: pageToken,
                }),
              }
            );
            const dmData = await dmRes.json();
            if (dmData.error) {
              dmStatus = "failed";
              dmError = dmData.error.message;
              console.error(`❌ DM failed to ${commenterUsername}:`, dmData.error);
            } else {
              console.log(`✅ Auto-DM sent to @${commenterUsername}`);
            }
          } catch (err: any) {
            dmStatus = "failed";
            dmError = err.message;
          }

          // Log the DM attempt
          await db.from("ig_auto_dm_log").insert({
            rule_id: rule.id,
            user_id: rule.user_id,
            commenter_id: commenterId,
            commenter_username: commenterUsername,
            post_id: mediaId,
            comment_id: commentId,
            status: dmStatus,
            error: dmError,
          });

          // Increment total_sent counter
          if (dmStatus === "sent") {
            await db
              .from("ig_auto_dm_rules")
              .update({ total_sent: (rule.total_sent || 0) + 1 })
              .eq("id", rule.id);
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
