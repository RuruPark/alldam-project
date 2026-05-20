import test from "node:test";
import assert from "node:assert/strict";
import { calculateHaversineKm } from "../src/utils/geoDistance.js";
import { estimateCommuteTimes } from "../src/utils/commuteEstimator.js";

const workplace = {
  lat: 36.815,
  lng: 127.108
};

const lifeZone = {
  centerLat: 36.7739,
  centerLng: 127.0628
};

test("calculateHaversineKm returns a positive distance for different points", () => {
  const distanceKm = calculateHaversineKm(workplace, lifeZone);

  assert.equal(Number.isFinite(distanceKm), true);
  assert.ok(distanceKm > 0);
});

test("calculateHaversineKm returns zero for the same point", () => {
  const distanceKm = calculateHaversineKm(workplace, workplace);

  assert.ok(distanceKm < 0.001);
});

test("estimateCommuteTimes keeps car unavailable without actual API data", () => {
  const result = estimateCommuteTimes(workplace, lifeZone);

  assert.equal(result.car, null);
  assert.equal(result.driving.provider, "naver-directions5");
  assert.equal(result.driving.isActualApiValue, false);
  assert.equal(typeof result.transit, "number");
  assert.equal(typeof result.walk, "number");
});

test("estimated transit and walk commute times are non-negative integers", () => {
  const result = estimateCommuteTimes(workplace, lifeZone);

  [result.transit, result.walk].forEach((minutes) => {
    assert.equal(Number.isInteger(minutes), true);
    assert.ok(minutes >= 0);
  });
});

test("estimateCommuteTimes marks the result as a distance fallback", () => {
  const result = estimateCommuteTimes(workplace, lifeZone);

  assert.equal(result.isFallback, true);
  assert.equal(result.provider, "distance-fallback");
});

test("estimateCommuteTimes applies ODsay transit success values when present", () => {
  const result = estimateCommuteTimes(workplace, {
    ...lifeZone,
    transitCommute: {
      id: "LZ_TEST",
      provider: "odsay-public-transit",
      apiStatus: "success",
      isActualApiValue: true,
      durationMinutes: 42,
      distanceMeters: 12800
    }
  });

  assert.equal(result.transit, 42);
  assert.equal(result.transitApi.provider, "odsay-public-transit");
  assert.equal(result.transitIsActualApiValue, true);
});

test("estimateCommuteTimes keeps failed ODsay transit values unavailable instead of fallback minutes", () => {
  const result = estimateCommuteTimes(workplace, {
    ...lifeZone,
    transitCommute: {
      id: "LZ_TEST",
      provider: "odsay-public-transit",
      apiStatus: "failed",
      errorCode: "ODSAY_NO_ROUTE",
      isActualApiValue: false,
      durationMinutes: null,
      distanceMeters: null
    }
  });

  assert.equal(result.transit, null);
  assert.equal(result.transitApi.errorCode, "ODSAY_NO_ROUTE");
  assert.equal(result.transitIsActualApiValue, false);
});

test("estimateCommuteTimes applies TMAP walking success values when present", () => {
  const result = estimateCommuteTimes(workplace, {
    ...lifeZone,
    walkingCommute: {
      id: "LZ_TEST",
      provider: "tmap-pedestrian",
      apiStatus: "success",
      isActualApiValue: true,
      durationMinutes: 28,
      distanceMeters: 2100
    }
  });

  assert.equal(result.walk, 28);
  assert.equal(result.walking.provider, "tmap-pedestrian");
  assert.equal(result.walkIsActualApiValue, true);
});

test("estimateCommuteTimes keeps failed TMAP walking values unavailable instead of fallback minutes", () => {
  const result = estimateCommuteTimes(workplace, {
    ...lifeZone,
    walkingCommute: {
      id: "LZ_TEST",
      provider: "tmap-pedestrian",
      apiStatus: "failed",
      errorCode: "TMAP_WALK_NO_ROUTE",
      isActualApiValue: false,
      durationMinutes: null,
      distanceMeters: null
    }
  });

  assert.equal(result.walk, null);
  assert.equal(result.walking.errorCode, "TMAP_WALK_NO_ROUTE");
  assert.equal(result.walkIsActualApiValue, false);
});
