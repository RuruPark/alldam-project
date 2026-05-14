import { getLifeZoneDataset } from "../data/lifeZoneRepository.js";
import {
  assignRelativeGrades,
  calculateLifeZoneScores,
  getTopAndLowZones
} from "../utils/lifeZoneScoring.js";

const DEFAULT_PREFERENCES = {
  transportImportance: "medium",
  cultureSportsImportance: "medium",
  safetyMedicalImportance: "medium"
};

const IMPORTANCE_OPTIONS = [
  { value: "low", label: "낮음", description: "중요도 낮음" },
  { value: "medium", label: "보통", description: "보통" },
  { value: "high", label: "높음", description: "높음" }
];

const AXES = [
  {
    id: "transport",
    tabLabel: "대중교통",
    name: "대중교통 중요도",
    axisLabel: "교통 인프라 축",
    preferenceKey: "transportImportance",
    description: "출퇴근, 통학, 외출처럼 일상 이동 편의를 얼마나 중요하게 보는지 선택하세요.",
    icon: "🚉"
  },
  {
    id: "living",
    tabLabel: "문화·체육",
    name: "문화·체육 중요도",
    axisLabel: "생활 편의 인프라 축",
    preferenceKey: "cultureSportsImportance",
    description: "문화생활과 운동, 여가를 누리기 좋은 생활 환경을 얼마나 중요하게 보는지 선택하세요.",
    icon: "📚"
  },
  {
    id: "safetyMedical",
    tabLabel: "치안·의료",
    name: "치안·의료 중요도",
    axisLabel: "치안·의료 인프라 축",
    preferenceKey: "safetyMedicalImportance",
    description: "안전하게 생활하고 필요한 의료 도움을 받기 쉬운 환경을 얼마나 중요하게 보는지 선택하세요.",
    icon: "🚨"
  }
];

const MAP_FILTERS = [
  { id: "transport", label: "교통" },
  { id: "living", label: "문화·체육" },
  { id: "safetyMedical", label: "치안·의료" }
];

const MAP_BOUNDS = {
  minLat: 36.74,
  maxLat: 36.95,
  minLng: 126.96,
  maxLng: 127.18
};

const state = {
  view: "preferences",
  activeTab: "transport",
  activeMapFilter: "transport",
  preferences: { ...DEFAULT_PREFERENCES },
  scoredZones: [],
  resultBundle: null,
  selectedZoneId: null
};

let appRoot = null;
const lifeZoneDataset = getLifeZoneDataset();

export function initLifeZoneApp(root) {
  appRoot = root;

  if (!appRoot) return;
  render();
}

function render() {
  if (!appRoot) return;

  appRoot.innerHTML = state.view === "results" ? renderResultScreen() : renderPreferenceScreen();
  if (state.view === "results") {
    bindResultEvents();
    syncSelectedCardIntoView();
  } else {
    bindPreferenceEvents();
  }
}

