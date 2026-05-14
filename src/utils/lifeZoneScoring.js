export const IMPORTANCE_COEFFICIENTS = {
  low: 0.5,
  medium: 1,
  high: 1.5
};

const GRADE_LABELS = {
  A: "매우 적합",
  B: "적합",
  C: "보통",
  D: "다소 부족",
  F: "개선 필요"
};

export function clamp(value, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function round1(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}

export function getImportanceCoefficient(importance) {
  return IMPORTANCE_COEFFICIENTS[importance] ?? IMPORTANCE_COEFFICIENTS.medium;
}

export function normalizePreferenceWeights(preference = {}) {
  const transportCoefficient = getImportanceCoefficient(preference.transportImportance);
  const livingCoefficient = getImportanceCoefficient(preference.cultureSportsImportance);
  const safetyMedicalCoefficient = getImportanceCoefficient(preference.safetyMedicalImportance);
  const totalCoefficient = transportCoefficient + livingCoefficient + safetyMedicalCoefficient;

  if (!Number.isFinite(totalCoefficient) || totalCoefficient <= 0) {
    return {
      transport: 1 / 3,
      living: 1 / 3,
      safetyMedical: 1 / 3
    };
  }

  return {
    transport: transportCoefficient / totalCoefficient,
    living: livingCoefficient / totalCoefficient,
    safetyMedical: safetyMedicalCoefficient / totalCoefficient
  };
}

export function calculateDistanceScore(distanceKm, standardDistanceKm) {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(standardDistanceKm) || standardDistanceKm <= 0) {
    return 0;
  }

  const score = 100 * Math.max(0, 1 - distanceKm / (2 * standardDistanceKm));
  return round1(clamp(score));
}

export function calculateDensity(valueCount, areaKm2) {
  if (!Number.isFinite(areaKm2) || areaKm2 <= 0) {
    return 0;
  }

  if (valueCount === null || valueCount === undefined || !Number.isFinite(valueCount)) {
    return null;
  }

  return valueCount / areaKm2;
}

export function calculatePercentile(values, percentile) {
  const safeValues = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);

  if (safeValues.length === 0) return 0;
  if (safeValues.length === 1) return safeValues[0];

  const safePercentile = clamp(percentile, 0, 100);
  const rank = (safePercentile / 100) * (safeValues.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const weight = rank - lowerIndex;

  if (upperIndex >= safeValues.length) return safeValues[lowerIndex];
  return safeValues[lowerIndex] * (1 - weight) + safeValues[upperIndex] * weight;
}

export function normalizeDensityScores(zones, getDensityValue) {
  const densities = zones.map((zone) => {
    const density = Number(getDensityValue(zone));
    return Number.isFinite(density) ? density : null;
  });
  const knownDensities = densities.filter((density) => Number.isFinite(density));
  const p5Density = calculatePercentile(knownDensities, 5);
  const p95Density = calculatePercentile(knownDensities, 95);
  const scores = new Map();

  zones.forEach((zone, index) => {
    const density = densities[index];
    let score = 0;

    if (!Number.isFinite(density)) {
      score = 0;
    } else if (p95Density === p5Density) {
      score = p95Density <= 0 ? 0 : 50;
    } else {
      score = 100 * (density - p5Density) / (p95Density - p5Density);
    }

    scores.set(zone.id, round1(clamp(score)));
  });

  return scores;
}

export function buildDensityContext(lifeZones = []) {
  return {
    libraryDensityScores: normalizeDensityScores(
      lifeZones,
      (zone) => calculateDensity(zone.metrics?.libraryCount, zone.areaKm2)
    ),
    sportsDensityScores: normalizeDensityScores(
      lifeZones,
      (zone) => calculateDensity(zone.metrics?.sportsInfraCount, zone.areaKm2)
    ),
    pharmacyDensityScores: normalizeDensityScores(
      lifeZones,
      (zone) => calculateDensity(zone.metrics?.pharmacyCount, zone.areaKm2)
    ),
    streetlightDensityScores: normalizeDensityScores(
      lifeZones,
      (zone) => calculateDensity(zone.metrics?.streetlightCount, zone.areaKm2)
    ),
    emergencyBellDensityScores: normalizeDensityScores(
      lifeZones,
      (zone) => calculateDensity(zone.metrics?.emergencyBellCount, zone.areaKm2)
    )
  };
}

