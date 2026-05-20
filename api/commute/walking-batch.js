export const TMAP_PEDESTRIAN_PROVIDER = "tmap-pedestrian";

export const TMAP_WALK_ERROR_CODES = {
  MISSING_TMAP_WALK_ENV: "MISSING_TMAP_WALK_ENV",
  TMAP_WALK_AUTH_FAILED: "TMAP_WALK_AUTH_FAILED",
  TMAP_WALK_FORBIDDEN: "TMAP_WALK_FORBIDDEN",
  TMAP_WALK_RATE_LIMITED: "TMAP_WALK_RATE_LIMITED",
  TMAP_WALK_NO_ROUTE: "TMAP_WALK_NO_ROUTE",
  TMAP_WALK_INVALID_COORDINATES: "TMAP_WALK_INVALID_COORDINATES",
  TMAP_WALK_PARSE_FAILED: "TMAP_WALK_PARSE_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR"
};

const DEFAULT_FAILURE_MESSAGE = "도보 경로를 불러오지 못했습니다.";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const body = parseRequestBody(request.body);
  const result = await createWalkingBatchResponse({
    start: body?.start,
    goals: body?.goals
  });

  response.status(result.statusCode).json(result.body);
}

export async function createWalkingBatchResponse({
  start,
  goals = [],
  env = process.env,
  fetchImpl = globalThis.fetch
} = {}) {
  if (!Array.isArray(goals) || goals.length === 0) {
    return {
      statusCode: 400,
      body: {
        provider: TMAP_PEDESTRIAN_PROVIDER,
        apiStatus: "failed",
        errorCode: TMAP_WALK_ERROR_CODES.TMAP_WALK_INVALID_COORDINATES,
        results: [],
        message: "도착지 목록이 비어 있습니다."
      }
    };
  }

  const baseUrl = String(env.TMAP_PEDESTRIAN_BASE_URL ?? "").trim();
  const appKey = String(env.TMAP_PEDESTRIAN_APP_KEY ?? "").trim();
  const batchDiagnostics = {
    hasTmapAppKey: appKey.length > 0,
    hasWalkingBaseUrl: baseUrl.length > 0
  };

  const results = [];
  for (const goal of goals) {
    const result = await createWalkingCommuteResponse({
      start,
      goal,
      env,
      fetchImpl
    });

    results.push({
      id: goal?.id ?? goal?.emdCode ?? null,
      ...result.body
    });
  }

  const successCount = results.filter((result) => result.apiStatus === "success").length;

  return {
    statusCode: 200,
    body: {
      provider: TMAP_PEDESTRIAN_PROVIDER,
      apiStatus: successCount === results.length ? "success" : successCount > 0 ? "partial" : "failed",
      results,
      diagnostics: sanitizeWalkingDiagnostics(batchDiagnostics)
    }
  };
}

