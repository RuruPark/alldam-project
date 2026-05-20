const AXIS_LABELS = {
  safetyMedical: "안전 의료 인프라",
  living: "문화 체육 인프라",
  traffic: "교통 인프라",
  transport: "교통 인프라"
};

export function isRuralEupMyeon(emdName) {
  const value = String(emdName ?? "").trim();
  return value.endsWith("읍") || value.endsWith("면");
}

export function getVisibleRiHighlights(lifeZone = {}, limit = 3) {
  return getTopRiHighlightGroups(lifeZone, limit);
}

export function getTopRiHighlightGroups(lifeZone = {}, limit = 3) {
  const emdName = lifeZone.emdName ?? lifeZone.eupMyeonDong ?? "";
  if (!isRuralEupMyeon(emdName)) return [];

  const highlights = Array.isArray(lifeZone.riHighlights) ? lifeZone.riHighlights : [];
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Math.floor(Number(limit))) : 3;
  const groupsByAxis = new Map();

  highlights.forEach((highlight) => {
    const axis = getRiHighlightDominantAxis(highlight);
    const axisLabel = getRiHighlightAxisLabel({ ...highlight, dominantAxis: axis });
    const riName = String(highlight?.riName ?? "").trim();
    const score = getRiHighlightAxisScore(highlight, axis);

    if (!axis || !axisLabel || !riName || !Number.isFinite(score)) return;

    const existingGroup = groupsByAxis.get(axis);
    if (!existingGroup || score > existingGroup.score) {
      groupsByAxis.set(axis, {
        axis,
        axisLabel,
        score,
        riNames: [riName]
      });
      return;
    }

    if (score === existingGroup.score && !existingGroup.riNames.includes(riName)) {
      existingGroup.riNames.push(riName);
    }
  });

  return Array.from(groupsByAxis.values()).slice(0, safeLimit);
}

export function getRiHighlightAxisLabel(highlight = {}) {
  const axis = highlight.dominantAxis ?? getRiHighlightDominantAxis(highlight);
  return AXIS_LABELS[axis] ?? "";
}

export function formatRiHighlightSentence(lifeZone = {}, highlight = {}) {
  const emdName = String(lifeZone.emdName ?? lifeZone.eupMyeonDong ?? "").trim();
  if (!isRuralEupMyeon(emdName)) return "";

  const group = normalizeRiHighlightGroup(highlight);
  if (!group.riNames.length || !group.axisLabel) return "";

  return `${emdName} ${group.riNames.join(", ")}의 ${group.axisLabel}가 우수`;
}

export function getVisibleRiHighlightSentences(lifeZone = {}, limit = 3) {
  return getTopRiHighlightGroups(lifeZone, limit)
    .map((highlightGroup) => formatRiHighlightSentence(lifeZone, highlightGroup))
    .filter(Boolean);
}

export function getRiHighlightAxisScore(highlight = {}, axis = getRiHighlightDominantAxis(highlight)) {
  const axes = highlight.axes && typeof highlight.axes === "object" ? highlight.axes : {};
  const axisCandidates = [
    axes[axis],
    highlight.axisScores?.[axis],
    highlight.scores?.[axis],
    highlight.dominantAxis === axis ? highlight.totalCount : null,
    highlight.dominantAxis === axis ? highlight.count : null,
    highlight.dominantAxis === axis ? highlight.value : null
  ];

  const score = axisCandidates.map(Number).find((value) => Number.isFinite(value));
  return score ?? NaN;
}

function getRiHighlightDominantAxis(highlight = {}) {
  if (AXIS_LABELS[highlight.dominantAxis]) return highlight.dominantAxis;

  const axes = highlight.axes && typeof highlight.axes === "object" ? highlight.axes : {};
  const [dominantAxis] = Object.entries(axes)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .sort(([, leftValue], [, rightValue]) => Number(rightValue) - Number(leftValue))[0] ?? [];

  return AXIS_LABELS[dominantAxis] ? dominantAxis : null;
}

function normalizeRiHighlightGroup(highlight = {}) {
  if (Array.isArray(highlight.riNames)) {
    return {
      riNames: dedupeRiNames(highlight.riNames),
      axisLabel: highlight.axisLabel ?? getRiHighlightAxisLabel(highlight)
    };
  }

  return {
    riNames: dedupeRiNames([highlight.riName]),
    axisLabel: getRiHighlightAxisLabel(highlight)
  };
}

function dedupeRiNames(riNames = []) {
  return riNames
    .map((riName) => String(riName ?? "").trim())
    .filter(Boolean)
    .filter((riName, index, self) => self.indexOf(riName) === index);
}