function renderPreferenceScreen() {
  const activeAxis = AXES.find((axis) => axis.id === state.activeTab) ?? AXES[0];
  const activeImportance = state.preferences[activeAxis.preferenceKey];

  return `
    <main class="preference-screen">
      <section class="preference-workspace" aria-labelledby="preference-title">
        <div class="preference-copy">
          <p class="eyebrow">Cheonan · Asan Life Zone</p>
          <h1 id="preference-title">생활권 추천 조건 설정</h1>
          <p class="intro">중요하게 생각하는 생활 조건을 선택하면 천안·아산 생활권 적합도를 계산합니다.</p>
        </div>

        <div class="axis-tabs" role="tablist" aria-label="추천 조건 카테고리">
          ${AXES.map((axis) => `
            <button
              class="axis-tab ${axis.id === state.activeTab ? "is-active" : ""}"
              id="tab-${axis.id}"
              type="button"
              role="tab"
              aria-selected="${axis.id === state.activeTab}"
              aria-controls="panel-${axis.id}"
              data-tab="${axis.id}"
            >
              <span aria-hidden="true">${axis.icon}</span>
              ${axis.tabLabel}
            </button>
          `).join("")}
        </div>

        <section
          class="preference-panel"
          id="panel-${activeAxis.id}"
          role="tabpanel"
          aria-labelledby="tab-${activeAxis.id}"
        >
          <div class="axis-heading">
            <div>
              <p class="axis-kicker">${activeAxis.axisLabel}</p>
              <h2>${activeAxis.name}</h2>
              <p>${activeAxis.description}</p>
            </div>
          </div>

          <div class="importance-segments" role="radiogroup" aria-label="${activeAxis.name} 선택">
            ${IMPORTANCE_OPTIONS.map((option) => `
              <button
                class="segment-button ${activeImportance === option.value ? "is-selected" : ""}"
                type="button"
                role="radio"
                aria-checked="${activeImportance === option.value}"
                aria-label="${activeAxis.tabLabel} ${option.description}"
                data-importance="${option.value}"
                data-axis="${activeAxis.id}"
              >
                ${option.label}
              </button>
            `).join("")}
          </div>
        </section>
      </section>

      <footer class="preference-cta" aria-label="생활권 점수 계산">
        <p>입력한 중요도를 기준으로 추천 2개, 보완 필요 1개 생활권을 보여줍니다.</p>
        <button class="primary-cta" type="button" data-calculate aria-label="생활권 점수 계산하기">
          생활권 점수 계산하기
        </button>
      </footer>
    </main>
  `;
}

