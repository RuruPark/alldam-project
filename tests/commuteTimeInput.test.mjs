import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_TARGET_MINUTES,
  MIN_TARGET_MINUTES,
  normalizeTargetMinutes
} from "../src/utils/commuteScoring.js";

test("target commute minutes use the requested 10 to 90 minute range", () => {
  assert.equal(MIN_TARGET_MINUTES, 10);
  assert.equal(MAX_TARGET_MINUTES, 90);
});

test("normalizeTargetMinutes clamps values below 10 minutes", () => {
  assert.equal(normalizeTargetMinutes(1), 10);
  assert.equal(normalizeTargetMinutes(9), 10);
});

test("normalizeTargetMinutes clamps values above 90 minutes", () => {
  assert.equal(normalizeTargetMinutes(91), 90);
  assert.equal(normalizeTargetMinutes(120), 90);
});

test("normalizeTargetMinutes keeps valid values", () => {
  assert.equal(normalizeTargetMinutes(40), 40);
  assert.equal(normalizeTargetMinutes("55"), 55);
});
