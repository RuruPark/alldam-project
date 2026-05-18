import { estimateCommuteTimes } from "./commuteEstimator.js";
import {
  calculateCommuteFitScore,
  calculateFinalScoreWithCommute,
  getCommuteWeightConfig,
  normalizeTargetMinutes,
  selectActualCommuteMinutes
} from "./commuteScoring.js";

export function applyCommuteScoringToLifeZones({
  lifeZones,
  workplace,
  targetMinutes,
  commuteImportance,
  transportMode
} = {}) {
  if (!Array.isArray(lifeZones) || lifeZones.length === 0) {
    return [];
  }

  const normalizedTargetMinutes = normalizeTargetMinutes(targetMinutes);
  const { commuteWeight } = getCommuteWeightConfig(commuteImportance);

  return lifeZones
    .map((lifeZone) => {
      const commuteTimes = estimateCommuteTimes(workplace, normalizeLifeZoneCenter(lifeZone));
      const selectedCommuteMinutes = selectActualCommuteMinutes({
        commuteTimes,
        transportMode
      });
      const commuteFitScore = calculateCommuteFitScore({
        targetMinutes: normalizedTargetMinutes,
        actualMinutes: selectedCommuteMinutes,
        commuteImportance
      });
      const baseScore = resolveBaseScore(lifeZone);
      const finalScoreWithCommute = calculateFinalScoreWithCommute({
        baseScore,
        commuteFitScore,
        commuteImportance
      });

      return {
        ...lifeZone,
        commuteTimes,
        selectedCommuteMinutes,
        commuteFitScore,
        commuteImportance,
        commuteWeight,
        targetMinutes: normalizedTargetMinutes,
        transportMode,
        baseScore,
        finalScoreWithCommute
      };
    })
    .sort((a, b) => b.finalScoreWithCommute - a.finalScoreWithCommute);
}

function normalizeLifeZoneCenter(lifeZone = {}) {
  return {
    lat: lifeZone.centerLat ?? lifeZone.lat,
    lng: lifeZone.centerLng ?? lifeZone.lng
  };
}

function resolveBaseScore(lifeZone = {}) {
  const candidates = [
    lifeZone.baseScore,
    lifeZone.totalScore,
    lifeZone.score,
    lifeZone.finalScore
  ];
  const score = candidates.find((candidate) => Number.isFinite(Number(candidate)));

  return score === undefined ? 0 : Math.min(100, Math.max(0, Number(score)));
}
