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
