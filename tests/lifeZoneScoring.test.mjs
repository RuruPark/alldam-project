import test from "node:test";
import assert from "node:assert/strict";
import { mockLifeZones } from "../src/data/mockLifeZones.js";
import {
  assignRelativeGrades,
  buildDensityContext,
  calculateDensity,
  calculateDistanceScore,
  calculateLifeZoneScores,
  calculateLivingScore,
  calculateSafetyMedicalScore,
  calculateTransportScore,
  getImportanceCoefficient,
  getTopAndLowZones,
  normalizeDensityScores,
  normalizePreferenceWeights
} from "../src/utils/lifeZoneScoring.js";

const simpleZone = {
  id: "simple-zone",
  name: "테스트 생활권",
  city: "천안시",
  eupMyeonDong: "테스트동",
  description: "테스트 데이터",
  lat: 36.8,
  lng: 127.1,
  areaKm2: 2,
  metrics: {
    railDistanceKm: 0,
    busStopDistanceKm: 0,
    nearestLibraryDistanceKm: 0,
    publicLibraryWithin1_5km: true,
    smallLibraryWithin1_5km: true,
    sportsInfraDistanceKm: 0,
    sportsInfraWithin1_5km: true,
    pharmacyDistanceKm: 0,
    fire119DistanceKm: 0,
    policeSubstationDistanceKm: 0,
    libraryCount: 10,
    sportsInfraCount: 10,
    pharmacyCount: 10,
    streetlightCount: 10,
    emergencyBellCount: 10
  },
  infraSummary: {},
  strengths: [],
  weaknesses: [],
  tags: []
};

test("중요도 계수를 변환한다", () => {
  assert.equal(getImportanceCoefficient("low"), 0.5);
  assert.equal(getImportanceCoefficient("medium"), 1);
  assert.equal(getImportanceCoefficient("high"), 1.5);
  assert.equal(getImportanceCoefficient("unknown"), 1);
});

test("중요도 계수를 정규화한다", () => {
  assert.deepEqual(normalizePreferenceWeights({
    transportImportance: "medium",
    cultureSportsImportance: "medium",
    safetyMedicalImportance: "medium"
  }), {
    transport: 1 / 3,
    living: 1 / 3,
    safetyMedical: 1 / 3
  });

  assert.deepEqual(normalizePreferenceWeights({
    transportImportance: "low",
    cultureSportsImportance: "low",
    safetyMedicalImportance: "high"
  }), {
    transport: 0.2,
    living: 0.2,
    safetyMedical: 0.6
  });

  const highMediumMedium = normalizePreferenceWeights({
    transportImportance: "high",
    cultureSportsImportance: "medium",
    safetyMedicalImportance: "medium"
  });
  assert.equal(Number(highMediumMedium.transport.toFixed(3)), 0.429);
  assert.equal(Number(highMediumMedium.living.toFixed(3)), 0.286);
  assert.equal(Number(highMediumMedium.safetyMedical.toFixed(3)), 0.286);
  assert.equal(Number((highMediumMedium.transport + highMediumMedium.living + highMediumMedium.safetyMedical).toFixed(10)), 1);
});

test("거리점수를 계산한다", () => {
  assert.equal(calculateDistanceScore(0, 1.5), 100);
  assert.equal(calculateDistanceScore(1.5, 1.5), 50);
  assert.equal(calculateDistanceScore(3.0, 1.5), 0);
  assert.equal(calculateDistanceScore(null, 1.5), 0);
  assert.equal(calculateDistanceScore(1, 0), 0);
});

