import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  applyTransitCommuteResultToTimes,
  buildOdsayTransitRequestUrl,
  clearOdsayTransitRequestCache,
  fetchOdsayTransitCommutes,
  normalizeOdsayTransitApiResult
} from "../src/utils/odsayTransitApi.js";

const start = { lat: 36.815, lng: 127.108 };
const goal = { lat: 36.773, lng: 127.059 };
const lifeZones = [{ id: "LZ_TEST", centerLat: goal.lat, centerLng: goal.lng }];

test("public-config.js keeps the ODsay URI/Web key as a placeholder", async () => {
  const publicConfig = await readFile(new URL("../public-config.js", import.meta.url), "utf8");

  assert.match(publicConfig, /PUBLIC_ODSAY_URI_API_KEY\s*:\s*""/);
});

test("buildOdsayTransitRequestUrl encodes apiKey with URLSearchParams", () => {
  const apiKey = "fixture+key/value=";
  const requestUrl = buildOdsayTransitRequestUrl({ start, goal, apiKey });
  const parsedUrl = new URL(requestUrl);

  assert.equal(parsedUrl.searchParams.get("SX"), String(start.lng));
  assert.equal(parsedUrl.searchParams.get("SY"), String(start.lat));
  assert.equal(parsedUrl.searchParams.get("EX"), String(goal.lng));
  assert.equal(parsedUrl.searchParams.get("EY"), String(goal.lat));
  assert.equal(parsedUrl.searchParams.get("apiKey"), apiKey);
  assert.match(requestUrl, /fixture%2Bkey%2Fvalue%3D/);
});

test("normalizeOdsayTransitApiResult parses a successful public transit response", () => {
  const result = normalizeOdsayTransitApiResult({
    id: "LZ_TEST",
    statusCode: 200,
    hasOdsayUriApiKey: true,
    responseJson: {
      result: {
        path: [{
          info: {
            totalTime: 42,
            totalDistance: 12800,
            trafficDistance: 9500,
            totalWalk: 850,
            payment: 1500,
            busTransitCount: 1,
            subwayTransitCount: 0,
            firstStartStation: "천안역",
            lastEndStation: "아산역",
            mapObj: "fixture-map"
          }
        }]
      }
    }
  });

  assert.equal(result.provider, "odsay-public-transit");
  assert.equal(result.apiStatus, "success");
  assert.equal(result.isActualApiValue, true);
  assert.equal(result.durationMinutes, 42);
  assert.equal(result.distanceMeters, 12800);
  assert.equal(result.trafficDistanceMeters, 9500);
  assert.equal(result.walkMeters, 850);
  assert.equal(result.fareKrw, 1500);
  assert.equal(result.busTransitCount, 1);
  assert.equal(result.subwayTransitCount, 0);
  assert.equal(result.firstStartStation, "천안역");
  assert.equal(result.lastEndStation, "아산역");
  assert.equal(result.mapObj, "fixture-map");
});

test("normalizeOdsayTransitApiResult maps ODsay error arrays to errorCode", () => {
  const cases = [
    ["-98", "too close", "ODSAY_TOO_CLOSE"],
    ["-99", "no result", "ODSAY_NO_ROUTE"],
    ["6", "service area", "ODSAY_OUT_OF_SERVICE_AREA"],
    ["500", "[ApiKeyAuthFailed] ApiKey authentication failed.", "ODSAY_AUTH_FAILED"]
  ];

  cases.forEach(([code, message, expectedCode]) => {
    const result = normalizeOdsayTransitApiResult({
      id: "LZ_TEST",
      statusCode: 200,
      hasOdsayUriApiKey: true,
      responseJson: {
        error: [{ code, message }]
      }
    });

    assert.equal(result.apiStatus, "failed");
    assert.equal(result.errorCode, expectedCode);
    assert.equal(result.isActualApiValue, false);
    assert.equal(result.durationMinutes, null);
    assert.equal(result.distanceMeters, null);
  });
});

test("fetchOdsayTransitCommutes returns missing-key failures without calling fetch", async () => {
  let fetchCount = 0;

  const resultByZoneId = await fetchOdsayTransitCommutes({
    start,
    lifeZones,
    apiKey: "",
    fetchImpl: async () => {
      fetchCount += 1;
      throw new Error("must not fetch without key");
    }
  });

  const result = resultByZoneId.get("LZ_TEST");
  assert.equal(fetchCount, 0);
  assert.equal(result.errorCode, "MISSING_ODSAY_URI_KEY");
  assert.equal(result.isActualApiValue, false);
  assert.equal(result.durationMinutes, null);
});

test("fetchOdsayTransitCommutes normalizes success and does not expose the key in diagnostics", async () => {
  clearOdsayTransitRequestCache();
  const apiKey = "fixture+secret/key=";
  let fetchCount = 0;

  const resultByZoneId = await fetchOdsayTransitCommutes({
    start,
    lifeZones,
    apiKey,
    fetchImpl: async (requestUrl) => {
      fetchCount += 1;
      assert.equal(new URL(requestUrl).searchParams.get("apiKey"), apiKey);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            path: [{
              info: {
                totalTime: 31,
                totalDistance: 9000,
                trafficDistance: 7200,
                totalWalk: 430,
                payment: 1600,
                busTransitCount: 1,
                subwayTransitCount: 1
              }
            }]
          }
        })
      };
    }
  });

  const result = resultByZoneId.get("LZ_TEST");
  assert.equal(fetchCount, 1);
  assert.equal(result.isActualApiValue, true);
  assert.equal(result.durationMinutes, 31);
  assert.equal(JSON.stringify(result).includes(apiKey), false);
});

test("applyTransitCommuteResultToTimes keeps failed ODsay results as null duration", () => {
  const applied = applyTransitCommuteResultToTimes(
    { transit: 25, walk: 60 },
    {
      id: "LZ_TEST",
      provider: "odsay-public-transit",
      apiStatus: "failed",
      errorCode: "ODSAY_NO_ROUTE",
      isActualApiValue: false,
      durationMinutes: null,
      distanceMeters: null
    }
  );

  assert.equal(applied.transit, null);
  assert.equal(applied.transitApi.errorCode, "ODSAY_NO_ROUTE");
  assert.equal(applied.transitIsActualApiValue, false);
});
