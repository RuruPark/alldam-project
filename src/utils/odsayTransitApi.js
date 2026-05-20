export const ODSAY_TRANSIT_PROVIDER = "odsay-public-transit";
export const ODSAY_TRANSIT_ENDPOINT = "https://api.odsay.com/v1/api/searchPubTransPathT";

const DEFAULT_FAILURE_MESSAGE = "ODsay 대중교통 경로를 불러오지 못했습니다.";
const DEFAULT_CONCURRENCY = 3;
const transitRequestCache = new Map();

export function getConfiguredOdsayUriApiKey(config = globalThis.window?.__APP_CONFIG__) {
  return String(config?.PUBLIC_ODSAY_URI_API_KEY ?? config?.odsayUriApiKey ?? "").trim();
}

export function createFailedOdsayTransitResult({
  id = null,
  errorCode = "NETWORK_ERROR",
  message = null,
  diagnostics = null
} = {}) {
  return {
    id,
    provider: ODSAY_TRANSIT_PROVIDER,
    apiStatus: "failed",
    errorCode,
    isActualApiValue: false,
    durationMinutes: null,
    distanceMeters: null,
    trafficDistanceMeters: null,
    walkMeters: null,
    fareKrw: null,
    busTransitCount: null,
    subwayTransitCount: null,
    firstStartStation: null,
    lastEndStation: null,
    mapObj: null,
    message: message ?? getOdsayFailureMessage(errorCode),
    diagnostics: sanitizeOdsayDiagnostics(diagnostics)
  };
}

export function buildOdsayTransitRequestUrl({
  start,
  goal,
  apiKey,
  endpoint = ODSAY_TRANSIT_ENDPOINT
} = {}) {
  if (!isValidPoint(start) || !isValidPoint(goal) || !apiKey) return null;

  const url = new URL(endpoint);
  const params = new URLSearchParams({
    SX: String(Number(start.lng)),
    SY: String(Number(start.lat)),
    EX: String(Number(goal.lng)),
    EY: String(Number(goal.lat)),
    apiKey
  });
  url.search = params.toString();
  return url.toString();
}

export function normalizeOdsayTransitApiResult({
  id = null,
  responseJson = null,
  statusCode = null,
  hasOdsayUriApiKey = false,
  diagnostics = null
} = {}) {
  const odsayError = getOdsayError(responseJson);
  const baseDiagnostics = {
    hasOdsayUriApiKey,
    odsayStatusCode: statusCode,
    ...diagnostics
  };

  if (odsayError) {
    return createFailedOdsayTransitResult({
      id,
      errorCode: mapOdsayErrorCode(odsayError),
      diagnostics: {
        ...baseDiagnostics,
        odsayErrorCode: odsayError.code,
        odsayErrorMessage: odsayError.message
      }
    });
  }

  const pathSelection = selectBestOdsayPathInfo(responseJson);

  if (!pathSelection.hasPathArray || pathSelection.pathCount === 0) {
    return createFailedOdsayTransitResult({
      id,
      errorCode: "ODSAY_NO_ROUTE",
      diagnostics: {
        ...baseDiagnostics,
        ...pathSelection.diagnostics
      }
    });
  }

  if (!pathSelection.pathInfo || !Number.isFinite(pathSelection.durationMinutes)) {
    return createFailedOdsayTransitResult({
      id,
      errorCode: "ODSAY_PARSE_FAILED",
      diagnostics: {
        ...baseDiagnostics,
        ...pathSelection.diagnostics
      }
    });
  }

  const result = responseJson?.result ?? {};
  const pathInfo = pathSelection.pathInfo;
  const durationMinutes = pathSelection.durationMinutes;

  return {
    id,
    provider: ODSAY_TRANSIT_PROVIDER,
    apiStatus: "success",
    errorCode: null,
    isActualApiValue: true,
    durationMinutes: Math.max(0, Math.round(durationMinutes)),
    distanceMeters: normalizeNullableMeters(pathInfo.totalDistance ?? result.pointDistance),
    trafficDistanceMeters: normalizeNullableMeters(pathInfo.trafficDistance),
    walkMeters: normalizeNullableMeters(pathInfo.totalWalk),
    fareKrw: normalizeNullableNumber(pathInfo.payment),
    busTransitCount: normalizeNullableNumber(pathInfo.busTransitCount ?? result.busCount ?? 0),
    subwayTransitCount: normalizeNullableNumber(pathInfo.subwayTransitCount ?? result.subwayCount ?? 0),
    firstStartStation: pathInfo.firstStartStation ? String(pathInfo.firstStartStation) : null,
    lastEndStation: pathInfo.lastEndStation ? String(pathInfo.lastEndStation) : null,
    mapObj: pathInfo.mapObj ? String(pathInfo.mapObj) : null,
    option: "recommended",
    message: null,
    diagnostics: sanitizeOdsayDiagnostics({
      ...baseDiagnostics,
      ...pathSelection.diagnostics
    })
  };
}