test("밀도와 밀도점수를 안전하게 계산한다", () => {
  assert.equal(calculateDensity(10, 2), 5);
  assert.equal(calculateDensity(10, 0), 0);
  assert.equal(calculateDensity(null, 2), null);

  const zones = [
    { id: "a", areaKm2: 1, metrics: { count: 0 } },
    { id: "b", areaKm2: 1, metrics: { count: 5 } },
    { id: "c", areaKm2: 1, metrics: { count: 10 } }
  ];
  const scores = normalizeDensityScores(zones, (zone) => calculateDensity(zone.metrics.count, zone.areaKm2));
  [...scores.values()].forEach((score) => {
    assert.ok(score >= 0 && score <= 100);
  });

  const equalScores = normalizeDensityScores([
    { id: "same-a", areaKm2: 1, metrics: { count: 4 } },
    { id: "same-b", areaKm2: 1, metrics: { count: 4 } }
  ], (zone) => calculateDensity(zone.metrics.count, zone.areaKm2));
  assert.deepEqual([...equalScores.values()], [50, 50]);

  const missingScores = normalizeDensityScores([
    { id: "known-zero", areaKm2: 1, metrics: { count: 0 } },
    { id: "known-ten", areaKm2: 1, metrics: { count: 10 } },
    { id: "missing", areaKm2: 1, metrics: { count: null } }
  ], (zone) => calculateDensity(zone.metrics.count, zone.areaKm2));
  assert.equal(missingScores.get("missing"), 0);
  assert.ok(missingScores.get("known-ten") > missingScores.get("known-zero"));
});

test("축별 점수 배점을 반영한다", () => {
  const densityContext = buildDensityContext([simpleZone]);
  const transport = calculateTransportScore(simpleZone);
  const living = calculateLivingScore(simpleZone, densityContext);
  const safetyMedical = calculateSafetyMedicalScore(simpleZone, densityContext);

  assert.equal(transport.railAccessibility, 100);
  assert.equal(transport.busAccessibility, 100);
  assert.equal(transport.transportDiversity, 100);
  assert.equal(transport.total, 100);

  assert.equal(living.libraryAccessibility, 85);
  assert.equal(living.sportsAccessibility, 85);
  assert.equal(living.livingDiversity, 100);
  assert.equal(living.total, 86.5);

  assert.equal(safetyMedical.pharmacyAccessibility, 85);
  assert.equal(safetyMedical.streetlightDensity, 50);
  assert.equal(safetyMedical.emergencyBellDensity, 50);
  assert.equal(safetyMedical.fire119Accessibility, 100);
  assert.equal(safetyMedical.policeSubstationAccessibility, 100);
  assert.equal(safetyMedical.total, 83.8);
});

test("최종점수에 사용자 가중치가 반영된다", () => {
  const scoredMedium = assignRelativeGrades(calculateLifeZoneScores(mockLifeZones, {
    transportImportance: "medium",
    cultureSportsImportance: "medium",
    safetyMedicalImportance: "medium"
  }));
  const scoredTransportHigh = assignRelativeGrades(calculateLifeZoneScores(mockLifeZones, {
    transportImportance: "high",
    cultureSportsImportance: "low",
    safetyMedicalImportance: "low"
  }));

  assert.equal(scoredMedium.length, mockLifeZones.length);
  assert.notEqual(scoredMedium[0].totalScore, scoredTransportHigh[0].totalScore);
});

test("상위 2개와 하위 1개를 반환한다", () => {
  const scored = assignRelativeGrades(calculateLifeZoneScores(mockLifeZones, {
    transportImportance: "medium",
    cultureSportsImportance: "medium",
    safetyMedicalImportance: "medium"
  }));
  const result = getTopAndLowZones(scored);

  assert.equal(result.recommendedZones.length, 2);
  assert.equal(Boolean(result.lowZone), true);
  assert.equal(result.displayZones.length, 3);
  assert.equal(result.displayZones[0].rankType, "recommended");
  assert.equal(result.displayZones[1].rankType, "recommended");
  assert.equal(result.displayZones[2].rankType, "low");
});

test("상대등급은 전체 생활권 순위 기준으로 부여된다", () => {
  const scored = assignRelativeGrades(calculateLifeZoneScores(mockLifeZones, {
    transportImportance: "medium",
    cultureSportsImportance: "medium",
    safetyMedicalImportance: "medium"
  }));
  const grades = scored.map((zone) => zone.grade);

  assert.equal(scored[0].grade, "A");
  assert.ok(grades.includes("B"));
  assert.ok(grades.includes("C"));
  assert.ok(grades.includes("D"));
  assert.equal(scored.at(-1).grade, "F");
});

test("생활권 데이터가 비어 있어도 안전하게 처리한다", () => {
  assert.deepEqual(calculateLifeZoneScores([], {
    transportImportance: "medium",
    cultureSportsImportance: "medium",
    safetyMedicalImportance: "medium"
  }), []);
  assert.deepEqual(getTopAndLowZones([]), {
    recommendedZones: [],
    lowZone: null,
    displayZones: []
  });
});
