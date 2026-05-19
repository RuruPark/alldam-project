#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_INPUT_DIR = path.join(PROJECT_ROOT, "data", "전처리파일(csv)");
const DEFAULT_JSON_OUTPUT = path.join(PROJECT_ROOT, "artifacts", "preprocessed-csv-diagnosis.json");
const DEFAULT_MARKDOWN_OUTPUT = path.join(PROJECT_ROOT, "docs", "preprocessed-csv-diagnosis.md");
const TARGET_CITIES = ["천안시", "아산시"];

const COLUMN_CANDIDATES = {
  coordinate: [
    "위도",
    "경도",
    "latitude",
    "longitude",
    "lat",
    "lng",
    "lon",
    "x",
    "y",
    "X좌표",
    "Y좌표",
    "경도좌표",
    "위도좌표"
  ],
  address: [
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
  ],
  city: [
    "시군구",
    "시군구명",
    "시군",
    "시군명",
    "행정구역",
    "지역",
    "시도",
    "시도명",
    "도시명"
  ],
  emd: [
    "읍면동",
    "읍면동명",
    "행정동",
    "행정동명",
    "법정동",
    "법정동명",
    "동",
    "동명"
  ],
  ri: [
    "리",
    "리명",
    "법정리",
    "법정리명",
    "행정리",
    "행정리명",
    "마을명"
  ],
  facilityName: [
    "시설명",
    "명칭",
    "이름",
    "기관명",
    "사업장명",
    "정류장명",
    "역명",
    "병원명",
    "약국명",
    "도서관명",
    "119안전센터명",
    "요양기관명",
    "보안등위치명",
    "법인명칭"
  ]
};

const DATA_AXIS_RULES = [
  {
    axis: "교통 인프라",
    patterns: ["버스", "정류장", "도시철도", "역사", "철도", "교통"]
  },
  {
    axis: "생활 편의 인프라",
    patterns: ["도서관", "작은도서관", "체육", "생활", "문화", "편의"]
  },
  {
    axis: "치안 의료 인프라",
    patterns: ["병원", "약국", "119", "안전센터", "지구대", "파출소", "보안등", "알람벨", "비상벨", "구호소", "의료", "치안"]
  }
];

const DATA_TYPE_RULES = [
  ["버스정류장", ["버스", "정류장"]],
  ["도시철도역사", ["도시철도", "역사", "철도"]],
  ["도서관/작은도서관", ["도서관", "작은도서관"]],
  ["체육 관련 시설", ["체육"]],
  ["병원", ["병원", "요양기관"]],
  ["약국", ["약국"]],
  ["119안전센터", ["119", "안전센터"]],
  ["지구대/파출소", ["지구대", "파출소"]],
  ["보안등", ["보안등"]],
  ["알람벨/비상벨", ["알람벨", "비상벨"]],
  ["실내구호소", ["구호소"]]
];

export async function analyzePreprocessedCsv({
  inputDir = DEFAULT_INPUT_DIR,
  jsonOutput = DEFAULT_JSON_OUTPUT,
  markdownOutput = DEFAULT_MARKDOWN_OUTPUT
} = {}) {
  const csvFiles = await discoverCsvFiles(inputDir);
  const analyses = [];

  for (const filePath of csvFiles) {
    analyses.push(await analyzeCsvFile(filePath));
  }

  const summary = buildSummary(inputDir, analyses);
  const report = {
    generatedAt: new Date().toISOString(),
    inputDir,
    csvFileCount: analyses.length,
    summary,
    files: analyses
  };

  await mkdir(path.dirname(jsonOutput), { recursive: true });
  await mkdir(path.dirname(markdownOutput), { recursive: true });
  await writeFile(jsonOutput, JSON.stringify(report, null, 2), "utf8");
  await writeFile(markdownOutput, renderMarkdownReport(report), "utf8");

  return report;
}

