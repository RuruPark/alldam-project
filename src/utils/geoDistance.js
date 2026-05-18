const EARTH_RADIUS_KM = 6371;

export function calculateHaversineKm(pointA, pointB) {
  const start = normalizePoint(pointA);
  const end = normalizePoint(pointB);

  if (!start || !end) return 0;

  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLng = toRadians(end.lng - start.lng);
  const haversineValue =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const normalizedHaversineValue = Math.min(1, Math.max(0, haversineValue));
  const distanceKm = 2 * EARTH_RADIUS_KM * Math.atan2(
    Math.sqrt(normalizedHaversineValue),
    Math.sqrt(1 - normalizedHaversineValue)
  );

  return roundDistanceKm(distanceKm);
}

function normalizePoint(point) {
  const lat = Number(point?.lat ?? point?.centerLat);
  const lng = Number(point?.lng ?? point?.centerLng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function roundDistanceKm(distanceKm) {
  return Math.round((distanceKm + Number.EPSILON) * 1000) / 1000;
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}
