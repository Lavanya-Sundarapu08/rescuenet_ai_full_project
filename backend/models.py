from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RiskLevel(str, Enum):
    SAFE = "SAFE"               # 0 - 30
    WATCH = "WATCH"             # 30 - 60
    HIGH_RISK = "HIGH_RISK"     # 60 - 80
    CRITICAL = "CRITICAL"       # 80 - 100

class PriorityLevel(str, Enum):
    P1_IMMEDIATE = "Priority 1 — Immediate Relocation"
    P2_URGENT = "Priority 2 — Urgent Relocation"
    P3_PREPARE = "Priority 3 — Prepare for Relocation"
    P4_MONITOR = "Priority 4 — Monitor"

class ShelterStatus(str, Enum):
    AVAILABLE = "AVAILABLE"             # 🟢
    NEAR_CAPACITY = "NEAR_CAPACITY"     # 🟡
    OVER_CAPACITY = "OVER_CAPACITY"     # 🔴
    UNSAFE = "UNSAFE"                   # ⚫

class HazardType(str, Enum):
    FLOOD = "FLOOD"
    LANDSLIDE = "LANDSLIDE"
    CYCLONE_WIND = "CYCLONE_WIND"
    RIVER_OVERFLOW = "RIVER_OVERFLOW"
    HEAVY_RAINFALL = "HEAVY_RAINFALL"
    MULTI_HAZARD = "MULTI_HAZARD"

class CycloneCategory(str, Enum):
    DEPRESSION = "Depression (45-51 km/h)"
    DEEP_DEPRESSION = "Deep Depression (52-61 km/h)"
    CYCLONIC_STORM = "Cyclonic Storm (62-88 km/h)"
    SEVERE_CYCLONIC_STORM = "Severe Cyclonic Storm (89-117 km/h)"
    VERY_SEVERE_CYCLONIC_STORM = "Very Severe Cyclonic Storm (118-166 km/h)"
    EXTREMELY_SEVERE = "Extremely Severe Cyclonic Storm (167-221 km/h)"
    SUPER_CYCLONIC_STORM = "Super Cyclonic Storm (≥222 km/h)"

class CycloneTrackPoint(BaseModel):
    timestamp: str
    lat: float
    lng: float
    wind_speed_kmh: float
    pressure_hpa: float
    category: str
    is_forecast: bool = False
    radius_extreme_km: float = 40.0
    radius_high_km: float = 80.0
    radius_mod_km: float = 140.0
    radius_low_km: float = 220.0

class CycloneState(BaseModel):
    name: str
    code: str
    category: CycloneCategory
    current_lat: float
    current_lng: float
    wind_speed_kmh: float
    gust_speed_kmh: float
    central_pressure_hpa: float
    movement_dir: str
    movement_speed_kmh: float
    last_updated: str
    data_source: str
    status: str
    rainfall_12h_mm: float
    river_surge_m: float
    historical_track: List[CycloneTrackPoint]
    forecast_track: List[CycloneTrackPoint]
    affected_population: int
    high_risk_settlements: int
    critical_infrastructure_count: int
    blocked_roads_count: int
    shelters_monitored_count: int

class Demographics(BaseModel):
    total_population: int
    exposed_population: int
    children: int                     # <12 years
    elderly: int                      # >65 years
    pwd: int                          # Persons with disabilities
    medically_dependent: int          # Oxygen, dialysis, etc.
    vulnerable_households: int

class Infrastructure(BaseModel):
    buildings_total: int
    buildings_inundated: int
    hospitals: int
    schools: int
    bridges: int
    critical_facilities: int

class HazardFactors(BaseModel):
    rainfall_mm: float
    rainfall_forecast_24h_mm: float
    river_level_m: float
    elevation_m: float
    slope_deg: float
    soil_saturation_pct: float
    distance_to_river_m: float
    historical_flood_freq: int        # Events in past 10 years
    drainage_capacity_score: float    # 0 to 1