export async function createWalkingCommuteResponse({
  start,
  goal,
  env = process.env,
  fetchImpl = globalThis.fetch
} = {}) {
  const baseUrl = String(env.TMAP_PEDESTRIAN_BASE_URL ?? "").trim();
  const appKey = String(env.TMAP_PEDESTRIAN_APP_KEY ?? "").trim();
  const baseDiagnostics = {
    hasTmapAppKey: appKey.length > 0,
    hasWalkingBaseUrl: baseUrl.length > 0,
    candidateId: goal?.id ?? goal?.emdCode ?? null,
    isNotRecommendedCandidate: isNotRecommendedCandidate(goal)
  };

  if (!baseUrl || !appKey) {
    return createWalkingFailureResponse({
      errorCode: TMAP_WALK_ERROR_CODES.MISSING_TMAP_WALK_ENV,
      diagnostics: baseDiagnostics
    });
  }

  const normalizedStart = normalizeRoutePoint(start);
  const normalizedGoal = normalizeRoutePoint(goal);

  if (!normalizedStart || !normalizedGoal) {
    return createWalkingFailureResponse({
      errorCode: TMAP_WALK_ERROR_CODES.TMAP_WALK_INVALID_COORDINATES,
      requestValid: false,
      statusCode: 400,
      diagnostics: {
        ...baseDiagnostics,
        hasValidStartCoordinates: Boolean(normalizedStart),
        hasValidGoalCoordinates: Boolean(normalizedGoal)
      },
      message: "도보 경로 좌표를 확인하지 못했습니다."
    });
  }

  if (typeof fetchImpl !== "function") {
    return createWalkingFailureResponse({
      errorCode: TMAP_WALK_ERROR_CODES.NETWORK_ERROR,
      diagnostics: baseDiagnostics
    });
  }

  try {
    const response = await fetchImpl(buildTmapPedestrianRequestUrl(baseUrl), {
      method: "POST",
      headers: {
        appKey,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createTmapPedestrianRequestBody({
        start: normalizedStart,
        goal: normalizedGoal
      }))
    });
    const responseText = await response.text();
    const parsedBody = parseJsonSafely(responseText);
    const diagnostics = {
      ...baseDiagnostics,
      tmapStatusCode: response.status,
      hasValidStartCoordinates: true,
      hasValidGoalCoordinates: true,
      tmapErrorCode: redactSensitiveText(extractTmapErrorCode(parsedBody), [appKey]),
      tmapErrorMessage: redactSensitiveText(extractTmapErrorMessage(parsedBody), [appKey])
    };

    if (!response.ok) {
      return createWalkingFailureResponse({
        errorCode: mapTmapHttpStatusToErrorCode(response.status, parsedBody),
        diagnostics
      });
    }

    const bodyErrorCode = mapTmapBodyErrorToErrorCode(parsedBody);
    if (bodyErrorCode) {
      return createWalkingFailureResponse({
        errorCode: bodyErrorCode,
        diagnostics
      });
    }

    const parsedRoute = parseTmapPedestrianPayload(parsedBody);
    if (parsedRoute.errorCode) {
      return createWalkingFailureResponse({
        errorCode: parsedRoute.errorCode,
        diagnostics: {
          ...diagnostics,
          ...parsedRoute.diagnostics
        }
      });
    }

    return createWalkingSuccessResponse({
      durationMinutes: parsedRoute.durationMinutes,
      distanceMeters: parsedRoute.distanceMeters,
      diagnostics: {
        ...diagnostics,
        ...parsedRoute.diagnostics
      }
    });
  } catch (error) {
    return createWalkingFailureResponse({
      errorCode: TMAP_WALK_ERROR_CODES.NETWORK_ERROR,
      diagnostics: {
        ...baseDiagnostics,
        networkErrorName: error?.name
      }
    });
  }
}

export function createWalkingFailureResponse({
  errorCode = TMAP_WALK_ERROR_CODES.NETWORK_ERROR,
  message = DEFAULT_FAILURE_MESSAGE,
  diagnostics = {},
  requestValid = true,
  statusCode = 200
} = {}) {
  return {
    statusCode,
    body: {
      mode: "walk",
      provider: TMAP_PEDESTRIAN_PROVIDER,
      apiStatus: "failed",
      errorCode,
      requestValid,
      isActualApiValue: false,
      durationMinutes: null,
      distanceMeters: null,
      diagnostics: sanitizeWalkingDiagnostics(diagnostics),
      message
    }
  };
}

export function createWalkingSuccessResponse({ durationMinutes, distanceMeters, diagnostics = {} }) {
  return {
    statusCode: 200,
    body: {
      mode: "walk",
      provider: TMAP_PEDESTRIAN_PROVIDER,
      apiStatus: "success",
      isActualApiValue: true,
      durationMinutes: Math.max(0, Math.ceil(Number(durationMinutes))),
      distanceMeters: Number.isFinite(Number(distanceMeters)) ? Math.max(0, Math.round(distanceMeters)) : null,
      option: "pedestrian",
      diagnostics: sanitizeWalkingDiagnostics(diagnostics),
      message: null
    }
  };
}

export function buildTmapPedestrianRequestUrl(baseUrl) {
  const url = new URL(baseUrl);
  url.searchParams.set("version", "1");
  return url.toString();
}