async function discoverCsvFiles(inputDir) {
  const entries = await readdir(inputDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".csv"))
    .map((entry) => path.join(inputDir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b), "ko"));
}

async function analyzeCsvFile(filePath) {
  const buffer = await readFile(filePath);
  const decoded = decodeCsvText(buffer);
  const rows = parseCsv(decoded.text);
  const header = rows[0] ?? [];
  const dataRows = rows.slice(1).filter((row) => row.some((cell) => normalizeText(cell) !== ""));
  const sampleRows = dataRows.slice(0, 3).map((row) => rowToObject(header, row));
  const fileName = path.basename(filePath);
  const columnMatches = getColumnMatches(header);
  const addressColumns = columnMatches.address;
  const cityColumns = columnMatches.city;
  const emdColumns = columnMatches.emd;
  const riColumns = columnMatches.ri;
  const coordinatePairs = findCoordinatePairs(header);
  const addressStats = getAddressStats(dataRows, header, addressColumns);
  const cityStats = getCityStats(dataRows, header, cityColumns, addressColumns);
  const explicitEmdStats = getExplicitValueStats(dataRows, header, emdColumns, /[읍면동]$/);
  const explicitRiStats = getExplicitValueStats(dataRows, header, riColumns, /리$/);
  const coordinateStats = getCoordinateStats(dataRows, header, coordinatePairs);
  const dataType = inferDataType(fileName, header);
  const dataAxis = inferDataAxis(fileName, header);
  const cheonanAsanFilter = classifyCheonanAsanFilter({ cityStats, addressStats });
  const emdAggregation = classifyEmdAggregation({ explicitEmdStats, addressStats });
  const riAggregation = classifyRiAggregation({ explicitRiStats, addressStats, coordinateStats });
  const scoringPriority = classifyScoringPriority({
    cheonanAsanFilter,
    emdAggregation,
    riAggregation,
    coordinateStats,
    addressStats
  });

  return {
    fileName,
    relativePath: path.relative(PROJECT_ROOT, filePath),
    byteLength: buffer.byteLength,
    rowCount: dataRows.length,
    columnCount: header.length,
    columns: header,
    encoding: {
      assumed: decoded.encoding,
      hasBom: decoded.hasBom,
      hasUtf8DecodeError: decoded.utf8.hasDecodeError,
      replacementCharacterCount: decoded.replacementCharacterCount,
      likelyEncodingIssue: decoded.likelyEncodingIssue
    },
    isEmptyFile: buffer.byteLength === 0 || header.length === 0,
    sampleRows,
    columnMatches,
    coordinatePairs,
    coordinateStats,
    addressStats,
    cityStats,
    explicitEmdStats,
    explicitRiStats,
    dataType,
    dataAxis,
    cheonanAsanFilter,
    emdAggregation,
    riAggregation,
    recommendation: {
      scoreAxis: dataAxis,
      scoringPriority,
      needs: getNeededWork({ cheonanAsanFilter, emdAggregation, riAggregation, coordinateStats, addressStats })
    }
  };
}

function decodeCsvText(buffer) {
  const utf8 = decodeWithEncoding(buffer, "utf-8");

  if (!utf8.hasDecodeError && utf8.replacementCharacterCount === 0) {
    return {
      ...utf8,
      encoding: "utf-8",
      utf8,
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
      utf8,
      likelyEncodingIssue: false
    };
  }

  return {
    ...utf8,
    encoding: "utf-8",
    utf8,
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
    hasBom,
    hasDecodeError,
    replacementCharacterCount,
    encoding
  };
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

function getColumnMatches(columns) {
  return Object.fromEntries(
    Object.entries(COLUMN_CANDIDATES).map(([key, candidates]) => [
      key,
      columns.filter((column) => matchesCandidate(column, candidates))
    ])
  );
}

function findCoordinatePairs(columns) {
  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: normalizeColumn(column)
  }));
  const latColumns = normalizedColumns.filter(({ normalized }) => (
    ["위도", "latitude", "lat", "y", "y좌표", "위도좌표"].includes(normalized)
  ));
  const lngColumns = normalizedColumns.filter(({ normalized }) => (
    ["경도", "longitude", "lng", "lon", "x", "x좌표", "경도좌표"].includes(normalized)
  ));

  return latColumns.flatMap((latColumn) => (
    lngColumns.map((lngColumn) => ({
      latColumn: latColumn.original,
      lngColumn: lngColumn.original
    }))
  ));
}

