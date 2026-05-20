import test from "node:test";
import assert from "node:assert/strict";
import { getLifeZoneDataset } from "../src/data/lifeZoneRepository.js";
import { getDefaultWorkplaceOptionByDataMode } from "../src/data/workplaceOptions.js";
import { calculateLifeZoneScores } from "../src/utils/lifeZoneScoring.js";
import {
  buildCommuteApiPreselection,
  calculatePreApiScoredLifeZones,
  calculateProxyCommuteMinutes,
  selectRecommendationShortlist
} from "../src/utils/commutePreselection.js";
import { getTopAndLowZonesWithCommuteFeasibility } from "../src/utils/commuteScoring.js";

const defaultPreference = {
  transportImportance: "medium",
  cultureSportsImportance: "medium",
  safetyMedicalImportance: "medium"
};

const workplace = {
  lat: 36.8154,
  lng: 127.1085
};

test("preApiScore is calculated for all 48 generated candidates without API results", () => {
  const dataset = getLifeZoneDataset({ dataMode: "generated" });
  const selectedWorkplace = getDefaultWorkplaceOptionByDataMode("generated");
  const scoredZones = calculateLifeZoneScores(dataset.lifeZones, defaultPreference);
  const preApiZones = calculatePreApiScoredLifeZones({
    lifeZones: scoredZones,
    workplace: selectedWorkplace,
    commutePreference: {
      commuteMode: "car",
      targetMinutes: 40,
      commuteImportance: "medium"
    }
  });

  assert.equal(preApiZones.length, 48);
  assert.equal(preApiZones.every((zone) => Number.isFinite(zone.preApiScore)), true);
  assert.equal(preApiZones.every((zone) => Number.isFinite(zone.proxyCommuteScore)), true);
  assert.equal(preApiZones.some((zone) => "drivingCommute" in zone), false);
  assert.equal(preApiZones.some((zone) => "transitCommute" in zone), false);
});

test("car mode limits API targets to shortlist plus one not-recommended candidate", () => {
  const dataset = getLifeZoneDataset({ dataMode: "generated" });
  const selectedWorkplace = getDefaultWorkplaceOptionByDataMode("generated");
  const scoredZones = calculateLifeZoneScores(dataset.lifeZones, defaultPreference);
  const preselection = buildCommuteApiPreselection({
    lifeZones: scoredZones,
    workplace: selectedWorkplace,
    commutePreference: {
      commuteMode: "car",
      targetMinutes: 40,
      commuteImportance: "high"
    }
  });

  assert.equal(preselection.preApiZones.length, 48);
  assert.equal(preselection.recommendationShortlist.length, 10);
  assert.ok(preselection.apiTargetZones.length <= 11);
  assert.equal(new Set(preselection.apiTargetZoneIds).size, preselection.apiTargetZoneIds.length);
  assert.equal(preselection.apiSelectionSummary.finalApiTargetCount, preselection.apiTargetZones.length);
});

test("transit mode limits API targets to wider shortlist plus one not-recommended candidate", () => {
  const dataset = getLifeZoneDataset({ dataMode: "generated" });
  const selectedWorkplace = getDefaultWorkplaceOptionByDataMode("generated");
  const scoredZones = calculateLifeZoneScores(dataset.lifeZones, defaultPreference);
  const preselection = buildCommuteApiPreselection({
    lifeZones: scoredZones,
    workplace: selectedWorkplace,
    commutePreference: {
      commuteMode: "transit",
      targetMinutes: 40,
      commuteImportance: "high"
    }
  });

  assert.equal(preselection.preApiZones.length, 48);
  assert.equal(preselection.recommendationShortlist.length, 12);
  assert.ok(preselection.apiTargetZones.length <= 13);
  assert.equal(new Set(preselection.apiTargetZoneIds).size, preselection.apiTargetZoneIds.length);
});

