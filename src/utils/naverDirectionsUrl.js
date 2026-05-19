const NAVER_DIRECTIONS_BASE_URL = "https://map.naver.com/index.nhn";

export function buildNaverDirectionsUrl({ start, goal, mode } = {}) {
  const startPoint = normalizeRoutePoint(start);
  const goalPoint = normalizeRoutePoint(goal);

  if (!startPoint || !goalPoint) return null;

  const params = [
    ["slng", formatCoordinate(startPoint.lng)],
    ["slat", formatCoordinate(startPoint.lat)],
    ["stext", encodeRouteText(startPoint.name)],
    ["elng", formatCoordinate(goalPoint.lng)],
    ["elat", formatCoordinate(goalPoint.lat)],
    ["etext", encodeRouteText(goalPoint.name)],
    ["menu", "route"]
  ];
  const routeMode = getRouteModeParam(mode);

  if (routeMode) {
    params.push(["pathType", routeMode]);
  }

  return `${NAVER_DIRECTIONS_BASE_URL}?${params.map(([key, value]) => `${key}=${value}`).join("&")}`;
}

export function encodeRouteText(text) {
  return encodeURIComponent(String(text ?? "").trim());
}

export function getRouteModeParam(mode) {
  const normalizedMode = String(mode ?? "").trim().toLowerCase();
  const modeMap = {
    car: "0",
    "자동차": "0",
    transit: "1",
    "대중교통": "1",
    walk: "2",
    "도보": "2"
  };

  return modeMap[normalizedMode] ?? "";
}

function normalizeRoutePoint(point = {}) {
  const lat = Number(point.lat ?? point.centerLat);
  const lng = Number(point.lng ?? point.centerLng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    name: String(point.name ?? "").trim(),
    lat,
    lng
  };
}

function formatCoordinate(value) {
  return Number(value).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}
