import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCommuteSummary,
  calculateCommuteFitScore,
  calculateFinalScoreWithCommute,
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

test("selectActualCommuteMinutes falls back to the shortest available value for unknown mode", () => {
  assert.equal(selectActualCommuteMinutes({
    commuteTimes: { transit: 37, walk: 72 },
    transportMode: "unknown"
  }), 37);
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
