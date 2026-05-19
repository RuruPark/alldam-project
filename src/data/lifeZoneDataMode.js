export const LIFE_ZONE_DATA_MODES = {
  generated: "generated",
  mock: "mock"
};

export const DEFAULT_LIFE_ZONE_DATA_MODE = LIFE_ZONE_DATA_MODES.generated;

export function normalizeLifeZoneDataMode(mode) {
  const normalizedMode = String(mode ?? "").trim().toLowerCase();

  return Object.values(LIFE_ZONE_DATA_MODES).includes(normalizedMode)
    ? normalizedMode
    : DEFAULT_LIFE_ZONE_DATA_MODE;
}

export function getConfiguredLifeZoneDataMode(config = {}) {
  const queryMode = getQueryDataMode(config.locationSearch);
  if (queryMode) return normalizeLifeZoneDataMode(queryMode);

  return normalizeLifeZoneDataMode(config.LIFE_ZONE_DATA_MODE);
}

function getQueryDataMode(locationSearch) {
  const search = typeof locationSearch === "string" ? locationSearch : getBrowserLocationSearch();
  if (!search) return "";

  return new URLSearchParams(search).get("dataMode") ?? "";
}

function getBrowserLocationSearch() {
  if (typeof window === "undefined" || !window.location) return "";
  return window.location.search ?? "";
}
