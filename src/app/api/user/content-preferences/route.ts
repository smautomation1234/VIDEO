import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUserId } from "@/lib/social-tokens";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: fetch user preferences
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { data, error } = await db()
      .from("users")
      .select("preferred_categories, custom_sources")
      .eq("id", userId)
      .single();

    if (error) return NextResponse.json({ preferred_categories: [], custom_sources: [] });

    return NextResponse.json({
      preferred_categories: data?.preferred_categories ?? [],
      custom_sources: data?.custom_sources ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: save user preferences
export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const { preferred_categories, custom_sources } = await req.json();

    const { error } = await db()
      .from("users")
      .update({
        preferred_categories: preferred_categories ?? [],
        custom_sources: custom_sources ?? [],
      })
      .eq("id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