test("walk mode limits TMAP API targets to shortlist plus one not-recommended candidate", () => {
  const dataset = getLifeZoneDataset({ dataMode: "generated" });
  const selectedWorkplace = getDefaultWorkplaceOptionByDataMode("generated");
  const scoredZones = calculateLifeZoneScores(dataset.lifeZones, defaultPreference);
  const preselection = buildCommuteApiPreselection({
    lifeZones: scoredZones,
    workplace: selectedWorkplace,
    commutePreference: {
      commuteMode: "walk",
      targetMinutes: 40,
      commuteImportance: "high"
    }
  });

  assert.equal(preselection.preApiZones.length, 48);
  assert.equal(preselection.recommendationShortlist.length, 10);
  assert.ok(preselection.apiTargetZones.length <= 11);
  assert.equal(new Set(preselection.apiTargetZoneIds).size, preselection.apiTargetZoneIds.length);
  assert.equal(preselection.apiSelectionSummary.finalApiTargetCount, preselection.apiTargetZones.length);
});

test("not-recommended candidate is selected from the full preApi pool", () => {
  const zones = createFixtureZones(48);
  const preselection = buildCommuteApiPreselection({
    lifeZones: zones,
    workplace,
    commutePreference: {
      commuteMode: "car",
      targetMinutes: 30,
      commuteImportance: "high"
    }
  });
  const lowestPreApiZone = [...preselection.preApiZones].sort((a, b) => a.preApiScore - b.preApiScore)[0];

  assert.equal(preselection.notRecommendedZoneId, lowestPreApiZone.id);
});

test("API target list deduplicates not-recommended candidate when it overlaps the shortlist", () => {
  const zones = [{
    id: "only-zone",
    centerLat: 36.8154,
    centerLng: 127.1085,
    totalScore: 80,
    axisScores: {
      transport: 80,
      living: 80,
      safetyMedical: 80
    }
  }];
  const preselection = buildCommuteApiPreselection({
    lifeZones: zones,
    workplace,
    commutePreference: {
      commuteMode: "car",
      targetMinutes: 40,
      commuteImportance: "high"
    }
  });

  assert.equal(preselection.recommendationShortlist.length, 1);
  assert.equal(preselection.notRecommendedZoneId, "only-zone");
  assert.equal(preselection.apiTargetZones.length, 1);
  assert.equal(preselection.apiTargetZones[0].isNotRecommendedCandidate, true);
  assert.equal(preselection.apiTargetZones[0].apiSelectionRole, "notRecommended");
});

test("top recommendations are selected only from the API shortlist after reranking", () => {
  const scoredZones = [
    createScoredZone("outside-best", 100),
    createScoredZone("short-a", 80),
    createScoredZone("short-b", 70),
    createScoredZone("fixed-low", 5)
  ];
  const result = getTopAndLowZonesWithCommuteFeasibility(scoredZones, {
    recommendedCandidateIds: ["short-a", "short-b"],
    lowZoneId: "fixed-low"
  });

  assert.deepEqual(result.recommendedZones.map((zone) => zone.id), ["short-a", "short-b"]);
  assert.equal(result.lowZone.id, "fixed-low");
});

test("proxy commute minutes are internal values and not actual API result fields", () => {
  const zone = createFixtureZones(1)[0];
  const carMinutes = calculateProxyCommuteMinutes({
    workplace,
    lifeZone: zone,
    commuteMode: "car"
  });
  const transitMinutes = calculateProxyCommuteMinutes({
    workplace,
    lifeZone: zone,
    commuteMode: "transit"
  });

  assert.equal(Number.isFinite(carMinutes), true);
  assert.equal(Number.isFinite(transitMinutes), true);
  assert.equal(zone.drivingCommute, undefined);
  assert.equal(zone.transitCommute, undefined);
});

function createFixtureZones(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `zone-${index + 1}`,
    centerLat: 36.74 + index * 0.002,
    centerLng: 127.02 + index * 0.0015,
    totalScore: Math.max(0, 100 - index),
    axisScores: {
      transport: Math.max(0, 95 - index),
      living: Math.max(0, 90 - index),
      safetyMedical: Math.max(0, 85 - index)
    }
  }));
}

function createScoredZone(id, finalScoreWithCommute) {
  return {
    id,
    finalScoreWithCommute,
    totalScore: finalScoreWithCommute,
    rank: 1,
    commute: {
      commuteMode: "car",
      feasibilityStatus: "withinTarget",
      isCommuteScoreApplied: true
    }
  };
}
