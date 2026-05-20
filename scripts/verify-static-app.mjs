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
  "api/commute/_driving-core.js",
  "api/commute/driving.js",
  "api/commute/driving-batch.js",
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
  "src/utils/naverDirectionsUrl.js",
  "src/utils/drivingCommuteApi.js",
  "src/utils/odsayTransitApi.js",
  "src/utils/commuteApiPolicy.js",
  "src/utils/geoJsonPolygon.js",
  "src/utils/cheonanAsanMapBounds.js",
  "src/utils/pointInPolygon.js",
  "src/utils/geoDistance.js",
  "src/utils/commuteEstimator.js",
  "src/utils/commutePreselection.js",
  "src/utils/commuteScoring.js",
  "src/utils/commuteFeasibility.js",
  "src/utils/riHighlights.js",
  "src/utils/lifeZoneCommuteScoring.js",
  "src/utils/lifeZoneScoring.js",
  "src/types/lifeZone.ts",
  "docs/data-scoring-plan.md",
  "docs/generated-life-zones-summary.md",
  "docs/preprocessed-csv-diagnosis.md",
  "docs/vercel-directions-setup.md",
  ".env.example",
  "tests/cheonanAsanMapBounds.test.mjs",
  "tests/commuteFeasibility.test.mjs",
  "tests/commutePreselection.test.mjs",
  "tests/commuteTimeInput.test.mjs",
  "tests/drivingApiActualOnly.test.mjs",
  "tests/drivingApiDiagnostics.test.mjs",
  "tests/odsayTransitApi.test.mjs",
  "tests/commuteApiPolicy.test.mjs",
  "tests/mapFocusBehavior.test.mjs",
  "tests/naverDirectionsUrl.test.mjs",
  "tests/riHighlights.test.mjs",
  "tests/uiTextCleanup.test.mjs",
  "tests/uiLayoutCleanup.test.mjs"
];

