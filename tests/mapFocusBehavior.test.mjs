import test from "node:test";
import assert from "node:assert/strict";
import { generatedLifeZones } from "../src/data/generatedLifeZones.js";
import { getAllBoundaryFeatures } from "../src/data/cheonanAsanEmdBoundaries.js";
import {
  findBoundaryFeatureForTarget,
  getLifeZoneFocusTarget
} from "../src/components/NaverMapView.js";

const boundaryFeatures = getAllBoundaryFeatures();

test("getLifeZoneFocusTarget prefers boundary geometry for generated life zones", () => {
  const lifeZoneWithBoundary = generatedLifeZones.find((zone) => (
    findBoundaryFeatureForTarget(boundaryFeatures, zone)
  ));

  assert.ok(lifeZoneWithBoundary, "expected at least one generated life zone to match an EMD boundary");

  const focusTarget = getLifeZoneFocusTarget(lifeZoneWithBoundary, boundaryFeatures);

  assert.equal(focusTarget?.type, "boundary");
  assert.ok(focusTarget.feature?.geometry);
});

test("getLifeZoneFocusTarget falls back to center coordinates when boundary is missing", () => {
  const focusTarget = getLifeZoneFocusTarget({
    id: "missing-boundary",
    city: "천안시",
    district: "서북구",
    emdName: "테스트동",
    centerLat: 36.8,
    centerLng: 127.1
  }, boundaryFeatures);

  assert.equal(focusTarget?.type, "center");
  assert.deepEqual(focusTarget.center, { lat: 36.8, lng: 127.1 });
});

test("getLifeZoneFocusTarget returns null without boundary or center coordinates", () => {
  const focusTarget = getLifeZoneFocusTarget({
    id: "invalid-life-zone",
    emdName: "테스트동"
  }, boundaryFeatures);

  assert.equal(focusTarget, null);
});
