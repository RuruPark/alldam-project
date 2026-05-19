import { cheonanAsanEmdCenters } from "./cheonanAsanEmdCenters.js";
import { generatedLifeZones } from "./generatedLifeZones.js";
import { LIFE_ZONE_DATA_MODES, normalizeLifeZoneDataMode } from "./lifeZoneDataMode.js";

const NO_DISTRICT = "해당 없음";

export function getWorkplaceOptionsByDataMode(dataMode) {
  const normalizedMode = normalizeLifeZoneDataMode(dataMode);
  const options = normalizedMode === LIFE_ZONE_DATA_MODES.mock
    ? buildMockWorkplaceOptions()
    : buildGeneratedWorkplaceOptions();

  return sortWorkplaceOptions(options);
}

export function getWorkplaceCitiesByDataMode(dataMode) {
  return unique(getWorkplaceOptionsByDataMode(dataMode).map((option) => option.city));
}

export function getWorkplaceDistrictsByCityAndDataMode(city, dataMode) {
  return unique(
    getWorkplaceOptionsByDataMode(dataMode)
      .filter((option) => option.city === city)
      .map((option) => option.district || NO_DISTRICT)
  );
}

export function getWorkplaceEmdsBySelectionAndDataMode(city, district, dataMode) {
  const selectedDistrict = district || NO_DISTRICT;

  return getWorkplaceOptionsByDataMode(dataMode).filter((option) => {
    if (option.city !== city) return false;
    if (option.city === "아산시") return true;
    return option.district === selectedDistrict;
  });
}

export function findWorkplaceCenterBySelection({ city, district, emdName, dataMode } = {}) {
  if (!city || !emdName) return null;

  const selectedDistrict = district || NO_DISTRICT;

  return getWorkplaceOptionsByDataMode(dataMode).find((option) => (
    option.city === city &&
    option.emdName === emdName &&
    (option.city === "아산시" || option.district === selectedDistrict)
  )) ?? null;
}

export function findWorkplaceCenterByCode(emdCode, dataMode) {
  if (!emdCode) return null;

  return getWorkplaceOptionsByDataMode(dataMode).find((option) => (
    option.emdCode === emdCode
  )) ?? null;
}

export function getDefaultWorkplaceOptionByDataMode(dataMode) {
  return getWorkplaceOptionsByDataMode(dataMode)[0] ?? null;
}

function buildGeneratedWorkplaceOptions() {
  return generatedLifeZones.map((zone) => ({
    emdCode: zone.emdCode,
    city: zone.city,
    district: zone.district || NO_DISTRICT,
    emdName: zone.emdName ?? zone.eupMyeonDong,
    lat: zone.centerLat ?? zone.lat,
    lng: zone.centerLng ?? zone.lng,
    source: "generatedLifeZones"
  })).filter(isValidWorkplaceOption);
}

function buildMockWorkplaceOptions() {
  return cheonanAsanEmdCenters.map((center) => ({
    emdCode: center.emdCode,
    city: center.city,
    district: center.district || NO_DISTRICT,
    emdName: center.emdName,
    lat: center.lat,
    lng: center.lng,
    source: "cheonanAsanEmdCenters"
  })).filter(isValidWorkplaceOption);
}

function isValidWorkplaceOption(option) {
  return Boolean(
    option.emdCode &&
      option.city &&
      option.emdName &&
      Number.isFinite(Number(option.lat)) &&
      Number.isFinite(Number(option.lng))
  );
}

function sortWorkplaceOptions(options) {
  return [...options].sort((a, b) => (
    a.city.localeCompare(b.city, "ko") ||
    normalizeDistrictSortValue(a.district).localeCompare(normalizeDistrictSortValue(b.district), "ko") ||
    a.emdName.localeCompare(b.emdName, "ko")
  ));
}

function normalizeDistrictSortValue(district) {
  return district === NO_DISTRICT ? "" : district;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
