const COMMUTE_API_MODES = {
  car: "car",
  transit: "transit",
  walk: "walk"
};

export function normalizeCommuteApiMode(mode) {
  return Object.values(COMMUTE_API_MODES).includes(mode) ? mode : "unknown";
}

export function shouldFetchDrivingCommute(mode) {
  return normalizeCommuteApiMode(mode) === COMMUTE_API_MODES.car;
}

export function shouldFetchOdsayTransit(mode) {
  return normalizeCommuteApiMode(mode) === COMMUTE_API_MODES.transit;
}

export function shouldFetchExternalCommuteApi(mode) {
  return shouldFetchDrivingCommute(mode) || shouldFetchOdsayTransit(mode);
}
