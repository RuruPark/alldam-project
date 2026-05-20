import { calculateHaversineKm } from "./geoDistance.js";
import { estimateCommuteTimes as estimateFallbackCommuteTimes } from "./commuteEstimator.js";
import {
  getCommuteFeasibilityLabel,
  getCommuteFeasibilityStatus,
  isCommuteRecommendedCandidate
} from "./commuteFeasibility.js";

export const MIN_TARGET_MINUTES = 10;
export const MAX_TARGET_MINUTES = 90;
export const WALK_RECOMMENDATION_MAX_MINUTES = 60;
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
  unknown: "자동차",
  notSure: "자동차",
  unsure: "자동차",
  "아직 모름": "자동차"
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
  unknown: "자동차",
  notSure: "자동차",
  unsure: "자동차",
  "자동차": "자동차",
  "대중교통": "대중교통",
  "도보": "도보",
  "아직 모름": "자동차"
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

export function getTopAndLowZonesWithCommuteFeasibility(scoredLifeZones = [], options = {}) {
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
  const recommendedCandidateIds = createIdSet(options.recommendedCandidateIds);
  const recommendationPool = recommendedCandidateIds
    ? sortedZones.filter((zone) => recommendedCandidateIds.has(getZoneIdKey(zone)))
    : sortedZones;
  const isCarMode = scoredLifeZones.some((zone) => zone.commute?.commuteMode === "car");
  const isTransitMode = scoredLifeZones.some((zone) => zone.commute?.commuteMode === "transit");
  const isWalkMode = scoredLifeZones.some((zone) => zone.commute?.commuteMode === "walk");
  const actualApiSuccessCandidates = recommendationPool.filter(hasActualSelectedCommuteSuccess);
  const eligibleWalkCandidates = isWalkMode
    ? actualApiSuccessCandidates.filter(isEligibleWalkTopRecommendation)
    : [];
  const walkNoResultReason = isWalkMode && eligibleWalkCandidates.length === 0
    ? actualApiSuccessCandidates.length === 0 ? "apiFailed" : "overHardCap"
    : null;

  if (walkNoResultReason) {
    return {
      recommendedZones: [],
      lowZone: null,
      displayZones: [],
      emptyState: createWalkNoResultEmptyState(walkNoResultReason),
      commuteFeasibilityNotice: createWalkNoResultNotice(walkNoResultReason),
      commuteFeasibilitySummary: createCommuteFeasibilitySummary(scoredLifeZones, {
        walkHardCapMinutes: WALK_RECOMMENDATION_MAX_MINUTES,
        walkEligibleCandidateCount: eligibleWalkCandidates.length,
        walkActualSuccessCandidateCount: actualApiSuccessCandidates.length,
        walkNoResultReason
      }),
      walkRecommendationSummary: {
        hardCapMinutes: WALK_RECOMMENDATION_MAX_MINUTES,
        eligibleCandidateCount: eligibleWalkCandidates.length,
        actualSuccessCandidateCount: actualApiSuccessCandidates.length,
        noResultReason: walkNoResultReason
      }
    };
  }

  const rerankPool = isWalkMode
    ? eligibleWalkCandidates
    : actualApiSuccessCandidates.length >= 2
      ? actualApiSuccessCandidates
      : recommendationPool;
  const preferredRecommendationCandidates = rerankPool.filter((zone) => isPreferredCommuteStatus(getZoneFeasibilityStatus(zone)));
  const farRecommendationCandidates = rerankPool.filter((zone) => getZoneFeasibilityStatus(zone) === "far");
  const unrealisticRecommendationCandidates = rerankPool.filter((zone) => getZoneFeasibilityStatus(zone) === "unrealistic");
  const selectedCandidates = [];

  addUniqueZones(selectedCandidates, preferredRecommendationCandidates);
  addUniqueZones(selectedCandidates, farRecommendationCandidates, 2);

  let usedScoreFallback = false;
  if (selectedCandidates.length < 2) {
    usedScoreFallback = true;
    addUniqueZones(selectedCandidates, sortByFallbackCommuteDistance(unrealisticRecommendationCandidates), 2);
    addUniqueZones(selectedCandidates, rerankPool, 2);
  }

  const recommendedZones = selectedCandidates.slice(0, Math.min(2, sortedZones.length)).map((zone, index) => ({
    ...zone,
    rankType: "recommended",
    rankLabel: `추천 TOP ${index + 1}`
  }));
  const recommendedIds = new Set(recommendedZones.map(getZoneIdKey));
  const requestedLowCandidate = options.lowZoneId
    ? scoredLifeZones.find((zone) => getZoneIdKey(zone) === String(options.lowZoneId) && !recommendedIds.has(getZoneIdKey(zone)))
    : null;
  const lowCandidate = requestedLowCandidate ?? [...scoredLifeZones]
    .filter((zone) => !recommendedIds.has(getZoneIdKey(zone)))
    .sort(compareLowCandidate)[0] ?? null;
  const lowZone = lowCandidate
    ? {
        ...lowCandidate,
        rankType: "low",
        rankLabel: "비추천"
      }
    : null;
  const displayZones = lowZone ? [...recommendedZones, lowZone] : [...recommendedZones];
  const noticeZones = displayZones.length > 0 ? displayZones : scoredLifeZones;
  const hasAppliedCommuteScore = noticeZones.some((zone) => zone.commute?.isCommuteScoreApplied === true);

  return {
    recommendedZones,
    lowZone,
    displayZones,
    commuteFeasibilityNotice: createCommuteNotice({ usedScoreFallback, isCarMode, isTransitMode, isWalkMode, hasAppliedCommuteScore }),
    commuteFeasibilitySummary: createCommuteFeasibilitySummary(scoredLifeZones, {
      usedScoreFallback,
      walkHardCapMinutes: isWalkMode ? WALK_RECOMMENDATION_MAX_MINUTES : null,
      walkEligibleCandidateCount: isWalkMode ? eligibleWalkCandidates.length : null,
      walkActualSuccessCandidateCount: isWalkMode ? actualApiSuccessCandidates.length : null
    }),
    walkRecommendationSummary: isWalkMode
      ? {
          hardCapMinutes: WALK_RECOMMENDATION_MAX_MINUTES,
          eligibleCandidateCount: eligibleWalkCandidates.length,
          actualSuccessCandidateCount: actualApiSuccessCandidates.length,
          noResultReason: null
        }
      : null
  };
}
export function buildCommuteSummary(workplace, lifeZone, commutePreference = {}) {
  const commuteTimes = estimateCommuteTimes(workplace, lifeZone);
  const commuteMode = commutePreference.commuteMode ?? commutePreference.transportMode ?? "unknown";
  const commuteImportance = commutePreference.commuteImportance ?? DEFAULT_IMPORTANCE;
  const targetMinutes = normalizeTargetMinutesForCommuteMode(commutePreference.targetMinutes, commuteMode);
  const modeKey = getCommuteTimeKey(normalizeTransportMode(commuteMode));
  const selectedActualMinutes = selectActualCommuteMinutes({
    commuteTimes,
    transportMode: commuteMode
  });
  const isCarMode = modeKey === "car";
  const isTransitMode = modeKey === "transit";
  const isWalkMode = modeKey === "walk";
  const isDrivingActualApiValue = commuteTimes.driving?.isActualApiValue === true;
  const isTransitActualApiValue = commuteTimes.transitApi?.isActualApiValue === true;
  const hasWalkingApiResult = Boolean(commuteTimes.walking);
  const isWalkingActualApiValue = commuteTimes.walking?.isActualApiValue === true;
  const actualMinutes = isTransitMode && !isTransitActualApiValue
    ? null
    : isWalkMode && hasWalkingApiResult && !isWalkingActualApiValue
      ? null
      : selectedActualMinutes;
  const isCommuteScoreApplied = isCarMode
    ? isDrivingActualApiValue
    : isTransitMode
      ? isTransitActualApiValue
      : isWalkMode && hasWalkingApiResult
        ? isWalkingActualApiValue
        : true;
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
    drivingMessage: commuteTimes.driving?.message ?? null,
    isTransitActualApiValue,
    transitApiStatus: commuteTimes.transitApi?.apiStatus ?? "unavailable",
    transitErrorCode: commuteTimes.transitApi?.errorCode ?? null,
    transitDiagnostics: commuteTimes.transitApi?.diagnostics ?? null,
    transitMessage: commuteTimes.transitApi?.message ?? null,
    transitFareKrw: commuteTimes.transitApi?.fareKrw ?? null,
    transitBusCount: commuteTimes.transitApi?.busTransitCount ?? null,
    transitSubwayCount: commuteTimes.transitApi?.subwayTransitCount ?? null,
    isWalkingActualApiValue,
    walkingApiStatus: commuteTimes.walking?.apiStatus ?? "unavailable",
    walkingErrorCode: commuteTimes.walking?.errorCode ?? null,
    walkingDiagnostics: commuteTimes.walking?.diagnostics ?? null,
    walkingMessage: commuteTimes.walking?.message ?? null
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

export function getTargetMinutesRangeForCommuteMode(commuteMode) {
  const modeKey = getCommuteTimeKey(normalizeTransportMode(commuteMode));
  return {
    min: MIN_TARGET_MINUTES,
    max: modeKey === "walk" ? WALK_RECOMMENDATION_MAX_MINUTES : MAX_TARGET_MINUTES
  };
}

export function normalizeTargetMinutesForCommuteMode(value, commuteMode) {
  const normalizedTargetMinutes = normalizeTargetMinutes(value);
  const { min, max } = getTargetMinutesRangeForCommuteMode(commuteMode);
  return Math.round(clamp(normalizedTargetMinutes, min, max));
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
    usedScoreFallback: Boolean(options.usedScoreFallback),
    walkHardCapMinutes: options.walkHardCapMinutes ?? null,
    walkEligibleCandidateCount: options.walkEligibleCandidateCount ?? null,
    walkActualSuccessCandidateCount: options.walkActualSuccessCandidateCount ?? null,
    walkNoResultReason: options.walkNoResultReason ?? null
  };
}

