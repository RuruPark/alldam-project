import { readFile } from "node:fs/promises";
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
  "src/main.js",
  "src/components/app.js",
  "src/components/NaverMapView.js",
  "src/data/cheonanAsanEmdCenters.js",
  "src/data/cheonanAsanEmdBoundaries.js",
  "src/data/mockLifeZones.js",
  "src/utils/naverMapLoader.js",
  "src/utils/geoJsonPolygon.js",
  "src/utils/geoDistance.js",
  "src/utils/commuteEstimator.js",
  "src/utils/commuteScoring.js",
  "src/utils/lifeZoneCommuteScoring.js",
  "src/utils/lifeZoneScoring.js",
  "src/types/lifeZone.ts",
  "docs/data-scoring-plan.md",
  ".env.example"
];

await Promise.all(requiredFiles.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")));

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const publicConfig = await readFile(new URL("../public-config.js", import.meta.url), "utf8");
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
