const COMMUTE_API_MODES = {
  car: "car",
  transit: "transit",
  walk: "walk"
};

export const DEFAULT_COMMUTE_API_MODE = COMMUTE_API_MODES.car;

export function normalizeCommuteApiMode(mode) {
  return Object.values(COMMUTE_API_MODES).includes(mode) ? mode : DEFAULT_COMMUTE_API_MODE;
}

export function shouldFetchDrivingCommute(mode) {
  return normalizeCommuteApiMode(mode) === COMMUTE_API_MODES.car;
}

export function shouldFetchOdsayTransit(mode) {
  return normalizeCommuteApiMode(mode) === COMMUTE_API_MODES.transit;
}

export function shouldFetchWalkingCommute(mode) {
  return normalizeCommuteApiMode(mode) === COMMUTE_API_MODES.walk;
}

export function shouldFetchExternalCommuteApi(mode) {
  return shouldFetchDrivingCommute(mode) || shouldFetchOdsayTransit(mode) || shouldFetchWalkingCommute(mode);
}
