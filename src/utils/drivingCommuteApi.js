export const NAVER_DIRECTIONS_PROVIDER = "naver-directions5";

const DEFAULT_FAILURE_MESSAGE = "자동차 길찾기 정보를 불러오지 못했습니다.";

export function createUnavailableDrivingCommuteResult(message = DEFAULT_FAILURE_MESSAGE) {
  return {
    mode: "car",
    provider: NAVER_DIRECTIONS_PROVIDER,
    apiStatus: "unavailable",
    isActualApiValue: false,
    durationMinutes: null,
    distanceMeters: null,
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
      isActualApiValue: false,
      durationMinutes: null,
      distanceMeters: null,
      message: result.message || DEFAULT_FAILURE_MESSAGE
    };
  }

  return {
    mode: "car",
    provider: NAVER_DIRECTIONS_PROVIDER,
    apiStatus: "success",
    isActualApiValue: true,
    durationMinutes: Math.max(0, Math.round(durationMinutes)),
    distanceMeters: Number.isFinite(distanceMeters) ? Math.max(0, Math.round(distanceMeters)) : null,
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
    carMessage: normalizedDriving.message
  };
}
