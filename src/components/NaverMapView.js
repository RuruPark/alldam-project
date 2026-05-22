import { loadNaverMapScript } from "../utils/naverMapLoader.js";
import { findEmdCenter } from "../data/cheonanAsanEmdCenters.js";
import {
  cheonanAsanEmdBoundaryGeoJson,
  getAllBoundaryFeatures
} from "../data/cheonanAsanEmdBoundaries.js";
import {
  getFeatureIdentity,
  isSameEmdFeature,
  normalizeGeoJsonGeometryToRings
} from "../utils/geoJsonPolygon.js";
import {
  clampPointToBounds,
  filterCheonanAsanMapResults,
  getBoundsCenter,
  getCheonanAsanMapBounds,
  getNaverMapViewportBounds,
  isPointInsideBounds,
  padBounds,
  shouldRestoreToCheonanAsan
} from "../utils/cheonanAsanMapBounds.js";

const DEFAULT_CENTER = {
  lat: 36.812,
  lng: 127.06
};

export async function NaverMapView({
  clientId,
  container,
  workplace,
  results = [],
  selectedLifeZoneId,
  focusSelectedLifeZone = false,
  onSelectLifeZone,
  onError
} = {}) {
  try {
    if (!container) {
      throw new Error("Naver map container is required.");
    }

    const naver = await loadNaverMapScript(clientId);
    const maps = naver.maps;
    const allowedBounds = getCheonanAsanMapBounds();
    const boundaryFeatures = getAllBoundaryFeatures();
    const renderPlan = createNaverMapRenderPlan({ workplace, results, boundaryFeatures });
    const filteredResults = renderPlan.filteredResults;
    const centerPoint = getNaverMapInitialCenter({ workplace, results: filteredResults, allowedBounds });
    const map = new maps.Map(container, {
      center: new maps.LatLng(centerPoint.lat, centerPoint.lng),
      zoom: 10,
      minZoom: 9,
      maxZoom: 15,
      zoomControl: true,
      zoomControlOptions: {
        position: maps.Position.TOP_RIGHT
      }
    });
    const overlays = [];
    const cleanupHandlers = [];

    overlays.push(...createOutsideMaskPolygons({ maps, map, bounds: allowedBounds }));
    applyMapBoundsGuard({ maps, map, bounds: allowedBounds, cleanupHandlers });

    if (renderPlan.hasWorkplace) {
      const workplacePoint = renderPlan.workplacePoint;

      if (workplacePoint) {
        overlays.push(createMarker({
          maps,
          map,
          point: workplacePoint,
          className: "naver-workplace-marker",
          label: "직장",
          title: formatWorkplaceTitle(workplace),
          zIndex: 20
        }));
      }
    }

    const workplacePoint = renderPlan.workplacePoint;
    const bounds = new maps.LatLngBounds();
    let boundsPointCount = 0;
    const recommendationBoundaryKeys = new Set(
      renderPlan.recommendationBoundaryFeatures.map((feature) => getBoundaryFeatureStableKey(feature))
    );
    const renderedBoundaryKeys = new Set();

    if (workplacePoint) {
      bounds.extend(new maps.LatLng(workplacePoint.lat, workplacePoint.lng));
      boundsPointCount += 1;
    }

    filteredResults.forEach((lifeZone, index) => {
      const lifeZonePoint = normalizePoint(lifeZone);

      if (!lifeZonePoint) return;

      const isSelected = lifeZone.id === selectedLifeZoneId;
      const rankLabel = getRankLabel(lifeZone, index);
      const lifeZoneBoundaryFeature = findBoundaryFeatureForTarget(boundaryFeatures, lifeZone);
      const lifeZoneBoundaryKey = lifeZoneBoundaryFeature
        ? getBoundaryFeatureStableKey(lifeZoneBoundaryFeature)
        : "";

      if (
        lifeZoneBoundaryFeature &&
        recommendationBoundaryKeys.has(lifeZoneBoundaryKey) &&
        !renderedBoundaryKeys.has(lifeZoneBoundaryKey)
      ) {
        renderedBoundaryKeys.add(lifeZoneBoundaryKey);
        boundsPointCount += addBoundaryPolygons({
          maps,
          map,
          bounds,
          overlays,
          feature: lifeZoneBoundaryFeature,
          variant: lifeZone.rankType === "low" ? "low" : "recommended",
          isSelected,
          onClick: () => onSelectLifeZone?.(lifeZone.id)
        });
      }

      overlays.push(createMarker({
        maps,
        map,
        point: lifeZonePoint,
        className: [
          "naver-lifezone-marker",
          lifeZone.rankType === "low" ? "is-low" : "is-recommended",
          isSelected ? "is-selected" : ""
        ].filter(Boolean).join(" "),
        label: rankLabel,
        title: lifeZone.eupMyeonDong ?? lifeZone.name ?? "생활권",
        zIndex: isSelected ? 30 : 10,
        onClick: () => onSelectLifeZone?.(lifeZone.id)
      }));

      if (workplacePoint) {
        overlays.push(new maps.Polyline({
          map,
          path: [
            new maps.LatLng(workplacePoint.lat, workplacePoint.lng),
            new maps.LatLng(lifeZonePoint.lat, lifeZonePoint.lng)
          ],
          strokeColor: isSelected ? "#e6a700" : "#273a66",
          strokeOpacity: isSelected ? 0.9 : 0.42,
          strokeWeight: isSelected ? 4 : 2,
          strokeStyle: isSelected ? "solid" : "shortdash",
          zIndex: isSelected ? 18 : 12
        }));
      }

      bounds.extend(new maps.LatLng(lifeZonePoint.lat, lifeZonePoint.lng));
      boundsPointCount += 1;
    });

    const allowedLatLngBounds = createLatLngBounds(maps, allowedBounds);

    if (boundsPointCount > 1) {
      map.fitBounds(bounds);
    } else if (boundsPointCount === 1) {
      map.setCenter(bounds.getCenter());
    } else if (allowedLatLngBounds) {
      map.fitBounds(allowedLatLngBounds);
    }

    if (focusSelectedLifeZone) {
      const selectedLifeZone = filteredResults.find((lifeZone) => lifeZone.id === selectedLifeZoneId);
      if (selectedLifeZone) {
        focusLifeZoneOnMap({ maps, map, lifeZone: selectedLifeZone, boundaryFeatures });
      }
    }

    return {
      map,
      boundaryMetadata: cheonanAsanEmdBoundaryGeoJson.metadata,
      destroy() {
        overlays.forEach((overlay) => overlay?.setMap?.(null));
        cleanupHandlers.forEach((cleanup) => cleanup?.());
      }
    };
  } catch (error) {
    onError?.(error);
    throw error;
  }
}

