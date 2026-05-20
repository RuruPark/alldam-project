import { normalizeCommuteApiMode } from "./commuteApiPolicy.js";
import {
  calculateCommuteFitScore,
  clamp,
  getCommuteWeightConfig,
  normalizeTargetMinutes
} from "./commuteScoring.js";
import { calculateHaversineKm } from "./geoDistance.js";

const SHORTLIST_LIMITS = {
  car: {
    low: 8,
    medium: 9,
    high: 10
  },
  transit: {
    low: 10,
    medium: 11,
    high: 12
  },
  walk: {
    low: 0,
    medium: 0,
    high: 0
  }
};

const IMPORTANCE_ALIASES = {
  low: "low",
  medium: "medium",
  high: "high",
  "낮음": "low",
  "보통": "medium",
  "높음": "high"
};

export function buildCommuteApiPreselection({
  lifeZones = [],
  workplace,
  commutePreference = {}
} = {}) {
  const commuteMode = normalizeCommuteApiMode(commutePreference.commuteMode ?? commutePreference.transportMode);
  const commuteImportance = normalizeImportanceKey(commutePreference.commuteImportance);
  const preApiZones = calculatePreApiScoredLifeZones({
    lifeZones,
    workplace,
    commutePreference: {
      ...commutePreference,
      commuteMode,
      commuteImportance
    }
  });
  const notRecommendedZone = selectNotRecommendedZone(preApiZones);
  const shortlistLimit = getShortlistTargetCount({
    commuteMode,
    commuteImportance
  });
  const recommendationShortlist = shortlistLimit > 0
    ? selectRecommendationShortlist(preApiZones, shortlistLimit)
    : [];
  const apiTargetZones = buildApiTargetZones({
    commuteMode,
    recommendationShortlist,
    notRecommendedZone
  });

  return {
    commuteMode,
    commuteImportance,
    preApiZones,
    recommendationShortlist,
    recommendationShortlistIds: recommendationShortlist.map((zone) => zone.id),
    notRecommendedZone,
    notRecommendedZoneId: notRecommendedZone?.id ?? null,
    apiTargetZones,
    apiTargetZoneIds: apiTargetZones.map((zone) => zone.id),
    apiSelectionSummary: {
      selectedCommuteMode: commuteMode,
      preApiCandidateCount: preApiZones.length,
      recommendationApiCandidateCount: recommendationShortlist.length,
      notRecommendedApiCandidateIncluded: Boolean(
        notRecommendedZone && apiTargetZones.some((zone) => zone.id === notRecommendedZone.id)
      ),
      finalApiTargetCount: apiTargetZones.length,
      shortlistLimit
    }
  };
}

export function calculatePreApiScoredLifeZones({
  lifeZones = [],
  workplace,
  commutePreference = {}
} = {}) {
  const commuteMode = normalizeCommuteApiMode(commutePreference.commuteMode ?? commutePreference.transportMode);
  const targetMinutes = normalizeTargetMinutes(commutePreference.targetMinutes);
  const commuteImportance = normalizeImportanceKey(commutePreference.commuteImportance);
  const { commuteWeight } = getCommuteWeightConfig(commuteImportance);

  return lifeZones
    .map((zone, originalIndex) => {
      const baseInfraScore = resolveBaseInfraScore(zone);
      const proxyCommuteMinutes = calculateProxyCommuteMinutes({
        workplace,
        lifeZone: zone,
        commuteMode
      });
      const proxyCommuteScore = calculateProxyCommuteScore({
        targetMinutes,
        actualMinutes: proxyCommuteMinutes,
        commuteImportance,
        commuteMode
      });
      const safeCommuteWeight = clamp(commuteWeight, 0, 0.3);
      const preApiScore = roundScore(
        baseInfraScore * (1 - safeCommuteWeight) +
          proxyCommuteScore * safeCommuteWeight
      );

      return {
        ...zone,
        baseInfraScore,
        proxyCommuteMinutes,
        proxyCommuteScore,
        preApiScore,
        preApiCommuteMode: commuteMode,
        preApiCommuteWeight: safeCommuteWeight,
        preApiOriginalIndex: originalIndex
      };
    })
    .sort(comparePreApiScoreDescending)
    .map((zone, index) => ({
      ...zone,
      preApiRank: index + 1
    }));
}

