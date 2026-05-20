import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCommuteToLifeZoneScores,
  buildCommuteSummary,
  calculateCommuteFitScore,
  calculateCommuteTimeExcessPenalty,
  calculateFinalScoreWithCommute,
  COMMUTE_OVERRUN_NO_RESULT_MINUTES,
  getTopAndLowZonesWithCommuteFeasibility,
  getCommuteWeightConfig,
  selectActualCommuteMinutes
} from "../src/utils/commuteScoring.js";
import { applyCommuteScoringToLifeZones } from "../src/utils/lifeZoneCommuteScoring.js";

test("calculateCommuteFitScore returns 100 when actual commute is within target", () => {
  assert.equal(calculateCommuteFitScore({
    targetMinutes: 40,
    actualMinutes: 35,
    commuteImportance: "보통"
  }), 100);
});

test("calculateCommuteFitScore gradually reduces the score when actual commute exceeds target", () => {
  assert.equal(calculateCommuteFitScore({
    targetMinutes: 40,
    actualMinutes: 50,
    commuteImportance: "보통"
  }), 90);
});

test("calculateCommuteFitScore respects minimum scores by commute importance", () => {
  assert.equal(calculateCommuteFitScore({
    targetMinutes: 30,
    actualMinutes: 240,
    commuteImportance: "낮음"
  }), 75);
  assert.equal(calculateCommuteFitScore({
    targetMinutes: 30,
    actualMinutes: 240,
    commuteImportance: "보통"
  }), 60);
  assert.equal(calculateCommuteFitScore({
    targetMinutes: 30,
    actualMinutes: 240,
    commuteImportance: "높음"
  }), 45);
});

test("calculateCommuteFitScore falls back safely for invalid inputs", () => {
  assert.equal(calculateCommuteFitScore({
    targetMinutes: 0,
    actualMinutes: 40,
    commuteImportance: "보통"
  }), 100);
  assert.equal(calculateCommuteFitScore({
    targetMinutes: 40,
    actualMinutes: null,
    commuteImportance: "높음"
  }), 45);
});

test("calculateFinalScoreWithCommute applies low, medium, and high commute weights", () => {
  assert.equal(calculateFinalScoreWithCommute({
    baseScore: 80,
    commuteFitScore: 40,
    commuteImportance: "낮음"
  }), 76);
  assert.equal(calculateFinalScoreWithCommute({
    baseScore: 80,
    commuteFitScore: 40,
    commuteImportance: "보통"
  }), 72);
  assert.equal(calculateFinalScoreWithCommute({
    baseScore: 80,
    commuteFitScore: 40,
    commuteImportance: "높음"
  }), 68);
});

test("commute overrun penalty applies only to medium and high actual API values", () => {
  const low = calculateCommuteTimeExcessPenalty({
    targetMinutes: 40,
    actualMinutes: 70,
    commuteImportance: "low",
    commuteMode: "car",
    isActualApiValue: true
  });
  const medium = calculateCommuteTimeExcessPenalty({
    targetMinutes: 40,
    actualMinutes: 60,
    commuteImportance: "medium",
    commuteMode: "car",
    isActualApiValue: true
  });
  const high = calculateCommuteTimeExcessPenalty({
    targetMinutes: 40,
    actualMinutes: 60,
    commuteImportance: "high",
    commuteMode: "car",
    isActualApiValue: true
  });
  const failed = calculateCommuteTimeExcessPenalty({
    targetMinutes: 40,
    actualMinutes: null,
    commuteImportance: "high",
    commuteMode: "car",
    isActualApiValue: false
  });

  assert.equal(COMMUTE_OVERRUN_NO_RESULT_MINUTES, 30);
  assert.equal(low.commuteTimeExcessPenalty, 0);
  assert.equal(low.isCommuteTimePenaltyEligible, false);
  assert.equal(medium.commuteTimeExcessPenalty, 12);
  assert.equal(high.commuteTimeExcessPenalty, 22);
  assert.ok(high.commuteTimeExcessPenalty > medium.commuteTimeExcessPenalty);
  assert.equal(failed.commuteTimeExcessPenalty, 0);
  assert.equal(failed.isOverDesiredPlus30, false);
});

test("commute overrun penalty allows up to 15 minutes over the desired time", () => {
  const result = calculateCommuteTimeExcessPenalty({
    targetMinutes: 40,
    actualMinutes: 55,
    commuteImportance: "high",
    commuteMode: "transit",
    isActualApiValue: true
  });

  assert.equal(result.commuteTimeExcessMinutes, 15);
  assert.equal(result.commuteTimeExcessPenalty, 0);
  assert.equal(result.isCommuteTimeSuitable, true);
});

