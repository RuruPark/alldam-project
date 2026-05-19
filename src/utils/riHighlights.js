export function isRuralEupMyeon(emdName) {
  const value = String(emdName ?? "").trim();
  return value.endsWith("읍") || value.endsWith("면");
}

export function getVisibleRiHighlights(lifeZone = {}, limit = 3) {
  const emdName = lifeZone.emdName ?? lifeZone.eupMyeonDong ?? "";
  if (!isRuralEupMyeon(emdName)) return [];

  const highlights = Array.isArray(lifeZone.riHighlights) ? lifeZone.riHighlights : [];
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Math.floor(Number(limit))) : 3;

  return highlights.slice(0, safeLimit);
}

export function getRiHighlightAxisLabel(highlight = {}) {
  const axisLabels = {
    safetyMedical: "안전 의료 인프라",
    living: "문화 체육 인프라",
    traffic: "교통 인프라",
    transport: "교통 인프라"
  };

  if (axisLabels[highlight.dominantAxis]) {
    return axisLabels[highlight.dominantAxis];
  }

  const axes = highlight.axes && typeof highlight.axes === "object" ? highlight.axes : {};
  const [dominantAxis] = Object.entries(axes)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .sort(([, leftValue], [, rightValue]) => Number(rightValue) - Number(leftValue))[0] ?? [];

  return axisLabels[dominantAxis] ?? "";
}

export function formatRiHighlightSentence(lifeZone = {}, highlight = {}) {
  const emdName = String(lifeZone.emdName ?? lifeZone.eupMyeonDong ?? "").trim();
  const riName = String(highlight.riName ?? "").trim();
  const axisLabel = getRiHighlightAxisLabel(highlight);

  if (!isRuralEupMyeon(emdName) || !riName || !axisLabel) return "";

  return `${emdName} ${riName}에 ${axisLabel}가 우수`;
}

export function getVisibleRiHighlightSentences(lifeZone = {}, limit = 3) {
  return getVisibleRiHighlights(lifeZone, limit)
    .map((highlight) => formatRiHighlightSentence(lifeZone, highlight))
    .filter(Boolean);
}
