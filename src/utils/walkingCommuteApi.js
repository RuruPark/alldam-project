export const TMAP_PEDESTRIAN_PROVIDER = "tmap-pedestrian";

const DEFAULT_FAILURE_MESSAGE = "도보 경로를 불러오지 못했습니다.";
const DEFAULT_BATCH_ENDPOINT = "/api/commute/walking-batch";

export function createUnavailableWalkingCommuteResult(message = DEFAULT_FAILURE_MESSAGE) {
  return {
    mode: "walk",
    provider: TMAP_PEDESTRIAN_PROVIDER,
    apiStatus: "unavailable",
    errorCode: null,
    isActualApiValue: false,
    durationMinutes: null,
    distanceMeters: null,
    diagnostics: null,
    message
  };
}

export function normalizeWalkingCommuteApiResult(result = null) {
  if (!result || typeof result !== "object") {
    return createUnavailableWalkingCommuteResult();
  }

  const durationMinutes = Number(result.durationMinutes ?? result.duration ?? result.minutes);
  const distanceMeters = Number(result.distanceMeters ?? result.distance);
  const isActualApiValue = result.isActualApiValue === true && Number.isFinite(durationMinutes);

  if (!isActualApiValue) {
    return {
      mode: "walk",
      provider: TMAP_PEDESTRIAN_PROVIDER,
      apiStatus: result.apiStatus ?? result.status ?? "failed",
      errorCode: result.errorCode ?? null,
      isActualApiValue: false,
      durationMinutes: null,
      distanceMeters: null,
      diagnostics: sanitizeWalkingDiagnostics(result.diagnostics),
      message: result.message || DEFAULT_FAILURE_MESSAGE
    };
  }

  return {
    mode: "walk",
    provider: TMAP_PEDESTRIAN_PROVIDER,
    apiStatus: "success",
    errorCode: null,
    isActualApiValue: true,
    durationMinutes: Math.max(0, Math.round(durationMinutes)),
    distanceMeters: Number.isFinite(distanceMeters) ? Math.max(0, Math.round(distanceMeters)) : null,
    diagnostics: sanitizeWalkingDiagnostics(result.diagnostics),
    option: result.option ?? "pedestrian",
    message: null
  };
}

export function applyWalkingCommuteResultToTimes(commuteTimes = {}, walkingResult = null) {
  if (!walkingResult) return commuteTimes;

  const normalizedWalking = normalizeWalkingCommuteApiResult(walkingResult);

  return {
    ...commuteTimes,
    walk: normalizedWalking.isActualApiValue ? normalizedWalking.durationMinutes : null,
    walking: normalizedWalking,
    walkProvider: normalizedWalking.provider,
    walkApiStatus: normalizedWalking.apiStatus,
    walkIsActualApiValue: normalizedWalking.isActualApiValue,
    walkErrorCode: normalizedWalking.errorCode,
    walkMessage: normalizedWalking.message
  };
}

export async function fetchWalkingCommuteBatch({
  start,
  lifeZones = [],
  endpoint = DEFAULT_BATCH_ENDPOINT,
  fetchImpl = globalThis.fetch
} = {}) {
  const resultByZoneId = new Map();

  if (!isValidPoint(start) || !Array.isArray(lifeZones) || lifeZones.length === 0) {
    return resultByZoneId;
  }

  if (typeof fetchImpl !== "function") {
    lifeZones.forEach((zone) => {
      resultByZoneId.set(zone.id, createUnavailableWalkingCommuteResult());
    });
    return resultByZoneId;
  }

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        start: {
          lat: Number(start.lat),
          lng: Number(start.lng),
          name: start.name ?? start.emdName ?? "출발지"
        },
        goals: lifeZones.map((zone) => ({
          id: zone.id,
          lat: Number(zone.centerLat ?? zone.lat ?? zone.latitude ?? zone.coordinate?.lat),
          lng: Number(zone.centerLng ?? zone.lng ?? zone.longitude ?? zone.coordinate?.lng),
          isNotRecommendedCandidate: zone.isNotRecommendedCandidate === true,
          apiSelectionRole: zone.apiSelectionRole ?? null,
          name: zone.name ?? zone.emdName ?? zone.label ?? "도착지"
        }))
      })
    });
    const payload = await response.json().catch(() => null);
    const results = Array.isArray(payload?.results) ? payload.results : [];

    results.forEach((result) => {
      if (result?.id) {
        resultByZoneId.set(result.id, normalizeWalkingCommuteApiResult(result));
      }
    });

    lifeZones.forEach((zone) => {
      if (!resultByZoneId.has(zone.id)) {
        resultByZoneId.set(zone.id, normalizeWalkingCommuteApiResult({
          apiStatus: "failed",
          errorCode: payload?.errorCode ?? "NETWORK_ERROR",
          message: payload?.message ?? DEFAULT_FAILURE_MESSAGE
        }));
      }
    });
  } catch {
    lifeZones.forEach((zone) => {
      resultByZoneId.set(zone.id, normalizeWalkingCommuteApiResult({
        apiStatus: "failed",
        errorCode: "NETWORK_ERROR",
        message: DEFAULT_FAILURE_MESSAGE
      }));
    });
  }

  return resultByZoneId;
}

function isValidPoint(point = {}) {
  return Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng));
}

function sanitizeWalkingDiagnostics(diagnostics = null) {
  if (!diagnostics || typeof diagnostics !== "object") return null;

  return {
    hasTmapAppKey: Boolean(diagnostics.hasTmapAppKey),
    hasWalkingBaseUrl: Boolean(diagnostics.hasWalkingBaseUrl),
    candidateId: diagnostics.candidateId ? String(diagnostics.candidateId).slice(0, 80) : null,
    isNotRecommendedCandidate: diagnostics.isNotRecommendedCandidate === true,
    tmapStatusCode: Number.isFinite(Number(diagnostics.tmapStatusCode))
      ? Number(diagnostics.tmapStatusCode)
      : null,
    tmapErrorCode: diagnostics.tmapErrorCode ? String(diagnostics.tmapErrorCode).slice(0, 80) : null,
    tmapErrorMessage: diagnostics.tmapErrorMessage ? String(diagnostics.tmapErrorMessage).slice(0, 160) : null,
    hasFeatures: typeof diagnostics.hasFeatures === "boolean" ? diagnostics.hasFeatures : null,
    featureCount: Number.isFinite(Number(diagnostics.featureCount)) ? Number(diagnostics.featureCount) : null,
    hasTotalTime: typeof diagnostics.hasTotalTime === "boolean" ? diagnostics.hasTotalTime : null,
    hasTotalDistance: typeof diagnostics.hasTotalDistance === "boolean" ? diagnostics.hasTotalDistance : null,
    selectedDurationSource: diagnostics.selectedDurationSource ? String(diagnostics.selectedDurationSource).slice(0, 80) : null,
    totalTimeRawType: diagnostics.totalTimeRawType ? String(diagnostics.totalTimeRawType).slice(0, 40) : null,
    hasValidStartCoordinates: typeof diagnostics.hasValidStartCoordinates === "boolean"
      ? diagnostics.hasValidStartCoordinates
      : null,
    hasValidGoalCoordinates: typeof diagnostics.hasValidGoalCoordinates === "boolean"
      ? diagnostics.hasValidGoalCoordinates
      : null
  };
}