test("commute weight does not exceed 0.30", () => {
  assert.equal(getCommuteWeightConfig("높음").commuteWeight, 0.3);
  assert.ok(getCommuteWeightConfig("높음").commuteWeight <= 0.3);
  assert.equal(getCommuteWeightConfig("알 수 없음").commuteWeight, 0.2);
});

test("selectActualCommuteMinutes uses the selected transport mode", () => {
  const commuteTimes = {
    car: 28,
    transit: 42,
    walk: 85
  };

  assert.equal(selectActualCommuteMinutes({ commuteTimes, transportMode: "자동차" }), 28);
  assert.equal(selectActualCommuteMinutes({ commuteTimes, transportMode: "대중교통" }), 42);
  assert.equal(selectActualCommuteMinutes({ commuteTimes, transportMode: "도보" }), 85);
  assert.equal(selectActualCommuteMinutes({ commuteTimes, transportMode: "아직 모름" }), 28);
});

test("selectActualCommuteMinutes does not replace explicit car mode with other modes", () => {
  assert.equal(selectActualCommuteMinutes({
    commuteTimes: { transit: 37, walk: 72 },
    transportMode: "car"
  }), null);
});

test("selectActualCommuteMinutes normalizes legacy unknown mode to car", () => {
  assert.equal(selectActualCommuteMinutes({
    commuteTimes: { transit: 37, walk: 72 },
    transportMode: "unknown"
  }), null);
  assert.equal(selectActualCommuteMinutes({
    commuteTimes: { car: 28, transit: 37, walk: 72 },
    transportMode: "notSure"
  }), 28);
  assert.equal(selectActualCommuteMinutes({
    commuteTimes: {},
    transportMode: "unknown"
  }), null);
});

test("buildCommuteSummary uses ODsay transit success for transit scoring", () => {
  const commute = buildCommuteSummary(
    { lat: 36.815, lng: 127.108 },
    {
      id: "LZ_TEST",
      centerLat: 36.773,
      centerLng: 127.059,
      transitCommute: {
        id: "LZ_TEST",
        provider: "odsay-public-transit",
        apiStatus: "success",
        isActualApiValue: true,
        durationMinutes: 42,
        distanceMeters: 12800
      }
    },
    {
      commuteMode: "transit",
      targetMinutes: 45,
      commuteImportance: "medium"
    }
  );

  assert.equal(commute.actualMinutes, 42);
  assert.equal(commute.isTransitActualApiValue, true);
  assert.equal(commute.isCommuteScoreApplied, true);
  assert.equal(typeof commute.fitScore, "number");
});

test("buildCommuteSummary does not use fallback transit minutes after ODsay failure", () => {
  const commute = buildCommuteSummary(
    { lat: 36.815, lng: 127.108 },
    {
      id: "LZ_TEST",
      centerLat: 36.773,
      centerLng: 127.059,
      transitCommute: {
        id: "LZ_TEST",
        provider: "odsay-public-transit",
        apiStatus: "failed",
        errorCode: "ODSAY_NO_ROUTE",
        isActualApiValue: false,
        durationMinutes: null,
        distanceMeters: null
      }
    },
    {
      commuteMode: "transit",
      targetMinutes: 45,
      commuteImportance: "medium"
    }
  );

  assert.equal(commute.actualMinutes, null);
  assert.equal(commute.commuteTimes.transit, null);
  assert.equal(commute.isTransitActualApiValue, false);
  assert.equal(commute.isCommuteScoreApplied, false);
  assert.equal(commute.fitScore, null);
});

test("buildCommuteSummary does not apply transit scoring without an ODsay result", () => {
  const commute = buildCommuteSummary(
    { lat: 36.815, lng: 127.108 },
    {
      id: "LZ_TEST",
      centerLat: 36.773,
      centerLng: 127.059
    },
    {
      commuteMode: "transit",
      targetMinutes: 45,
      commuteImportance: "medium"
    }
  );

  assert.equal(commute.actualMinutes, null);
  assert.equal(commute.isTransitActualApiValue, false);
  assert.equal(commute.isCommuteScoreApplied, false);
  assert.equal(commute.fitScore, null);
});

