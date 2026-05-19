import test from "node:test";
import assert from "node:assert/strict";
import { generatedLifeZones } from "../src/data/generatedLifeZones.js";
import { cheonanAsanEmdCenters } from "../src/data/cheonanAsanEmdCenters.js";
import {
  findWorkplaceCenterByCode,
  findWorkplaceCenterBySelection,
  getWorkplaceCitiesByDataMode,
  getWorkplaceDistrictsByCityAndDataMode,
  getWorkplaceEmdsBySelectionAndDataMode,
  getWorkplaceOptionsByDataMode
} from "../src/data/workplaceOptions.js";

test("generated mode exposes all generated life zones as workplace options", () => {
  const options = getWorkplaceOptionsByDataMode("generated");

  assert.equal(options.length, 48);
  assert.equal(options.every((option) => option.source === "generatedLifeZones"), true);
  assert.equal(options.filter((option) => option.city === "천안시").length, 31);
  assert.equal(options.filter((option) => option.city === "아산시").length, 17);
});

test("mock mode keeps the sample workplace options", () => {
  const options = getWorkplaceOptionsByDataMode("mock");

  assert.equal(options.length, cheonanAsanEmdCenters.length);
  assert.equal(options.every((option) => option.source === "cheonanAsanEmdCenters"), true);
});

test("generated mode supports city, district, and EMD filtering", () => {
  assert.deepEqual(getWorkplaceCitiesByDataMode("generated").sort(), ["아산시", "천안시"].sort());
  assert.ok(getWorkplaceDistrictsByCityAndDataMode("천안시", "generated").includes("동남구"));
  assert.ok(getWorkplaceDistrictsByCityAndDataMode("천안시", "generated").includes("서북구"));

  const cheonanDongnamOptions = getWorkplaceEmdsBySelectionAndDataMode("천안시", "동남구", "generated");
  assert.ok(cheonanDongnamOptions.length > 0);
  assert.equal(cheonanDongnamOptions.every((option) => option.city === "천안시" && option.district === "동남구"), true);
});

test("findWorkplaceCenterBySelection returns generated coordinates", () => {
  const targetZone = generatedLifeZones.find((zone) => zone.city === "아산시" && zone.emdName);
  const workplace = findWorkplaceCenterBySelection({
    city: targetZone.city,
    district: targetZone.district,
    emdName: targetZone.emdName,
    dataMode: "generated"
  });

  assert.ok(workplace);
  assert.equal(workplace.emdCode, targetZone.emdCode);
  assert.equal(workplace.lat, targetZone.centerLat);
  assert.equal(workplace.lng, targetZone.centerLng);
});

test("findWorkplaceCenterByCode safely handles invalid values", () => {
  assert.equal(findWorkplaceCenterByCode("not-found", "generated"), null);
  assert.equal(findWorkplaceCenterBySelection({
    city: "천안시",
    district: "서북구",
    emdName: "없는동",
    dataMode: "generated"
  }), null);
});
