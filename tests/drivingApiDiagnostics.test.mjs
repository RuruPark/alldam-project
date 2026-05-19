import assert from "node:assert/strict";
import test from "node:test";
import {
  createDrivingCommuteResponse,
  DRIVING_ERROR_CODES
} from "../api/commute/_driving-core.js";

const validStart = { lat: 36.815, lng: 127.108 };
const validGoal = { lat: 36.773, lng: 127.059 };
const validEnv = {
  NAVER_MAP_CLIENT_ID: "client-id",
  NAVER_MAP_CLIENT_SECRET: "client-secret"
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
  assert.equal(JSON.stringify(response.body).includes("client-secret"), false);
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

function createTextResponseFetch(status, body) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  });
}
