#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  INFRASTRUCTURE_AXES,
  SCORE_AXIS_WEIGHTS,
  findInfrastructureConfigForFile,
  infrastructureCsvConfig
} from "../src/data/infrastructureCsvConfig.js";
import { cheonanAsanEmdBoundaryGeoJson } from "../src/data/cheonanAsanEmdBoundaries.js";
import { parseChungnamAddress } from "../src/utils/addressParser.js";
import { findBoundaryFeatureByPoint } from "../src/utils/pointInPolygon.js";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_INPUT_DIR = path.join(PROJECT_ROOT, "data", "전처리파일(csv)");
const DEFAULT_LIFE_ZONES_OUTPUT = path.join(PROJECT_ROOT, "src", "data", "generatedLifeZones.js");
const DEFAULT_JSON_OUTPUT = path.join(PROJECT_ROOT, "artifacts", "generated-life-zones-summary.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(PROJECT_ROOT, "docs", "generated-life-zones-summary.md");
const NO_DISTRICT = "해당 없음";
const ADDRESS_COLUMN_CANDIDATES = [
  "주소",
  "도로명주소",
  "소재지주소",
  "소재지",
  "위치",
  "지번주소",
  "전체주소",
  "사업장주소",
  "소재지도로명주소",
  "소재지지번주소",
  "역사도로명주소",
  "상세주소",
  "법  인  주  소"
];
const LAT_COLUMN_CANDIDATES = ["위도", "latitude", "lat", "y", "Y좌표", "위도좌표"];
const LNG_COLUMN_CANDIDATES = ["경도", "longitude", "lng", "lon", "x", "X좌표", "경도좌표"];
const AXIS_SHORT_LABELS = {
  traffic: "교통",
  living: "생활 편의",
  safetyMedical: "안전 의료"
};

export async function generateLifeZonesFromCsv({
  inputDir = DEFAULT_INPUT_DIR,
  lifeZonesOutput = DEFAULT_LIFE_ZONES_OUTPUT,
  jsonOutput = DEFAULT_JSON_OUTPUT,
  markdownOutput = DEFAULT_MARKDOWN_OUTPUT,
  boundaryGeoJson = cheonanAsanEmdBoundaryGeoJson,
  configs = infrastructureCsvConfig,
  writeOutputs = true
} = {}) {
  const csvFiles = await discoverCsvFiles(inputDir);
  const result = await createLifeZoneDataset({
    csvFiles,
    boundaryGeoJson,
    configs,
    inputDir
  });

  if (writeOutputs) {
    await mkdir(path.dirname(lifeZonesOutput), { recursive: true });
    await mkdir(path.dirname(jsonOutput), { recursive: true });
    await mkdir(path.dirname(markdownOutput), { recursive: true });
    await writeFile(lifeZonesOutput, createGeneratedLifeZonesModule(result), "utf8");
    await writeFile(jsonOutput, JSON.stringify(result.summary, null, 2), "utf8");
    await writeFile(markdownOutput, renderMarkdownSummary(result.summary), "utf8");
  }

  return result;
}

export async function createLifeZoneDataset({
  csvFiles = [],
  boundaryGeoJson = cheonanAsanEmdBoundaryGeoJson,
  configs = infrastructureCsvConfig,
  inputDir = DEFAULT_INPUT_DIR
} = {}) {
  const features = Array.isArray(boundaryGeoJson?.features) ? boundaryGeoJson.features : [];
  const aggregations = createBaseAggregations(features, configs);
  const fileSummaries = [];

  for (const filePath of csvFiles) {
    const fileName = path.basename(filePath);
    const config = findInfrastructureConfigForFile(fileName, configs);

    if (!config) {
      fileSummaries.push(createSkippedFileSummary(filePath, inputDir));
      continue;
    }

    const summary = await aggregateCsvFile({
      filePath,
      inputDir,
      config,
      aggregations,
      features
    });
    fileSummaries.push(summary);
  }

  const scoredLifeZones = scoreAggregations([...aggregations.values()], configs);
  const generatedLifeZones = scoredLifeZones
    .map(toGeneratedLifeZone)
    .sort((a, b) => {
      if (b.baseScore !== a.baseScore) return b.baseScore - a.baseScore;
      return a.name.localeCompare(b.name, "ko");
    });
  const summary = buildSummary({
    inputDir: path.relative(PROJECT_ROOT, inputDir) || ".",
    boundaryGeoJson,
    generatedLifeZones,
    fileSummaries,
    configs
  });

  return {
    generatedLifeZones,
    summary
  };
}

export async function discoverCsvFiles(inputDir = DEFAULT_INPUT_DIR) {
  const entries = await readdir(inputDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".csv"))
    .map((entry) => path.join(inputDir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b), "ko"));
}