export function applyTransitCommuteResultToTimes(commuteTimes = {}, transitResult = null) {
  if (!transitResult) return commuteTimes;
  const normalizedTransit = normalizeTransitResultForTimes(transitResult);

  return {
    ...commuteTimes,
    transit: normalizedTransit.isActualApiValue ? normalizedTransit.durationMinutes : null,
    transitApi: normalizedTransit,
    transitProvider: normalizedTransit.provider,
    transitApiStatus: normalizedTransit.apiStatus,
    transitIsActualApiValue: normalizedTransit.isActualApiValue,
    transitErrorCode: normalizedTransit.errorCode,
    transitMessage: normalizedTransit.message
  };
}

export async function fetchOdsayTransitCommutes({
  start,
  lifeZones = [],
  apiKey = getConfiguredOdsayUriApiKey(),
  endpoint = ODSAY_TRANSIT_ENDPOINT,
  fetchImpl = globalThis.fetch,
  concurrency = DEFAULT_CONCURRENCY
} = {}) {
  const resultByZoneId = new Map();

  if (!Array.isArray(lifeZones) || lifeZones.length === 0) return resultByZoneId;

  if (!apiKey) {
    lifeZones.forEach((zone) => {
      resultByZoneId.set(getZoneIdKey(zone), createFailedOdsayTransitResult({
        id: zone.id,
        errorCode: "MISSING_ODSAY_URI_KEY",
        diagnostics: { hasOdsayUriApiKey: false }
      }));
    });
    return resultByZoneId;
  }

  if (!isValidPoint(start)) {
    lifeZones.forEach((zone) => {
      const goal = normalizeLifeZonePoint(zone);
      resultByZoneId.set(getZoneIdKey(zone), createFailedOdsayTransitResult({
        id: zone.id,
        errorCode: "ODSAY_INVALID_COORDINATES",
        diagnostics: createTransitDiagnostics({
          zone,
          hasOdsayUriApiKey: true,
          hasValidStartCoordinates: false,
          hasValidGoalCoordinates: isValidPoint(goal)
        })
      }));
    });
    return resultByZoneId;
  }

  if (typeof fetchImpl !== "function") {
    lifeZones.forEach((zone) => {
      const goal = normalizeLifeZonePoint(zone);
      resultByZoneId.set(getZoneIdKey(zone), createFailedOdsayTransitResult({
        id: zone.id,
        errorCode: "NETWORK_ERROR",
        diagnostics: createTransitDiagnostics({
          zone,
          hasOdsayUriApiKey: true,
          hasValidStartCoordinates: true,
          hasValidGoalCoordinates: isValidPoint(goal)
        })
      }));
    });
    return resultByZoneId;
  }

  const tasks = lifeZones.map((zone) => async () => {
    const goal = normalizeLifeZonePoint(zone);

    if (!isValidPoint(goal)) {
      return [getZoneIdKey(zone), createFailedOdsayTransitResult({
        id: zone.id,
        errorCode: "ODSAY_INVALID_COORDINATES",
        diagnostics: createTransitDiagnostics({
          zone,
          hasOdsayUriApiKey: true,
          hasValidStartCoordinates: true,
          hasValidGoalCoordinates: false
        })
      })];
    }

    const cacheKey = createTransitCacheKey(start, goal, endpoint);
    const cachedResultPromise = transitRequestCache.get(cacheKey);
    const resultPromise = cachedResultPromise ??
      fetchSingleOdsayTransit({
        id: zone.id,
        start,
        goal,
        apiKey,
        endpoint,
        fetchImpl,
        diagnostics: createTransitDiagnostics({
          zone,
          hasOdsayUriApiKey: true,
          hasValidStartCoordinates: true,
          hasValidGoalCoordinates: true
        })
      });

    if (!cachedResultPromise) transitRequestCache.set(cacheKey, resultPromise);
    const result = await resultPromise;
    return [getZoneIdKey(zone), normalizeResultForZone(result, zone, {
      cacheHit: Boolean(cachedResultPromise),
      cacheResultIdBeforeClone: result?.id ?? null
    })];
  });

  const settledResults = await runWithConcurrency(tasks, Math.min(Math.max(1, concurrency), 4));
  settledResults.forEach(([zoneId, result]) => resultByZoneId.set(zoneId, result));

  return resultByZoneId;
}

