import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNaverDirectionsRequestUrl,
  createDrivingBatchResponse,
  createDrivingCommuteResponse,
  DEFAULT_NAVER_DIRECTIONS_BASE_URL,
  DRIVING_ERROR_CODES
} from "../api/commute/_driving-core.js";

const validStart = { lat: 36.815, lng: 127.108 };
const validGoal = { lat: 36.773, lng: 127.059 };
const validEnv = {
  NAVER_MAP_CLIENT_ID: "client-id",
  NAVER_MAP_CLIENT_SECRET: "client-secret",
  NAVER_DIRECTIONS_BASE_URL: DEFAULT_NAVER_DIRECTIONS_BASE_URL
};

test("missing env returns safe diagnostics without fallback duration", async () => {
  const response = await createDrivingCommuteResponse({
    start: validStart,
    goal: validGoal,
    env: {}
  });

  assert.equal(response.body.errorCode, DRIVING_ERROR_CODES.MISSING_NAVER_ENV);
  assert.equal(response.body.durationMinutes, null);
  assert.equal(response.body.distanceMeters, null);
  assert.equal(response.body.isActualApiValue, false);
  assert.equal(response.body.diagnostics.hasClientId, false);
  assert.equal(response.body.diagnostics.hasClientSecret, false);
  assert.equal(response.body.diagnostics.hasDirectionsBaseUrl, false);
  assert.equal(JSON.stringify(response.body).includes("client-secret"), false);
});

test("blank directions base URL returns missing env", async () => {
  const response = await createDrivingCommuteResponse({
    start: validStart,
    goal: validGoal,
    env: {
      NAVER_MAP_CLIENT_ID: "client-id",
      NAVER_MAP_CLIENT_SECRET: "client-secret",
      NAVER_DIRECTIONS_BASE_URL: ""
    }
  });

  assert.equal(response.body.errorCode, DRIVING_ERROR_CODES.MISSING_NAVER_ENV);
  assert.equal(response.body.diagnostics.hasClientId, true);
  assert.equal(response.body.diagnostics.hasClientSecret, true);
  assert.equal(response.body.diagnostics.hasDirectionsBaseUrl, false);
});

test("request URL uses longitude,latitude once for start and goal", () => {
  const requestUrl = buildNaverDirectionsRequestUrl({
    baseUrl: DEFAULT_NAVER_DIRECTIONS_BASE_URL,
    start: validStart,
    goal: validGoal
  });
  const url = new URL(requestUrl);

  assert.equal(url.searchParams.get("start"), "127.108,36.815");
  assert.equal(url.searchParams.get("goal"), "127.059,36.773");
  assert.equal(url.searchParams.getAll("start").length, 1);
  assert.equal(url.searchParams.getAll("goal").length, 1);
});

test("naver 401 maps to unauthorized without exposing secret", async () => {
  const response = await createDrivingCommuteResponse({
    start: validStart,
    goal: validGoal,
    env: validEnv,
    fetchImpl: createTextResponseFetch(401, { error: { errorCode: "401", message: "Unauthorized" } })
  });

  assert.equal(response.body.errorCode, DRIVING_ERROR_CODES.NAVER_DIRECTIONS_UNAUTHORIZED);
  assert.equal(response.body.durationMinutes, null);
  assert.equal(response.body.isActualApiValue, false);
  assert.equal(response.body.diagnostics.naverStatusCode, 401);
  assert.equal(JSON.stringify(response.body).includes("client-secret"), false);
});

test("naver 403 maps to forbidden", async () => {
  const response = await createDrivingCommuteResponse({
    start: validStart,
    goal: validGoal,
    env: validEnv,
    fetchImpl: createTextResponseFetch(403, { message: "Forbidden" })
  });

  assert.equal(response.body.errorCode, DRIVING_ERROR_CODES.NAVER_DIRECTIONS_FORBIDDEN);
  assert.equal(response.body.durationMinutes, null);
  assert.equal(response.body.distanceMeters, null);
});

test("naver 429 maps to rate limited", async () => {
  const response = await createDrivingCommuteResponse({
    start: validStart,
    goal: validGoal,
    env: validEnv,
    fetchImpl: createTextResponseFetch(429, { message: "Too many requests" })
  });

  assert.equal(response.body.errorCode, DRIVING_ERROR_CODES.NAVER_DIRECTIONS_RATE_LIMITED);
  assert.equal(response.body.durationMinutes, null);
});

test("route-less response returns no route", async () => {
  const response = await createDrivingCommuteResponse({
    start: validStart,
    goal: validGoal,
    env: validEnv,
    fetchImpl: createTextResponseFetch(200, { route: {} })
  });

  assert.equal(response.body.errorCode, DRIVING_ERROR_CODES.NAVER_DIRECTIONS_NO_ROUTE);
  assert.equal(response.body.durationMinutes, null);
});

test("unparseable route duration returns parse failure", async () => {
  const response = await createDrivingCommuteResponse({
    start: validStart,
    goal: validGoal,
    env: validEnv,
    fetchImpl: createTextResponseFetch(200, {
      route: {
        trafast: [
          {
            summary: {
              duration: "not-a-number",
              distance: 12340
            }
          }
        ]
      }
    })
  });

  assert.equal(response.body.errorCode, DRIVING_ERROR_CODES.NAVER_DIRECTIONS_PARSE_FAILED);
  assert.equal(response.body.durationMinutes, null);
});

test("successful response marks actual API value", async () => {
  const response = await createDrivingCommuteResponse({
    start: validStart,
    goal: validGoal,
    env: validEnv,
    fetchImpl: createTextResponseFetch(200, {
      route: {
        trafast: [
          {
            summary: {
              duration: 28 * 60 * 1000,
              distance: 12340
            }
          }
        ]
      }
    })
  });

  assert.equal(response.body.apiStatus, "success");
  assert.equal(response.body.isActualApiValue, true);
  assert.equal(response.body.durationMinutes, 28);
  assert.equal(response.body.distanceMeters, 12340);
});

test("batch response keeps serverless result shape per life zone", async () => {
  const response = await createDrivingBatchResponse({
    start: validStart,
    goals: [
      { id: "zone-a", lat: 36.77, lng: 127.05 },
      { id: "zone-b", lat: 36.78, lng: 127.06 }
    ],
    env: validEnv,
    fetchImpl: createTextResponseFetch(200, {
      route: {
        trafast: [
          {
            summary: {
              duration: 20 * 60 * 1000,
              distance: 9000
            }
          }
        ]
      }
    })
  });

  assert.equal(response.body.apiStatus, "success");
  assert.equal(response.body.results.length, 2);
  assert.equal(response.body.results[0].id, "zone-a");
  assert.equal(response.body.results[0].durationMinutes, 20);
  assert.equal(response.body.results[0].isActualApiValue, true);
});

function createTextResponseFetch(status, body) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  });
}
