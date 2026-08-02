import assert from "node:assert/strict";
import test from "node:test";
import {
  assertLanguagePreserved,
  parseAndValidatePlan,
} from "../src/lib/planner";

function responseWithDurations(durations: Array<4 | 6 | 8 | 10>) {
  return JSON.stringify({
    fact_check_notes: "Verified.",
    source_urls: [],
    dense_fraction: 0,
    word_ceiling: 100,
    actual_word_count: 30,
    full_script: "A complete script.",
    clips: durations.map((duration, index) => ({
      clip_number: index + 1,
      duration_seconds: duration,
      spoken_line: `Line ${index + 1}`,
      prompt:
        "A complete generation prompt that is deliberately longer than eighty characters for schema validation.",
    })),
  });
}

test("planner accepts the exact number of ten-second clips", () => {
  const parsed = parseAndValidatePlan(
    responseWithDurations([10, 10, 10]),
    30
  );
  assert.equal(parsed.clips.length, 3);
  assert.equal(
    parsed.clips.reduce((sum, clip) => sum + clip.duration_seconds, 0),
    30
  );
});

test("planner rejects an overlong Gemini clip map", () => {
  assert.throws(
    () =>
      parseAndValidatePlan(
        responseWithDurations([10, 10, 10, 10, 10]),
        30
      ),
    /exactly 3 are required/
  );
});

test("planner rejects non-ten-second scratch clips", () => {
  assert.throws(
    () => parseAndValidatePlan(responseWithDurations([10, 10, 6]), 30),
    /every clip must be exactly 10 seconds/
  );
});

test("planner accepts a Hinglish script that keeps its language", () => {
  assert.doesNotThrow(() =>
    assertLanguagePreserved(
      "Salary batati hai ki aap har month kitna kama rahe hain. Formula simple hai.",
      "Salary batati hai ki aap har month kitna kama rahe hain. Formula simple hai."
    )
  );
});

test("planner rejects an English translation of a Hinglish script", () => {
  assert.throws(
    () =>
      assertLanguagePreserved(
        "Salary batati hai ki aap har month kitna kama rahe hain. Net worth batati hai ki actually kitna aapka hai.",
        "Your salary tells you how much you earn every month. Net worth tells you what you actually own."
      ),
    /Hinglish language was translated/
  );
});