export function calculateTransportScore(zone) {
  const metrics = zone.metrics ?? {};
  const railAccessibility = calculateDistanceScore(metrics.railDistanceKm, 1.5);
  const busAccessibility = calculateDistanceScore(metrics.busStopDistanceKm, 0.5);
  const railWithin1_5km = Number.isFinite(metrics.railDistanceKm) && metrics.railDistanceKm <= 1.5;
  const busWithin500m = Number.isFinite(metrics.busStopDistanceKm) && metrics.busStopDistanceKm <= 0.5;
  const transportDiversity = (busWithin500m ? 50 : 0) + (railWithin1_5km ? 50 : 0);
  const total = 45 * railAccessibility / 100 + 45 * busAccessibility / 100 + 10 * transportDiversity / 100;

  return {
    railAccessibility,
    busAccessibility,
    transportDiversity,
    total: round1(clamp(total))
  };
}

export function calculateLivingScore(zone, densityContext = buildDensityContext([zone])) {
  const metrics = zone.metrics ?? {};
  const nearestLibraryDistanceScore = calculateDistanceScore(metrics.nearestLibraryDistanceKm, 1.5);
  const libraryDensityScore = densityContext.libraryDensityScores?.get(zone.id) ?? 0;
  const libraryAccessibility = round1(clamp(0.7 * nearestLibraryDistanceScore + 0.3 * libraryDensityScore));

  const nearestSportsInfraDistanceScore = calculateDistanceScore(metrics.sportsInfraDistanceKm, 1.5);
  const sportsDensityScore = densityContext.sportsDensityScores?.get(zone.id) ?? 0;
  const sportsAccessibility = round1(clamp(0.7 * nearestSportsInfraDistanceScore + 0.3 * sportsDensityScore));

  const matchedTypeCount = [
    metrics.publicLibraryWithin1_5km,
    metrics.smallLibraryWithin1_5km,
    metrics.sportsInfraWithin1_5km
  ].filter(Boolean).length;
  const livingDiversity = round1(clamp(100 * matchedTypeCount / 3));
  const total = 45 * libraryAccessibility / 100 + 45 * sportsAccessibility / 100 + 10 * livingDiversity / 100;

  return {
    libraryAccessibility,
    sportsAccessibility,
    livingDiversity,
    total: round1(clamp(total))
  };
}

export function calculateSafetyMedicalScore(zone, densityContext = buildDensityContext([zone])) {
  const metrics = zone.metrics ?? {};
  const nearestPharmacyDistanceScore = calculateDistanceScore(metrics.pharmacyDistanceKm, 1);
  const pharmacyDensityScore = densityContext.pharmacyDensityScores?.get(zone.id) ?? 0;
  const pharmacyAccessibility = round1(clamp(0.7 * nearestPharmacyDistanceScore + 0.3 * pharmacyDensityScore));
  const streetlightDensity = densityContext.streetlightDensityScores?.get(zone.id) ?? 0;
  const emergencyBellDensity = densityContext.emergencyBellDensityScores?.get(zone.id) ?? 0;
  const fire119Accessibility = calculateDistanceScore(metrics.fire119DistanceKm, 4);
  const policeSubstationAccessibility = calculateDistanceScore(metrics.policeSubstationDistanceKm, 4);
  const total =
    25 * pharmacyAccessibility / 100 +
    20 * streetlightDensity / 100 +
    5 * emergencyBellDensity / 100 +
    20 * fire119Accessibility / 100 +
    30 * policeSubstationAccessibility / 100;

  return {
    pharmacyAccessibility,
    streetlightDensity,
    emergencyBellDensity,
    fire119Accessibility,
    policeSubstationAccessibility,
    total: round1(clamp(total))
  };
}

