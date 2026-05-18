#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBoundaryModuleSource } from "./prepare-vworld-boundaries.mjs";

const NO_DISTRICT = "해당 없음";
const DEFAULT_SOURCE = "admin-boundary";
const MOLIT_SOURCE = "molit-census-boundary";
const TARGET_CITIES = new Set(["천안시", "아산시"]);
const CHEONAN_DONGNAM_PREFIX = "44131";
const CHEONAN_SEOBUK_PREFIX = "44133";
const ASAN_PREFIX = "44200";
const CENSUS_CHEONAN_PREFIX = "3401";
const CENSUS_CHEONAN_DONGNAM_PREFIX = "34011";
const CENSUS_CHEONAN_SEOBUK_PREFIX = "34012";
const CENSUS_ASAN_PREFIX = "3404";
const SHAPEFILE_EXTENSIONS = new Set([".shp", ".dbf", ".shx", ".prj", ".cpg"]);

const PROPERTY_CANDIDATES = {
  emdCode: [
    "emdCode",
    "admCd",
    "adm_cd",
    "ADM_CD",
    "admCode",
    "행정동코드",
    "법정동코드",
    "code",
    "CODE",
    "EMD_CD",
    "emd_cd"
  ],
  city: [
    "city",
    "시군구명",
    "sggNm",
    "sgg_nm",
    "SIG_KOR_NM",
    "district",
    "구명",
    "sidoNm",
    "시도명",
    "SIG_NM",
    "SGG_NM"
  ],
  district: [
    "district",
    "구명",
    "guNm",
    "gu_nm",
    "GU_NM",
    "sggNm",
    "sgg_nm",
    "SIG_KOR_NM",
    "시군구명"
  ],
  emdName: [
    "emdName",
    "admNm",
    "adm_nm",
    "ADM_NM",
    "admName",
    "행정동명",
    "법정동명",
    "읍면동명",
    "name",
    "NAME",
    "EMD_KOR_NM",
    "emd_kor_nm",
    "EMD_NM",
    "emd_nm"
  ],
  fullName: [
    "admNm",
    "adm_nm",
    "ADM_NM",
    "admName",
    "fullName",
    "full_nm",
    "FULL_NM",
    "행정구역명",
    "법정동명",
    "행정동명",
    "주소",
    "name",
    "NAME"
  ]
};

export function parseArgs(argv = []) {
  const args = {
    source: DEFAULT_SOURCE
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--input" || token === "-i") {
      args.input = argv[index + 1];
      index += 1;
    } else if (token === "--output" || token === "-o") {
      args.output = argv[index + 1];
      index += 1;
    } else if (token === "--source" || token === "-s") {
      args.source = argv[index + 1] || DEFAULT_SOURCE;
      index += 1;
    } else if (token === "--help" || token === "-h") {
      args.help = true;
    }
  }

  return args;
}

export function createAdminBoundaryGeoJson(inputGeoJson, {
  source = DEFAULT_SOURCE,
  generatedAt = new Date().toISOString()
} = {}) {
  assertFeatureCollection(inputGeoJson);

  const features = inputGeoJson.features
    .map((feature) => normalizeAdminBoundaryFeature(feature, { source }))
    .filter(Boolean);

  if (!hasOnlyWgs84Coordinates(features)) {
    throw new Error("경계 좌표가 WGS84 경위도 범위를 벗어났습니다. EPSG:4326 GeoJSON으로 변환한 뒤 다시 실행하세요.");
  }

  return {
    type: "FeatureCollection",
    metadata: {
      source,
      description: getDescription(source),
      isSample: false,
      generatedAt,
      featureCount: features.length
    },
    features
  };
}

