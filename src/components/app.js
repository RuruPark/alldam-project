import {
  findWorkplaceCenterByCode,
  getDefaultWorkplaceOptionByDataMode,
  getWorkplaceCitiesByDataMode,
  getWorkplaceDistrictsByCityAndDataMode,
  getWorkplaceEmdsBySelectionAndDataMode
} from "../data/workplaceOptions.js";
import { getLifeZoneDataset } from "../data/lifeZoneRepository.js";
import {
  assignRelativeGrades,
  calculateLifeZoneScores,
  getTopAndLowZones
} from "../utils/lifeZoneScoring.js";
import {
  applyCommuteToLifeZoneScores,
  getTargetMinutesRangeForCommuteMode,
  getTopAndLowZonesWithCommuteFeasibility,
  normalizeTargetMinutesForCommuteMode,
  WALK_RECOMMENDATION_MAX_MINUTES
} from "../utils/commuteScoring.js";
import { getVisibleRiHighlightSentences } from "../utils/riHighlights.js";
import { buildNaverDirectionsUrl } from "../utils/naverDirectionsUrl.js";
import { fetchDrivingCommuteBatch } from "../utils/drivingCommuteApi.js";
import {
  fetchOdsayTransitCommutes,
  getConfiguredOdsayUriApiKey
} from "../utils/odsayTransitApi.js";
import { fetchWalkingCommuteBatch } from "../utils/walkingCommuteApi.js";
import {
  DEFAULT_COMMUTE_API_MODE,
  normalizeCommuteApiMode,
  shouldFetchDrivingCommute,
  shouldFetchOdsayTransit,
  shouldFetchWalkingCommute
} from "../utils/commuteApiPolicy.js";
import { buildCommuteApiPreselection } from "../utils/commutePreselection.js";
import { NaverMapView } from "./NaverMapView.js";

const DEFAULT_PREFERENCES = {
  transportImportance: "medium",
  cultureSportsImportance: "medium",
  safetyMedicalImportance: "medium"
};

const lifeZoneDataset = getLifeZoneDataset();
const DEFAULT_WORKPLACE = getDefaultWorkplaceOptionByDataMode(lifeZoneDataset.dataMode);
const DEFAULT_WORKPLACE_SELECTION = createWorkplaceSelection(DEFAULT_WORKPLACE);

const DEFAULT_COMMUTE_PREFERENCE = {
  workplaceEmdCode: DEFAULT_WORKPLACE?.emdCode ?? "",
  targetMinutes: 40,
  commuteImportance: "medium",
  commuteMode: DEFAULT_COMMUTE_API_MODE
};

const IMPORTANCE_OPTIONS = [
  { value: "low", label: "낮음", description: "중요도 낮음" },
  { value: "medium", label: "보통", description: "보통" },
  { value: "high", label: "높음", description: "높음" }
];

