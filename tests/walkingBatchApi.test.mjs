import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTmapPedestrianRequestUrl,
  createTmapPedestrianRequestBody,
  createWalkingBatchResponse,
  createWalkingCommuteResponse,
  mapTmapBodyErrorToErrorCode,
  mapTmapHttpStatusToErrorCode,
  parseTmapPedestrianPayload,
  resolveTmapWalkingEnv,
  TMAP_WALK_ERROR_CODES
} from "../api/commute/walking-batch.js";

const env = {
  TMAP_PEDESTRIAN_BASE_URL: "https://apis.openapi.sk.com/tmap/routes/pedestrian",
  TMAP_PEDESTRIAN_APP_KEY: "fixture-tmap-app-key"
};

const start = {
  lat: 36.815,
  lng: 127.108,
  name: "출발지"
};

const goal = {
  id: "LZ_TEST",
  lat: 36.773,
  lng: 127.059,
  name: "도착지"
};

test("walking-batch reports missing TMAP environment without exposing appKey", async () => {
  const result = await createWalkingBatchResponse({
    start,
    goals: [goal],
    env: {},
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    }
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.results[0].errorCode, TMAP_WALK_ERROR_CODES.MISSING_TMAP_WALK_ENV);
  assert.equal(result.body.results[0].durationMinutes, null);
  assert.equal(result.body.results[0].distanceMeters, null);
  assert.equal(result.body.diagnostics.hasTmapAppKey, false);
  assert.equal(result.body.diagnostics.hasWalkingBaseUrl, false);
  assert.equal(JSON.stringify(result.body).includes("fixture-tmap-app-key"), false);
});

test("walking-batch reads the canonical TMAP appKey env with trimming and safe diagnostics", async () => {
  let fetchCalled = false;
  const result = await createWalkingCommuteResponse({
    start,
    goal,
    env: {
      TMAP_PEDESTRIAN_BASE_URL: env.TMAP_PEDESTRIAN_BASE_URL,
      TMAP_PEDESTRIAN_APP_KEY: `  ${env.TMAP_PEDESTRIAN_APP_KEY}  `
    },
    fetchImpl: async () => {
      fetchCalled = true;
      return createJsonResponse(200, {
        features: [{
          properties: {
            totalTime: 600,
            totalDistance: 800
          }
        }]
      });
    }
  });

  assert.equal(fetchCalled, true);
  assert.equal(result.body.apiStatus, "success");
  assert.equal(result.body.diagnostics.hasTmapAppKey, true);
  assert.equal(result.body.diagnostics.tmapAppKeyEnvName, "TMAP_PEDESTRIAN_APP_KEY");
  assert.equal(JSON.stringify(result.body).includes(env.TMAP_PEDESTRIAN_APP_KEY), false);
});

test("walking-batch can diagnose the allowed TMAP appKey alias without exposing the value", async () => {
  const resolvedEnv = resolveTmapWalkingEnv({
    TMAP_PEDESTRIAN_BASE_URL: env.TMAP_PEDESTRIAN_BASE_URL,
    TMAP_PEDESTRIAN_APP_KEY: "   ",
    TMAP_APP_KEY: "  alias-tmap-key  "
  });

  assert.equal(resolvedEnv.appKey, "alias-tmap-key");
  assert.equal(resolvedEnv.appKeyEnvName, "TMAP_APP_KEY");

  const result = await createWalkingCommuteResponse({
    start,
    goal,
    env: {
      TMAP_PEDESTRIAN_BASE_URL: env.TMAP_PEDESTRIAN_BASE_URL,
      TMAP_APP_KEY: "alias-tmap-key"
    },
    fetchImpl: async () => createJsonResponse(200, {
      features: [{
        properties: {
          totalTime: 900,
          totalDistance: 1200
        }
      }]
    })
  });

  assert.equal(result.body.apiStatus, "success");
  assert.equal(result.body.diagnostics.tmapAppKeyEnvName, "TMAP_APP_KEY");
  assert.equal(JSON.stringify(result.body).includes("alias-tmap-key"), false);
});

