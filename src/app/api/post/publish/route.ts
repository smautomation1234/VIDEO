import { NextResponse } from "next/server";

// POST /api/post/publish - Publish to social platforms
export async function POST(request: Request) {
    try {
        const { postId, platform } = await request.json();
        if (!postId || !platform) return NextResponse.json({ error: "postId and platform are required" }, { status: 400 });
        return NextResponse.json({
            success: false,
            error: "Direct publishing is not configured for this platform. Export the content package or connect an approved platform integration.",
            mode: "export_required",
        }, { status: 501 });
    } catch {
        return NextResponse.json({ error: "Publishing failed" }, { status: 500 });
    }
}