function matchesCandidate(column, candidates) {
  const normalizedColumn = normalizeColumn(column);

  return candidates.some((candidate) => {
    const normalizedCandidate = normalizeColumn(candidate);
    return normalizedColumn === normalizedCandidate || normalizedColumn.includes(normalizedCandidate);
  });
}

function rowToObject(header, row) {
  return Object.fromEntries(header.map((column, index) => [column, row[index] ?? ""]));
}

function getAddressStats(rows, header, addressColumns) {
  const values = collectValues(rows, header, addressColumns);
  const valuesWithTargetCity = values.filter((value) => includesTargetCity(value));
  const valuesWithEmd = values.filter((value) => extractEmdFromAddress(value));
  const valuesWithRi = values.filter((value) => extractRiFromAddress(value));
  const riExamples = unique(valuesWithRi.map(extractRiFromAddress).filter(Boolean)).slice(0, 10);
  const emdExamples = unique(valuesWithEmd.map(extractEmdFromAddress).filter(Boolean)).slice(0, 10);

  return {
    hasAddressColumns: addressColumns.length > 0,
    addressColumns,
    nonEmptyValueCount: values.length,
    targetCityMentionCount: valuesWithTargetCity.length,
    emdExtractableCount: valuesWithEmd.length,
    riExtractableCount: valuesWithRi.length,
    emdExamples,
    riExamples,
    hasInconsistentAddressShape: values.length > 0 && valuesWithEmd.length > 0 && valuesWithEmd.length < values.length
  };
}

function getCityStats(rows, header, cityColumns, addressColumns) {
  const cityValues = collectValues(rows, header, cityColumns);
  const addressValues = collectValues(rows, header, addressColumns);
  const targetCityRows = [...cityValues, ...addressValues].filter((value) => includesTargetCity(value));

  return {
    cityColumns,
    hasCityColumns: cityColumns.length > 0,
    nonEmptyValueCount: cityValues.length,
    targetCityMentionCount: targetCityRows.length,
    targetCityExamples: unique(targetCityRows.filter(includesTargetCity)).slice(0, 10)
  };
}

function getExplicitValueStats(rows, header, columns, pattern) {
  const values = collectValues(rows, header, columns);
  const matchedValues = values.filter((value) => pattern.test(normalizeText(value)));

  return {
    columns,
    hasColumns: columns.length > 0,
    nonEmptyValueCount: values.length,
    matchedValueCount: matchedValues.length,
    examples: unique(matchedValues).slice(0, 10)
  };
}

function getCoordinateStats(rows, header, coordinatePairs) {
  let validPairCount = 0;
  let targetRangePairCount = 0;
  const examples = [];

  for (const row of rows) {
    for (const pair of coordinatePairs) {
      const lat = toNumber(row[header.indexOf(pair.latColumn)]);
      const lng = toNumber(row[header.indexOf(pair.lngColumn)]);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      validPairCount += 1;

      if (lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132) {
        targetRangePairCount += 1;
        if (examples.length < 5) {
          examples.push({ lat, lng, latColumn: pair.latColumn, lngColumn: pair.lngColumn });
        }
      }
    }
  }

  return {
    hasCoordinatePair: coordinatePairs.length > 0,
    coordinatePairs,
    validPairCount,
    targetRangePairCount,
    examples
  };
}

