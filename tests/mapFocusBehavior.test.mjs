import test from "node:test";
import assert from "node:assert/strict";
import { generatedLifeZones } from "../src/data/generatedLifeZones.js";
import { getAllBoundaryFeatures } from "../src/data/cheonanAsanEmdBoundaries.js";
import {
  createNaverMapRenderPlan,
  findBoundaryFeatureForTarget,
  getNaverMapInitialCenter,
  getLifeZoneFocusTarget
} from "../src/components/NaverMapView.js";
import { getCheonanAsanMapBounds, isPointInsideBounds } from "../src/utils/cheonanAsanMapBounds.js";

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

test("infraOnly map plan keeps boundaries and recommendation markers without workplace", () => {
  const results = generatedLifeZones.slice(0, 3).map((zone, index) => ({
    ...zone,
    rank: index + 1,
    rankType: index === 2 ? "low" : "recommended",
    commute: null
  }));

  const plan = createNaverMapRenderPlan({
    workplace: null,
    results,
    boundaryFeatures
  });

  assert.equal(plan.hasWorkplace, false);
  assert.equal(plan.workplacePoint, null);
  assert.equal(plan.filteredResults.length, 3);
  assert.equal(plan.resultPoints.length, 3);
  assert.equal(plan.boundaryFeatureCount, boundaryFeatures.length);
  assert.equal(plan.shouldRenderBaseBoundaries, true);
});

test("infraOnly map center falls back to recommendation results without workplace", () => {
  const allowedBounds = getCheonanAsanMapBounds();
  const center = getNaverMapInitialCenter({
    workplace: null,
    results: generatedLifeZones.slice(0, 2),
    allowedBounds
  });

  assert.ok(isPointInsideBounds(center, allowedBounds));
  assert.notDeepEqual(center, {
    lat: (allowedBounds.minLat + allowedBounds.maxLat) / 2,
    lng: (allowedBounds.minLng + allowedBounds.maxLng) / 2
  });
});

test("infraOnly map center falls back to Cheonan-Asan bounds without workplace or results", () => {
  const allowedBounds = getCheonanAsanMapBounds();
  const center = getNaverMapInitialCenter({
    workplace: null,
    results: [],
    allowedBounds
  });

  assert.ok(isPointInsideBounds(center, allowedBounds));
});
