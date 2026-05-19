import test from "node:test";
import assert from "node:assert/strict";
import { cheonanAsanEmdBoundaryGeoJson } from "../src/data/cheonanAsanEmdBoundaries.js";
import { generatedLifeZones } from "../src/data/generatedLifeZones.js";
import {
  calculateGeoJsonBounds,
  calculateLifeZoneBounds,
  clampPointToBounds,
  doBoundsIntersect,
  filterCheonanAsanMapResults,
  getBoundsCenter,
  getCheonanAsanBoundsCenter,
  getCheonanAsanMapBounds,
  getNaverMapViewportBounds,
  isPointInsideBounds,
  padBounds,
  shouldRestoreToCheonanAsan
} from "../src/utils/cheonanAsanMapBounds.js";

test("calculateGeoJsonBounds computes WGS84 bounds from administrative boundaries", () => {
  const bounds = calculateGeoJsonBounds(cheonanAsanEmdBoundaryGeoJson);

  assert.ok(bounds.minLat < bounds.maxLat);
  assert.ok(bounds.minLng < bounds.maxLng);
  assert.ok(bounds.minLat > 35 && bounds.maxLat < 38);
  assert.ok(bounds.minLng > 126 && bounds.maxLng < 128);
});

test("calculateLifeZoneBounds uses generated life zone center coordinates", () => {
  const bounds = calculateLifeZoneBounds(generatedLifeZones);

  assert.ok(bounds.minLat < bounds.maxLat);
  assert.ok(bounds.minLng < bounds.maxLng);
});

test("padBounds expands every side of bounds", () => {
  const bounds = { minLat: 36.7, maxLat: 36.9, minLng: 126.9, maxLng: 127.2 };
  const paddedBounds = padBounds(bounds, 0.1);

  assert.ok(Math.abs(paddedBounds.minLat - 36.6) < 0.000001);
  assert.ok(Math.abs(paddedBounds.maxLat - 37) < 0.000001);
  assert.ok(Math.abs(paddedBounds.minLng - 126.8) < 0.000001);
  assert.ok(Math.abs(paddedBounds.maxLng - 127.3) < 0.000001);
});

test("isPointInsideBounds detects inside and outside coordinates", () => {
  const bounds = getCheonanAsanMapBounds();
  const generatedPoint = {
    lat: generatedLifeZones[0].centerLat,
    lng: generatedLifeZones[0].centerLng
  };

  assert.equal(isPointInsideBounds(generatedPoint, bounds), true);
  assert.equal(isPointInsideBounds({ lat: 37.5665, lng: 126.978 }, bounds), false);
});

test("clampPointToBounds moves outside coordinates into the allowed range", () => {
  const bounds = { minLat: 36.7, maxLat: 36.9, minLng: 126.9, maxLng: 127.2 };
  const clampedPoint = clampPointToBounds({ lat: 37.5, lng: 126.2 }, bounds);

  assert.deepEqual(clampedPoint, { lat: 36.9, lng: 126.9 });
});

test("doBoundsIntersect detects overlapping and separated map bounds", () => {
  const allowedBounds = { minLat: 36.7, maxLat: 36.9, minLng: 126.9, maxLng: 127.2 };

  assert.equal(doBoundsIntersect(
    allowedBounds,
    { minLat: 36.8, maxLat: 37.0, minLng: 127.0, maxLng: 127.3 }
  ), true);
  assert.equal(doBoundsIntersect(
    allowedBounds,
    { minLat: 37.2, maxLat: 37.4, minLng: 127.4, maxLng: 127.6 }
  ), false);
});

test("shouldRestoreToCheonanAsan only restores when the viewport no longer intersects the region", () => {
  const allowedBounds = { minLat: 36.7, maxLat: 36.9, minLng: 126.9, maxLng: 127.2 };

  assert.equal(shouldRestoreToCheonanAsan({
    viewportBounds: { minLat: 37.1, maxLat: 37.3, minLng: 127.4, maxLng: 127.6 },
    allowedBounds
  }), true);
  assert.equal(shouldRestoreToCheonanAsan({
    viewportBounds: { minLat: 36.85, maxLat: 37.05, minLng: 127.1, maxLng: 127.35 },
    allowedBounds
  }), false);
});

test("getNaverMapViewportBounds normalizes Naver-style LatLngBounds", () => {
  const viewportBounds = getNaverMapViewportBounds({
    getBounds() {
      return {
        getMin() {
          return { lat: () => 36.7, lng: () => 126.9 };
        },
        getMax() {
          return { lat: () => 36.9, lng: () => 127.2 };
        }
      };
    }
  });

  assert.deepEqual(viewportBounds, { minLat: 36.7, maxLat: 36.9, minLng: 126.9, maxLng: 127.2 });
});

test("getCheonanAsanBoundsCenter returns the same center as the generic bounds center", () => {
  const bounds = { minLat: 36.7, maxLat: 36.9, minLng: 126.9, maxLng: 127.2 };

  assert.deepEqual(getCheonanAsanBoundsCenter(bounds), getBoundsCenter(bounds));
});

test("generatedLifeZones are limited to Cheonan and Asan", () => {
  assert.equal(generatedLifeZones.length, 48);
  assert.equal(generatedLifeZones.every((zone) => ["천안시", "아산시"].includes(zone.city)), true);
});

test("filterCheonanAsanMapResults excludes non Cheonan-Asan map data", () => {
  const filtered = filterCheonanAsanMapResults([
    generatedLifeZones[0],
    { id: "outside", city: "서울시", centerLat: 37.5665, centerLng: 126.978 }
  ]);

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, generatedLifeZones[0].id);
});
