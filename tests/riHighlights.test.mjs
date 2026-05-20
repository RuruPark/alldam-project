import test from "node:test";
import assert from "node:assert/strict";
import {
  formatRiHighlightSentence,
  getRiHighlightAxisLabel,
  getTopRiHighlightGroups,
  getVisibleRiHighlightSentences,
  getVisibleRiHighlights,
  isRuralEupMyeon
} from "../src/utils/riHighlights.js";

test("isRuralEupMyeon only treats 읍 and 면 as rural ri-highlight targets", () => {
  assert.equal(isRuralEupMyeon("배방읍"), true);
  assert.equal(isRuralEupMyeon("탕정면"), true);
  assert.equal(isRuralEupMyeon("불당동"), false);
});

test("getRiHighlightAxisLabel maps dominant axes to user-facing labels", () => {
  assert.equal(getRiHighlightAxisLabel({ dominantAxis: "safetyMedical" }), "안전 의료 인프라");
  assert.equal(getRiHighlightAxisLabel({ dominantAxis: "living" }), "문화 체육 인프라");
  assert.equal(getRiHighlightAxisLabel({ dominantAxis: "traffic" }), "교통 인프라");
});

test("getVisibleRiHighlights returns only the top ri for the same axis", () => {
  const visible = getVisibleRiHighlights({
    emdName: "배방읍",
    riHighlights: [
      { riName: "공수리", totalCount: 90, dominantAxis: "safetyMedical" },
      { riName: "수철리", totalCount: 70, dominantAxis: "safetyMedical" },
      { riName: "중리", totalCount: 80, dominantAxis: "safetyMedical" }
    ]
  });

  assert.equal(visible.length, 1);
  assert.deepEqual(visible[0].riNames, ["공수리"]);
  assert.equal(visible[0].score, 90);
});

test("getVisibleRiHighlights groups tied top ri names into one axis group", () => {
  const visible = getVisibleRiHighlights({
    emdName: "배방읍",
    riHighlights: [
      { riName: "공수리", totalCount: 90, dominantAxis: "safetyMedical" },
      { riName: "수철리", totalCount: 90, dominantAxis: "safetyMedical" },
      { riName: "중리", totalCount: 90, dominantAxis: "safetyMedical" }
    ]
  });

  assert.equal(visible.length, 1);
  assert.deepEqual(visible[0].riNames, ["공수리", "수철리", "중리"]);
});

test("getTopRiHighlightGroups keeps separate top groups for different axes", () => {
  const groups = getTopRiHighlightGroups({
    emdName: "병천면",
    riHighlights: [
      { riName: "병천리", totalCount: 8, dominantAxis: "traffic" },
      { riName: "가전리", totalCount: 4, dominantAxis: "traffic" },
      { riName: "매성리", totalCount: 7, dominantAxis: "living" },
      { riName: "작성리", totalCount: 7, dominantAxis: "living" }
    ]
  });

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].riNames, ["병천리"]);
  assert.deepEqual(groups[1].riNames, ["매성리", "작성리"]);
});

test("formatRiHighlightSentence uses 의 and does not repeat eup/myeon names for ties", () => {
  const single = formatRiHighlightSentence(
    { emdName: "배방읍" },
    { riNames: ["공수리"], axisLabel: "안전 의료 인프라" }
  );
  const tied = formatRiHighlightSentence(
    { emdName: "배방읍" },
    { riNames: ["공수리", "수철리", "중리"], axisLabel: "안전 의료 인프라" }
  );

  assert.equal(single, "배방읍 공수리의 안전 의료 인프라가 우수");
  assert.equal(tied, "배방읍 공수리, 수철리, 중리의 안전 의료 인프라가 우수");
  assert.equal(tied.includes("배방읍 수철리"), false);
});

test("formatRiHighlightSentence hides ri sentences for dong life zones", () => {
  const sentence = formatRiHighlightSentence(
    { emdName: "불당동" },
    { riName: "읍내리", dominantAxis: "living", totalCount: 4 }
  );

  assert.equal(sentence, "");
});

test("getVisibleRiHighlightSentences hides empty ri data and dong zones", () => {
  assert.deepEqual(getVisibleRiHighlightSentences({ emdName: "배방읍", riHighlights: [] }), []);
  assert.deepEqual(getVisibleRiHighlightSentences({
    emdName: "불당동",
    riHighlights: [{ riName: "공수리", dominantAxis: "traffic", totalCount: 3 }]
  }), []);
});

test("getVisibleRiHighlightSentences returns grouped title-free sentences", () => {
  const sentences = getVisibleRiHighlightSentences({
    emdName: "병천면",
    riHighlights: [
      { riName: "병천리", dominantAxis: "traffic", totalCount: 10 },
      { riName: "가전리", dominantAxis: "traffic", totalCount: 10 },
      { riName: "매성리", dominantAxis: "traffic", totalCount: 3 },
      { riName: "작성리", dominantAxis: "living", totalCount: 5 }
    ]
  });

  assert.equal(sentences.length, 2);
  assert.equal(sentences[0], "병천면 병천리, 가전리의 교통 인프라가 우수");
  assert.equal(sentences[1], "병천면 작성리의 문화 체육 인프라가 우수");
  assert.equal(sentences.some((sentence) => sentence.includes("주요 리 인프라")), false);
});
