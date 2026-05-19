import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const userFacingFiles = [
  new URL("../src/components/app.js", import.meta.url),
  new URL("../src/styles.css", import.meta.url)
];

async function readUserFacingSource() {
  const contents = await Promise.all(userFacingFiles.map((file) => readFile(file, "utf8")));
  return contents.join("\n");
}

test("requested removed UI copy is not present in user-facing source", async () => {
  const source = await readUserFacingSource();
  const removedTexts = [
    "Naver Maps 행정동 경계",
    "지도 연결선은 실제 길찾기 경로가 아니라 위치 비교용 선입니다.",
    "천안·아산 행정동 생활권 48개 전체 후보 기준",
    "생활 인프라 선호도",
    "입력한 조건을 기준으로 추천 생활권을 보여줍니다.",
    "생활권 추천 조건 설정",
    "실제 전처리 csv의 인프라 분포로 계산했습니다.",
    "실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "실제 csv 기준",
    "실제 CSV 기준"
  ];

  removedTexts.forEach((text) => {
    assert.equal(source.includes(text), false, `${text} should be removed`);
  });
});

test("new initial screen title remains present", async () => {
  const source = await readUserFacingSource();

  assert.equal(source.includes("천안 아산 맞춤형 생활권 추천 서비스"), true);
});