test("id-based transit results stay attached to TOP1, TOP2, and low display cards", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createTransitZone("outside-best", 99, 21),
    createTransitZone("top-1", 91, 31),
    createTransitZone("top-2", 90, 34),
    createTransitZone("low-zone", 20, 72)
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "transit",
    targetMinutes: 40,
    commuteImportance: "medium"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: ["top-1", "top-2"],
    lowZoneId: "low-zone"
  });

  assert.deepEqual(result.displayZones.map((zone) => zone.id), ["top-1", "top-2", "low-zone"]);
  assert.deepEqual(result.displayZones.map((zone) => zone.commute.actualMinutes), [31, 34, 72]);
  assert.equal(result.displayZones.every((zone) => zone.commute.isTransitActualApiValue === true), true);
});

test("transit reranking prefers actual ODsay success candidates over failed high-score candidates", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    {
      id: "failed-high",
      centerLat: 36.751,
      centerLng: 127.051,
      totalScore: 100
    },
    createTransitZone("success-a", 80, 42),
    createTransitZone("success-b", 79, 45),
    {
      id: "failed-low",
      centerLat: 36.762,
      centerLng: 127.062,
      totalScore: 10
    }
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "transit",
    targetMinutes: 40,
    commuteImportance: "medium"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: ["failed-high", "success-a", "success-b"],
    lowZoneId: "failed-low"
  });

  assert.deepEqual(result.recommendedZones.map((zone) => zone.id), ["success-a", "success-b"]);
  assert.equal(result.recommendedZones.every((zone) => zone.commute.isTransitActualApiValue === true), true);
  assert.equal(result.lowZone.id, "failed-low");
});

test("medium overrun penalty can move a desired-time car candidate above a high-score overrun candidate", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createDrivingZone("overrun-70", 100, 70),
    createDrivingZone("reasonable-45", 90, 45),
    createDrivingZone("low-zone", 10, 80)
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "car",
    targetMinutes: 40,
    commuteImportance: "medium"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: ["overrun-70", "reasonable-45"],
    lowZoneId: "low-zone"
  });

  assert.equal(
    commuteScoredZones.find((zone) => zone.id === "overrun-70").commute.commuteTimeExcessPenalty,
    25
  );
  assert.equal(result.recommendedZones[0].id, "reasonable-45");
});

test("all desired-plus-30 car candidates show no-result for medium importance", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createDrivingZone("car-70", 100, 70),
    createDrivingZone("car-75", 90, 75),
    createDrivingZone("car-low", 10, 80)
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "car",
    targetMinutes: 40,
    commuteImportance: "medium"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: ["car-70", "car-75"],
    lowZoneId: "car-low"
  });

  assert.deepEqual(result.recommendedZones, []);
  assert.equal(result.lowZone, null);
  assert.match(result.emptyState.title, /자동차로 통근하기에 적합한 생활권이 없습니다/);
  assert.equal(result.commuteFeasibilitySummary.commuteTimeNoResultReason, "overDesiredPlus30");
});

test("all desired-plus-30 transit candidates show no-result for high importance", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createTransitZone("transit-70", 100, 70),
    createTransitZone("transit-75", 90, 75),
    createTransitZone("transit-low", 10, 82)
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "transit",
    targetMinutes: 40,
    commuteImportance: "high"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: ["transit-70", "transit-75"],
    lowZoneId: "transit-low"
  });

  assert.deepEqual(result.displayZones, []);
  assert.match(result.emptyState.title, /대중교통으로 통근하기에 적합한 생활권이 없습니다/);
});

test("desired-plus-30 no-result is not applied for low commute importance", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createDrivingZone("car-70", 100, 70),
    createDrivingZone("car-75", 90, 75),
    createDrivingZone("car-low", 10, 80)
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "car",
    targetMinutes: 40,
    commuteImportance: "low"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: ["car-70", "car-75"],
    lowZoneId: "car-low"
  });

  assert.equal(result.recommendedZones.length, 2);
  assert.equal(result.emptyState, undefined);
  assert.equal(commuteScoredZones.every((zone) => zone.commute.commuteTimeExcessPenalty === 0), true);
});

test("all API failures do not trigger desired-plus-30 no-result", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    { id: "failed-a", centerLat: 36.751, centerLng: 127.051, totalScore: 100 },
    { id: "failed-b", centerLat: 36.752, centerLng: 127.052, totalScore: 90 },
    { id: "failed-low", centerLat: 36.753, centerLng: 127.053, totalScore: 10 }
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "car",
    targetMinutes: 40,
    commuteImportance: "high"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: ["failed-a", "failed-b"],
    lowZoneId: "failed-low"
  });

  assert.equal(result.recommendedZones.length, 2);
  assert.equal(result.emptyState, undefined);
  assert.equal(result.commuteFeasibilitySummary.commuteTimeNoResultReason, null);
});

