export const NAVER_DIRECTIONS_PROVIDER = "naver-directions5";
export const DEFAULT_NAVER_DIRECTIONS_BASE_URL =
  "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving";

export const DRIVING_ERROR_CODES = {
  MISSING_NAVER_ENV: "MISSING_NAVER_ENV",
  INVALID_COORDINATES: "INVALID_COORDINATES",
  NAVER_DIRECTIONS_FAILED: "NAVER_DIRECTIONS_FAILED",
  NAVER_DIRECTIONS_UNAUTHORIZED: "NAVER_DIRECTIONS_UNAUTHORIZED",
  NAVER_DIRECTIONS_FORBIDDEN: "NAVER_DIRECTIONS_FORBIDDEN",
  NAVER_DIRECTIONS_RATE_LIMITED: "NAVER_DIRECTIONS_RATE_LIMITED",
  NAVER_DIRECTIONS_NO_ROUTE: "NAVER_DIRECTIONS_NO_ROUTE",
  NAVER_DIRECTIONS_PARSE_FAILED: "NAVER_DIRECTIONS_PARSE_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR"
};

const DEFAULT_FAILURE_MESSAGE = "자동차 길찾기 정보를 불러오지 못했습니다.";
const DEFAULT_ROUTE_OPTION = "trafast";

export function createDrivingFailureResponse({
  errorCode = DRIVING_ERROR_CODES.NAVER_DIRECTIONS_FAILED,
  message = DEFAULT_FAILURE_MESSAGE,
  diagnostics = {},
  requestValid = true,
  statusCode = 200
} = {}) {
  return {
    statusCode,
    body: {
      mode: "car",
      provider: NAVER_DIRECTIONS_PROVIDER,
      apiStatus: "failed",
      errorCode,
      requestValid,
      isActualApiValue: false,
      durationMinutes: null,
      distanceMeters: null,
      diagnostics: sanitizeDiagnostics(diagnostics),
      message
    }
  };
}

export function createDrivingSuccessResponse({ durationMinutes, distanceMeters, option = DEFAULT_ROUTE_OPTION }) {
  return {
    statusCode: 200,
    body: {
      mode: "car",
      provider: NAVER_DIRECTIONS_PROVIDER,
      apiStatus: "success",
      isActualApiValue: true,
      durationMinutes: Math.max(0, Math.round(durationMinutes)),
      distanceMeters: Number.isFinite(Number(distanceMeters)) ? Math.max(0, Math.round(distanceMeters)) : null,
      option
    }
  };
}

export async function createDrivingCommuteResponse({
  start,
  goal,
  env = process.env,
  fetchImpl = globalThis.fetch,
  option = DEFAULT_ROUTE_OPTION
} = {}) {
  const clientId = String(env.NAVER_MAP_CLIENT_ID ?? "").trim();
  const clientSecret = String(env.NAVER_MAP_CLIENT_SECRET ?? "").trim();
  const baseUrl = String(env.NAVER_DIRECTIONS_BASE_URL ?? DEFAULT_NAVER_DIRECTIONS_BASE_URL).trim();
  const baseDiagnostics = {
    hasClientId: clientId.length > 0,
    hasClientSecret: clientSecret.length > 0
  };

  if (!clientId || !clientSecret) {
    return createDrivingFailureResponse({
      errorCode: DRIVING_ERROR_CODES.MISSING_NAVER_ENV,
      diagnostics: baseDiagnostics
    });
  }

  const normalizedStart = normalizeRoutePoint(start);
  const normalizedGoal = normalizeRoutePoint(goal);

  if (!normalizedStart || !normalizedGoal) {
    return createDrivingFailureResponse({
      errorCode: DRIVING_ERROR_CODES.INVALID_COORDINATES,
      requestValid: false,
      statusCode: 400,
      diagnostics: baseDiagnostics,
      message: "출발지 또는 도착지 좌표가 올바르지 않습니다."
    });
  }

  if (typeof fetchImpl !== "function") {
    return createDrivingFailureResponse({
      errorCode: DRIVING_ERROR_CODES.NETWORK_ERROR,
      diagnostics: baseDiagnostics
    });
  }

  const requestUrl = buildNaverDirectionsRequestUrl({
    baseUrl,
    start: normalizedStart,
    goal: normalizedGoal,
    option
  });

  try {
    const response = await fetchImpl(requestUrl, {
      method: "GET",
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret
      }
    });
    const responseText = await response.text();
    const parsedBody = parseJsonSafely(responseText);
    const diagnostics = {
      ...baseDiagnostics,
      naverStatusCode: response.status,
      naverErrorCode: extractNaverErrorCode(parsedBody),
      naverErrorMessage: extractNaverErrorMessage(parsedBody)
    };

    if (!response.ok) {
      return createDrivingFailureResponse({
        errorCode: mapNaverHttpStatusToErrorCode(response.status),
        diagnostics
      });
    }

    const parsedRoute = parseNaverDirectionsPayload(parsedBody);

    if (parsedRoute.errorCode) {
      return createDrivingFailureResponse({
        errorCode: parsedRoute.errorCode,
        diagnostics
      });
    }

    return createDrivingSuccessResponse({
      durationMinutes: parsedRoute.durationMinutes,
      distanceMeters: parsedRoute.distanceMeters,
      option
    });
  } catch (error) {
    return createDrivingFailureResponse({
      errorCode: DRIVING_ERROR_CODES.NETWORK_ERROR,
      diagnostics: {
        ...baseDiagnostics,
        networkErrorName: error?.name
      }
    });
  }
}