test("walking-batch treats blank appKey as missing and does not call TMAP upstream", async () => {
  let fetchCalled = false;
  const result = await createWalkingCommuteResponse({
    start,
    goal,
    env: {
      TMAP_PEDESTRIAN_BASE_URL: env.TMAP_PEDESTRIAN_BASE_URL,
      TMAP_PEDESTRIAN_APP_KEY: "   "
    },
    fetchImpl: async () => {
      fetchCalled = true;
      return createJsonResponse(200, {});
    }
  });

  assert.equal(fetchCalled, false);
  assert.equal(result.body.errorCode, TMAP_WALK_ERROR_CODES.MISSING_TMAP_WALK_ENV);
  assert.equal(result.body.diagnostics.hasWalkingBaseUrl, true);
  assert.equal(result.body.diagnostics.hasTmapAppKey, false);
  assert.equal(result.body.diagnostics.tmapAppKeyEnvName, undefined);
});

test("walking-batch calls TMAP pedestrian endpoint with header appKey and lng/lat body", async () => {
  let capturedUrl = "";
  let capturedOptions = null;
  const result = await createWalkingBatchResponse({
    start,
    goals: [goal],
    env,
    fetchImpl: async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return createJsonResponse(200, {
        features: [{
          properties: {
            totalTime: 1680,
            totalDistance: 2100
          }
        }]
      });
    }
  });
  const requestBody = JSON.parse(capturedOptions.body);

  assert.equal(capturedUrl, "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1");
  assert.equal(capturedOptions.method, "POST");
  assert.equal(capturedOptions.headers.appKey, env.TMAP_PEDESTRIAN_APP_KEY);
  assert.equal(capturedOptions.headers.Accept, "application/json");
  assert.equal(capturedOptions.headers["Content-Type"], "application/json");
  assert.equal(requestBody.startX, String(start.lng));
  assert.equal(requestBody.startY, String(start.lat));
  assert.equal(requestBody.endX, String(goal.lng));
  assert.equal(requestBody.endY, String(goal.lat));
  assert.equal(requestBody.reqCoordType, "WGS84GEO");
  assert.equal(requestBody.resCoordType, "WGS84GEO");
  assert.equal(result.body.results[0].apiStatus, "success");
  assert.equal(result.body.results[0].durationMinutes, 28);
  assert.equal(result.body.results[0].distanceMeters, 2100);
  assert.equal(result.body.results[0].diagnostics.candidateId, "LZ_TEST");
  assert.equal(result.body.results[0].diagnostics.hasValidStartCoordinates, true);
  assert.equal(result.body.results[0].diagnostics.hasValidGoalCoordinates, true);
  assert.equal(result.body.results[0].diagnostics.selectedDurationSource, "features.properties.totalTime");
  assert.equal(result.body.results[0].diagnostics.totalTimeRawType, "number");
  assert.equal(JSON.stringify(result.body).includes(env.TMAP_PEDESTRIAN_APP_KEY), false);
});

test("TMAP request helpers append version and encode names", () => {
  assert.equal(
    buildTmapPedestrianRequestUrl("https://apis.openapi.sk.com/tmap/routes/pedestrian"),
    "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1"
  );

  const body = createTmapPedestrianRequestBody({ start, goal });
  assert.equal(body.startName, encodeURIComponent(start.name));
  assert.equal(body.endName, encodeURIComponent(goal.name));
  assert.equal(body.searchOption, "0");
});

test("TMAP payload parser converts totalTime seconds to minutes", () => {
  const parsed = parseTmapPedestrianPayload({
    features: [{
      properties: {
        totalTime: "61",
        totalDistance: "870"
      }
    }]
  });

  assert.equal(parsed.durationMinutes, 2);
  assert.equal(parsed.distanceMeters, 870);
  assert.equal(parsed.diagnostics.hasTotalTime, true);
  assert.equal(parsed.diagnostics.hasTotalDistance, true);
});

