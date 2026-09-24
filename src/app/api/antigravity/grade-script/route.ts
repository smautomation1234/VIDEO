import { NextResponse } from "next/server";
import { generateWithWebSearch } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { script } = body;

    if (!script) {
      return NextResponse.json({ error: "Script is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Heuristic fallback if no API key
      const words = script.split(" ").length;
      let score = 85;
      if (words > 150) score = 70; // Too long for standard reel
      let gradeStr = score >= 80 ? "A" : "B";
      return NextResponse.json({
        score,
        grade: gradeStr,
        critique: [
          "Include a stronger visual hook in the first 3 seconds.",
          "Good use of formatting, consider placing text on screen for better retention."
        ]
      });
    }

    const aiResult = await generateWithWebSearch({
      system: "You are an expert social media algorithm analyzer. Grade this short-form video script out of 100 on its predicted viral retention. Return ONLY a valid JSON object with: { \"score\": number (0-100), \"grade\": string (\"A\", \"B\", \"C\", or \"F\"), \"critique\": [ array of 2-3 short actionable sentences to improve retention ] }",
      prompt: `Script:\n${script}`
    });

    const result = JSON.parse(aiResult.text || "{}");
    
    return NextResponse.json({
      score: result.score || 85,
      grade: result.grade || "A",
      critique: result.critique || []
    });

  } catch (error: any) {
    console.error("Score Error:", error);
    return NextResponse.json({ error: error.message || "Failed to grade script" }, { status: 500 });
  }
}
