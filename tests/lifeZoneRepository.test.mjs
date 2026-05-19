import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LIFE_ZONE_DATA_MODE,
  getConfiguredLifeZoneDataMode,
  normalizeLifeZoneDataMode
} from "../src/data/lifeZoneDataMode.js";
import { generatedLifeZones } from "../src/data/generatedLifeZones.js";
import { mockLifeZones } from "../src/data/mockLifeZones.js";
import {
  createLifeZoneDatasetResponse,
  getLifeZoneDataset
} from "../src/data/lifeZoneRepository.js";

test("generated mode returns generatedLifeZones", () => {
  const dataset = getLifeZoneDataset({ dataMode: "generated" });

  assert.equal(dataset.sourceType, "generated");
  assert.equal(dataset.dataMode, "generated");
  assert.equal(dataset.isDatasetAvailable, true);
  assert.equal(dataset.lifeZones.length, 48);
  assert.equal(dataset.lifeZones, generatedLifeZones);
});

test("mock mode returns only mockLifeZones", () => {
  const dataset = getLifeZoneDataset({ dataMode: "mock" });

  assert.equal(dataset.sourceType, "mock");
  assert.equal(dataset.dataMode, "mock");
  assert.equal(dataset.isDatasetAvailable, true);
  assert.equal(dataset.lifeZones, mockLifeZones);
});

test("generated mode does not fall back to mock when generated data is empty", () => {
  const dataset = createLifeZoneDatasetResponse({
    dataMode: "generated",
    generatedDataset: [],
    mockDataset: mockLifeZones
  });

  assert.equal(dataset.sourceType, "generated");
  assert.equal(dataset.isDatasetAvailable, false);
  assert.equal(dataset.lifeZones.length, 0);
  assert.match(dataset.errorMessage, /generatedLifeZones/);
});

test("invalid data mode normalizes to generated", () => {
  assert.equal(normalizeLifeZoneDataMode("mock"), "mock");
  assert.equal(normalizeLifeZoneDataMode("generated"), "generated");
  assert.equal(normalizeLifeZoneDataMode("unknown"), DEFAULT_LIFE_ZONE_DATA_MODE);
});

test("getConfiguredLifeZoneDataMode handles config and query mode", () => {
  assert.equal(getConfiguredLifeZoneDataMode({ LIFE_ZONE_DATA_MODE: "mock" }), "mock");
  assert.equal(getConfiguredLifeZoneDataMode({
    LIFE_ZONE_DATA_MODE: "mock",
    locationSearch: "?dataMode=generated"
  }), "generated");
  assert.equal(getConfiguredLifeZoneDataMode({ LIFE_ZONE_DATA_MODE: "bad" }), "generated");
});