export function createNaverMapRenderPlan({ workplace, results = [], boundaryFeatures = [] } = {}) {
  const workplacePoint = normalizePoint(workplace);
  const filteredResults = filterCheonanAsanMapResults(Array.isArray(results) ? results : []);
  const resultPoints = filteredResults
    .map((lifeZone) => normalizePoint(lifeZone))
    .filter(Boolean);
  const safeBoundaryFeatures = Array.isArray(boundaryFeatures) ? boundaryFeatures : [];
  const recommendationBoundaryFeatures = filterBoundaryFeaturesForRecommendations(
    safeBoundaryFeatures,
    filteredResults
  );

  return {
    hasWorkplace: Boolean(workplacePoint),
    workplacePoint,
    filteredResults,
    resultPoints,
    boundaryFeatureCount: safeBoundaryFeatures.length,
    recommendationBoundaryFeatures,
    recommendationBoundaryFeatureCount: recommendationBoundaryFeatures.length,
    shouldRenderRecommendationBoundaries: recommendationBoundaryFeatures.length > 0
  };
}

export function getRecommendationBoundaryKeys(results = []) {
  const keys = [];
  const seen = new Set();
  const safeResults = Array.isArray(results) ? results : [];

  safeResults.forEach((result) => {
    const key = getBoundaryTargetStableKey(normalizeBoundaryTarget(result));
    if (!key || seen.has(key)) return;
    seen.add(key);
    keys.push(key);
  });

  return keys;
}

