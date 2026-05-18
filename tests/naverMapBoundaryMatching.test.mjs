import test from "node:test";
import assert from "node:assert/strict";
import {
  cheonanAsanEmdBoundaryGeoJson,
  getAllBoundaryFeatures
} from "../src/data/cheonanAsanEmdBoundaries.js";
import {
  findBoundaryFeatureForTarget,
  normalizeBoundaryTarget
} from "../src/components/NaverMapView.js";

test("normalizeBoundaryTarget supplements district and legacy code from EMD centers", () => {
  assert.deepEqual(normalizeBoundaryTarget({
    city: "천안시",
    eupMyeonDong: "불당동"
  }), {
    emdCode: "44133101",
    city: "천안시",
    district: "서북구",
    emdName: "불당동"
  });
});

test("findBoundaryFeatureForTarget matches mock life zone shape without district", () => {
  const feature = findBoundaryFeatureForTarget(getAllBoundaryFeatures(), {
    city: "천안시",
    eupMyeonDong: "불당동"
  });

  assert.equal(cheonanAsanEmdBoundaryGeoJson.metadata.isSample, false);
  assert.equal(feature?.properties.emdCode, "34012630");
  assert.equal(feature?.properties.emdName, "불당2동");
});

test("findBoundaryFeatureForTarget matches Asan mock life zone shape", () => {
  const feature = findBoundaryFeatureForTarget(getAllBoundaryFeatures(), {
    city: "아산시",
    eupMyeonDong: "배방읍"
  });

  assert.equal(feature?.properties.emdCode, "34040120");
  assert.equal(feature?.properties.emdName, "배방읍");
});
