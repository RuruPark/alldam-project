import test from "node:test";
import assert from "node:assert/strict";
import {
  findBoundaryFeatureByPoint,
  isPointInPolygonGeometry,
  isPointInRing
} from "../src/utils/pointInPolygon.js";

const squareRing = [
  [127.0, 36.0],
  [127.1, 36.0],
  [127.1, 36.1],
  [127.0, 36.1],
  [127.0, 36.0]
];

test("isPointInRing detects a point inside a simple ring", () => {
  assert.equal(isPointInRing({ lat: 36.05, lng: 127.05 }, squareRing), true);
});

test("isPointInRing excludes a point outside a simple ring", () => {
  assert.equal(isPointInRing({ lat: 36.2, lng: 127.05 }, squareRing), false);
});

test("isPointInPolygonGeometry handles polygon holes", () => {
  const geometry = {
    type: "Polygon",
    coordinates: [
      squareRing,
      [
        [127.03, 36.03],
        [127.07, 36.03],
        [127.07, 36.07],
        [127.03, 36.07],
        [127.03, 36.03]
      ]
    ]
  };

  assert.equal(isPointInPolygonGeometry({ lat: 36.02, lng: 127.02 }, geometry), true);
  assert.equal(isPointInPolygonGeometry({ lat: 36.05, lng: 127.05 }, geometry), false);
});

test("findBoundaryFeatureByPoint handles MultiPolygon geometry", () => {
  const feature = {
    type: "Feature",
    properties: { emdCode: "TEST" },
    geometry: {
      type: "MultiPolygon",
      coordinates: [[squareRing]]
    }
  };

  assert.equal(findBoundaryFeatureByPoint({ lat: 36.05, lng: 127.05 }, [feature]), feature);
  assert.equal(findBoundaryFeatureByPoint({ lat: 36.2, lng: 127.2 }, [feature]), null);
});