export function filterBoundaryFeaturesForRecommendations(boundaryFeatures = [], recommendationResults = []) {
  const safeFeatures = Array.isArray(boundaryFeatures) ? boundaryFeatures : [];
  const safeResults = filterCheonanAsanMapResults(Array.isArray(recommendationResults) ? recommendationResults : []);
  const matchedFeatures = [];
  const seenFeatureKeys = new Set();

  safeResults.forEach((result) => {
    const feature = findBoundaryFeatureForTarget(safeFeatures, result);
    if (!feature) return;

    const featureKey = getBoundaryFeatureStableKey(feature);
    if (!featureKey || seenFeatureKeys.has(featureKey)) return;

    seenFeatureKeys.add(featureKey);
    matchedFeatures.push(feature);
  });

  return matchedFeatures;
}

export function getNaverMapInitialCenter({ workplace, results = [], allowedBounds = getCheonanAsanMapBounds() } = {}) {
  const resultCenter = getPointCollectionCenter(
    (Array.isArray(results) ? results : [])
      .map((lifeZone) => normalizePoint(lifeZone))
      .filter(Boolean)
  );

  return clampPointToBounds(
    normalizePoint(workplace) ?? resultCenter ?? getBoundsCenter(allowedBounds),
    allowedBounds
  ) ?? DEFAULT_CENTER;
}

function focusLifeZoneOnMap({ maps, map, lifeZone, boundaryFeatures }) {
  const focusTarget = getLifeZoneFocusTarget(lifeZone, boundaryFeatures);

  if (!focusTarget) return false;

  if (focusTarget.type === "boundary") {
    const boundaryBounds = createFeatureLatLngBounds(maps, focusTarget.feature);
    if (boundaryBounds) {
      map.fitBounds(boundaryBounds);
      return true;
    }
  }

  if (focusTarget.type === "center") {
    map.panTo(new maps.LatLng(focusTarget.center.lat, focusTarget.center.lng));
    map.setZoom?.(13);
    return true;
  }

  return false;
}

export function getLifeZoneFocusTarget(lifeZone, boundaryFeatures = []) {
  const boundaryFeature = findBoundaryFeatureForTarget(boundaryFeatures, lifeZone);

  if (boundaryFeature) {
    return {
      type: "boundary",
      feature: boundaryFeature
    };
  }

  const center = normalizePoint(lifeZone);

  return center
    ? {
      type: "center",
      center
    }
    : null;
}

function getPointCollectionCenter(points = []) {
  const safePoints = points.filter((point) => (
    Number.isFinite(Number(point?.lat)) &&
    Number.isFinite(Number(point?.lng))
  ));

  if (safePoints.length === 0) return null;

  const total = safePoints.reduce((acc, point) => ({
    lat: acc.lat + Number(point.lat),
    lng: acc.lng + Number(point.lng)
  }), { lat: 0, lng: 0 });

  return {
    lat: total.lat / safePoints.length,
    lng: total.lng / safePoints.length
  };
}

function createOutsideMaskPolygons({ maps, map, bounds }) {
  const outerBounds = padBounds(bounds, 2.5);
  const maskBoundsList = [
    { minLat: bounds.maxLat, maxLat: outerBounds.maxLat, minLng: outerBounds.minLng, maxLng: outerBounds.maxLng },
    { minLat: outerBounds.minLat, maxLat: bounds.minLat, minLng: outerBounds.minLng, maxLng: outerBounds.maxLng },
    { minLat: bounds.minLat, maxLat: bounds.maxLat, minLng: outerBounds.minLng, maxLng: bounds.minLng },
    { minLat: bounds.minLat, maxLat: bounds.maxLat, minLng: bounds.maxLng, maxLng: outerBounds.maxLng }
  ];

  return maskBoundsList
    .filter((maskBounds) => maskBounds.minLat < maskBounds.maxLat && maskBounds.minLng < maskBounds.maxLng)
    .map((maskBounds) => new maps.Polygon({
      map,
      paths: makeRectanglePath(maps, maskBounds),
      strokeColor: "#f3f5f4",
      strokeOpacity: 0,
      strokeWeight: 0,
      fillColor: "#f4f5f4",
      fillOpacity: 0.68,
      clickable: false,
      zIndex: 1
    }));
}