async function aggregateCsvFile({ filePath, inputDir, config, aggregations, features }) {
  const buffer = await readFile(filePath);
  const decoded = decodeCsvText(buffer);
  const rows = parseCsv(decoded.text);
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => normalizeText(cell) !== ""));
  const fileSummary = {
    fileName: path.basename(filePath),
    relativePath: path.relative(PROJECT_ROOT, filePath),
    inputRelativePath: path.relative(inputDir, filePath),
    configId: config.id,
    label: config.label,
    axis: config.axis,
    matchMethod: config.matchMethod,
    rowCount: dataRows.length,
    matchedRows: 0,
    unmatchedRows: 0,
    riMatchedRows: 0,
    encoding: decoded.encoding,
    encodingIssue: decoded.likelyEncodingIssue,
    unmatchedReasons: {}
  };

  for (const row of dataRows) {
    const rowObject = rowToObject(header, row);
    const match = matchRowToBoundary({
      rowObject,
      header,
      config,
      features
    });

    if (!match.feature) {
      fileSummary.unmatchedRows += 1;
      addReason(fileSummary.unmatchedReasons, match.reason);
      continue;
    }

    const aggregation = aggregations.get(getFeatureKey(match.feature));
    if (!aggregation) {
      fileSummary.unmatchedRows += 1;
      addReason(fileSummary.unmatchedReasons, "boundary aggregation missing");
      continue;
    }

    aggregation.counts[config.id] += 1;
    aggregation.axisCounts[config.axis] += 1;
    fileSummary.matchedRows += 1;

    if (config.useRiAggregation && match.riName) {
      addRiAggregation(aggregation, match.riName, config);
      fileSummary.riMatchedRows += 1;
    }
  }

  return fileSummary;
}

function matchRowToBoundary({ rowObject, header, config, features }) {
  if (config.matchMethod === "coordinate") {
    return matchCoordinateRow(rowObject, header, features);
  }

  return matchAddressRow(rowObject, features);
}

function matchAddressRow(rowObject, features) {
  const address = findFirstValue(rowObject, ADDRESS_COLUMN_CANDIDATES);
  if (!address) return { feature: null, riName: null, reason: "address missing" };

  const parsed = parseChungnamAddress(address);
  if (!parsed.isTargetArea) {
    return { feature: null, riName: parsed.riName, reason: "address parse failed or outside target area" };
  }

  const feature = findBoundaryFeatureByParsedAddress(parsed, features);
  if (!feature) {
    return { feature: null, riName: parsed.riName, reason: "boundary not found by address" };
  }

  return { feature, riName: parsed.riName, reason: "matched by address" };
}

function matchCoordinateRow(rowObject, header, features) {
  const coordinateColumns = findCoordinateColumns(header);
  if (!coordinateColumns) return { feature: null, riName: null, reason: "coordinate columns missing" };

  const point = {
    lat: toNumber(rowObject[coordinateColumns.latColumn]),
    lng: toNumber(rowObject[coordinateColumns.lngColumn])
  };

  if (!isWgs84Point(point)) {
    return { feature: null, riName: null, reason: "invalid coordinate" };
  }

  const feature = findBoundaryFeatureByPoint(point, features);
  return feature
    ? { feature, riName: null, reason: "matched by coordinate" }
    : { feature: null, riName: null, reason: "boundary not found by coordinate" };
}

function createBaseAggregations(features, configs) {
  const countTemplate = Object.fromEntries(configs.map((config) => [config.id, 0]));
  const axisTemplate = Object.fromEntries(Object.keys(INFRASTRUCTURE_AXES).map((axis) => [axis, 0]));

  return new Map(features.map((feature, index) => {
    const identity = getFeatureIdentity(feature);
    const center = calculateGeometryCenter(feature.geometry);

    return [getFeatureKey(feature), {
      feature,
      index,
      ...identity,
      centerLat: center.lat,
      centerLng: center.lng,
      counts: { ...countTemplate },
      axisCounts: { ...axisTemplate },
      riAggregation: {}
    }];
  }));
}