test("buildCommuteSummary uses TMAP walking success for walk scoring", () => {
  const commute = buildCommuteSummary(
    { lat: 36.815, lng: 127.108 },
    {
      id: "LZ_TEST",
      centerLat: 36.773,
      centerLng: 127.059,
      walkingCommute: {
        id: "LZ_TEST",
        provider: "tmap-pedestrian",
        apiStatus: "success",
        isActualApiValue: true,
        durationMinutes: 28,
        distanceMeters: 2100
      }
    },
    {
      commuteMode: "walk",
      targetMinutes: 40,
      commuteImportance: "medium"
    }
  );

  assert.equal(commute.actualMinutes, 28);
  assert.equal(commute.isWalkingActualApiValue, true);
  assert.equal(commute.isCommuteScoreApplied, true);
  assert.equal(typeof commute.fitScore, "number");
});

test("buildCommuteSummary does not use fallback walk minutes after TMAP failure", () => {
  const commute = buildCommuteSummary(
    { lat: 36.815, lng: 127.108 },
    {
      id: "LZ_TEST",
      centerLat: 36.773,
      centerLng: 127.059,
      walkingCommute: {
        id: "LZ_TEST",
        provider: "tmap-pedestrian",
        apiStatus: "failed",
        errorCode: "TMAP_WALK_NO_ROUTE",
        isActualApiValue: false,
        durationMinutes: null,
        distanceMeters: null
      }
    },
    {
      commuteMode: "walk",
      targetMinutes: 40,
      commuteImportance: "medium"
    }
  );

  assert.equal(commute.actualMinutes, null);
  assert.equal(commute.commuteTimes.walk, null);
  assert.equal(commute.isWalkingActualApiValue, false);
  assert.equal(commute.isCommuteScoreApplied, false);
  assert.equal(commute.fitScore, null);
});

test("walk top recommendations exclude TMAP durations above 60 minutes", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createWalkingZone("walk-76", 100, 76),
    createWalkingZone("walk-187", 99, 187),
    createWalkingZone("walk-35", 80, 35),
    createWalkingZone("walk-52", 78, 52),
    createWalkingZone("walk-291", 5, 291)
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "walk",
    targetMinutes: 40,
    commuteImportance: "medium"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: zones.map((zone) => zone.id),
    lowZoneId: "walk-291"
  });

  assert.deepEqual(result.recommendedZones.map((zone) => zone.id), ["walk-35", "walk-52"]);
  assert.equal(result.recommendedZones.some((zone) => Number(zone.commute.actualMinutes) > 60), false);
  assert.equal(result.lowZone.id, "walk-291");
});

test("walk mode shows no top recommendation when all TMAP successes exceed 60 minutes", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createWalkingZone("walk-76", 100, 76),
    createWalkingZone("walk-187", 99, 187),
    createWalkingZone("walk-291", 5, 291)
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "walk",
    targetMinutes: 40,
    commuteImportance: "medium"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: zones.map((zone) => zone.id),
    lowZoneId: "walk-291"
  });

  assert.deepEqual(result.recommendedZones, []);
  assert.equal(result.lowZone, null);
  assert.deepEqual(result.displayZones, []);
  assert.match(result.emptyState.title, /도보로 통근하기에 적합한 생활권이 없습니다/);
  assert.equal(result.walkRecommendationSummary.noResultReason, "overHardCap");
});

test("walk mode uses desired-plus-30 no-result before the 60 minute hard cap when applicable", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createWalkingZone("walk-55", 100, 55),
    createWalkingZone("walk-56", 90, 56),
    createWalkingZone("walk-low", 10, 58)
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "walk",
    targetMinutes: 20,
    commuteImportance: "high"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: ["walk-55", "walk-56"],
    lowZoneId: "walk-low"
  });

  assert.deepEqual(result.displayZones, []);
  assert.match(result.emptyState.title, /도보로 통근하기에 적합한 생활권이 없습니다/);
  assert.equal(result.commuteFeasibilitySummary.commuteTimeNoResultReason, "overDesiredPlus30");
  assert.equal(result.walkRecommendationSummary, undefined);
});

test("walk mode shows only one top recommendation when one TMAP success is within 60 minutes", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createWalkingZone("walk-52", 78, 52),
    createWalkingZone("walk-76", 100, 76),
    createWalkingZone("walk-187", 99, 187)
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "walk",
    targetMinutes: 40,
    commuteImportance: "medium"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: zones.map((zone) => zone.id),
    lowZoneId: "walk-187"
  });

  assert.deepEqual(result.recommendedZones.map((zone) => zone.id), ["walk-52"]);
  assert.equal(result.recommendedZones[0].commute.actualMinutes, 52);
  assert.equal(result.lowZone.id, "walk-187");
});

