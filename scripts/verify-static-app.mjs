import { readFile } from "node:fs/promises";
import { mockLifeZones } from "../src/data/mockLifeZones.js";
import {
  assignRelativeGrades,
  calculateLifeZoneScores,
  getTopAndLowZones
} from "../src/utils/lifeZoneScoring.js";

const requiredFiles = [
  "index.html",
  "src/main.js",
  "src/components/app.js",
  "src/data/mockLifeZones.js",
  "src/utils/lifeZoneScoring.js",
  "src/types/lifeZone.ts",
  "docs/data-scoring-plan.md"
];

await Promise.all(requiredFiles.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")));

const scoredZones = assignRelativeGrades(calculateLifeZoneScores(mockLifeZones, {
  transportImportance: "medium",
  cultureSportsImportance: "medium",
  safetyMedicalImportance: "medium"
}));
const result = getTopAndLowZones(scoredZones);

if (mockLifeZones.length < 8) {
  throw new Error("mock 생활권 데이터는 최소 8개 이상이어야 합니다.");
}

if (result.recommendedZones.length !== 2 || !result.lowZone || result.displayZones.length !== 3) {
  throw new Error("결과는 추천 2개와 보완 필요 1개로 구성되어야 합니다.");
}

console.log("Static app verification passed.");