export function createTmapPedestrianRequestBody({ start, goal } = {}) {
  return {
    startX: String(start.lng),
    startY: String(start.lat),
    endX: String(goal.lng),
    endY: String(goal.lat),
    reqCoordType: "WGS84GEO",
    resCoordType: "WGS84GEO",
    startName: encodeURIComponent(start.name ?? "출발지"),
    endName: encodeURIComponent(goal.name ?? goal.label ?? "도착지"),
    searchOption: "0"
  };
}

export function parseTmapPedestrianPayload(payload) {
  const features = Array.isArray(payload?.features) ? payload.features : null;
  const diagnostics = {
    hasFeatures: Array.isArray(features),
    featureCount: Array.isArray(features) ? features.length : 0,
    hasTotalTime: false,
    hasTotalDistance: false,
    selectedDurationSource: null,
    totalTimeRawType: null
  };

  if (!features || features.length === 0) {
    return {
      errorCode: TMAP_WALK_ERROR_CODES.TMAP_WALK_PARSE_FAILED,
      diagnostics
    };
  }

  const summaryFeature = features.find((feature) => Number.isFinite(Number(feature?.properties?.totalTime)));
  const properties = summaryFeature?.properties;
  const totalTimeRaw = properties?.totalTime;
  const totalTimeSeconds = Number(totalTimeRaw);

  if (!properties || !Number.isFinite(totalTimeSeconds) || totalTimeSeconds <= 0) {
    return {
      errorCode: TMAP_WALK_ERROR_CODES.TMAP_WALK_PARSE_FAILED,
      diagnostics
    };
  }

  const distanceSourceFeature = Number.isFinite(Number(properties.totalDistance))
    ? summaryFeature
    : features.find((feature) => Number.isFinite(Number(feature?.properties?.totalDistance)));
  const distanceMeters = Number(distanceSourceFeature?.properties?.totalDistance);
  diagnostics.hasTotalTime = true;
  diagnostics.hasTotalDistance = Number.isFinite(distanceMeters);
  diagnostics.selectedDurationSource = "features.properties.totalTime";
  diagnostics.totalTimeRawType = typeof totalTimeRaw;

  return {
    durationMinutes: Math.ceil(totalTimeSeconds / 60),
    distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
    diagnostics
  };
}

export function mapTmapHttpStatusToErrorCode(status, body = null) {
  const message = String(extractTmapErrorMessage(body) ?? "").toLowerCase();
  const bodyCode = mapTmapBodyErrorToErrorCode(body);

  if (bodyCode) return bodyCode;

  if (status === 401) return TMAP_WALK_ERROR_CODES.TMAP_WALK_AUTH_FAILED;
  if (status === 403) return TMAP_WALK_ERROR_CODES.TMAP_WALK_FORBIDDEN;
  if (status === 429) return TMAP_WALK_ERROR_CODES.TMAP_WALK_RATE_LIMITED;
  if (status === 400 && (message.includes("coord") || message.includes("coordinate") || message.includes("좌표"))) {
    return TMAP_WALK_ERROR_CODES.TMAP_WALK_INVALID_COORDINATES;
  }
  if (status === 404 || message.includes("route") || message.includes("경로")) {
    return TMAP_WALK_ERROR_CODES.TMAP_WALK_NO_ROUTE;
  }

  return TMAP_WALK_ERROR_CODES.NETWORK_ERROR;
}

export function mapTmapBodyErrorToErrorCode(body = null) {
  const code = String(extractTmapErrorCode(body) ?? "").toLowerCase();
  const message = String(extractTmapErrorMessage(body) ?? "").toLowerCase();

  if (!code && !message) return null;
  if (code === "401" || message.includes("auth") || message.includes("appkey") || message.includes("api key")) {
    return TMAP_WALK_ERROR_CODES.TMAP_WALK_AUTH_FAILED;
  }
  if (code === "403" || message.includes("forbidden") || message.includes("permission")) {
    return TMAP_WALK_ERROR_CODES.TMAP_WALK_FORBIDDEN;
  }
  if (code === "429" || message.includes("rate") || message.includes("quota") || message.includes("limit")) {
    return TMAP_WALK_ERROR_CODES.TMAP_WALK_RATE_LIMITED;
  }
  if (message.includes("coord") || message.includes("coordinate") || message.includes("좌표")) {
    return TMAP_WALK_ERROR_CODES.TMAP_WALK_INVALID_COORDINATES;
  }
  if (code === "404" || message.includes("route") || message.includes("path") || message.includes("경로")) {
    return TMAP_WALK_ERROR_CODES.TMAP_WALK_NO_ROUTE;
  }

  return TMAP_WALK_ERROR_CODES.NETWORK_ERROR;
}