const COMMUTE_MODE_OPTIONS = [
  { value: "car", label: "자동차" },
  { value: "transit", label: "대중교통" },
  { value: "walk", label: "도보" }
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

const MAP_BOUNDS = {
  minLat: 36.74,
  maxLat: 36.95,
  minLng: 126.96,
  maxLng: 127.18
};

export const NO_WORKPLACE_ID = "none";

export const RECOMMENDATION_MODES = Object.freeze({
  commuteBased: "commuteBased",
  infraOnly: "infraOnly"
});

const state = {
  view: "preferences",
  activeMapFilter: "transport",
  preferences: { ...DEFAULT_PREFERENCES },
  workplaceSelection: { ...DEFAULT_WORKPLACE_SELECTION },
  commutePreference: { ...DEFAULT_COMMUTE_PREFERENCE },
  validationMessage: "",
  scoredZones: [],
  resultBundle: null,
  selectedZoneId: null,
  shouldFocusSelectedZoneOnMap: false,
  pendingResultScrollZoneId: null,
  isCalculating: false,
  recommendationMode: RECOMMENDATION_MODES.commuteBased,
  calculationRunId: 0,
  apiSelectionSummary: null
};

let appRoot = null;

export function initLifeZoneApp(root) {
  appRoot = root;

  if (!appRoot) return;
  ensureValidWorkplaceSelection();
  render();
}

function render() {
  if (!appRoot) return;

  appRoot.innerHTML = state.view === "results" ? renderResultScreen() : renderPreferenceScreen();
  if (state.view === "results") {
    bindResultEvents();
    initializeOptionalNaverMap();
    alignPendingResultCardInPanel();
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
          <h1 id="preference-title">천안 아산 맞춤형 생활권 추천 서비스</h1>
          <p class="intro">중요하게 생각하는 생활 조건과 직장 위치를 선택하면 천안·아산 생활권을 추천합니다.</p>
          <small class="data-source-label ${lifeZoneDataset.sourceType === "mock" ? "is-mock" : "is-generated"}">
            ${lifeZoneDataset.sourceLabel}
          </small>
        </div>

        <section class="preference-section" aria-labelledby="infra-preference-title">
          <div class="section-heading">
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
          ${state.validationMessage ? `<span class="form-message" role="alert">${state.validationMessage}</span>` : ""}
        </div>
        <button
          class="primary-cta ${state.isCalculating ? "is-loading" : ""}"
          type="button"
          data-calculate
          aria-label="생활권 점수 계산하기"
          aria-busy="${state.isCalculating}"
          ${state.isCalculating ? "disabled" : ""}
        >
          ${state.isCalculating ? renderCalculationLoadingContent() : "생활권 점수 계산하기"}
        </button>
      </footer>
    </main>
  `;
}

function renderCalculationLoadingContent() {
  return `
    <span class="loading-spinner" aria-hidden="true"></span>
    <span aria-live="polite">${getCalculationLoadingText()}</span>
  `;
}

function getCalculationLoadingText() {
  if (state.recommendationMode === RECOMMENDATION_MODES.infraOnly || getRecommendationMode() === RECOMMENDATION_MODES.infraOnly) {
    return "인프라 선호도 기준 생활권 계산 중...";
  }

  const commuteMode = getEffectiveCommuteMode();
  if (commuteMode === "car") return "네이버 길찾기 기준 계산 중...";
  if (commuteMode === "transit") return "ODsay 대중교통 기준 계산 중...";
  if (commuteMode === "walk") return "TMAP 보행자 경로 기준 계산 중...";
  return "생활권 계산 중...";
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
  const dataMode = lifeZoneDataset.dataMode;
  const cities = getWorkplaceCitiesByDataMode(dataMode);
  const { city, district, emdCode } = state.workplaceSelection;
  const commuteMode = getEffectiveCommuteMode();
  const districts = getWorkplaceDistrictsByCityAndDataMode(city, dataMode);
  const districtValue = city === "아산시" ? "해당 없음" : district;
  const emds = getWorkplaceEmdsBySelectionAndDataMode(city, districtValue, dataMode);
  const selectedWorkplaceCode = getSelectedWorkplaceCode();
  const isInfraOnlyMode = isNoWorkplaceCode(selectedWorkplaceCode);
  const selectedWorkplace = isInfraOnlyMode ? null : findWorkplaceCenterByCode(selectedWorkplaceCode, dataMode);
  const modeLabel = lifeZoneDataset.sourceType === "mock" ? "가상 데이터 기준 직장 위치 선택" : "실제 데이터 기준 직장 위치 선택";
  const targetRange = getTargetMinutesRangeForCommuteMode(commuteMode);
  const targetMinutes = normalizeTargetMinutesForCommuteMode(state.commutePreference.targetMinutes, commuteMode);

  return `
    <section class="commute-panel" aria-labelledby="commute-title">
      <div class="section-heading">
        <p class="eyebrow">직장·통근 조건</p>
        <h2 id="commute-title">직장 위치와 통근 기준을 선택해 주세요</h2>
        <p>${modeLabel} · 상세 주소 대신 읍면동을 선택하면 추천 생활권과 직장 위치의 관계를 함께 보여줍니다.</p>
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
          <select id="workplace-emd" data-workplace-emd aria-invalid="${!isInfraOnlyMode && !selectedWorkplace && Boolean(state.validationMessage)}">
            <option value="${NO_WORKPLACE_ID}" ${isInfraOnlyMode ? "selected" : ""}>선택안함</option>
            ${emds.length === 0 ? `<option value="">선택 가능한 읍면동 없음</option>` : ""}
            ${emds.map((emd) => `
              <option value="${emd.emdCode}" ${emd.emdCode === selectedWorkplaceCode ? "selected" : ""}>${emd.emdName}</option>
            `).join("")}
          </select>
        </label>
      </div>

      ${isInfraOnlyMode ? renderInfraOnlyCommuteNotice() : ""}
      <div class="commute-controls">
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
                ${isInfraOnlyMode ? "disabled" : ""}
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
                class="segment-button ${commuteMode === option.value ? "is-selected" : ""}"
                type="button"
                role="radio"
                aria-checked="${commuteMode === option.value}"
                data-commute-mode="${option.value}"
                ${isInfraOnlyMode ? "disabled" : ""}
              >
                ${option.label}
              </button>
            `).join("")}
          </div>
          <p class="helper-text">선택한 통근수단을 기준으로 예상 소요시간을 계산합니다.</p>
        </div>

        <div class="field-group full-width commute-target-control">
          <div class="field-label-row">
            <span>희망 통근시간</span>
          </div>
          <div class="range-row">
            <input
              type="range"
              min="${targetRange.min}"
              max="${targetRange.max}"
              step="1"
              value="${targetMinutes}"
              data-commute-target-range
              aria-label="희망 통근시간 슬라이더"
              ${isInfraOnlyMode ? "disabled" : ""}
            />
            <span class="commute-target-value" data-commute-target-display>${targetMinutes}분</span>
          </div>
          <p class="helper-text">희망하는 통근시간에 가까운 생활권을 함께 고려합니다.${commuteMode === "walk" ? " 도보는 최대 60분까지 추천 후보로 봅니다." : ""}</p>
        </div>
      </div>
    </section>
  `;
}

function renderInfraOnlyCommuteNotice() {
  return `
    <div class="infra-only-commute-notice" role="note">
      직장 위치를 선택하지 않으면 인프라 선호도만으로 생활권을 추천합니다.
    </div>
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
  const isInfraOnlyMode = state.recommendationMode === RECOMMENDATION_MODES.infraOnly;
  const selectedWorkplace = isInfraOnlyMode ? null : getSelectedWorkplace();
  const resultEyebrow = isInfraOnlyMode ? "인프라 선호도 기반 생활권 추천" : "선호도 기반 생활권 비교";
  const resultSummary = isInfraOnlyMode
    ? "직장 위치를 선택하지 않아 통근 조건은 반영하지 않았습니다."
    : "입력한 생활 조건과 직장 위치를 기준으로 살펴본 결과입니다.";

  return `
    <main class="result-screen">
      <section class="map-view" aria-label="생활권 결과 지도">
        ${renderMapDataSourceBadge()}
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
          ${displayZones.length === 0 ? renderMapEmptyState(bundle) : displayZones.map((zone) => renderMapMarker(zone, selectedZone?.id)).join("")}
        </div>
      </section>

      <aside class="result-panel" aria-label="생활권 추천 결과">
        <div class="panel-header">
          <div>
            <p class="eyebrow">${resultEyebrow}</p>
            <h1>생활권 추천 결과</h1>
            <p class="panel-summary">${resultSummary}</p>
          </div>
        </div>

        <section class="zone-card-list" role="listbox" aria-label="생활권 결과 목록">
          ${displayZones.length === 0 ? renderPanelEmptyState(lifeZoneDataset, bundle) : displayZones.map((zone) => renderResultCard(zone, selectedZone?.id, selectedWorkplace)).join("")}
        </section>

        ${!bundle.emptyState && bundle.commuteFeasibilityNotice ? renderCommuteFeasibilityNotice(bundle.commuteFeasibilityNotice) : ""}
        ${renderResultActions()}
        ${renderPreferenceReadout()}
        ${isInfraOnlyMode ? renderInfraOnlyReadout() : selectedWorkplace ? renderCommuteReadout(selectedWorkplace) : ""}
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
      ${renderSelectedMarkerCommuteLine(zone.commute)}
      <span>${zone.commute.feasibilityLabel ?? zone.commute.statusLabel}</span>
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
      ${!zone.commute && state.recommendationMode === RECOMMENDATION_MODES.infraOnly ? renderInfraOnlySummaryCard(zone) : ""}

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
  const sentences = getVisibleRiHighlightSentences(zone, 3);
  if (sentences.length === 0) return "";

  return `
    <div class="ri-highlight-block" aria-label="리 구역별 보조 정보">
      <div class="ri-highlight-list">
        ${sentences.map((sentence) => `<span>${sentence}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderInfraOnlySummaryCard(zone) {
  const totalScore = formatScore(zone.totalScore);
  const strongestAxis = getStrongestAxisLabel(zone);

  return `
    <div class="infra-only-summary-card">
      <strong>${zone.rankType === "low" ? "인프라 선호도와 상대적으로 맞지 않는 생활권" : `${strongestAxis} 선호와 잘 맞는 생활권`}</strong>
      <span>종합 인프라 적합도 ${totalScore}점</span>
    </div>
  `;
}

function renderCommuteSummaryCard(zone, workplace) {
  const commute = zone.commute;
  const selectedSummary = getSelectedCommuteSummary(commute);

  return `
    <div class="commute-summary-card">
      <div class="commute-main">
        <strong>${selectedSummary.title}</strong>
        <span>${selectedSummary.meta}</span>
      </div>
      <p>${formatWorkplaceName(workplace)} 직장 기준 ${commute.commuteModeLabel} 예상 통근시간입니다.</p>
      <div class="commute-time-grid is-single" aria-label="선택한 통근수단 예상 소요시간">
        ${renderSelectedCommuteTimeItem(commute)}
      </div>
      ${renderSelectedCommuteStatus(commute)}
      ${renderNaverDirectionsLink(zone, workplace)}
    </div>
  `;
}

function getSelectedCommuteSummary(commute) {
  const isCarMode = commute.commuteMode === "car";
  const isTransitMode = commute.commuteMode === "transit";
  const isWalkMode = commute.commuteMode === "walk";

  if (isCarMode && !commute.isDrivingActualApiValue) {
    return {
      title: "자동차 길찾기 정보 없음",
      meta: `희망 ${commute.targetMinutes}분 · 통근 조건 미반영`
    };
  }

  if (isTransitMode && !commute.isTransitActualApiValue) {
    return {
      title: "대중교통 경로 정보 없음",
      meta: `희망 ${commute.targetMinutes}분 · 통근 조건 미반영`
    };
  }

  if (isWalkMode && !commute.isWalkingActualApiValue) {
    return {
      title: "도보 경로 정보 없음",
      meta: `희망 ${commute.targetMinutes}분 · 통근 조건 미반영`
    };
  }

  if (isWalkMode && Number(commute.actualMinutes) > WALK_RECOMMENDATION_MAX_MINUTES) {
    return {
      title: `도보 약 ${formatMinutes(commute.actualMinutes)}분`,
      meta: `도보 통근에는 부적합 · 희망 ${commute.targetMinutes}분 · ${getSelectedCommuteSourceLabel(commute)}`
    };
  }

  return {
    title: `${commute.commuteModeLabel} 약 ${formatMinutes(commute.actualMinutes)}분`,
    meta: `${commute.feasibilityLabel ?? commute.statusLabel} · 희망 ${commute.targetMinutes}분 · ${getSelectedCommuteSourceLabel(commute)}`
  };
}

function getSelectedCommuteSourceLabel(commute) {
  if (commute.commuteMode === "car") return "네이버 길찾기 기준";
  if (commute.commuteMode === "transit") return "ODsay 대중교통 기준";
  if (commute.commuteMode === "walk") return "TMAP 보행자 경로 기준";
  return "거리 기반 추정";
}

function renderSelectedCommuteTimeItem(commute) {
  if (commute.commuteMode === "car") return renderCarCommuteTimeItem(commute);
  if (commute.commuteMode === "transit") return renderTransitCommuteTimeItem(commute);
  if (commute.commuteMode === "walk") return renderWalkingCommuteTimeItem(commute);

  return `<span>${commute.commuteModeLabel} 약 ${formatMinutes(commute.actualMinutes)}분<small>거리 기반 추정</small></span>`;
}

function renderCarCommuteTimeItem(commute) {
  if (commute.isDrivingActualApiValue) {
    return `<span>자동차 약 ${formatMinutes(commute.commuteTimes.car)}분<small>네이버 길찾기 기준</small></span>`;
  }

  return `<span class="is-unavailable">자동차 길찾기 불러오기 실패</span>`;
}

function renderCarTooltipLine(commute) {
  if (commute.isDrivingActualApiValue) {
    return `<span>자동차 약 ${formatMinutes(commute.commuteTimes.car)}분</span>`;
  }

  return `<span>자동차 길찾기 정보 없음</span>`;
}

function renderSelectedMarkerCommuteLine(commute) {
  if (commute.commuteMode === "car") return renderCarTooltipLine(commute);
  if (commute.commuteMode === "transit") {
    return commute.isTransitActualApiValue
      ? `<span>대중교통 약 ${formatMinutes(commute.commuteTimes.transit)}분</span>`
      : `<span>대중교통 경로 정보 없음</span>`;
  }
  if (commute.commuteMode === "walk") {
    return commute.isWalkingActualApiValue
      ? `<span>도보 약 ${formatMinutes(commute.commuteTimes.walk)}분</span>`
      : `<span>도보 경로 정보 없음</span>`;
  }
  return `<span>${commute.commuteModeLabel} 약 ${formatMinutes(commute.actualMinutes)}분</span>`;
}

function renderTransitCommuteTimeItem(commute) {
  if (commute.isTransitActualApiValue) {
    const fareText = Number.isFinite(Number(commute.transitFareKrw))
      ? `요금 ${Number(commute.transitFareKrw).toLocaleString("ko-KR")}원`
      : null;
    const busText = Number.isFinite(Number(commute.transitBusCount)) ? `버스 ${commute.transitBusCount}회` : null;
    const subwayText = Number.isFinite(Number(commute.transitSubwayCount)) ? `지하철 ${commute.transitSubwayCount}회` : null;
    const details = [fareText, busText, subwayText].filter(Boolean).join(" · ");

    return `
      <span>
        대중교통 약 ${formatMinutes(commute.commuteTimes.transit)}분
        <small>ODsay 대중교통 기준</small>
        ${details ? `<small>${details}</small>` : ""}
      </span>
    `;
  }

  return `<span class="is-unavailable">대중교통 경로 불러오기 실패</span>`;
}

function renderWalkingCommuteTimeItem(commute) {
  if (commute.isWalkingActualApiValue) {
    const isWalkHardCapExceeded = Number(commute.commuteTimes.walk) > WALK_RECOMMENDATION_MAX_MINUTES;
    return `
      <span>
        도보 약 ${formatMinutes(commute.commuteTimes.walk)}분
        <small>TMAP 보행자 경로 기준</small>
        ${isWalkHardCapExceeded ? `<small>도보 통근에는 부적합</small>` : ""}
      </span>
    `;
  }

  return `<span class="is-unavailable">도보 경로 불러오기 실패</span>`;
}

function renderSelectedCommuteStatus(commute) {
  if (commute.commuteMode === "car") return renderDrivingCommuteStatus(commute);
  if (commute.commuteMode === "transit") return renderTransitCommuteStatus(commute);
  if (commute.commuteMode === "walk") return renderWalkingCommuteStatus(commute);
  return "";
}

function renderDrivingCommuteStatus(commute) {
  if (commute.isDrivingActualApiValue) {
    return `<p class="commute-api-status is-success">자동차 통근시간은 네이버 길찾기 기준입니다.</p>`;
  }

  if (commute.commuteMode !== "car") {
    return "";
  }

  return `
    <p class="commute-api-status is-failed">
      ${commute.drivingMessage ?? "자동차 길찾기 정보를 불러오지 못했습니다."}
      <small>${getDrivingCommuteDebugText(commute)}</small>
    </p>
  `;
}

function renderTransitCommuteStatus(commute) {
  if (commute.isTransitActualApiValue) {
    return `<p class="commute-api-status is-success">대중교통 통근시간은 ODsay 대중교통 기준입니다.</p>`;
  }

  return `
    <p class="commute-api-status is-failed">
      ${commute.transitMessage ?? "대중교통 경로 불러오기 실패"}
      <small>${getTransitCommuteDebugText(commute)}</small>
    </p>
  `;
}

function renderWalkingCommuteStatus(commute) {
  if (commute.isWalkingActualApiValue) {
    return `<p class="commute-api-status is-success">도보 통근시간은 TMAP 보행자 경로 기준입니다.</p>`;
  }

  return `
    <p class="commute-api-status is-failed">
      ${commute.walkingMessage ?? "도보 경로를 불러오지 못했습니다."}
      <small>${getWalkingCommuteDebugText(commute)}</small>
    </p>
  `;
}

function getDrivingCommuteDebugText(commute = {}) {
  if (commute.drivingErrorCode === "MISSING_NAVER_ENV") {
    return "Vercel 환경변수 등록과 재배포가 필요합니다.";
  }

  if (
    commute.drivingErrorCode === "NAVER_DIRECTIONS_UNAUTHORIZED" ||
    commute.drivingErrorCode === "NAVER_DIRECTIONS_FORBIDDEN"
  ) {
    return "네이버 API 권한 또는 등록 도메인을 확인해주세요.";
  }

  if (commute.drivingErrorCode === "NAVER_DIRECTIONS_RATE_LIMITED") {
    return "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (commute.drivingErrorCode) {
    return `오류 코드: ${commute.drivingErrorCode}`;
  }

  return "통근 조건은 자동차 실제 길찾기 기준으로 반영되지 않았습니다.";
}

function getTransitCommuteDebugText(commute = {}) {
  if (commute.transitErrorCode === "MISSING_ODSAY_URI_KEY") {
    return "Vercel 환경변수 PUBLIC_ODSAY_URI_API_KEY 등록과 재배포가 필요합니다.";
  }

  if (
    commute.transitErrorCode === "ODSAY_AUTH_FAILED" ||
    commute.transitErrorCode === "ODSAY_PLATFORM_MISMATCH"
  ) {
    return "ODsay URI/Web Key와 등록 도메인을 확인해주세요.";
  }

  if (commute.transitErrorCode === "ODSAY_RATE_LIMITED") {
    return "ODsay 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (commute.transitErrorCode) {
    return `오류 코드: ${commute.transitErrorCode}`;
  }

  return "통근 조건은 대중교통 실제 경로 기준으로 반영되지 않았습니다.";
}

function getWalkingCommuteDebugText(commute = {}) {
  if (commute.walkingErrorCode === "MISSING_TMAP_WALK_ENV") {
    return "Vercel의 TMAP 도보 appKey 등록과 재배포가 필요합니다.";
  }

  if (
    commute.walkingErrorCode === "TMAP_WALK_AUTH_FAILED" ||
    commute.walkingErrorCode === "TMAP_WALK_FORBIDDEN"
  ) {
    return "TMAP appKey 권한을 확인해주세요.";
  }

  if (commute.walkingErrorCode === "TMAP_WALK_RATE_LIMITED") {
    return "TMAP 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (commute.walkingErrorCode === "TMAP_WALK_INVALID_COORDINATES") {
    return "도보 경로 좌표를 확인해주세요.";
  }

  if (commute.walkingErrorCode === "TMAP_WALK_NO_ROUTE") {
    return "TMAP 도보 경로를 찾지 못했습니다.";
  }

  if (commute.walkingErrorCode) {
    return `오류 코드: ${commute.walkingErrorCode}`;
  }

  return "통근 조건은 도보 실제 경로 기준으로 반영되지 않았습니다.";
}

function renderNaverDirectionsLink(zone, workplace) {
  const directionsUrl = buildNaverDirectionsUrl({
    start: {
      name: formatWorkplaceName(workplace),
      lat: workplace?.lat,
      lng: workplace?.lng
    },
    goal: {
      name: formatLifeZoneDestinationName(zone),
      lat: zone?.centerLat ?? zone?.lat,
      lng: zone?.centerLng ?? zone?.lng
    },
    mode: getEffectiveCommuteMode()
  });

  if (!directionsUrl) return "";

  return `
    <a class="map-link-button" href="${directionsUrl}" target="_blank" rel="noopener noreferrer">
      네이버 길찾기
    </a>
  `;
}

function renderCommuteReadout(workplace) {
  const targetMinutes = normalizeTargetMinutesForCommuteMode(
    state.commutePreference.targetMinutes,
    getEffectiveCommuteMode()
  );

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
          <strong>${targetMinutes}분</strong>
        </div>
        <div>
          <span>주 통근수단</span>
          <strong>${getCommuteModeLabel(getEffectiveCommuteMode())}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderInfraOnlyReadout() {
  return `
    <section class="preference-readout commute-readout is-infra-only" aria-label="통근 조건 미반영 요약">
      <h2>추천 기준</h2>
      <div class="readout-grid">
        <div>
          <span>직장 위치</span>
          <strong>선택안함</strong>
        </div>
        <div>
          <span>통근 조건</span>
          <strong>반영하지 않음</strong>
        </div>
        <div>
          <span>추천 기준</span>
          <strong>인프라 선호도</strong>
        </div>
      </div>
    </section>
  `;
}

function renderResultActions() {
  return `
    <div class="result-actions">
      <button class="secondary-button compact" type="button" data-reset-preferences aria-label="선호도 다시 설정">
        선호도 다시 설정
      </button>
    </div>
  `;
}

function renderMapDataSourceBadge() {
  if (lifeZoneDataset.sourceType !== "generated") return "";

  return `
    <div class="map-data-source-badge-wrap" aria-hidden="true">
      <small class="map-data-source-badge result-data-source-badge" title="제출 전 제거용 데이터 출처 확인 배지">
        실제 전처리 CSV 기반 추천 데이터
      </small>
    </div>
  `;
}

function renderPreferenceReadout() {
  return `
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
  `;
}

function renderCommuteFeasibilityNotice(message) {
  return `
    <div class="commute-feasibility-notice" role="status">
      <strong>통근 조건 안내</strong>
      <span>${message}</span>
    </div>
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

function renderMapEmptyState(bundle = null) {
  const emptyState = bundle?.emptyState;

  if (emptyState) {
    return `
      <div class="map-empty">
        <strong>${emptyState.title}</strong>
        <span>${emptyState.message}</span>
      </div>
    `;
  }

  return `
    <div class="map-empty">
      <strong>표시할 생활권 데이터가 없습니다.</strong>
      <span>공공데이터 전처리 결과를 연결하면 같은 구조로 표시합니다.</span>
    </div>
  `;
}

function renderPanelEmptyState(dataset = lifeZoneDataset, bundle = null) {
  if (bundle?.emptyState) {
    return `
      <div class="panel-empty">
        <strong>${bundle.emptyState.title}</strong>
        <p>${bundle.emptyState.message}</p>
      </div>
    `;
  }

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
      invalidatePendingCalculation();
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
      invalidatePendingCalculation();
      state.validationMessage = "";
      render();
      focusAfterRender(`[data-axis="${axis.id}"][data-importance="${IMPORTANCE_OPTIONS[nextIndex].value}"]`);
    });
  });

  appRoot.querySelector("[data-workplace-city]")?.addEventListener("change", (event) => {
    const city = event.target.value;
    const district = getDefaultDistrict(city);
    const firstEmd = getWorkplaceEmdsBySelectionAndDataMode(city, district, lifeZoneDataset.dataMode)[0] ?? null;

    state.workplaceSelection = { city, district, emdCode: firstEmd?.emdCode ?? "" };
    state.commutePreference = { ...state.commutePreference, workplaceEmdCode: firstEmd?.emdCode ?? "" };
    invalidatePendingCalculation();
    state.validationMessage = "";
    render();
  });

  appRoot.querySelector("[data-workplace-district]")?.addEventListener("change", (event) => {
    const district = event.target.value;
    const firstEmd = getWorkplaceEmdsBySelectionAndDataMode(
      state.workplaceSelection.city,
      district,
      lifeZoneDataset.dataMode
    )[0] ?? null;

    state.workplaceSelection = {
      ...state.workplaceSelection,
      district,
      emdCode: firstEmd?.emdCode ?? ""
    };
    state.commutePreference = { ...state.commutePreference, workplaceEmdCode: firstEmd?.emdCode ?? "" };
    invalidatePendingCalculation();
    state.validationMessage = "";
    render();
  });

  appRoot.querySelector("[data-workplace-emd]")?.addEventListener("change", (event) => {
    const workplaceEmdCode = normalizeWorkplaceEmdCode(event.target.value);
    state.workplaceSelection = {
      ...state.workplaceSelection,
      emdCode: workplaceEmdCode
    };
    state.commutePreference = {
      ...state.commutePreference,
      workplaceEmdCode
    };
    state.recommendationMode = isNoWorkplaceCode(workplaceEmdCode)
      ? RECOMMENDATION_MODES.infraOnly
      : RECOMMENDATION_MODES.commuteBased;
    invalidatePendingCalculation();
    state.validationMessage = "";
    render();
  });

  bindTargetMinuteInputs();
  bindCommuteOptionButtons();

  appRoot.querySelector("[data-calculate]")?.addEventListener("click", async () => {
    if (state.isCalculating) return;

    const calculationRunId = state.calculationRunId + 1;
    state.calculationRunId = calculationRunId;
    const selectedWorkplace = getSelectedWorkplace();
    const recommendationMode = getRecommendationMode();
    state.recommendationMode = recommendationMode;

    if (lifeZoneDataset.isDatasetAvailable === false) {
      state.scoredZones = [];
      state.resultBundle = {
        recommendedZones: [],
        lowZone: null,
        displayZones: []
      };
      state.selectedZoneId = null;
      state.apiSelectionSummary = null;
      state.recommendationMode = recommendationMode;
      state.validationMessage = "";
      state.view = "results";
      render();
      return;
    }

    state.isCalculating = true;
    state.validationMessage = "";
    render();

    try {
      const baseScoredZones = calculateLifeZoneScores(lifeZoneDataset.lifeZones, state.preferences);

      if (recommendationMode === RECOMMENDATION_MODES.infraOnly) {
        const gradedZones = assignRelativeGrades(baseScoredZones);
        const resultBundle = buildInfraOnlyResultBundle(gradedZones);

        if (state.calculationRunId !== calculationRunId) return;

        state.scoredZones = gradedZones;
        state.resultBundle = resultBundle;
        state.apiSelectionSummary = {
          recommendationMode: RECOMMENDATION_MODES.infraOnly,
          selectedCommuteMode: null,
          preApiCandidateCount: gradedZones.length,
          recommendationApiCandidateCount: 0,
          notRecommendedApiCandidateIncluded: false,
          finalApiTargetCount: 0
        };
        state.recommendationMode = RECOMMENDATION_MODES.infraOnly;
        state.selectedZoneId = resultBundle.displayZones[0]?.id ?? null;
        state.validationMessage = "";
        state.view = "results";
        return;
      }

      if (!selectedWorkplace) {
        state.validationMessage = "직장 위치와 통근 조건을 선택해주세요.";
        return;
      }

      const normalizedCommutePreference = getNormalizedCommutePreference();
      const commutePreselection = buildCommuteApiPreselection({
        lifeZones: baseScoredZones,
        workplace: selectedWorkplace,
        commutePreference: normalizedCommutePreference
      });
      logCommuteApiSelectionSummary(commutePreselection.apiSelectionSummary);
      const zonesWithCommuteApiResults = await attachSelectedCommuteApiResultsIfNeeded(
        commutePreselection.preApiZones,
        selectedWorkplace,
        commutePreselection.apiTargetZones
      );
      const commuteScoredZones = applyCommuteToLifeZoneScores(
        zonesWithCommuteApiResults,
        selectedWorkplace,
        normalizedCommutePreference
      );
      const gradedZones = assignRelativeGrades(commuteScoredZones);
      const resultBundle = getTopAndLowZonesWithCommuteFeasibility(gradedZones, {
        recommendedCandidateIds: commutePreselection.recommendationShortlistIds.length > 0
          ? commutePreselection.recommendationShortlistIds
          : null,
        lowZoneId: commutePreselection.notRecommendedZoneId
      });

      if (state.calculationRunId !== calculationRunId) return;

      state.scoredZones = gradedZones;
      state.resultBundle = resultBundle;
      state.apiSelectionSummary = commutePreselection.apiSelectionSummary;
      state.recommendationMode = RECOMMENDATION_MODES.commuteBased;
      state.selectedZoneId = resultBundle.displayZones[0]?.id ?? null;
      state.validationMessage = "";
      state.view = "results";
    } finally {
      if (state.calculationRunId === calculationRunId) {
        state.isCalculating = false;
        render();
      }
    }
  });
}

async function attachSelectedCommuteApiResultsIfNeeded(baseScoredZones, selectedWorkplace, apiTargetZones = baseScoredZones) {
  const commuteMode = getEffectiveCommuteMode();
  const safeApiTargetZones = Array.isArray(apiTargetZones) ? apiTargetZones : [];

  if (shouldFetchDrivingCommute(commuteMode)) {
    const drivingCommuteByZoneId = await fetchDrivingCommuteBatch({
      start: selectedWorkplace,
      lifeZones: safeApiTargetZones
    });

    return baseScoredZones.map((zone) => ({
      ...zone,
      drivingCommute: drivingCommuteByZoneId.get(String(zone.id)) ?? drivingCommuteByZoneId.get(zone.id) ?? null
    }));
  }

  if (shouldFetchOdsayTransit(commuteMode)) {
    const transitCommuteByZoneId = await fetchOdsayTransitCommutes({
      start: selectedWorkplace,
      lifeZones: safeApiTargetZones,
      apiKey: getConfiguredOdsayUriApiKey()
    });

    return baseScoredZones.map((zone) => ({
      ...zone,
      transitCommute: transitCommuteByZoneId.get(String(zone.id)) ?? transitCommuteByZoneId.get(zone.id) ?? null
    }));
  }

  if (shouldFetchWalkingCommute(commuteMode)) {
    const walkingCommuteByZoneId = await fetchWalkingCommuteBatch({
      start: selectedWorkplace,
      lifeZones: safeApiTargetZones
    });

    return baseScoredZones.map((zone) => ({
      ...zone,
      walkingCommute: walkingCommuteByZoneId.get(String(zone.id)) ?? walkingCommuteByZoneId.get(zone.id) ?? null
    }));
  }

  return baseScoredZones;
}

export function buildInfraOnlyResultBundle(scoredLifeZones = []) {
  if (!Array.isArray(scoredLifeZones) || scoredLifeZones.length === 0) {
    return {
      recommendedZones: [],
      lowZone: null,
      displayZones: [],
      recommendationMode: RECOMMENDATION_MODES.infraOnly,
      emptyState: {
        title: "추천할 생활권 데이터가 없습니다.",
        message: "생활권 후보 데이터가 준비되면 인프라 선호도 기반 추천을 다시 확인할 수 있습니다."
      }
    };
  }

  return {
    ...getTopAndLowZones(scoredLifeZones),
    recommendationMode: RECOMMENDATION_MODES.infraOnly,
    scoringBasis: "infrastructure-only"
  };
}

function logCommuteApiSelectionSummary(summary) {
  if (!summary || typeof console === "undefined" || typeof console.info !== "function") return;

  console.info("[commute-api-selection]", {
    selectedCommuteMode: summary.selectedCommuteMode,
    preApiCandidateCount: summary.preApiCandidateCount,
    recommendationApiCandidateCount: summary.recommendationApiCandidateCount,
    notRecommendedApiCandidateIncluded: summary.notRecommendedApiCandidateIncluded,
    finalApiTargetCount: summary.finalApiTargetCount
  });
}

function invalidatePendingCalculation() {
  state.calculationRunId += 1;
  if (state.isCalculating) {
    state.isCalculating = false;
  }
}

function bindTargetMinuteInputs() {
  const rangeInput = appRoot.querySelector("[data-commute-target-range]");
  const displayElement = appRoot.querySelector("[data-commute-target-display]");
  const updateTarget = (value) => {
    const targetMinutes = normalizeTargetMinutesForCommuteMode(value, getEffectiveCommuteMode());

    state.commutePreference = {
      ...state.commutePreference,
      targetMinutes
    };
    invalidatePendingCalculation();
    state.validationMessage = "";
    if (rangeInput) rangeInput.value = String(targetMinutes);
    displayElement?.replaceChildren(`${targetMinutes}분`);
  };

  rangeInput?.addEventListener("input", (event) => updateTarget(event.target.value));
}

function initializeOptionalNaverMap() {
  const fallbackMap = appRoot?.querySelector(".mock-map");
  if (!fallbackMap) return;

  const clientId = getNaverMapClientId();
  if (!clientId) {
    addMapStatusBadge(fallbackMap, "fallback", "기본 지도 표시 중", "실제 지도 연결 전에도 위치 비교가 가능합니다.");
    return;
  }

  const selectedWorkplace = state.recommendationMode === RECOMMENDATION_MODES.infraOnly ? null : getSelectedWorkplace();
  const displayZones = state.resultBundle?.displayZones ?? [];
  const focusSelectedLifeZone = state.shouldFocusSelectedZoneOnMap;
  state.shouldFocusSelectedZoneOnMap = false;
  const mapShell = document.createElement("div");
  mapShell.className = "naver-map-shell is-loading";
  mapShell.innerHTML = `
    <div class="naver-map-canvas" data-naver-map-canvas role="region" aria-label="Naver map"></div>
  `;
  fallbackMap.insertAdjacentElement("beforebegin", mapShell);

  NaverMapView({
    clientId,
    container: mapShell.querySelector("[data-naver-map-canvas]"),
    workplace: selectedWorkplace,
    results: displayZones,
    selectedLifeZoneId: state.selectedZoneId,
    focusSelectedLifeZone,
    onSelectLifeZone: (lifeZoneId) => {
      state.selectedZoneId = lifeZoneId;
      state.shouldFocusSelectedZoneOnMap = true;
      render();
    },
    onError: (error) => showFallbackMapAfterNaverError(mapShell, fallbackMap, error)
  }).then(() => {
    if (!mapShell.isConnected) return;

    mapShell.classList.remove("is-loading");
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
      invalidatePendingCalculation();
      state.validationMessage = "";
      render();
    });
  });

  appRoot.querySelectorAll("[data-commute-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const commuteMode = normalizeCommuteApiMode(button.dataset.commuteMode);
      const targetMinutes = normalizeTargetMinutesForCommuteMode(
        state.commutePreference.targetMinutes,
        commuteMode
      );

      state.commutePreference = {
        ...state.commutePreference,
        commuteMode,
        targetMinutes
      };
      invalidatePendingCalculation();
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
      state.shouldFocusSelectedZoneOnMap = true;
      state.pendingResultScrollZoneId = element.dataset.zoneId;
      render();
    });
    element.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      state.selectedZoneId = element.dataset.zoneId;
      state.shouldFocusSelectedZoneOnMap = true;
      state.pendingResultScrollZoneId = element.dataset.zoneId;
      render();
    });
  });
}

function getSelectedWorkplace() {
  const selectedCode = getSelectedWorkplaceCode();
  if (isNoWorkplaceCode(selectedCode)) return null;

  return findWorkplaceCenterByCode(selectedCode, lifeZoneDataset.dataMode);
}

function getSelectedWorkplaceCode() {
  return normalizeWorkplaceEmdCode(state.commutePreference.workplaceEmdCode || state.workplaceSelection.emdCode);
}

export function normalizeWorkplaceEmdCode(value) {
  const code = String(value ?? "").trim();
  if (!code) return NO_WORKPLACE_ID;

  return code === NO_WORKPLACE_ID || code === "NO_WORKPLACE" ? NO_WORKPLACE_ID : code;
}

function isNoWorkplaceCode(value) {
  return normalizeWorkplaceEmdCode(value) === NO_WORKPLACE_ID;
}

function getRecommendationMode() {
  return getSelectedWorkplace() ? RECOMMENDATION_MODES.commuteBased : RECOMMENDATION_MODES.infraOnly;
}

function getDefaultDistrict(city) {
  return getWorkplaceDistrictsByCityAndDataMode(city, lifeZoneDataset.dataMode)[0] ?? "해당 없음";
}

function createWorkplaceSelection(workplace) {
  return {
    city: workplace?.city ?? "천안시",
    district: workplace?.district ?? "서북구",
    emdCode: workplace?.emdCode ?? ""
  };
}

function ensureValidWorkplaceSelection() {
  const selectedCode = getSelectedWorkplaceCode();

  if (isNoWorkplaceCode(selectedCode)) {
    state.workplaceSelection = {
      ...createWorkplaceSelection(DEFAULT_WORKPLACE),
      emdCode: NO_WORKPLACE_ID
    };
    state.commutePreference = {
      ...state.commutePreference,
      workplaceEmdCode: NO_WORKPLACE_ID
    };
    state.recommendationMode = RECOMMENDATION_MODES.infraOnly;
    return;
  }

  const selectedWorkplace = findWorkplaceCenterByCode(selectedCode, lifeZoneDataset.dataMode);
  const fallbackWorkplace = selectedWorkplace ?? null;

  if (!fallbackWorkplace) {
    state.workplaceSelection = {
      ...createWorkplaceSelection(DEFAULT_WORKPLACE),
      emdCode: NO_WORKPLACE_ID
    };
    state.commutePreference = {
      ...state.commutePreference,
      workplaceEmdCode: NO_WORKPLACE_ID
    };
    state.recommendationMode = RECOMMENDATION_MODES.infraOnly;
    return;
  }

  state.workplaceSelection = createWorkplaceSelection(fallbackWorkplace);
  state.commutePreference = {
    ...state.commutePreference,
    workplaceEmdCode: fallbackWorkplace?.emdCode ?? ""
  };
  state.recommendationMode = RECOMMENDATION_MODES.commuteBased;
}

function getDatasetDetailText() {
  if (lifeZoneDataset.sourceType === "mock") {
    return `가상 생활권 ${lifeZoneDataset.lifeZones.length}개 기준`;
  }

  return `천안·아산 행정동 생활권 ${lifeZoneDataset.lifeZones.length}개 전체 후보 기준`;
}

function getImportanceLabel(importance) {
  return IMPORTANCE_OPTIONS.find((option) => option.value === importance)?.label ?? "보통";
}

function getCommuteModeLabel(mode) {
  const normalizedMode = normalizeCommuteApiMode(mode);
  const selected = COMMUTE_MODE_OPTIONS.find((option) => option.value === normalizedMode);
  return selected?.label ?? COMMUTE_MODE_OPTIONS[0].label;
}

function getEffectiveCommuteMode() {
  return normalizeCommuteApiMode(state.commutePreference.commuteMode);
}

function getNormalizedCommutePreference() {
  const commuteMode = getEffectiveCommuteMode();

  return {
    ...state.commutePreference,
    commuteMode,
    targetMinutes: normalizeTargetMinutesForCommuteMode(state.commutePreference.targetMinutes, commuteMode)
  };
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

function alignPendingResultCardInPanel() {
  const zoneId = state.pendingResultScrollZoneId;
  if (!zoneId) return;

  state.pendingResultScrollZoneId = null;
  requestAnimationFrame(() => {
    const panel = appRoot?.querySelector(".result-panel");
    const selectedCard = appRoot?.querySelector(".zone-card.is-selected");
    if (!panel || !selectedCard) return;

    const panelRect = panel.getBoundingClientRect();
    const cardRect = selectedCard.getBoundingClientRect();
    panel.scrollTo({
      top: panel.scrollTop + cardRect.top - panelRect.top,
      behavior: "auto"
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
    .replace(/실제\s*CSV\s*기준\s*/gi, "")
    .replace(/실제\s*csv\s*기준\s*/g, "")
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

function formatLifeZoneDestinationName(zone = {}) {
  if (zone.name) return zone.name;

  const district = zone.district && zone.district !== "해당 없음" ? ` ${zone.district}` : "";
  const emdName = zone.emdName ?? zone.eupMyeonDong ?? "생활권";

  return `${zone.city ?? ""}${district} ${emdName}`.trim();
}

function formatMinutes(value) {
  return Number.isFinite(value) ? Math.max(1, Math.round(value)) : "-";
}

function formatScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return "-";

  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function getStrongestAxisLabel(zone = {}) {
  const axisScores = zone.axisScores ?? {};
  const axisLabels = {
    transport: "교통 인프라",
    living: "생활 편의 인프라",
    safetyMedical: "안전 의료 인프라"
  };
  const strongestAxis = Object.entries(axisScores)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .sort(([, scoreA], [, scoreB]) => Number(scoreB) - Number(scoreA))[0]?.[0];

  return axisLabels[strongestAxis] ?? "인프라";
}
