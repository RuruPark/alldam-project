import {
  cheonanAsanEmdBoundaryGeoJson
} from "../data/cheonanAsanEmdBoundaries.js";
import {
  findEmdCenter,
  getDistrictsByCity,
  getEmdsBySelection,
  getWorkplaceCities
} from "../data/cheonanAsanEmdCenters.js";
import { getLifeZoneDataset } from "../data/lifeZoneRepository.js";
import {
  assignRelativeGrades,
  calculateLifeZoneScores,
  getTopAndLowZones
} from "../utils/lifeZoneScoring.js";
import {
  applyCommuteToLifeZoneScores,
  COMMUTE_MODE_LABELS,
  normalizeTargetMinutes
} from "../utils/commuteScoring.js";
import { NaverMapView } from "./NaverMapView.js";

const DEFAULT_PREFERENCES = {
  transportImportance: "medium",
  cultureSportsImportance: "medium",
  safetyMedicalImportance: "medium"
};

const DEFAULT_WORKPLACE_SELECTION = {
  city: "천안시",
  district: "서북구",
  emdCode: ""
};

const DEFAULT_COMMUTE_PREFERENCE = {
  workplaceEmdCode: "",
  targetMinutes: 40,
  commuteImportance: "medium",
  commuteMode: "unknown"
};

const IMPORTANCE_OPTIONS = [
  { value: "low", label: "낮음", description: "중요도 낮음" },
  { value: "medium", label: "보통", description: "보통" },
  { value: "high", label: "높음", description: "높음" }
];

const COMMUTE_MODE_OPTIONS = [
  { value: "car", label: "자동차" },
  { value: "transit", label: "대중교통" },
  { value: "walk", label: "도보" },
  { value: "unknown", label: "아직 모름" }
];

const AXES = [
  {
    id: "transport",
    tabLabel: "대중교통",
    name: "대중교통 중요도",
    axisLabel: "교통 인프라 축",
    preferenceKey: "transportImportance",
    description: "이동 편의와 대중교통 접근성을 얼마나 중요하게 보는지 선택하세요.",
    icon: "🚉"
  },
  {
    id: "living",
    tabLabel: "문화·체육",
    name: "문화·체육 중요도",
    axisLabel: "생활 편의 인프라 축",
    preferenceKey: "cultureSportsImportance",
    description: "도서관, 체육시설 등 생활 여가 인프라를 얼마나 중요하게 보는지 선택하세요.",
    icon: "📚"
  },
  {
    id: "safetyMedical",
    tabLabel: "치안·의료",
    name: "치안·의료 중요도",
    axisLabel: "치안·의료 인프라 축",
    preferenceKey: "safetyMedicalImportance",
    description: "약국, 치안시설, 안전 인프라를 얼마나 중요하게 보는지 선택하세요.",
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
  activeMapFilter: "transport",
  preferences: { ...DEFAULT_PREFERENCES },
  workplaceSelection: { ...DEFAULT_WORKPLACE_SELECTION },
  commutePreference: { ...DEFAULT_COMMUTE_PREFERENCE },
  validationMessage: "",
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
    initializeOptionalNaverMap();
    syncSelectedCardIntoView();
  } else {
    bindPreferenceEvents();
  }
}

