import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/social-tokens";
import { getChannelVideos } from "@/lib/youtube-live";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/youtube/videos — list videos for current user
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data: generatedVideos } = await serviceClient()
    .from("youtube_videos")
    .select("id, title, status, youtube_video_id, error, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Return the actual connected channel uploads as well as videos created by this app.
  // The YouTube API is authoritative; the database rows are retained for generation state.
  try {
    const liveVideos = await getChannelVideos(userId, 50);
    const generated = generatedVideos ?? [];
    const generatedIds = new Set(generated.map(video => video.youtube_video_id).filter(Boolean));
    const live = liveVideos
      .filter(video => !generatedIds.has(video.id))
      .map(video => ({
        id: `youtube:${video.id}`,
        title: video.title,
        status: "published",
        youtube_video_id: video.id,
        error: null,
        created_at: video.publishedAt,
      }));
    return NextResponse.json({ videos: [...generated, ...live] });
  } catch (error) {
    return NextResponse.json({ videos: generatedVideos ?? [], liveDataError: String(error) });
  }
}
