import test from "node:test";
import assert from "node:assert/strict";
import {
  buildNaverDirectionsUrl,
  encodeRouteText,
  getRouteModeParam
} from "../src/utils/naverDirectionsUrl.js";

test("buildNaverDirectionsUrl creates a Naver route URL with start and goal coordinates", () => {
  const url = buildNaverDirectionsUrl({
    start: {
      name: "천안시 서북구 불당동",
      lat: 36.815,
      lng: 127.108
    },
    goal: {
      name: "배방읍 생활권",
      lat: 36.773,
      lng: 127.059
    },
    mode: "자동차"
  });

  assert.ok(url.startsWith("https://map.naver.com/index.nhn?"));
  assert.ok(url.includes("menu=route"));
  assert.ok(url.includes("slng=127.108"));
  assert.ok(url.includes("slat=36.815"));
  assert.ok(url.includes("elng=127.059"));
  assert.ok(url.includes("elat=36.773"));
  assert.ok(url.includes(`stext=${encodeURIComponent("천안시 서북구 불당동")}`));
  assert.ok(url.includes(`etext=${encodeURIComponent("배방읍 생활권")}`));
});

test("buildNaverDirectionsUrl returns null when coordinates are missing", () => {
  assert.equal(buildNaverDirectionsUrl({
    start: { name: "직장", lat: 36.8 },
    goal: { name: "생활권", lat: 36.7, lng: 127.1 }
  }), null);
});

test("buildNaverDirectionsUrl accepts centerLat and centerLng coordinates", () => {
  const url = buildNaverDirectionsUrl({
    start: { name: "직장", centerLat: 36.8, centerLng: 127.1 },
    goal: { name: "생활권", centerLat: 36.7, centerLng: 127.2 }
  });

  assert.ok(url.includes("slng=127.1"));
  assert.ok(url.includes("slat=36.8"));
  assert.ok(url.includes("elng=127.2"));
  assert.ok(url.includes("elat=36.7"));
});

test("Naver directions URL never includes client secret values", () => {
  const url = buildNaverDirectionsUrl({
    start: { name: "직장", lat: 36.8, lng: 127.1 },
    goal: { name: "생활권", lat: 36.7, lng: 127.2 },
    mode: "도보"
  });

  assert.equal(url.includes("NAVER_MAP_CLIENT_SECRET"), false);
  assert.equal(url.includes("clientSecret"), false);
});

test("encodeRouteText and route mode mapping are safe for display labels", () => {
  assert.equal(encodeRouteText("천안 아산"), encodeURIComponent("천안 아산"));
  assert.equal(getRouteModeParam("자동차"), "0");
  assert.equal(getRouteModeParam("대중교통"), "1");
  assert.equal(getRouteModeParam("도보"), "2");
  assert.equal(getRouteModeParam("아직 모름"), "");
});
