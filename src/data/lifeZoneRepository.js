import { mockLifeZones } from "./mockLifeZones.js";
import { generatedLifeZones, generatedLifeZonesMetadata } from "./generatedLifeZones.js";
import {
  LIFE_ZONE_DATA_MODES,
  getConfiguredLifeZoneDataMode,
  normalizeLifeZoneDataMode
} from "./lifeZoneDataMode.js";

// UI는 이 저장소 함수를 통해 생활권 데이터를 받습니다.
// 데이터 모드를 명시적으로 분리해 실제 데이터와 가상 데이터를 빠르게 전환합니다.
export function getLifeZoneDataset(options = {}) {
  const dataMode = resolveDataMode(options);

  return createLifeZoneDatasetResponse({
    dataMode,
    generatedDataset: generatedLifeZones,
    mockDataset: mockLifeZones,
    metadata: generatedLifeZonesMetadata
  });
}

export function createLifeZoneDatasetResponse({
  dataMode,
  generatedDataset = [],
  mockDataset = [],
  metadata = {}
} = {}) {
  const normalizedDataMode = normalizeLifeZoneDataMode(dataMode);

  if (normalizedDataMode === LIFE_ZONE_DATA_MODES.mock) {
    return {
      sourceType: "mock",
      sourceLabel: "가상 데이터 시연 모드",
      dataMode: normalizedDataMode,
      isDatasetAvailable: true,
      lifeZones: mockDataset,
      errorMessage: null
    };
  }

  const hasGeneratedDataset = Array.isArray(generatedDataset) && generatedDataset.length > 0;

  if (!hasGeneratedDataset) {
    return {
      sourceType: "generated",
      sourceLabel: "실제 전처리 CSV 기반 추천 데이터",
      dataMode: normalizedDataMode,
      isDatasetAvailable: false,
      lifeZones: [],
      errorMessage: "실제 추천 데이터가 비어 있습니다. generatedLifeZones.js를 확인해주세요."
    };
  }

  return {
    sourceType: "generated",
    sourceLabel: "실제 전처리 CSV 기반 추천 데이터",
    dataMode: normalizedDataMode,
    isDatasetAvailable: true,
    lifeZones: generatedDataset,
    generatedLifeZoneCount: metadata.generatedLifeZoneCount ?? generatedDataset.length,
    errorMessage: null
  };
}

function resolveDataMode(options = {}) {
  if (options.dataMode) return normalizeLifeZoneDataMode(options.dataMode);

  const browserConfig = typeof window === "undefined" ? {} : (window.__APP_CONFIG__ ?? {});

  return getConfiguredLifeZoneDataMode({
    ...browserConfig,
    ...options.config,
    locationSearch: options.locationSearch
  });
}
