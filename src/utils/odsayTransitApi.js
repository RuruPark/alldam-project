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
  message = DEFAULT_FAILURE_MESSAGE,
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
    message,
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
  hasOdsayUriApiKey = false
} = {}) {
  const odsayError = getOdsayError(responseJson);

  if (odsayError) {
    return createFailedOdsayTransitResult({
      id,
      errorCode: mapOdsayErrorCode(odsayError),
      diagnostics: {
        hasOdsayUriApiKey,
        odsayStatusCode: statusCode,
        odsayErrorCode: odsayError.code,
        odsayErrorMessage: odsayError.message
      }
    });
  }

  const pathInfo = responseJson?.result?.path?.[0]?.info;
  const durationMinutes = toFiniteNumber(pathInfo?.totalTime);

  if (!pathInfo || !Number.isFinite(durationMinutes)) {
    return createFailedOdsayTransitResult({
      id,
      errorCode: "ODSAY_PARSE_FAILED",
      diagnostics: {
        hasOdsayUriApiKey,
        odsayStatusCode: statusCode
      }
    });
  }

  return {
    id,
    provider: ODSAY_TRANSIT_PROVIDER,
    apiStatus: "success",
    errorCode: null,
    isActualApiValue: true,
    durationMinutes: Math.max(0, Math.round(durationMinutes)),
    distanceMeters: normalizeNullableMeters(pathInfo.totalDistance),
    trafficDistanceMeters: normalizeNullableMeters(pathInfo.trafficDistance),
    walkMeters: normalizeNullableMeters(pathInfo.totalWalk),
    fareKrw: normalizeNullableNumber(pathInfo.payment),
    busTransitCount: normalizeNullableNumber(pathInfo.busTransitCount),
    subwayTransitCount: normalizeNullableNumber(pathInfo.subwayTransitCount),
    firstStartStation: pathInfo.firstStartStation ? String(pathInfo.firstStartStation) : null,
    lastEndStation: pathInfo.lastEndStation ? String(pathInfo.lastEndStation) : null,
    mapObj: pathInfo.mapObj ? String(pathInfo.mapObj) : null,
    option: "recommended",
    message: null,
    diagnostics: sanitizeOdsayDiagnostics({
      hasOdsayUriApiKey,
      odsayStatusCode: statusCode
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
      resultByZoneId.set(zone.id, createFailedOdsayTransitResult({
        id: zone.id,
        errorCode: "MISSING_ODSAY_URI_KEY",
        diagnostics: { hasOdsayUriApiKey: false }
      }));
    });
    return resultByZoneId;
  }

  if (!isValidPoint(start) || typeof fetchImpl !== "function") {
    lifeZones.forEach((zone) => {
      resultByZoneId.set(zone.id, createFailedOdsayTransitResult({
        id: zone.id,
        errorCode: "NETWORK_ERROR",
        diagnostics: { hasOdsayUriApiKey: true }
      }));
    });
    return resultByZoneId;
  }

  const tasks = lifeZones.map((zone) => async () => {
    const goal = normalizeLifeZonePoint(zone);

    if (!isValidPoint(goal)) {
      return [zone.id, createFailedOdsayTransitResult({
        id: zone.id,
        errorCode: "ODSAY_PARSE_FAILED",
        diagnostics: { hasOdsayUriApiKey: true }
      })];
    }

    const cacheKey = createTransitCacheKey(start, goal, endpoint);
    const resultPromise = transitRequestCache.get(cacheKey) ??
      fetchSingleOdsayTransit({
        id: zone.id,
        start,
        goal,
        apiKey,
        endpoint,
        fetchImpl
      });

    transitRequestCache.set(cacheKey, resultPromise);
    const result = await resultPromise;
    return [zone.id, result?.id === zone.id ? result : { ...result, id: zone.id }];
  });

  const settledResults = await runWithConcurrency(tasks, Math.min(Math.max(1, concurrency), 4));
  settledResults.forEach(([zoneId, result]) => resultByZoneId.set(zoneId, result));

  return resultByZoneId;
}

export function clearOdsayTransitRequestCache() {
  transitRequestCache.clear();
}

async function fetchSingleOdsayTransit({ id, start, goal, apiKey, endpoint, fetchImpl }) {
  const requestUrl = buildOdsayTransitRequestUrl({ start, goal, apiKey, endpoint });

  if (!requestUrl) {
    return createFailedOdsayTransitResult({
      id,
      errorCode: "MISSING_ODSAY_URI_KEY",
      diagnostics: { hasOdsayUriApiKey: Boolean(apiKey) }
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
          hasOdsayUriApiKey: true,
          odsayStatusCode: response.status
        }
      });
    }

    return normalizeOdsayTransitApiResult({
      id,
      responseJson,
      statusCode: response.status,
      hasOdsayUriApiKey: true
    });
  } catch {
    return createFailedOdsayTransitResult({
      id,
      errorCode: "NETWORK_ERROR",
      diagnostics: { hasOdsayUriApiKey: true }
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

  return result.isActualApiValue === true
    ? normalizeOdsayTransitApiResult({
        id: result.id ?? null,
        responseJson: {
          result: {
            path: [{
              info: {
                totalTime: result.durationMinutes,
                totalDistance: result.distanceMeters,
                trafficDistance: result.trafficDistanceMeters,
                totalWalk: result.walkMeters,
                payment: result.fareKrw,
                busTransitCount: result.busTransitCount,
                subwayTransitCount: result.subwayTransitCount,
                firstStartStation: result.firstStartStation,
                lastEndStation: result.lastEndStation,
                mapObj: result.mapObj
              }
            }]
          }
        },
        statusCode: result.diagnostics?.odsayStatusCode ?? null,
        hasOdsayUriApiKey: result.diagnostics?.hasOdsayUriApiKey ?? true
      })
    : createFailedOdsayTransitResult({
        id: result.id ?? null,
        errorCode: result.errorCode ?? "NETWORK_ERROR",
        message: result.message ?? DEFAULT_FAILURE_MESSAGE,
        diagnostics: result.diagnostics
      });
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
    lat: lifeZone?.centerLat ?? lifeZone?.lat,
    lng: lifeZone?.centerLng ?? lifeZone?.lng
  };
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
