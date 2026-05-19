export function isPointInRing(point, ring) {
  const normalizedPoint = normalizePoint(point);
  const normalizedRing = normalizeRing(ring);

  if (!normalizedPoint || normalizedRing.length < 4) return false;

  let inside = false;

  for (let index = 0, previousIndex = normalizedRing.length - 1; index < normalizedRing.length; previousIndex = index, index += 1) {
    const current = normalizedRing[index];
    const previous = normalizedRing[previousIndex];
    const intersects = (
      current.lat > normalizedPoint.lat
    ) !== (
      previous.lat > normalizedPoint.lat
    ) && normalizedPoint.lng < (
      (previous.lng - current.lng) * (normalizedPoint.lat - current.lat) /
        ((previous.lat - current.lat) || Number.EPSILON) +
      current.lng
    );

    if (intersects) inside = !inside;
  }

  return inside;
}

export function isPointInPolygonGeometry(point, geometry) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return false;

  if (geometry.type === "Polygon") {
    return isPointInPolygonCoordinates(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygonCoordinates) => (
      isPointInPolygonCoordinates(point, polygonCoordinates)
    ));
  }

  return false;
}

export function findBoundaryFeatureByPoint(point, features = []) {
  if (!Array.isArray(features)) return null;

  return features.find((feature) => (
    isPointInPolygonGeometry(point, feature?.geometry)
  )) ?? null;
}

function isPointInPolygonCoordinates(point, polygonCoordinates) {
  if (!Array.isArray(polygonCoordinates) || polygonCoordinates.length === 0) return false;

  const [outerRing, ...holes] = polygonCoordinates;
  if (!isPointInRing(point, outerRing)) return false;

  return !holes.some((hole) => isPointInRing(point, hole));
}

function normalizeRing(ring) {
  if (!Array.isArray(ring)) return [];

  return ring
    .map((position) => {
      if (Array.isArray(position)) {
        return normalizePoint({ lng: position[0], lat: position[1] });
      }

      return normalizePoint(position);
    })
    .filter(Boolean);
}

function normalizePoint(point) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
