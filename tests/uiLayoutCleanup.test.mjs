import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appJs = await readFile(new URL("../src/components/app.js", import.meta.url), "utf8");
const stylesCss = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("result reset action is rendered after result cards and before readouts", () => {
  assert.ok(appJs.includes("renderResultActions()"));
  assert.ok(appJs.includes("panel-summary"));
  assert.ok(appJs.includes("secondary-button compact"));

  const cardListIndex = appJs.indexOf("zone-card-list");
  const resultActionIndex = appJs.indexOf("renderResultActions()");
  const preferenceReadoutIndex = appJs.indexOf("renderPreferenceReadout()");

  assert.ok(cardListIndex < resultActionIndex);
  assert.ok(resultActionIndex < preferenceReadoutIndex);
});

test("compact UI classes exist for the result and input panels", () => {
  assert.ok(stylesCss.includes(".panel-summary"));
  assert.ok(stylesCss.includes(".result-actions"));
  assert.ok(stylesCss.includes(".secondary-button.compact"));
  assert.ok(stylesCss.includes("padding: 14px 16px"));
  assert.ok(stylesCss.includes("min-height: 58px"));
});

test("target commute time remains clamped to ten through ninety minutes", () => {
  assert.ok(appJs.includes("MIN_TARGET_MINUTES"));
  assert.ok(appJs.includes("MAX_TARGET_MINUTES"));
  assert.equal(appJs.includes("data-commute-target-number"), false);
});
