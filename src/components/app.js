import { getLifeZoneDataset } from "../data/lifeZoneRepository.js";
import {
  assignRelativeGrades,
  calculateLifeZoneScores,
  getImportanceCoefficient,
  getTopAndLowZones,
  normalizePreferenceWeights
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
    weightKey: "transport",
    description: "철도·버스 접근성과 이동 선택지를 기준으로 생활권 이동 편의성을 봅니다.",
    indicators: ["철도 접근성", "버스 접근성", "교통 다양성"],
    icon: "🚉"
  },
  {
    id: "living",
    tabLabel: "문화·체육",
    name: "문화·체육 중요도",
    axisLabel: "생활 편의 인프라 축",
    preferenceKey: "cultureSportsImportance",
    weightKey: "living",
    description: "도서관, 체육 인프라, 생활 편의 다양성을 함께 반영합니다.",
    indicators: ["도서관 접근성", "체육 인프라 접근성", "생활편의 다양성"],
    icon: "📚"
  },
  {
    id: "safetyMedical",
    tabLabel: "치안·의료",
    name: "치안·의료 중요도",
    axisLabel: "치안·의료 인프라 축",
    preferenceKey: "safetyMedicalImportance",
    weightKey: "safetyMedical",
    description: "약국, 보안등, 안전비상벨, 119, 지구대·파출소 접근성을 종합합니다.",
    indicators: ["약국 접근성", "보안등 밀도", "안전비상벨 밀도", "119안전센터 접근성", "지구대·파출소 접근성"],
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
  preferenceWeights: null,
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
  const weights = normalizePreferenceWeights(state.preferences);
  const activeImportance = state.preferences[activeAxis.preferenceKey];
  const activeCoefficient = getImportanceCoefficient(activeImportance);

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
            <div class="coefficient-badge" aria-label="선택된 중요도 계수">
              계수 <strong>${activeCoefficient.toFixed(1)}</strong>
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

          <div class="distribution-block" aria-label="정규화된 선호도 가중치 미리보기">
            <div class="distribution-header">
              <span>정규화된 가중치</span>
              <strong>${formatPercent(weights[activeAxis.weightKey])}</strong>
            </div>
            <div class="distribution-bars">
              ${AXES.map((axis) => `
                <div class="distribution-item ${axis.id === activeAxis.id ? "is-current" : ""}">
                  <div class="bar-track">
                    <span class="bar-fill" style="height: ${Math.max(12, weights[axis.weightKey] * 100)}%"></span>
                  </div>
                  <span>${axis.tabLabel}</span>
                  <strong>${formatPercent(weights[axis.weightKey])}</strong>
                </div>
              `).join("")}
            </div>
          </div>

          <fieldset class="indicator-fieldset">
            <legend>세부 지표 안내</legend>
            <div class="indicator-grid">
              ${activeAxis.indicators.map((indicator) => `
                <label class="indicator-option">
                  <input type="checkbox" checked disabled aria-label="${indicator} 반영 예정" />
                  <span>${indicator}</span>
                </label>
              `).join("")}
            </div>
          </fieldset>
        </section>

        <section class="preference-summary" aria-label="현재 선택 요약">
          ${AXES.map((axis) => `
            <div class="summary-row">
              <span>${axis.tabLabel}</span>
              <strong>${getImportanceLabel(state.preferences[axis.preferenceKey])}</strong>
              <small>${formatPercent(weights[axis.weightKey])}</small>
            </div>
          `).join("")}
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
  const weights = state.preferenceWeights ?? normalizePreferenceWeights(state.preferences);

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
          <div class="weight-readout" aria-label="정규화된 선호도 가중치">
            ${AXES.map((axis) => `
              <div class="weight-row">
                <span>${axis.axisLabel.replace(" 축", "")}</span>
                <strong>${formatPercent(weights[axis.weightKey])}</strong>
                <div class="mini-track"><span style="width: ${weights[axis.weightKey] * 100}%"></span></div>
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

      <dl class="breakdown-list">
        <div>
          <dt>교통</dt>
          <dd>철도 ${zone.scoreBreakdown.transport.railAccessibility} · 버스 ${zone.scoreBreakdown.transport.busAccessibility} · 다양성 ${zone.scoreBreakdown.transport.transportDiversity}</dd>
        </div>
        <div>
          <dt>생활</dt>
          <dd>도서관 ${zone.scoreBreakdown.living.libraryAccessibility} · 체육 ${zone.scoreBreakdown.living.sportsAccessibility} · 다양성 ${zone.scoreBreakdown.living.livingDiversity}</dd>
        </div>
        <div>
          <dt>치안·의료</dt>
          <dd>약국 ${zone.scoreBreakdown.safetyMedical.pharmacyAccessibility} · 보안등 ${zone.scoreBreakdown.safetyMedical.streetlightDensity} · 비상벨 ${zone.scoreBreakdown.safetyMedical.emergencyBellDensity} · 119 ${zone.scoreBreakdown.safetyMedical.fire119Accessibility} · 치안 ${zone.scoreBreakdown.safetyMedical.policeSubstationAccessibility}</dd>
        </div>
      </dl>

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
    state.preferenceWeights = normalizePreferenceWeights(state.preferences);
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
    state.preferenceWeights = null;
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

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
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
  return zone.description || `${zone.city} ${zone.eupMyeonDong} 생활권의 인프라 접근성을 비교했습니다.`;
}

function getZoneStrengths(zone) {
  return Array.isArray(zone.strengths) && zone.strengths.length > 0
    ? zone.strengths
    : ["가중치 기준으로 비교 가능한 인프라 점수가 산정됨"];
}

function getZoneWeaknesses(zone) {
  return Array.isArray(zone.weaknesses) && zone.weaknesses.length > 0
    ? zone.weaknesses
    : ["실제 공공데이터 적용 후 세부 보완 지표 확인 필요"];
}

function getZoneTags(zone) {
  return Array.isArray(zone.tags) && zone.tags.length > 0
    ? zone.tags
    : ["생활권 비교", "데이터 보완 예정"];
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
