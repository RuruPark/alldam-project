import test from "node:test";
import assert from "node:assert/strict";
import { mockLifeZones } from "../src/data/mockLifeZones.js";
import { cheonanAsanEmdCenters } from "../src/data/cheonanAsanEmdCenters.js";
import {
  applyCommuteToLifeZoneScores,
  applyCommuteToScore,
  calculateCommuteFitScore,
  calculateHaversineDistanceKm,
  estimateCommuteTimes,
  getActualCommuteMinutes,
  getCommutePolicy
} from "../src/utils/commuteScoring.js";
import {
  assignRelativeGrades,
  calculateLifeZoneScores,
  getTopAndLowZones
} from "../src/utils/lifeZoneScoring.js";

const workplace = cheonanAsanEmdCenters.find((center) => center.emdName === "불당동");
const zone = mockLifeZones.find((lifeZone) => lifeZone.id === "asan-baebang");

test("haversine distance returns a finite positive number", () => {
  const distance = calculateHaversineDistanceKm(workplace, zone);

  assert.equal(Number.isFinite(distance), true);
  assert.ok(distance > 0);
});

test("estimated commute times are positive for car, transit, and walk", () => {
  const times = estimateCommuteTimes(workplace, zone);

  assert.ok(times.car > 0);
  assert.ok(times.transit > 0);
  assert.ok(times.walk > 0);
});

test("unknown commute mode picks the shorter of car and transit", () => {
  const times = { car: 32, transit: 45, walk: 180 };

  assert.equal(getActualCommuteMinutes(times, "unknown"), 32);
});

test("commute importance policies use the requested weights", () => {
  assert.equal(getCommutePolicy("low").weight, 0.1);
  assert.equal(getCommutePolicy("medium").weight, 0.2);
  assert.equal(getCommutePolicy("high").weight, 0.3);
});

test("high commute importance still keeps at least 70 percent of base score", () => {
  const finalScore = applyCommuteToScore(80, 40, "high");

  assert.equal(finalScore, 68);
});

test("commute fit and final score stay within the 0 to 100 range", () => {
  const fitScore = calculateCommuteFitScore(180, 30, "high");
  const finalScore = applyCommuteToScore(95, fitScore, "high");

  assert.ok(fitScore >= 0 && fitScore <= 100);
  assert.ok(finalScore >= 0 && finalScore <= 100);
});

test("commute-adjusted results still return top 2 and low 1", () => {
  const baseScored = calculateLifeZoneScores(mockLifeZones, {
    transportImportance: "medium",
    cultureSportsImportance: "medium",
    safetyMedicalImportance: "medium"
  });
  const commuteScored = applyCommuteToLifeZoneScores(baseScored, workplace, {
    workplaceEmdCode: workplace.emdCode,
    targetMinutes: 40,
    commuteImportance: "medium",
    commuteMode: "unknown"
  });
  const result = getTopAndLowZones(assignRelativeGrades(commuteScored));

  assert.equal(result.recommendedZones.length, 2);
  assert.equal(Boolean(result.lowZone), true);
  assert.equal(result.displayZones.length, 3);
});
