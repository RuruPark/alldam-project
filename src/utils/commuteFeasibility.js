const MIN_TARGET_MINUTES = 10;
const MAX_TARGET_MINUTES = 90;
const DEFAULT_TARGET_MINUTES = 40;

export const COMMUTE_FEASIBILITY_STATUSES = {
  withinTarget: "withinTarget",
  acceptable: "acceptable",
  far: "far",
  unrealistic: "unrealistic"
};

const TRANSPORT_MODE_ALIASES = {
  car: "자동차",
  transit: "대중교통",
  walk: "도보",
  unknown: "자동차",
  notSure: "자동차",
  unsure: "자동차",
  "자동차": "자동차",
  "대중교통": "대중교통",
  "도보": "도보",
  "아직 모름": "자동차"
};

const STATUS_LABELS = {
  withinTarget: "희망 시간 이내",
  acceptable: "허용 범위 내",
  far: "희망 시간보다 다소 김",
  unrealistic: "희망 통근 조건과 거리가 큼"
};

export function getCommuteToleranceMinutes(targetMinutes, transportMode) {
  const target = normalizeTargetMinutesForFeasibility(targetMinutes);
  const normalizedMode = normalizeTransportModeForFeasibility(transportMode);

  if (normalizedMode === "도보") return round1(Math.max(target * 0.25, 10));
  if (normalizedMode === "자동차") return round1(Math.max(target * 0.3, 15));
  if (normalizedMode === "대중교통") return round1(Math.max(target * 0.35, 20));

  return round1(Math.max(target * 0.35, 20));
}

export function getCommuteFeasibilityStatus({ targetMinutes, actualMinutes, transportMode } = {}) {
  const target = normalizeTargetMinutesForFeasibility(targetMinutes);
  if (actualMinutes === null || actualMinutes === undefined || actualMinutes === "") {
    return COMMUTE_FEASIBILITY_STATUSES.unrealistic;
  }

  const actual = Number(actualMinutes);

  if (!Number.isFinite(actual) || actual < 0) {
    return COMMUTE_FEASIBILITY_STATUSES.unrealistic;
  }

  const tolerance = getCommuteToleranceMinutes(target, transportMode);

  if (actual <= target) return COMMUTE_FEASIBILITY_STATUSES.withinTarget;
  if (actual <= target + tolerance) return COMMUTE_FEASIBILITY_STATUSES.acceptable;
  if (actual <= target + tolerance * 2) return COMMUTE_FEASIBILITY_STATUSES.far;
  return COMMUTE_FEASIBILITY_STATUSES.unrealistic;
}

export function isCommuteRecommendedCandidate(input = {}) {
  const status = typeof input === "string" ? input : getCommuteFeasibilityStatus(input);

  return status === COMMUTE_FEASIBILITY_STATUSES.withinTarget ||
    status === COMMUTE_FEASIBILITY_STATUSES.acceptable;
}

export function getCommuteFeasibilityLabel(status) {
  return STATUS_LABELS[status] ?? STATUS_LABELS.unrealistic;
}

export function normalizeTransportModeForFeasibility(transportMode) {
  return TRANSPORT_MODE_ALIASES[transportMode] ?? "아직 모름";
}

function normalizeTargetMinutesForFeasibility(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return DEFAULT_TARGET_MINUTES;
  return Math.round(Math.min(MAX_TARGET_MINUTES, Math.max(MIN_TARGET_MINUTES, numericValue)));
}

function round1(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}