class ExplainableAttribution(BaseModel):
    feature_name: str
    contribution_pts: float           # e.g. +24
    description: str
    direction: str = "positive"

class RiskScore(BaseModel):
    normalized_score: float           # 0 - 100
    hazard_prob_pct: float            # e.g. 87%
    confidence_pct: float             # e.g. 91%
    risk_level: RiskLevel
    hazard_component: float           # 0 - 100
    exposure_component: float         # 0 - 100
    vulnerability_component: float    # 0 - 100
    attributions: List[ExplainableAttribution]
    model_disclaimer: str = "AI-assisted decision support (model estimate). Final actions require command authority verification."

class ShelterResources(BaseModel):
    water_liters_per_person_day: float
    food_stock_days: float
    toilet_ratio: float               # Toilets per 50 people
    medical_staff_count: int
    isolation_beds: int
    backup_generator: bool
    structural_safety_grade: str      # A (Excellent), B (Good), C (Marginal), UNSAFE

class Shelter(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    max_capacity: int
    current_occupancy: int
    available_capacity: int
    status: ShelterStatus
    resources: ShelterResources
    is_in_flood_plain: bool
    distance_from_river_m: float
    allocated_zones: List[str] = []

class Zone(BaseModel):
    id: str
    name: str
    taluk: str
    centroid_lat: float
    centroid_lng: float
    polygon_coords: List[List[float]] # GeoJSON-style [[lat, lng], ...]
    demographics: Demographics
    infrastructure: Infrastructure
    hazard_factors: HazardFactors
    risk_score: RiskScore
    priority_level: PriorityLevel
    priority_reason: str
    evacuated_count: int
    in_risk_count: int
    trapped_count: int
    recommended_shelter_id: Optional[str] = None
    recommended_shelter_name: Optional[str] = None

class EvacuationRouteOption(BaseModel):
    route_id: str
    name: str
    type: str                         # OPTIMAL (green), SECONDARY (yellow), REJECTED (red)
    total_distance_km: float
    total_travel_time_min: float
    hazard_exposure_score: float      # 0 (completely safe) to 100 (extreme danger)
    is_recommended: bool
    rejection_reason: Optional[str] = None
    waypoints: List[List[float]]      # [[lat, lng], ...]
    description: str

class RelocationRecommendation(BaseModel):
    zone_id: str
    zone_name: str
    priority_level: PriorityLevel
    population_to_evacuate: int
    top_shelters: List[Dict[str, Any]]
    selected_shelter_id: str
    selected_shelter_name: str
    selection_rationale: str
    routes: List[EvacuationRouteOption]

class SimulationScenario(BaseModel):
    scenario_name: str = "Extreme Monsoon Cyclone Surge"
    rainfall_mm: float = 180.0
    river_level_m: float = 6.5
    duration_hours: float = 6.0
    dam_discharge_cumec: float = 1200.0
    # Cyclone specific parameters
    cyclone_wind_kmh: float = 115.0
    cyclone_rainfall_mm: float = 220.0
    cyclone_proximity_km: float = 95.0
    cyclone_category: str = "Severe Cyclonic Storm"

class SimulationDelta(BaseModel):
    current_exposed: int
    simulated_exposed: int
    delta_exposed: int
    current_p1_zones_count: int
    simulated_p1_zones_count: int
    new_critical_zones: List[str]
    shelters_near_or_over_capacity: List[str]
    system_stress_index: float        # 0 - 100
    narrative_summary: str

class AlertMessage(BaseModel):
    id: str
    timestamp: str
    severity: str                     # CRITICAL, HIGH, WARNING, INFO
    title: str
    message: str
    target_zone_id: Optional[str] = None
    recommended_shelter_id: Optional[str] = None
    evacuation_window_min: Optional[int] = None
    is_active: bool = True

class CopilotQuery(BaseModel):
    query: str

class CopilotResponse(BaseModel):
    answer: str
    grounded_data: Dict[str, Any]
    suggested_actions: List[str]
