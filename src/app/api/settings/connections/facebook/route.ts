import { NextResponse } from "next/server";
import { getSessionUserId, saveSocialToken } from "@/lib/social-tokens";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.accessToken) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 3600 * 1000 * 24 * 60).toISOString(); // 60 days

  await saveSocialToken(userId, "facebook", {
    accessToken: body.accessToken,
    expiresAt,
    accountName: body.accountName,
    profilePicture: body.profilePicture,
  });

  return NextResponse.json({ success: true });
}