export function calculateProxyCommuteMinutes({
  workplace,
  lifeZone,
  commuteMode = "car"
} = {}) {
  if (!isValidPoint(workplace) || !isValidLifeZonePoint(lifeZone)) return null;

  const straightKm = calculateHaversineKm(workplace, normalizeLifeZonePoint(lifeZone));
  if (!Number.isFinite(straightKm)) return null;

  const mode = normalizeCommuteApiMode(commuteMode);
  if (mode === "transit") {
    const transportScore = clamp(resolveAxisScore(lifeZone, "transport"), 0, 100) / 100;
    const routeKm = straightKm * 1.8;
    const baseMinutes = routeKm / 20 * 60;
    const penaltyMinutes = 12 + (1 - transportScore) * 10;
    return Math.max(0, Math.round(baseMinutes + penaltyMinutes));
  }

  if (mode === "walk") {
    const walkRoadKm = straightKm * 1.2;
    return Math.max(0, Math.round(walkRoadKm / 4.5 * 60));
  }

  const carRoadKm = straightKm * 1.35;
  return Math.max(0, Math.round(carRoadKm / 35 * 60 + 5));
}

export function calculateProxyCommuteScore({
  targetMinutes,
  actualMinutes,
  commuteImportance = "medium",
  commuteMode = "car"
} = {}) {
  const mode = normalizeCommuteApiMode(commuteMode);
  const safeTargetMinutes = normalizeTargetMinutes(targetMinutes);
  const minutes = Number(actualMinutes);

  if (!Number.isFinite(minutes)) return 0;

  if (mode === "walk" && minutes > 90) {
    return Math.min(10, calculateCommuteFitScore({
      targetMinutes: safeTargetMinutes,
      actualMinutes: minutes,
      commuteImportance
    }));
  }

  if (minutes <= safeTargetMinutes) return 100;

  const overRatio = (minutes - safeTargetMinutes) / safeTargetMinutes;
  if (overRatio <= 0.25) return roundScore(clamp(100 - overRatio * 60, 80, 100));
  if (overRatio <= 1) return roundScore(clamp(80 - (overRatio - 0.25) * 70, 25, 80));

  const floorScore = mode === "walk" ? 0 : 10;
  return roundScore(clamp(25 - (overRatio - 1) * 25, floorScore, 25));
}

export function getShortlistTargetCount({
  commuteMode = "car",
  commuteImportance = "medium"
} = {}) {
  const mode = normalizeCommuteApiMode(commuteMode);
  const importanceKey = normalizeImportanceKey(commuteImportance);
  return SHORTLIST_LIMITS[mode]?.[importanceKey] ?? 0;
}

export function selectRecommendationShortlist(preApiZones = [], targetCount = 0) {
  if (!Array.isArray(preApiZones) || targetCount <= 0) return [];

  const safeTargetCount = Math.min(Math.max(0, Math.round(targetCount)), preApiZones.length);
  const composition = getShortlistComposition(safeTargetCount);
  const selected = [];

  addUniqueZones(selected, sortBy(preApiZones, comparePreApiScoreDescending).slice(0, composition.preApi));
  addUniqueZones(selected, sortBy(preApiZones, compareProxyCommuteScoreDescending).slice(0, composition.proxy));
  addUniqueZones(selected, sortBy(preApiZones, compareBaseInfraScoreDescending).slice(0, composition.baseInfra));
  addUniqueZones(selected, sortBy(preApiZones, comparePreApiScoreDescending), safeTargetCount);

  return selected.slice(0, safeTargetCount);
}

export function selectNotRecommendedZone(preApiZones = []) {
  if (!Array.isArray(preApiZones) || preApiZones.length === 0) return null;

  return sortBy(preApiZones, (a, b) => {
    const scoreDiff = getNumber(a.preApiScore) - getNumber(b.preApiScore);
    if (scoreDiff !== 0) return scoreDiff;

    const commuteDiff = getNumber(a.proxyCommuteScore) - getNumber(b.proxyCommuteScore);
    if (commuteDiff !== 0) return commuteDiff;

    const baseDiff = getNumber(a.baseInfraScore) - getNumber(b.baseInfraScore);
    if (baseDiff !== 0) return baseDiff;

    return (b.preApiOriginalIndex ?? 0) - (a.preApiOriginalIndex ?? 0);
  })[0] ?? null;
}

