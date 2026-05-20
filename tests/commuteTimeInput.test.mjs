import test from "node:test";
import assert from "node:assert/strict";
import {
  getTargetMinutesRangeForCommuteMode,
  MAX_TARGET_MINUTES,
  MIN_TARGET_MINUTES,
  normalizeTargetMinutes,
  normalizeTargetMinutesForCommuteMode,
  WALK_RECOMMENDATION_MAX_MINUTES
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

test("walk mode limits target commute minutes to 10 to 60", () => {
  assert.equal(WALK_RECOMMENDATION_MAX_MINUTES, 60);
  assert.deepEqual(getTargetMinutesRangeForCommuteMode("walk"), {
    min: 10,
    max: 60
  });
  assert.equal(normalizeTargetMinutesForCommuteMode(90, "walk"), 60);
  assert.equal(normalizeTargetMinutesForCommuteMode(5, "walk"), 10);
});

test("car and transit modes keep the 10 to 90 target commute range", () => {
  assert.deepEqual(getTargetMinutesRangeForCommuteMode("car"), {
    min: 10,
    max: 90
  });
  assert.deepEqual(getTargetMinutesRangeForCommuteMode("transit"), {
    min: 10,
    max: 90
  });
  assert.equal(normalizeTargetMinutesForCommuteMode(90, "car"), 90);
  assert.equal(normalizeTargetMinutesForCommuteMode(90, "transit"), 90);
});
