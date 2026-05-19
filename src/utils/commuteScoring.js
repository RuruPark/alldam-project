import { calculateHaversineKm } from "./geoDistance.js";
import { estimateCommuteTimes as estimateFallbackCommuteTimes } from "./commuteEstimator.js";
import {
  getCommuteFeasibilityLabel,
  getCommuteFeasibilityStatus,
  isCommuteRecommendedCandidate
} from "./commuteFeasibility.js";

export const MIN_TARGET_MINUTES = 10;
export const MAX_TARGET_MINUTES = 90;
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

  if (normalizedMode !== "아직 모름" && modeKey) {
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
    const finalScoreWithCommute = commute.isCommuteScoreApplied
      ? calculateFinalScoreWithCommute({
          baseScore,
          commuteFitScore: commute.fitScore,
          commuteImportance: commute.commuteImportance
        })
      : baseScore;

    return {
      ...zone,
      baseScore,
      finalScoreWithCommute,
      commute
    };
  });
}

export function getTopAndLowZonesWithCommuteFeasibility(scoredLifeZones = []) {
  if (!Array.isArray(scoredLifeZones) || scoredLifeZones.length === 0) {
    return {
      recommendedZones: [],
      lowZone: null,
      displayZones: [],
      commuteFeasibilityNotice: null,
      commuteFeasibilitySummary: createCommuteFeasibilitySummary([])
    };
  }

  const sortedZones = sortByRecommendationScore(scoredLifeZones);
  const preferredCandidates = sortedZones.filter((zone) => isPreferredCommuteStatus(getZoneFeasibilityStatus(zone)));
  const farCandidates = sortedZones.filter((zone) => getZoneFeasibilityStatus(zone) === "far");
  const unrealisticCandidates = sortedZones.filter((zone) => getZoneFeasibilityStatus(zone) === "unrealistic");
  const selectedCandidates = [];
  const isCarMode = scoredLifeZones.some((zone) => zone.commute?.commuteMode === "car");
  const hasAppliedCommuteScore = scoredLifeZones.some((zone) => zone.commute?.isCommuteScoreApplied === true);

  addUniqueZones(selectedCandidates, preferredCandidates);
  addUniqueZones(selectedCandidates, farCandidates, 2);

  let usedScoreFallback = false;
  if (selectedCandidates.length < 2) {
    usedScoreFallback = true;
    addUniqueZones(selectedCandidates, sortByFallbackCommuteDistance(unrealisticCandidates), 2);
    addUniqueZones(selectedCandidates, sortedZones, 2);
  }

  const recommendedZones = selectedCandidates.slice(0, Math.min(2, sortedZones.length)).map((zone, index) => ({
    ...zone,
    rankType: "recommended",
    rankLabel: `추천 TOP ${index + 1}`
  }));
  const recommendedIds = new Set(recommendedZones.map((zone) => zone.id));
  const lowCandidate = [...scoredLifeZones]
    .filter((zone) => !recommendedIds.has(zone.id))
    .sort(compareLowCandidate)[0] ?? null;
  const lowZone = lowCandidate
    ? {
        ...lowCandidate,
        rankType: "low",
        rankLabel: "비추천"
      }
    : null;
  const displayZones = lowZone ? [...recommendedZones, lowZone] : [...recommendedZones];

  return {
    recommendedZones,
    lowZone,
    displayZones,
    commuteFeasibilityNotice: createCommuteNotice({ usedScoreFallback, isCarMode, hasAppliedCommuteScore }),
    commuteFeasibilitySummary: createCommuteFeasibilitySummary(scoredLifeZones, { usedScoreFallback })
  };
}
export function buildCommuteSummary(workplace, lifeZone, commutePreference = {}) {
  const commuteTimes = estimateCommuteTimes(workplace, lifeZone);
  const commuteMode = commutePreference.commuteMode ?? commutePreference.transportMode ?? "unknown";
  const commuteImportance = commutePreference.commuteImportance ?? DEFAULT_IMPORTANCE;
  const targetMinutes = normalizeTargetMinutes(commutePreference.targetMinutes);
  const modeKey = getCommuteTimeKey(normalizeTransportMode(commuteMode));
  const actualMinutes = selectActualCommuteMinutes({
    commuteTimes,
    transportMode: commuteMode
  });
  const isCarMode = modeKey === "car";
  const isDrivingActualApiValue = commuteTimes.driving?.isActualApiValue === true;
  const isCommuteScoreApplied = !isCarMode || isDrivingActualApiValue;
  const fitScore = isCommuteScoreApplied
    ? calculateCommuteFitScore({
        actualMinutes,
        targetMinutes,
        commuteImportance
      })
    : null;
  const feasibilityStatus = getCommuteFeasibilityStatus({
    actualMinutes,
    targetMinutes,
    transportMode: commuteMode
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
    feasibilityStatus,
    feasibilityLabel: getCommuteFeasibilityLabel(feasibilityStatus),
    isRecommendedCandidate: isCommuteRecommendedCandidate(feasibilityStatus),
    statusLabel: getCommuteStatusLabel(actualMinutes, targetMinutes),
    isEstimated: true,
    isCommuteScoreApplied,
    isDrivingActualApiValue,
    drivingApiStatus: commuteTimes.driving?.apiStatus ?? "unavailable",
    drivingErrorCode: commuteTimes.driving?.errorCode ?? null,
    drivingDiagnostics: commuteTimes.driving?.diagnostics ?? null,
    drivingMessage: commuteTimes.driving?.message ?? null
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
  return Math.round(clamp(numericValue, MIN_TARGET_MINUTES, MAX_TARGET_MINUTES));
}

export function normalizeCommuteImportance(commuteImportance) {
  const normalizedImportance = IMPORTANCE_ALIASES[commuteImportance] ?? commuteImportance;
  return normalizedImportance in COMMUTE_WEIGHT_CONFIGS ? normalizedImportance : DEFAULT_IMPORTANCE;
}

export function normalizeTransportMode(transportMode) {
  return TRANSPORT_MODE_ALIASES[transportMode] ?? transportMode ?? "아직 모름";
}

function createCommuteFeasibilitySummary(scoredLifeZones = [], options = {}) {
  return {
    candidateCount: scoredLifeZones.length,
    recommendedCandidateCount: scoredLifeZones.filter((zone) => isPreferredCommuteStatus(getZoneFeasibilityStatus(zone))).length,
    farCandidateCount: scoredLifeZones.filter((zone) => getZoneFeasibilityStatus(zone) === "far").length,
    unrealisticCandidateCount: scoredLifeZones.filter((zone) => getZoneFeasibilityStatus(zone) === "unrealistic").length,
    usedScoreFallback: Boolean(options.usedScoreFallback)
  };
}

function addUniqueZones(target, source, limit = Number.POSITIVE_INFINITY) {
  for (const zone of source) {
    if (target.length >= limit) return;
    if (!target.some((selectedZone) => selectedZone.id === zone.id)) {
      target.push(zone);
    }
  }
}

function sortByRecommendationScore(scoredLifeZones = []) {
  return [...scoredLifeZones].sort((a, b) => {
    const scoreDiff = getRecommendationScore(b) - getRecommendationScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER);
  });
}

function sortByFallbackCommuteDistance(scoredLifeZones = []) {
  return [...scoredLifeZones].sort((a, b) => {
    const actualMinutesDiff = getZoneActualMinutes(a) - getZoneActualMinutes(b);
    if (actualMinutesDiff !== 0) return actualMinutesDiff;

    const scoreDiff = getRecommendationScore(b) - getRecommendationScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    return (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER);
  });
}

function getZoneActualMinutes(zone = {}) {
  const actualMinutes = Number(zone.commute?.actualMinutes);
  return Number.isFinite(actualMinutes) ? actualMinutes : Number.MAX_SAFE_INTEGER;
}

function compareLowCandidate(a, b) {
  const scoreDiff = getRecommendationScore(a) - getRecommendationScore(b);
  if (scoreDiff !== 0) return scoreDiff;

  return (b.rank ?? 0) - (a.rank ?? 0);
}

function getRecommendationScore(zone = {}) {
  const candidates = [
    zone.finalScoreWithCommute,
    zone.totalScore,
    zone.baseScore,
    zone.score,
    zone.finalScore
  ];
  const score = candidates.find((candidate) => Number.isFinite(Number(candidate)));

  return score === undefined ? 0 : Number(score);
}

function getZoneFeasibilityStatus(zone = {}) {
  return zone.commute?.feasibilityStatus ?? "withinTarget";
}

function isPreferredCommuteStatus(status) {
  return status === "withinTarget" || status === "acceptable";
}

function createCommuteNotice({ usedScoreFallback, isCarMode, hasAppliedCommuteScore }) {
  if (isCarMode && !hasAppliedCommuteScore) {
    return "자동차 길찾기 정보를 불러오지 못해 통근 조건은 반영하지 않았습니다.";
  }

  return usedScoreFallback
    ? "선택한 통근 조건에 맞는 후보가 부족해 인프라 점수가 높은 후보를 함께 표시합니다."
    : null;
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
