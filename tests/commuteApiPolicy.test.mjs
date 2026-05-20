import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCommuteApiMode,
  shouldFetchDrivingCommute,
  shouldFetchExternalCommuteApi,
  shouldFetchOdsayTransit,
  shouldFetchWalkingCommute
} from "../src/utils/commuteApiPolicy.js";

test("car mode calls only the Naver driving API policy", () => {
  assert.equal(shouldFetchDrivingCommute("car"), true);
  assert.equal(shouldFetchOdsayTransit("car"), false);
  assert.equal(shouldFetchWalkingCommute("car"), false);
  assert.equal(shouldFetchExternalCommuteApi("car"), true);
});

test("transit mode calls only the ODsay public transit API policy", () => {
  assert.equal(shouldFetchDrivingCommute("transit"), false);
  assert.equal(shouldFetchOdsayTransit("transit"), true);
  assert.equal(shouldFetchWalkingCommute("transit"), false);
  assert.equal(shouldFetchExternalCommuteApi("transit"), true);
});

test("walk mode calls only the TMAP walking API policy", () => {
  assert.equal(shouldFetchDrivingCommute("walk"), false);
  assert.equal(shouldFetchOdsayTransit("walk"), false);
  assert.equal(shouldFetchWalkingCommute("walk"), true);
  assert.equal(shouldFetchExternalCommuteApi("walk"), true);
});

test("legacy unknown-like modes normalize to car", () => {
  ["unknown", "", null, "notSure", "unsure"].forEach((mode) => {
    assert.equal(normalizeCommuteApiMode(mode), "car");
    assert.equal(shouldFetchDrivingCommute(mode), true);
    assert.equal(shouldFetchOdsayTransit(mode), false);
    assert.equal(shouldFetchWalkingCommute(mode), false);
    assert.equal(shouldFetchExternalCommuteApi(mode), true);
  });
});