test("walk mode distinguishes all TMAP API failures from over-60 no-result", () => {
  const workplace = { lat: 36.815, lng: 127.108 };
  const zones = [
    createWalkingZone("walk-failed-a", 90, null, "failed"),
    createWalkingZone("walk-failed-b", 80, null, "failed"),
    createWalkingZone("walk-failed-low", 10, null, "failed")
  ];
  const commuteScoredZones = applyCommuteToLifeZoneScores(zones, workplace, {
    commuteMode: "walk",
    targetMinutes: 40,
    commuteImportance: "medium"
  });
  const result = getTopAndLowZonesWithCommuteFeasibility(commuteScoredZones, {
    recommendedCandidateIds: zones.map((zone) => zone.id),
    lowZoneId: "walk-failed-low"
  });

  assert.deepEqual(result.recommendedZones, []);
  assert.match(result.emptyState.title, /도보 경로를 확인하지 못했습니다/);
  assert.equal(result.walkRecommendationSummary.noResultReason, "apiFailed");
});

test("buildCommuteSummary clamps walk target minutes to 60", () => {
  const commute = buildCommuteSummary(
    { lat: 36.815, lng: 127.108 },
    createWalkingZone("walk-target", 80, 61),
    {
      commuteMode: "walk",
      targetMinutes: 90,
      commuteImportance: "medium"
    }
  );

  assert.equal(commute.targetMinutes, 60);
});

test("applyCommuteScoringToLifeZones adds commute scoring fields and sorts by final score", () => {
  const workplace = {
    emdCode: "WORK",
    city: "천안시",
    district: "서북구",
    emdName: "불당동",
    lat: 36.8154,
    lng: 127.1085
  };
  const lifeZones = [
    {
      id: "near",
      centerLat: 36.8154,
      centerLng: 127.1085,
      totalScore: 90
    },
    {
      id: "far",
      centerLat: 36.9294,
      centerLng: 127.0382,
      totalScore: 70
    }
  ];
  const result = applyCommuteScoringToLifeZones({
    lifeZones,
    workplace,
    targetMinutes: 40,
    commuteImportance: "보통",
    transportMode: "transit"
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].id, "near");
  assert.ok(result[0].finalScoreWithCommute >= result[1].finalScoreWithCommute);
  assert.equal(result[0].totalScore, 90);
  assert.equal(result[0].commuteTimes.car, null);
  assert.equal(result[0].commuteTimes.isFallback, true);
  assert.equal(result[0].commuteTimes.provider, "distance-fallback");
  assert.equal(typeof result[0].commuteFitScore, "number");
  assert.equal(typeof result[0].finalScoreWithCommute, "number");
});

function createTransitZone(id, totalScore, durationMinutes) {
  return {
    id,
    centerLat: 36.75 + durationMinutes * 0.0001,
    centerLng: 127.05 + durationMinutes * 0.0001,
    totalScore,
    rank: 1,
    transitCommute: {
      id,
      provider: "odsay-public-transit",
      apiStatus: "success",
      isActualApiValue: true,
      durationMinutes,
      distanceMeters: 10000
    }
  };
}

function createDrivingZone(id, totalScore, durationMinutes) {
  return {
    id,
    centerLat: 36.75 + durationMinutes * 0.0001,
    centerLng: 127.05 + durationMinutes * 0.0001,
    totalScore,
    rank: 1,
    drivingCommute: {
      id,
      provider: "naver-directions5",
      apiStatus: "success",
      isActualApiValue: true,
      durationMinutes,
      distanceMeters: 10000
    }
  };
}

function createWalkingZone(id, totalScore, durationMinutes, apiStatus = "success") {
  const isSuccess = apiStatus === "success" && Number.isFinite(Number(durationMinutes));

  return {
    id,
    centerLat: 36.75 + Number(totalScore) * 0.0001,
    centerLng: 127.05 + Number(totalScore) * 0.0001,
    totalScore,
    rank: 1,
    walkingCommute: {
      id,
      provider: "tmap-pedestrian",
      apiStatus,
      isActualApiValue: isSuccess,
      durationMinutes: isSuccess ? durationMinutes : null,
      distanceMeters: isSuccess ? 1000 : null,
      errorCode: isSuccess ? null : "TMAP_WALK_NO_ROUTE"
    }
  };
}
