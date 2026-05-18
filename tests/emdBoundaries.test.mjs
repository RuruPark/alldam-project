import test from "node:test";
import assert from "node:assert/strict";
import {
  cheonanAsanEmdBoundaryGeoJson,
  getAllBoundaryFeatures,
  getBoundaryFeatureByEmdCode,
  getBoundaryFeatureByName,
  hasBoundaryForEmd
} from "../src/data/cheonanAsanEmdBoundaries.js";

test("cheonanAsanEmdBoundaryGeoJson is a FeatureCollection", () => {
  assert.equal(cheonanAsanEmdBoundaryGeoJson.type, "FeatureCollection");
  assert.equal(Array.isArray(cheonanAsanEmdBoundaryGeoJson.features), true);
});

test("boundary metadata marks the data as real administrative boundaries", () => {
  assert.equal(cheonanAsanEmdBoundaryGeoJson.metadata.isSample, false);
  assert.equal(cheonanAsanEmdBoundaryGeoJson.metadata.source, "molit-census-boundary");
  assert.equal(cheonanAsanEmdBoundaryGeoJson.metadata.featureCount, cheonanAsanEmdBoundaryGeoJson.features.length);
});

test("Cheonan and Asan boundary features are included", () => {
  const features = getAllBoundaryFeatures();
  const cheonanCount = features.filter((feature) => feature.properties?.city === "천안시").length;
  const asanCount = features.filter((feature) => feature.properties?.city === "아산시").length;

  assert.ok(features.length > 0);
  assert.ok(cheonanCount > 0);
  assert.ok(asanCount > 0);
});

test("boundary properties are normalized for the app contract", () => {
  const feature = getBoundaryFeatureByEmdCode("34012620");

  assert.equal(feature?.properties.emdCode, "34012620");
  assert.equal(feature?.properties.city, "천안시");
  assert.equal(feature?.properties.district, "서북구");
  assert.equal(feature?.properties.emdName, "불당1동");
  assert.equal(feature?.properties.isSample, false);
  assert.equal(feature?.properties.source, "molit-census-boundary");
});

test("getBoundaryFeatureByName returns a matching real feature", () => {
  const feature = getBoundaryFeatureByName({
    city: "아산시",
    district: "해당 없음",
    emdName: "온양1동"
  });

  assert.equal(feature?.properties.emdCode, "34040510");
  assert.equal(feature?.properties.emdName, "온양1동");
});

test("legacy MVP EMD codes resolve to real census boundary features", () => {
  assert.equal(getBoundaryFeatureByEmdCode("44133101")?.properties.emdName, "불당2동");
  assert.equal(getBoundaryFeatureByEmdCode("44133102")?.properties.emdName, "쌍용2동");
  assert.equal(getBoundaryFeatureByEmdCode("44133103")?.properties.emdName, "성정1동");
  assert.equal(getBoundaryFeatureByEmdCode("44131101")?.properties.emdName, "신안동");
});

test("legacy MVP EMD names resolve to real census boundary features", () => {
  assert.equal(getBoundaryFeatureByName({
    city: "천안시",
    district: "서북구",
    emdName: "불당동"
  })?.properties.emdName, "불당2동");
  assert.equal(getBoundaryFeatureByName({
    city: "천안시",
    district: "서북구",
    emdName: "쌍용동"
  })?.properties.emdName, "쌍용2동");
  assert.equal(getBoundaryFeatureByName({
    city: "천안시",
    district: "동남구",
    emdName: "신부동"
  })?.properties.emdName, "신안동");
});

test("hasBoundaryForEmd checks by code or name", () => {
  assert.equal(hasBoundaryForEmd({ emdCode: "34012620" }), true);
  assert.equal(hasBoundaryForEmd({ emdCode: "44133101" }), true);
  assert.equal(hasBoundaryForEmd({
    city: "아산시",
    district: "해당 없음",
    emdName: "배방읍"
  }), true);
  assert.equal(hasBoundaryForEmd({
    city: "천안시",
    district: "동남구",
    emdName: "없는동"
  }), false);
});

test("boundary coordinates are WGS84 longitude and latitude values", () => {
  const feature = getBoundaryFeatureByEmdCode("34040510");
  const positions = collectPositions(feature?.geometry?.coordinates);

  assert.ok(positions.length > 0);
  assert.equal(positions.every(([lng, lat]) => (
    lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
  )), true);
});

function collectPositions(coordinates) {
  if (!Array.isArray(coordinates)) return [];

  if (coordinates.length >= 2 && typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    return [coordinates];
  }

  return coordinates.flatMap(collectPositions);
}
