import assert from "node:assert/strict";
import test from "node:test";
import {
  SCRATCH_DURATION_OPTIONS,
  isScratchDuration,
} from "../src/features/project/duration";

test("scratch durations are offered from 10 through 90 in 10-second steps", () => {
  assert.deepEqual(SCRATCH_DURATION_OPTIONS, [
    10,
    20,
    30,
    40,
    50,
    60,
    70,
    80,
    90,
  ]);
});

test("scratch duration validation rejects gaps and out-of-range values", () => {
  assert.equal(isScratchDuration(10), true);
  assert.equal(isScratchDuration(50), true);
  assert.equal(isScratchDuration(90), true);
  assert.equal(isScratchDuration(4), false);
  assert.equal(isScratchDuration(25), false);
  assert.equal(isScratchDuration(100), false);
});