function classifyCheonanAsanFilter({ cityStats, addressStats }) {
  if (cityStats.hasCityColumns && cityStats.targetCityMentionCount > 0) {
    return {
      status: "가능",
      method: "시군구/도시 컬럼",
      reason: "천안시 또는 아산시 값을 가진 지역 컬럼이 있습니다."
    };
  }

  if (addressStats.hasAddressColumns && addressStats.targetCityMentionCount > 0) {
    return {
      status: "가능",
      method: "주소 컬럼",
      reason: "주소에서 천안시 또는 아산시를 식별할 수 있습니다."
    };
  }

  if (addressStats.hasAddressColumns) {
    return {
      status: "주소 정제 필요",
      method: "주소 컬럼",
      reason: "주소 컬럼은 있으나 천안·아산 식별이 샘플/값 기준으로 확실하지 않습니다."
    };
  }

  return {
    status: "보완 필요",
    method: "없음",
    reason: "천안·아산 필터링에 사용할 지역 또는 주소 컬럼이 부족합니다."
  };
}

function classifyEmdAggregation({ explicitEmdStats, addressStats }) {
  if (explicitEmdStats.hasColumns && explicitEmdStats.matchedValueCount > 0) {
    return {
      status: "가능",
      method: "읍면동 컬럼",
      reason: "읍면동 이름을 직접 담은 컬럼이 있습니다."
    };
  }

  if (addressStats.emdExtractableCount > 0) {
    return {
      status: "가능",
      method: "주소 파싱",
      reason: "주소에서 읍/면/동 단위를 추출할 수 있습니다."
    };
  }

  if (addressStats.hasAddressColumns) {
    return {
      status: "주소 정제 필요",
      method: "주소 파싱",
      reason: "주소는 있으나 읍면동 추출이 확실하지 않습니다."
    };
  }

  return {
    status: "보완 필요",
    method: "없음",
    reason: "읍면동 집계에 필요한 행정구역명 또는 주소가 부족합니다."
  };
}

function classifyRiAggregation({ explicitRiStats, addressStats, coordinateStats }) {
  if (explicitRiStats.hasColumns && explicitRiStats.matchedValueCount > 0) {
    return {
      scoreAggregation: "가능",
      mapBoundaryDisplay: "불가능",
      method: "리 컬럼",
      reason: "리 이름 컬럼이 있어 점수 집계는 가능하지만, 지도 polygon 표시는 별도 리 경계 데이터가 필요합니다."
    };
  }

  if (addressStats.riExtractableCount > 0) {
    return {
      scoreAggregation: "가능",
      mapBoundaryDisplay: "불가능",
      method: "주소 파싱",
      reason: "주소에서 리 단위를 추출할 수 있지만, 지도 polygon 표시는 별도 리 경계 데이터가 필요합니다."
    };
  }

  if (coordinateStats.hasCoordinatePair && !addressStats.hasAddressColumns) {
    return {
      scoreAggregation: "좌표 기반 보완 필요",
      mapBoundaryDisplay: "불가능",
      method: "좌표",
      reason: "좌표는 있으나 리 이름과 리 경계 데이터가 없어 정확한 리 매칭은 어렵습니다."
    };
  }

  return {
    scoreAggregation: "어려움",
    mapBoundaryDisplay: "불가능",
    method: "없음",
    reason: "리 컬럼 또는 주소 내 리 정보가 확인되지 않았습니다."
  };
}

function classifyScoringPriority({ cheonanAsanFilter, emdAggregation, riAggregation, coordinateStats, addressStats }) {
  if (
    cheonanAsanFilter.status === "가능" &&
    emdAggregation.status === "가능" &&
    (coordinateStats.hasCoordinatePair || addressStats.hasAddressColumns)
  ) {
    return "바로 사용 가능";
  }

  if (addressStats.hasAddressColumns && cheonanAsanFilter.status !== "보완 필요") {
    return "주소 정제 후 사용 가능";
  }

  if (coordinateStats.hasCoordinatePair && !addressStats.hasAddressColumns) {
    return "좌표 정제 후 사용 가능";
  }

  if (riAggregation.scoreAggregation === "가능" && riAggregation.mapBoundaryDisplay === "불가능") {
    return "리 경계 데이터 확보 후 사용 가능";
  }

  return "현재는 사용 보류";
}

