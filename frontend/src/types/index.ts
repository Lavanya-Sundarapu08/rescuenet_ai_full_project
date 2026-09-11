export type RiskLevel = 'SAFE' | 'WATCH' | 'HIGH_RISK' | 'CRITICAL';
export type PriorityLevel = 
  | 'Priority 1 — Immediate Relocation'
  | 'Priority 2 — Urgent Relocation'
  | 'Priority 3 — Prepare for Relocation'
  | 'Priority 4 — Monitor';
export type ShelterStatus = 'AVAILABLE' | 'NEAR_CAPACITY' | 'OVER_CAPACITY' | 'UNSAFE';

export interface Demographics {
  total_population: number;
  exposed_population: number;
  children: number;
  elderly: number;
  pwd: number;
  medically_dependent: number;
  vulnerable_households: number;
}

export interface Infrastructure {
  buildings_total: number;
  buildings_inundated: number;
  hospitals: number;
  schools: number;
  bridges: number;
  critical_facilities: number;
}

export interface HazardFactors {
  rainfall_mm: number;
  rainfall_forecast_24h_mm: number;
  river_level_m: number;
  elevation_m: number;
  slope_deg: number;
  soil_saturation_pct: number;
  distance_to_river_m: number;
  historical_flood_freq: number;
  drainage_capacity_score: number;
}

export interface ExplainableAttribution {
  feature_name: string;
  contribution_pts: number;
  description: string;
  direction: string;
}

export interface RiskScore {
  normalized_score: number;
  hazard_prob_pct: number;
  confidence_pct: number;
  risk_level: RiskLevel;
  hazard_component: number;
  exposure_component: number;
  vulnerability_component: number;
  attributions: ExplainableAttribution[];
  model_disclaimer: string;
}

export interface ShelterResources {
  water_liters_per_person_day: number;
  food_stock_days: number;
  toilet_ratio: number;
  medical_staff_count: number;
  isolation_beds: number;
  backup_generator: boolean;
  structural_safety_grade: string;
}

export interface Shelter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  max_capacity: number;
  current_occupancy: number;
  available_capacity: number;
  status: ShelterStatus;
  resources: ShelterResources;
  is_in_flood_plain: boolean;
  distance_from_river_m: number;
  allocated_zones: string[];
}

export interface Zone {
  id: string;
  name: string;
  taluk: string;
  centroid_lat: number;
  centroid_lng: number;
  polygon_coords: [number, number][];
  demographics: Demographics;
  infrastructure: Infrastructure;
  hazard_factors: HazardFactors;
  risk_score: RiskScore;
  priority_level: PriorityLevel;
  priority_reason: string;
  evacuated_count: number;
  in_risk_count: number;
  trapped_count: number;
  recommended_shelter_id?: string;
  recommended_shelter_name?: string;
}

export interface EvacuationRouteOption {
  route_id: string;
  name: string;
  type: 'OPTIMAL' | 'SECONDARY' | 'REJECTED';
  total_distance_km: number;
  total_travel_time_min: number;
  hazard_exposure_score: number;
  is_recommended: boolean;
  rejection_reason?: string;
  waypoints: [number, number][];
  description: string;
}

export interface RelocationRecommendation {
  zone_id: string;
  zone_name: string;
  priority_level: PriorityLevel;
  population_to_evacuate: number;
  top_shelters: Array<{
    shelter_id: string;
    shelter_name: string;
    lat: number;
    lng: number;
    available_capacity: number;
    current_occupancy: number;
    max_capacity: number;
    distance_km: number;
    travel_time_min: number;
    suitability_score: number;
    water_supply_days: number;
    medical_support: string;
    status: string;
  }>;
  selected_shelter_id: string;
  selected_shelter_name: string;
  selection_rationale: string;
  routes: EvacuationRouteOption[];
}

export interface SimulationScenario {
  scenario_name: string;
  rainfall_mm: number;
  river_level_m: number;
  duration_hours: number;
  dam_discharge_cumec: number;
}

export interface SimulationDelta {
  current_exposed: number;
  simulated_exposed: number;
  delta_exposed: number;
  current_p1_zones_count: number;
  simulated_p1_zones_count: number;
  new_critical_zones: string[];
  shelters_near_or_over_capacity: string[];
  system_stress_index: number;
  narrative_summary: string;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  delta: SimulationDelta;
  zone_impacts: Array<{
    zone_id: string;
    zone_name: string;
    current_risk_score: number;
    simulated_risk_score: number;
    risk_delta: number;
    current_exposed: number;
    simulated_exposed: number;
    exposed_delta: number;
    current_priority: string;
    simulated_priority: string;
    simulated_reason: string;
  }>;
}

export interface AlertMessage {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  target_zone_id?: string;
  recommended_shelter_id?: string;
  evacuation_window_min?: number;
  is_active: boolean;
}

export interface OverviewKPIs {
  active_hazards: number;
  critical_zones: number;
  high_risk_zones: number;
  watch_zones: number;
  safe_zones: number;
  total_population: number;
  people_at_risk: number;
  immediate_relocation: number;
  vulnerable_people: number;
  available_shelter_capacity: number;
  blocked_roads: number;
  active_alerts: number;
  inundated_addresses: number;
  safe_routes: number;
}
