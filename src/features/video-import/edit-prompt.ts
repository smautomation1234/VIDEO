import type { VisualStyle } from "@/features/project/visual-style";

export interface EditVideoPromptInput {
  aspectRatio: string;
  resolution: string;
  durationSeconds: number;
  style?: VisualStyle;
}

export function buildEditVideoPrompt({
  aspectRatio,
  resolution,
  durationSeconds,
  style = "paper_motion",
}: EditVideoPromptInput): string {
  if (style === "split_wise") {
    return `this is a short part of my recorded video, so keep my character, face, voice, clothing and appearance exactly consistent. Do not change my voice, lip sync, expressions, video pacing or speaking timing. Keep the video exactly how my original video started and exactly how it ended. I want only an edited version of my original video.

use a clean split-screen editing style throughout the complete video.

keep my original presenter video continuously visible in the lower 45 percent of the screen. Do not replace, regenerate, crop out or hide me while I am speaking. Keep my original face, body movement and lip sync exactly connected to my original audio.

use the upper 55 percent of the screen for visually relatable content based only on what I am currently speaking about. Show relevant real-world B-roll, objects, locations, examples, charts, screenshots, clean motion graphics or a suitable close-up reaction shot of my character when it directly supports the spoken point.

change only the upper supporting visual at natural phrase or topic boundaries while keeping the lower presenter continuous. Every upper visual must directly match the exact sentence or idea being spoken at that moment. Do not show random, generic or unrelated B-roll.

keep a clean straight separation between both sections. Add proper subtle sound effects for B-roll changes, motion graphics, emphasis moments and transitions. Keep every sound effect lower than my voice and never disturb the clarity of my original audio.

do not use paper effects, torn-paper transitions, paper textures, tape, scrapbook styling or halftone effects. Do not add subtitles for every word. Do not add like, follow, subscribe or ending call-to-action content because this is not necessarily the final part of my video.

TECHNICAL OUTPUT LOCK: exactly ${durationSeconds} seconds, ${aspectRatio}, ${resolution}

edit the complete supplied video from its exact first frame to its exact last frame using this split-wise B-roll style. Do not add anything before the original beginning or after the original ending.`;
  }
  return `this is a short part of my video that i recorded so keep my character consistent and do not change voice and anything at all , do not change video pacing , keep it same as of mine
also keep the lip sync as it is no matter what , i want you to keep the video exactly how mine started and exactly how mine ended same pacing , same timing , i want only edited version of my video 
although it is not the last part of my video so do not add any like follow thing in between
also do not add subtitles of each word i am saying i dont like that
TECHNICAL OUTPUT LOCK: exactly ${durationSeconds} seconds, ${aspectRatio}, ${resolution}
you have to edit the video as it is from start to end by using paper effect editing , use motion graphics , animations , color coding ,add proper sound effects also and create a video for instagram in full viral format`;
}
