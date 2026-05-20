import test from "node:test";
import assert from "node:assert/strict";
import {
  shouldFetchDrivingCommute,
  shouldFetchExternalCommuteApi,
  shouldFetchOdsayTransit
} from "../src/utils/commuteApiPolicy.js";

test("car mode calls only the Naver driving API policy", () => {
  assert.equal(shouldFetchDrivingCommute("car"), true);
  assert.equal(shouldFetchOdsayTransit("car"), false);
  assert.equal(shouldFetchExternalCommuteApi("car"), true);
});

test("transit mode calls only the ODsay public transit API policy", () => {
  assert.equal(shouldFetchDrivingCommute("transit"), false);
  assert.equal(shouldFetchOdsayTransit("transit"), true);
  assert.equal(shouldFetchExternalCommuteApi("transit"), true);
});

test("walk and unknown modes do not call external commute APIs", () => {
  ["walk", "unknown", "", null].forEach((mode) => {
    assert.equal(shouldFetchDrivingCommute(mode), false);
    assert.equal(shouldFetchOdsayTransit(mode), false);
    assert.equal(shouldFetchExternalCommuteApi(mode), false);
  });
});
