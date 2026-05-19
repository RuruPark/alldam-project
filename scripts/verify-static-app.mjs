import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
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
  "vercel.json",
  "scripts/build-vercel-static.mjs",
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
  "src/utils/cheonanAsanMapBounds.js",
  "src/utils/pointInPolygon.js",
  "src/utils/geoDistance.js",
  "src/utils/commuteEstimator.js",
  "src/utils/commuteScoring.js",
  "src/utils/commuteFeasibility.js",
  "src/utils/riHighlights.js",
  "src/utils/lifeZoneCommuteScoring.js",
  "src/utils/lifeZoneScoring.js",
  "src/types/lifeZone.ts",
  "docs/data-scoring-plan.md",
  "docs/generated-life-zones-summary.md",
  "docs/preprocessed-csv-diagnosis.md",
  ".env.example",
  "tests/cheonanAsanMapBounds.test.mjs",
  "tests/commuteFeasibility.test.mjs",
  "tests/riHighlights.test.mjs"
];

await Promise.all(requiredFiles.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")));

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const publicConfig = await readFile(new URL("../public-config.js", import.meta.url), "utf8");
const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const appJs = await readFile(new URL("../src/components/app.js", import.meta.url), "utf8");
const naverMapView = await readFile(new URL("../src/components/NaverMapView.js", import.meta.url), "utf8");
const lifeZoneRepository = await readFile(new URL("../src/data/lifeZoneRepository.js", import.meta.url), "utf8");
const workplaceOptions = await readFile(new URL("../src/data/workplaceOptions.js", import.meta.url), "utf8");
const commuteFeasibility = await readFile(new URL("../src/utils/commuteFeasibility.js", import.meta.url), "utf8");
const cheonanAsanMapBounds = await readFile(new URL("../src/utils/cheonanAsanMapBounds.js", import.meta.url), "utf8");
const publicConfigIndex = indexHtml.indexOf("./public-config.js");
const mainScriptIndex = indexHtml.indexOf("./src/main.js");

async function collectFiles(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryUrl = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directoryUrl);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryUrl));
    } else if (entry.isFile()) {
      files.push(entryUrl);
    }
  }

  return files;
}

async function assertFilesDoNotContain(files, searchText, label) {
  const matches = [];

  for (const file of files) {
    const content = await readFile(file, "utf8");

    if (content.includes(searchText)) {
      matches.push(fileURLToPath(file));
    }
  }

  if (matches.length > 0) {
    throw new Error(`${label} must not contain ${searchText}: ${matches.join(", ")}`);
  }
}

if (publicConfigIndex === -1) {
  throw new Error("index.html must load public-config.js.");
}

if (mainScriptIndex === -1) {
  throw new Error("index.html must load src/main.js.");
}

if (publicConfigIndex > mainScriptIndex) {
  throw new Error("public-config.js must load before src/main.js.");
}

if (vercelConfig.outputDirectory !== "dist") {
  throw new Error("vercel.json must set outputDirectory to dist.");
}

const vercelBuildCommand = String(vercelConfig.buildCommand ?? "");

if (
  !vercelBuildCommand.includes("scripts/verify-static-app.mjs") ||
  !vercelBuildCommand.includes("scripts/build-vercel-static.mjs")
) {
  throw new Error("vercel.json buildCommand must run verify-static-app.mjs and build-vercel-static.mjs.");
}

if (publicConfig.includes("NAVER_MAP_CLIENT_SECRET")) {
  throw new Error("public-config.js must not contain NAVER_MAP_CLIENT_SECRET.");
}

await assertFilesDoNotContain(
  await collectFiles(new URL("../src/", import.meta.url)),
  "NAVER_MAP_CLIENT_SECRET",
  "src"
);

if (!publicConfig.includes("LIFE_ZONE_DATA_MODE")) {
  throw new Error("public-config.js must define LIFE_ZONE_DATA_MODE.");
}

if (!lifeZoneRepository.includes("generatedLifeZones") || !lifeZoneRepository.includes("mockLifeZones")) {
  throw new Error("lifeZoneRepository.js must keep generatedLifeZones first and mockLifeZones fallback.");
}

if (!workplaceOptions.includes("generatedLifeZones") || !workplaceOptions.includes("cheonanAsanEmdCenters")) {
  throw new Error("workplaceOptions.js must support generated and mock workplace sources.");
}

if (!appJs.includes("getTopAndLowZonesWithCommuteFeasibility") || !appJs.includes("commuteFeasibilityNotice")) {
  throw new Error("app.js must use commute feasibility filtering for top recommendations.");
}

if (!appJs.includes("getVisibleRiHighlights")) {
  throw new Error("app.js must use 읍/면-only ri highlight visibility.");
}

if (!naverMapView.includes("getCheonanAsanMapBounds") || !naverMapView.includes("applyMapBoundsGuard")) {
  throw new Error("NaverMapView.js must apply Cheonan-Asan map bounds.");
}

if (!naverMapView.includes("createOutsideMaskPolygons") || !naverMapView.includes("filterCheonanAsanMapResults")) {
  throw new Error("NaverMapView.js must mask outside Cheonan-Asan and filter map results.");
}

if (!cheonanAsanMapBounds.includes("doBoundsIntersect") || !cheonanAsanMapBounds.includes("shouldRestoreToCheonanAsan")) {
  throw new Error("cheonanAsanMapBounds.js must detect full viewport departure from Cheonan-Asan.");
}

if (!naverMapView.includes("getNaverMapViewportBounds") || !naverMapView.includes("createBoundarySvgMaskOverlay")) {
  throw new Error("NaverMapView.js must restore escaped map views and apply the boundary mask overlay.");
}
if (!commuteFeasibility.includes("getCommuteFeasibilityStatus") || !commuteFeasibility.includes("isCommuteRecommendedCandidate")) {
  throw new Error("commuteFeasibility.js must expose feasibility status helpers.");
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
