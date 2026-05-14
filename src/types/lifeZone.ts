export type ImportanceLevel = "low" | "medium" | "high";

export interface UserPreference {
  transportImportance: ImportanceLevel;
  cultureSportsImportance: ImportanceLevel;
  safetyMedicalImportance: ImportanceLevel;
}

export interface PreferenceWeights {
  transport: number;
  living: number;
  safetyMedical: number;
}

export interface LifeZoneMetrics {
  railDistanceKm: number | null;
  busStopDistanceKm: number | null;
  nearestLibraryDistanceKm: number | null;
  publicLibraryWithin1_5km: boolean | null;
  smallLibraryWithin1_5km: boolean | null;
  sportsInfraDistanceKm: number | null;
  sportsInfraWithin1_5km: boolean | null;
  pharmacyDistanceKm: number | null;
  fire119DistanceKm: number | null;
  policeSubstationDistanceKm: number | null;
  libraryCount: number | null;
  sportsInfraCount: number | null;
  pharmacyCount: number | null;
  streetlightCount: number | null;
  emergencyBellCount: number | null;
}

export interface LifeZone {
  id: string;
  name: string;
  city: "천안시" | "아산시" | string;
  eupMyeonDong: string;
  description?: string;
  lat: number;
  lng: number;
  areaKm2: number;
  metrics: LifeZoneMetrics;
  infraSummary: {
    stations?: number;
    busStops?: number;
    libraries?: number;
    sports?: number;
    pharmacies?: number;
    streetlights?: number;
    emergencyBells?: number;
    fire119Centers?: number;
    policeStations?: number;
  };
  strengths?: string[];
  weaknesses?: string[];
  tags?: string[];
}

export interface AxisScores {
  transport: number;
  living: number;
  safetyMedical: number;
}

export interface ScoreBreakdown {
  transport: {
    railAccessibility: number;
    busAccessibility: number;
    transportDiversity: number;
    total: number;
  };
  living: {
    libraryAccessibility: number;
    sportsAccessibility: number;
    livingDiversity: number;
    total: number;
  };
  safetyMedical: {
    pharmacyAccessibility: number;
    streetlightDensity: number;
    emergencyBellDensity: number;
    fire119Accessibility: number;
    policeSubstationAccessibility: number;
    total: number;
  };
}

export interface ScoredLifeZone extends LifeZone {
  weights: PreferenceWeights;
  axisScores: AxisScores;
  scoreBreakdown: ScoreBreakdown;
  totalScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  gradeLabel: string;
  rank: number;
  rankType: "recommended" | "low" | "normal";
  rankLabel: string;
}
