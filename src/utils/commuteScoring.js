import { calculateHaversineKm } from "./geoDistance.js";
import { estimateCommuteTimes as estimateFallbackCommuteTimes } from "./commuteEstimator.js";

const DEFAULT_TARGET_MINUTES = 40;
const DEFAULT_IMPORTANCE = "보통";

const COMMUTE_WEIGHT_CONFIGS = {
  "낮음": { commuteWeight: 0.1, commuteMinScore: 75 },
  "보통": { commuteWeight: 0.2, commuteMinScore: 60 },
  "높음": { commuteWeight: 0.3, commuteMinScore: 45 }
};

const IMPORTANCE_ALIASES = {
  low: "낮음",
  medium: "보통",
  high: "높음"
};

const TRANSPORT_MODE_ALIASES = {
  car: "자동차",
  transit: "대중교통",
  walk: "도보",
  unknown: "아직 모름"
};

export const COMMUTE_POLICIES = {
  low: { weight: 0.1, minScore: 75 },
  medium: { weight: 0.2, minScore: 60 },
  high: { weight: 0.3, minScore: 45 }
};

export const COMMUTE_MODE_LABELS = {
  car: "자동차",
  transit: "대중교통",
  walk: "도보",
  unknown: "아직 모름",
  "자동차": "자동차",
  "대중교통": "대중교통",
  "도보": "도보",
  "아직 모름": "아직 모름"
};

export function clamp(value, min = 0, max = 100) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return min;
  return Math.min(max, Math.max(min, numericValue));
}

export function getCommuteWeightConfig(commuteImportance) {
  const normalizedImportance = normalizeCommuteImportance(commuteImportance);
  return { ...COMMUTE_WEIGHT_CONFIGS[normalizedImportance] };
}

export function calculateCommuteFitScore(input, legacyTargetMinutes, legacyCommuteImportance) {
  const {
    targetMinutes,
    actualMinutes,
    commuteImportance
  } = normalizeCommuteFitInput(input, legacyTargetMinutes, legacyCommuteImportance);
  const safeTargetMinutes = normalizeTargetMinutes(targetMinutes);
  const { commuteMinScore } = getCommuteWeightConfig(commuteImportance);

  if (actualMinutes === null || actualMinutes === undefined || !Number.isFinite(Number(actualMinutes))) {
    return commuteMinScore;
  }

  const safeActualMinutes = Math.max(0, Number(actualMinutes));
  const overRatio = Math.max(0, safeActualMinutes - safeTargetMinutes) / safeTargetMinutes;

  return roundScore(clamp(100 - overRatio * 40, commuteMinScore, 100));
}

export function selectActualCommuteMinutes({ commuteTimes = {}, transportMode } = {}) {
  const normalizedMode = normalizeTransportMode(transportMode);
  const modeKey = getCommuteTimeKey(normalizedMode);
  const selectedMinutes = getSafeMinutes(commuteTimes[modeKey]);

  if (selectedMinutes !== null && normalizedMode !== "아직 모름") {
    return selectedMinutes;
  }

  if (normalizedMode === "아직 모름") {
    const carMinutes = getSafeMinutes(commuteTimes.car);
    const transitMinutes = getSafeMinutes(commuteTimes.transit);
    const carTransitMinutes = [carMinutes, transitMinutes].filter((value) => value !== null);

    if (carTransitMinutes.length > 0) {
      return Math.min(...carTransitMinutes);
    }
  }

  const availableMinutes = ["car", "transit", "walk"]
    .map((key) => getSafeMinutes(commuteTimes[key]))
    .filter((value) => value !== null);

  return availableMinutes.length > 0 ? Math.min(...availableMinutes) : null;
}

export function calculateFinalScoreWithCommute(input, legacyCommuteFitScore, legacyCommuteImportance) {
  const {
    baseScore,
    commuteFitScore,
    commuteImportance
  } = normalizeFinalScoreInput(input, legacyCommuteFitScore, legacyCommuteImportance);
  const { commuteWeight } = getCommuteWeightConfig(commuteImportance);
  const safeCommuteWeight = clamp(commuteWeight, 0, 0.3);
  const safeBaseScore = clamp(baseScore, 0, 100);
  const safeCommuteFitScore = clamp(commuteFitScore, 0, 100);

  return roundScore(
    safeBaseScore * (1 - safeCommuteWeight) +
      safeCommuteFitScore * safeCommuteWeight
  );
}

export function getCommutePolicy(commuteImportance = "medium") {
  const normalizedImportance = normalizeCommuteImportance(commuteImportance);
  const { commuteWeight, commuteMinScore } = getCommuteWeightConfig(normalizedImportance);

  return {
    weight: commuteWeight,
    minScore: commuteMinScore,
    commuteWeight,
    commuteMinScore
  };
}

export function calculateHaversineDistanceKm(start, goal) {
  return roundScore(clamp(calculateHaversineKm(start, goal), 0, Number.MAX_SAFE_INTEGER));
}

