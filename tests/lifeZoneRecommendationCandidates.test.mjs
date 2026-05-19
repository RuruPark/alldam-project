import test from "node:test";
import assert from "node:assert/strict";
import { getLifeZoneDataset } from "../src/data/lifeZoneRepository.js";
import { getWorkplaceOptionsByDataMode } from "../src/data/workplaceOptions.js";
import {
  assignRelativeGrades,
  calculateLifeZoneScores,
  getTopAndLowZones
} from "../src/utils/lifeZoneScoring.js";

const defaultPreference = {
  transportImportance: "medium",
  cultureSportsImportance: "medium",
  safetyMedicalImportance: "medium"
};

test("generated recommendation candidates use all 48 generated life zones", () => {
  const dataset = getLifeZoneDataset({ dataMode: "generated" });
  const scoredZones = calculateLifeZoneScores(dataset.lifeZones, defaultPreference);
  const gradedZones = assignRelativeGrades(scoredZones);
  const result = getTopAndLowZones(gradedZones);

  assert.equal(dataset.sourceType, "generated");
  assert.equal(dataset.lifeZones.length, 48);
  assert.equal(scoredZones.length, 48);
  assert.equal(gradedZones.length, 48);
  assert.equal(result.recommendedZones.length, 2);
  assert.equal(Boolean(result.lowZone), true);
  assert.equal(result.displayZones.length, 3);
});

test("recommended and low zones are selected after scoring the full generated pool", () => {
  const dataset = getLifeZoneDataset({ dataMode: "generated" });
  const gradedZones = assignRelativeGrades(calculateLifeZoneScores(dataset.lifeZones, defaultPreference));
  const result = getTopAndLowZones(gradedZones);
  const sortedByScore = [...gradedZones].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.rank - b.rank;
  });

  assert.deepEqual(
    result.recommendedZones.map((zone) => zone.id),
    sortedByScore.slice(0, 2).map((zone) => zone.id)
  );
  assert.equal(result.lowZone.id, sortedByScore[sortedByScore.length - 1].id);
});

test("workplace options and recommendation candidates are separate generated-mode roles", () => {
  const dataset = getLifeZoneDataset({ dataMode: "generated" });
  const workplaceOptions = getWorkplaceOptionsByDataMode("generated");

  assert.equal(dataset.lifeZones.length, 48);
  assert.equal(workplaceOptions.length, 48);
  assert.notEqual(workplaceOptions, dataset.lifeZones);
  assert.equal(workplaceOptions.every((option) => option.source === "generatedLifeZones"), true);
});

test("mock mode keeps mock candidate count and does not use generated fallback", () => {
  const dataset = getLifeZoneDataset({ dataMode: "mock" });

  assert.equal(dataset.sourceType, "mock");
  assert.equal(dataset.lifeZones.length, 8);
  assert.equal(getWorkplaceOptionsByDataMode("mock").length, 8);
});
