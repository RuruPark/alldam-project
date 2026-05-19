import { calculateHaversineKm } from "./geoDistance.js";
import {
  applyDrivingCommuteResultToTimes,
  createUnavailableDrivingCommuteResult
} from "./drivingCommuteApi.js";

const CAR_DISTANCE_FACTOR = 1.35;
const TRANSIT_DISTANCE_FACTOR = 1.45;
const CAR_AVERAGE_SPEED_KMH = 35;
const TRANSIT_AVERAGE_SPEED_KMH = 22;
const WALK_AVERAGE_SPEED_KMH = 4.5;
const TRANSIT_BUFFER_MINUTES = 8;

export function estimateCarMinutes(straightDistanceKm) {
  const actualDistanceKm = safeDistanceKm(straightDistanceKm) * CAR_DISTANCE_FACTOR;
  return Math.round(actualDistanceKm / CAR_AVERAGE_SPEED_KMH * 60);
}

export function estimateTransitMinutes(straightDistanceKm) {
  const actualDistanceKm = safeDistanceKm(straightDistanceKm) * TRANSIT_DISTANCE_FACTOR;
  return Math.round(actualDistanceKm / TRANSIT_AVERAGE_SPEED_KMH * 60 + TRANSIT_BUFFER_MINUTES);
}

export function estimateWalkMinutes(straightDistanceKm) {
  return Math.round(safeDistanceKm(straightDistanceKm) / WALK_AVERAGE_SPEED_KMH * 60);
}

export function estimateCommuteTimes(workplace, lifeZone, options = {}) {
  const straightDistanceKm = calculateHaversineKm(workplace, normalizeLifeZoneCenter(lifeZone));
  const drivingResult = options.drivingCommuteResult ??
    lifeZone?.drivingCommute ??
    lifeZone?.commuteTimes?.driving ??
    createUnavailableDrivingCommuteResult();

  return applyDrivingCommuteResultToTimes({
    car: null,
    transit: estimateTransitMinutes(straightDistanceKm),
    walk: estimateWalkMinutes(straightDistanceKm),
    straightDistanceKm,
    isFallback: true,
    provider: "distance-fallback"
  }, drivingResult);
}

function normalizeLifeZoneCenter(lifeZone) {
  return {
    lat: lifeZone?.centerLat ?? lifeZone?.lat,
    lng: lifeZone?.centerLng ?? lifeZone?.lng
  };
}

function safeDistanceKm(distanceKm) {
  const numericDistanceKm = Number(distanceKm);
  return Number.isFinite(numericDistanceKm) && numericDistanceKm > 0 ? numericDistanceKm : 0;
}
