import test from "node:test";
import assert from "node:assert/strict";
import {
  getCommuteFeasibilityStatus,
  getCommuteToleranceMinutes,
  isCommuteRecommendedCandidate
} from "../src/utils/commuteFeasibility.js";
import { getTopAndLowZonesWithCommuteFeasibility } from "../src/utils/commuteScoring.js";

function makeZone(id, finalScoreWithCommute, feasibilityStatus, rank = 1) {
  return {
    id,
    name: id,
    rank,
    totalScore: finalScoreWithCommute,
    finalScoreWithCommute,
    commute: {
      feasibilityStatus
    }
  };
}

function makeApiZone(id, finalScoreWithCommute, isCommuteScoreApplied) {
  return {
    id,
    name: id,
    rank: 1,
    totalScore: finalScoreWithCommute,
    finalScoreWithCommute,
    commute: {
      commuteMode: "walk",
      feasibilityStatus: "unrealistic",
      actualMinutes: null,
      isCommuteScoreApplied
    }
  };
}

test("walk API failures use displayed candidates when deciding commute failure notice", () => {
  const result = getTopAndLowZonesWithCommuteFeasibility([
    makeApiZone("api-a", 90, false),
    makeApiZone("api-b", 80, false),
    makeApiZone("api-low", 5, false),
    makeApiZone("outside-with-fallback", 99, true)
  ], {
    recommendedCandidateIds: ["api-a", "api-b"],
    lowZoneId: "api-low"
  });

  assert.deepEqual(result.recommendedZones.map((zone) => zone.id), ["api-a", "api-b"]);
  assert.equal(result.lowZone.id, "api-low");
  assert.match(result.commuteFeasibilityNotice, /도보 경로/);
});

test("walk commute feasibility uses a strong tolerance around the target", () => {
  assert.equal(getCommuteToleranceMinutes(40, "도보"), 10);
  assert.equal(getCommuteFeasibilityStatus({ targetMinutes: 40, actualMinutes: 40, transportMode: "도보" }), "withinTarget");
  assert.equal(getCommuteFeasibilityStatus({ targetMinutes: 40, actualMinutes: 50, transportMode: "도보" }), "acceptable");
  assert.equal(getCommuteFeasibilityStatus({ targetMinutes: 40, actualMinutes: 60, transportMode: "도보" }), "far");
  assert.equal(getCommuteFeasibilityStatus({ targetMinutes: 40, actualMinutes: 300, transportMode: "도보" }), "unrealistic");
});

test("car and transit commute feasibility use mode-specific tolerances", () => {
  assert.equal(getCommuteToleranceMinutes(40, "자동차"), 15);
  assert.equal(getCommuteFeasibilityStatus({ targetMinutes: 40, actualMinutes: 55, transportMode: "자동차" }), "acceptable");
  assert.equal(getCommuteToleranceMinutes(40, "대중교통"), 20);
  assert.equal(getCommuteFeasibilityStatus({ targetMinutes: 40, actualMinutes: 60, transportMode: "대중교통" }), "acceptable");
});

test("invalid target minutes fall back safely", () => {
  assert.equal(getCommuteFeasibilityStatus({ targetMinutes: 0, actualMinutes: 40, transportMode: "도보" }), "withinTarget");
  assert.equal(getCommuteFeasibilityStatus({ targetMinutes: 40, actualMinutes: null, transportMode: "도보" }), "unrealistic");
});

test("recommended commute candidates are limited to within target or acceptable", () => {
  assert.equal(isCommuteRecommendedCandidate("withinTarget"), true);
  assert.equal(isCommuteRecommendedCandidate("acceptable"), true);
  assert.equal(isCommuteRecommendedCandidate("far"), false);
  assert.equal(isCommuteRecommendedCandidate("unrealistic"), false);
});

test("unrealistic commute zones are excluded from top recommendations when feasible candidates exist", () => {
  const result = getTopAndLowZonesWithCommuteFeasibility([
    makeZone("walk-300", 99, "unrealistic", 1),
    makeZone("walk-50", 78, "acceptable", 2),
    makeZone("walk-35", 72, "withinTarget", 3),
    makeZone("walk-60", 70, "far", 4)
  ]);

  assert.deepEqual(result.recommendedZones.map((zone) => zone.id), ["walk-50", "walk-35"]);
  assert.equal(result.recommendedZones.some((zone) => zone.id === "walk-300"), false);
  assert.equal(result.commuteFeasibilityNotice, null);
});

test("far commute zones are used only when preferred candidates are insufficient", () => {
  const result = getTopAndLowZonesWithCommuteFeasibility([
    makeZone("walk-300", 99, "unrealistic", 1),
    makeZone("walk-50", 80, "acceptable", 2),
    makeZone("walk-60", 79, "far", 3)
  ]);

  assert.deepEqual(result.recommendedZones.map((zone) => zone.id), ["walk-50", "walk-60"]);
  assert.equal(result.recommendedZones.some((zone) => zone.id === "walk-300"), false);
});

test("low zone selection keeps the lowest score after recommendation filtering", () => {
  const result = getTopAndLowZonesWithCommuteFeasibility([
    makeZone("walk-50", 90, "acceptable", 1),
    makeZone("walk-35", 80, "withinTarget", 2),
    makeZone("walk-300-high-score", 70, "unrealistic", 3),
    makeZone("walk-45-low-score", 10, "acceptable", 4)
  ]);

  assert.deepEqual(result.recommendedZones.map((zone) => zone.id), ["walk-50", "walk-35"]);
  assert.equal(result.lowZone.id, "walk-45-low-score");
});

test("fallback warning is explicit and picks the least unrealistic commute candidates", () => {
  const result = getTopAndLowZonesWithCommuteFeasibility([
    { ...makeZone("walk-300", 99, "unrealistic", 1), commute: { feasibilityStatus: "unrealistic", actualMinutes: 300 } },
    { ...makeZone("walk-280", 80, "unrealistic", 2), commute: { feasibilityStatus: "unrealistic", actualMinutes: 280 } },
    { ...makeZone("walk-260", 70, "unrealistic", 3), commute: { feasibilityStatus: "unrealistic", actualMinutes: 260 } }
  ]);

  assert.deepEqual(result.recommendedZones.map((zone) => zone.id), ["walk-260", "walk-280"]);
  assert.match(result.commuteFeasibilityNotice, /통근 조건/);
  assert.equal(result.commuteFeasibilitySummary.usedScoreFallback, true);
});
