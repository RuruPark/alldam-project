import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appJs = await readFile(new URL("../src/components/app.js", import.meta.url), "utf8");
const stylesCss = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("result reset action is rendered after result cards and before readouts", () => {
  assert.ok(appJs.includes("renderResultActions()"));
  assert.ok(appJs.includes("renderMapDataSourceBadge()"));
  assert.ok(appJs.includes("panel-summary"));
  assert.ok(appJs.includes("result-data-source-badge"));
  assert.ok(appJs.includes("secondary-button compact"));
  assert.equal(appJs.includes("추천 ${bundle.recommendedZones.length}개 · 비추천"), false);
  assert.equal(appJs.includes("renderResultDataSourceBadge()"), false);

  const cardListIndex = appJs.indexOf("zone-card-list");
  const resultActionIndex = appJs.indexOf("renderResultActions()");
  const preferenceReadoutIndex = appJs.indexOf("renderPreferenceReadout()");
  const mapViewIndex = appJs.indexOf("map-view");
  const mapBadgeIndex = appJs.indexOf("renderMapDataSourceBadge()");
  const panelHeaderIndex = appJs.indexOf("panel-header");

  assert.ok(cardListIndex < resultActionIndex);
  assert.ok(resultActionIndex < preferenceReadoutIndex);
  assert.ok(mapViewIndex < mapBadgeIndex);
  assert.ok(mapBadgeIndex < panelHeaderIndex);
});

test("compact UI classes exist for the result and input panels", () => {
  assert.ok(stylesCss.includes(".panel-summary"));
  assert.ok(stylesCss.includes(".result-actions"));
  assert.ok(stylesCss.includes(".result-data-source-badge"));
  assert.ok(stylesCss.includes(".map-data-source-badge-wrap"));
  assert.ok(stylesCss.includes("pointer-events: none"));
  assert.ok(stylesCss.includes(".secondary-button.compact"));
  assert.ok(stylesCss.includes("padding: 14px 16px"));
  assert.ok(stylesCss.includes("min-height: 58px"));
});

test("target commute time uses dynamic mode-specific range without the old number box", () => {
  assert.ok(appJs.includes("getTargetMinutesRangeForCommuteMode"));
  assert.ok(appJs.includes("normalizeTargetMinutesForCommuteMode"));
  assert.ok(appJs.includes("도보는 최대 60분까지 추천 후보로 봅니다."));
  assert.ok(appJs.includes("commute-target-control"));
  assert.equal(appJs.includes("data-commute-target-number"), false);

  const commuteModeIndex = appJs.indexOf("주 통근수단");
  const targetControlIndex = appJs.indexOf("commute-target-control");
  assert.ok(commuteModeIndex < targetControlIndex);
});