export function normalizeRoutePoint(point = {}) {
  const lat = Number(point.lat ?? point.centerLat ?? point.latitude ?? point.coordinate?.lat);
  const lng = Number(point.lng ?? point.centerLng ?? point.longitude ?? point.coordinate?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return {
    lat,
    lng,
    name: point.name ?? point.label ?? point.emdName ?? null
  };
}

function parseJsonSafely(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function parseRequestBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body && typeof body === "object" ? body : {};
}

function extractTmapErrorCode(body) {
  const error = Array.isArray(body?.error) ? body.error[0] : body?.error;
  return error?.code ?? body?.errorCode ?? body?.code ?? body?.status ?? null;
}

function extractTmapErrorMessage(body) {
  const error = Array.isArray(body?.error) ? body.error[0] : body?.error;
  return error?.message ?? body?.errorMessage ?? body?.message ?? body?.msg ?? null;
}

function redactSensitiveText(value, sensitiveValues = []) {
  if (value === null || value === undefined || value === "") return null;

  let text = String(value);
  sensitiveValues
    .filter((sensitiveValue) => typeof sensitiveValue === "string" && sensitiveValue.length > 0)
    .forEach((sensitiveValue) => {
      text = text.split(sensitiveValue).join("[redacted]");
    });

  return text;
}

function sanitizeWalkingDiagnostics(diagnostics = {}) {
  return {
    hasTmapAppKey: Boolean(diagnostics.hasTmapAppKey),
    hasWalkingBaseUrl: Boolean(diagnostics.hasWalkingBaseUrl),
    candidateId: diagnostics.candidateId ? String(diagnostics.candidateId).slice(0, 80) : undefined,
    isNotRecommendedCandidate: diagnostics.isNotRecommendedCandidate === true,
    tmapStatusCode: Number.isFinite(Number(diagnostics.tmapStatusCode))
      ? Number(diagnostics.tmapStatusCode)
      : undefined,
    tmapErrorCode: diagnostics.tmapErrorCode ? String(diagnostics.tmapErrorCode).slice(0, 80) : undefined,
    tmapErrorMessage: diagnostics.tmapErrorMessage ? String(diagnostics.tmapErrorMessage).slice(0, 160) : undefined,
    hasFeatures: typeof diagnostics.hasFeatures === "boolean" ? diagnostics.hasFeatures : undefined,
    featureCount: Number.isFinite(Number(diagnostics.featureCount)) ? Number(diagnostics.featureCount) : undefined,
    hasTotalTime: typeof diagnostics.hasTotalTime === "boolean" ? diagnostics.hasTotalTime : undefined,
    hasTotalDistance: typeof diagnostics.hasTotalDistance === "boolean" ? diagnostics.hasTotalDistance : undefined,
    selectedDurationSource: diagnostics.selectedDurationSource ? String(diagnostics.selectedDurationSource).slice(0, 80) : undefined,
    totalTimeRawType: diagnostics.totalTimeRawType ? String(diagnostics.totalTimeRawType).slice(0, 40) : undefined,
    hasValidStartCoordinates: typeof diagnostics.hasValidStartCoordinates === "boolean"
      ? diagnostics.hasValidStartCoordinates
      : undefined,
    hasValidGoalCoordinates: typeof diagnostics.hasValidGoalCoordinates === "boolean"
      ? diagnostics.hasValidGoalCoordinates
      : undefined,
    networkErrorName: diagnostics.networkErrorName ? String(diagnostics.networkErrorName).slice(0, 80) : undefined
  };
}

function isNotRecommendedCandidate(goal = null) {
  return goal?.isNotRecommendedCandidate === true || goal?.apiSelectionRole === "notRecommended";
}
