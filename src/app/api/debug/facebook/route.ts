import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/social-tokens";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tokenRows } = await db
    .from("social_accounts")
    .select("access_token_encrypted, status, platform")
    .eq("user_id", userId)
    .in("platform", ["instagram", "facebook"]);

  const tokenRow = tokenRows?.find((r) => r.status === "active") ?? tokenRows?.[0] ?? null;
  if (!tokenRow?.access_token_encrypted) {
    return NextResponse.json({ error: "no_token_found" });
  }

  const userToken = tokenRow.access_token_encrypted;

  // 1. /me basic info
  const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${userToken}`);
  const meData = await meRes.json();

  // 2. Get user's businesses
  const bizRes = await fetch(`https://graph.facebook.com/v21.0/me/businesses?fields=id,name&access_token=${userToken}`);
  const bizData = await bizRes.json();

  // 3. For each business, get instagram_accounts
  const igByBusiness: any[] = [];
  for (const biz of bizData?.data || []) {
    const igRes = await fetch(`https://graph.facebook.com/v21.0/${biz.id}/instagram_accounts?fields=id,username,name,profile_picture_url,followers_count&access_token=${userToken}`);
    const igData = await igRes.json();
    igByBusiness.push({ businessId: biz.id, businessName: biz.name, instagram_accounts: igData });
  }

  // 4. Also try owned_pages for each business
  const pagesByBusiness: any[] = [];
  for (const biz of bizData?.data || []) {
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/${biz.id}/owned_pages?fields=id,name,instagram_business_account{id,username},connected_instagram_account{id,username}&access_token=${userToken}`);
    const pagesData = await pagesRes.json();
    pagesByBusiness.push({ businessId: biz.id, businessName: biz.name, pages: pagesData });
  }

  // 5. Permissions check
  const permRes = await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${userToken}`);
  const permData = await permRes.json();

  return NextResponse.json({
    me: meData,
    businesses: bizData,
    instagram_via_business: igByBusiness,
    pages_via_business: pagesByBusiness,
    granted_permissions: permData?.data?.filter((p: any) => p.status === "granted").map((p: any) => p.permission),
    has_business_management: permData?.data?.some((p: any) => p.permission === "business_management" && p.status === "granted"),
  });
}
