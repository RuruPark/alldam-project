export const generatedLifeZonesMetadata = {
  "generatedAt": "2026-05-19T01:47:44.830Z",
  "inputDir": "data\\전처리파일(csv)",
  "boundarySource": "molit-census-boundary",
  "boundaryFeatureCount": 48,
  "processedCsvFileCount": 11,
  "skippedCsvFileCount": 0,
  "addressBasedFileCount": 10,
  "coordinateBasedFileCount": 1,
  "generatedLifeZoneCount": 48,
  "cheonanLifeZoneCount": 31,
  "asanLifeZoneCount": 17,
  "matchedRows": 7467,
  "unmatchedRows": 1581,
  "zonesWithRiHighlights": 23,
  "maxRiHighlightsPerZone": 3,
  "dataSource": "preprocessed-csv",
  "isGenerated": true,
  "scoreAxisWeights": {
    "traffic": 0.35,
    "living": 0.35,
    "safetyMedical": 0.3
  },
  "infrastructureConfig": [
    {
      "id": "bus_stop",
      "label": "버스정류장",
      "axis": "traffic",
      "matchMethod": "coordinate",
      "weight": 0.7,
      "useRiAggregation": false
    },
    {
      "id": "subway_station",
      "label": "도시철도역사",
      "axis": "traffic",
      "matchMethod": "address",
      "weight": 0.3,
      "useRiAggregation": false
    },
    {
      "id": "library",
      "label": "도서관/작은도서관",
      "axis": "living",
      "matchMethod": "address",
      "weight": 0.6,
      "useRiAggregation": true
    },
    {
      "id": "sports",
      "label": "체육 관련 시설",
      "axis": "living",
      "matchMethod": "address",
      "weight": 0.4,
      "useRiAggregation": false
    },
    {
      "id": "hospital",
      "label": "병원",
      "axis": "safetyMedical",
      "matchMethod": "address",
      "weight": 0.2,
      "useRiAggregation": false
    },
    {
      "id": "pharmacy",
      "label": "약국",
      "axis": "safetyMedical",
      "matchMethod": "address",
      "weight": 0.2,
      "useRiAggregation": true
    },
    {
      "id": "fire_station",
      "label": "119안전센터",
      "axis": "safetyMedical",
      "matchMethod": "address",
      "weight": 0.15,
      "useRiAggregation": false
    },
    {
      "id": "police",
      "label": "지구대/파출소",
      "axis": "safetyMedical",
      "matchMethod": "address",
      "weight": 0.15,
      "useRiAggregation": true
    },
    {
      "id": "security_light",
      "label": "보안등",
      "axis": "safetyMedical",
      "matchMethod": "address",
      "weight": 0.15,
      "useRiAggregation": true
    },
    {
      "id": "emergency_bell",
      "label": "알람벨",
      "axis": "safetyMedical",
      "matchMethod": "address",
      "weight": 0.1,
      "useRiAggregation": true
    },
    {
      "id": "shelter",
      "label": "실내구호소",
      "axis": "safetyMedical",
      "matchMethod": "address",
      "weight": 0.05,
      "useRiAggregation": false
    }
  ]
};