function scoreAggregations(aggregations, configs) {
  const normalizedScoresByConfig = getNormalizedScoresByConfig(aggregations, configs);

  return aggregations.map((aggregation) => {
    const axisScores = calculateAxisScores(aggregation, configs, normalizedScoresByConfig);
    const baseScore = round1(
      SCORE_AXIS_WEIGHTS.traffic * axisScores.traffic +
      SCORE_AXIS_WEIGHTS.living * axisScores.living +
      SCORE_AXIS_WEIGHTS.safetyMedical * axisScores.safetyMedical
    );

    return {
      ...aggregation,
      trafficInfraScore: axisScores.traffic,
      livingInfraScore: axisScores.living,
      safetyMedicalScore: axisScores.safetyMedical,
      baseScore,
      riHighlights: createRiHighlights(aggregation.riAggregation)
    };
  });
}

function getNormalizedScoresByConfig(aggregations, configs) {
  return Object.fromEntries(configs.map((config) => {
    const values = aggregations.map((aggregation) => Math.log1p(aggregation.counts[config.id] ?? 0));
    const min = Math.min(...values);
    const max = Math.max(...values);

    return [config.id, values.map((value) => normalizeToScore(value, min, max))];
  }));
}

function calculateAxisScores(aggregation, configs, normalizedScoresByConfig) {
  const aggregationIndex = aggregation.index;
  const scores = {};

  for (const axis of Object.keys(INFRASTRUCTURE_AXES)) {
    const axisConfigs = configs.filter((config) => config.axis === axis);
    const weightSum = axisConfigs.reduce((sum, config) => sum + config.weight, 0);

    scores[axis] = round1(axisConfigs.reduce((sum, config) => (
      sum + (normalizedScoresByConfig[config.id]?.[aggregationIndex] ?? 0) * config.weight
    ), 0) / (weightSum || 1));
  }

  return scores;
}

function toGeneratedLifeZone(aggregation) {
  const displayDistrict = aggregation.district && aggregation.district !== NO_DISTRICT ? `${aggregation.district} ` : "";
  const name = `${aggregation.city} ${displayDistrict}${aggregation.emdName}`;
  const strengths = createStrengths(aggregation);
  const weaknesses = createWeaknesses(aggregation);

  return {
    id: `LZ_${aggregation.emdCode}`,
    name,
    city: aggregation.city,
    district: aggregation.district,
    emdName: aggregation.emdName,
    eupMyeonDong: aggregation.emdName,
    emdCode: aggregation.emdCode,
    centerLat: aggregation.centerLat,
    centerLng: aggregation.centerLng,
    lat: aggregation.centerLat,
    lng: aggregation.centerLng,
    includedEmdCodes: [aggregation.emdCode],
    trafficInfraScore: aggregation.trafficInfraScore,
    livingInfraScore: aggregation.livingInfraScore,
    safetyMedicalScore: aggregation.safetyMedicalScore,
    baseScore: aggregation.baseScore,
    axisScores: {
      transport: aggregation.trafficInfraScore,
      living: aggregation.livingInfraScore,
      safetyMedical: aggregation.safetyMedicalScore
    },
    counts: aggregation.counts,
    axisCounts: aggregation.axisCounts,
    riHighlights: aggregation.riHighlights,
    metrics: createMetrics(aggregation.counts),
    infraSummary: createInfraSummary(aggregation.counts),
    description: `${name} 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.`,
    strengths,
    weaknesses,
    tags: createTags(aggregation),
    dataSource: "preprocessed-csv",
    isGenerated: true
  };
}

function createMetrics(counts) {
  return {
    railDistanceKm: null,
    busStopDistanceKm: null,
    nearestLibraryDistanceKm: null,
    publicLibraryWithin1_5km: false,
    smallLibraryWithin1_5km: false,
    sportsInfraDistanceKm: null,
    sportsInfraWithin1_5km: false,
    pharmacyDistanceKm: null,
    fire119DistanceKm: null,
    policeSubstationDistanceKm: null,
    libraryCount: counts.library,
    sportsInfraCount: counts.sports,
    pharmacyCount: counts.pharmacy,
    streetlightCount: counts.security_light,
    emergencyBellCount: counts.emergency_bell
  };
}

