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

// GET — list all rules + today's DM count
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  const { data: rules, error } = await db()
    .from("ig_auto_dm_rules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add today's send count to each rule
  const enriched = await Promise.all(
    (rules || []).map(async (rule: any) => {
      const { count } = await db()
        .from("ig_auto_dm_log")
        .select("id", { count: "exact", head: true })
        .eq("rule_id", rule.id)
        .gte("sent_at", `${today}T00:00:00Z`);
      return { ...rule, today_sent: count ?? 0 };
    })
  );

  return NextResponse.json({ rules: enriched });
}

// POST — create a new rule
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = await req.json();
  const { rule_name, ig_account_id, ig_account_username, trigger_type, keywords, target_post_id, dm_message, daily_limit } = body;

  if (!ig_account_id || !dm_message) {
    return NextResponse.json({ error: "ig_account_id and dm_message are required" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("ig_auto_dm_rules")
    .insert({
      user_id: userId,
      rule_name: rule_name || "My Rule",
      ig_account_id,
      ig_account_username,
      trigger_type: trigger_type || "any_comment",
      keywords: keywords || [],
      target_post_id: target_post_id || null,
      dm_message,
      daily_limit: daily_limit || 50,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rule: data });
}