function getNeededWork({ cheonanAsanFilter, emdAggregation, riAggregation, coordinateStats, addressStats }) {
  const needs = [];

  if (cheonanAsanFilter.status !== "가능") needs.push("천안·아산 필터링 기준 보강");
  if (emdAggregation.status !== "가능") needs.push("읍면동 추출/정제");
  if (riAggregation.scoreAggregation !== "가능") needs.push("리 정보 보강 또는 주소 정제");
  if (riAggregation.mapBoundaryDisplay === "불가능") needs.push("리 단위 경계 데이터 확보");
  if (!coordinateStats.hasCoordinatePair && !addressStats.hasAddressColumns) needs.push("좌표 또는 주소 확보");

  return unique(needs);
}

function inferDataAxis(fileName, columns) {
  const text = `${fileName} ${columns.join(" ")}`;
  const matchedRule = DATA_AXIS_RULES.find((rule) => (
    rule.patterns.some((pattern) => text.includes(pattern))
  ));

  return matchedRule?.axis ?? "기타/분류 필요";
}

function inferDataType(fileName, columns) {
  const text = `${fileName} ${columns.join(" ")}`;
  const matchedRule = DATA_TYPE_RULES.find(([, patterns]) => (
    patterns.some((pattern) => text.includes(pattern))
  ));

  return matchedRule?.[0] ?? "기타";
}

function buildSummary(inputDir, files) {
  return {
    inputDir,
    coordinateAvailableFiles: files.filter((file) => file.coordinateStats.hasCoordinatePair).map((file) => file.fileName),
    addressAvailableFiles: files.filter((file) => file.addressStats.hasAddressColumns).map((file) => file.fileName),
    emdAggregationAvailableFiles: files.filter((file) => file.emdAggregation.status === "가능").map((file) => file.fileName),
    riScoreAggregationAvailableFiles: files.filter((file) => file.riAggregation.scoreAggregation === "가능").map((file) => file.fileName),
    encodingIssueFiles: files.filter((file) => file.encoding.likelyEncodingIssue).map((file) => file.fileName),
    readyToUseFiles: files.filter((file) => file.recommendation.scoringPriority === "바로 사용 가능").map((file) => file.fileName),
    needsAddressCleanupFiles: files.filter((file) => file.recommendation.scoringPriority === "주소 정제 후 사용 가능").map((file) => file.fileName),
    needsCoordinateCleanupFiles: files.filter((file) => file.recommendation.scoringPriority === "좌표 정제 후 사용 가능").map((file) => file.fileName),
    deferredFiles: files.filter((file) => file.recommendation.scoringPriority === "현재는 사용 보류").map((file) => file.fileName),
    axisCounts: countBy(files.map((file) => file.dataAxis))
  };
}

