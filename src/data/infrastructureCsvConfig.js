export const INFRASTRUCTURE_AXES = {
  traffic: "교통 인프라",
  living: "생활 편의 인프라",
  safetyMedical: "치안 의료 인프라"
};

export const infrastructureCsvConfig = [
  {
    id: "bus_stop",
    filenameIncludes: ["버스정류장"],
    axis: "traffic",
    matchMethod: "coordinate",
    weight: 0.7,
    label: "버스정류장",
    useRiAggregation: false
  },
  {
    id: "subway_station",
    filenameIncludes: ["도시철도"],
    axis: "traffic",
    matchMethod: "address",
    weight: 0.3,
    label: "도시철도역사",
    useRiAggregation: false
  },
  {
    id: "library",
    filenameIncludes: ["도서관"],
    axis: "living",
    matchMethod: "address",
    weight: 0.6,
    label: "도서관/작은도서관",
    useRiAggregation: true
  },
  {
    id: "sports",
    filenameIncludes: ["체육"],
    axis: "living",
    matchMethod: "address",
    weight: 0.4,
    label: "체육 관련 시설",
    useRiAggregation: false
  },
  {
    id: "hospital",
    filenameIncludes: ["병원"],
    axis: "safetyMedical",
    matchMethod: "address",
    weight: 0.2,
    label: "병원",
    useRiAggregation: false
  },
  {
    id: "pharmacy",
    filenameIncludes: ["약국"],
    axis: "safetyMedical",
    matchMethod: "address",
    weight: 0.2,
    label: "약국",
    useRiAggregation: true
  },
  {
    id: "fire_station",
    filenameIncludes: ["119"],
    axis: "safetyMedical",
    matchMethod: "address",
    weight: 0.15,
    label: "119안전센터",
    useRiAggregation: false
  },
  {
    id: "police",
    filenameIncludes: ["지구대", "파출소"],
    axis: "safetyMedical",
    matchMethod: "address",
    weight: 0.15,
    label: "지구대/파출소",
    useRiAggregation: true
  },
  {
    id: "security_light",
    filenameIncludes: ["보안등"],
    axis: "safetyMedical",
    matchMethod: "address",
    weight: 0.15,
    label: "보안등",
    useRiAggregation: true
  },
  {
    id: "emergency_bell",
    filenameIncludes: ["알람벨"],
    axis: "safetyMedical",
    matchMethod: "address",
    weight: 0.1,
    label: "알람벨",
    useRiAggregation: true
  },
  {
    id: "shelter",
    filenameIncludes: ["실내구호소"],
    axis: "safetyMedical",
    matchMethod: "address",
    weight: 0.05,
    label: "실내구호소",
    useRiAggregation: false
  }
];

export const SCORE_AXIS_WEIGHTS = {
  traffic: 0.35,
  living: 0.35,
  safetyMedical: 0.3
};

export function findInfrastructureConfigForFile(fileName, configs = infrastructureCsvConfig) {
  const normalizedFileName = normalizeText(fileName);

  return configs.find((config) => (
    config.filenameIncludes.every((keyword) => normalizedFileName.includes(keyword))
  )) ?? null;
}

function normalizeText(value) {
  return value == null ? "" : String(value).trim();
}
