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
    const filteredResults = filterCheonanAsanMapResults(results);
    const centerPoint = clampPointToBounds(
      normalizePoint(workplace) ?? getBoundsCenter(allowedBounds),
      allowedBounds
    ) ?? DEFAULT_CENTER;
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
    const boundaryFeatures = getAllBoundaryFeatures();

    overlays.push(...createOutsideMaskPolygons({ maps, map, bounds: allowedBounds }));
    createBoundarySvgMaskOverlay({
      maps,
      map,
      container,
      features: boundaryFeatures,
      cleanupHandlers
    });
    applyMapBoundsGuard({ maps, map, bounds: allowedBounds, cleanupHandlers });

    if (workplace) {
      const workplacePoint = normalizePoint(workplace);

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

    const workplacePoint = normalizePoint(workplace);
    const bounds = new maps.LatLngBounds();
    let boundsPointCount = 0;

    if (workplacePoint) {
      bounds.extend(new maps.LatLng(workplacePoint.lat, workplacePoint.lng));
      boundsPointCount += 1;

      const workplaceBoundaryFeature = findBoundaryFeatureForTarget(boundaryFeatures, workplace);
      if (workplaceBoundaryFeature) {
        boundsPointCount += addBoundaryPolygons({
          maps,
          map,
          bounds,
          overlays,
          feature: workplaceBoundaryFeature,
          variant: "workplace",
          isSelected: true
        });
      }
    }

    filteredResults.forEach((lifeZone, index) => {
      const lifeZonePoint = normalizePoint(lifeZone);

      if (!lifeZonePoint) return;

      const isSelected = lifeZone.id === selectedLifeZoneId;
      const rankLabel = getRankLabel(lifeZone, index);
      const lifeZoneBoundaryFeature = findBoundaryFeatureForTarget(boundaryFeatures, lifeZone);

      if (lifeZoneBoundaryFeature) {
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

    if (allowedLatLngBounds) {
      map.fitBounds(allowedLatLngBounds);
    } else if (boundsPointCount > 1) {
      map.fitBounds(bounds);
    } else if (boundsPointCount === 1) {
      map.setCenter(bounds.getCenter());
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

function createBoundarySvgMaskOverlay({ maps, map, container, features, cleanupHandlers }) {
  if (typeof document === "undefined" || !container || !Array.isArray(features) || features.length === 0) {
    return null;
  }

  const overlay = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const maskPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  let frameRequest = 0;

  overlay.className = "naver-boundary-mask-overlay";
  svg.setAttribute("aria-hidden", "true");
  maskPath.setAttribute("class", "naver-boundary-mask-path");
  maskPath.setAttribute("fill-rule", "evenodd");
  svg.appendChild(maskPath);
  overlay.appendChild(svg);
  container.appendChild(overlay);

  const updateMask = () => {
    frameRequest = 0;

    const size = getContainerPixelSize(container);
    const projection = map.getProjection?.();

    if (!size || !projection?.fromCoordToOffset) {
      overlay.hidden = true;
      return;
    }

    let pathData = "";

    try {
      pathData = buildBoundaryMaskPath({
        maps,
        projection,
        features,
        width: size.width,
        height: size.height
      });
    } catch (error) {
      console.warn("Failed to update Cheonan-Asan boundary mask.", error);
      overlay.hidden = true;
      return;
    }

    if (!pathData) {
      overlay.hidden = true;
      return;
    }

    svg.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);
    svg.setAttribute("width", String(size.width));
    svg.setAttribute("height", String(size.height));
    maskPath.setAttribute("d", pathData);
    overlay.hidden = false;
  };

  const scheduleUpdate = () => {
    if (frameRequest) return;

    frameRequest = requestAnimationFrame(updateMask);
  };

  scheduleUpdate();

  const idleListener = maps.Event.addListener(map, "idle", scheduleUpdate);
  const zoomListener = maps.Event.addListener(map, "zoom_changed", scheduleUpdate);
  const boundsListener = maps.Event.addListener(map, "bounds_changed", scheduleUpdate);

  window.addEventListener("resize", scheduleUpdate);
  cleanupHandlers.push(() => {
    maps.Event.removeListener(idleListener);
    maps.Event.removeListener(zoomListener);
    maps.Event.removeListener(boundsListener);
    window.removeEventListener("resize", scheduleUpdate);

    if (frameRequest) {
      cancelAnimationFrame(frameRequest);
    }

    overlay.remove();
  });

  return overlay;
}

function buildBoundaryMaskPath({ maps, projection, features, width, height }) {
  const outerRect = `M0 0H${roundPixel(width)}V${roundPixel(height)}H0Z`;
  const ringPaths = features
    .flatMap((feature) => normalizeGeoJsonGeometryToRings(feature.geometry))
    .map((ring) => makeProjectedRingPath({ maps, projection, ring }))
    .filter(Boolean);

  if (ringPaths.length === 0) return "";

  return [outerRect, ...ringPaths].join("");
}

function makeProjectedRingPath({ maps, projection, ring }) {
  if (!Array.isArray(ring) || ring.length < 3) return "";

  const points = ring
    .map((point) => {
      const offset = projection.fromCoordToOffset(new maps.LatLng(point.lat, point.lng));
      return normalizePixelPoint(offset);
    })
    .filter(Boolean);

  if (points.length < 3) return "";

  const [firstPoint, ...restPoints] = points;
  return [
    `M${roundPixel(firstPoint.x)} ${roundPixel(firstPoint.y)}`,
    ...restPoints.map((point) => `L${roundPixel(point.x)} ${roundPixel(point.y)}`),
    "Z"
  ].join("");
}

function getContainerPixelSize(container) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;

  return { width, height };
}

function normalizePixelPoint(point) {
  const x = typeof point?.x === "function" ? point.x() : point?.x;
  const y = typeof point?.y === "function" ? point.y() : point?.y;

  if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return null;

  return {
    x: Number(x),
    y: Number(y)
  };
}

function roundPixel(value) {
  return Number(value).toFixed(1);
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
function addBoundaryPolygons({ maps, map, bounds, overlays, feature, variant, isSelected, onClick }) {
  try {
    const rings = normalizeGeoJsonGeometryToRings(feature.geometry);
    let pointCount = 0;

    rings.forEach((ring) => {
      const path = ring.map((point) => new maps.LatLng(point.lat, point.lng));
      const polygon = new maps.Polygon({
        map,
        paths: path,
        ...getBoundaryStyle(variant, isSelected)
      });

      if (onClick) {
        maps.Event.addListener(polygon, "click", onClick);
      }

      path.forEach((latLng) => {
        bounds.extend(latLng);
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
      zIndex: 5
    },
    recommended: {
      strokeColor: "#147d72",
      fillColor: "#147d72",
      fillOpacity: 0.09,
      zIndex: 3
    },
    low: {
      strokeColor: "#9d6b5f",
      fillColor: "#dd6b4d",
      fillOpacity: 0.07,
      zIndex: 2
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
  const lat = Number(point.lat ?? point.centerLat);
  const lng = Number(point.lng ?? point.centerLng);

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
