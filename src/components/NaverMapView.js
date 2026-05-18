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
    const centerPoint = normalizePoint(workplace) ?? DEFAULT_CENTER;
    const map = new maps.Map(container, {
      center: new maps.LatLng(centerPoint.lat, centerPoint.lng),
      zoom: 11,
      minZoom: 9,
      zoomControl: true,
      zoomControlOptions: {
        position: maps.Position.TOP_RIGHT
      }
    });
    const overlays = [];
    const boundaryFeatures = getAllBoundaryFeatures();

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

    results.forEach((lifeZone, index) => {
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
          strokeStyle: isSelected ? "solid" : "shortdash"
        }));
      }

      bounds.extend(new maps.LatLng(lifeZonePoint.lat, lifeZonePoint.lng));
      boundsPointCount += 1;
    });

    if (boundsPointCount > 1) {
      map.fitBounds(bounds);
    } else if (boundsPointCount === 1) {
      map.setCenter(bounds.getCenter());
    }

    return {
      map,
      boundaryMetadata: cheonanAsanEmdBoundaryGeoJson.metadata,
      destroy() {
        overlays.forEach((overlay) => overlay?.setMap?.(null));
      }
    };
  } catch (error) {
    onError?.(error);
    throw error;
  }
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
