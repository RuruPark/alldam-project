import { readFile } from "node:fs/promises";
import { generatedLifeZones } from "../src/data/generatedLifeZones.js";
import { getLifeZoneDataset } from "../src/data/lifeZoneRepository.js";
import { mockLifeZones } from "../src/data/mockLifeZones.js";
import {
  assignRelativeGrades,
  calculateLifeZoneScores,
  getTopAndLowZones
} from "../src/utils/lifeZoneScoring.js";

const requiredFiles = [
  "index.html",
  "public-config.js",
  "scripts/prepare-admin-boundaries.mjs",
  "scripts/prepare-vworld-boundaries.mjs",
  "scripts/analyze-preprocessed-csv.mjs",
  "scripts/generate-life-zones-from-csv.mjs",
  "src/main.js",
  "src/components/app.js",
  "src/components/NaverMapView.js",
  "src/data/cheonanAsanEmdCenters.js",
  "src/data/cheonanAsanEmdBoundaries.js",
  "src/data/generatedLifeZones.js",
  "src/data/infrastructureCsvConfig.js",
  "src/data/lifeZoneDataMode.js",
  "src/data/mockLifeZones.js",
  "src/data/workplaceOptions.js",
  "src/utils/addressParser.js",
  "src/utils/naverMapLoader.js",
  "src/utils/geoJsonPolygon.js",
  "src/utils/pointInPolygon.js",
  "src/utils/geoDistance.js",
  "src/utils/commuteEstimator.js",
  "src/utils/commuteScoring.js",
  "src/utils/lifeZoneCommuteScoring.js",
  "src/utils/lifeZoneScoring.js",
  "src/types/lifeZone.ts",
  "docs/data-scoring-plan.md",
  "docs/generated-life-zones-summary.md",
  "docs/preprocessed-csv-diagnosis.md",
  ".env.example"
];

await Promise.all(requiredFiles.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")));

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const publicConfig = await readFile(new URL("../public-config.js", import.meta.url), "utf8");
const appJs = await readFile(new URL("../src/components/app.js", import.meta.url), "utf8");
const lifeZoneRepository = await readFile(new URL("../src/data/lifeZoneRepository.js", import.meta.url), "utf8");
const workplaceOptions = await readFile(new URL("../src/data/workplaceOptions.js", import.meta.url), "utf8");
const publicConfigIndex = indexHtml.indexOf("./public-config.js");
const mainScriptIndex = indexHtml.indexOf("./src/main.js");

if (publicConfigIndex === -1) {
  throw new Error("index.html must load public-config.js.");
}

if (mainScriptIndex === -1) {
  throw new Error("index.html must load src/main.js.");
}

if (publicConfigIndex > mainScriptIndex) {
  throw new Error("public-config.js must load before src/main.js.");
}

if (publicConfig.includes("NAVER_MAP_CLIENT_SECRET")) {
  throw new Error("public-config.js must not contain NAVER_MAP_CLIENT_SECRET.");
}

if (!publicConfig.includes("LIFE_ZONE_DATA_MODE")) {
  throw new Error("public-config.js must define LIFE_ZONE_DATA_MODE.");
}

if (!lifeZoneRepository.includes("generatedLifeZones") || !lifeZoneRepository.includes("mockLifeZones")) {
  throw new Error("lifeZoneRepository.js must keep generatedLifeZones first and mockLifeZones fallback.");
}

if (!workplaceOptions.includes("generatedLifeZones") || !workplaceOptions.includes("cheonanAsanEmdCenters")) {
  throw new Error("workplaceOptions.js must support generated and mock workplace sources.");
}

if (!appJs.includes("48개 전체 후보 기준") && !appJs.includes("lifeZoneDataset.lifeZones.length")) {
  throw new Error("app.js must show the generated recommendation candidate count.");
}

if (!Array.isArray(generatedLifeZones) || generatedLifeZones.length !== 48) {
  throw new Error("generatedLifeZones must contain 48 Cheonan/Asan life zones.");
}

const generatedCityCounts = generatedLifeZones.reduce((counts, zone) => ({
  ...counts,
  [zone.city]: (counts[zone.city] ?? 0) + 1
}), {});

if (generatedCityCounts["천안시"] !== 31 || generatedCityCounts["아산시"] !== 17) {
  throw new Error("generatedLifeZones must include 31 Cheonan zones and 17 Asan zones.");
}

if (!generatedLifeZones.every((zone) => zone.dataSource === "preprocessed-csv" && zone.isGenerated === true)) {
  throw new Error("generatedLifeZones must be marked as preprocessed-csv generated data.");
}

const lifeZoneDataset = getLifeZoneDataset();

if (lifeZoneDataset.sourceType !== "generated" || lifeZoneDataset.lifeZones.length !== 48) {
  throw new Error("getLifeZoneDataset must return generated life zones before mock fallback.");
}

const mockDataset = getLifeZoneDataset({ dataMode: "mock" });

if (mockDataset.sourceType !== "mock" || mockDataset.lifeZones !== mockLifeZones) {
  throw new Error("getLifeZoneDataset must return mockLifeZones only in mock mode.");
}

const scoredZones = assignRelativeGrades(calculateLifeZoneScores(mockLifeZones, {
  transportImportance: "medium",
  cultureSportsImportance: "medium",
  safetyMedicalImportance: "medium"
}));
const result = getTopAndLowZones(scoredZones);

if (mockLifeZones.length < 8) {
  throw new Error("mock 생활권 데이터는 최소 8개 이상이어야 합니다.");
}

if (result.recommendedZones.length !== 2 || !result.lowZone || result.displayZones.length !== 3) {
  throw new Error("결과는 추천 2개와 비추천 1개로 구성되어야 합니다.");
}

console.log("Static app verification passed.");
