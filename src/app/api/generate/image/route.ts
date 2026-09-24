import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/social-tokens";

// POST /api/generate/image - AI Image Generation (Vertex AI Imagen)
export async function POST(request: Request) {
    try {
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
        }

        await request.json();
        return NextResponse.json({
            success: false,
            error: "This legacy image provider is not configured. Use the AI Media image workflow or add an approved image provider.",
        }, { status: 501 });
    } catch {
        return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }
}