function renderPreferenceScreen() {
  return `
    <main class="preference-screen">
      <section class="preference-workspace" aria-labelledby="preference-title">
        <div class="preference-copy">
          <p class="eyebrow">Cheonan · Asan Life Zone</p>
          <h1 id="preference-title">생활권 추천 조건 설정</h1>
          <p class="intro">중요하게 생각하는 생활 조건과 직장 위치를 선택하면 천안·아산 생활권을 추천합니다.</p>
          <small class="data-source-label ${lifeZoneDataset.sourceType === "mock" ? "is-mock" : "is-generated"}">
            ${lifeZoneDataset.sourceLabel}
          </small>
        </div>

        <section class="preference-section" aria-labelledby="infra-preference-title">
          <div class="section-heading">
            <p class="eyebrow">생활 인프라 선호도</p>
            <h2 id="infra-preference-title">어떤 생활 조건을 중요하게 보나요?</h2>
          </div>
          <div class="preference-card-list">
            ${AXES.map((axis) => renderPreferenceCard(axis)).join("")}
          </div>
        </section>

        ${renderWorkplaceCommuteSection()}
      </section>

      <footer class="preference-cta" aria-label="생활권 점수 계산">
        <div>
          <p>입력한 조건을 기준으로 추천 생활권을 보여줍니다.</p>
          ${state.validationMessage ? `<span class="form-message" role="alert">${state.validationMessage}</span>` : ""}
        </div>
        <button class="primary-cta" type="button" data-calculate aria-label="생활권 점수 계산하기">
          생활권 점수 계산하기
        </button>
      </footer>
    </main>
  `;
}