function renderMarkdownReport(report) {
  const lines = [
    "# 전처리 CSV 데이터 진단 및 리 단위 가능성 검토",
    "",
    `생성 시각: ${report.generatedAt}`,
    "",
    "## 1. 분석 대상",
    "",
    `- CSV 폴더: \`${report.inputDir}\``,
    `- CSV 파일 수: ${report.csvFileCount}`,
    `- 파일 자동 탐색: 사용`,
    "",
    "## 2. 요약",
    "",
    `- 좌표 컬럼이 있는 파일: ${formatList(report.summary.coordinateAvailableFiles)}`,
    `- 주소 컬럼이 있는 파일: ${formatList(report.summary.addressAvailableFiles)}`,
    `- 읍면동 집계 가능 파일: ${formatList(report.summary.emdAggregationAvailableFiles)}`,
    `- 리 단위 점수 집계 가능 파일: ${formatList(report.summary.riScoreAggregationAvailableFiles)}`,
    `- 한글 인코딩 의심 파일: ${formatList(report.summary.encodingIssueFiles)}`,
    "",
    "## 3. 파일별 진단",
    ""
  ];

  for (const file of report.files) {
    lines.push(
      `### ${file.fileName}`,
      "",
      `- 데이터 축: ${file.dataAxis}`,
      `- 데이터 유형 추정: ${file.dataType}`,
      `- 행 수: ${file.rowCount}`,
      `- 주요 컬럼: ${formatList(file.columns)}`,
      `- 좌표 사용 가능 여부: ${file.coordinateStats.hasCoordinatePair ? "가능" : "어려움"}`,
      `- 주소 사용 가능 여부: ${file.addressStats.hasAddressColumns ? "가능" : "어려움"}`,
      `- 천안·아산 필터링: ${file.cheonanAsanFilter.status} (${file.cheonanAsanFilter.method})`,
      `- 읍면동 집계: ${file.emdAggregation.status} (${file.emdAggregation.method})`,
      `- 리 단위 점수 집계: ${file.riAggregation.scoreAggregation} (${file.riAggregation.method})`,
      `- 리 단위 지도 경계 표시: ${file.riAggregation.mapBoundaryDisplay}`,
      `- 추천 점수화 우선순위: ${file.recommendation.scoringPriority}`,
      `- 필요한 추가 작업: ${formatList(file.recommendation.needs)}`,
      `- 리 예시: ${formatList(file.addressStats.riExamples)}`,
      `- 읍면동 예시: ${formatList(file.addressStats.emdExamples)}`,
      `- 인코딩 문제 의심: ${file.encoding.likelyEncodingIssue ? "있음" : "없음"}`,
      ""
    );
  }

  lines.push(
    "## 4. 추천 단위 전략",
    "",
    "- 동 지역은 동 단위를 유지한다.",
    "- 읍 지역은 주소에 리 정보가 있으면 리 단위 보조 집계를 검토한다.",
    "- 면 지역은 주소에 리 정보가 있으면 리 단위 보조 집계를 우선 검토한다.",
    "- 리 정보가 없는 데이터는 읍면동 단위로 집계한다.",
    "- 리 경계 데이터가 없으면 지도에서는 읍면동 또는 행정동 경계로 표시하고, 카드나 점수에서는 리 단위 보조 정보를 사용할 수 있다.",
    "",
    "## 5. 추천 점수화 분류",
    "",
    `- 바로 사용 가능: ${formatList(report.summary.readyToUseFiles)}`,
    `- 주소 정제 후 사용 가능: ${formatList(report.summary.needsAddressCleanupFiles)}`,
    `- 좌표 정제 후 사용 가능: ${formatList(report.summary.needsCoordinateCleanupFiles)}`,
    `- 현재는 사용 보류: ${formatList(report.summary.deferredFiles)}`,
    "",
    "## 6. 리 단위 추천 가능성 결론",
    "",
    "### 1. 현재 CSV만으로 가능한 것",
    "",
    "- 주소에 리 정보가 있는 데이터는 리 단위 점수 집계가 가능하다.",
    "- 리 정보가 없는 데이터는 읍면동 단위 집계가 현실적이다.",
    "- 동 지역은 동 단위 유지가 가능하다.",
    "",
    "### 2. 현재 CSV만으로 어려운 것",
    "",
    "- 리 단위 지도 경계 polygon 표시.",
    "- 좌표만 있고 리 경계가 없는 데이터의 정확한 리 매칭.",
    "- 행정리와 법정리 구분이 필요한 경우.",
    "",
    "### 3. 추가로 필요한 데이터",
    "",
    "- 법정리 또는 행정리 경계 데이터.",
    "- 가능하면 WGS84 GeoJSON 형식.",
    "- SHP만 있다면 GeoJSON으로 변환해야 한다.",
    "",
    "### 4. 추천 방향",
    "",
    "- 1차 MVP는 읍면동 단위를 유지한다.",
    "- 면 지역만 리 이름이 있는 경우 리 단위 보조 집계를 적용한다.",
    "- 실제 지도 경계는 리 경계 데이터 확보 후 적용한다.",
    "- 리 경계 확보 전에는 읍면동 경계 지도와 리 단위 카드 정보를 병행한다.",
    "",
    "## 7. 실제 추천 데이터 생성 반영",
    "",
    "- 실제 CSV 기반 생활권 데이터는 `scripts/generate-life-zones-from-csv.mjs`로 생성한다.",
    "- 생성 결과는 `src/data/generatedLifeZones.js`에 저장하며, `mockLifeZones`는 fallback으로 유지한다.",
    "- 주소 기반 데이터는 읍면동 행정경계에 집계하고, 버스정류장은 좌표 기반으로 행정동 polygon에 매칭한다.",
    "- 리 정보가 확인되는 데이터는 `riHighlights`로 보조 집계해 결과 카드에 표시한다.",
    "- 리 경계 데이터가 없으므로 지도 polygon은 계속 행정동 단위로 표시한다.",
    "- 생성 결과 요약은 `docs/generated-life-zones-summary.md`에서 확인한다.",
    ""
  );

  return `${lines.join("\n")}\n`;
}