function createInfraSummary(counts) {
  return {
    stations: counts.subway_station,
    busStops: counts.bus_stop,
    libraries: counts.library,
    sports: counts.sports,
    hospitals: counts.hospital,
    pharmacies: counts.pharmacy,
    streetlights: counts.security_light,
    emergencyBells: counts.emergency_bell,
    shelters: counts.shelter,
    fire119Centers: counts.fire_station,
    policeStations: counts.police
  };
}

function createRiHighlights(riAggregation) {
  return Object.values(riAggregation)
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.riName.localeCompare(b.riName, "ko");
    })
    .slice(0, 3)
    .map((item) => {
      const dominantAxis = getDominantAxis(item.axes);
      const dominantCount = item.axes[dominantAxis] ?? item.totalCount;

      return {
        riName: item.riName,
        totalCount: item.totalCount,
        dominantAxis,
        summaryText: `${item.riName} ${AXIS_SHORT_LABELS[dominantAxis]} 인프라 ${dominantCount}건`
      };
    });
}

function addRiAggregation(aggregation, riName, config) {
  const riAggregation = aggregation.riAggregation[riName] ?? {
    riName,
    totalCount: 0,
    counts: {},
    axes: {
      traffic: 0,
      living: 0,
      safetyMedical: 0
    }
  };

  riAggregation.totalCount += 1;
  riAggregation.counts[config.id] = (riAggregation.counts[config.id] ?? 0) + 1;
  riAggregation.axes[config.axis] += 1;
  aggregation.riAggregation[riName] = riAggregation;
}

function createStrengths(aggregation) {
  const axes = [
    ["traffic", aggregation.trafficInfraScore],
    ["living", aggregation.livingInfraScore],
    ["safetyMedical", aggregation.safetyMedicalScore]
  ].sort((a, b) => b[1] - a[1]);
  const topAxis = axes[0];
  const topCounts = getTopCountLabels(aggregation.counts).slice(0, 2);

  return [
    `실제 CSV 기준 ${AXIS_SHORT_LABELS[topAxis[0]]} 점수가 높은 편입니다.`,
    topCounts.length > 0 ? `${topCounts.join(" · ")} 데이터가 반영되었습니다.` : "생활 인프라 분포를 확인했습니다."
  ];
}

function createWeaknesses(aggregation) {
  const axes = [
    ["traffic", aggregation.trafficInfraScore],
    ["living", aggregation.livingInfraScore],
    ["safetyMedical", aggregation.safetyMedicalScore]
  ].sort((a, b) => a[1] - b[1]);

  return [
    `${AXIS_SHORT_LABELS[axes[0][0]]} 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다.`
  ];
}

function createTags(aggregation) {
  const tags = getTopCountLabels(aggregation.counts).slice(0, 3);
  return tags.length > 0 ? tags : ["실제 데이터", "읍면동 추천"];
}

