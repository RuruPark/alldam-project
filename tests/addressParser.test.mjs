import test from "node:test";
import assert from "node:assert/strict";
import {
  extractEmdName,
  extractRiName,
  isCheonanAsanAddress,
  parseChungnamAddress
} from "../src/utils/addressParser.js";

test("parses Cheonan eup/myeon address with ri name", () => {
  const result = parseChungnamAddress("충청남도 천안시 동남구 병천면 병천리 120");

  assert.equal(result.city, "천안시");
  assert.equal(result.district, "동남구");
  assert.equal(result.emdName, "병천면");
  assert.equal(result.riName, "병천리");
  assert.equal(result.isTargetArea, true);
});

test("parses Asan eup/myeon address with no district", () => {
  const result = parseChungnamAddress("충청남도 아산시 음봉면 산동리 22");

  assert.equal(result.city, "아산시");
  assert.equal(result.district, "해당 없음");
  assert.equal(result.emdName, "음봉면");
  assert.equal(result.riName, "산동리");
});

test("parses Cheonan dong address without ri name", () => {
  const result = parseChungnamAddress("충청남도 천안시 서북구 불당동 1480");

  assert.equal(result.city, "천안시");
  assert.equal(result.district, "서북구");
  assert.equal(result.emdName, "불당동");
  assert.equal(result.riName, null);
});

test("returns null ri name when address has no ri information", () => {
  assert.equal(extractEmdName("충청남도 아산시 온천동 시민로 1"), "온천동");
  assert.equal(extractRiName("충청남도 아산시 온천동 시민로 1"), null);
  assert.equal(isCheonanAsanAddress("충청남도 공주시 반포면 공암리 1"), false);
});