export function estimateCommuteTimes(workplace, lifeZone) {
  return estimateFallbackCommuteTimes(workplace, lifeZone);
}

export function getActualCommuteMinutes(commuteTimes = {}, commuteMode = "unknown") {
  return selectActualCommuteMinutes({
    commuteTimes,
    transportMode: commuteMode
  });
}

export function applyCommuteToScore(baseScore, commuteFitScore, commuteImportance = "medium") {
  return calculateFinalScoreWithCommute({
    baseScore,
    commuteFitScore,
    commuteImportance
  });
}

export function applyCommuteToLifeZoneScores(scoredZones = [], workplace, commutePreference = {}) {
  if (!Array.isArray(scoredZones) || scoredZones.length === 0 || !isValidPoint(workplace)) {
    return scoredZones;
  }

  return scoredZones.map((zone) => {
    const commute = buildCommuteSummary(workplace, zone, commutePreference);
    const baseScore = resolveBaseScore(zone);

    return {
      ...zone,
      baseScore,
      finalScoreWithCommute: calculateFinalScoreWithCommute({
        baseScore,
        commuteFitScore: commute.fitScore,
        commuteImportance: commute.commuteImportance
      }),
      commute
    };
  });
}

export function buildCommuteSummary(workplace, lifeZone, commutePreference = {}) {
  const commuteTimes = estimateCommuteTimes(workplace, lifeZone);
  const commuteMode = commutePreference.commuteMode ?? commutePreference.transportMode ?? "unknown";
  const commuteImportance = commutePreference.commuteImportance ?? DEFAULT_IMPORTANCE;
  const targetMinutes = normalizeTargetMinutes(commutePreference.targetMinutes);
  const actualMinutes = selectActualCommuteMinutes({
    commuteTimes,
    transportMode: commuteMode
  });
  const fitScore = calculateCommuteFitScore({
    actualMinutes,
    targetMinutes,
    commuteImportance
  });

  return {
    workplace,
    commuteTimes,
    commuteMode,
    commuteModeLabel: COMMUTE_MODE_LABELS[commuteMode] ?? COMMUTE_MODE_LABELS[normalizeTransportMode(commuteMode)],
    commuteImportance,
    targetMinutes,
    actualMinutes,
    fitScore,
    statusLabel: getCommuteStatusLabel(actualMinutes, targetMinutes),
    isEstimated: true
  };
}

export function getCommuteStatusLabel(actualMinutes, targetMinutes) {
  if (!Number.isFinite(Number(actualMinutes))) return "통근시간 확인 필요";

  const actual = Math.max(0, Number(actualMinutes));
  const target = normalizeTargetMinutes(targetMinutes);

  if (actual <= target) return "희망 통근시간 이내";
  if (actual <= target * 1.25) return "희망 시간에 가까움";
  if (actual <= target * 1.6) return "희망 시간보다 조금 김";
  return "통근 시간이 긴 편";
}

export function normalizeTargetMinutes(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return DEFAULT_TARGET_MINUTES;
  return Math.round(clamp(numericValue, 1, 240));
}

export function normalizeCommuteImportance(commuteImportance) {
  const normalizedImportance = IMPORTANCE_ALIASES[commuteImportance] ?? commuteImportance;
  return normalizedImportance in COMMUTE_WEIGHT_CONFIGS ? normalizedImportance : DEFAULT_IMPORTANCE;
}

export function normalizeTransportMode(transportMode) {
  return TRANSPORT_MODE_ALIASES[transportMode] ?? transportMode ?? "아직 모름";
}

function normalizeCommuteFitInput(input, legacyTargetMinutes, legacyCommuteImportance) {
  if (typeof input === "object" && input !== null) {
    return input;
  }

  return {
    actualMinutes: input,
    targetMinutes: legacyTargetMinutes,
    commuteImportance: legacyCommuteImportance
  };
}

function normalizeFinalScoreInput(input, legacyCommuteFitScore, legacyCommuteImportance) {
  if (typeof input === "object" && input !== null) {
    return input;
  }

  return {
    baseScore: input,
    commuteFitScore: legacyCommuteFitScore,
    commuteImportance: legacyCommuteImportance
  };
}

function getCommuteTimeKey(transportMode) {
  if (transportMode === "자동차") return "car";
  if (transportMode === "대중교통") return "transit";
  if (transportMode === "도보") return "walk";
  return null;
}

function getSafeMinutes(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
}

function resolveBaseScore(lifeZone = {}) {
  const candidates = [
    lifeZone.totalScore,
    lifeZone.baseScore,
    lifeZone.score,
    lifeZone.finalScore
  ];
  const score = candidates.find((candidate) => Number.isFinite(Number(candidate)));

  return score === undefined ? 0 : clamp(score, 0, 100);
}

function isValidPoint(point) {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng));
}

function roundScore(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}