function renderResultScreen() {
  const bundle = state.resultBundle ?? {
    recommendedZones: [],
    lowZone: null,
    displayZones: []
  };
  const displayZones = bundle.displayZones;
  const selectedZone = displayZones.find((zone) => zone.id === state.selectedZoneId) ?? displayZones[0] ?? null;

  return `
    <main class="result-screen">
      <section class="map-view" aria-label="생활권 결과 지도">
        <div class="map-toolbar">
          <label class="map-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="지역, 역, 학교 검색" aria-label="지역, 역, 학교 검색" />
          </label>
          <div class="map-filters" aria-label="지도 인프라 필터">
            ${MAP_FILTERS.map((filter) => `
              <button
                class="map-filter ${state.activeMapFilter === filter.id ? "is-active" : ""}"
                type="button"
                aria-pressed="${state.activeMapFilter === filter.id}"
                data-map-filter="${filter.id}"
              >
                ${filter.label}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="mock-map" role="region" aria-label="천안·아산 생활권 추천 위치 지도">
          <p class="sr-only">추천 생활권과 보완 필요 생활권의 위치를 지도형 배경 위에 버튼 마커로 표시합니다.</p>
          <svg class="rail-overlay" viewBox="0 0 100 100" aria-hidden="true">
            <path class="rail-line" d="M10 84 C24 67 39 61 50 48 S72 27 90 15" />
            <text x="12" y="80">1호선 접근축</text>
          </svg>
          <div class="city-label cheonan">천안 생활권</div>
          <div class="city-label asan">아산 생활권</div>
          <div class="map-grid-line horizontal"></div>
          <div class="map-grid-line vertical"></div>
          ${displayZones.length === 0 ? renderMapEmptyState() : displayZones.map((zone) => renderMapMarker(zone, selectedZone?.id)).join("")}
        </div>
      </section>

      <aside class="result-panel" aria-label="생활권 추천 결과">
        <div class="panel-header">
          <div>
            <p class="eyebrow">선호도 기반 적합도 계산</p>
            <h1>생활권 추천 결과</h1>
          <p>입력한 중요도를 기준으로 계산한 결과입니다.</p>
          <small class="data-source-label">${lifeZoneDataset.sourceLabel}</small>
          </div>
          <button class="secondary-button" type="button" data-reset-preferences aria-label="선호도 다시 설정">
            선호도 다시 설정
          </button>
        </div>

        <section class="preference-readout" aria-label="사용자 프로필 및 선호도 요약">
          <h2>사용자 선호도 요약</h2>
          <div class="readout-grid">
            ${AXES.map((axis) => `
              <div>
                <span>${axis.tabLabel}</span>
                <strong>${getImportanceLabel(state.preferences[axis.preferenceKey])}</strong>
              </div>
            `).join("")}
          </div>
        </section>

        <div class="result-count">추천 ${bundle.recommendedZones.length}개 · 보완 필요 ${bundle.lowZone ? 1 : 0}개</div>

        <section class="zone-card-list" role="listbox" aria-label="생활권 결과 목록">
          ${displayZones.length === 0 ? renderPanelEmptyState() : displayZones.map((zone) => renderResultCard(zone, selectedZone?.id)).join("")}
        </section>
      </aside>
    </main>
  `;
}

function renderMapMarker(zone, selectedZoneId) {
  const position = getMapPosition(zone);
  const selected = zone.id === selectedZoneId;
  const markerClass = zone.rankType === "low" ? "is-low" : "is-recommended";
  const label = zone.rankType === "low" ? "LOW 1" : `TOP ${zone.rank}`;

  return `
    <button
      class="map-marker ${markerClass} ${selected ? "is-selected" : ""}"
      style="left: ${position.x}%; top: ${position.y}%;"
      type="button"
      data-zone-id="${zone.id}"
      aria-label="${zone.rankLabel} ${zone.name} 지도 마커"
      aria-pressed="${selected}"
    >
      <span class="marker-pin">${label}</span>
      <span class="marker-name">${zone.eupMyeonDong}</span>
      <span class="marker-icons" aria-hidden="true">${getInfraIcons(zone, state.activeMapFilter).join("")}</span>
    </button>
  `;
}

function renderResultCard(zone, selectedZoneId) {
  const selected = zone.id === selectedZoneId;
  const cardClass = zone.rankType === "low" ? "is-low" : "is-recommended";

  return `
    <article
      class="zone-card ${cardClass} ${selected ? "is-selected" : ""}"
      role="option"
      tabindex="0"
      data-zone-id="${zone.id}"
      aria-selected="${selected}"
      aria-label="${zone.rankLabel} ${zone.name} 결과 카드"
    >
      <span class="rank-label">${zone.rankLabel}</span>
      <div class="card-title-row">
        <div>
          <h3>${zone.name}</h3>
          <p>${getZoneDescription(zone)}</p>
        </div>
        <div class="score-badge">
          <strong>${zone.totalScore.toFixed(1)}</strong>
          <span>점</span>
        </div>
      </div>

      <div class="grade-row">
        <span>상대등급 <strong>${zone.grade}</strong></span>
        <span>${zone.gradeLabel}</span>
      </div>

      <div class="axis-score-list">
        ${renderAxisScore("교통", zone.axisScores.transport)}
        ${renderAxisScore("생활 편의", zone.axisScores.living)}
        ${renderAxisScore("치안·의료", zone.axisScores.safetyMedical)}
      </div>

      <div class="reason-block">
        <strong>${zone.rankType === "low" ? "확인할 점" : "추천 이유"}</strong>
        <p>${zone.rankType === "low" ? getZoneWeaknesses(zone)[0] : getZoneStrengths(zone)[0]}</p>
      </div>

      <div class="tag-row" aria-label="주요 인프라 태그">
        ${getZoneTags(zone).map((tag) => `<span>${tag}</span>`).join("")}
      </div>

      <div class="strength-row">
        <span>강점: ${getZoneStrengths(zone).slice(0, 2).join(" · ")}</span>
        <span>부족한 점: ${getZoneWeaknesses(zone)[0]}</span>
      </div>
    </article>
  `;
}

function renderAxisScore(label, value) {
  return `
    <div class="axis-score">
      <span>${label}</span>
      <strong>${value.toFixed(1)}</strong>
      <div class="mini-track"><span style="width: ${value}%"></span></div>
    </div>
  `;
}

function renderMapEmptyState() {
  return `
    <div class="map-empty">
      <strong>표시할 생활권 데이터가 없습니다.</strong>
      <span>공공데이터 전처리 결과를 연결하면 같은 구조로 표시됩니다.</span>
    </div>
  `;
}

function renderPanelEmptyState() {
  return `
    <div class="panel-empty">
      <strong>계산 가능한 생활권이 없습니다.</strong>
      <p>생활권 데이터가 3개 미만이면 가능한 결과만 표시합니다.</p>
    </div>
  `;
}

function bindPreferenceEvents() {
  appRoot.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      render();
    });
    button.addEventListener("keydown", (event) => {
      const direction = getHorizontalKeyDirection(event);
      if (!direction && event.key !== "Home" && event.key !== "End") return;

      event.preventDefault();
      const currentIndex = AXES.findIndex((axis) => axis.id === state.activeTab);
      let nextIndex = currentIndex;

      if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = AXES.length - 1;
      else nextIndex = (currentIndex + direction + AXES.length) % AXES.length;

      state.activeTab = AXES[nextIndex].id;
      render();
      focusAfterRender(`[data-tab="${state.activeTab}"]`);
    });
  });

  appRoot.querySelectorAll("[data-importance]").forEach((button) => {
    button.addEventListener("click", () => {
      const axis = AXES.find((axisItem) => axisItem.id === button.dataset.axis);
      if (!axis) return;
      state.preferences = {
        ...state.preferences,
        [axis.preferenceKey]: button.dataset.importance
      };
      render();
    });
    button.addEventListener("keydown", (event) => {
      const direction = getHorizontalKeyDirection(event);
      if (!direction) return;

      event.preventDefault();
      const axis = AXES.find((axisItem) => axisItem.id === button.dataset.axis);
      if (!axis) return;

      const currentImportance = state.preferences[axis.preferenceKey];
      const currentIndex = IMPORTANCE_OPTIONS.findIndex((option) => option.value === currentImportance);
      const nextIndex = (currentIndex + direction + IMPORTANCE_OPTIONS.length) % IMPORTANCE_OPTIONS.length;

      state.preferences = {
        ...state.preferences,
        [axis.preferenceKey]: IMPORTANCE_OPTIONS[nextIndex].value
      };
      render();
      focusAfterRender(`[data-axis="${axis.id}"][data-importance="${IMPORTANCE_OPTIONS[nextIndex].value}"]`);
    });
  });

  appRoot.querySelector("[data-calculate]")?.addEventListener("click", () => {
    const scoredZones = calculateLifeZoneScores(lifeZoneDataset.lifeZones, state.preferences);
    const gradedZones = assignRelativeGrades(scoredZones);
    const resultBundle = getTopAndLowZones(gradedZones);

    state.scoredZones = gradedZones;
    state.resultBundle = resultBundle;
    state.selectedZoneId = resultBundle.displayZones[0]?.id ?? null;
    state.view = "results";
    render();
  });
}

function bindResultEvents() {
  appRoot.querySelector("[data-reset-preferences]")?.addEventListener("click", () => {
    state.view = "preferences";
    state.activeTab = "transport";
    state.selectedZoneId = null;
    render();
  });

  appRoot.querySelectorAll("[data-zone-id]").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedZoneId = element.dataset.zoneId;
      render();
    });
    element.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      state.selectedZoneId = element.dataset.zoneId;
      render();
    });
  });

  appRoot.querySelectorAll("[data-map-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeMapFilter = button.dataset.mapFilter;
      render();
    });
  });
}

function getImportanceLabel(importance) {
  return IMPORTANCE_OPTIONS.find((option) => option.value === importance)?.label ?? "보통";
}

function getHorizontalKeyDirection(event) {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") return 1;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") return -1;
  return 0;
}

function focusAfterRender(selector) {
  requestAnimationFrame(() => {
    appRoot?.querySelector(selector)?.focus();
  });
}

function syncSelectedCardIntoView() {
  requestAnimationFrame(() => {
    appRoot?.querySelector(".zone-card.is-selected")?.scrollIntoView({
      block: "nearest",
      behavior: "smooth"
    });
  });
}

function getZoneDescription(zone) {
  return simplifyUserFacingReason(zone.description || `${zone.city} ${zone.eupMyeonDong} 생활권의 생활 조건을 비교했습니다.`);
}

function getZoneStrengths(zone) {
  const fallback = ["입력 조건에 잘 맞는 생활 환경을 갖춘 편입니다."];
  const strengths = Array.isArray(zone.strengths) && zone.strengths.length > 0 ? zone.strengths : fallback;
  return strengths.map(simplifyUserFacingReason);
}

function getZoneWeaknesses(zone) {
  const fallback = ["실제 생활 계획에 맞춰 추가 확인이 필요합니다."];
  const weaknesses = Array.isArray(zone.weaknesses) && zone.weaknesses.length > 0 ? zone.weaknesses : fallback;
  return weaknesses.map(simplifyUserFacingReason);
}

function getZoneTags(zone) {
  return Array.isArray(zone.tags) && zone.tags.length > 0
    ? zone.tags
    : ["생활권 비교", "데이터 보완 예정"];
}

function simplifyUserFacingReason(text) {
  return String(text)
    .replace(/버스·철도 접근성이 함께 확보됨/g, "대중교통 이용이 편리한 편입니다")
    .replace(/도서관과 약국 접근성이 안정적/g, "일상생활에 필요한 시설을 이용하기 좋습니다")
    .replace(/철도와 버스 접근성이 매우 좋음/g, "대중교통 선택지가 많은 편입니다")
    .replace(/체육 인프라 접근성은 상대적으로 낮음/g, "운동·여가 생활은 추가 확인이 필요합니다")
    .replace(/버스 접근성과 치안 시설 접근성이 좋음/g, "이동과 안전 생활 조건이 안정적인 편입니다")
    .replace(/체육 인프라가 비교적 가까움/g, "운동·여가 생활을 누리기 좋은 편입니다")
    .replace(/철도 접근성은 중심역 생활권보다 낮음/g, "광역 이동은 생활 동선에 맞춰 확인이 필요합니다")
    .replace(/공공·작은도서관 접근성이 함께 확보됨/g, "문화생활을 누리기 좋은 편입니다")
    .replace(/비상벨 밀도는 도심권 대비 낮음/g, "야간 생활 안전감은 현장 확인이 필요합니다")
    .replace(/1호선 접근성이 높음/g, "1호선 이용이 편리한 편입니다")
    .replace(/약국과 공공 안전시설 접근성이 우수/g, "생활 안전과 의료 이용 여건이 좋은 편입니다")
    .replace(/철도 접근성과 체육 인프라 접근성이 안정적/g, "이동과 여가 생활의 균형이 좋은 편입니다")
    .replace(/넓은 면적 때문에 밀도 지표는 일부 낮게 산정될 수 있음/g, "생활권이 넓어 동네별 체감 차이가 있을 수 있습니다")
    .replace(/버스 접근성은 기본 수준 이상/g, "기본적인 대중교통 이용은 가능한 편입니다")
    .replace(/체육 인프라와 공공안전 접근성 보완 필요/g, "여가와 안전 생활 조건은 추가 확인이 필요합니다")
    .replace(/철도·문화·공공안전 접근성 보완 필요/g, "이동, 여가, 안전 생활 조건은 추가 확인이 필요합니다")
    .replace(/접근성/g, "이용 편의")
    .replace(/밀도/g, "분포")
    .replace(/지표/g, "조건");
}

function getMapPosition(zone) {
  const x = (zone.lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng) * 100;
  const y = (1 - (zone.lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;

  return {
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(86, Math.max(32, y))
  };
}

function getInfraIcons(zone, filter) {
  const infra = zone.infraSummary ?? {};

  if (filter === "transport") {
    return [
      infra.stations ? "🚉" : "",
      infra.busStops ? "🚌" : ""
    ].filter(Boolean);
  }

  if (filter === "living") {
    return [
      infra.libraries ? "📚" : "",
      infra.sports ? "🏃" : ""
    ].filter(Boolean);
  }

  return [
    infra.pharmacies ? "💊" : "",
    infra.fire119Centers ? "🚨" : "",
    infra.policeStations ? "🚔" : ""
  ].filter(Boolean);
}
