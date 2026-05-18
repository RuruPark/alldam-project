import test from "node:test";
import assert from "node:assert/strict";
import {
  getFeatureIdentity,
  isSameEmdFeature,
  normalizeGeoJsonGeometryToRings
} from "../src/utils/geoJsonPolygon.js";

const polygonGeometry = {
  type: "Polygon",
  coordinates: [
    [
      [127.1, 36.8],
      [127.2, 36.8],
      [127.2, 36.9],
      [127.1, 36.9],
      [127.1, 36.8]
    ]
  ]
};

test("Polygon geometry converts to lat/lng rings", () => {
  const rings = normalizeGeoJsonGeometryToRings(polygonGeometry);

  assert.equal(rings.length, 1);
  assert.equal(rings[0].length, 5);
});

test("GeoJSON [lng, lat] coordinates convert to { lat, lng }", () => {
  const rings = normalizeGeoJsonGeometryToRings(polygonGeometry);

  assert.deepEqual(rings[0][0], {
    lat: 36.8,
    lng: 127.1
  });
});

test("invalid geometry returns an empty ring array", () => {
  assert.deepEqual(normalizeGeoJsonGeometryToRings(null), []);
  assert.deepEqual(normalizeGeoJsonGeometryToRings({ type: "Point", coordinates: [127.1, 36.8] }), []);
});

test("MultiPolygon geometry converts each exterior ring", () => {
  const rings = normalizeGeoJsonGeometryToRings({
    type: "MultiPolygon",
    coordinates: [
      [
        [
          [127.1, 36.8],
          [127.2, 36.8],
          [127.2, 36.9],
          [127.1, 36.9],
          [127.1, 36.8]
        ]
      ],
      [
        [
          [127.3, 36.7],
          [127.4, 36.7],
          [127.4, 36.8],
          [127.3, 36.8],
          [127.3, 36.7]
        ]
      ]
    ]
  });

  assert.equal(rings.length, 2);
  assert.deepEqual(rings[1][0], {
    lat: 36.7,
    lng: 127.3
  });
});

test("getFeatureIdentity returns EMD identity fields", () => {
  const feature = {
    properties: {
      emdCode: "44133101",
      city: "천안시",
      district: "서북구",
      emdName: "불당동"
    }
  };

  assert.deepEqual(getFeatureIdentity(feature), {
    emdCode: "44133101",
    city: "천안시",
    district: "서북구",
    emdName: "불당동"
  });
});

test("isSameEmdFeature prefers emdCode matching", () => {
  const feature = {
    properties: {
      emdCode: "44133101",
      city: "천안시",
      district: "서북구",
      emdName: "불당동"
    }
  };

  assert.equal(isSameEmdFeature(feature, { emdCode: "44133101" }), true);
  assert.equal(isSameEmdFeature(feature, { emdCode: "other" }), false);
});

test("isSameEmdFeature falls back to city, district, and emdName", () => {
  const feature = {
    properties: {
      city: "아산시",
      district: "해당 없음",
      emdName: "배방읍"
    }
  };

  assert.equal(isSameEmdFeature(feature, {
    city: "아산시",
    district: "해당 없음",
    emdName: "배방읍"
  }), true);
});

test("isSameEmdFeature resolves legacy MVP codes to census boundary codes", () => {
  const feature = {
    properties: {
      emdCode: "34012630",
      city: "천안시",
      district: "서북구",
      emdName: "불당2동"
    }
  };

  assert.equal(isSameEmdFeature(feature, {
    emdCode: "44133101",
    city: "천안시",
    district: "서북구",
    emdName: "불당동"
  }), true);
});

test("isSameEmdFeature resolves legacy MVP names to census boundary names", () => {
  const feature = {
    properties: {
      emdCode: "34011590",
      city: "천안시",
      district: "동남구",
      emdName: "신안동"
    }
  };

  assert.equal(isSameEmdFeature(feature, {
    city: "천안시",
    district: "동남구",
    emdName: "신부동"
  }), true);
});
