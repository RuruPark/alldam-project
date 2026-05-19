import test from "node:test";
import assert from "node:assert/strict";
import { getVisibleRiHighlights, isRuralEupMyeon } from "../src/utils/riHighlights.js";

const highlights = [
  { riName: "산동리", summaryText: "산동리 안전 의료 인프라 11건" },
  { riName: "병천리", summaryText: "병천리 생활 편의 인프라 5건" },
  { riName: "공수리", summaryText: "공수리 안전 의료 인프라 3건" },
  { riName: "중리", summaryText: "중리 생활 편의 인프라 2건" }
];

test("isRuralEupMyeon only treats 읍 and 면 as rural ri-highlight targets", () => {
  assert.equal(isRuralEupMyeon("배방읍"), true);
  assert.equal(isRuralEupMyeon("탕정면"), true);
  assert.equal(isRuralEupMyeon("불당동"), false);
});

test("getVisibleRiHighlights returns up to three highlights for 읍 or 면 zones", () => {
  const visible = getVisibleRiHighlights({ emdName: "배방읍", riHighlights: highlights });

  assert.equal(visible.length, 3);
  assert.equal(visible[0].riName, "산동리");
});

test("getVisibleRiHighlights hides ri highlights for 동 zones", () => {
  const visible = getVisibleRiHighlights({ emdName: "불당동", riHighlights: highlights });

  assert.equal(visible.length, 0);
});
