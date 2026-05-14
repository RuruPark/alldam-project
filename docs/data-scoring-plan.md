# 생활권 데이터 전처리 및 점수산정 계획

## 1. 현재 단계

- 현재는 UI-first 단계이며, 실제 공공데이터 대신 점수산정 기준을 반영한 전처리 완료 mock 데이터를 사용한다.
- 최종 데이터 전처리 방식은 실제 공공데이터 확보 후 보정할 수 있다.
- 현재 구현의 목적은 UI와 점수산정 구조를 검증하는 것이다.
- mock 데이터는 `src/data/mockLifeZones.js`에 있으며, 시연용 데이터임을 코드 주석으로 명시한다.

## 2. 생활권 단위

- 생활권 단위는 읍·면·동이다.
- 대표 좌표는 가능하면 행정구역 polygon 내부 대표점을 사용한다.
- mock 데이터에서는 생활권별 `lat`/`lng` 좌표를 사용한다.
- 면적은 `areaKm2`로 관리하며, 밀도 지표는 시설 수를 면적으로 나누어 산정한다.

## 3. 활용 예정 공공데이터

교통 인프라:

- 전국 도시철도역사 정보
- 국토교통부 전국 버스정류장 정보

생활 편의 인프라:

- 충청남도 도서관 현황
- 충청남도 작은도서관 현황
- 충청남도 체육관련 비영리법인 현황

치안·의료 인프라:

- 충청남도 약국 현황
- 충청남도 보안등 정보
- 충청남도 안전비상벨 위치 정보
- 충청남도 119안전센터 현황
- 경찰청 전국 지구대·파출소 주소현황

## 4. 전처리 방향

- 주소 기반 데이터는 좌표화한다.
- 시설 point 데이터는 읍·면·동 polygon 내부 포함 여부로 집계한다.
- 거리 기반 지표는 생활권 대표 좌표에서 가장 가까운 시설까지의 거리로 계산한다.
- 밀도 기반 지표는 생활권 내 시설 수 / 면적(km²)로 계산한다.
- 거리값은 가까울수록 높은 점수로 변환한다.
- 밀도값은 p5~p95 기준으로 0~100점 정규화한다.
- 결측값은 데이터 성격에 따라 0, `null`, 중앙값, 또는 `unknown`으로 처리한다.
- 극단값은 percentile clipping을 적용한다.
- 최종 UI에는 원천값 전체를 직접 노출하지 않고 0~100 점수와 설명형 요약을 제공한다.

## 5. 점수산정 산식

### 사용자 중요도 가중치

중요도 계수:

- 낮음: 0.5
- 보통: 1.0
- 높음: 1.5

정규화:

```text
transportWeight = transportCoefficient / (transportCoefficient + livingCoefficient + safetyMedicalCoefficient)
livingWeight = livingCoefficient / (transportCoefficient + livingCoefficient + safetyMedicalCoefficient)
safetyMedicalWeight = safetyMedicalCoefficient / (transportCoefficient + livingCoefficient + safetyMedicalCoefficient)
```

### 거리점수

```text
distanceScore = 100 * max(0, 1 - distanceKm / (2 * standardDistanceKm))
```

- 거리값이 `null`, `undefined`, `NaN`이면 0점이다.
- 기준거리가 0 이하이면 0점이다.
- 결과는 0~100 범위로 보정한다.

### 밀도점수

```text
density = facilityCount / areaKm2
densityScore = 100 * (zoneDensity - p5Density) / (p95Density - p5Density)
clampedDensityScore = min(100, max(0, densityScore))
```

- `areaKm2`가 0 이하이면 밀도는 0으로 처리한다.
- `p95Density`와 `p5Density`가 같으면 모든 값에 50점 또는 0점을 일관되게 적용한다.

### 교통 인프라 점수

```text
railAccessibilityScore = 100 * max(0, 1 - nearestRailDistanceKm / 3.0)
busAccessibilityScore = 100 * max(0, 1 - nearestBusStopDistanceKm / 1.0)
transportDiversityScore = (busWithin500m ? 50 : 0) + (railWithin1_5km ? 50 : 0)

transportScore =
  45 * railAccessibilityScore / 100
  + 45 * busAccessibilityScore / 100
  + 10 * transportDiversityScore / 100
```

### 생활 편의 인프라 점수

```text
nearestLibraryDistanceScore = 100 * max(0, 1 - nearestLibraryDistanceKm / 3.0)
libraryAccessibilityScore = 0.7 * nearestLibraryDistanceScore + 0.3 * libraryDensityScore

nearestSportsInfraDistanceScore = 100 * max(0, 1 - nearestSportsInfraDistanceKm / 3.0)
sportsInfraAccessibilityScore = 0.7 * nearestSportsInfraDistanceScore + 0.3 * sportsInfraDensityScore

livingDiversityScore = 100 * matchedTypeCount / 3

livingScore =
  45 * libraryAccessibilityScore / 100
  + 45 * sportsInfraAccessibilityScore / 100
  + 10 * livingDiversityScore / 100
```

### 치안·의료 인프라 점수

```text
nearestPharmacyDistanceScore = 100 * max(0, 1 - nearestPharmacyDistanceKm / 2.0)
pharmacyAccessibilityScore = 0.7 * nearestPharmacyDistanceScore + 0.3 * pharmacyDensityScore

fire119AccessibilityScore = 100 * max(0, 1 - nearest119CenterDistanceKm / 8.0)
policeSubstationAccessibilityScore = 100 * max(0, 1 - nearestPoliceSubstationDistanceKm / 8.0)

safetyMedicalScore =
  25 * pharmacyAccessibilityScore / 100
  + 20 * streetlightDensityScore / 100
  + 5 * emergencyBellDensityScore / 100
  + 20 * fire119AccessibilityScore / 100
  + 30 * policeSubstationAccessibilityScore / 100
```

### 최종 생활권 적합도 점수

```text
totalScore =
  userTransportWeight * transportScore
  + userLivingWeight * livingScore
  + userSafetyMedicalWeight * safetyMedicalScore
```

### 상대등급 산정 기준

- A: 상위 20%, 매우 적합
- B: 상위 20~40%, 적합
- C: 상위 40~60%, 보통
- D: 상위 60~80%, 다소 부족
- F: 하위 20%, 부적합 또는 개선 필요

등급은 전체 `scoredLifeZones` 기준으로 계산하며, 화면에 표시되는 추천 2개와 보완 필요 1개만으로 재계산하지 않는다.

## 6. 현재 UI 구현과 실제 데이터 적용의 차이

- 현재는 `getLifeZoneDataset()`이 제공하는 mock 데이터 기반이다.
- 실제 서비스에서는 원천 공공데이터를 전처리해 동일한 `LifeZone` 구조로 변환한다.
- UI 컴포넌트는 데이터 출처가 mock인지 실제 공공데이터인지와 무관하게 동일하게 동작해야 한다.
- 현재 저장소 함수는 `mockLifeZones`를 반환하지만, UI는 데이터 저장소를 통해 받은 `lifeZones → calculateLifeZoneScores → assignRelativeGrades → getTopAndLowZones → ResultMap / ResultSidePanel` 흐름을 따른다.

## 7. 추후 확장 방향

- 실제 공공데이터 연동
- 행정동 polygon 기반 공간 집계
- 생활권 군집화
- 인구·이동 데이터 반영
- 교통 API 연계
- LLM 기반 추천 사유 설명 생성
- B2G/B2B 확장