export function clearOdsayTransitRequestCache() {
  transitRequestCache.clear();
}

async function fetchSingleOdsayTransit({ id, start, goal, apiKey, endpoint, fetchImpl, diagnostics = null }) {
  const requestUrl = buildOdsayTransitRequestUrl({ start, goal, apiKey, endpoint });

  if (!requestUrl) {
    return createFailedOdsayTransitResult({
      id,
      errorCode: apiKey ? "ODSAY_INVALID_COORDINATES" : "MISSING_ODSAY_URI_KEY",
      diagnostics: {
        ...diagnostics,
        hasOdsayUriApiKey: Boolean(apiKey),
        hasValidStartCoordinates: isValidPoint(start),
        hasValidGoalCoordinates: isValidPoint(goal)
      }
    });
  }

  try {
    const response = await fetchImpl(requestUrl);
    const responseJson = await response.json().catch(() => null);

    if (!response.ok) {
      return createFailedOdsayTransitResult({
        id,
        errorCode: response.status === 429 ? "ODSAY_RATE_LIMITED" : "NETWORK_ERROR",
        diagnostics: {
          ...diagnostics,
          hasOdsayUriApiKey: true,
          odsayStatusCode: response.status
        }
      });
    }

    return normalizeOdsayTransitApiResult({
      id,
      responseJson,
      statusCode: response.status,
      hasOdsayUriApiKey: true,
      diagnostics
    });
  } catch {
    return createFailedOdsayTransitResult({
      id,
      errorCode: "NETWORK_ERROR",
      diagnostics: {
        ...diagnostics,
        hasOdsayUriApiKey: true
      }
    });
  }
}