export function normalizeAdminBoundaryFeature(feature, { source = DEFAULT_SOURCE } = {}) {
  if (!isSupportedBoundaryGeometry(feature?.geometry)) return null;

  const properties = feature.properties ?? {};
  const textBlob = getPropertyText(properties);
  const fullName = normalizeText(readProperty(properties, PROPERTY_CANDIDATES.fullName));
  const emdCode = normalizeText(readProperty(properties, PROPERTY_CANDIDATES.emdCode));
  const city = resolveCity(readProperty(properties, PROPERTY_CANDIDATES.city), `${fullName} ${textBlob}`, emdCode);

  if (!TARGET_CITIES.has(city)) return null;

  const district = resolveDistrict(
    readProperty(properties, PROPERTY_CANDIDATES.district),
    `${fullName} ${textBlob}`,
    city,
    emdCode
  );
  const emdName = resolveEmdName(
    readProperty(properties, PROPERTY_CANDIDATES.emdName),
    fullName || textBlob
  );

  if (!emdName) return null;

  return {
    type: "Feature",
    properties: {
      emdCode,
      city,
      district,
      emdName,
      isSample: false,
      source
    },
    geometry: feature.geometry
  };
}

export async function prepareAdminBoundaries({ input, output, source = DEFAULT_SOURCE }) {
  if (!input || !output) {
    throw new Error(getUsageMessage());
  }

  assertGeoJsonInputPath(input);

  const inputGeoJson = JSON.parse(await readFile(input, "utf8"));
  const samplePropertyKeys = getSamplePropertyKeys(inputGeoJson);
  const boundaryGeoJson = createAdminBoundaryGeoJson(inputGeoJson, { source });

  if (boundaryGeoJson.features.length === 0) {
    throw new Error("천안·아산 읍면동 feature를 찾지 못했습니다. output 파일을 덮어쓰지 않습니다.");
  }

  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, createBoundaryModuleSource(boundaryGeoJson), "utf8");

  return {
    boundaryGeoJson,
    samplePropertyKeys
  };
}

export function getUsageMessage() {
  return [
    "Usage:",
    "  node scripts/prepare-admin-boundaries.mjs --input ./data/행정동경계/admin_emd_4326.geojson --output ./src/data/cheonanAsanEmdBoundaries.js --source molit-census-boundary",
    "",
    "SHP 파일은 이 스크립트에서 직접 처리하지 않습니다. QGIS 또는 GDAL ogr2ogr로 WGS84(EPSG:4326) GeoJSON으로 변환한 뒤 입력하세요."
  ].join("\n");
}

export function getSamplePropertyKeys(inputGeoJson, limit = 20) {
  const properties = inputGeoJson?.features?.find((feature) => feature?.properties)?.properties ?? {};

  return Object.keys(properties).slice(0, limit);
}

function assertFeatureCollection(inputGeoJson) {
  if (inputGeoJson?.type !== "FeatureCollection" || !Array.isArray(inputGeoJson.features)) {
    throw new Error("입력 파일은 GeoJSON FeatureCollection이어야 합니다.");
  }
}

function assertGeoJsonInputPath(inputPath) {
  const extension = path.extname(inputPath).toLowerCase();

  if (SHAPEFILE_EXTENSIONS.has(extension)) {
    throw new Error("SHP 파일은 직접 처리하지 않습니다. 먼저 WGS84(EPSG:4326) GeoJSON FeatureCollection으로 변환한 뒤 다시 실행하세요.");
  }

  if (extension !== ".geojson" && extension !== ".json") {
    throw new Error("지원 입력 형식은 .geojson 또는 .json GeoJSON FeatureCollection입니다.");
  }
}

function getDescription(source) {
  if (source === MOLIT_SOURCE) {
    return "국토교통부 센서스경계 행정동경계 데이터를 천안·아산 지역으로 필터링한 데이터";
  }

  return "행정동경계 데이터를 천안·아산 지역으로 필터링한 데이터";
}

function hasOnlyWgs84Coordinates(features) {
  return features.every((feature) => geometryHasOnlyWgs84Coordinates(feature.geometry));
}

function geometryHasOnlyWgs84Coordinates(geometry) {
  const positions = collectPositions(geometry?.coordinates);

  return positions.length > 0 && positions.every((position) => {
    const lng = Number(position[0]);
    const lat = Number(position[1]);

    return Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90;
  });
}