function addUniqueZones(target, source, limit = Number.POSITIVE_INFINITY) {
  for (const zone of source) {
    if (target.length >= limit) return;
    if (!target.some((selectedZone) => getZoneIdKey(selectedZone) === getZoneIdKey(zone))) {
      target.push(zone);
    }
  }
}

function createIdSet(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  return new Set(ids.filter(Boolean).map(String));
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

function hasActualSelectedCommuteSuccess(zone = {}) {
  const commute = zone.commute ?? {};
  if (commute.commuteMode === "car") return commute.isDrivingActualApiValue === true;
  if (commute.commuteMode === "transit") return commute.isTransitActualApiValue === true;
  if (commute.commuteMode === "walk") return commute.isWalkingActualApiValue === true;
  return commute.isCommuteScoreApplied === true && Number.isFinite(Number(commute.actualMinutes));
}

function isEligibleWalkTopRecommendation(zone = {}) {
  const commute = zone.commute ?? {};
  const actualMinutes = getSafeMinutes(commute.actualMinutes);
  return commute.commuteMode === "walk" &&
    commute.isWalkingActualApiValue === true &&
    actualMinutes !== null &&
    actualMinutes <= WALK_RECOMMENDATION_MAX_MINUTES;
}

function getZoneIdKey(zone = {}) {
  return String(zone?.id ?? "");
}

function isPreferredCommuteStatus(status) {
  return status === "withinTarget" || status === "acceptable";
}

function createCommuteNotice({ usedScoreFallback, isCarMode, isTransitMode, isWalkMode, hasAppliedCommuteScore }) {
  if (isCarMode && !hasAppliedCommuteScore) {
    return "자동차 길찾기 정보를 불러오지 못해 통근 조건은 반영하지 않았습니다.";
  }

  if (isTransitMode && !hasAppliedCommuteScore) {
    return "대중교통 경로 정보를 불러오지 못해 통근 조건은 반영하지 않았습니다.";
  }

  if (isWalkMode && !hasAppliedCommuteScore) {
    return "도보 경로 정보를 불러오지 못해 통근 조건은 반영하지 않았습니다.";
  }

  return usedScoreFallback
    ? "선택한 통근 조건에 맞는 후보가 부족해 인프라 점수가 높은 후보를 함께 표시합니다."
    : null;
}

function createWalkNoResultNotice(reason) {
  if (reason === "apiFailed") {
    return "도보 경로를 확인하지 못했습니다. TMAP 보행자 경로 응답을 확인한 뒤 다시 계산해주세요.";
  }

  return "도보로 통근하기에 적합한 생활권이 없습니다. 입력한 직장 위치와 희망 통근 조건 기준으로 도보 60분 이내 생활권을 찾지 못했습니다. 자동차 또는 대중교통 조건으로 다시 확인해보세요.";
}

function createWalkNoResultEmptyState(reason) {
  if (reason === "apiFailed") {
    return {
      title: "도보 경로를 확인하지 못했습니다.",
      message: "TMAP 보행자 경로 응답을 확인한 뒤 다시 계산해주세요."
    };
  }

  return {
    title: "도보로 통근하기에 적합한 생활권이 없습니다.",
    message: "입력한 직장 위치와 희망 통근 조건 기준으로 도보 60분 이내 생활권을 찾지 못했습니다. 자동차 또는 대중교통 조건으로 다시 확인해보세요."
  };
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
  if (value === null || value === undefined || value === "") return null;
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
