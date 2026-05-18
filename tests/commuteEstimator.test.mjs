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

test("estimateCommuteTimes returns all commute modes", () => {
  const result = estimateCommuteTimes(workplace, lifeZone);

  assert.equal(typeof result.car, "number");
  assert.equal(typeof result.transit, "number");
  assert.equal(typeof result.walk, "number");
});

test("estimated commute times are non-negative integers", () => {
  const result = estimateCommuteTimes(workplace, lifeZone);

  [result.car, result.transit, result.walk].forEach((minutes) => {
    assert.equal(Number.isInteger(minutes), true);
    assert.ok(minutes >= 0);
  });
});

test("estimateCommuteTimes marks the result as a distance fallback", () => {
  const result = estimateCommuteTimes(workplace, lifeZone);

  assert.equal(result.isFallback, true);
  assert.equal(result.provider, "distance-fallback");
});
