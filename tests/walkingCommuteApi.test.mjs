import test from "node:test";
import assert from "node:assert/strict";
import {
  applyWalkingCommuteResultToTimes,
  fetchWalkingCommuteBatch,
  normalizeWalkingCommuteApiResult
} from "../src/utils/walkingCommuteApi.js";

test("normalizeWalkingCommuteApiResult keeps TMAP success values", () => {
  const result = normalizeWalkingCommuteApiResult({
    provider: "tmap-pedestrian",
    apiStatus: "success",
    isActualApiValue: true,
    durationMinutes: 28,
    distanceMeters: 2100,
    diagnostics: {
      hasTmapAppKey: true,
      hasWalkingBaseUrl: true
    }
  });

  assert.equal(result.apiStatus, "success");
  assert.equal(result.isActualApiValue, true);
  assert.equal(result.durationMinutes, 28);
  assert.equal(result.distanceMeters, 2100);
  assert.equal(result.provider, "tmap-pedestrian");
});

test("normalizeWalkingCommuteApiResult keeps failures unavailable without fallback minutes", () => {
  const result = normalizeWalkingCommuteApiResult({
    apiStatus: "failed",
    errorCode: "TMAP_WALK_NO_ROUTE",
    isActualApiValue: false,
    durationMinutes: 99,
    distanceMeters: 2100
  });

  assert.equal(result.apiStatus, "failed");
  assert.equal(result.isActualApiValue, false);
  assert.equal(result.durationMinutes, null);
  assert.equal(result.distanceMeters, null);
  assert.equal(result.errorCode, "TMAP_WALK_NO_ROUTE");
});

test("applyWalkingCommuteResultToTimes replaces fallback walk only when a TMAP result exists", () => {
  const fallbackTimes = {
    walk: 73,
    transit: 42
  };

  assert.equal(applyWalkingCommuteResultToTimes(fallbackTimes, null).walk, 73);

  const failed = applyWalkingCommuteResultToTimes(fallbackTimes, {
    apiStatus: "failed",
    errorCode: "TMAP_WALK_PARSE_FAILED",
    isActualApiValue: false,
    durationMinutes: null
  });
  assert.equal(failed.walk, null);
  assert.equal(failed.walkIsActualApiValue, false);
  assert.equal(failed.walkErrorCode, "TMAP_WALK_PARSE_FAILED");

  const success = applyWalkingCommuteResultToTimes(fallbackTimes, {
    apiStatus: "success",
    isActualApiValue: true,
    durationMinutes: 28,
    distanceMeters: 2100
  });
  assert.equal(success.walk, 28);
  assert.equal(success.walkIsActualApiValue, true);
});

test("fetchWalkingCommuteBatch posts only walking-batch targets and returns a result map", async () => {
  let capturedUrl = "";
  let capturedOptions = null;
  const result = await fetchWalkingCommuteBatch({
    start: {
      lat: 36.815,
      lng: 127.108,
      name: "출발지"
    },
    lifeZones: [{
      id: "LZ_1",
      centerLat: 36.773,
      centerLng: 127.059,
      name: "배방읍"
    }],
    fetchImpl: async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        json: async () => ({
          results: [{
            id: "LZ_1",
            provider: "tmap-pedestrian",
            apiStatus: "success",
            isActualApiValue: true,
            durationMinutes: 28,
            distanceMeters: 2100
          }]
        })
      };
    }
  });
  const body = JSON.parse(capturedOptions.body);

  assert.equal(capturedUrl, "/api/commute/walking-batch");
  assert.equal(capturedOptions.method, "POST");
  assert.equal(body.goals.length, 1);
  assert.equal(body.goals[0].lat, 36.773);
  assert.equal(body.goals[0].lng, 127.059);
  assert.equal(result.get("LZ_1").durationMinutes, 28);
});
