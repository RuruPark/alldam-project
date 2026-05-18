const NO_DISTRICT = "해당 없음";
const LEGACY_EMD_CODE_ALIASES = {
  "44133101": ["34012630"],
  "44133102": ["34012540"],
  "44133103": ["34012510"],
  "44131101": ["34011590"],
  "44200101": ["34040510"],
  "44200250": ["34040120"],
  "44200330": ["34040330"],
  "44200350": ["34040350"]
};
const LEGACY_EMD_NAME_ALIASES = [
  { city: "천안시", district: "서북구", source: "불당동", targets: ["불당2동"] },
  { city: "천안시", district: "서북구", source: "쌍용동", targets: ["쌍용2동"] },
  { city: "천안시", district: "서북구", source: "성정동", targets: ["성정1동"] },
  { city: "천안시", district: "동남구", source: "신부동", targets: ["신안동"] },
  { city: "천안시", district: "동남구", source: "청수동", targets: ["청룡동"] }
];

export function normalizeGeoJsonGeometryToRings(geometry) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];

  if (geometry.type === "Polygon") {
    return normalizePolygonCoordinates(geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygonCoordinates) => (
      normalizePolygonCoordinates(polygonCoordinates)
    ));
  }

  return [];
}

export function getFeatureIdentity(feature = {}) {
  const properties = feature.properties ?? {};

  return {
    emdCode: properties.emdCode ?? "",
    city: properties.city ?? "",
    district: properties.district ?? NO_DISTRICT,
    emdName: properties.emdName ?? ""
  };
}

export function isSameEmdFeature(feature, target = {}) {
  const identity = getFeatureIdentity(feature);
  const identityCode = normalizeText(identity.emdCode);
  const targetCode = normalizeText(target.emdCode);

  if (identityCode && targetCode) {
    if (identityCode === targetCode) return true;
    if ((LEGACY_EMD_CODE_ALIASES[targetCode] ?? []).includes(identityCode)) return true;
  }

  const identityCity = normalizeText(identity.city);
  const targetCity = normalizeText(target.city);
  const identityDistrict = normalizeDistrict(identity.district);
  const targetDistrict = normalizeDistrict(target.district);
  const identityEmdName = normalizeText(identity.emdName);
  const targetEmdName = normalizeText(target.emdName);

  if (
    identityCity === targetCity &&
    identityDistrict === targetDistrict &&
    identityEmdName === targetEmdName
  ) return true;

  return identityCity === targetCity &&
    identityDistrict === targetDistrict &&
    getAliasedEmdNames(targetCity, targetDistrict, targetEmdName).includes(identityEmdName);
}

function normalizePolygonCoordinates(polygonCoordinates) {
  if (!Array.isArray(polygonCoordinates) || !Array.isArray(polygonCoordinates[0])) {
    return [];
  }

  const outerRing = polygonCoordinates[0]
    .map(normalizePosition)
    .filter(Boolean);

  return outerRing.length >= 4 ? [outerRing] : [];
}

function normalizePosition(position) {
  if (!Array.isArray(position) || position.length < 2) return null;

  const lng = Number(position[0]);
  const lat = Number(position[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function normalizeDistrict(district) {
  return normalizeText(district) || NO_DISTRICT;
}

function getAliasedEmdNames(city, district, emdName) {
  const alias = LEGACY_EMD_NAME_ALIASES.find((item) => (
    item.city === city &&
    normalizeDistrict(item.district) === district &&
    item.source === emdName
  ));

  return alias?.targets ?? [];
}

function normalizeText(value) {
  return value == null ? "" : String(value).trim();
}