function getTopCountLabels(counts) {
  return infrastructureCsvConfig
    .map((config) => ({
      label: config.label,
      count: counts[config.id] ?? 0
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item) => `${item.label} ${item.count}건`);
}

function buildSummary({ inputDir, boundaryGeoJson, generatedLifeZones, fileSummaries, configs }) {
  const cityCounts = countBy(generatedLifeZones.map((zone) => zone.city));
  const matchedRows = fileSummaries.reduce((sum, file) => sum + (file.matchedRows ?? 0), 0);
  const unmatchedRows = fileSummaries.reduce((sum, file) => sum + (file.unmatchedRows ?? 0), 0);
  const addressFiles = fileSummaries.filter((file) => file.matchMethod === "address");
  const coordinateFiles = fileSummaries.filter((file) => file.matchMethod === "coordinate");
  const zonesWithRiHighlights = generatedLifeZones.filter((zone) => zone.riHighlights.length > 0);

  return {
    generatedAt: new Date().toISOString(),
    inputDir,
    boundarySource: boundaryGeoJson?.metadata?.source ?? "unknown",
    boundaryFeatureCount: boundaryGeoJson?.metadata?.featureCount ?? boundaryGeoJson?.features?.length ?? 0,
    processedCsvFileCount: fileSummaries.filter((file) => !file.skipped).length,
    skippedCsvFileCount: fileSummaries.filter((file) => file.skipped).length,
    addressBasedFileCount: addressFiles.length,
    coordinateBasedFileCount: coordinateFiles.length,
    generatedLifeZoneCount: generatedLifeZones.length,
    cheonanLifeZoneCount: cityCounts["천안시"] ?? 0,
    asanLifeZoneCount: cityCounts["아산시"] ?? 0,
    matchedRows,
    unmatchedRows,
    zonesWithRiHighlights: zonesWithRiHighlights.length,
    maxRiHighlightsPerZone: 3,
    dataSource: "preprocessed-csv",
    isGenerated: true,
    scoreAxisWeights: SCORE_AXIS_WEIGHTS,
    infrastructureConfig: configs.map(({ id, label, axis, matchMethod, weight, useRiAggregation }) => ({
      id,
      label,
      axis,
      matchMethod,
      weight,
      useRiAggregation
    })),
    fileSummaries
  };
}

function renderMarkdownSummary(summary) {
  const lines = [
    "# 실제 CSV 기반 생활권 추천 데이터 생성 요약",
    "",
    `- 생성 시각: ${summary.generatedAt}`,
    `- 입력 CSV 폴더: ${summary.inputDir}`,
    `- 처리 CSV 파일 수: ${summary.processedCsvFileCount}`,
    `- 주소 기반 처리 파일 수: ${summary.addressBasedFileCount}`,
    `- 좌표 기반 처리 파일 수: ${summary.coordinateBasedFileCount}`,
    `- 생성 생활권 수: ${summary.generatedLifeZoneCount}`,
    `- 천안시 생활권 수: ${summary.cheonanLifeZoneCount}`,
    `- 아산시 생활권 수: ${summary.asanLifeZoneCount}`,
    `- 매칭 성공 row 수: ${summary.matchedRows}`,
    `- 매칭 실패 row 수: ${summary.unmatchedRows}`,
    `- 리 보조 정보가 있는 생활권 수: ${summary.zonesWithRiHighlights}`,
    "",
    "## 점수 계산 방식",
    "",
    "- 각 인프라 count에 log1p를 적용한 뒤 같은 항목끼리 전체 행정동 기준 min-max 정규화했다.",
    "- 교통 인프라는 버스정류장 70%, 도시철도역사 30%를 반영한다.",
    "- 생활 편의 인프라는 도서관/작은도서관 60%, 체육 관련 시설 40%를 반영한다.",
    "- 치안 의료 인프라는 병원 20%, 약국 20%, 119안전센터 15%, 지구대/파출소 15%, 보안등 15%, 알람벨 10%, 실내구호소 5%를 반영한다.",
    "- baseScore는 교통 35%, 생활 편의 35%, 치안 의료 30%로 계산한다.",
    "",
    "## 리 단위 보조 집계",
    "",
    "- 주소에 리 정보가 있는 일부 데이터만 riHighlights에 반영했다.",
    "- 리 경계 데이터가 없으므로 지도 polygon은 계속 행정동 단위로 표시한다.",
    "- 결과 카드에는 상위 3개 리 보조 정보만 표시할 수 있게 생성했다.",
    "",
    "## 파일별 처리 결과",
    ""
  ];

  summary.fileSummaries.forEach((file) => {
    lines.push(
      `### ${file.fileName}`,
      "",
      `- 처리 방식: ${file.skipped ? "건너뜀" : file.matchMethod}`,
      `- 추천 축: ${file.axis ?? "없음"}`,
      `- 행 수: ${file.rowCount ?? 0}`,
      `- 매칭 성공: ${file.matchedRows ?? 0}`,
      `- 매칭 실패: ${file.unmatchedRows ?? 0}`,
      `- 리 보조 집계 row: ${file.riMatchedRows ?? 0}`,
      `- 인코딩: ${file.encoding ?? "unknown"}`,
      `- 미매칭 사유: ${formatReasonMap(file.unmatchedReasons ?? {})}`,
      ""
    );
  });

  return `${lines.join("\n")}\n`;
}

function createGeneratedLifeZonesModule(result) {
  const metadata = {
    ...result.summary,
    fileSummaries: undefined
  };

  return [
    "export const generatedLifeZonesMetadata = ",
    JSON.stringify(metadata, null, 2),
    ";\n\n",
    "export const generatedLifeZones = ",
    JSON.stringify(result.generatedLifeZones, null, 2),
    ";\n"
  ].join("");
}

function createSkippedFileSummary(filePath, inputDir) {
  return {
    fileName: path.basename(filePath),
    relativePath: path.relative(PROJECT_ROOT, filePath),
    inputRelativePath: path.relative(inputDir, filePath),
    skipped: true,
    reason: "matching config not found",
    matchedRows: 0,
    unmatchedRows: 0,
    unmatchedReasons: {
      "matching config not found": 1
    }
  };
}

function findBoundaryFeatureByParsedAddress(parsed, features) {
  const exactFeature = features.find((feature) => {
    const identity = getFeatureIdentity(feature);

    return identity.city === parsed.city &&
      normalizeDistrict(identity.city, identity.district) === parsed.district &&
      identity.emdName === parsed.emdName;
  });

  if (exactFeature) return exactFeature;

  const aliasedTarget = getAliasedEmdName(parsed);
  if (aliasedTarget) {
    return features.find((feature) => {
      const identity = getFeatureIdentity(feature);

      return identity.city === parsed.city &&
        normalizeDistrict(identity.city, identity.district) === parsed.district &&
        identity.emdName === aliasedTarget;
    }) ?? null;
  }

  const canonicalTarget = canonicalizeDongName(parsed.emdName);
  if (!canonicalTarget) return null;

  return features.find((feature) => {
    const identity = getFeatureIdentity(feature);

    return identity.city === parsed.city &&
      normalizeDistrict(identity.city, identity.district) === parsed.district &&
      canonicalizeDongName(identity.emdName) === canonicalTarget;
  }) ?? null;
}

function getAliasedEmdName(parsed) {
  const key = `${parsed.city}|${parsed.district}|${parsed.emdName}`;
  const aliases = {
    "천안시|서북구|불당동": "불당2동",
    "천안시|서북구|쌍용동": "쌍용2동",
    "천안시|서북구|성정동": "성정1동",
    "천안시|동남구|신부동": "신안동",
    "천안시|동남구|청수동": "청룡동"
  };

  return aliases[key] ?? null;
}

function canonicalizeDongName(emdName) {
  const normalized = normalizeText(emdName);
  const match = normalized.match(/^([가-힣]+)[0-9]+동$/);

  return match ? `${match[1]}동` : normalized;
}

function calculateGeometryCenter(geometry) {
  const positions = collectGeometryPositions(geometry);

  if (positions.length === 0) return { lat: 0, lng: 0 };

  const bounds = positions.reduce((accumulator, position) => ({
    minLat: Math.min(accumulator.minLat, position.lat),
    maxLat: Math.max(accumulator.maxLat, position.lat),
    minLng: Math.min(accumulator.minLng, position.lng),
    maxLng: Math.max(accumulator.maxLng, position.lng)
  }), {
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
    minLng: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY
  });

  return {
    lat: roundCoordinate((bounds.minLat + bounds.maxLat) / 2),
    lng: roundCoordinate((bounds.minLng + bounds.maxLng) / 2)
  };
}

function collectGeometryPositions(geometry) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];

  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat().map(toPosition).filter(Boolean);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2).map(toPosition).filter(Boolean);
  }

  return [];
}

