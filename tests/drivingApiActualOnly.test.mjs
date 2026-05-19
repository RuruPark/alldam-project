import test from "node:test";
import assert from "node:assert/strict";
import {
  applyDrivingCommuteResultToTimes,
  createUnavailableDrivingCommuteResult,
  normalizeDrivingCommuteApiResult
} from "../src/utils/drivingCommuteApi.js";

test("driving API failure keeps durationMinutes null", () => {
  const result = normalizeDrivingCommuteApiResult({
    apiStatus: "failed",
    isActualApiValue: false,
    durationMinutes: 18
  });

  assert.equal(result.provider, "naver-directions5");
  assert.equal(result.apiStatus, "failed");
  assert.equal(result.isActualApiValue, false);
  assert.equal(result.durationMinutes, null);
});

test("driving API success marks the value as actual", () => {
  const result = normalizeDrivingCommuteApiResult({
    isActualApiValue: true,
    durationMinutes: 28.4,
    distanceMeters: 12340.2
  });

  assert.equal(result.apiStatus, "success");
  assert.equal(result.isActualApiValue, true);
  assert.equal(result.durationMinutes, 28);
  assert.equal(result.distanceMeters, 12340);
});

test("failed driving result does not replace car time with fallback minutes", () => {
  const commuteTimes = applyDrivingCommuteResultToTimes({
    transit: 32,
    walk: 95,
    straightDistanceKm: 7.1
  }, createUnavailableDrivingCommuteResult());

  assert.equal(commuteTimes.car, null);
  assert.equal(commuteTimes.transit, 32);
  assert.equal(commuteTimes.walk, 95);
  assert.equal(commuteTimes.driving.isActualApiValue, false);
});

test("driving result never exposes client secret fields", () => {
  const result = normalizeDrivingCommuteApiResult({
    isActualApiValue: true,
    durationMinutes: 20,
    NAVER_MAP_CLIENT_SECRET: "secret"
  });

  assert.equal("NAVER_MAP_CLIENT_SECRET" in result, false);
});