function collectValues(rows, header, columns) {
  const indexes = columns.map((column) => header.indexOf(column)).filter((index) => index >= 0);

  return rows.flatMap((row) => indexes.map((index) => normalizeText(row[index]))).filter(Boolean);
}

function extractEmdFromAddress(value) {
  return tokenizeAddress(value).find(isLikelyAdministrativeEmd) ?? "";
}

function extractRiFromAddress(value) {
  const tokens = tokenizeAddress(value);

  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (!tokens[index].endsWith("읍") && !tokens[index].endsWith("면")) continue;

    const riName = normalizeRiCandidate(tokens[index + 1]);
    if (isLikelyAdministrativeRi(riName)) return riName;
  }

  return "";
}

function tokenizeAddress(value) {
  return normalizeText(value)
    .replace(/[()]/g, " ")
    .split(/[\s,]+/)
    .map((token) => token.replace(/[^\p{Script=Hangul}0-9-]/gu, ""))
    .filter(Boolean);
}

function isLikelyAdministrativeEmd(value) {
  return /^[가-힣]+[0-9]?(?:읍|면|동)$/.test(value) && !["상가동", "관리동"].includes(value);
}

function normalizeRiCandidate(value) {
  return value.match(/^([가-힣]+[0-9]*리)(?:$|[0-9-])/)?.[1] ?? "";
}

function isLikelyAdministrativeRi(value) {
  if (!/^[가-힣]+[0-9]*리$/.test(value)) return false;
  return !["거리", "삼거리", "사거리", "오거리", "밸리", "로터리", "로타리"].some((suffix) => value.endsWith(suffix));
}

function includesTargetCity(value) {
  return TARGET_CITIES.some((city) => normalizeText(value).includes(city));
}

function countBy(values) {
  return values.reduce((accumulator, value) => ({
    ...accumulator,
    [value]: (accumulator[value] ?? 0) + 1
  }), {});
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeColumn(value) {
  return normalizeText(value).replace(/\s+/g, "").toLowerCase();
}

function normalizeText(value) {
  return value == null ? "" : String(value).trim();
}

function toNumber(value) {
  const numericValue = Number(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(numericValue) ? numericValue : NaN;
}

function formatList(values) {
  return values.length > 0 ? values.join(", ") : "없음";
}

async function main() {
  const report = await analyzePreprocessedCsv();
  console.log(`Analyzed ${report.csvFileCount} CSV files.`);
  console.log(`JSON: ${path.relative(PROJECT_ROOT, DEFAULT_JSON_OUTPUT)}`);
  console.log(`Markdown: ${path.relative(PROJECT_ROOT, DEFAULT_MARKDOWN_OUTPUT)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