async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  let nextTaskIndex = 0;

  async function worker() {
    while (nextTaskIndex < tasks.length) {
      const taskIndex = nextTaskIndex;
      nextTaskIndex += 1;
      results[taskIndex] = await tasks[taskIndex]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  return results;
}

function normalizeTransitResultForTimes(result) {
  if (!result || typeof result !== "object") {
    return createFailedOdsayTransitResult();
  }

  if (result.isActualApiValue === true && Number.isFinite(Number(result.durationMinutes))) {
    return {
      id: result.id ?? null,
      provider: ODSAY_TRANSIT_PROVIDER,
      apiStatus: "success",
      errorCode: null,
      isActualApiValue: true,
      durationMinutes: Math.max(0, Math.round(Number(result.durationMinutes))),
      distanceMeters: normalizeNullableMeters(result.distanceMeters),
      trafficDistanceMeters: normalizeNullableMeters(result.trafficDistanceMeters),
      walkMeters: normalizeNullableMeters(result.walkMeters),
      fareKrw: normalizeNullableNumber(result.fareKrw),
      busTransitCount: normalizeNullableNumber(result.busTransitCount),
      subwayTransitCount: normalizeNullableNumber(result.subwayTransitCount),
      firstStartStation: result.firstStartStation ? String(result.firstStartStation) : null,
      lastEndStation: result.lastEndStation ? String(result.lastEndStation) : null,
      mapObj: result.mapObj ? String(result.mapObj) : null,
      option: result.option ?? "recommended",
      message: null,
      diagnostics: sanitizeOdsayDiagnostics(result.diagnostics)
    };
  }

  return createFailedOdsayTransitResult({
        id: result.id ?? null,
        errorCode: result.errorCode ?? "NETWORK_ERROR",
        message: result.message ?? DEFAULT_FAILURE_MESSAGE,
        diagnostics: result.diagnostics
      });
}

function selectBestOdsayPathInfo(responseJson = null) {
  const result = responseJson?.result;
  const pathArray = Array.isArray(result?.path) ? result.path : null;
  const diagnostics = {
    hasResult: Boolean(result),
    hasPathArray: Array.isArray(pathArray),
    pathCount: Array.isArray(pathArray) ? pathArray.length : 0,
    hasSelectedPathInfo: false,
    hasTotalTime: false,
    infoKeys: []
  };

  if (!pathArray || pathArray.length === 0) {
    return {
      pathInfo: null,
      durationMinutes: null,
      hasPathArray: diagnostics.hasPathArray,
      pathCount: diagnostics.pathCount,
      diagnostics
    };
  }

  const pathInfos = pathArray
    .map((path) => path?.info)
    .filter((info) => info && typeof info === "object");
  const validPathInfos = pathInfos
    .map((info) => ({
      info,
      durationMinutes: toFiniteNumber(info.totalTime)
    }))
    .filter((candidate) => Number.isFinite(candidate.durationMinutes))
    .sort((a, b) => a.durationMinutes - b.durationMinutes);
  const selectedPathInfo = validPathInfos[0]?.info ?? pathInfos[0] ?? null;

  diagnostics.hasSelectedPathInfo = Boolean(selectedPathInfo);
  diagnostics.hasTotalTime = Number.isFinite(toFiniteNumber(selectedPathInfo?.totalTime));
  diagnostics.infoKeys = selectedPathInfo ? Object.keys(selectedPathInfo).slice(0, 20) : [];

  return {
    pathInfo: validPathInfos[0]?.info ?? null,
    durationMinutes: validPathInfos[0]?.durationMinutes ?? null,
    hasPathArray: diagnostics.hasPathArray,
    pathCount: diagnostics.pathCount,
    diagnostics
  };
}

function normalizeResultForZone(result, zone, options = {}) {
  if (!result || typeof result !== "object") {
    return createFailedOdsayTransitResult({
      id: zone.id,
      errorCode: "NETWORK_ERROR",
      diagnostics: createTransitDiagnostics({ zone })
    });
  }

  return {
    ...result,
    id: zone.id,
    diagnostics: sanitizeOdsayDiagnostics({
      ...result.diagnostics,
      isNotRecommendedCandidate: isNotRecommendedCandidate(zone),
      cacheHit: options.cacheHit === true,
      cacheResultIdBeforeClone: options.cacheResultIdBeforeClone,
      cacheResultIdAfterClone: zone.id
    })
  };
}

function createTransitDiagnostics({
  zone = null,
  hasOdsayUriApiKey = null,
  hasValidStartCoordinates = null,
  hasValidGoalCoordinates = null
} = {}) {
  return {
    hasOdsayUriApiKey,
    isNotRecommendedCandidate: isNotRecommendedCandidate(zone),
    hasValidStartCoordinates,
    hasValidGoalCoordinates
  };
}

function isNotRecommendedCandidate(zone = null) {
  return zone?.isNotRecommendedCandidate === true || zone?.apiSelectionRole === "notRecommended";
}

function getOdsayFailureMessage(errorCode) {
  switch (errorCode) {
    case "MISSING_ODSAY_URI_KEY":
      return "Vercel 환경변수 PUBLIC_ODSAY_URI_API_KEY 등록과 재배포가 필요합니다.";
    case "ODSAY_AUTH_FAILED":
    case "ODSAY_PLATFORM_MISMATCH":
      return "ODsay API 인증에 실패했습니다.";
    case "ODSAY_NO_ROUTE":
      return "ODsay 대중교통 경로를 찾지 못했습니다.";
    case "ODSAY_TOO_CLOSE":
      return "출발지와 도착지가 가까워 대중교통 경로가 제공되지 않았습니다.";
    case "ODSAY_OUT_OF_SERVICE_AREA":
      return "ODsay 대중교통 서비스 지역 밖입니다.";
    case "ODSAY_PARSE_FAILED":
      return "ODsay 응답을 해석하지 못했습니다.";
    case "ODSAY_INVALID_COORDINATES":
      return "대중교통 경로 좌표를 확인하지 못했습니다.";
    default:
      return DEFAULT_FAILURE_MESSAGE;
  }
}

function getOdsayError(responseJson) {
  const error = Array.isArray(responseJson?.error) ? responseJson.error[0] : responseJson?.error;
  if (!error) return null;

  return {
    code: error.code != null ? String(error.code) : null,
    message: error.message != null ? String(error.message) : ""
  };
}

function mapOdsayErrorCode(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "");
  const lowerMessage = message.toLowerCase();

  if (code === "-98") return "ODSAY_TOO_CLOSE";
  if (code === "-99" || ["3", "4", "5"].includes(code)) return "ODSAY_NO_ROUTE";
  if (code === "6") return "ODSAY_OUT_OF_SERVICE_AREA";
  if (lowerMessage.includes("rate") || lowerMessage.includes("quota") || lowerMessage.includes("limit")) {
    return "ODSAY_RATE_LIMITED";
  }
  if (lowerMessage.includes("platform") || lowerMessage.includes("uri") || lowerMessage.includes("web")) {
    return "ODSAY_PLATFORM_MISMATCH";
  }
  if (code === "500" || lowerMessage.includes("apikeyauthfailed") || lowerMessage.includes("authentication")) {
    return "ODSAY_AUTH_FAILED";
  }
  return "ODSAY_PARSE_FAILED";
}

