import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createAdminBoundaryGeoJson,
  prepareAdminBoundaries
} from "../scripts/prepare-admin-boundaries.mjs";

const wgs84Polygon = {
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

const projectedPolygon = {
  type: "Polygon",
  coordinates: [
    [
      [210000, 540000],
      [211000, 540000],
      [211000, 541000],
      [210000, 541000],
      [210000, 540000]
    ]
  ]
};

test("non-FeatureCollection admin input throws", () => {
  assert.throws(() => createAdminBoundaryGeoJson({
    type: "Feature",
    properties: {}
  }), /FeatureCollection/);
});

test("Cheonan and Asan features are filtered while other regions are excluded", () => {
  const result = createAdminBoundaryGeoJson({
    type: "FeatureCollection",
    features: [
      createFeature({
        ADM_CD: "44133101",
        ADM_NM: "충청남도 천안시 서북구 불당동"
      }),
      createFeature({
        admCd: "44200250",
        admNm: "충청남도 아산시 배방읍"
      }),
      createFeature({
        ADM_CD: "11110101",
        ADM_NM: "서울특별시 종로구 청운동"
      })
    ]
  }, {
    source: "molit-census-boundary",
    generatedAt: "2026-05-19T00:00:00.000Z"
  });

  assert.equal(result.features.length, 2);
  assert.deepEqual(result.features.map((feature) => feature.properties.city), ["천안시", "아산시"]);
  assert.equal(result.metadata.source, "molit-census-boundary");
  assert.equal(result.metadata.isSample, false);
  assert.equal(result.metadata.featureCount, 2);
});

test("full Cheonan name is parsed into city, district, and EMD name", () => {
  const result = createAdminBoundaryGeoJson({
    type: "FeatureCollection",
    features: [
      createFeature({
        admCd: "44133101",
        admNm: "충청남도 천안시 서북구 불당동"
      })
    ]
  });

  assert.deepEqual(result.features[0].properties, {
    emdCode: "44133101",
    city: "천안시",
    district: "서북구",
    emdName: "불당동",
    isSample: false,
    source: "admin-boundary"
  });
});

test("full Asan name is parsed with no district", () => {
  const result = createAdminBoundaryGeoJson({
    type: "FeatureCollection",
    features: [
      createFeature({
        admCd: "44200250",
        admNm: "충청남도 아산시 배방읍"
      })
    ]
  });

  assert.deepEqual(result.features[0].properties, {
    emdCode: "44200250",
    city: "아산시",
    district: "해당 없음",
    emdName: "배방읍",
    isSample: false,
    source: "admin-boundary"
  });
});

test("census ADM_CD prefixes identify Cheonan districts and Asan city", () => {
  const result = createAdminBoundaryGeoJson({
    type: "FeatureCollection",
    features: [
      createFeature({
        ADM_CD: "34012620",
        ADM_NM: "불당1동"
      }),
      createFeature({
        ADM_CD: "34011590",
        ADM_NM: "신안동"
      }),
      createFeature({
        ADM_CD: "34040510",
        ADM_NM: "온양1동"
      })
    ]
  });

  assert.deepEqual(result.features.map((feature) => feature.properties), [
    {
      emdCode: "34012620",
      city: "천안시",
      district: "서북구",
      emdName: "불당1동",
      isSample: false,
      source: "admin-boundary"
    },
    {
      emdCode: "34011590",
      city: "천안시",
      district: "동남구",
      emdName: "신안동",
      isSample: false,
      source: "admin-boundary"
    },
    {
      emdCode: "34040510",
      city: "아산시",
      district: "해당 없음",
      emdName: "온양1동",
      isSample: false,
      source: "admin-boundary"
    }
  ]);
});

test("projected coordinates are rejected before output is written", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "admin-boundaries-"));
  const inputPath = path.join(tempDirectory, "projected.geojson");
  const outputPath = path.join(tempDirectory, "cheonanAsanEmdBoundaries.js");

  await writeFile(inputPath, JSON.stringify({
    type: "FeatureCollection",
    features: [
      createFeature({
        admCd: "44133101",
        admNm: "충청남도 천안시 서북구 불당동"
      }, projectedPolygon)
    ]
  }), "utf8");

  await assert.rejects(() => prepareAdminBoundaries({
    input: inputPath,
    output: outputPath
  }), /WGS84/);
  await assert.rejects(() => access(outputPath));
  await rm(tempDirectory, { recursive: true, force: true });
});

test("no Cheonan or Asan features prevents output creation", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "admin-boundaries-"));
  const inputPath = path.join(tempDirectory, "other.geojson");
  const outputPath = path.join(tempDirectory, "cheonanAsanEmdBoundaries.js");

  await writeFile(inputPath, JSON.stringify({
    type: "FeatureCollection",
    features: [
      createFeature({
        admCd: "11110101",
        admNm: "서울특별시 종로구 청운동"
      })
    ]
  }), "utf8");

  await assert.rejects(() => prepareAdminBoundaries({
    input: inputPath,
    output: outputPath
  }), /덮어쓰지 않습니다/);
  await assert.rejects(() => access(outputPath));
  await rm(tempDirectory, { recursive: true, force: true });
});

test("prepareAdminBoundaries writes a compatible JS module", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "admin-boundaries-"));
  const inputPath = path.join(tempDirectory, "admin.geojson");
  const outputPath = path.join(tempDirectory, "cheonanAsanEmdBoundaries.js");

  await writeFile(inputPath, JSON.stringify({
    type: "FeatureCollection",
    features: [
      createFeature({
        admCd: "44200250",
        admNm: "충청남도 아산시 배방읍"
      })
    ]
  }), "utf8");

  const { boundaryGeoJson } = await prepareAdminBoundaries({
    input: inputPath,
    output: outputPath,
    source: "molit-census-boundary"
  });
  const moduleSource = await readFile(outputPath, "utf8");

  assert.equal(boundaryGeoJson.metadata.isSample, false);
  assert.equal(boundaryGeoJson.metadata.source, "molit-census-boundary");
  assert.equal(boundaryGeoJson.metadata.featureCount, 1);
  assert.match(moduleSource, /export const cheonanAsanEmdBoundaryGeoJson/);
  assert.match(moduleSource, /export function getBoundaryFeatureByEmdCode/);
  assert.match(moduleSource, /export function getBoundaryFeatureByName/);
  assert.match(moduleSource, /export function hasBoundaryForEmd/);
  assert.match(moduleSource, /export function getAllBoundaryFeatures/);
  await rm(tempDirectory, { recursive: true, force: true });
});

test("SHP input path is rejected with conversion guidance", async () => {
  await assert.rejects(() => prepareAdminBoundaries({
    input: "BND_ADM_DONG_PG.shp",
    output: "unused.js"
  }), /WGS84\(EPSG:4326\) GeoJSON/);
});

function createFeature(properties, geometry = wgs84Polygon) {
  return {
    type: "Feature",
    properties,
    geometry
  };
}
