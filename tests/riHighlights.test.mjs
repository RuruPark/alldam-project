import test from "node:test";
import assert from "node:assert/strict";
import {
  formatRiHighlightSentence,
  getRiHighlightAxisLabel,
  getVisibleRiHighlightSentences,
  getVisibleRiHighlights,
  isRuralEupMyeon
} from "../src/utils/riHighlights.js";

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

test("getRiHighlightAxisLabel maps dominant axes to user-facing labels", () => {
  assert.equal(getRiHighlightAxisLabel({ dominantAxis: "safetyMedical" }), "안전 의료 인프라");
  assert.equal(getRiHighlightAxisLabel({ dominantAxis: "living" }), "문화 체육 인프라");
  assert.equal(getRiHighlightAxisLabel({ dominantAxis: "traffic" }), "교통 인프라");
});

test("formatRiHighlightSentence renders natural eup/myeon ri sentences", () => {
  const sentence = formatRiHighlightSentence(
    { emdName: "신창면" },
    { riName: "읍내리", dominantAxis: "safetyMedical" }
  );

  assert.equal(sentence, "신창면 읍내리에 안전 의료 인프라가 우수");
});

test("formatRiHighlightSentence hides ri sentences for dong life zones", () => {
  const sentence = formatRiHighlightSentence(
    { emdName: "불당동" },
    { riName: "읍내리", dominantAxis: "living" }
  );

  assert.equal(sentence, "");
});

test("getVisibleRiHighlightSentences returns at most three title-free sentences", () => {
  const sentences = getVisibleRiHighlightSentences({
    emdName: "병천면",
    riHighlights: [
      { riName: "병천리", dominantAxis: "traffic" },
      { riName: "가전리", dominantAxis: "living" },
      { riName: "매성리", dominantAxis: "safetyMedical" },
      { riName: "탑원리", dominantAxis: "living" }
    ]
  });

  assert.equal(sentences.length, 3);
  assert.equal(sentences[0], "병천면 병천리에 교통 인프라가 우수");
  assert.equal(sentences.some((sentence) => sentence.includes("주요 리 인프라")), false);
});