function collectPositions(coordinates) {
  if (!Array.isArray(coordinates)) return [];

  if (coordinates.length >= 2 && typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    return [coordinates];
  }

  return coordinates.flatMap(collectPositions);
}

function isSupportedBoundaryGeometry(geometry) {
  return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

function readProperty(properties, candidateKeys) {
  for (const key of candidateKeys) {
    if (properties[key] != null && String(properties[key]).trim() !== "") {
      return properties[key];
    }
  }

  const lowerCaseMap = new Map(
    Object.keys(properties).map((key) => [key.toLowerCase(), key])
  );

  for (const key of candidateKeys) {
    const matchedKey = lowerCaseMap.get(key.toLowerCase());

    if (matchedKey && properties[matchedKey] != null && String(properties[matchedKey]).trim() !== "") {
      return properties[matchedKey];
    }
  }

  return "";
}

function getPropertyText(properties) {
  return Object.values(properties)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .map((value) => String(value))
    .join(" ");
}

function resolveCity(rawCity, textBlob, emdCode) {
  const text = `${normalizeText(rawCity)} ${textBlob}`;

  if (text.includes("천안시") || isCheonanCode(emdCode) || isCensusCheonanCode(emdCode)) return "천안시";
  if (text.includes("아산시") || isAsanCode(emdCode) || isCensusAsanCode(emdCode)) return "아산시";

  return normalizeText(rawCity);
}

function resolveDistrict(rawDistrict, textBlob, city, emdCode) {
  const text = `${normalizeText(rawDistrict)} ${textBlob}`;

  if (
    text.includes("동남구") ||
    String(emdCode).startsWith(CHEONAN_DONGNAM_PREFIX) ||
    String(emdCode).startsWith(CENSUS_CHEONAN_DONGNAM_PREFIX)
  ) return "동남구";
  if (
    text.includes("서북구") ||
    String(emdCode).startsWith(CHEONAN_SEOBUK_PREFIX) ||
    String(emdCode).startsWith(CENSUS_CHEONAN_SEOBUK_PREFIX)
  ) return "서북구";
  if (city === "아산시") return NO_DISTRICT;

  return normalizeText(rawDistrict) || NO_DISTRICT;
}

function resolveEmdName(rawEmdName, fullNameText) {
  const directName = normalizeAdministrativeAreaName(rawEmdName);

  if (directName) return directName;

  return normalizeAdministrativeAreaName(fullNameText);
}

function normalizeAdministrativeAreaName(value) {
  const text = normalizeText(value);

  if (!text) return "";

  const tokens = text.split(/\s+/).filter(Boolean);
  const administrativeToken = [...tokens].reverse().find((token) => /[읍면동]$/.test(token));

  return administrativeToken ?? text;
}

function isCheonanCode(emdCode) {
  const code = String(emdCode ?? "");

  return code.startsWith(CHEONAN_DONGNAM_PREFIX) || code.startsWith(CHEONAN_SEOBUK_PREFIX);
}

function isAsanCode(emdCode) {
  return String(emdCode ?? "").startsWith(ASAN_PREFIX);
}

function isCensusCheonanCode(emdCode) {
  return String(emdCode ?? "").startsWith(CENSUS_CHEONAN_PREFIX);
}

function isCensusAsanCode(emdCode) {
  return String(emdCode ?? "").startsWith(CENSUS_ASAN_PREFIX);
}

function normalizeText(value) {
  return value == null ? "" : String(value).trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(getUsageMessage());
    return;
  }

  const { boundaryGeoJson, samplePropertyKeys } = await prepareAdminBoundaries(args);
  console.log(`Admin boundary conversion complete. featureCount=${boundaryGeoJson.metadata.featureCount}`);
  console.log(`Input property keys sample: ${samplePropertyKeys.join(", ") || "(none)"}`);
}

const currentScriptPath = fileURLToPath(import.meta.url);
const invokedScriptPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedScriptPath === currentScriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
