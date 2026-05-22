import test from "node:test";
import assert from "node:assert/strict";
import { generatedLifeZones } from "../src/data/generatedLifeZones.js";
import { getAllBoundaryFeatures } from "../src/data/cheonanAsanEmdBoundaries.js";
import {
  createNaverMapRenderPlan,
  filterBoundaryFeaturesForRecommendations,
  findBoundaryFeatureForTarget,
  getRecommendationBoundaryKeys,
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

test("map plan keeps only recommendation boundaries and markers without workplace", () => {
  const results = generatedLifeZones.filter((zone) => (
    findBoundaryFeatureForTarget(boundaryFeatures, zone)
  )).slice(0, 3).map((zone, index) => ({
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
  assert.equal(plan.recommendationBoundaryFeatureCount, 3);
  assert.equal(plan.shouldRenderRecommendationBoundaries, true);
  assert.equal("shouldRenderBaseBoundaries" in plan, false);
});

test("recommendation boundary filtering does not fall back to all boundaries", () => {
  const results = generatedLifeZones.filter((zone) => (
    findBoundaryFeatureForTarget(boundaryFeatures, zone)
  )).slice(0, 3);
  const filteredFeatures = filterBoundaryFeaturesForRecommendations(boundaryFeatures, results);

  assert.equal(filteredFeatures.length, 3);
  assert.ok(filteredFeatures.length < boundaryFeatures.length);
});

test("recommendation boundary filtering deduplicates repeated life zones", () => {
  const result = generatedLifeZones.find((zone) => (
    findBoundaryFeatureForTarget(boundaryFeatures, zone)
  ));
  assert.ok(result);
  const filteredFeatures = filterBoundaryFeaturesForRecommendations(boundaryFeatures, [
    result,
    { ...result, id: `${result.id}-duplicate` }
  ]);

  assert.equal(filteredFeatures.length, 1);
});

test("recommendation boundary filtering skips unmatched results without full fallback", () => {
  const filteredFeatures = filterBoundaryFeaturesForRecommendations(boundaryFeatures, [{
    id: "missing-boundary",
    city: "missing-city",
    district: "missing-district",
    emdName: "missing-emd",
    centerLat: 36.8,
    centerLng: 127.1
  }]);

  assert.equal(filteredFeatures.length, 0);
});

test("recommendation boundary keys are stable for result identity values", () => {
  const result = generatedLifeZones.find((zone) => zone.emdCode);
  assert.ok(result);
  const keys = getRecommendationBoundaryKeys([result, { ...result }]);

  assert.equal(keys.length, 1);
  assert.ok(keys[0].startsWith("code:"));
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