test("TMAP payload parser uses a distance fallback from another feature", () => {
  const parsed = parseTmapPedestrianPayload({
    features: [
      {
        properties: {
          totalTime: "120"
        }
      },
      {
        properties: {
          totalDistance: "350"
        }
      }
    ]
  });

  assert.equal(parsed.durationMinutes, 2);
  assert.equal(parsed.distanceMeters, 350);
  assert.equal(parsed.diagnostics.hasTotalDistance, true);
});

test("TMAP payload parser fails safely when features or totalTime are missing", () => {
  assert.equal(
    parseTmapPedestrianPayload({}).errorCode,
    TMAP_WALK_ERROR_CODES.TMAP_WALK_PARSE_FAILED
  );
  assert.equal(
    parseTmapPedestrianPayload({ features: [{ properties: { totalDistance: 100 } }] }).errorCode,
    TMAP_WALK_ERROR_CODES.TMAP_WALK_PARSE_FAILED
  );
  assert.equal(
    parseTmapPedestrianPayload({ features: [{ properties: { totalTime: 0, totalDistance: 100 } }] }).errorCode,
    TMAP_WALK_ERROR_CODES.TMAP_WALK_PARSE_FAILED
  );
});

test("walking-batch maps TMAP HTTP status codes", () => {
  assert.equal(mapTmapHttpStatusToErrorCode(401), TMAP_WALK_ERROR_CODES.TMAP_WALK_AUTH_FAILED);
  assert.equal(mapTmapHttpStatusToErrorCode(403), TMAP_WALK_ERROR_CODES.TMAP_WALK_FORBIDDEN);
  assert.equal(mapTmapHttpStatusToErrorCode(429), TMAP_WALK_ERROR_CODES.TMAP_WALK_RATE_LIMITED);
  assert.equal(mapTmapHttpStatusToErrorCode(404), TMAP_WALK_ERROR_CODES.TMAP_WALK_NO_ROUTE);
});

test("walking-batch maps TMAP body errors even when HTTP status is 200", async () => {
  const bodyError = {
    error: {
      code: "401",
      message: "invalid appKey"
    }
  };
  const result = await createWalkingCommuteResponse({
    start,
    goal,
    env,
    fetchImpl: async () => createJsonResponse(200, bodyError)
  });

  assert.equal(mapTmapBodyErrorToErrorCode(bodyError), TMAP_WALK_ERROR_CODES.TMAP_WALK_AUTH_FAILED);
  assert.equal(result.body.errorCode, TMAP_WALK_ERROR_CODES.TMAP_WALK_AUTH_FAILED);
  assert.equal(result.body.durationMinutes, null);
});

test("walking-batch rejects invalid coordinates without calling TMAP", async () => {
  let fetchCalled = false;
  const result = await createWalkingCommuteResponse({
    start,
    goal: { id: "bad", lat: undefined, lng: NaN },
    env,
    fetchImpl: async () => {
      fetchCalled = true;
      return createJsonResponse(200, {});
    }
  });

  assert.equal(fetchCalled, false);
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.errorCode, TMAP_WALK_ERROR_CODES.TMAP_WALK_INVALID_COORDINATES);
  assert.equal(result.body.durationMinutes, null);
});

test("walking-batch redacts appKey if an upstream error message echoes it", async () => {
  const result = await createWalkingCommuteResponse({
    start,
    goal,
    env,
    fetchImpl: async () => createJsonResponse(401, {
      error: {
        code: "401",
        message: `invalid appKey ${env.TMAP_PEDESTRIAN_APP_KEY}`
      }
    })
  });
  const serialized = JSON.stringify(result.body);

  assert.equal(result.body.errorCode, TMAP_WALK_ERROR_CODES.TMAP_WALK_AUTH_FAILED);
  assert.equal(serialized.includes(env.TMAP_PEDESTRIAN_APP_KEY), false);
  assert.equal(result.body.diagnostics.tmapErrorMessage.includes("[redacted]"), true);
});

function createJsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload)
  };
}