function buildApiTargetZones({
  commuteMode,
  recommendationShortlist = [],
  notRecommendedZone = null
} = {}) {
  const mode = normalizeCommuteApiMode(commuteMode);
  if (mode === "walk") return [];

  const targets = [];
  addUniqueZones(targets, recommendationShortlist);
  if (notRecommendedZone) addUniqueZones(targets, [notRecommendedZone]);
  return targets;
}

function getShortlistComposition(targetCount) {
  if (targetCount <= 0) {
    return {
      preApi: 0,
      proxy: 0,
      baseInfra: 0
    };
  }

  let preApi = Math.round(targetCount * 0.7);
  let proxy = Math.round(targetCount * 0.2);
  let baseInfra = targetCount - preApi - proxy;

  if (targetCount >= 3 && baseInfra < 1) {
    baseInfra = 1;
    preApi = Math.max(1, targetCount - proxy - baseInfra);
  }

  if (preApi + proxy + baseInfra > targetCount) {
    preApi = Math.max(1, targetCount - proxy - baseInfra);
  }

  return {
    preApi,
    proxy,
    baseInfra
  };
}

function addUniqueZones(target, source = [], limit = Number.POSITIVE_INFINITY) {
  for (const zone of source) {
    if (target.length >= limit) return;
    if (zone?.id && !target.some((selectedZone) => selectedZone.id === zone.id)) {
      target.push(zone);
    }
  }
}

function comparePreApiScoreDescending(a, b) {
  const scoreDiff = getNumber(b.preApiScore) - getNumber(a.preApiScore);
  if (scoreDiff !== 0) return scoreDiff;
  return (a.preApiOriginalIndex ?? 0) - (b.preApiOriginalIndex ?? 0);
}

function compareProxyCommuteScoreDescending(a, b) {
  const scoreDiff = getNumber(b.proxyCommuteScore) - getNumber(a.proxyCommuteScore);
  if (scoreDiff !== 0) return scoreDiff;
  return comparePreApiScoreDescending(a, b);
}

function compareBaseInfraScoreDescending(a, b) {
  const scoreDiff = getNumber(b.baseInfraScore) - getNumber(a.baseInfraScore);
  if (scoreDiff !== 0) return scoreDiff;
  return comparePreApiScoreDescending(a, b);
}

function sortBy(items, compare) {
  return [...items].sort(compare);
}

function normalizeImportanceKey(commuteImportance) {
  return IMPORTANCE_ALIASES[commuteImportance] ?? "medium";
}

function resolveBaseInfraScore(zone = {}) {
  const candidates = [
    zone.totalScore,
    zone.baseScore,
    zone.score,
    zone.finalScore
  ];
  const score = candidates.find((candidate) => Number.isFinite(Number(candidate)));
  return score === undefined ? 0 : roundScore(clamp(Number(score), 0, 100));
}

function resolveAxisScore(zone = {}, axisKey) {
  const candidates = [
    zone.axisScores?.[axisKey],
    axisKey === "transport" ? zone.trafficInfraScore : null,
    axisKey === "living" ? zone.livingInfraScore : null,
    axisKey === "safetyMedical" ? zone.safetyMedicalScore : null
  ];
  const score = candidates.find((candidate) => Number.isFinite(Number(candidate)));
  return score === undefined ? 50 : Number(score);
}

function normalizeLifeZonePoint(lifeZone = {}) {
  return {
    lat: lifeZone.centerLat ?? lifeZone.lat,
    lng: lifeZone.centerLng ?? lifeZone.lng
  };
}

function isValidLifeZonePoint(lifeZone = {}) {
  return isValidPoint(normalizeLifeZonePoint(lifeZone));
}

function isValidPoint(point = {}) {
  return Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lng));
}

function getNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundScore(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}