export const generatedLifeZones = [
  {
    "id": "LZ_34040120",
    "name": "아산시 배방읍",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "배방읍",
    "eupMyeonDong": "배방읍",
    "emdCode": "34040120",
    "centerLat": 36.752517,
    "centerLng": 127.074561,
    "lat": 36.752517,
    "lng": 127.074561,
    "includedEmdCodes": [
      "34040120"
    ],
    "trafficInfraScore": 100,
    "livingInfraScore": 60,
    "safetyMedicalScore": 93.8,
    "baseScore": 84.1,
    "axisScores": {
      "transport": 100,
      "living": 60,
      "safetyMedical": 93.8
    },
    "counts": {
      "bus_stop": 337,
      "subway_station": 2,
      "library": 1,
      "sports": 0,
      "hospital": 41,
      "pharmacy": 29,
      "fire_station": 2,
      "police": 2,
      "security_light": 284,
      "emergency_bell": 48,
      "shelter": 3
    },
    "axisCounts": {
      "traffic": 339,
      "living": 1,
      "safetyMedical": 409
    },
    "riHighlights": [
      {
        "riName": "공수리",
        "totalCount": 72,
        "dominantAxis": "safetyMedical",
        "summaryText": "공수리 안전 의료 인프라 72건"
      },
      {
        "riName": "수철리",
        "totalCount": 71,
        "dominantAxis": "safetyMedical",
        "summaryText": "수철리 안전 의료 인프라 71건"
      },
      {
        "riName": "중리",
        "totalCount": 67,
        "dominantAxis": "safetyMedical",
        "summaryText": "중리 안전 의료 인프라 67건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 29,
      "streetlightCount": 284,
      "emergencyBellCount": 48
    },
    "infraSummary": {
      "stations": 2,
      "busStops": 337,
      "libraries": 1,
      "sports": 0,
      "hospitals": 41,
      "pharmacies": 29,
      "streetlights": 284,
      "emergencyBells": 48,
      "shelters": 3,
      "fire119Centers": 2,
      "policeStations": 2
    },
    "description": "아산시 배방읍 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 337건 · 보안등 284건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 337건",
      "보안등 284건",
      "알람벨 48건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012110",
    "name": "천안시 서북구 성환읍",
    "city": "천안시",
    "district": "서북구",
    "emdName": "성환읍",
    "eupMyeonDong": "성환읍",
    "emdCode": "34012110",
    "centerLat": 36.930896,
    "centerLng": 127.128448,
    "lat": 36.930896,
    "lng": 127.128448,
    "includedEmdCodes": [
      "34012110"
    ],
    "trafficInfraScore": 80,
    "livingInfraScore": 85.2,
    "safetyMedicalScore": 58.4,
    "baseScore": 75.3,
    "axisScores": {
      "transport": 80,
      "living": 85.2,
      "safetyMedical": 58.4
    },
    "counts": {
      "bus_stop": 222,
      "subway_station": 1,
      "library": 1,
      "sports": 1,
      "hospital": 11,
      "pharmacy": 12,
      "fire_station": 1,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 90,
      "shelter": 3
    },
    "axisCounts": {
      "traffic": 223,
      "living": 2,
      "safetyMedical": 118
    },
    "riHighlights": [
      {
        "riName": "성환리",
        "totalCount": 29,
        "dominantAxis": "safetyMedical",
        "summaryText": "성환리 안전 의료 인프라 29건"
      },
      {
        "riName": "성월리",
        "totalCount": 16,
        "dominantAxis": "safetyMedical",
        "summaryText": "성월리 안전 의료 인프라 16건"
      },
      {
        "riName": "매주리",
        "totalCount": 13,
        "dominantAxis": "safetyMedical",
        "summaryText": "매주리 안전 의료 인프라 13건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 1,
      "pharmacyCount": 12,
      "streetlightCount": 0,
      "emergencyBellCount": 90
    },
    "infraSummary": {
      "stations": 1,
      "busStops": 222,
      "libraries": 1,
      "sports": 1,
      "hospitals": 11,
      "pharmacies": 12,
      "streetlights": 0,
      "emergencyBells": 90,
      "shelters": 3,
      "fire119Centers": 1,
      "policeStations": 1
    },
    "description": "천안시 서북구 성환읍 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 222건 · 알람벨 90건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 222건",
      "알람벨 90건",
      "약국 12건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012130",
    "name": "천안시 서북구 직산읍",
    "city": "천안시",
    "district": "서북구",
    "emdName": "직산읍",
    "eupMyeonDong": "직산읍",
    "emdCode": "34012130",
    "centerLat": 36.889847,
    "centerLng": 127.138149,
    "lat": 36.889847,
    "lng": 127.138149,
    "includedEmdCodes": [
      "34012130"
    ],
    "trafficInfraScore": 64.2,
    "livingInfraScore": 85.2,
    "safetyMedicalScore": 47.9,
    "baseScore": 66.7,
    "axisScores": {
      "transport": 64.2,
      "living": 85.2,
      "safetyMedical": 47.9
    },
    "counts": {
      "bus_stop": 106,
      "subway_station": 1,
      "library": 1,
      "sports": 1,
      "hospital": 8,
      "pharmacy": 12,
      "fire_station": 2,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 56,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 107,
      "living": 2,
      "safetyMedical": 78
    },
    "riHighlights": [
      {
        "riName": "삼은리",
        "totalCount": 19,
        "dominantAxis": "safetyMedical",
        "summaryText": "삼은리 안전 의료 인프라 19건"
      },
      {
        "riName": "모시리",
        "totalCount": 8,
        "dominantAxis": "safetyMedical",
        "summaryText": "모시리 안전 의료 인프라 8건"
      },
      {
        "riName": "군동리",
        "totalCount": 7,
        "dominantAxis": "safetyMedical",
        "summaryText": "군동리 안전 의료 인프라 7건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 1,
      "pharmacyCount": 12,
      "streetlightCount": 0,
      "emergencyBellCount": 56
    },
    "infraSummary": {
      "stations": 1,
      "busStops": 106,
      "libraries": 1,
      "sports": 1,
      "hospitals": 8,
      "pharmacies": 12,
      "streetlights": 0,
      "emergencyBells": 56,
      "shelters": 0,
      "fire119Centers": 2,
      "policeStations": 0
    },
    "description": "천안시 서북구 직산읍 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 106건 · 알람벨 56건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 106건",
      "알람벨 56건",
      "약국 12건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040330",
    "name": "아산시 탕정면",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "탕정면",
    "eupMyeonDong": "탕정면",
    "emdCode": "34040330",
    "centerLat": 36.807801,
    "centerLng": 127.066646,
    "lat": 36.807801,
    "lng": 127.066646,
    "includedEmdCodes": [
      "34040330"
    ],
    "trafficInfraScore": 68.2,
    "livingInfraScore": 60,
    "safetyMedicalScore": 50.4,
    "baseScore": 60,
    "axisScores": {
      "transport": 68.2,
      "living": 60,
      "safetyMedical": 50.4
    },
    "counts": {
      "bus_stop": 128,
      "subway_station": 1,
      "library": 1,
      "sports": 0,
      "hospital": 34,
      "pharmacy": 13,
      "fire_station": 1,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 37,
      "shelter": 1
    },
    "axisCounts": {
      "traffic": 129,
      "living": 1,
      "safetyMedical": 86
    },
    "riHighlights": [
      {
        "riName": "매곡리",
        "totalCount": 31,
        "dominantAxis": "safetyMedical",
        "summaryText": "매곡리 안전 의료 인프라 31건"
      },
      {
        "riName": "갈산리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "갈산리 안전 의료 인프라 2건"
      },
      {
        "riName": "동산리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "동산리 안전 의료 인프라 2건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 13,
      "streetlightCount": 0,
      "emergencyBellCount": 37
    },
    "infraSummary": {
      "stations": 1,
      "busStops": 128,
      "libraries": 1,
      "sports": 0,
      "hospitals": 34,
      "pharmacies": 13,
      "streetlights": 0,
      "emergencyBells": 37,
      "shelters": 1,
      "fire119Centers": 1,
      "policeStations": 0
    },
    "description": "아산시 탕정면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 128건 · 알람벨 37건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 128건",
      "알람벨 37건",
      "병원 34건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040350",
    "name": "아산시 둔포면",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "둔포면",
    "eupMyeonDong": "둔포면",
    "emdCode": "34040350",
    "centerLat": 36.90687,
    "centerLng": 127.039842,
    "lat": 36.90687,
    "lng": 127.039842,
    "includedEmdCodes": [
      "34040350"
    ],
    "trafficInfraScore": 52.9,
    "livingInfraScore": 85.2,
    "safetyMedicalScore": 37.5,
    "baseScore": 59.6,
    "axisScores": {
      "transport": 52.9,
      "living": 85.2,
      "safetyMedical": 37.5
    },
    "counts": {
      "bus_stop": 151,
      "subway_station": 0,
      "library": 1,
      "sports": 1,
      "hospital": 10,
      "pharmacy": 8,
      "fire_station": 0,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 8,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 151,
      "living": 2,
      "safetyMedical": 27
    },
    "riHighlights": [
      {
        "riName": "둔포리",
        "totalCount": 4,
        "dominantAxis": "safetyMedical",
        "summaryText": "둔포리 안전 의료 인프라 4건"
      },
      {
        "riName": "석곡리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "석곡리 안전 의료 인프라 2건"
      },
      {
        "riName": "산전리",
        "totalCount": 1,
        "dominantAxis": "safetyMedical",
        "summaryText": "산전리 안전 의료 인프라 1건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 1,
      "pharmacyCount": 8,
      "streetlightCount": 0,
      "emergencyBellCount": 8
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 151,
      "libraries": 1,
      "sports": 1,
      "hospitals": 10,
      "pharmacies": 8,
      "streetlights": 0,
      "emergencyBells": 8,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 1
    },
    "description": "아산시 둔포면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 151건 · 병원 10건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 151건",
      "병원 10건",
      "약국 8건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011110",
    "name": "천안시 동남구 목천읍",
    "city": "천안시",
    "district": "동남구",
    "emdName": "목천읍",
    "eupMyeonDong": "목천읍",
    "emdCode": "34011110",
    "centerLat": 36.788657,
    "centerLng": 127.208366,
    "lat": 36.788657,
    "lng": 127.208366,
    "includedEmdCodes": [
      "34011110"
    ],
    "trafficInfraScore": 54,
    "livingInfraScore": 60,
    "safetyMedicalScore": 62.1,
    "baseScore": 58.5,
    "axisScores": {
      "transport": 54,
      "living": 60,
      "safetyMedical": 62.1
    },
    "counts": {
      "bus_stop": 160,
      "subway_station": 0,
      "library": 1,
      "sports": 0,
      "hospital": 5,
      "pharmacy": 5,
      "fire_station": 1,
      "police": 1,
      "security_light": 92,
      "emergency_bell": 44,
      "shelter": 4
    },
    "axisCounts": {
      "traffic": 160,
      "living": 1,
      "safetyMedical": 152
    },
    "riHighlights": [
      {
        "riName": "동평리",
        "totalCount": 50,
        "dominantAxis": "safetyMedical",
        "summaryText": "동평리 안전 의료 인프라 50건"
      },
      {
        "riName": "삼성리",
        "totalCount": 26,
        "dominantAxis": "safetyMedical",
        "summaryText": "삼성리 안전 의료 인프라 26건"
      },
      {
        "riName": "동리",
        "totalCount": 24,
        "dominantAxis": "safetyMedical",
        "summaryText": "동리 안전 의료 인프라 24건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 5,
      "streetlightCount": 92,
      "emergencyBellCount": 44
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 160,
      "libraries": 1,
      "sports": 0,
      "hospitals": 5,
      "pharmacies": 5,
      "streetlights": 92,
      "emergencyBells": 44,
      "shelters": 4,
      "fire119Centers": 1,
      "policeStations": 1
    },
    "description": "천안시 동남구 목천읍 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 안전 의료 점수가 높은 편입니다.",
      "버스정류장 160건 · 보안등 92건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "교통 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 160건",
      "보안등 92건",
      "알람벨 44건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012120",
    "name": "천안시 서북구 성거읍",
    "city": "천안시",
    "district": "서북구",
    "emdName": "성거읍",
    "eupMyeonDong": "성거읍",
    "emdCode": "34012120",
    "centerLat": 36.876905,
    "centerLng": 127.190716,
    "lat": 36.876905,
    "lng": 127.190716,
    "includedEmdCodes": [
      "34012120"
    ],
    "trafficInfraScore": 49.3,
    "livingInfraScore": 60,
    "safetyMedicalScore": 50.3,
    "baseScore": 53.3,
    "axisScores": {
      "transport": 49.3,
      "living": 60,
      "safetyMedical": 50.3
    },
    "counts": {
      "bus_stop": 128,
      "subway_station": 0,
      "library": 1,
      "sports": 0,
      "hospital": 6,
      "pharmacy": 4,
      "fire_station": 1,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 58,
      "shelter": 4
    },
    "axisCounts": {
      "traffic": 128,
      "living": 1,
      "safetyMedical": 74
    },
    "riHighlights": [
      {
        "riName": "천흥리",
        "totalCount": 12,
        "dominantAxis": "safetyMedical",
        "summaryText": "천흥리 안전 의료 인프라 12건"
      },
      {
        "riName": "송남리",
        "totalCount": 10,
        "dominantAxis": "safetyMedical",
        "summaryText": "송남리 안전 의료 인프라 10건"
      },
      {
        "riName": "석교리",
        "totalCount": 6,
        "dominantAxis": "safetyMedical",
        "summaryText": "석교리 안전 의료 인프라 6건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 4,
      "streetlightCount": 0,
      "emergencyBellCount": 58
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 128,
      "libraries": 1,
      "sports": 0,
      "hospitals": 6,
      "pharmacies": 4,
      "streetlights": 0,
      "emergencyBells": 58,
      "shelters": 4,
      "fire119Centers": 1,
      "policeStations": 1
    },
    "description": "천안시 서북구 성거읍 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 128건 · 알람벨 58건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "교통 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 128건",
      "알람벨 58건",
      "병원 6건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012310",
    "name": "천안시 서북구 입장면",
    "city": "천안시",
    "district": "서북구",
    "emdName": "입장면",
    "eupMyeonDong": "입장면",
    "emdCode": "34012310",
    "centerLat": 36.914262,
    "centerLng": 127.228826,
    "lat": 36.914262,
    "lng": 127.228826,
    "includedEmdCodes": [
      "34012310"
    ],
    "trafficInfraScore": 51.8,
    "livingInfraScore": 60,
    "safetyMedicalScore": 46.6,
    "baseScore": 53.1,
    "axisScores": {
      "transport": 51.8,
      "living": 60,
      "safetyMedical": 46.6
    },
    "counts": {
      "bus_stop": 144,
      "subway_station": 0,
      "library": 1,
      "sports": 0,
      "hospital": 4,
      "pharmacy": 5,
      "fire_station": 1,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 49,
      "shelter": 1
    },
    "axisCounts": {
      "traffic": 144,
      "living": 1,
      "safetyMedical": 61
    },
    "riHighlights": [
      {
        "riName": "하장리",
        "totalCount": 17,
        "dominantAxis": "safetyMedical",
        "summaryText": "하장리 안전 의료 인프라 17건"
      },
      {
        "riName": "연곡리",
        "totalCount": 4,
        "dominantAxis": "safetyMedical",
        "summaryText": "연곡리 안전 의료 인프라 4건"
      },
      {
        "riName": "기로리",
        "totalCount": 3,
        "dominantAxis": "safetyMedical",
        "summaryText": "기로리 안전 의료 인프라 3건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 5,
      "streetlightCount": 0,
      "emergencyBellCount": 49
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 144,
      "libraries": 1,
      "sports": 0,
      "hospitals": 4,
      "pharmacies": 5,
      "streetlights": 0,
      "emergencyBells": 49,
      "shelters": 1,
      "fire119Centers": 1,
      "policeStations": 1
    },
    "description": "천안시 서북구 입장면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 144건 · 알람벨 49건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 144건",
      "알람벨 49건",
      "약국 5건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011360",
    "name": "천안시 동남구 병천면",
    "city": "천안시",
    "district": "동남구",
    "emdName": "병천면",
    "eupMyeonDong": "병천면",
    "emdCode": "34011360",
    "centerLat": 36.79178,
    "centerLng": 127.306714,
    "lat": 36.79178,
    "lng": 127.306714,
    "includedEmdCodes": [
      "34011360"
    ],
    "trafficInfraScore": 47.9,
    "livingInfraScore": 60,
    "safetyMedicalScore": 41.2,
    "baseScore": 50.1,
    "axisScores": {
      "transport": 47.9,
      "living": 60,
      "safetyMedical": 41.2
    },
    "counts": {
      "bus_stop": 120,
      "subway_station": 0,
      "library": 1,
      "sports": 0,
      "hospital": 4,
      "pharmacy": 5,
      "fire_station": 1,
      "police": 0,
      "security_light": 16,
      "emergency_bell": 25,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 120,
      "living": 1,
      "safetyMedical": 51
    },
    "riHighlights": [
      {
        "riName": "봉항리",
        "totalCount": 12,
        "dominantAxis": "safetyMedical",
        "summaryText": "봉항리 안전 의료 인프라 12건"
      },
      {
        "riName": "병천리",
        "totalCount": 11,
        "dominantAxis": "safetyMedical",
        "summaryText": "병천리 안전 의료 인프라 11건"
      },
      {
        "riName": "도원리",
        "totalCount": 5,
        "dominantAxis": "safetyMedical",
        "summaryText": "도원리 안전 의료 인프라 5건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 5,
      "streetlightCount": 16,
      "emergencyBellCount": 25
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 120,
      "libraries": 1,
      "sports": 0,
      "hospitals": 4,
      "pharmacies": 5,
      "streetlights": 16,
      "emergencyBells": 25,
      "shelters": 0,
      "fire119Centers": 1,
      "policeStations": 0
    },
    "description": "천안시 동남구 병천면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 120건 · 알람벨 25건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 120건",
      "알람벨 25건",
      "보안등 16건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011310",
    "name": "천안시 동남구 풍세면",
    "city": "천안시",
    "district": "동남구",
    "emdName": "풍세면",
    "eupMyeonDong": "풍세면",
    "emdCode": "34011310",
    "centerLat": 36.737078,
    "centerLng": 127.123465,
    "lat": 36.737078,
    "lng": 127.123465,
    "includedEmdCodes": [
      "34011310"
    ],
    "trafficInfraScore": 45.7,
    "livingInfraScore": 60,
    "safetyMedicalScore": 33.8,
    "baseScore": 47.1,
    "axisScores": {
      "transport": 45.7,
      "living": 60,
      "safetyMedical": 33.8
    },
    "counts": {
      "bus_stop": 108,
      "subway_station": 0,
      "library": 1,
      "sports": 0,
      "hospital": 1,
      "pharmacy": 4,
      "fire_station": 1,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 45,
      "shelter": 3
    },
    "axisCounts": {
      "traffic": 108,
      "living": 1,
      "safetyMedical": 54
    },
    "riHighlights": [
      {
        "riName": "풍서리",
        "totalCount": 13,
        "dominantAxis": "safetyMedical",
        "summaryText": "풍서리 안전 의료 인프라 13건"
      },
      {
        "riName": "용정리",
        "totalCount": 10,
        "dominantAxis": "safetyMedical",
        "summaryText": "용정리 안전 의료 인프라 10건"
      },
      {
        "riName": "남관리",
        "totalCount": 8,
        "dominantAxis": "safetyMedical",
        "summaryText": "남관리 안전 의료 인프라 8건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 4,
      "streetlightCount": 0,
      "emergencyBellCount": 45
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 108,
      "libraries": 1,
      "sports": 0,
      "hospitals": 1,
      "pharmacies": 4,
      "streetlights": 0,
      "emergencyBells": 45,
      "shelters": 3,
      "fire119Centers": 1,
      "policeStations": 0
    },
    "description": "천안시 동남구 풍세면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 108건 · 알람벨 45건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 108건",
      "알람벨 45건",
      "약국 4건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011590",
    "name": "천안시 동남구 신안동",
    "city": "천안시",
    "district": "동남구",
    "emdName": "신안동",
    "eupMyeonDong": "신안동",
    "emdCode": "34011590",
    "centerLat": 36.833452,
    "centerLng": 127.180821,
    "lat": 36.833452,
    "lng": 127.180821,
    "includedEmdCodes": [
      "34011590"
    ],
    "trafficInfraScore": 39.6,
    "livingInfraScore": 40,
    "safetyMedicalScore": 53.5,
    "baseScore": 43.9,
    "axisScores": {
      "transport": 39.6,
      "living": 40,
      "safetyMedical": 53.5
    },
    "counts": {
      "bus_stop": 81,
      "subway_station": 0,
      "library": 0,
      "sports": 2,
      "hospital": 63,
      "pharmacy": 15,
      "fire_station": 0,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 84,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 81,
      "living": 2,
      "safetyMedical": 163
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 2,
      "pharmacyCount": 15,
      "streetlightCount": 0,
      "emergencyBellCount": 84
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 81,
      "libraries": 0,
      "sports": 2,
      "hospitals": 63,
      "pharmacies": 15,
      "streetlights": 0,
      "emergencyBells": 84,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 1
    },
    "description": "천안시 동남구 신안동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 안전 의료 점수가 높은 편입니다.",
      "알람벨 84건 · 버스정류장 81건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "교통 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "알람벨 84건",
      "버스정류장 81건",
      "병원 63건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011320",
    "name": "천안시 동남구 광덕면",
    "city": "천안시",
    "district": "동남구",
    "emdName": "광덕면",
    "eupMyeonDong": "광덕면",
    "emdCode": "34011320",
    "centerLat": 36.671057,
    "centerLng": 127.086244,
    "lat": 36.671057,
    "lng": 127.086244,
    "includedEmdCodes": [
      "34011320"
    ],
    "trafficInfraScore": 44.2,
    "livingInfraScore": 60,
    "safetyMedicalScore": 21.6,
    "baseScore": 43,
    "axisScores": {
      "transport": 44.2,
      "living": 60,
      "safetyMedical": 21.6
    },
    "counts": {
      "bus_stop": 101,
      "subway_station": 0,
      "library": 1,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 272,
      "emergency_bell": 28,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 101,
      "living": 1,
      "safetyMedical": 300
    },
    "riHighlights": [
      {
        "riName": "광덕리",
        "totalCount": 98,
        "dominantAxis": "safetyMedical",
        "summaryText": "광덕리 안전 의료 인프라 98건"
      },
      {
        "riName": "매당리",
        "totalCount": 62,
        "dominantAxis": "safetyMedical",
        "summaryText": "매당리 안전 의료 인프라 62건"
      },
      {
        "riName": "대덕리",
        "totalCount": 36,
        "dominantAxis": "safetyMedical",
        "summaryText": "대덕리 안전 의료 인프라 36건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 272,
      "emergencyBellCount": 28
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 101,
      "libraries": 1,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 272,
      "emergencyBells": 28,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 광덕면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "보안등 272건 · 버스정류장 101건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "보안등 272건",
      "버스정류장 101건",
      "알람벨 28건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011340",
    "name": "천안시 동남구 성남면",
    "city": "천안시",
    "district": "동남구",
    "emdName": "성남면",
    "eupMyeonDong": "성남면",
    "emdCode": "34011340",
    "centerLat": 36.729221,
    "centerLng": 127.239406,
    "lat": 36.729221,
    "lng": 127.239406,
    "includedEmdCodes": [
      "34011340"
    ],
    "trafficInfraScore": 43.8,
    "livingInfraScore": 60,
    "safetyMedicalScore": 17.5,
    "baseScore": 41.6,
    "axisScores": {
      "transport": 43.8,
      "living": 60,
      "safetyMedical": 17.5
    },
    "counts": {
      "bus_stop": 99,
      "subway_station": 0,
      "library": 1,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 25,
      "emergency_bell": 27,
      "shelter": 1
    },
    "axisCounts": {
      "traffic": 99,
      "living": 1,
      "safetyMedical": 53
    },
    "riHighlights": [
      {
        "riName": "대화리",
        "totalCount": 15,
        "dominantAxis": "safetyMedical",
        "summaryText": "대화리 안전 의료 인프라 15건"
      },
      {
        "riName": "대흥리",
        "totalCount": 14,
        "dominantAxis": "safetyMedical",
        "summaryText": "대흥리 안전 의료 인프라 14건"
      },
      {
        "riName": "봉양리",
        "totalCount": 5,
        "dominantAxis": "safetyMedical",
        "summaryText": "봉양리 안전 의료 인프라 5건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 25,
      "emergencyBellCount": 27
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 99,
      "libraries": 1,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 25,
      "emergencyBells": 27,
      "shelters": 1,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 성남면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 99건 · 알람벨 27건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 99건",
      "알람벨 27건",
      "보안등 25건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040400",
    "name": "아산시 신창면",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "신창면",
    "eupMyeonDong": "신창면",
    "emdCode": "34040400",
    "centerLat": 36.782613,
    "centerLng": 126.930551,
    "lat": 36.782613,
    "lng": 126.930551,
    "includedEmdCodes": [
      "34040400"
    ],
    "trafficInfraScore": 76.8,
    "livingInfraScore": 0,
    "safetyMedicalScore": 48.3,
    "baseScore": 41.4,
    "axisScores": {
      "transport": 76.8,
      "living": 0,
      "safetyMedical": 48.3
    },
    "counts": {
      "bus_stop": 191,
      "subway_station": 1,
      "library": 0,
      "sports": 0,
      "hospital": 6,
      "pharmacy": 5,
      "fire_station": 1,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 17,
      "shelter": 3
    },
    "axisCounts": {
      "traffic": 192,
      "living": 0,
      "safetyMedical": 33
    },
    "riHighlights": [
      {
        "riName": "읍내리",
        "totalCount": 9,
        "dominantAxis": "safetyMedical",
        "summaryText": "읍내리 안전 의료 인프라 9건"
      },
      {
        "riName": "남성리",
        "totalCount": 4,
        "dominantAxis": "safetyMedical",
        "summaryText": "남성리 안전 의료 인프라 4건"
      },
      {
        "riName": "오목리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "오목리 안전 의료 인프라 2건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 5,
      "streetlightCount": 0,
      "emergencyBellCount": 17
    },
    "infraSummary": {
      "stations": 1,
      "busStops": 191,
      "libraries": 0,
      "sports": 0,
      "hospitals": 6,
      "pharmacies": 5,
      "streetlights": 0,
      "emergencyBells": 17,
      "shelters": 3,
      "fire119Centers": 1,
      "policeStations": 1
    },
    "description": "아산시 신창면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 191건 · 알람벨 17건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 191건",
      "알람벨 17건",
      "병원 6건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040110",
    "name": "아산시 염치읍",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "염치읍",
    "eupMyeonDong": "염치읍",
    "emdCode": "34040110",
    "centerLat": 36.821639,
    "centerLng": 126.977058,
    "lat": 36.821639,
    "lng": 126.977058,
    "includedEmdCodes": [
      "34040110"
    ],
    "trafficInfraScore": 48.1,
    "livingInfraScore": 60,
    "safetyMedicalScore": 9.3,
    "baseScore": 40.6,
    "axisScores": {
      "transport": 48.1,
      "living": 60,
      "safetyMedical": 9.3
    },
    "counts": {
      "bus_stop": 121,
      "subway_station": 0,
      "library": 1,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 1,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 4,
      "shelter": 1
    },
    "axisCounts": {
      "traffic": 121,
      "living": 1,
      "safetyMedical": 6
    },
    "riHighlights": [
      {
        "riName": "송곡리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "송곡리 안전 의료 인프라 2건"
      },
      {
        "riName": "염성리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "염성리 안전 의료 인프라 2건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 1,
      "streetlightCount": 0,
      "emergencyBellCount": 4
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 121,
      "libraries": 1,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 1,
      "streetlights": 0,
      "emergencyBells": 4,
      "shelters": 1,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "아산시 염치읍 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 121건 · 알람벨 4건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 121건",
      "알람벨 4건",
      "도서관/작은도서관 1건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011330",
    "name": "천안시 동남구 북면",
    "city": "천안시",
    "district": "동남구",
    "emdName": "북면",
    "eupMyeonDong": "북면",
    "emdCode": "34011330",
    "centerLat": 36.82684,
    "centerLng": 127.269045,
    "lat": 36.82684,
    "lng": 127.269045,
    "includedEmdCodes": [
      "34011330"
    ],
    "trafficInfraScore": 43.2,
    "livingInfraScore": 60,
    "safetyMedicalScore": 14.8,
    "baseScore": 40.6,
    "axisScores": {
      "transport": 43.2,
      "living": 60,
      "safetyMedical": 14.8
    },
    "counts": {
      "bus_stop": 96,
      "subway_station": 0,
      "library": 1,
      "sports": 0,
      "hospital": 1,
      "pharmacy": 2,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 13,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 96,
      "living": 1,
      "safetyMedical": 16
    },
    "riHighlights": [
      {
        "riName": "연춘리",
        "totalCount": 3,
        "dominantAxis": "safetyMedical",
        "summaryText": "연춘리 안전 의료 인프라 3건"
      },
      {
        "riName": "납안리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "납안리 안전 의료 인프라 2건"
      },
      {
        "riName": "용암리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "용암리 안전 의료 인프라 2건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 1,
      "sportsInfraCount": 0,
      "pharmacyCount": 2,
      "streetlightCount": 0,
      "emergencyBellCount": 13
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 96,
      "libraries": 1,
      "sports": 0,
      "hospitals": 1,
      "pharmacies": 2,
      "streetlights": 0,
      "emergencyBells": 13,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 북면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 생활 편의 점수가 높은 편입니다.",
      "버스정류장 96건 · 알람벨 13건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 96건",
      "알람벨 13건",
      "약국 2건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012580",
    "name": "천안시 서북구 백석동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "백석동",
    "eupMyeonDong": "백석동",
    "emdCode": "34012580",
    "centerLat": 36.827053,
    "centerLng": 127.115699,
    "lat": 36.827053,
    "lng": 127.115699,
    "includedEmdCodes": [
      "34012580"
    ],
    "trafficInfraScore": 36.2,
    "livingInfraScore": 25.2,
    "safetyMedicalScore": 34.2,
    "baseScore": 31.8,
    "axisScores": {
      "transport": 36.2,
      "living": 25.2,
      "safetyMedical": 34.2
    },
    "counts": {
      "bus_stop": 69,
      "subway_station": 0,
      "library": 0,
      "sports": 1,
      "hospital": 15,
      "pharmacy": 9,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 61,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 69,
      "living": 1,
      "safetyMedical": 85
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 1,
      "pharmacyCount": 9,
      "streetlightCount": 0,
      "emergencyBellCount": 61
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 69,
      "libraries": 0,
      "sports": 1,
      "hospitals": 15,
      "pharmacies": 9,
      "streetlights": 0,
      "emergencyBells": 61,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 백석동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 69건 · 알람벨 61건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 69건",
      "알람벨 61건",
      "병원 15건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040310",
    "name": "아산시 송악면",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "송악면",
    "eupMyeonDong": "송악면",
    "emdCode": "34040310",
    "centerLat": 36.697336,
    "centerLng": 126.994176,
    "lat": 36.697336,
    "lng": 126.994176,
    "includedEmdCodes": [
      "34040310"
    ],
    "trafficInfraScore": 53.8,
    "livingInfraScore": 25.2,
    "safetyMedicalScore": 12.1,
    "baseScore": 31.3,
    "axisScores": {
      "transport": 53.8,
      "living": 25.2,
      "safetyMedical": 12.1
    },
    "counts": {
      "bus_stop": 158,
      "subway_station": 0,
      "library": 0,
      "sports": 1,
      "hospital": 1,
      "pharmacy": 1,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 3,
      "shelter": 1
    },
    "axisCounts": {
      "traffic": 158,
      "living": 1,
      "safetyMedical": 6
    },
    "riHighlights": [
      {
        "riName": "역촌리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "역촌리 안전 의료 인프라 2건"
      },
      {
        "riName": "송학리",
        "totalCount": 1,
        "dominantAxis": "safetyMedical",
        "summaryText": "송학리 안전 의료 인프라 1건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 1,
      "pharmacyCount": 1,
      "streetlightCount": 0,
      "emergencyBellCount": 3
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 158,
      "libraries": 0,
      "sports": 1,
      "hospitals": 1,
      "pharmacies": 1,
      "streetlights": 0,
      "emergencyBells": 3,
      "shelters": 1,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "아산시 송악면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 158건 · 알람벨 3건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "안전 의료 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 158건",
      "알람벨 3건",
      "체육 관련 시설 1건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040390",
    "name": "아산시 도고면",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "도고면",
    "eupMyeonDong": "도고면",
    "emdCode": "34040390",
    "centerLat": 36.737143,
    "centerLng": 126.896313,
    "lat": 36.737143,
    "lng": 126.896313,
    "includedEmdCodes": [
      "34040390"
    ],
    "trafficInfraScore": 62.8,
    "livingInfraScore": 0,
    "safetyMedicalScore": 26.3,
    "baseScore": 29.9,
    "axisScores": {
      "transport": 62.8,
      "living": 0,
      "safetyMedical": 26.3
    },
    "counts": {
      "bus_stop": 241,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 1,
      "pharmacy": 2,
      "fire_station": 0,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 6,
      "shelter": 2
    },
    "axisCounts": {
      "traffic": 241,
      "living": 0,
      "safetyMedical": 12
    },
    "riHighlights": [
      {
        "riName": "시전리",
        "totalCount": 4,
        "dominantAxis": "safetyMedical",
        "summaryText": "시전리 안전 의료 인프라 4건"
      },
      {
        "riName": "신언리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "신언리 안전 의료 인프라 2건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 2,
      "streetlightCount": 0,
      "emergencyBellCount": 6
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 241,
      "libraries": 0,
      "sports": 0,
      "hospitals": 1,
      "pharmacies": 2,
      "streetlights": 0,
      "emergencyBells": 6,
      "shelters": 2,
      "fire119Centers": 0,
      "policeStations": 1
    },
    "description": "아산시 도고면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 241건 · 알람벨 6건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 241건",
      "알람벨 6건",
      "약국 2건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040370",
    "name": "아산시 인주면",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "인주면",
    "eupMyeonDong": "인주면",
    "emdCode": "34040370",
    "centerLat": 36.863079,
    "centerLng": 126.886282,
    "lat": 36.863079,
    "lng": 126.886282,
    "includedEmdCodes": [
      "34040370"
    ],
    "trafficInfraScore": 49.6,
    "livingInfraScore": 0,
    "safetyMedicalScore": 39.4,
    "baseScore": 29.2,
    "axisScores": {
      "transport": 49.6,
      "living": 0,
      "safetyMedical": 39.4
    },
    "counts": {
      "bus_stop": 130,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 2,
      "pharmacy": 4,
      "fire_station": 1,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 3,
      "shelter": 2
    },
    "axisCounts": {
      "traffic": 130,
      "living": 0,
      "safetyMedical": 13
    },
    "riHighlights": [
      {
        "riName": "금성리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "금성리 안전 의료 인프라 2건"
      },
      {
        "riName": "신성리",
        "totalCount": 1,
        "dominantAxis": "safetyMedical",
        "summaryText": "신성리 안전 의료 인프라 1건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 4,
      "streetlightCount": 0,
      "emergencyBellCount": 3
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 130,
      "libraries": 0,
      "sports": 0,
      "hospitals": 2,
      "pharmacies": 4,
      "streetlights": 0,
      "emergencyBells": 3,
      "shelters": 2,
      "fire119Centers": 1,
      "policeStations": 1
    },
    "description": "아산시 인주면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 130건 · 약국 4건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 130건",
      "약국 4건",
      "알람벨 3건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040340",
    "name": "아산시 음봉면",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "음봉면",
    "eupMyeonDong": "음봉면",
    "emdCode": "34040340",
    "centerLat": 36.865164,
    "centerLng": 127.0393,
    "lat": 36.865164,
    "lng": 127.0393,
    "includedEmdCodes": [
      "34040340"
    ],
    "trafficInfraScore": 57.2,
    "livingInfraScore": 0,
    "safetyMedicalScore": 29.7,
    "baseScore": 28.9,
    "axisScores": {
      "transport": 57.2,
      "living": 0,
      "safetyMedical": 29.7
    },
    "counts": {
      "bus_stop": 185,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 2,
      "pharmacy": 5,
      "fire_station": 0,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 3,
      "shelter": 1
    },
    "axisCounts": {
      "traffic": 185,
      "living": 0,
      "safetyMedical": 12
    },
    "riHighlights": [
      {
        "riName": "산동리",
        "totalCount": 1,
        "dominantAxis": "safetyMedical",
        "summaryText": "산동리 안전 의료 인프라 1건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 5,
      "streetlightCount": 0,
      "emergencyBellCount": 3
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 185,
      "libraries": 0,
      "sports": 0,
      "hospitals": 2,
      "pharmacies": 5,
      "streetlights": 0,
      "emergencyBells": 3,
      "shelters": 1,
      "fire119Centers": 0,
      "policeStations": 1
    },
    "description": "아산시 음봉면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 185건 · 약국 5건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 185건",
      "약국 5건",
      "알람벨 3건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040360",
    "name": "아산시 영인면",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "영인면",
    "eupMyeonDong": "영인면",
    "emdCode": "34040360",
    "centerLat": 36.885316,
    "centerLng": 126.963586,
    "lat": 36.885316,
    "lng": 126.963586,
    "includedEmdCodes": [
      "34040360"
    ],
    "trafficInfraScore": 53.7,
    "livingInfraScore": 0,
    "safetyMedicalScore": 20.2,
    "baseScore": 24.9,
    "axisScores": {
      "transport": 53.7,
      "living": 0,
      "safetyMedical": 20.2
    },
    "counts": {
      "bus_stop": 157,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 1,
      "pharmacy": 1,
      "fire_station": 0,
      "police": 1,
      "security_light": 0,
      "emergency_bell": 5,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 157,
      "living": 0,
      "safetyMedical": 8
    },
    "riHighlights": [
      {
        "riName": "아산리",
        "totalCount": 4,
        "dominantAxis": "safetyMedical",
        "summaryText": "아산리 안전 의료 인프라 4건"
      },
      {
        "riName": "신화리",
        "totalCount": 1,
        "dominantAxis": "safetyMedical",
        "summaryText": "신화리 안전 의료 인프라 1건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 1,
      "streetlightCount": 0,
      "emergencyBellCount": 5
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 157,
      "libraries": 0,
      "sports": 0,
      "hospitals": 1,
      "pharmacies": 1,
      "streetlights": 0,
      "emergencyBells": 5,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 1
    },
    "description": "아산시 영인면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 157건 · 알람벨 5건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 157건",
      "알람벨 5건",
      "병원 1건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011550",
    "name": "천안시 동남구 봉명동",
    "city": "천안시",
    "district": "동남구",
    "emdName": "봉명동",
    "eupMyeonDong": "봉명동",
    "emdCode": "34011550",
    "centerLat": 36.810002,
    "centerLng": 127.133786,
    "lat": 36.810002,
    "lng": 127.133786,
    "includedEmdCodes": [
      "34011550"
    ],
    "trafficInfraScore": 40.8,
    "livingInfraScore": 0,
    "safetyMedicalScore": 31.8,
    "baseScore": 23.8,
    "axisScores": {
      "transport": 40.8,
      "living": 0,
      "safetyMedical": 31.8
    },
    "counts": {
      "bus_stop": 35,
      "subway_station": 1,
      "library": 0,
      "sports": 0,
      "hospital": 4,
      "pharmacy": 16,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 61,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 36,
      "living": 0,
      "safetyMedical": 81
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 16,
      "streetlightCount": 0,
      "emergencyBellCount": 61
    },
    "infraSummary": {
      "stations": 1,
      "busStops": 35,
      "libraries": 0,
      "sports": 0,
      "hospitals": 4,
      "pharmacies": 16,
      "streetlights": 0,
      "emergencyBells": 61,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 봉명동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "알람벨 61건 · 버스정류장 35건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "알람벨 61건",
      "버스정류장 35건",
      "약국 16건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011570",
    "name": "천안시 동남구 신방동",
    "city": "천안시",
    "district": "동남구",
    "emdName": "신방동",
    "eupMyeonDong": "신방동",
    "emdCode": "34011570",
    "centerLat": 36.779301,
    "centerLng": 127.128023,
    "lat": 36.779301,
    "lng": 127.128023,
    "includedEmdCodes": [
      "34011570"
    ],
    "trafficInfraScore": 32.5,
    "livingInfraScore": 0,
    "safetyMedicalScore": 37.7,
    "baseScore": 22.7,
    "axisScores": {
      "transport": 32.5,
      "living": 0,
      "safetyMedical": 37.7
    },
    "counts": {
      "bus_stop": 58,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 22,
      "pharmacy": 13,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 58,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 58,
      "living": 0,
      "safetyMedical": 93
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 13,
      "streetlightCount": 0,
      "emergencyBellCount": 58
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 58,
      "libraries": 0,
      "sports": 0,
      "hospitals": 22,
      "pharmacies": 13,
      "streetlights": 0,
      "emergencyBells": 58,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 신방동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 안전 의료 점수가 높은 편입니다.",
      "버스정류장 58건 · 알람벨 58건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 58건",
      "알람벨 58건",
      "병원 22건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012630",
    "name": "천안시 서북구 불당2동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "불당2동",
    "eupMyeonDong": "불당2동",
    "emdCode": "34012630",
    "centerLat": 36.81267,
    "centerLng": 127.103838,
    "lat": 36.81267,
    "lng": 127.103838,
    "includedEmdCodes": [
      "34012630"
    ],
    "trafficInfraScore": 20,
    "livingInfraScore": 0,
    "safetyMedicalScore": 50,
    "baseScore": 22,
    "axisScores": {
      "transport": 20,
      "living": 0,
      "safetyMedical": 50
    },
    "counts": {
      "bus_stop": 32,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 72,
      "pharmacy": 26,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 94,
      "shelter": 1
    },
    "axisCounts": {
      "traffic": 32,
      "living": 0,
      "safetyMedical": 193
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 26,
      "streetlightCount": 0,
      "emergencyBellCount": 94
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 32,
      "libraries": 0,
      "sports": 0,
      "hospitals": 72,
      "pharmacies": 26,
      "streetlights": 0,
      "emergencyBells": 94,
      "shelters": 1,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 불당2동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 안전 의료 점수가 높은 편입니다.",
      "알람벨 94건 · 병원 72건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "알람벨 94건",
      "병원 72건",
      "버스정류장 32건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012540",
    "name": "천안시 서북구 쌍용2동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "쌍용2동",
    "eupMyeonDong": "쌍용2동",
    "emdCode": "34012540",
    "centerLat": 36.793311,
    "centerLng": 127.11919,
    "lat": 36.793311,
    "lng": 127.11919,
    "includedEmdCodes": [
      "34012540"
    ],
    "trafficInfraScore": 19.3,
    "livingInfraScore": 0,
    "safetyMedicalScore": 49.4,
    "baseScore": 21.6,
    "axisScores": {
      "transport": 19.3,
      "living": 0,
      "safetyMedical": 49.4
    },
    "counts": {
      "bus_stop": 31,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 63,
      "pharmacy": 33,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 147,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 31,
      "living": 0,
      "safetyMedical": 243
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 33,
      "streetlightCount": 0,
      "emergencyBellCount": 147
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 31,
      "libraries": 0,
      "sports": 0,
      "hospitals": 63,
      "pharmacies": 33,
      "streetlights": 0,
      "emergencyBells": 147,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 쌍용2동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 안전 의료 점수가 높은 편입니다.",
      "알람벨 147건 · 병원 63건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "알람벨 147건",
      "병원 63건",
      "약국 33건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011580",
    "name": "천안시 동남구 청룡동",
    "city": "천안시",
    "district": "동남구",
    "emdName": "청룡동",
    "eupMyeonDong": "청룡동",
    "emdCode": "34011580",
    "centerLat": 36.780408,
    "centerLng": 127.159516,
    "lat": 36.780408,
    "lng": 127.159516,
    "includedEmdCodes": [
      "34011580"
    ],
    "trafficInfraScore": 45.3,
    "livingInfraScore": 0,
    "safetyMedicalScore": 18.2,
    "baseScore": 21.3,
    "axisScores": {
      "transport": 45.3,
      "living": 0,
      "safetyMedical": 18.2
    },
    "counts": {
      "bus_stop": 106,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 2,
      "pharmacy": 2,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 29,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 106,
      "living": 0,
      "safetyMedical": 33
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 2,
      "streetlightCount": 0,
      "emergencyBellCount": 29
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 106,
      "libraries": 0,
      "sports": 0,
      "hospitals": 2,
      "pharmacies": 2,
      "streetlights": 0,
      "emergencyBells": 29,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 청룡동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 106건 · 알람벨 29건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 106건",
      "알람벨 29건",
      "병원 2건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040380",
    "name": "아산시 선장면",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "선장면",
    "eupMyeonDong": "선장면",
    "emdCode": "34040380",
    "centerLat": 36.795049,
    "centerLng": 126.877844,
    "lat": 36.795049,
    "lng": 126.877844,
    "includedEmdCodes": [
      "34040380"
    ],
    "trafficInfraScore": 54.3,
    "livingInfraScore": 0,
    "safetyMedicalScore": 2.2,
    "baseScore": 19.7,
    "axisScores": {
      "transport": 54.3,
      "living": 0,
      "safetyMedical": 2.2
    },
    "counts": {
      "bus_stop": 162,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 2,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 162,
      "living": 0,
      "safetyMedical": 2
    },
    "riHighlights": [
      {
        "riName": "군덕리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "군덕리 안전 의료 인프라 2건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 2
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 162,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 2,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "아산시 선장면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 162건 · 알람벨 2건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 162건",
      "알람벨 2건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012510",
    "name": "천안시 서북구 성정1동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "성정1동",
    "eupMyeonDong": "성정1동",
    "emdCode": "34012510",
    "centerLat": 36.811071,
    "centerLng": 127.140719,
    "lat": 36.811071,
    "lng": 127.140719,
    "includedEmdCodes": [
      "34012510"
    ],
    "trafficInfraScore": 18.7,
    "livingInfraScore": 0,
    "safetyMedicalScore": 43.4,
    "baseScore": 19.6,
    "axisScores": {
      "transport": 18.7,
      "living": 0,
      "safetyMedical": 43.4
    },
    "counts": {
      "bus_stop": 30,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 34,
      "pharmacy": 19,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 132,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 30,
      "living": 0,
      "safetyMedical": 185
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 19,
      "streetlightCount": 0,
      "emergencyBellCount": 132
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 30,
      "libraries": 0,
      "sports": 0,
      "hospitals": 34,
      "pharmacies": 19,
      "streetlights": 0,
      "emergencyBells": 132,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 성정1동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 안전 의료 점수가 높은 편입니다.",
      "알람벨 132건 · 병원 34건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "알람벨 132건",
      "병원 34건",
      "버스정류장 30건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011350",
    "name": "천안시 동남구 수신면",
    "city": "천안시",
    "district": "동남구",
    "emdName": "수신면",
    "eupMyeonDong": "수신면",
    "emdCode": "34011350",
    "centerLat": 36.724053,
    "centerLng": 127.284959,
    "lat": 36.724053,
    "lng": 127.284959,
    "includedEmdCodes": [
      "34011350"
    ],
    "trafficInfraScore": 32.5,
    "livingInfraScore": 0,
    "safetyMedicalScore": 21.9,
    "baseScore": 17.9,
    "axisScores": {
      "transport": 32.5,
      "living": 0,
      "safetyMedical": 21.9
    },
    "counts": {
      "bus_stop": 58,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 1,
      "security_light": 3,
      "emergency_bell": 26,
      "shelter": 1
    },
    "axisCounts": {
      "traffic": 58,
      "living": 0,
      "safetyMedical": 31
    },
    "riHighlights": [
      {
        "riName": "속창리",
        "totalCount": 6,
        "dominantAxis": "safetyMedical",
        "summaryText": "속창리 안전 의료 인프라 6건"
      },
      {
        "riName": "신풍리",
        "totalCount": 6,
        "dominantAxis": "safetyMedical",
        "summaryText": "신풍리 안전 의료 인프라 6건"
      },
      {
        "riName": "장산리",
        "totalCount": 5,
        "dominantAxis": "safetyMedical",
        "summaryText": "장산리 안전 의료 인프라 5건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 3,
      "emergencyBellCount": 26
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 58,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 3,
      "emergencyBells": 26,
      "shelters": 1,
      "fire119Centers": 0,
      "policeStations": 1
    },
    "description": "천안시 동남구 수신면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 58건 · 알람벨 26건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 58건",
      "알람벨 26건",
      "보안등 3건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011530",
    "name": "천안시 동남구 원성1동",
    "city": "천안시",
    "district": "동남구",
    "emdName": "원성1동",
    "eupMyeonDong": "원성1동",
    "emdCode": "34011530",
    "centerLat": 36.815718,
    "centerLng": 127.17816,
    "lat": 36.815718,
    "lng": 127.17816,
    "includedEmdCodes": [
      "34011530"
    ],
    "trafficInfraScore": 21.9,
    "livingInfraScore": 0,
    "safetyMedicalScore": 25.3,
    "baseScore": 15.3,
    "axisScores": {
      "transport": 21.9,
      "living": 0,
      "safetyMedical": 25.3
    },
    "counts": {
      "bus_stop": 35,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 5,
      "pharmacy": 3,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 91,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 35,
      "living": 0,
      "safetyMedical": 99
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 3,
      "streetlightCount": 0,
      "emergencyBellCount": 91
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 35,
      "libraries": 0,
      "sports": 0,
      "hospitals": 5,
      "pharmacies": 3,
      "streetlights": 0,
      "emergencyBells": 91,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 원성1동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 안전 의료 점수가 높은 편입니다.",
      "알람벨 91건 · 버스정류장 35건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "알람벨 91건",
      "버스정류장 35건",
      "병원 5건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012600",
    "name": "천안시 서북구 부성1동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "부성1동",
    "eupMyeonDong": "부성1동",
    "emdCode": "34012600",
    "centerLat": 36.846545,
    "centerLng": 127.146964,
    "lat": 36.846545,
    "lng": 127.146964,
    "includedEmdCodes": [
      "34012600"
    ],
    "trafficInfraScore": 42.1,
    "livingInfraScore": 0,
    "safetyMedicalScore": 1.4,
    "baseScore": 15.2,
    "axisScores": {
      "transport": 42.1,
      "living": 0,
      "safetyMedical": 1.4
    },
    "counts": {
      "bus_stop": 91,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 1,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 91,
      "living": 0,
      "safetyMedical": 1
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 1
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 91,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 1,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 부성1동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 91건 · 알람벨 1건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 91건",
      "알람벨 1건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040530",
    "name": "아산시 온양3동",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "온양3동",
    "eupMyeonDong": "온양3동",
    "emdCode": "34040530",
    "centerLat": 36.785821,
    "centerLng": 127.018885,
    "lat": 36.785821,
    "lng": 127.018885,
    "includedEmdCodes": [
      "34040530"
    ],
    "trafficInfraScore": 42.1,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 14.7,
    "axisScores": {
      "transport": 42.1,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 91,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 91,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 91,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "아산시 온양3동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 91건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 91건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011370",
    "name": "천안시 동남구 동면",
    "city": "천안시",
    "district": "동남구",
    "emdName": "동면",
    "eupMyeonDong": "동면",
    "emdCode": "34011370",
    "centerLat": 36.783656,
    "centerLng": 127.370354,
    "lat": 36.783656,
    "lng": 127.370354,
    "includedEmdCodes": [
      "34011370"
    ],
    "trafficInfraScore": 36.8,
    "livingInfraScore": 0,
    "safetyMedicalScore": 5.9,
    "baseScore": 14.7,
    "axisScores": {
      "transport": 36.8,
      "living": 0,
      "safetyMedical": 5.9
    },
    "counts": {
      "bus_stop": 71,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 18,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 71,
      "living": 0,
      "safetyMedical": 18
    },
    "riHighlights": [
      {
        "riName": "동산리",
        "totalCount": 4,
        "dominantAxis": "safetyMedical",
        "summaryText": "동산리 안전 의료 인프라 4건"
      },
      {
        "riName": "화덕리",
        "totalCount": 3,
        "dominantAxis": "safetyMedical",
        "summaryText": "화덕리 안전 의료 인프라 3건"
      },
      {
        "riName": "덕성리",
        "totalCount": 2,
        "dominantAxis": "safetyMedical",
        "summaryText": "덕성리 안전 의료 인프라 2건"
      }
    ],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 18
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 71,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 18,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 동면 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 71건 · 알람벨 18건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 71건",
      "알람벨 18건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040540",
    "name": "아산시 온양4동",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "온양4동",
    "eupMyeonDong": "온양4동",
    "emdCode": "34040540",
    "centerLat": 36.781261,
    "centerLng": 126.977504,
    "lat": 36.781261,
    "lng": 126.977504,
    "includedEmdCodes": [
      "34040540"
    ],
    "trafficInfraScore": 41.8,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 14.6,
    "axisScores": {
      "transport": 41.8,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 90,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 90,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 90,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "아산시 온양4동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 90건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 90건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012610",
    "name": "천안시 서북구 부성2동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "부성2동",
    "eupMyeonDong": "부성2동",
    "emdCode": "34012610",
    "centerLat": 36.842594,
    "centerLng": 127.120828,
    "lat": 36.842594,
    "lng": 127.120828,
    "includedEmdCodes": [
      "34012610"
    ],
    "trafficInfraScore": 41.6,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 14.6,
    "axisScores": {
      "transport": 41.6,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 89,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 89,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 89,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 부성2동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 89건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 89건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012620",
    "name": "천안시 서북구 불당1동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "불당1동",
    "eupMyeonDong": "불당1동",
    "emdCode": "34012620",
    "centerLat": 36.804757,
    "centerLng": 127.106965,
    "lat": 36.804757,
    "lng": 127.106965,
    "includedEmdCodes": [
      "34012620"
    ],
    "trafficInfraScore": 37.7,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 13.2,
    "axisScores": {
      "transport": 37.7,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 74,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 74,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 74,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 불당1동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 74건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 74건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040550",
    "name": "아산시 온양5동",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "온양5동",
    "eupMyeonDong": "온양5동",
    "emdCode": "34040550",
    "centerLat": 36.756427,
    "centerLng": 126.985068,
    "lat": 36.756427,
    "lng": 126.985068,
    "includedEmdCodes": [
      "34040550"
    ],
    "trafficInfraScore": 34.6,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 12.1,
    "axisScores": {
      "transport": 34.6,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 64,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 64,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 64,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "아산시 온양5동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 64건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 64건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012520",
    "name": "천안시 서북구 성정2동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "성정2동",
    "eupMyeonDong": "성정2동",
    "emdCode": "34012520",
    "centerLat": 36.824436,
    "centerLng": 127.139539,
    "lat": 36.824436,
    "lng": 127.139539,
    "includedEmdCodes": [
      "34012520"
    ],
    "trafficInfraScore": 28.5,
    "livingInfraScore": 0,
    "safetyMedicalScore": 1.4,
    "baseScore": 10.4,
    "axisScores": {
      "transport": 28.5,
      "living": 0,
      "safetyMedical": 1.4
    },
    "counts": {
      "bus_stop": 48,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 1,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 48,
      "living": 0,
      "safetyMedical": 1
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 1
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 48,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 1,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 성정2동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 48건 · 알람벨 1건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 48건",
      "알람벨 1건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040560",
    "name": "아산시 온양6동",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "온양6동",
    "eupMyeonDong": "온양6동",
    "emdCode": "34040560",
    "centerLat": 36.760068,
    "centerLng": 127.014035,
    "lat": 36.760068,
    "lng": 127.014035,
    "includedEmdCodes": [
      "34040560"
    ],
    "trafficInfraScore": 27.2,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 9.5,
    "axisScores": {
      "transport": 27.2,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 45,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 45,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 45,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "아산시 온양6동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 45건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 45건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011560",
    "name": "천안시 동남구 일봉동",
    "city": "천안시",
    "district": "동남구",
    "emdName": "일봉동",
    "eupMyeonDong": "일봉동",
    "emdCode": "34011560",
    "centerLat": 36.79311,
    "centerLng": 127.1412,
    "lat": 36.79311,
    "lng": 127.1412,
    "includedEmdCodes": [
      "34011560"
    ],
    "trafficInfraScore": 23.6,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 8.3,
    "axisScores": {
      "transport": 23.6,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 38,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 38,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 38,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 일봉동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 38건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 38건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040510",
    "name": "아산시 온양1동",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "온양1동",
    "eupMyeonDong": "온양1동",
    "emdCode": "34040510",
    "centerLat": 36.789577,
    "centerLng": 127.002751,
    "lat": 36.789577,
    "lng": 127.002751,
    "includedEmdCodes": [
      "34040510"
    ],
    "trafficInfraScore": 21.9,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 7.7,
    "axisScores": {
      "transport": 21.9,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 35,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 35,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 35,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "아산시 온양1동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 35건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 35건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011510",
    "name": "천안시 동남구 중앙동",
    "city": "천안시",
    "district": "동남구",
    "emdName": "중앙동",
    "eupMyeonDong": "중앙동",
    "emdCode": "34011510",
    "centerLat": 36.803745,
    "centerLng": 127.149945,
    "lat": 36.803745,
    "lng": 127.149945,
    "includedEmdCodes": [
      "34011510"
    ],
    "trafficInfraScore": 21.3,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 7.5,
    "axisScores": {
      "transport": 21.3,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 34,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 34,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 34,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 중앙동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 34건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 34건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012530",
    "name": "천안시 서북구 쌍용1동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "쌍용1동",
    "eupMyeonDong": "쌍용1동",
    "emdCode": "34012530",
    "centerLat": 36.802638,
    "centerLng": 127.13061,
    "lat": 36.802638,
    "lng": 127.13061,
    "includedEmdCodes": [
      "34012530"
    ],
    "trafficInfraScore": 16.5,
    "livingInfraScore": 0,
    "safetyMedicalScore": 3.2,
    "baseScore": 6.7,
    "axisScores": {
      "transport": 16.5,
      "living": 0,
      "safetyMedical": 3.2
    },
    "counts": {
      "bus_stop": 27,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 4,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 27,
      "living": 0,
      "safetyMedical": 4
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 4
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 27,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 4,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 쌍용1동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 27건 · 알람벨 4건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 27건",
      "알람벨 4건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34012550",
    "name": "천안시 서북구 쌍용3동",
    "city": "천안시",
    "district": "서북구",
    "emdName": "쌍용3동",
    "eupMyeonDong": "쌍용3동",
    "emdCode": "34012550",
    "centerLat": 36.808596,
    "centerLng": 127.12259,
    "lat": 36.808596,
    "lng": 127.12259,
    "includedEmdCodes": [
      "34012550"
    ],
    "trafficInfraScore": 9.2,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 3.2,
    "axisScores": {
      "transport": 9.2,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 19,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 19,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 19,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 서북구 쌍용3동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 19건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 19건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34040520",
    "name": "아산시 온양2동",
    "city": "아산시",
    "district": "해당 없음",
    "emdName": "온양2동",
    "eupMyeonDong": "온양2동",
    "emdCode": "34040520",
    "centerLat": 36.778925,
    "centerLng": 127.003643,
    "lat": 36.778925,
    "lng": 127.003643,
    "includedEmdCodes": [
      "34040520"
    ],
    "trafficInfraScore": 8.1,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 2.8,
    "axisScores": {
      "transport": 8.1,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 18,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 18,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 18,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "아산시 온양2동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 18건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "생활 편의 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 18건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011520",
    "name": "천안시 동남구 문성동",
    "city": "천안시",
    "district": "동남구",
    "emdName": "문성동",
    "eupMyeonDong": "문성동",
    "emdCode": "34011520",
    "centerLat": 36.812083,
    "centerLng": 127.153012,
    "lat": 36.812083,
    "lng": 127.153012,
    "includedEmdCodes": [
      "34011520"
    ],
    "trafficInfraScore": 0,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 0,
    "axisScores": {
      "transport": 0,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 12,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 12,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 12,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 문성동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 12건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "교통 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 12건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  },
  {
    "id": "LZ_34011540",
    "name": "천안시 동남구 원성2동",
    "city": "천안시",
    "district": "동남구",
    "emdName": "원성2동",
    "eupMyeonDong": "원성2동",
    "emdCode": "34011540",
    "centerLat": 36.802312,
    "centerLng": 127.158409,
    "lat": 36.802312,
    "lng": 127.158409,
    "includedEmdCodes": [
      "34011540"
    ],
    "trafficInfraScore": 0,
    "livingInfraScore": 0,
    "safetyMedicalScore": 0,
    "baseScore": 0,
    "axisScores": {
      "transport": 0,
      "living": 0,
      "safetyMedical": 0
    },
    "counts": {
      "bus_stop": 12,
      "subway_station": 0,
      "library": 0,
      "sports": 0,
      "hospital": 0,
      "pharmacy": 0,
      "fire_station": 0,
      "police": 0,
      "security_light": 0,
      "emergency_bell": 0,
      "shelter": 0
    },
    "axisCounts": {
      "traffic": 12,
      "living": 0,
      "safetyMedical": 0
    },
    "riHighlights": [],
    "metrics": {
      "railDistanceKm": null,
      "busStopDistanceKm": null,
      "nearestLibraryDistanceKm": null,
      "publicLibraryWithin1_5km": false,
      "smallLibraryWithin1_5km": false,
      "sportsInfraDistanceKm": null,
      "sportsInfraWithin1_5km": false,
      "pharmacyDistanceKm": null,
      "fire119DistanceKm": null,
      "policeSubstationDistanceKm": null,
      "libraryCount": 0,
      "sportsInfraCount": 0,
      "pharmacyCount": 0,
      "streetlightCount": 0,
      "emergencyBellCount": 0
    },
    "infraSummary": {
      "stations": 0,
      "busStops": 12,
      "libraries": 0,
      "sports": 0,
      "hospitals": 0,
      "pharmacies": 0,
      "streetlights": 0,
      "emergencyBells": 0,
      "shelters": 0,
      "fire119Centers": 0,
      "policeStations": 0
    },
    "description": "천안시 동남구 원성2동 생활권을 실제 전처리 CSV의 인프라 분포로 계산했습니다.",
    "strengths": [
      "실제 CSV 기준 교통 점수가 높은 편입니다.",
      "버스정류장 12건 데이터가 반영되었습니다."
    ],
    "weaknesses": [
      "교통 인프라는 다른 생활권과 비교해 추가 확인이 필요합니다."
    ],
    "tags": [
      "버스정류장 12건"
    ],
    "dataSource": "preprocessed-csv",
    "isGenerated": true
  }
];
