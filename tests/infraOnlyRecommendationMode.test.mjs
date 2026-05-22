import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildInfraOnlyResultBundle,
  NO_WORKPLACE_ID,
  NO_WORKPLACE_LABEL,
  normalizeWorkplaceEmdCode,
  RECOMMENDATION_MODES
} from "../src/components/app.js";

const appSource = await readFile(new URL("../src/components/app.js", import.meta.url), "utf8");

test("workplace none option uses a stable internal value", () => {
  assert.equal(NO_WORKPLACE_ID, "none");
  assert.equal(NO_WORKPLACE_LABEL, "선택 안함");
  assert.equal(normalizeWorkplaceEmdCode("none"), NO_WORKPLACE_ID);
  assert.equal(normalizeWorkplaceEmdCode(""), NO_WORKPLACE_ID);
  assert.equal(normalizeWorkplaceEmdCode(null), NO_WORKPLACE_ID);
  assert.equal(normalizeWorkplaceEmdCode("NO_WORKPLACE"), NO_WORKPLACE_ID);
  assert.equal(normalizeWorkplaceEmdCode("선택안함"), NO_WORKPLACE_ID);
  assert.equal(normalizeWorkplaceEmdCode("선택 안함"), NO_WORKPLACE_ID);
  assert.equal(normalizeWorkplaceEmdCode("LZ_001"), "LZ_001");
});

test("infraOnly result bundle ranks by infrastructure score only", () => {
  const zones = [
    {
      id: "low",
      name: "낮은 생활권",
      totalScore: 20,
      rank: 3,
      axisScores: { transport: 20, living: 20, safetyMedical: 20 }
    },
    {
      id: "top",
      name: "상위 생활권",
      totalScore: 91,
      rank: 1,
      axisScores: { transport: 95, living: 82, safetyMedical: 88 }
    },
    {
      id: "second",
      name: "차상위 생활권",
      totalScore: 84,
      rank: 2,
      axisScores: { transport: 70, living: 92, safetyMedical: 82 }
    }
  ];

  const bundle = buildInfraOnlyResultBundle(zones);

  assert.equal(bundle.recommendationMode, RECOMMENDATION_MODES.infraOnly);
  assert.deepEqual(bundle.recommendedZones.map((zone) => zone.id), ["top", "second"]);
  assert.equal(bundle.lowZone.id, "low");
  assert.equal(bundle.displayZones.length, 3);
  assert.equal(bundle.displayZones.some((zone) => zone.commute), false);
});

test("infraOnly empty state does not create commute API targets", () => {
  const bundle = buildInfraOnlyResultBundle([]);

  assert.equal(bundle.recommendationMode, RECOMMENDATION_MODES.infraOnly);
  assert.equal(bundle.displayZones.length, 0);
  assert.equal(bundle.emptyState.title, "추천할 생활권 데이터가 없습니다.");
});

test("infraOnly UI path exposes no workplace commute API calls or commute labels", () => {
  assert.ok(appSource.includes("NO_WORKPLACE_LABEL"));
  assert.ok(appSource.includes("data-workplace-none"));
  assert.ok(appSource.includes("workplace-none-button"));
  assert.ok(appSource.includes("value=\"${NO_WORKPLACE_ID}\""));
  assert.ok(appSource.includes("직장 위치를 선택하지 않으면 인프라 선호도만으로 생활권을 추천합니다."));
  assert.ok(appSource.includes("직장 위치를 선택하지 않아 통근 조건은 반영하지 않았습니다."));
  assert.ok(appSource.includes("finalApiTargetCount: 0"));
  assert.ok(appSource.includes("renderInfraOnlySummaryCard"));
  assert.ok(appSource.includes("state.recommendationMode === RECOMMENDATION_MODES.infraOnly ? null : getSelectedWorkplace()"));
});