function renderPreferenceCard(axis) {
  const activeImportance = state.preferences[axis.preferenceKey];

  return `
    <section class="preference-panel" aria-labelledby="preference-${axis.id}-title">
      <div class="axis-heading">
        <div>
          <p class="axis-kicker">${axis.axisLabel}</p>
          <h3 id="preference-${axis.id}-title">
            <span aria-hidden="true">${axis.icon}</span>
            ${axis.tabLabel}
          </h3>
          <p>${axis.description}</p>
        </div>
      </div>

      <div class="importance-segments" role="radiogroup" aria-label="${axis.name} 선택">
        ${IMPORTANCE_OPTIONS.map((option) => `
          <button
            class="segment-button ${activeImportance === option.value ? "is-selected" : ""}"
            type="button"
            role="radio"
            aria-checked="${activeImportance === option.value}"
            aria-label="${axis.tabLabel} ${option.description}"
            data-importance="${option.value}"
            data-axis="${axis.id}"
          >
            ${option.label}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderWorkplaceCommuteSection() {
  const cities = getWorkplaceCities();
  const { city, district, emdCode } = state.workplaceSelection;
  const districts = getDistrictsByCity(city);
  const districtValue = city === "아산시" ? "해당 없음" : district;
  const emds = getEmdsBySelection(city, districtValue);
  const selectedWorkplace = findEmdCenter(emdCode);

  return `
    <section class="commute-panel" aria-labelledby="commute-title">
      <div class="section-heading">
        <p class="eyebrow">직장·통근 조건</p>
        <h2 id="commute-title">직장 위치와 통근 기준을 선택해 주세요</h2>
        <p>상세 주소 대신 읍면동을 선택하면 추천 생활권과 직장 위치의 관계를 함께 보여줍니다.</p>
      </div>

      <div class="form-grid">
        <label class="field-group" for="workplace-city">
          <span>시 선택</span>
          <select id="workplace-city" data-workplace-city>
            ${cities.map((cityName) => `<option value="${cityName}" ${cityName === city ? "selected" : ""}>${cityName}</option>`).join("")}
          </select>
        </label>

        <label class="field-group" for="workplace-district">
          <span>구 선택</span>
          <select id="workplace-district" data-workplace-district ${city === "아산시" ? "disabled" : ""}>
            ${districts.map((districtName) => `
              <option value="${districtName}" ${districtName === districtValue ? "selected" : ""}>${districtName}</option>
            `).join("")}
          </select>
        </label>

        <label class="field-group" for="workplace-emd">
          <span>읍면동 선택</span>
          <select id="workplace-emd" data-workplace-emd aria-invalid="${!selectedWorkplace && Boolean(state.validationMessage)}">
            <option value="">읍면동 선택</option>
            ${emds.map((emd) => `
              <option value="${emd.emdCode}" ${emd.emdCode === emdCode ? "selected" : ""}>${emd.emdName}</option>
            `).join("")}
          </select>
        </label>
      </div>

      <div class="commute-controls">
        <div class="field-group full-width">
          <div class="field-label-row">
            <span>희망 통근시간</span>
            <strong>${state.commutePreference.targetMinutes}분</strong>
          </div>
          <div class="range-row">
            <input
              type="range"
              min="10"
              max="120"
              step="1"
              value="${state.commutePreference.targetMinutes}"
              data-commute-target-range
              aria-label="희망 통근시간 슬라이더"
            />
            <input
              type="number"
              min="10"
              max="120"
              step="1"
              value="${state.commutePreference.targetMinutes}"
              data-commute-target-number
              aria-label="희망 통근시간 직접 입력"
            />
          </div>
          <p class="helper-text">희망하는 통근시간에 가까운 생활권을 함께 고려합니다.</p>
        </div>

        <div class="field-group full-width">
          <span>통근 중요도</span>
          <div class="importance-segments compact" role="radiogroup" aria-label="통근 중요도 선택">
            ${IMPORTANCE_OPTIONS.map((option) => `
              <button
                class="segment-button ${state.commutePreference.commuteImportance === option.value ? "is-selected" : ""}"
                type="button"
                role="radio"
                aria-checked="${state.commutePreference.commuteImportance === option.value}"
                data-commute-importance="${option.value}"
              >
                ${option.label}
              </button>
            `).join("")}
          </div>
          <p class="helper-text">통근 조건을 어느 정도 중요하게 볼지 선택하세요.</p>
        </div>

        <div class="field-group full-width">
          <span>주 통근수단</span>
          <div class="mode-segments" role="radiogroup" aria-label="주 통근수단 선택">
            ${COMMUTE_MODE_OPTIONS.map((option) => `
              <button
                class="segment-button ${state.commutePreference.commuteMode === option.value ? "is-selected" : ""}"
                type="button"
                role="radio"
                aria-checked="${state.commutePreference.commuteMode === option.value}"
                data-commute-mode="${option.value}"
              >
                ${option.label}
              </button>
            `).join("")}
          </div>
          <p class="helper-text">선택한 통근수단을 기준으로 예상 소요시간을 계산합니다.</p>
        </div>
      </div>
    </section>
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
  const selectedWorkplace = getSelectedWorkplace();

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
          <p class="sr-only">선택한 직장 읍면동과 추천 생활권, 비추천 생활권의 위치를 지도형 배경 위에 표시합니다.</p>
          <svg class="rail-overlay" viewBox="0 0 100 100" aria-hidden="true">
            <path class="rail-line" d="M10 84 C24 67 39 61 50 48 S72 27 90 15" />
            <text x="12" y="80">1호선 접근축</text>
          </svg>
          <div class="city-label cheonan">천안 생활권</div>
          <div class="city-label asan">아산 생활권</div>
          <div class="map-grid-line horizontal"></div>
          <div class="map-grid-line vertical"></div>
          ${selectedWorkplace && displayZones.length > 0 ? renderCommuteConnectionLayer(selectedWorkplace, displayZones, selectedZone?.id) : ""}
          ${selectedWorkplace ? renderWorkplaceMarker(selectedWorkplace) : ""}
          ${displayZones.length === 0 ? renderMapEmptyState() : displayZones.map((zone) => renderMapMarker(zone, selectedZone?.id)).join("")}
        </div>
      </section>

      <aside class="result-panel" aria-label="생활권 추천 결과">
        <div class="panel-header">
          <div>
            <p class="eyebrow">선호도 기반 생활권 비교</p>
            <h1>생활권 추천 결과</h1>
            <p>입력한 생활 조건과 직장 위치를 기준으로 살펴본 결과입니다.</p>
            <small class="data-source-label ${lifeZoneDataset.sourceType === "mock" ? "is-mock" : "is-generated"}">
              ${lifeZoneDataset.sourceLabel}
            </small>
          </div>
          <button class="secondary-button" type="button" data-reset-preferences aria-label="선호도 다시 설정">
            선호도 다시 설정
          </button>
        </div>

        <section class="preference-readout" aria-label="사용자 선호도 요약">
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

        ${selectedWorkplace ? renderCommuteReadout(selectedWorkplace) : ""}

        <div class="result-count">추천 ${bundle.recommendedZones.length}개 · 비추천 ${bundle.lowZone ? 1 : 0}개</div>

        <section class="zone-card-list" role="listbox" aria-label="생활권 결과 목록">
          ${displayZones.length === 0 ? renderPanelEmptyState(lifeZoneDataset) : displayZones.map((zone) => renderResultCard(zone, selectedZone?.id, selectedWorkplace)).join("")}
        </section>
      </aside>
    </main>
  `;
}

function renderCommuteConnectionLayer(workplace, zones, selectedZoneId) {
  const workplacePosition = getMapPosition(workplace);

  return `
    <svg class="commute-connection-layer" viewBox="0 0 100 100" aria-hidden="true">
      ${zones.map((zone) => {
        const zonePosition = getMapPosition(zone);
        return `
          <line
            class="${zone.id === selectedZoneId ? "is-selected" : ""}"
            x1="${workplacePosition.x}"
            y1="${workplacePosition.y}"
            x2="${zonePosition.x}"
            y2="${zonePosition.y}"
          />
        `;
      }).join("")}
    </svg>
  `;
}

function renderWorkplaceMarker(workplace) {
  const position = getMapPosition(workplace);

  return `
    <div
      class="workplace-marker"
      style="left: ${position.x}%; top: ${position.y}%;"
      aria-label="직장 위치 ${formatWorkplaceName(workplace)}"
    >
      <span class="workplace-pin">직장</span>
      <span class="marker-name">${workplace.emdName}</span>
    </div>
  `;
}

function renderMapMarker(zone, selectedZoneId) {
  const position = getMapPosition(zone);
  const selected = zone.id === selectedZoneId;
  const markerClass = zone.rankType === "low" ? "is-low" : "is-recommended";
  const label = zone.rankType === "low" ? "비추천" : `TOP ${zone.rank}`;

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
      ${zone.commute ? renderMarkerTooltip(zone) : ""}
    </button>
  `;
}

function renderMarkerTooltip(zone) {
  return `
    <span class="marker-tooltip">
      <strong>${zone.name}</strong>
      <span>${zone.grade} 등급</span>
      <span>자동차 약 ${formatMinutes(zone.commute.commuteTimes.car)}분</span>
      <span>대중교통 약 ${formatMinutes(zone.commute.commuteTimes.transit)}분</span>
      <span>도보 약 ${formatMinutes(zone.commute.commuteTimes.walk)}분</span>
      <span>${zone.commute.statusLabel}</span>
    </span>
  `;
}

function renderResultCard(zone, selectedZoneId, workplace) {
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
        <div class="grade-badge">
          <strong>${zone.grade}</strong>
          <span>생활권 등급</span>
        </div>
      </div>

      <div class="grade-row">
        <span>상대등급 <strong>${zone.grade}</strong></span>
        <span>${zone.gradeLabel}</span>
      </div>

      ${zone.commute ? renderCommuteSummaryCard(zone, workplace) : ""}

      <div class="axis-score-list" aria-label="분야별 점수 요약">
        ${renderAxisScore("교통", zone.axisScores.transport)}
        ${renderAxisScore("생활 편의", zone.axisScores.living)}
        ${renderAxisScore("치안·의료", zone.axisScores.safetyMedical)}
      </div>

      <div class="reason-block">
        <strong>${zone.rankType === "low" ? "확인 사항" : "추천 이유"}</strong>
        <p>${zone.rankType === "low" ? getZoneWeaknesses(zone)[0] : getZoneStrengths(zone)[0]}</p>
      </div>

      <div class="tag-row" aria-label="주요 인프라 태그">
        ${getZoneTags(zone).map((tag) => `<span>${tag}</span>`).join("")}
      </div>

      ${renderRiHighlights(zone)}

      <div class="strength-row">
        <span>좋은 부분: ${getZoneStrengths(zone).slice(0, 2).join(" · ")}</span>
        <span>확인 필요: ${getZoneWeaknesses(zone)[0]}</span>
      </div>
    </article>
  `;
}

function renderRiHighlights(zone) {
  const highlights = Array.isArray(zone.riHighlights) ? zone.riHighlights.slice(0, 3) : [];
  if (highlights.length === 0) return "";

  return `
    <div class="ri-highlight-block" aria-label="주요 리 인프라">
      <strong>주요 리 인프라</strong>
      <div class="ri-highlight-list">
        ${highlights.map((highlight) => `<span>${highlight.summaryText}</span>`).join("")}
      </div>
      <p>주소에 리 이름이 포함된 데이터만 보조 집계한 결과입니다.</p>
    </div>
  `;
}

function renderCommuteSummaryCard(zone, workplace) {
  const commute = zone.commute;

  return `
    <div class="commute-summary-card">
      <div class="commute-main">
        <strong>${commute.commuteModeLabel} 약 ${formatMinutes(commute.actualMinutes)}분</strong>
        <span>${commute.statusLabel} · 추정값</span>
      </div>
      <p>${formatWorkplaceName(workplace)} 직장 기준 예상 통근시간입니다.</p>
      <div class="commute-time-grid" aria-label="통근수단별 예상 소요시간">
        <span>자동차 약 ${formatMinutes(commute.commuteTimes.car)}분</span>
        <span>대중교통 약 ${formatMinutes(commute.commuteTimes.transit)}분</span>
        <span>도보 약 ${formatMinutes(commute.commuteTimes.walk)}분</span>
      </div>
      <a class="map-link-button" href="${getNaverMapSearchUrl(zone, workplace)}" target="_blank" rel="noopener noreferrer">
        지도에서 위치 확인
      </a>
    </div>
  `;
}

function renderCommuteReadout(workplace) {
  return `
    <section class="preference-readout commute-readout" aria-label="직장 통근 조건 요약">
      <h2>직장·통근 조건</h2>
      <div class="readout-grid">
        <div>
          <span>직장 위치</span>
          <strong>${formatWorkplaceName(workplace)}</strong>
        </div>
        <div>
          <span>희망 통근시간</span>
          <strong>${state.commutePreference.targetMinutes}분</strong>
        </div>
        <div>
          <span>주 통근수단</span>
          <strong>${getCommuteModeLabel(state.commutePreference.commuteMode)}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderAxisScore(label, value) {
  return `
    <div class="axis-score">
      <span>${label}</span>
      <div class="mini-track"><span style="width: ${value}%"></span></div>
    </div>
  `;
}

function renderMapEmptyState() {
  return `
    <div class="map-empty">
      <strong>표시할 생활권 데이터가 없습니다.</strong>
      <span>공공데이터 전처리 결과를 연결하면 같은 구조로 표시합니다.</span>
    </div>
  `;
}

function renderPanelEmptyState(dataset = lifeZoneDataset) {
  const message = dataset.isDatasetAvailable === false
    ? dataset.errorMessage
    : "생활권 데이터가 3개 미만이면 가능한 결과만 표시합니다.";

  return `
    <div class="panel-empty">
      <strong>계산 가능한 생활권이 없습니다.</strong>
      <p>${message}</p>
    </div>
  `;
}

function bindPreferenceEvents() {
  appRoot.querySelectorAll("[data-importance]").forEach((button) => {
    button.addEventListener("click", () => {
      const axis = AXES.find((axisItem) => axisItem.id === button.dataset.axis);
      if (!axis) return;
      state.preferences = {
        ...state.preferences,
        [axis.preferenceKey]: button.dataset.importance
      };
      state.validationMessage = "";
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
      state.validationMessage = "";
      render();
      focusAfterRender(`[data-axis="${axis.id}"][data-importance="${IMPORTANCE_OPTIONS[nextIndex].value}"]`);
    });
  });

  appRoot.querySelector("[data-workplace-city]")?.addEventListener("change", (event) => {
    const city = event.target.value;
    const district = getDefaultDistrict(city);

    state.workplaceSelection = { city, district, emdCode: "" };
    state.commutePreference = { ...state.commutePreference, workplaceEmdCode: "" };
    state.validationMessage = "";
    render();
  });

  appRoot.querySelector("[data-workplace-district]")?.addEventListener("change", (event) => {
    state.workplaceSelection = {
      ...state.workplaceSelection,
      district: event.target.value,
      emdCode: ""
    };
    state.commutePreference = { ...state.commutePreference, workplaceEmdCode: "" };
    state.validationMessage = "";
    render();
  });

  appRoot.querySelector("[data-workplace-emd]")?.addEventListener("change", (event) => {
    state.workplaceSelection = {
      ...state.workplaceSelection,
      emdCode: event.target.value
    };
    state.commutePreference = {
      ...state.commutePreference,
      workplaceEmdCode: event.target.value
    };
    state.validationMessage = "";
    render();
  });

  bindTargetMinuteInputs();
  bindCommuteOptionButtons();

  appRoot.querySelector("[data-calculate]")?.addEventListener("click", () => {
    const selectedWorkplace = getSelectedWorkplace();

    if (!selectedWorkplace) {
      state.validationMessage = "직장 위치와 통근 조건을 선택해주세요.";
      render();
      return;
    }

    if (lifeZoneDataset.isDatasetAvailable === false) {
      state.scoredZones = [];
      state.resultBundle = {
        recommendedZones: [],
        lowZone: null,
        displayZones: []
      };
      state.selectedZoneId = null;
      state.validationMessage = "";
      state.view = "results";
      render();
      return;
    }

    const baseScoredZones = calculateLifeZoneScores(lifeZoneDataset.lifeZones, state.preferences);
    const commuteScoredZones = applyCommuteToLifeZoneScores(
      baseScoredZones,
      selectedWorkplace,
      state.commutePreference
    );
    const gradedZones = assignRelativeGrades(commuteScoredZones);
    const resultBundle = getTopAndLowZones(gradedZones);

    state.scoredZones = gradedZones;
    state.resultBundle = resultBundle;
    state.selectedZoneId = resultBundle.displayZones[0]?.id ?? null;
    state.validationMessage = "";
    state.view = "results";
    render();
  });
}

function bindTargetMinuteInputs() {
  const rangeInput = appRoot.querySelector("[data-commute-target-range]");
  const numberInput = appRoot.querySelector("[data-commute-target-number]");
  const updateTarget = (value) => {
    const targetMinutes = normalizeTargetMinutes(value);

    state.commutePreference = {
      ...state.commutePreference,
      targetMinutes
    };
    state.validationMessage = "";
    if (rangeInput) rangeInput.value = String(targetMinutes);
    if (numberInput) numberInput.value = String(targetMinutes);
    appRoot.querySelector(".field-label-row strong")?.replaceChildren(`${targetMinutes}분`);
  };

  rangeInput?.addEventListener("input", (event) => updateTarget(event.target.value));
  numberInput?.addEventListener("input", (event) => updateTarget(event.target.value));
  numberInput?.addEventListener("blur", (event) => updateTarget(event.target.value));
}

function initializeOptionalNaverMap() {
  const fallbackMap = appRoot?.querySelector(".mock-map");
  if (!fallbackMap) return;

  const boundaryDisplay = getBoundaryDisplayText();
  const clientId = getNaverMapClientId();
  if (!clientId) {
    addMapStatusBadge(fallbackMap, "fallback", "기본 지도 표시 중", "실제 지도 연결 전에도 위치 비교가 가능합니다.");
    addMapBoundaryNote(fallbackMap, boundaryDisplay.fallbackNote);
    addMapRouteNote(fallbackMap);
    return;
  }

  const selectedWorkplace = getSelectedWorkplace();
  const displayZones = state.resultBundle?.displayZones ?? [];
  const mapShell = document.createElement("div");
  mapShell.className = "naver-map-shell is-loading";
  mapShell.innerHTML = `
    <div class="naver-map-canvas" data-naver-map-canvas role="region" aria-label="Naver map"></div>
    <div class="map-provider-badge is-live" data-map-provider-badge>
      <strong>Naver Maps</strong>
      <span>${boundaryDisplay.badge}</span>
    </div>
    <p class="map-boundary-note">${boundaryDisplay.liveNote}</p>
    <p class="map-route-note">지도 연결선은 실제 길찾기 경로가 아니라 위치 비교용 선입니다.</p>
  `;
  fallbackMap.insertAdjacentElement("beforebegin", mapShell);

  NaverMapView({
    clientId,
    container: mapShell.querySelector("[data-naver-map-canvas]"),
    workplace: selectedWorkplace,
    results: displayZones,
    selectedLifeZoneId: state.selectedZoneId,
    onSelectLifeZone: (lifeZoneId) => {
      state.selectedZoneId = lifeZoneId;
      render();
    },
    onError: (error) => showFallbackMapAfterNaverError(mapShell, fallbackMap, error)
  }).then(() => {
    if (!mapShell.isConnected) return;

    mapShell.classList.remove("is-loading");
    setMapProviderBadge(mapShell.querySelector("[data-map-provider-badge]"), "Naver Maps", boundaryDisplay.badge);
    fallbackMap.classList.add("is-map-fallback-hidden");
  }).catch(() => {
    // Fallback is handled in showFallbackMapAfterNaverError.
  });
}

function showFallbackMapAfterNaverError(mapShell, fallbackMap, error) {
  console.warn("Naver Maps failed to load; showing fallback map.", error);
  mapShell.remove();
  fallbackMap.classList.remove("is-map-fallback-hidden");
  addMapStatusBadge(fallbackMap, "fallback", "기본 지도 표시 중", "실제 지도를 불러오지 못해 위치 비교 지도로 표시합니다.");
  addMapBoundaryNote(fallbackMap, getBoundaryDisplayText().fallbackNote);
  addMapRouteNote(fallbackMap);
}

function getBoundaryDisplayText() {
  const metadata = cheonanAsanEmdBoundaryGeoJson.metadata ?? {};

  if (metadata.isSample === false) {
    return {
      badge: "행정동 경계",
      liveNote: "국토교통부 센서스경계 행정동경계를 기준으로 표시합니다.",
      fallbackNote: "행정동 경계는 실제 지도 모드에서 표시됩니다."
    };
  }

  return {
    badge: "시연용 읍면동 경계",
    liveNote: "실제 행정경계가 아닌 시연용 경계입니다.",
    fallbackNote: "읍면동 경계는 실제 지도 모드에서 표시됩니다. 현재 경계 데이터는 시연용입니다."
  };
}

function addMapStatusBadge(mapElement, mode, title, detail) {
  if (mapElement.querySelector("[data-map-status-badge]")) return;

  const badge = document.createElement("div");
  badge.className = `map-provider-badge is-${mode}`;
  badge.dataset.mapStatusBadge = "";
  const titleElement = document.createElement("strong");
  const detailElement = document.createElement("span");
  titleElement.textContent = title;
  detailElement.textContent = detail;
  badge.append(titleElement, detailElement);
  mapElement.appendChild(badge);
}

function setMapProviderBadge(badge, title, detail) {
  if (!badge) return;

  const titleElement = document.createElement("strong");
  const detailElement = document.createElement("span");
  titleElement.textContent = title;
  detailElement.textContent = detail;
  badge.replaceChildren(titleElement, detailElement);
}

function addMapBoundaryNote(mapElement, message) {
  if (mapElement.querySelector("[data-map-boundary-note]")) return;

  const note = document.createElement("p");
  note.className = "map-boundary-note";
  note.dataset.mapBoundaryNote = "";
  note.textContent = message;
  mapElement.appendChild(note);
}

function addMapRouteNote(mapElement) {
  if (mapElement.querySelector("[data-map-route-note]")) return;

  const note = document.createElement("p");
  note.className = "map-route-note";
  note.dataset.mapRouteNote = "";
  note.textContent = "지도 연결선은 실제 길찾기 경로가 아니라 위치 비교용 선입니다.";
  mapElement.appendChild(note);
}

function getNaverMapClientId() {
  const config = window.__APP_CONFIG__ ?? {};
  const clientId = String(config.NAVER_MAP_CLIENT_ID ?? config.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "").trim();

  return isValidNaverMapClientId(clientId) ? clientId : "";
}

function isValidNaverMapClientId(clientId) {
  const invalidClientIds = new Set([
    "",
    "발급받은_Client_ID를_여기에_직접_입력하세요",
    "발급받은_Client_ID"
  ]);

  return !invalidClientIds.has(String(clientId ?? "").trim());
}

function bindCommuteOptionButtons() {
  appRoot.querySelectorAll("[data-commute-importance]").forEach((button) => {
    button.addEventListener("click", () => {
      state.commutePreference = {
        ...state.commutePreference,
        commuteImportance: button.dataset.commuteImportance
      };
      state.validationMessage = "";
      render();
    });
  });

  appRoot.querySelectorAll("[data-commute-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.commutePreference = {
        ...state.commutePreference,
        commuteMode: button.dataset.commuteMode
      };
      state.validationMessage = "";
      render();
    });
  });
}

function bindResultEvents() {
  appRoot.querySelector("[data-reset-preferences]")?.addEventListener("click", () => {
    state.view = "preferences";
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

function getSelectedWorkplace() {
  return findEmdCenter(state.commutePreference.workplaceEmdCode || state.workplaceSelection.emdCode);
}

function getDefaultDistrict(city) {
  return getDistrictsByCity(city)[0] ?? "해당 없음";
}

function getImportanceLabel(importance) {
  return IMPORTANCE_OPTIONS.find((option) => option.value === importance)?.label ?? "보통";
}

function getCommuteModeLabel(mode) {
  const selected = COMMUTE_MODE_OPTIONS.find((option) => option.value === mode);
  return selected?.label ?? COMMUTE_MODE_LABELS.unknown;
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
  const fallback = ["입력 조건에 맞는 생활 여건을 갖춘 편입니다."];
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
    .replace(/비상벨 밀도는 중심권 대비 낮음/g, "야간 생활 안전감은 현장 확인이 필요합니다")
    .replace(/1호선 접근성이 높음/g, "1호선 이용이 편리한 편입니다")
    .replace(/약국과 공공 안전시설 접근성이 양호/g, "생활 안전과 의료 이용 여건이 좋은 편입니다")
    .replace(/철도 접근성과 체육 인프라 접근성이 안정적/g, "이동과 여가 생활의 균형이 좋은 편입니다")
    .replace(/넓은 면적 때문에 밀도 지표는 일부 낮게 산정될 수 있음/g, "생활권이 넓어 동네별 체감 차이가 있을 수 있습니다")
    .replace(/버스 접근성은 기본 수준 이상/g, "기본적인 대중교통 이용은 가능한 편입니다")
    .replace(/체육 인프라와 공공안전 접근성 추가 확인 필요/g, "여가와 안전 생활 조건은 추가 확인이 필요합니다")
    .replace(/철도·문화·공공안전 접근성 추가 확인 필요/g, "이동, 여가, 안전 생활 조건은 추가 확인이 필요합니다")
    .replace(/접근성/g, "이용 편의")
    .replace(/밀도/g, "분포")
    .replace(/지표/g, "조건");
}

function getMapPosition(point) {
  const x = (point.lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng) * 100;
  const y = (1 - (point.lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;

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

function formatWorkplaceName(workplace) {
  if (!workplace) return "직장 위치";
  const district = workplace.district && workplace.district !== "해당 없음" ? ` ${workplace.district}` : "";
  return `${workplace.city}${district} ${workplace.emdName}`;
}

function formatMinutes(value) {
  return Number.isFinite(value) ? Math.max(1, Math.round(value)) : "-";
}

function getNaverMapSearchUrl(zone, workplace) {
  const query = encodeURIComponent(`${formatWorkplaceName(workplace)} ${zone.city} ${zone.eupMyeonDong}`);
  return `https://map.naver.com/p/search/${query}`;
}
