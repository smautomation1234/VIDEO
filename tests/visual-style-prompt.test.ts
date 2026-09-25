import assert from "node:assert/strict";
import test from "node:test";
import { materializeFullScript, plannerPrompt } from "../src/lib/planner";
import type { Project } from "../src/lib/types";

function project(style: Project["style"]): Project {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: "00000000-0000-0000-0000-000000000002",
    title: "Split test",
    raw_post: "This is the exact supplied script.",
    target_duration_seconds: 30,
    aspect_ratio: "9:16",
    resolution: "720p",
    style,
    mode: "from_scratch",
    state: "draft",
    prompt_plan: null,
    prompt_approved_at: null,
    created_at: "2026-08-09T00:00:00.000Z",
    updated_at: "2026-08-09T00:00:00.000Z",
  };
}

test("scratch split-wise preset keeps the presenter below and related B-roll above", () => {
  const prompt = plannerPrompt(project("split_wise"));

  assert.match(prompt, /SELECTED VISUAL STYLE: Split-Wise B-Roll Editing/);
  assert.match(prompt, /presenter continuously visible and speaking in the lower 45 percent/);
  assert.match(prompt, /upper 55 percent only for relevant B-roll/);
  assert.match(prompt, /Change only the upper supporting visual/);
  assert.match(prompt, /Do not use any paper effects/);
  assert.doesNotMatch(prompt, /use paper effect editing/);
});

test("scratch paper preset retains its original paper-effect instruction", () => {
  const prompt = plannerPrompt(project("paper_motion"));

  assert.match(prompt, /SELECTED VISUAL STYLE: Paper Effect \+ Motion Graphics/);
  assert.match(prompt, /use paper effect editing/);
  assert.match(prompt, /premium paper-cut editing/);
});

test("planner output replaces a full-script placeholder with the finalized script", () => {
  const fullScript = "Line one. Line two. Line three.";
  const prompt = materializeFullScript(
    "Keep the presenter consistent.\n\n[FULL SCRIPT HERE]\n\nOnly speak line two.",
    fullScript,
  );

  assert.match(prompt, /Line one\. Line two\. Line three\./);
  assert.doesNotMatch(prompt, /FULL SCRIPT HERE/);
});

test("planner output inserts a missing full script after the standard introduction", () => {
  const fullScript = "The complete finalized narration.";
  const prompt = materializeFullScript(
    "this is full script and i am giving you my image also so keep the character consistent and do not change face structure\n\nonly speak this line: \"Hello\"",
    fullScript,
  );

  assert.match(
    prompt,
    /do not change face structure\n\nThe complete finalized narration\.\n\nonly speak this line/,
  );
});
