import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createBoundaryModuleSource,
  createCheonanAsanBoundaryGeoJson,
  prepareVworldBoundaries
} from "../scripts/prepare-vworld-boundaries.mjs";

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

test("non-FeatureCollection input throws", () => {
  assert.throws(() => createCheonanAsanBoundaryGeoJson({
    type: "Feature",
    properties: {}
  }), /FeatureCollection/);
});

test("Cheonan and Asan features are filtered from mixed GeoJSON", () => {
  const result = createCheonanAsanBoundaryGeoJson({
    type: "FeatureCollection",
    features: [
      createFeature({
        EMD_CD: "44133101",
        EMD_KOR_NM: "불당동",
        SIG_KOR_NM: "천안시 서북구"
      }),
      createFeature({
        ADM_CD: "44200250",
        ADM_NM: "충청남도 아산시 배방읍"
      }),
      createFeature({
        EMD_CD: "11110101",
        EMD_KOR_NM: "청운동",
        SIG_KOR_NM: "서울특별시 종로구"
      })
    ]
  }, {
    generatedAt: "2026-05-18T00:00:00.000Z"
  });

  assert.equal(result.features.length, 2);
  assert.deepEqual(result.features.map((feature) => feature.properties.city), ["천안시", "아산시"]);
  assert.equal(result.metadata.isSample, false);
  assert.equal(result.metadata.featureCount, 2);
});

test("properties are normalized for the boundary module contract", () => {
  const result = createCheonanAsanBoundaryGeoJson({
    type: "FeatureCollection",
    features: [
      createFeature({
        EMD_CD: "44131101",
        EMD_KOR_NM: "신부동"
      })
    ]
  });
  const properties = result.features[0].properties;

  assert.deepEqual(properties, {
    emdCode: "44131101",
    city: "천안시",
    district: "동남구",
    emdName: "신부동",
    isSample: false,
    source: "vworld"
  });
});

test("SHP input is rejected with a GeoJSON conversion guide", async () => {
  await assert.rejects(() => prepareVworldBoundaries({
    input: "boundary.shp",
    output: "unused.js"
  }), /GeoJSON FeatureCollection/);
});

test("prepareVworldBoundaries does not create output when no Cheonan or Asan features exist", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "vworld-boundaries-"));
  const inputPath = path.join(tempDirectory, "seoul.geojson");
  const outputPath = path.join(tempDirectory, "cheonanAsanEmdBoundaries.js");

  await writeFile(inputPath, JSON.stringify({
    type: "FeatureCollection",
    features: [
      createFeature({
        EMD_CD: "11110101",
        EMD_KOR_NM: "청운동",
        SIG_KOR_NM: "서울특별시 종로구"
      })
    ]
  }), "utf8");

  await assert.rejects(() => prepareVworldBoundaries({
    input: inputPath,
    output: outputPath
  }), /덮어쓰지 않습니다/);
  await assert.rejects(() => access(outputPath));
  await rm(tempDirectory, { recursive: true, force: true });
});

test("prepareVworldBoundaries writes a JS module with the existing exports", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "vworld-boundaries-"));
  const inputPath = path.join(tempDirectory, "vworld.geojson");
  const outputPath = path.join(tempDirectory, "cheonanAsanEmdBoundaries.js");

  await writeFile(inputPath, JSON.stringify({
    type: "FeatureCollection",
    features: [
      createFeature({
        EMD_CD: "44200250",
        EMD_KOR_NM: "배방읍",
        SIG_KOR_NM: "아산시"
      })
    ]
  }), "utf8");

  const result = await prepareVworldBoundaries({
    input: inputPath,
    output: outputPath
  });
  const moduleSource = await readFile(outputPath, "utf8");

  assert.equal(result.metadata.isSample, false);
  assert.equal(result.metadata.featureCount, 1);
  assert.match(moduleSource, /export const cheonanAsanEmdBoundaryGeoJson/);
  assert.match(moduleSource, /export function getBoundaryFeatureByEmdCode/);
  assert.match(moduleSource, /export function getBoundaryFeatureByName/);
  assert.match(moduleSource, /export function hasBoundaryForEmd/);
  assert.match(moduleSource, /export function getAllBoundaryFeatures/);
  await rm(tempDirectory, { recursive: true, force: true });
});

test("createBoundaryModuleSource marks converted data as non-sample", () => {
  const source = createBoundaryModuleSource({
    type: "FeatureCollection",
    metadata: {
      source: "vworld",
      description: "test",
      isSample: false,
      generatedAt: "2026-05-18T00:00:00.000Z",
      featureCount: 0
    },
    features: []
  });

  assert.match(source, /isSample": false/);
});

function createFeature(properties) {
  return {
    type: "Feature",
    properties,
    geometry: polygonGeometry
  };
}
