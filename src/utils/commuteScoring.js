import { clamp, round1 } from "./lifeZoneScoring.js";
import { estimateCommuteTimes as estimateFallbackCommuteTimes } from "./commuteEstimator.js";
import { calculateHaversineKm } from "./geoDistance.js";

export const COMMUTE_POLICIES = {
  low: { weight: 0.1, minScore: 75 },
  medium: { weight: 0.2, minScore: 60 },
  high: { weight: 0.3, minScore: 45 }
};

export const COMMUTE_MODE_LABELS = {
  car: "자동차",
  transit: "대중교통",
  walk: "도보",
  unknown: "아직 모름 기준"
};

const DEFAULT_TARGET_MINUTES = 40;

export function getCommutePolicy(commuteImportance = "medium") {
  return COMMUTE_POLICIES[commuteImportance] ?? COMMUTE_POLICIES.medium;
}

export function calculateHaversineDistanceKm(start, goal) {
  return round1(clamp(calculateHaversineKm(start, goal), 0, Number.MAX_SAFE_INTEGER));
}

export function estimateCommuteTimes(workplace, lifeZone) {
  const fallbackTimes = estimateFallbackCommuteTimes(workplace, lifeZone);

  return {
    straightDistanceKm: round1(clamp(fallbackTimes.straightDistanceKm, 0, Number.MAX_SAFE_INTEGER)),
    car: round1(clamp(fallbackTimes.car)),
    transit: round1(clamp(fallbackTimes.transit)),
    walk: round1(clamp(fallbackTimes.walk))
  };
}

export function getActualCommuteMinutes(commuteTimes = {}, commuteMode = "unknown") {
  if (commuteMode === "car") return safeMinutes(commuteTimes.car);
  if (commuteMode === "transit") return safeMinutes(commuteTimes.transit);
  if (commuteMode === "walk") return safeMinutes(commuteTimes.walk);

  return Math.min(safeMinutes(commuteTimes.car), safeMinutes(commuteTimes.transit));
}

export function calculateCommuteFitScore(actualMinutes, targetMinutes, commuteImportance = "medium") {
  const target = normalizeTargetMinutes(targetMinutes);
  const actual = safeMinutes(actualMinutes);
  const { minScore } = getCommutePolicy(commuteImportance);
  const overRatio = Math.max(0, actual - target) / target;

  return round1(clamp(100 - overRatio * 40, minScore, 100));
}

export function applyCommuteToScore(baseScore, commuteFitScore, commuteImportance = "medium") {
  const { weight } = getCommutePolicy(commuteImportance);
  const safeBaseScore = clamp(Number(baseScore), 0, 100);
  const safeCommuteScore = clamp(Number(commuteFitScore), 0, 100);

  return round1(clamp(safeBaseScore * (1 - weight) + safeCommuteScore * weight));
}

export function applyCommuteToLifeZoneScores(scoredZones = [], workplace, commutePreference = {}) {
  if (!Array.isArray(scoredZones) || scoredZones.length === 0 || !isValidPoint(workplace)) {
    return scoredZones;
  }

  return scoredZones.map((zone) => {
    const commute = buildCommuteSummary(workplace, zone, commutePreference);

    return {
      ...zone,
      baseScore: zone.totalScore,
      totalScore: applyCommuteToScore(zone.totalScore, commute.fitScore, commute.commuteImportance),
      commute
    };
  });
}

export function buildCommuteSummary(workplace, lifeZone, commutePreference = {}) {
  const commuteTimes = estimateCommuteTimes(workplace, lifeZone);
  const commuteMode = commutePreference.commuteMode ?? "unknown";
  const commuteImportance = commutePreference.commuteImportance ?? "medium";
  const targetMinutes = normalizeTargetMinutes(commutePreference.targetMinutes);
  const actualMinutes = getActualCommuteMinutes(commuteTimes, commuteMode);
  const fitScore = calculateCommuteFitScore(actualMinutes, targetMinutes, commuteImportance);

  return {
    workplace,
    commuteTimes,
    commuteMode,
    commuteModeLabel: COMMUTE_MODE_LABELS[commuteMode] ?? COMMUTE_MODE_LABELS.unknown,
    commuteImportance,
    targetMinutes,
    actualMinutes,
    fitScore,
    statusLabel: getCommuteStatusLabel(actualMinutes, targetMinutes),
    isEstimated: true
  };
}

export function getCommuteStatusLabel(actualMinutes, targetMinutes) {
  const actual = safeMinutes(actualMinutes);
  const target = normalizeTargetMinutes(targetMinutes);

  if (actual <= target) return "희망 통근시간 이내";
  if (actual <= target * 1.25) return "희망 시간에 가까운 편";
  if (actual <= target * 1.6) return "희망 시간보다 조금 길어요";
  return "통근 시간이 길 수 있어요";
}

export function normalizeTargetMinutes(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_TARGET_MINUTES;
  return Math.round(clamp(numericValue, 10, 120));
}

function isValidPoint(point) {
  return Number.isFinite(point?.lat) && Number.isFinite(point?.lng);
}

function safeMinutes(value) {
  return Number.isFinite(value) ? Math.max(0, value) : Number.MAX_SAFE_INTEGER;
}
