#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NO_DISTRICT = "해당 없음";
const TARGET_CITIES = new Set(["천안시", "아산시"]);
const CHEONAN_DONGNAM_PREFIX = "44131";
const CHEONAN_SEOBUK_PREFIX = "44133";
const ASAN_PREFIX = "44200";
const SHAPEFILE_EXTENSIONS = new Set([".shp", ".dbf", ".shx", ".prj", ".cpg"]);

const PROPERTY_CANDIDATES = {
  emdCode: [
    "emdCode",
    "emd_cd",
    "EMD_CD",
    "emdCode",
    "EMD_CODE",
    "adm_cd",
    "ADM_CD",
    "code",
    "CODE",
    "법정동코드",
    "행정구역코드",
    "행정동코드"
  ],
  city: [
    "city",
    "sigungu",
    "SIGUNGU",
    "sig_kor_nm",
    "SIG_KOR_NM",
    "sig_nm",
    "SIG_NM",
    "sgg_nm",
    "SGG_NM",
    "시군구",
    "시군구명",
    "행정구역명"
  ],
  district: [
    "district",
    "gu",
    "GU",
    "gu_nm",
    "GU_NM",
    "district_nm",
    "DISTRICT_NM",
    "구",
    "구명"
  ],
  emdName: [
    "emdName",
    "emd_kor_nm",
    "EMD_KOR_NM",
    "emd_nm",
    "EMD_NM",
    "dong_nm",
    "DONG_NM",
    "읍면동",
    "읍면동명",
    "행정동명",
    "법정동명"
  ],
  fullName: [
    "fullName",
    "full_nm",
    "FULL_NM",
    "adm_nm",
    "ADM_NM",
    "adm_name",
    "ADM_NAME",
    "주소",
    "행정구역명",
    "법정동명"
  ]
};

export function parseArgs(argv = []) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--input" || token === "-i") {
      args.input = argv[index + 1];
      index += 1;
    } else if (token === "--output" || token === "-o") {
      args.output = argv[index + 1];
      index += 1;
    } else if (token === "--help" || token === "-h") {
      args.help = true;
    }
  }

  return args;
}

export function createCheonanAsanBoundaryGeoJson(inputGeoJson, { generatedAt = new Date().toISOString() } = {}) {
  assertFeatureCollection(inputGeoJson);

  const features = inputGeoJson.features
    .map(normalizeVworldFeature)
    .filter(Boolean);

  return {
    type: "FeatureCollection",
    metadata: {
      source: "vworld",
      description: "VWorld 읍면동 행정경계 데이터를 천안·아산 지역으로 필터링한 데이터",
      isSample: false,
      generatedAt,
      featureCount: features.length
    },
    features
  };
}

export function normalizeVworldFeature(feature) {
  if (!isSupportedBoundaryGeometry(feature?.geometry)) return null;

  const properties = feature.properties ?? {};
  const textBlob = getPropertyText(properties);
  const emdCode = normalizeText(readProperty(properties, PROPERTY_CANDIDATES.emdCode));
  const city = resolveCity(readProperty(properties, PROPERTY_CANDIDATES.city), textBlob, emdCode);

  if (!TARGET_CITIES.has(city)) return null;

  const district = resolveDistrict(
    readProperty(properties, PROPERTY_CANDIDATES.district),
    textBlob,
    city,
    emdCode
  );
  const emdName = resolveEmdName(
    readProperty(properties, PROPERTY_CANDIDATES.emdName),
    readProperty(properties, PROPERTY_CANDIDATES.fullName),
    textBlob
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
      source: "vworld"
    },
    geometry: feature.geometry
  };
}