function sanitizeOdsayDiagnostics(diagnostics = null) {
  if (!diagnostics || typeof diagnostics !== "object") return null;

  return {
    hasOdsayUriApiKey: Boolean(diagnostics.hasOdsayUriApiKey),
    isNotRecommendedCandidate: diagnostics.isNotRecommendedCandidate === true,
    hasResult: typeof diagnostics.hasResult === "boolean" ? diagnostics.hasResult : null,
    hasPathArray: typeof diagnostics.hasPathArray === "boolean" ? diagnostics.hasPathArray : null,
    pathCount: Number.isFinite(Number(diagnostics.pathCount)) ? Number(diagnostics.pathCount) : null,
    hasSelectedPathInfo: typeof diagnostics.hasSelectedPathInfo === "boolean" ? diagnostics.hasSelectedPathInfo : null,
    hasTotalTime: typeof diagnostics.hasTotalTime === "boolean" ? diagnostics.hasTotalTime : null,
    infoKeys: Array.isArray(diagnostics.infoKeys)
      ? diagnostics.infoKeys.map((key) => String(key).slice(0, 60)).slice(0, 20)
      : [],
    hasValidStartCoordinates: typeof diagnostics.hasValidStartCoordinates === "boolean"
      ? diagnostics.hasValidStartCoordinates
      : null,
    hasValidGoalCoordinates: typeof diagnostics.hasValidGoalCoordinates === "boolean"
      ? diagnostics.hasValidGoalCoordinates
      : null,
    cacheHit: diagnostics.cacheHit === true,
    cacheResultIdBeforeClone: diagnostics.cacheResultIdBeforeClone
      ? String(diagnostics.cacheResultIdBeforeClone).slice(0, 80)
      : null,
    cacheResultIdAfterClone: diagnostics.cacheResultIdAfterClone
      ? String(diagnostics.cacheResultIdAfterClone).slice(0, 80)
      : null,
    odsayStatusCode: Number.isFinite(Number(diagnostics.odsayStatusCode))
      ? Number(diagnostics.odsayStatusCode)
      : null,
    odsayErrorCode: diagnostics.odsayErrorCode ? String(diagnostics.odsayErrorCode).slice(0, 80) : null,
    odsayErrorMessage: diagnostics.odsayErrorMessage ? String(diagnostics.odsayErrorMessage).slice(0, 160) : null
  };
}

function createTransitCacheKey(start, goal, endpoint) {
  return [
    endpoint,
    roundCoordinate(start.lng),
    roundCoordinate(start.lat),
    roundCoordinate(goal.lng),
    roundCoordinate(goal.lat)
  ].join("|");
}

function normalizeLifeZonePoint(lifeZone) {
  return {
    lat: lifeZone?.centerLat ?? lifeZone?.lat ?? lifeZone?.latitude ?? lifeZone?.coordinate?.lat,
    lng: lifeZone?.centerLng ?? lifeZone?.lng ?? lifeZone?.longitude ?? lifeZone?.coordinate?.lng
  };
}

function getZoneIdKey(zone = {}) {
  return String(zone?.id ?? "");
}

function isValidPoint(point = {}) {
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180;
}

function normalizeNullableMeters(value) {
  const numericValue = toFiniteNumber(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.round(numericValue)) : null;
}

function normalizeNullableNumber(value) {
  const numericValue = toFiniteNumber(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.round(numericValue)) : null;
}

function toFiniteNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function roundCoordinate(value) {
  return Number(value).toFixed(6);
}