await Promise.all(requiredFiles.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")));

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
const publicConfig = await readFile(new URL("../public-config.js", import.meta.url), "utf8");
const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const vercelStaticBuild = await readFile(new URL("../scripts/build-vercel-static.mjs", import.meta.url), "utf8");
const appJs = await readFile(new URL("../src/components/app.js", import.meta.url), "utf8");
const naverMapView = await readFile(new URL("../src/components/NaverMapView.js", import.meta.url), "utf8");
const lifeZoneRepository = await readFile(new URL("../src/data/lifeZoneRepository.js", import.meta.url), "utf8");
const workplaceOptions = await readFile(new URL("../src/data/workplaceOptions.js", import.meta.url), "utf8");
const commuteFeasibility = await readFile(new URL("../src/utils/commuteFeasibility.js", import.meta.url), "utf8");
const commuteEstimator = await readFile(new URL("../src/utils/commuteEstimator.js", import.meta.url), "utf8");
const commutePreselection = await readFile(new URL("../src/utils/commutePreselection.js", import.meta.url), "utf8");
const commuteScoring = await readFile(new URL("../src/utils/commuteScoring.js", import.meta.url), "utf8");
const riHighlights = await readFile(new URL("../src/utils/riHighlights.js", import.meta.url), "utf8");
const drivingCommuteApi = await readFile(new URL("../src/utils/drivingCommuteApi.js", import.meta.url), "utf8");
const odsayTransitApi = await readFile(new URL("../src/utils/odsayTransitApi.js", import.meta.url), "utf8");
const commuteApiPolicy = await readFile(new URL("../src/utils/commuteApiPolicy.js", import.meta.url), "utf8");
const drivingApiCore = await readFile(new URL("../api/commute/_driving-core.js", import.meta.url), "utf8");
const drivingApiRoute = await readFile(new URL("../api/commute/driving.js", import.meta.url), "utf8");
const drivingBatchApiRoute = await readFile(new URL("../api/commute/driving-batch.js", import.meta.url), "utf8");
const vercelDirectionsSetup = await readFile(new URL("../docs/vercel-directions-setup.md", import.meta.url), "utf8");
const cheonanAsanMapBounds = await readFile(new URL("../src/utils/cheonanAsanMapBounds.js", import.meta.url), "utf8");
const naverDirectionsUrl = await readFile(new URL("../src/utils/naverDirectionsUrl.js", import.meta.url), "utf8");
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

if (!publicConfig.includes("PUBLIC_ODSAY_URI_API_KEY")) {
  throw new Error("public-config.js must define PUBLIC_ODSAY_URI_API_KEY as a public URI/Web key placeholder.");
}

if (!vercelStaticBuild.includes("process.env.PUBLIC_ODSAY_URI_API_KEY")) {
  throw new Error("build-vercel-static.mjs must inject PUBLIC_ODSAY_URI_API_KEY from the Vercel environment.");
}

if (!odsayTransitApi.includes("URLSearchParams") || !odsayTransitApi.includes("searchPubTransPathT")) {
  throw new Error("odsayTransitApi.js must build ODsay URI/Web requests with URLSearchParams.");
}

if (
  !odsayTransitApi.includes("MISSING_ODSAY_URI_KEY") ||
  !odsayTransitApi.includes("ODSAY_AUTH_FAILED") ||
  !odsayTransitApi.includes("ODSAY_TOO_CLOSE") ||
  !odsayTransitApi.includes("durationMinutes: null") ||
  !odsayTransitApi.includes("isActualApiValue: false")
) {
  throw new Error("odsayTransitApi.js must normalize ODsay success/failure without fallback transit minutes.");
}

if (!commuteApiPolicy.includes("shouldFetchDrivingCommute") || !commuteApiPolicy.includes("shouldFetchOdsayTransit")) {
  throw new Error("commuteApiPolicy.js must separate selected commute-mode API calls.");
}

if (
  !commuteApiPolicy.includes("DEFAULT_COMMUTE_API_MODE") ||
  !commuteApiPolicy.includes(": DEFAULT_COMMUTE_API_MODE")
) {
  throw new Error("commuteApiPolicy.js must normalize legacy commute modes to a valid default mode.");
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

if (!appJs.includes("getVisibleRiHighlightSentences")) {
  throw new Error("app.js must use 읍/면-only ri highlight visibility.");
}

if (appJs.includes("아직 모름") || appJs.includes('data-commute-mode="unknown"') || appJs.includes('{ value: "unknown"')) {
  throw new Error("app.js must not expose the legacy unknown commute mode option.");
}

if (!riHighlights.includes("getTopRiHighlightGroups") || !riHighlights.includes("의 ${group.axisLabel}가 우수")) {
  throw new Error("riHighlights.js must group top ri highlights by axis and use 의 wording.");
}

if (!appJs.includes("shouldFocusSelectedZoneOnMap") || !appJs.includes("focusSelectedLifeZone")) {
  throw new Error("app.js must request map focus when a recommendation card is selected.");
}

if (appJs.includes("map-toolbar") || appJs.includes("map-search") || appJs.includes("map-filter")) {
  throw new Error("app.js must not render the old map search field or top map filter buttons.");
}

if (!naverMapView.includes("getCheonanAsanMapBounds") || !naverMapView.includes("applyMapBoundsGuard")) {
  throw new Error("NaverMapView.js must apply Cheonan-Asan map bounds.");
}

if (
  !naverMapView.includes("focusLifeZoneOnMap") ||
  !naverMapView.includes("getLifeZoneFocusTarget") ||
  !naverMapView.includes("createFeatureLatLngBounds")
) {
  throw new Error("NaverMapView.js must focus the map on a selected life zone.");
}

if (!naverMapView.includes("createOutsideMaskPolygons") || !naverMapView.includes("filterCheonanAsanMapResults")) {
  throw new Error("NaverMapView.js must mask outside Cheonan-Asan and filter map results.");
}

if (!cheonanAsanMapBounds.includes("doBoundsIntersect") || !cheonanAsanMapBounds.includes("shouldRestoreToCheonanAsan")) {
  throw new Error("cheonanAsanMapBounds.js must detect full viewport departure from Cheonan-Asan.");
}

if (!naverMapView.includes("getNaverMapViewportBounds") || naverMapView.includes("createBoundarySvgMaskOverlay")) {
  throw new Error("NaverMapView.js must restore escaped map views without the fixed SVG boundary mask overlay.");
}

if (!naverDirectionsUrl.includes("buildNaverDirectionsUrl") || !naverDirectionsUrl.includes("[\"menu\", \"route\"]")) {
  throw new Error("naverDirectionsUrl.js must build a Naver route URL.");
}

if (!appJs.includes("buildNaverDirectionsUrl") || !appJs.includes("네이버 길찾기")) {
  throw new Error("app.js must render Naver directions links from workplace to life zone.");
}

if (!drivingCommuteApi.includes("isActualApiValue") || !drivingCommuteApi.includes("durationMinutes: null")) {
  throw new Error("drivingCommuteApi.js must distinguish actual Naver driving values from unavailable values.");
}

if (!drivingCommuteApi.includes("fetchDrivingCommuteBatch") || !appJs.includes("fetchDrivingCommuteBatch")) {
  throw new Error("app.js must fetch Vercel driving commute results before car-mode scoring.");
}

if (
  !appJs.includes("fetchOdsayTransitCommutes") ||
  !appJs.includes("shouldFetchDrivingCommute") ||
  !appJs.includes("shouldFetchOdsayTransit") ||
  !appJs.includes("isCalculating") ||
  !appJs.includes("ODsay 대중교통 기준")
) {
  throw new Error("app.js must fetch only the selected commute API and show loading/ODsay transit status.");
}

if (
  !appJs.includes("buildCommuteApiPreselection") ||
  !appJs.includes("apiTargetZones") ||
  !appJs.includes("recommendationShortlistIds") ||
  !commutePreselection.includes("preApiScore") ||
  !commutePreselection.includes("proxyCommuteScore") ||
  !commutePreselection.includes("SHORTLIST_LIMITS")
) {
  throw new Error("app.js must preselect commute API targets from proxy-scored candidates before external calls.");
}

if (
  !drivingApiCore.includes("MISSING_NAVER_ENV") ||
  !drivingApiCore.includes("NAVER_DIRECTIONS_FORBIDDEN") ||
  !drivingApiCore.includes("NAVER_DIRECTIONS_RATE_LIMITED") ||
  !drivingApiCore.includes("durationMinutes: null") ||
  !drivingApiCore.includes("hasClientSecret") ||
  !drivingApiCore.includes("hasDirectionsBaseUrl")
) {
  throw new Error("driving API core must expose safe diagnostics and never synthesize fallback car minutes.");
}

if (
  !drivingApiCore.includes("https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving") ||
  !drivingApiCore.includes("X-NCP-APIGW-API-KEY-ID") ||
  !drivingApiCore.includes("X-NCP-APIGW-API-KEY")
) {
  throw new Error("driving API core must call the Naver Directions 5 endpoint with NCP headers.");
}

if (!drivingApiRoute.includes("createDrivingCommuteResponse") || !drivingBatchApiRoute.includes("createDrivingBatchResponse")) {
  throw new Error("Vercel driving API routes must delegate to the tested driving core.");
}

if (
  !vercelDirectionsSetup.includes("NAVER_MAP_CLIENT_ID") ||
  !vercelDirectionsSetup.includes("NAVER_MAP_CLIENT_SECRET") ||
  !vercelDirectionsSetup.includes("NAVER_DIRECTIONS_BASE_URL") ||
  !vercelDirectionsSetup.includes("재배포")
) {
  throw new Error("vercel-directions-setup.md must document Vercel Directions environment setup.");
}

if (
  !appJs.includes("panel-summary") ||
  !appJs.includes("renderResultActions()") ||
  !appJs.includes("renderMapDataSourceBadge()") ||
  !appJs.includes("result-data-source-badge")
) {
  throw new Error("app.js must use compact result-panel summary, map source badge, and reset action below result cards.");
}

if (appJs.includes("renderResultDataSourceBadge()")) {
  throw new Error("app.js must not render the data source badge inside the right result panel.");
}

if (appJs.includes("추천 ${bundle.recommendedZones.length}개 · 비추천")) {
  throw new Error("app.js must not show the result-count copy in the right result panel.");
}

if (!commuteEstimator.includes("car: null") || commuteEstimator.includes("car: estimateCarMinutes")) {
  throw new Error("commuteEstimator.js must not place distance fallback car minutes into commuteTimes.car.");
}

if (!commuteScoring.includes("MIN_TARGET_MINUTES = 10") || !commuteScoring.includes("MAX_TARGET_MINUTES = 90")) {
  throw new Error("commuteScoring.js must clamp target commute minutes to 10-90.");
}

if (!appJs.includes("data-commute-target-display") || appJs.includes("data-commute-target-number")) {
  throw new Error("app.js must show target commute minutes as text without the old number box.");
}

if (appJs.includes("getNaverMapSearchUrl") || appJs.includes("map-filters")) {
  throw new Error("app.js must not render the old map search link or top map filter buttons.");
}

if (appJs.includes("주요 리 인프라")) {
  throw new Error("app.js must not show the old ri highlight heading.");
}

if (appJs.includes("지역, 역, 학교") || appJs.includes("지역, 역, 학교 검색")) {
  throw new Error("app.js must not show the old map search placeholder.");
}

[
  "Naver Maps 행정동 경계",
  "지도 연결선은 실제 길찾기 경로가 아니라 위치 비교용 선입니다.",
  "천안·아산 행정동 생활권 48개 전체 후보 기준",
  "생활 인프라 선호도",
  "입력한 조건을 기준으로 추천 생활권을 보여줍니다.",
  "생활권 추천 조건 설정",
  "실제 전처리 csv의 인프라 분포로 계산했습니다",
  "실제 전처리 CSV의 인프라 분포로 계산했습니다",
  "실제 csv 기준",
  "실제 CSV 기준",
  "지도는 천안·아산 생활권 중심으로 제한되며, 외 지역은 흐리게 표시됩니다"
].forEach((removedText) => {
  if (appJs.includes(removedText)) {
    throw new Error(`app.js must not show removed UI copy: ${removedText}`);
  }
});

if (naverDirectionsUrl.includes("NAVER_MAP_CLIENT_SECRET")) {
  throw new Error("naverDirectionsUrl.js must not reference NAVER_MAP_CLIENT_SECRET.");
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