function makeRectanglePath(maps, bounds) {
  return [
    new maps.LatLng(bounds.minLat, bounds.minLng),
    new maps.LatLng(bounds.minLat, bounds.maxLng),
    new maps.LatLng(bounds.maxLat, bounds.maxLng),
    new maps.LatLng(bounds.maxLat, bounds.minLng),
    new maps.LatLng(bounds.minLat, bounds.minLng)
  ];
}

function applyMapBoundsGuard({ maps, map, bounds, cleanupHandlers }) {
  let isRestoringMapView = false;
  let lastRestoreAt = 0;
  const listener = maps.Event.addListener(map, "idle", () => {
    if (isRestoringMapView) {
      return;
    }

    const viewportBounds = getNaverMapViewportBounds(map);
    if (shouldRestoreToCheonanAsan({ viewportBounds, allowedBounds: bounds })) {
      const now = Date.now();
      if (now - lastRestoreAt < 350) return;

      const allowedLatLngBounds = createLatLngBounds(maps, bounds);
      isRestoringMapView = true;
      lastRestoreAt = now;

      if (allowedLatLngBounds) {
        map.fitBounds(allowedLatLngBounds);
      } else {
        const center = getBoundsCenter(bounds);
        map.panTo(new maps.LatLng(center.lat, center.lng));
      }

      setTimeout(() => {
        isRestoringMapView = false;
      }, 300);
      return;
    }

    const center = getMapCenterPoint(map);
    if (!center || isPointInsideBounds(center, bounds)) return;

    const clampedCenter = clampPointToBounds(center, bounds);
    if (!clampedCenter) return;

    isRestoringMapView = true;
    map.panTo(new maps.LatLng(clampedCenter.lat, clampedCenter.lng));
    setTimeout(() => {
      isRestoringMapView = false;
    }, 250);
  });

  cleanupHandlers.push(() => maps.Event.removeListener(listener));
}