export function createBoundaryModuleSource(boundaryGeoJson) {
  const serializedGeoJson = JSON.stringify(boundaryGeoJson, null, 2);

  return `const NO_DISTRICT = "해당 없음";
const LEGACY_EMD_CODE_ALIASES = {
  "44133101": ["34012630"],
  "44133102": ["34012540"],
  "44133103": ["34012510"],
  "44131101": ["34011590"],
  "44200101": ["34040510"],
  "44200250": ["34040120"],
  "44200330": ["34040330"],
  "44200350": ["34040350"]
};
const LEGACY_EMD_NAME_ALIASES = [
  { city: "천안시", district: "서북구", source: "불당동", targets: ["불당2동"] },
  { city: "천안시", district: "서북구", source: "쌍용동", targets: ["쌍용2동"] },
  { city: "천안시", district: "서북구", source: "성정동", targets: ["성정1동"] },
  { city: "천안시", district: "동남구", source: "신부동", targets: ["신안동"] },
  { city: "천안시", district: "동남구", source: "청수동", targets: ["청룡동"] }
];

export const cheonanAsanEmdBoundaryGeoJson = ${serializedGeoJson};

export function getBoundaryFeatureByEmdCode(emdCode) {
  if (!emdCode) return null;

  const targetCode = normalizeText(emdCode);
  const exactFeature = cheonanAsanEmdBoundaryGeoJson.features.find((feature) => (
    normalizeText(getFeatureIdentity(feature).emdCode) === targetCode
  ));

  if (exactFeature) return exactFeature;

  const aliasedCodes = LEGACY_EMD_CODE_ALIASES[targetCode] ?? [];

  return cheonanAsanEmdBoundaryGeoJson.features.find((feature) => (
    aliasedCodes.includes(normalizeText(getFeatureIdentity(feature).emdCode))
  )) ?? null;
}

export function getBoundaryFeatureByName({ city, district, emdName } = {}) {
  if (!city || !emdName) return null;

  const targetCity = normalizeText(city);
  const targetDistrict = normalizeDistrict(district, targetCity);
  const targetEmdName = normalizeText(emdName);

  const exactFeature = cheonanAsanEmdBoundaryGeoJson.features.find((feature) => {
    const identity = getFeatureIdentity(feature);

    return normalizeText(identity.city) === targetCity &&
      normalizeDistrict(identity.district, targetCity) === targetDistrict &&
      normalizeText(identity.emdName) === targetEmdName;
  });

  if (exactFeature) return exactFeature;

  const aliasedNames = getAliasedEmdNames(targetCity, targetDistrict, targetEmdName);

  return cheonanAsanEmdBoundaryGeoJson.features.find((feature) => {
    const identity = getFeatureIdentity(feature);

    return normalizeText(identity.city) === targetCity &&
      normalizeDistrict(identity.district, targetCity) === targetDistrict &&
      aliasedNames.includes(normalizeText(identity.emdName));
  }) ?? null;
}

export function hasBoundaryForEmd({ emdCode, city, district, emdName } = {}) {
  return Boolean(
    getBoundaryFeatureByEmdCode(emdCode) ??
      getBoundaryFeatureByName({ city, district, emdName })
  );
}

export function getAllBoundaryFeatures() {
  return [...cheonanAsanEmdBoundaryGeoJson.features];
}

function getFeatureIdentity(feature = {}) {
  const properties = feature.properties ?? {};

  return {
    emdCode: properties.emdCode ?? properties.EMD_CD ?? properties.emd_cd ?? "",
    city: properties.city ?? "",
    district: properties.district ?? NO_DISTRICT,
    emdName: properties.emdName ?? properties.EMD_KOR_NM ?? properties.emd_kor_nm ?? ""
  };
}

function normalizeDistrict(district, city = "") {
  const normalizedDistrict = normalizeText(district);

  if (normalizedDistrict) return normalizedDistrict;
  return city === "아산시" ? NO_DISTRICT : NO_DISTRICT;
}

function getAliasedEmdNames(city, district, emdName) {
  const alias = LEGACY_EMD_NAME_ALIASES.find((item) => (
    item.city === city &&
    normalizeDistrict(item.district, city) === district &&
    item.source === emdName
  ));

  return alias?.targets ?? [];
}

function normalizeText(value) {
  return value == null ? "" : String(value).trim();
}
`;
}

export async function prepareVworldBoundaries({ input, output }) {
  if (!input || !output) {
    throw new Error(getUsageMessage());
  }

  assertGeoJsonInputPath(input);

  const inputGeoJson = JSON.parse(await readFile(input, "utf8"));
  const boundaryGeoJson = createCheonanAsanBoundaryGeoJson(inputGeoJson);

  if (boundaryGeoJson.features.length === 0) {
    throw new Error("천안·아산 읍면동 feature를 찾지 못했습니다. output 파일을 덮어쓰지 않습니다.");
  }

  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, createBoundaryModuleSource(boundaryGeoJson), "utf8");

  return boundaryGeoJson;
}

export function getUsageMessage() {
  return [
    "Usage:",
    "  node scripts/prepare-vworld-boundaries.mjs --input ./data/map/vworld_emd.geojson --output ./src/data/cheonanAsanEmdBoundaries.js",
    "",
    "SHP 파일은 이 스크립트에서 직접 처리하지 않습니다. QGIS, mapshaper, ogr2ogr 등으로 GeoJSON FeatureCollection으로 변환한 뒤 입력하세요."
  ].join("\\n");
}

function assertFeatureCollection(inputGeoJson) {
  if (inputGeoJson?.type !== "FeatureCollection" || !Array.isArray(inputGeoJson.features)) {
    throw new Error("입력 파일은 GeoJSON FeatureCollection이어야 합니다.");
  }
}

function assertGeoJsonInputPath(inputPath) {
  const extension = path.extname(inputPath).toLowerCase();

  if (SHAPEFILE_EXTENSIONS.has(extension)) {
    throw new Error("SHP 파일은 직접 처리하지 않습니다. 먼저 GeoJSON FeatureCollection으로 변환한 뒤 다시 실행하세요.");
  }

  if (extension !== ".geojson" && extension !== ".json") {
    throw new Error("지원 입력 형식은 .geojson 또는 .json GeoJSON FeatureCollection입니다.");
  }
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

  if (text.includes("천안시") || isCheonanCode(emdCode)) return "천안시";
  if (text.includes("아산시") || isAsanCode(emdCode)) return "아산시";

  return normalizeText(rawCity);
}

function resolveDistrict(rawDistrict, textBlob, city, emdCode) {
  const text = `${normalizeText(rawDistrict)} ${textBlob}`;

  if (text.includes("동남구") || String(emdCode).startsWith(CHEONAN_DONGNAM_PREFIX)) return "동남구";
  if (text.includes("서북구") || String(emdCode).startsWith(CHEONAN_SEOBUK_PREFIX)) return "서북구";
  if (city === "아산시") return NO_DISTRICT;

  return normalizeText(rawDistrict) || NO_DISTRICT;
}

function resolveEmdName(rawEmdName, rawFullName, textBlob) {
  const directName = normalizeAdministrativeAreaName(rawEmdName);

  if (directName) return directName;

  const fullName = normalizeText(rawFullName) || textBlob;
  const tokens = fullName.split(/\s+/).filter(Boolean);
  const administrativeToken = [...tokens].reverse().find((token) => /[읍면동]$/.test(token));

  return normalizeAdministrativeAreaName(administrativeToken);
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

function normalizeText(value) {
  return value == null ? "" : String(value).trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(getUsageMessage());
    return;
  }

  const result = await prepareVworldBoundaries(args);
  console.log(`VWorld boundary conversion complete. featureCount=${result.metadata.featureCount}`);
}

const currentScriptPath = fileURLToPath(import.meta.url);
const invokedScriptPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedScriptPath === currentScriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
