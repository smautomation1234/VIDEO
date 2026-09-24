import { NextRequest, NextResponse } from "next/server";
import { runVisionChat } from "@/lib/ai";

const STYLE_IDS = [
    'viral-top-box', 'viral-mid-stack', 'cinematic-split', 'elegant-minimal', 'elegant-serif',
    'elegant-quote', 'elegant-chat', 'elegant-paper', 'aesthetic-polaroid', 'aesthetic-definition',
    'aesthetic-envelope', 'aesthetic-journal', 'aesthetic-brush', 'aesthetic-shadow',
    'aesthetic-triple', 'aesthetic-vlog', 'aesthetic-handwritten', 'aesthetic-neon',
    'aesthetic-glass', 'aesthetic-vintage', 'aesthetic-magazine', 'corporate-minimal',
    'gradient-holographic', 'luxury-black', 'news-alert', 'neon-cyber'
];

const FONT_IDS = [
    "'Inter', sans-serif",
    "'Playfair Display', serif",
    "'Impact', 'Anton', sans-serif",
    "'Courier New', Courier, monospace",
    "'Caveat', 'Cedarville Cursive', cursive",
    "'Helvetica Neue', Helvetica, 'Inter', sans-serif",
    "'Oswald', sans-serif",
    "'Space Mono', monospace",
    "'Pacifico', cursive"
];

export async function POST(req: NextRequest) {
    try {
        const { imageBase64, mimeType, openAiKey, topic } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "No image provided." }, { status: 400 });
        }

        const apiKey = openAiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API Key is missing." }, { status: 400 });
        }

        const systemPrompt = `You are an expert visual designer and Instagram Reel style analyst.
Your job is to deeply analyze a reference image or video frame and extract its visual DNA — then map it to a perfect reel template configuration.

Available template IDs: ${STYLE_IDS.join(', ')}

Available font IDs: ${FONT_IDS.map(f => `"${f}"`).join(', ')}

Style mapping guide:
- viral-top-box / viral-mid-stack → Bold, energetic, dark backgrounds, uppercase impact text, red/pink accents
- cinematic-split → Film/movie aesthetic, gold accents, dark moody backgrounds
- elegant-minimal → Clean, minimal, sophisticated, dark with white text
- elegant-serif → Luxury, italic, editorial, warm tones
- elegant-quote → White card on dark, testimonial/quote style
- elegant-chat → Conversational, messaging UI feel
- elegant-paper → Handwritten/journal, paper texture, typewriter font
- aesthetic-polaroid → Collage, multiple images, vintage photo feel
- aesthetic-definition → Dictionary/educational card, cream background
- aesthetic-envelope → Luxury fashion, envelope reveal, minimalist
- aesthetic-journal → Scrapbook, lined paper, warm organic
- aesthetic-brush → Painted/artistic, mixed media
- aesthetic-shadow → Dark cinematic, shadow play
- aesthetic-triple → Three-panel bright, editorial
- aesthetic-vlog → Dark filmmaker/creator, minimal overlay
- aesthetic-handwritten → Cursive/personal, intimate feel
- aesthetic-neon → Cyberpunk, dark with cyan/blue glow
- aesthetic-glass → Glassmorphism, purple tones, dark
- aesthetic-vintage → Film grain, sepia/warm, retro
- aesthetic-magazine → Bold editorial, red accents, white bg
- corporate-minimal → Clean professional, blue accents, white
- gradient-holographic → Vibrant gradient, colorful, Gen-Z
- luxury-black → Pure luxury, gold text, ultra dark
- news-alert → Breaking news, red urgency, bold
- neon-cyber → Cyberpunk 2.0, magenta/cyan, dark
`;

        const userPrompt = `Analyze this reference image/video frame and extract the following:

1. The DOMINANT visual mood and aesthetic
2. The color palette (primary bg color hex, secondary bg color hex, dominant accent/highlight color hex, text color hex)  
3. The typography feel (bold/light, serif/sans/script/mono)
4. The overall layout style and vibe
5. Match it to ONE of the available template IDs

${topic ? `The reel topic will be: "${topic}"\nFactor in the topic when choosing the style.` : ''}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "styleId": "<one of the template IDs above>",
  "fontId": "<one of the font IDs above>",  
  "accentColor": "#hex",
  "bgColor1": "#hex",
  "bgColor2": "#hex",
  "textColor": "#hex",
  "mood": "<2-4 word description of the vibe>",
  "reasoning": "<1-2 sentences explaining why you chose this template>",
  "suggestedTopic": "<an improved or adapted version of the topic to match the style vibe>"
}`;

        const aiResult = await runVisionChat({
            system: systemPrompt,
            apiKey,
            maxOutputTokens: 600,
            content: [
                {
                    type: "image_url",
                    image_url: {
                        url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                        detail: "high"
                    }
                },
                { type: "text", text: userPrompt }
            ],
        });

        const raw = aiResult.text;

        // Parse JSON, strip any markdown fences
        const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(jsonStr);

        // Validate the styleId
        if (!STYLE_IDS.includes(result.styleId)) {
            result.styleId = 'elegant-minimal'; // safe fallback
        }

        return NextResponse.json({ success: true, ...result });
    } catch (err) {
        console.error("[analyze-style] Error:", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
