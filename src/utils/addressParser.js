const TARGET_CITIES = ["천안시", "아산시"];
const CHEONAN_DISTRICTS = ["동남구", "서북구"];
const NO_DISTRICT = "해당 없음";
const NON_ADMIN_DONG_NAMES = new Set(["상가동", "관리동"]);
const NON_ADMIN_RI_SUFFIXES = ["거리", "삼거리", "사거리", "오거리", "밸리", "로터리", "로타리"];

export function parseChungnamAddress(address) {
  const originalAddress = normalizeText(address);
  const tokens = tokenizeAddress(originalAddress);
  const city = findCity(tokens);

  if (!city) {
    return {
      city: null,
      district: null,
      emdName: null,
      riName: null,
      isTargetArea: false,
      originalAddress
    };
  }

  const district = normalizeDistrict(city, findDistrict(tokens, city));
  const emdName = extractEmdNameFromTokens(tokens, city, district);
  const riName = extractRiNameFromTokens(tokens, emdName);

  return {
    city,
    district,
    emdName,
    riName,
    isTargetArea: Boolean(city && emdName),
    originalAddress
  };
}

export function normalizeDistrict(city, district) {
  const normalizedCity = normalizeText(city);
  const normalizedDistrict = normalizeText(district);

  if (normalizedCity === "아산시") return NO_DISTRICT;
  if (normalizedCity === "천안시" && CHEONAN_DISTRICTS.includes(normalizedDistrict)) return normalizedDistrict;
  return normalizedDistrict || NO_DISTRICT;
}

export function extractEmdName(address) {
  return parseChungnamAddress(address).emdName;
}

export function extractRiName(address) {
  return parseChungnamAddress(address).riName;
}

export function isCheonanAsanAddress(address) {
  return parseChungnamAddress(address).isTargetArea;
}

export function tokenizeAddress(value) {
  return normalizeText(value)
    .replace(/[()[\]{}]/g, " ")
    .split(/[\s,]+/)
    .map((token) => token.replace(/[^\p{Script=Hangul}0-9-]/gu, ""))
    .filter(Boolean);
}

function findCity(tokens) {
  return TARGET_CITIES.find((city) => tokens.includes(city)) ?? null;
}

function findDistrict(tokens, city) {
  if (city !== "천안시") return NO_DISTRICT;
  return CHEONAN_DISTRICTS.find((district) => tokens.includes(district)) ?? NO_DISTRICT;
}

function extractEmdNameFromTokens(tokens, city, district) {
  const startIndex = getEmdSearchStartIndex(tokens, city, district);
  const emdToken = tokens.slice(startIndex).find(isLikelyAdministrativeEmd);

  return emdToken ?? null;
}

function getEmdSearchStartIndex(tokens, city, district) {
  const districtIndex = CHEONAN_DISTRICTS.includes(district) ? tokens.indexOf(district) : -1;
  if (districtIndex >= 0) return districtIndex + 1;

  const cityIndex = tokens.indexOf(city);
  return cityIndex >= 0 ? cityIndex + 1 : 0;
}

function extractRiNameFromTokens(tokens, emdName) {
  if (!emdName || (!emdName.endsWith("읍") && !emdName.endsWith("면"))) return null;

  const emdIndex = tokens.indexOf(emdName);
  if (emdIndex < 0 || emdIndex >= tokens.length - 1) return null;

  const riName = normalizeRiCandidate(tokens[emdIndex + 1]);
  return isLikelyAdministrativeRi(riName) ? riName : null;
}

function isLikelyAdministrativeEmd(value) {
  return /^[가-힣]+[0-9]?(?:읍|면|동)$/.test(value) && !NON_ADMIN_DONG_NAMES.has(value);
}

function normalizeRiCandidate(value) {
  return normalizeText(value).match(/^([가-힣]+[0-9]*리)(?:$|[0-9-])/)?.[1] ?? "";
}

function isLikelyAdministrativeRi(value) {
  if (!/^[가-힣]+[0-9]*리$/.test(value)) return false;
  return !NON_ADMIN_RI_SUFFIXES.some((suffix) => value.endsWith(suffix));
}

function normalizeText(value) {
  return value == null ? "" : String(value).trim();
}