function toPosition(position) {
  if (!Array.isArray(position) || position.length < 2) return null;

  const lng = Number(position[0]);
  const lat = Number(position[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function getFeatureKey(feature) {
  return getFeatureIdentity(feature).emdCode;
}

function getFeatureIdentity(feature = {}) {
  const properties = feature.properties ?? {};

  return {
    emdCode: normalizeText(properties.emdCode ?? properties.EMD_CD ?? properties.emd_cd),
    city: normalizeText(properties.city),
    district: normalizeDistrict(properties.city, properties.district),
    emdName: normalizeText(properties.emdName ?? properties.EMD_KOR_NM ?? properties.emd_kor_nm)
  };
}

function normalizeDistrict(city, district) {
  if (city === "아산시") return NO_DISTRICT;
  return normalizeText(district) || NO_DISTRICT;
}

function findCoordinateColumns(header) {
  const latColumn = findColumn(header, LAT_COLUMN_CANDIDATES);
  const lngColumn = findColumn(header, LNG_COLUMN_CANDIDATES);

  return latColumn && lngColumn ? { latColumn, lngColumn } : null;
}

function findFirstValue(rowObject, candidates) {
  const column = findColumn(Object.keys(rowObject), candidates);
  return column ? normalizeText(rowObject[column]) : "";
}

function findColumn(columns, candidates) {
  return columns.find((column) => (
    candidates.some((candidate) => normalizeColumn(column) === normalizeColumn(candidate))
  )) ?? null;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.map((csvRow) => csvRow.map((value) => value.trim()));
}

function decodeCsvText(buffer) {
  const utf8 = decodeWithEncoding(buffer, "utf-8");

  if (!utf8.hasDecodeError && utf8.replacementCharacterCount === 0) {
    return {
      ...utf8,
      encoding: "utf-8",
      likelyEncodingIssue: false
    };
  }

  const fallbackCandidates = ["euc-kr", "windows-949"]
    .map((encoding) => decodeWithEncoding(buffer, encoding))
    .sort((a, b) => a.replacementCharacterCount - b.replacementCharacterCount);
  const fallback = fallbackCandidates[0];

  if (fallback && fallback.replacementCharacterCount < utf8.replacementCharacterCount) {
    return {
      ...fallback,
      encoding: fallback.encoding,
      likelyEncodingIssue: false
    };
  }

  return {
    ...utf8,
    encoding: "utf-8",
    likelyEncodingIssue: true
  };
}

function decodeWithEncoding(buffer, encoding) {
  let hasDecodeError = false;

  try {
    new TextDecoder(encoding, { fatal: true }).decode(buffer);
  } catch {
    hasDecodeError = true;
  }

  const text = new TextDecoder(encoding).decode(buffer);
  const hasBom = text.charCodeAt(0) === 0xfeff;
  const normalizedText = hasBom ? text.slice(1) : text;
  const replacementCharacterCount = [...normalizedText].filter((char) => char === "\ufffd").length;

  return {
    text: normalizedText,
    hasDecodeError,
    replacementCharacterCount,
    encoding
  };
}

function rowToObject(header, row) {
  return Object.fromEntries(header.map((column, index) => [column, row[index] ?? ""]));
}

function normalizeToScore(value, min, max) {
  if (!Number.isFinite(value)) return 0;
  if (max === min) return max <= 0 ? 0 : 50;
  return round1(Math.max(0, Math.min(100, (value - min) / (max - min) * 100)));
}

function getDominantAxis(axes) {
  return Object.entries(axes).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  })[0]?.[0] ?? "safetyMedical";
}

function addReason(reasonMap, reason = "unknown") {
  reasonMap[reason] = (reasonMap[reason] ?? 0) + 1;
}

function countBy(values) {
  return values.reduce((accumulator, value) => ({
    ...accumulator,
    [value]: (accumulator[value] ?? 0) + 1
  }), {});
}

function formatReasonMap(reasonMap) {
  const entries = Object.entries(reasonMap);
  return entries.length > 0
    ? entries.map(([reason, count]) => `${reason} ${count}건`).join(", ")
    : "없음";
}

function isWgs84Point(point) {
  return Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180;
}

function toNumber(value) {
  const numericValue = Number(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(numericValue) ? numericValue : NaN;
}

function normalizeColumn(value) {
  return normalizeText(value).replace(/\s+/g, "").toLowerCase();
}

function normalizeText(value) {
  return value == null ? "" : String(value).trim();
}

function round1(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}

function roundCoordinate(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000000) / 1000000;
}

async function main() {
  const result = await generateLifeZonesFromCsv();
  const { summary } = result;

  console.log(`Processed ${summary.processedCsvFileCount} CSV files.`);
  console.log(`Generated ${summary.generatedLifeZoneCount} life zones.`);
  console.log(`Matched rows: ${summary.matchedRows}`);
  console.log(`Unmatched rows: ${summary.unmatchedRows}`);
  console.log(`Output: ${path.relative(PROJECT_ROOT, DEFAULT_LIFE_ZONES_OUTPUT)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
