import { cheonanAsanEmdBoundaryGeoJson } from "../data/cheonanAsanEmdBoundaries.js";
import { generatedLifeZones } from "../data/generatedLifeZones.js";

const DEFAULT_CHEONAN_ASAN_BOUNDS = {
  minLat: 36.67,
  maxLat: 37.02,
  minLng: 126.82,
  maxLng: 127.36
};

const DEFAULT_PADDING = 0.06;
const CHEONAN_ASAN_CITIES = new Set(["천안시", "아산시"]);

export function calculateGeoJsonBounds(featureCollection) {
  const bounds = createEmptyBounds();

  if (!featureCollection || !Array.isArray(featureCollection.features)) {
    return null;
  }

  featureCollection.features.forEach((feature) => {
    collectGeometryPositions(feature?.geometry).forEach(([lng, lat]) => {
      extendBounds(bounds, { lat, lng });
    });
  });

  return finalizeBounds(bounds);
}

export function calculateLifeZoneBounds(lifeZones = []) {
  const bounds = createEmptyBounds();

  if (!Array.isArray(lifeZones)) return null;

  lifeZones.forEach((lifeZone) => {
    extendBounds(bounds, {
      lat: lifeZone.centerLat ?? lifeZone.lat,
      lng: lifeZone.centerLng ?? lifeZone.lng
    });
  });

  return finalizeBounds(bounds);
}

export function mergeBounds(boundsList = []) {
  const mergedBounds = createEmptyBounds();

  boundsList.filter(isValidBounds).forEach((bounds) => {
    extendBounds(mergedBounds, { lat: bounds.minLat, lng: bounds.minLng });
    extendBounds(mergedBounds, { lat: bounds.maxLat, lng: bounds.maxLng });
  });

  return finalizeBounds(mergedBounds);
}

export function padBounds(bounds, padding = DEFAULT_PADDING) {
  if (!isValidBounds(bounds)) return { ...DEFAULT_CHEONAN_ASAN_BOUNDS };

  const numericPadding = Number(padding);
  const safePadding = Number.isFinite(numericPadding) && numericPadding >= 0 ? numericPadding : DEFAULT_PADDING;

  return {
    minLat: bounds.minLat - safePadding,
    maxLat: bounds.maxLat + safePadding,
    minLng: bounds.minLng - safePadding,
    maxLng: bounds.maxLng + safePadding
  };
}

export function isPointInsideBounds(point, bounds) {
  if (!isValidPoint(point) || !isValidBounds(bounds)) return false;

  const lat = Number(point.lat ?? point.centerLat);
  const lng = Number(point.lng ?? point.centerLng);

  return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng;
}

export function clampPointToBounds(point, bounds) {
  if (!isValidPoint(point) || !isValidBounds(bounds)) return null;

  const lat = Number(point.lat ?? point.centerLat);
  const lng = Number(point.lng ?? point.centerLng);

  return {
    lat: clamp(lat, bounds.minLat, bounds.maxLat),
    lng: clamp(lng, bounds.minLng, bounds.maxLng)
  };
}

export function getCheonanAsanMapBounds({ padding = DEFAULT_PADDING } = {}) {
  const boundaryBounds = calculateGeoJsonBounds(cheonanAsanEmdBoundaryGeoJson);
  const lifeZoneBounds = calculateLifeZoneBounds(generatedLifeZones);
  const mergedBounds = mergeBounds([boundaryBounds, lifeZoneBounds]) ?? DEFAULT_CHEONAN_ASAN_BOUNDS;

  return padBounds(mergedBounds, padding);
}

export function getBoundsCenter(bounds) {
  if (!isValidBounds(bounds)) {
    return {
      lat: (DEFAULT_CHEONAN_ASAN_BOUNDS.minLat + DEFAULT_CHEONAN_ASAN_BOUNDS.maxLat) / 2,
      lng: (DEFAULT_CHEONAN_ASAN_BOUNDS.minLng + DEFAULT_CHEONAN_ASAN_BOUNDS.maxLng) / 2
    };
  }

  return {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2
  };
}

export function isCheonanAsanLifeZone(lifeZone = {}) {
  if (CHEONAN_ASAN_CITIES.has(lifeZone.city)) return true;

  const point = {
    lat: lifeZone.centerLat ?? lifeZone.lat,
    lng: lifeZone.centerLng ?? lifeZone.lng
  };

  return isPointInsideBounds(point, getCheonanAsanMapBounds());
}

export function filterCheonanAsanMapResults(results = []) {
  return Array.isArray(results) ? results.filter(isCheonanAsanLifeZone) : [];
}

function collectGeometryPositions(geometry) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];

  if (geometry.type === "Polygon") {
    return collectPolygonPositions(geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap(collectPolygonPositions);
  }

  return [];
}

function collectPolygonPositions(polygonCoordinates = []) {
  return polygonCoordinates
    .flat()
    .filter((position) => (
      Array.isArray(position) &&
      position.length >= 2 &&
      Number.isFinite(Number(position[0])) &&
      Number.isFinite(Number(position[1]))
    ))
    .map((position) => [Number(position[0]), Number(position[1])]);
}

function createEmptyBounds() {
  return {
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
    minLng: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY
  };
}

function extendBounds(bounds, point) {
  if (!isValidPoint(point)) return;

  const lat = Number(point.lat ?? point.centerLat);
  const lng = Number(point.lng ?? point.centerLng);

  bounds.minLat = Math.min(bounds.minLat, lat);
  bounds.maxLat = Math.max(bounds.maxLat, lat);
  bounds.minLng = Math.min(bounds.minLng, lng);
  bounds.maxLng = Math.max(bounds.maxLng, lng);
}

function finalizeBounds(bounds) {
  return isValidBounds(bounds) ? { ...bounds } : null;
}

function isValidBounds(bounds) {
  return Number.isFinite(bounds?.minLat) &&
    Number.isFinite(bounds?.maxLat) &&
    Number.isFinite(bounds?.minLng) &&
    Number.isFinite(bounds?.maxLng) &&
    bounds.minLat <= bounds.maxLat &&
    bounds.minLng <= bounds.maxLng;
}

function isValidPoint(point) {
  return Number.isFinite(Number(point?.lat ?? point?.centerLat)) &&
    Number.isFinite(Number(point?.lng ?? point?.centerLng));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
