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

  // Get the stored Facebook/Instagram token
  const { data: tokenRows } = await db
    .from("social_accounts")
    .select("access_token_encrypted, status, platform")
    .eq("user_id", userId)
    .in("platform", ["instagram", "facebook"]);

  const tokenRow =
    tokenRows?.find((r) => r.status === "active") ??
    tokenRows?.[0] ??
    null;

  if (!tokenRow?.access_token_encrypted) {
    return NextResponse.json({ error: "facebook_not_connected", pages: [], fbPages: [] }, { status: 400 });
  }

  if (tokenRow.status !== "active") {
    return NextResponse.json({ error: "facebook_token_revoked", pages: [], fbPages: [] }, { status: 400 });
  }

  const token = tokenRow.access_token_encrypted;

  try {
    // Step 1: Verify token
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`);
    const meData = await meRes.json();

    if (meData.error) {
      return NextResponse.json({ error: "token_invalid", details: meData.error.message, pages: [], fbPages: [] }, { status: 400 });
    }

    const allPagesMap = new Map();

    // Step 2: Fetch standard pages via me/accounts
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}&access_token=${token}`
    );
    const pagesData = await pagesRes.json();
    
    if (pagesData.data) {
      for (const p of pagesData.data) {
        allPagesMap.set(p.id, p);
      }
    }

    // Step 3: Fetch pages managed via Meta Business Suite (businesses)
    const bizRes = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?fields=owned_pages{id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count},connected_instagram_account{id,username,name,profile_picture_url,followers_count}},client_pages{id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count},connected_instagram_account{id,username,name,profile_picture_url,followers_count}}&access_token=${token}`
    );
    const bizData = await bizRes.json();

    if (bizData.data) {
      for (const biz of bizData.data) {
        const owned = biz.owned_pages?.data || [];
        const client = biz.client_pages?.data || [];
        for (const p of [...owned, ...client]) {
          if (!allPagesMap.has(p.id)) {
            allPagesMap.set(p.id, p);
          } else {
            // merge missing fields if any
            const existing = allPagesMap.get(p.id);
            if (!existing.instagram_business_account && p.instagram_business_account) existing.instagram_business_account = p.instagram_business_account;
            if (!existing.connected_instagram_account && p.connected_instagram_account) existing.connected_instagram_account = p.connected_instagram_account;
          }
        }
      }
    }

    const fbPagesList = Array.from(allPagesMap.values());
    const instagramPages: any[] = [];
    const rawFbPages: any[] = [];

    for (const page of fbPagesList) {
      const ig = page.instagram_business_account || page.connected_instagram_account;
      
      rawFbPages.push({
        id: page.id,
        name: page.name,
        hasInstagram: !!ig,
      });

      if (ig) {
        // If fields not fully returned, fetch them separately using the PAGE token or user token
        if (!ig.username && ig.id) {
          const pageToken = page.access_token || token;
          const igRes = await fetch(
            `https://graph.facebook.com/v21.0/${ig.id}?fields=id,username,name,profile_picture_url,followers_count&access_token=${pageToken}`
          );
          const igData = await igRes.json();
          if (!igData.error) {
            instagramPages.push({
              id: ig.id,
              fbPageId: page.id,
              fbPageName: page.name,
              username: igData.username || igData.name,
              profilePicture: igData.profile_picture_url || null,
              followersCount: igData.followers_count || null,
            });
          }
        } else {
          instagramPages.push({
            id: ig.id,
            fbPageId: page.id,
            fbPageName: page.name,
            username: ig.username || ig.name,
            profilePicture: ig.profile_picture_url || null,
            followersCount: ig.followers_count || null,
          });
        }
      }
    }

    return NextResponse.json({
      pages: instagramPages,
      fbPages: rawFbPages,
      debug: {
        facebookUserId: meData.id,
        facebookName: meData.name,
        totalFbPagesRaw: pagesData.data?.length || 0,
        totalFbPagesViaBiz: fbPagesList.length,
        totalIgAccounts: instagramPages.length,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: "internal_error", details: error.message, pages: [], fbPages: [] }, { status: 500 });
  }
}