export function calculateLifeZoneScores(lifeZones = [], preference = {}) {
  if (!Array.isArray(lifeZones) || lifeZones.length === 0) return [];

  return rankLifeZoneScores(calculateUnrankedLifeZoneScores(lifeZones, preference));
}

export function calculateUnrankedLifeZoneScores(lifeZones = [], preference = {}) {
  if (!Array.isArray(lifeZones) || lifeZones.length === 0) return [];

  const weights = normalizePreferenceWeights(preference);
  const densityContext = buildDensityContext(lifeZones);

  return lifeZones.map((zone, originalIndex) => {
      const transport = calculateTransportScore(zone);
      const living = calculateLivingScore(zone, densityContext);
      const safetyMedical = calculateSafetyMedicalScore(zone, densityContext);
      const axisScores = {
        transport: transport.total,
        living: living.total,
        safetyMedical: safetyMedical.total
      };
      const totalScore = round1(clamp(
        weights.transport * axisScores.transport +
          weights.living * axisScores.living +
          weights.safetyMedical * axisScores.safetyMedical
      ));

      return {
        ...zone,
        weights,
        axisScores,
        scoreBreakdown: {
          transport,
          living,
          safetyMedical
        },
        totalScore,
        grade: "C",
        gradeLabel: GRADE_LABELS.C,
        rank: 0,
        rankType: "normal",
        rankLabel: "생활권",
        originalIndex
      };
    });
}

export function rankLifeZoneScores(scoredZones = []) {
  return scoredZones
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.originalIndex - b.originalIndex;
    })
    .map((zone, index) => {
      const { originalIndex, ...scoredZone } = zone;
      return {
        ...scoredZone,
        rank: index + 1
      };
    });
}

export function assignRelativeGrades(scoredZones = []) {
  if (!Array.isArray(scoredZones) || scoredZones.length === 0) return [];

  const sortedZones = [...scoredZones].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.rank - b.rank;
  });
  const total = sortedZones.length;

  return sortedZones.map((zone, index) => {
    const percentile = (index + 1) / total;
    let grade = "F";

    if (percentile <= 0.2) grade = "A";
    else if (percentile <= 0.4) grade = "B";
    else if (percentile <= 0.6) grade = "C";
    else if (percentile <= 0.8) grade = "D";

    return {
      ...zone,
      rank: index + 1,
      grade,
      gradeLabel: GRADE_LABELS[grade]
    };
  });
}

export function getTopAndLowZones(scoredLifeZones = []) {
  if (!Array.isArray(scoredLifeZones) || scoredLifeZones.length === 0) {
    return {
      recommendedZones: [],
      lowZone: null,
      displayZones: []
    };
  }

  const sortedZones = [...scoredLifeZones].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.rank - b.rank;
  });
  const recommendedZones = sortedZones.slice(0, Math.min(2, sortedZones.length)).map((zone, index) => ({
    ...zone,
    rankType: "recommended",
    rankLabel: `추천 TOP ${index + 1}`
  }));
  const lowCandidate = sortedZones.length >= 3
    ? sortedZones[sortedZones.length - 1]
    : sortedZones.find((zone) => !recommendedZones.some((recommendedZone) => recommendedZone.id === zone.id));
  const lowZone = lowCandidate
    ? {
        ...lowCandidate,
        rankType: "low",
        rankLabel: "보완 필요"
      }
    : null;
  const displayZones = lowZone ? [...recommendedZones, lowZone] : [...recommendedZones];

  return {
    recommendedZones,
    lowZone,
    displayZones
  };
}