export async function createDrivingBatchResponse({
  start,
  goals = [],
  env = process.env,
  fetchImpl = globalThis.fetch
} = {}) {
  if (!Array.isArray(goals) || goals.length === 0) {
    return {
      statusCode: 400,
      body: {
        provider: NAVER_DIRECTIONS_PROVIDER,
        apiStatus: "failed",
        errorCode: DRIVING_ERROR_CODES.INVALID_COORDINATES,
        results: [],
        message: "도착지 목록이 비어 있습니다."
      }
    };
  }

  const results = [];

  for (const goal of goals) {
    const response = await createDrivingCommuteResponse({
      start,
      goal,
      env,
      fetchImpl
    });

    results.push({
      id: goal?.id ?? goal?.emdCode ?? null,
      ...response.body
    });
  }

  const successCount = results.filter((result) => result.apiStatus === "success").length;

  return {
    statusCode: 200,
    body: {
      provider: NAVER_DIRECTIONS_PROVIDER,
      apiStatus: successCount === results.length ? "success" : successCount > 0 ? "partial" : "failed",
      results
    }
  };
}

export function buildNaverDirectionsRequestUrl({
  baseUrl = DEFAULT_NAVER_DIRECTIONS_BASE_URL,
  start,
  goal,
  option = DEFAULT_ROUTE_OPTION
} = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set("start", `${start.lng},${start.lat}`);
  url.searchParams.set("goal", `${goal.lng},${goal.lat}`);
  url.searchParams.set("option", option);

  return url.toString();
}

export function parseNaverDirectionsPayload(payload) {
  const routes = payload?.route;

  if (!routes || typeof routes !== "object") {
    return { errorCode: DRIVING_ERROR_CODES.NAVER_DIRECTIONS_NO_ROUTE };
  }

  const routeCandidates = [
    ...(Array.isArray(routes.trafast) ? routes.trafast : []),
    ...(Array.isArray(routes.traoptimal) ? routes.traoptimal : []),
    ...(Array.isArray(routes.tracomfort) ? routes.tracomfort : []),
    ...(Array.isArray(routes.traavoidtoll) ? routes.traavoidtoll : []),
    ...(Array.isArray(routes.traavoidcaronly) ? routes.traavoidcaronly : [])
  ];
  const summary = routeCandidates[0]?.summary;

  if (!summary) {
    return { errorCode: DRIVING_ERROR_CODES.NAVER_DIRECTIONS_NO_ROUTE };
  }

  const durationMs = Number(summary.duration);
  const distanceMeters = Number(summary.distance);

  if (!Number.isFinite(durationMs)) {
    return { errorCode: DRIVING_ERROR_CODES.NAVER_DIRECTIONS_PARSE_FAILED };
  }

  return {
    durationMinutes: durationMs / 60000,
    distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null
  };
}

export function mapNaverHttpStatusToErrorCode(status) {
  if (status === 401) return DRIVING_ERROR_CODES.NAVER_DIRECTIONS_UNAUTHORIZED;
  if (status === 403) return DRIVING_ERROR_CODES.NAVER_DIRECTIONS_FORBIDDEN;
  if (status === 429) return DRIVING_ERROR_CODES.NAVER_DIRECTIONS_RATE_LIMITED;

  return DRIVING_ERROR_CODES.NAVER_DIRECTIONS_FAILED;
}

export function normalizeRoutePoint(point = {}) {
  const lat = Number(point.lat ?? point.centerLat);
  const lng = Number(point.lng ?? point.centerLng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

function parseJsonSafely(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function extractNaverErrorCode(body) {
  return body?.error?.errorCode ?? body?.errorCode ?? body?.code ?? null;
}

function extractNaverErrorMessage(body) {
  return body?.error?.message ?? body?.message ?? null;
}

function sanitizeDiagnostics(diagnostics = {}) {
  return {
    hasClientId: Boolean(diagnostics.hasClientId),
    hasClientSecret: Boolean(diagnostics.hasClientSecret),
    naverStatusCode: Number.isFinite(Number(diagnostics.naverStatusCode))
      ? Number(diagnostics.naverStatusCode)
      : undefined,
    naverErrorCode: diagnostics.naverErrorCode ? String(diagnostics.naverErrorCode).slice(0, 80) : undefined,
    naverErrorMessage: diagnostics.naverErrorMessage ? String(diagnostics.naverErrorMessage).slice(0, 160) : undefined,
    networkErrorName: diagnostics.networkErrorName ? String(diagnostics.networkErrorName).slice(0, 80) : undefined
  };
}
