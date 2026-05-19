export const NAVER_DIRECTIONS_PROVIDER = "naver-directions5";

const DEFAULT_FAILURE_MESSAGE = "자동차 길찾기 정보를 불러오지 못했습니다.";
const DEFAULT_BATCH_ENDPOINT = "/api/commute/driving-batch";

export function createUnavailableDrivingCommuteResult(message = DEFAULT_FAILURE_MESSAGE) {
  return {
    mode: "car",
    provider: NAVER_DIRECTIONS_PROVIDER,
    apiStatus: "unavailable",
    errorCode: null,
    isActualApiValue: false,
    durationMinutes: null,
    distanceMeters: null,
    diagnostics: null,
    message
  };
}

export function normalizeDrivingCommuteApiResult(result = null) {
  if (!result || typeof result !== "object") {
    return createUnavailableDrivingCommuteResult();
  }

  const durationMinutes = Number(result.durationMinutes ?? result.duration ?? result.minutes);
  const distanceMeters = Number(result.distanceMeters ?? result.distance);
  const isActualApiValue = result.isActualApiValue === true && Number.isFinite(durationMinutes);

  if (!isActualApiValue) {
    return {
      mode: "car",
      provider: NAVER_DIRECTIONS_PROVIDER,
      apiStatus: result.apiStatus ?? result.status ?? "failed",
      errorCode: result.errorCode ?? null,
      isActualApiValue: false,
      durationMinutes: null,
      distanceMeters: null,
      diagnostics: sanitizeDiagnostics(result.diagnostics),
      message: result.message || DEFAULT_FAILURE_MESSAGE
    };
  }

  return {
    mode: "car",
    provider: NAVER_DIRECTIONS_PROVIDER,
    apiStatus: "success",
    errorCode: null,
    isActualApiValue: true,
    durationMinutes: Math.max(0, Math.round(durationMinutes)),
    distanceMeters: Number.isFinite(distanceMeters) ? Math.max(0, Math.round(distanceMeters)) : null,
    diagnostics: sanitizeDiagnostics(result.diagnostics),
    option: result.option ?? null,
    message: null
  };
}

export function applyDrivingCommuteResultToTimes(commuteTimes = {}, drivingResult = null) {
  const normalizedDriving = normalizeDrivingCommuteApiResult(drivingResult);

  return {
    ...commuteTimes,
    car: normalizedDriving.isActualApiValue ? normalizedDriving.durationMinutes : null,
    driving: normalizedDriving,
    carProvider: normalizedDriving.provider,
    carApiStatus: normalizedDriving.apiStatus,
    carIsActualApiValue: normalizedDriving.isActualApiValue,
    carErrorCode: normalizedDriving.errorCode,
    carMessage: normalizedDriving.message
  };
}

export async function fetchDrivingCommuteBatch({
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
      resultByZoneId.set(zone.id, createUnavailableDrivingCommuteResult());
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
          lng: Number(start.lng)
        },
        goals: lifeZones.map((zone) => ({
          id: zone.id,
          lat: Number(zone.centerLat ?? zone.lat),
          lng: Number(zone.centerLng ?? zone.lng)
        }))
      })
    });
    const payload = await response.json().catch(() => null);
    const results = Array.isArray(payload?.results) ? payload.results : [];

    results.forEach((result) => {
      if (result?.id) {
        resultByZoneId.set(result.id, normalizeDrivingCommuteApiResult(result));
      }
    });

    lifeZones.forEach((zone) => {
      if (!resultByZoneId.has(zone.id)) {
        resultByZoneId.set(zone.id, normalizeDrivingCommuteApiResult({
          apiStatus: "failed",
          errorCode: payload?.errorCode ?? "NETWORK_ERROR",
          message: payload?.message ?? DEFAULT_FAILURE_MESSAGE
        }));
      }
    });
  } catch {
    lifeZones.forEach((zone) => {
      resultByZoneId.set(zone.id, normalizeDrivingCommuteApiResult({
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

function sanitizeDiagnostics(diagnostics = null) {
  if (!diagnostics || typeof diagnostics !== "object") return null;

  return {
    hasClientId: Boolean(diagnostics.hasClientId),
    hasClientSecret: Boolean(diagnostics.hasClientSecret),
    naverStatusCode: Number.isFinite(Number(diagnostics.naverStatusCode))
      ? Number(diagnostics.naverStatusCode)
      : null,
    naverErrorCode: diagnostics.naverErrorCode ? String(diagnostics.naverErrorCode).slice(0, 80) : null,
    naverErrorMessage: diagnostics.naverErrorMessage ? String(diagnostics.naverErrorMessage).slice(0, 160) : null
  };
}
