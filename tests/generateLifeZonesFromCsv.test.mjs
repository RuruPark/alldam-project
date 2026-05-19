import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateLifeZonesFromCsv } from "../scripts/generate-life-zones-from-csv.mjs";

const testBoundaryGeoJson = {
  type: "FeatureCollection",
  metadata: {
    source: "test-boundary",
    isSample: false,
    featureCount: 2
  },
  features: [
    createFeature({
      emdCode: "TEST_CHEONAN",
      city: "천안시",
      district: "동남구",
      emdName: "병천면",
      minLng: 127.0,
      minLat: 36.0,
      maxLng: 127.1,
      maxLat: 36.1
    }),
    createFeature({
      emdCode: "TEST_ASAN",
      city: "아산시",
      district: "해당 없음",
      emdName: "배방읍",
      minLng: 127.2,
      minLat: 36.2,
      maxLng: 127.3,
      maxLat: 36.3
    })
  ]
};

test("generateLifeZonesFromCsv aggregates address, coordinate, and ri data", async () => {
  const directory = await mkdtemp(join(tmpdir(), "life-zone-csv-"));
  const lifeZonesOutput = join(directory, "generatedLifeZones.js");
  const jsonOutput = join(directory, "summary.json");
  const markdownOutput = join(directory, "summary.md");

  await writeFile(
    join(directory, "충청남도_버스정류장_현황.csv"),
    [
      "정류장명,위도,경도,도시명",
      "병천정류장,36.05,127.05,천안시",
      "범위밖정류장,37.00,127.00,천안시"
    ].join("\n"),
    "utf8"
  );
  await writeFile(
    join(directory, "충청남도_약국_현황.csv"),
    [
      "기관명,주소",
      "병천약국,충청남도 천안시 동남구 병천면 병천리 10",
      "배방약국,충청남도 아산시 배방읍 공수리 20"
    ].join("\n"),
    "utf8"
  );

  const result = await generateLifeZonesFromCsv({
    inputDir: directory,
    lifeZonesOutput,
    jsonOutput,
    markdownOutput,
    boundaryGeoJson: testBoundaryGeoJson
  });

  assert.equal(result.generatedLifeZones.length, 2);
  assert.equal(result.summary.processedCsvFileCount, 2);
  assert.equal(result.summary.matchedRows, 3);
  assert.equal(result.summary.unmatchedRows, 1);

  const cheonanZone = result.generatedLifeZones.find((zone) => zone.emdCode === "TEST_CHEONAN");
  assert.ok(cheonanZone);
  assert.equal(cheonanZone.counts.bus_stop, 1);
  assert.equal(cheonanZone.counts.pharmacy, 1);
  assert.equal(cheonanZone.riHighlights[0].riName, "병천리");
  assert.equal(cheonanZone.dataSource, "preprocessed-csv");
  assert.equal(cheonanZone.isGenerated, true);

  for (const zone of result.generatedLifeZones) {
    assertScoreRange(zone.trafficInfraScore);
    assertScoreRange(zone.livingInfraScore);
    assertScoreRange(zone.safetyMedicalScore);
    assertScoreRange(zone.baseScore);
  }

  const generatedModule = await readFile(lifeZonesOutput, "utf8");
  assert.match(generatedModule, /export const generatedLifeZones/);
});

function createFeature({ emdCode, city, district, emdName, minLng, minLat, maxLng, maxLat }) {
  return {
    type: "Feature",
    properties: {
      emdCode,
      city,
      district,
      emdName
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat]
      ]]
    }
  };
}

function assertScoreRange(value) {
  assert.equal(Number.isFinite(value), true);
  assert.ok(value >= 0);
  assert.ok(value <= 100);
}