function getMapCenterPoint(map) {
  const center = map.getCenter?.();
  const lat = typeof center?.lat === "function" ? center.lat() : center?.y;
  const lng = typeof center?.lng === "function" ? center.lng() : center?.x;

  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

function createLatLngBounds(maps, bounds) {
  if (!bounds) return null;

  return new maps.LatLngBounds(
    new maps.LatLng(bounds.minLat, bounds.minLng),
    new maps.LatLng(bounds.maxLat, bounds.maxLng)
  );
}

function createFeatureLatLngBounds(maps, feature) {
  const rings = normalizeGeoJsonGeometryToRings(feature?.geometry);
  const bounds = new maps.LatLngBounds();
  let pointCount = 0;

  rings.forEach((ring) => {
    ring.forEach((point) => {
      bounds.extend(new maps.LatLng(point.lat, point.lng));
      pointCount += 1;
    });
  });

  return pointCount > 0 ? bounds : null;
}

function addBoundaryPolygons({
  maps,
  map,
  bounds,
  overlays,
  feature,
  variant,
  isSelected,
  onClick,
  includeInBounds = true,
  clickable = Boolean(onClick)
}) {
  try {
    const rings = normalizeGeoJsonGeometryToRings(feature.geometry);
    let pointCount = 0;

    rings.forEach((ring) => {
      const path = ring.map((point) => new maps.LatLng(point.lat, point.lng));
      const polygon = new maps.Polygon({
        map,
        paths: path,
        ...getBoundaryStyle(variant, isSelected),
        clickable
      });

      if (onClick) {
        maps.Event.addListener(polygon, "click", onClick);
      }

      path.forEach((latLng) => {
        if (includeInBounds && bounds) {
          bounds.extend(latLng);
        }
        pointCount += 1;
      });
      overlays.push(polygon);
    });

    return pointCount;
  } catch (error) {
    console.warn("Failed to render sample EMD boundary.", getFeatureIdentity(feature), error);
    return 0;
  }
}

function createMarker({ maps, map, point, className, label, title, zIndex, onClick }) {
  const marker = new maps.Marker({
    position: new maps.LatLng(point.lat, point.lng),
    map,
    zIndex,
    title,
    icon: {
      content: `
        <button class="${className}" type="button" aria-label="${escapeHtml(title)}">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(title)}</strong>
        </button>
      `,
      anchor: new maps.Point(48, 46)
    }
  });

  if (onClick) {
    maps.Event.addListener(marker, "click", onClick);
  }

  return marker;
}

export function findBoundaryFeatureForTarget(features, target) {
  const normalizedTarget = normalizeBoundaryTarget(target);

  return features.find((feature) => isSameEmdFeature(feature, normalizedTarget)) ?? null;
}

export function normalizeBoundaryTarget(target = {}) {
  const emdName = target.emdName ?? target.eupMyeonDong ?? "";
  const supplementalCenter = findSupplementalCenter(target, emdName);

  return {
    emdCode: target.emdCode ?? supplementalCenter?.emdCode ?? "",
    city: target.city ?? supplementalCenter?.city ?? "",
    district: target.district ?? supplementalCenter?.district ?? "",
    emdName: emdName || supplementalCenter?.emdName || ""
  };
}

function getBoundaryFeatureStableKey(feature) {
  return getBoundaryTargetStableKey(getFeatureIdentity(feature));
}

function getBoundaryTargetStableKey(target = {}) {
  const emdCode = normalizeBoundaryKey(target.emdCode);
  if (emdCode) return `code:${emdCode}`;

  const city = normalizeBoundaryKey(target.city);
  const district = normalizeBoundaryKey(target.district);
  const emdName = normalizeBoundaryKey(target.emdName);

  return emdName ? `name:${city}|${district}|${emdName}` : "";
}

function normalizeBoundaryKey(value) {
  return String(value ?? "").trim().replace(/\s+/g, "");
}

function findSupplementalCenter(target = {}, emdName = "") {
  if (target.emdCode) {
    return findEmdCenter(target.emdCode);
  }

  if (!target.city || !emdName) return null;

  return findEmdCenter({
    city: target.city,
    district: target.district,
    emdName
  });
}

function getBoundaryStyle(variant, isSelected) {
  const styleByVariant = {
    workplace: {
      strokeColor: "#273a66",
      fillColor: "#273a66",
      fillOpacity: 0.13,
      zIndex: 6
    },
    recommended: {
      strokeColor: "#147d72",
      fillColor: "#147d72",
      fillOpacity: 0.09,
      zIndex: 5
    },
    low: {
      strokeColor: "#9d6b5f",
      fillColor: "#dd6b4d",
      fillOpacity: 0.07,
      zIndex: 4
    }
  };
  const style = styleByVariant[variant] ?? styleByVariant.recommended;

  return {
    strokeColor: isSelected ? "#e6a700" : style.strokeColor,
    strokeOpacity: isSelected ? 0.92 : 0.72,
    strokeWeight: isSelected ? 4 : 2,
    fillColor: style.fillColor,
    fillOpacity: isSelected ? Math.max(style.fillOpacity, 0.15) : style.fillOpacity,
    clickable: true,
    zIndex: isSelected ? style.zIndex + 10 : style.zIndex
  };
}

function normalizePoint(point = {}) {
  if (!point || typeof point !== "object") return null;

  const lat = Number(point.lat ?? point.centerLat ?? point.latitude ?? point.coordinate?.lat);
  const lng = Number(point.lng ?? point.centerLng ?? point.longitude ?? point.coordinate?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function getRankLabel(lifeZone, index) {
  if (lifeZone.rankType === "low") return "비추천";
  if (lifeZone.rank) return `TOP ${lifeZone.rank}`;
  return `TOP ${index + 1}`;
}

function formatWorkplaceTitle(workplace = {}) {
  const district = workplace.district && workplace.district !== "해당 없음" ? `${workplace.district} ` : "";
  return `${district}${workplace.emdName ?? "직장"}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
