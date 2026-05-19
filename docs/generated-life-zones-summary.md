# 실제 CSV 기반 생활권 추천 데이터 생성 요약

- 생성 시각: 2026-05-19T01:47:44.830Z
- 입력 CSV 폴더: data\전처리파일(csv)
- 처리 CSV 파일 수: 11
- 주소 기반 처리 파일 수: 10
- 좌표 기반 처리 파일 수: 1
- 생성 생활권 수: 48
- 천안시 생활권 수: 31
- 아산시 생활권 수: 17
- 매칭 성공 row 수: 7467
- 매칭 실패 row 수: 1581
- 리 보조 정보가 있는 생활권 수: 23

## 점수 계산 방식

- 각 인프라 count에 log1p를 적용한 뒤 같은 항목끼리 전체 행정동 기준 min-max 정규화했다.
- 교통 인프라는 버스정류장 70%, 도시철도역사 30%를 반영한다.
- 생활 편의 인프라는 도서관/작은도서관 60%, 체육 관련 시설 40%를 반영한다.
- 치안 의료 인프라는 병원 20%, 약국 20%, 119안전센터 15%, 지구대/파출소 15%, 보안등 15%, 알람벨 10%, 실내구호소 5%를 반영한다.
- baseScore는 교통 35%, 생활 편의 35%, 치안 의료 30%로 계산한다.

## 리 단위 보조 집계

- 주소에 리 정보가 있는 일부 데이터만 riHighlights에 반영했다.
- 리 경계 데이터가 없으므로 지도 polygon은 계속 행정동 단위로 표시한다.
- 결과 카드에는 상위 3개 리 보조 정보만 표시할 수 있게 생성했다.

## 파일별 처리 결과

### 충청남도_119안전센터_현황.csv

- 처리 방식: address
- 추천 축: safetyMedical
- 행 수: 22
- 매칭 성공: 13
- 매칭 실패: 9
- 리 보조 집계 row: 0
- 인코딩: utf-8
- 미매칭 사유: address parse failed or outside target area 9건

### 충청남도_도서관_작은도서관_병합.csv

- 처리 방식: address
- 추천 축: living
- 행 수: 157
- 매칭 성공: 14
- 매칭 실패: 143
- 리 보조 집계 row: 2
- 인코딩: utf-8
- 미매칭 사유: address parse failed or outside target area 143건

### 충청남도_도시철도역사정보.csv

- 처리 방식: address
- 추천 축: traffic
- 행 수: 11
- 매칭 성공: 7
- 매칭 실패: 4
- 리 보조 집계 row: 0
- 인코딩: utf-8
- 미매칭 사유: boundary not found by address 3건, address parse failed or outside target area 1건

### 충청남도_버스정류장_현황.csv

- 처리 방식: coordinate
- 추천 축: traffic
- 행 수: 4917
- 매칭 성공: 4638
- 매칭 실패: 279
- 리 보조 집계 row: 0
- 인코딩: euc-kr
- 미매칭 사유: boundary not found by coordinate 279건

### 충청남도_병원_현황.csv

- 처리 방식: address
- 추천 축: safetyMedical
- 행 수: 591
- 매칭 성공: 418
- 매칭 실패: 173
- 리 보조 집계 row: 0
- 인코딩: utf-8
- 미매칭 사유: boundary not found by address 171건, address parse failed or outside target area 2건

### 충청남도_보안등_현황.csv

- 처리 방식: address
- 추천 축: safetyMedical
- 행 수: 692
- 매칭 성공: 692
- 매칭 실패: 0
- 리 보조 집계 row: 678
- 인코딩: utf-8
- 미매칭 사유: 없음

### 충청남도_실내구호소(지진)_현황.csv

- 처리 방식: address
- 추천 축: safetyMedical
- 행 수: 100
- 매칭 성공: 32
- 매칭 실패: 68
- 리 보조 집계 row: 0
- 인코딩: utf-8
- 미매칭 사유: address parse failed or outside target area 12건, boundary not found by address 56건

### 충청남도_알람벨_현황.csv

- 처리 방식: address
- 추천 축: safetyMedical
- 행 수: 2062
- 매칭 성공: 1378
- 매칭 실패: 684
- 리 보조 집계 row: 613
- 인코딩: utf-8
- 미매칭 사유: boundary not found by address 605건, address parse failed or outside target area 79건

### 충청남도_약국_현황.csv

- 처리 방식: address
- 추천 축: safetyMedical
- 행 수: 442
- 매칭 성공: 254
- 매칭 실패: 188
- 리 보조 집계 row: 1
- 인코딩: utf-8
- 미매칭 사유: address parse failed or outside target area 66건, boundary not found by address 122건

### 충청남도_지구대_파출소_주소_현황.csv

- 처리 방식: address
- 추천 축: safetyMedical
- 행 수: 30
- 매칭 성공: 14
- 매칭 실패: 16
- 리 보조 집계 row: 1
- 인코딩: utf-8
- 미매칭 사유: address parse failed or outside target area 14건, boundary not found by address 2건

### 충청남도_체육관련_비영리법인_현황.csv

- 처리 방식: address
- 추천 축: living
- 행 수: 24
- 매칭 성공: 7
- 매칭 실패: 17
- 리 보조 집계 row: 0
- 인코딩: utf-8
- 미매칭 사유: boundary not found by address 8건, address parse failed or outside target area 9건

