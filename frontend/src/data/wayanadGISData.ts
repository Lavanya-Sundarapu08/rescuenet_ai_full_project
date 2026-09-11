// Multi-Hazard 3D GIS Data for Wayanad District, Kerala, India & Arabian Sea Cyclone Basin
// Coordinate System: WGS84 (EPSG:4326) [Longitude, Latitude]
// Elevation Data: AWS Terrarium DEM (meters ASL)
// Vector Data: Geological Survey of India (GSI), KSDMA, Central Water Commission (CWC)

export interface GeoLocation {
  id: string;
  name: string;
  taluk: string;
  coordinates: [number, number]; // [lng, lat]
  elevation_m: number;
  risk_score: number;
  risk_level: 'CRITICAL' | 'HIGH_RISK' | 'WATCH' | 'SAFE';
  population_exposed: number;
  vulnerable_population: number;
  primary_hazard: string;
  trend: 'Increasing' | 'Stable' | 'Decreasing';
  time_to_impact: string;
  action: string;
  last_updated: string;
  nearest_shelter: string;
  shelter_distance_km: number;
  data_sources: string[];
  lead_time_formatted: string;
  lead_time_minutes: number;
  evac_priority: string;
  hazard_breakdown?: {
    cyclone: number;
    rainfall: number;
    flood: number;
    landslide: number;
  };
}

export interface EmergencyFacility {
  id: string;
  name: string;
  type: 'hospital' | 'shelter' | 'bridge' | 'emergency_hq' | 'fire_station' | 'weather_station';
  coordinates: [number, number]; // [lng, lat]
  elevation_m: number;
  status: string;
  operational: boolean;
  capacity?: number;
  occupied?: number;
  headroom?: number;
  contact?: string;
  source: string;
}

export interface CycloneTimelineStep {
  step: string;
  label: string;
  forecast_hour: number;
  coordinates: [number, number];
  wind_kmh: number;
  gust_kmh: number;
  pressure_hpa: number;
  rainfall_12h_mm: number;
  rain_rate_mm_hr: number;
  river_level_m: number;
  river_rate_m_hr: string;
  soil_saturation_pct: number;
  slope_fos: number;
  river_surge_m: number;
  movement: string;
  exposed_population: number;
  critical_zones_count: number;
  status: string;
  threshold_alert: string;
  lead_window: string;
  route_b_status: 'OPEN' | 'CAUTION' | 'BLOCKED';
  blocked_roads: number;
}

// ============================================================================
// 1. MULTI-HAZARD RISK ENGINE & CONFIGURABLE WEIGHTS (Section 5)
// ============================================================================
export interface MultiHazardWeights {
  cyclone: number;   // 20%
  rainfall: number;  // 25%
  riverFlood: number;// 30%
  landslide: number; // 25%
}

export const MULTI_HAZARD_CONFIG: MultiHazardWeights = {
  cyclone: 0.20,
  rainfall: 0.25,
  riverFlood: 0.30,
  landslide: 0.25
};

export function computeMultiHazardScore(
  cycloneScore: number,
  rainfallScore: number,
  floodScore: number,
  landslideScore: number,
  weights: MultiHazardWeights = MULTI_HAZARD_CONFIG
): { score: number; level: 'CRITICAL' | 'HIGH_RISK' | 'WATCH' | 'SAFE'; color: string } {
  const composite = Math.round(
    cycloneScore * weights.cyclone +
    rainfallScore * weights.rainfall +
    floodScore * weights.riverFlood +
    landslideScore * weights.landslide
  );
  const score = Math.max(0, Math.min(100, composite));

  let level: 'CRITICAL' | 'HIGH_RISK' | 'WATCH' | 'SAFE' = 'SAFE';
  let color = '#0284c7';
  if (score >= 80) {
    level = 'CRITICAL';
    color = '#dc2626';
  } else if (score >= 60) {
    level = 'HIGH_RISK';
    color = '#ea580c';
  } else if (score >= 30) {
    level = 'WATCH';
    color = '#eab308';
  }
  return { score, level, color };
}

// ============================================================================
// 2. PREDICTIVE TIMELINE (T0, T+4h, T+9h, T+14h, T+24h, T+48h - Section 6)
// ============================================================================
export const CYCLONE_TIMELINE_STEPS: CycloneTimelineStep[] = [
  {
    step: 'T0',
    label: 'Current (14:30 IST) | Baseline Multi-Hazard State',
    forecast_hour: 0,
    coordinates: [75.10, 10.90],
    wind_kmh: 110,
    gust_kmh: 135,
    pressure_hpa: 978,
    rainfall_12h_mm: 145.0,
    rain_rate_mm_hr: 18.4,
    river_level_m: 4.20,
    river_rate_m_hr: '+0.25 m/hr (Rising)',
    soil_saturation_pct: 87.0,
    slope_fos: 0.71,
    river_surge_m: 1.4,
    movement: 'NNW at 14 km/h',
    exposed_population: 36680,
    critical_zones_count: 3,
    status: 'IMD Red Warning Active (Pre-Breach Window)',
    threshold_alert: 'River at 4.2m (Warning: 4.5m) | Soil Moisture 87% | FoS 0.71 (Stable > 0.60)',
    lead_window: '1h 45m Lead Time',
    route_b_status: 'OPEN',
    blocked_roads: 3
  },
  {
    step: 'T+4h',
    label: '+4h | Chaliyar River Warning Threshold Breach',
    forecast_hour: 4,
    coordinates: [74.90, 11.35],
    wind_kmh: 115,
    gust_kmh: 140,
    pressure_hpa: 974,
    rainfall_12h_mm: 180.0,
    rain_rate_mm_hr: 24.0,
    river_level_m: 4.80,
    river_rate_m_hr: '+0.38 m/hr ⚠️ SURGE',
    soil_saturation_pct: 89.2,
    slope_fos: 0.66,
    river_surge_m: 1.8,
    movement: 'NNW at 15 km/h',
    exposed_population: 41200,
    critical_zones_count: 4,
    status: 'Chaliyar River Warning Level Breached (+0.3m)',
    threshold_alert: 'Warning Mark 4.5m Breached: Chaliyar river level 4.80m | Paddy flats inundated',
    lead_window: '1h 15m Lead Time',
    route_b_status: 'CAUTION',
    blocked_roads: 4
  },
  {
    step: 'T+9h',
    label: '+9h | Chooralmala Soil Moisture Exceeds 90% (FoS Failure)',
    forecast_hour: 9,
    coordinates: [74.65, 11.90],
    wind_kmh: 122,
    gust_kmh: 150,
    pressure_hpa: 968,
    rainfall_12h_mm: 225.0,
    rain_rate_mm_hr: 32.0,
    river_level_m: 5.40,
    river_rate_m_hr: '+0.45 m/hr ⚠️ DANGER BREACH',
    soil_saturation_pct: 92.5,
    slope_fos: 0.58,
    river_surge_m: 2.2,
    movement: 'NW at 16 km/h',
    exposed_population: 46500,
    critical_zones_count: 5,
    status: 'Slope Instability Triggered (FoS 0.58 < 0.60 Failure)',
    threshold_alert: 'Critical Landslide Threshold Exceeded: Soil moisture 92.5% (>90%) | Debris flow runout',
    lead_window: '45m Urgent Clearance',
    route_b_status: 'CAUTION',
    blocked_roads: 5
  },
  {
    step: 'T+14h',
    label: '+14h | Flash Inundation Expansion & Route B Cutoff',
    forecast_hour: 14,
    coordinates: [74.40, 12.40],
    wind_kmh: 128,
    gust_kmh: 155,
    pressure_hpa: 964,
    rainfall_12h_mm: 270.0,
    rain_rate_mm_hr: 38.5,
    river_level_m: 6.10,
    river_rate_m_hr: '+0.20 m/hr (Peak Crest)',
    soil_saturation_pct: 96.0,
    slope_fos: 0.52,
    river_surge_m: 2.8,
    movement: 'NW at 16 km/h',
    exposed_population: 52400,
    critical_zones_count: 7,
    status: 'Peak Valley Flood & Chooralmala Bridge Cutoff',
    threshold_alert: 'Route B Chooralmala Bridge Submerged | Traffic Diverted to Route C Green Corridor',
    lead_window: '0h Active Rescue Window',
    route_b_status: 'BLOCKED',
    blocked_roads: 7
  },
  {
    step: 'T+24h',
    label: '+24h | Prolonged Basin Backwater Surge',
    forecast_hour: 24,
    coordinates: [73.95, 13.20],
    wind_kmh: 95,
    gust_kmh: 115,
    pressure_hpa: 984,
    rainfall_12h_mm: 310.0,
    rain_rate_mm_hr: 14.0,
    river_level_m: 5.50,
    river_rate_m_hr: '-0.15 m/hr (Slow Recede)',
    soil_saturation_pct: 94.0,
    slope_fos: 0.55,
    river_surge_m: 2.1,
    movement: 'NW at 18 km/h',
    exposed_population: 44000,
    critical_zones_count: 4,
    status: 'Kabini Backflow Slow Inundation',
    threshold_alert: 'River receding slowly; emergency pontoon crossing deployed at Chooralmala',
    lead_window: 'Post-Impact Recovery',
    route_b_status: 'BLOCKED',
    blocked_roads: 7
  },
  {
    step: 'T+48h',
    label: '+48h | Receding Waters & Route Clearance',
    forecast_hour: 48,
    coordinates: [73.20, 14.10],
    wind_kmh: 60,
    gust_kmh: 75,
    pressure_hpa: 996,
    rainfall_12h_mm: 340.0,
    rain_rate_mm_hr: 3.5,
    river_level_m: 3.90,
    river_rate_m_hr: '-0.35 m/hr (Safe Trend)',
    soil_saturation_pct: 82.0,
    slope_fos: 0.74,
    river_surge_m: 0.8,
    movement: 'WNW at 20 km/h',
    exposed_population: 19500,
    critical_zones_count: 1,
    status: 'Corridor Restored; Relocation Camp Consolidation',
    threshold_alert: 'Chaliyar River returned below 4.0m; Route B pontoon bypass active and clear',
    lead_window: 'Safe Reconstruction Window',
    route_b_status: 'OPEN',
    blocked_roads: 2
  }
];

// ============================================================================
// 3. ALL 20 WAYANAD LOCATIONS (Ranked by Multi-Hazard & Pre-Impact Lead Time)
// ============================================================================
export const WAYANAD_LOCATIONS: GeoLocation[] = [
  {
    id: 'ZN-03',
    name: 'Meppadi Lowland',
    taluk: 'Vythiri',
    coordinates: [76.1264, 11.5518],
    elevation_m: 730,
    risk_score: 88,
    risk_level: 'CRITICAL',
    population_exposed: 4820,
    vulnerable_population: 1545,
    primary_hazard: 'Slope Shear & Flash Inundation',
    trend: 'Increasing',
    time_to_impact: '1h 45m',
    action: 'Initiate immediate relocation of high-vulnerability households through Route B',
    last_updated: '14:32:08',
    nearest_shelter: 'Meppadi Multipurpose Relief Center',
    shelter_distance_km: 1.8,
    data_sources: ['DEM AW3D30', 'Soil Moisture Probe SM-12', 'RescueNet ML Engine'],
    lead_time_formatted: '1h 45m',
    lead_time_minutes: 105,
    evac_priority: 'P1 ACT NOW',
    hazard_breakdown: { cyclone: 75, rainfall: 92, flood: 94, landslide: 90 }
  },
  {
    id: 'ZN-01',
    name: 'Chooralmala Valley',
    taluk: 'Vythiri',
    coordinates: [76.1452, 11.5458],
    elevation_m: 690,
    risk_score: 94,
    risk_level: 'CRITICAL',
    population_exposed: 4650,
    vulnerable_population: 1442,
    primary_hazard: 'Active River Breach + Bridge Inundation',
    trend: 'Increasing',
    time_to_impact: '2h 10m',
    action: 'Mandatory Immediate Evacuation via Elevated Bypass to Meppadi Shelter Hub',
    last_updated: '14:32:08',
    nearest_shelter: 'Meppadi Multipurpose Relief Center',
    shelter_distance_km: 4.2,
    data_sources: ['DEM SRTM/AW3D30', 'PWD Flood Sensor WB-02', 'RescueNet ML Engine'],
    lead_time_formatted: '2h 10m',
    lead_time_minutes: 130,
    evac_priority: 'P1 ACT NOW',
    hazard_breakdown: { cyclone: 80, rainfall: 96, flood: 98, landslide: 95 }
  },
  {
    id: 'ZN-02',
    name: 'Mundakkai Riverside',
    taluk: 'Vythiri',
    coordinates: [76.1284, 11.5342],
    elevation_m: 710,
    risk_score: 92,
    risk_level: 'CRITICAL',
    population_exposed: 3940,
    vulnerable_population: 1187,
    primary_hazard: 'Debris Flow Runout & Torrential Mudwash',
    trend: 'Increasing',
    time_to_impact: '2h 30m',
    action: 'Immediate Evacuation along Western Ridge Corridor',
    last_updated: '14:32:08',
    nearest_shelter: 'Meppadi Multipurpose Relief Center',
    shelter_distance_km: 3.6,
    data_sources: ['DEM SRTM/AW3D30', 'KSDMA Sensor 104', 'RescueNet ML Engine'],
    lead_time_formatted: '2h 30m',
    lead_time_minutes: 150,
    evac_priority: 'P1 ACT NOW',
    hazard_breakdown: { cyclone: 78, rainfall: 94, flood: 92, landslide: 98 }
  },
  {
    id: 'ZN-08',
    name: 'Attamala Hillside',
    taluk: 'Vythiri',
    coordinates: [76.1520, 11.5210],
    elevation_m: 760,
    risk_score: 72,
    risk_level: 'HIGH_RISK',
    population_exposed: 1850,
    vulnerable_population: 550,
    primary_hazard: 'Steep Slope Sheet Wash & Escarpment Ravines',
    trend: 'Increasing',
    time_to_impact: '3h 15m',
    action: 'Pre-emptive evacuation advisory; stage vehicles at junction',
    last_updated: '14:32:08',
    nearest_shelter: 'Meppadi Multipurpose Relief Center',
    shelter_distance_km: 4.9,
    data_sources: ['GSI Slope Map', 'SRTM DEM'],
    lead_time_formatted: '3h 15m',
    lead_time_minutes: 195,
    evac_priority: 'P2 PREPARE',
    hazard_breakdown: { cyclone: 72, rainfall: 82, flood: 65, landslide: 78 }
  },
  {
    id: 'ZN-04',
    name: 'Vellarimala Foothills',
    taluk: 'Vythiri',
    coordinates: [76.1050, 11.4920],
    elevation_m: 820,
    risk_score: 85,
    risk_level: 'CRITICAL',
    population_exposed: 2100,
    vulnerable_population: 630,
    primary_hazard: 'Torrential Runoff & Gully Erosion',
    trend: 'Increasing',
    time_to_impact: '3h 40m',
    action: 'Evacuate toward Vythiri St. Joseph Hall',
    last_updated: '14:32:08',
    nearest_shelter: 'Vythiri Town Hall Shelter',
    shelter_distance_km: 4.8,
    data_sources: ['GSI Landslide Hazard Map', 'AW3D30 DEM'],
    lead_time_formatted: '3h 40m',
    lead_time_minutes: 220,
    evac_priority: 'P2 PREPARE',
    hazard_breakdown: { cyclone: 74, rainfall: 88, flood: 80, landslide: 92 }
  },
  {
    id: 'ZN-05',
    name: 'Mananthavady Riverfront',
    taluk: 'Mananthavady',
    coordinates: [76.0039, 11.8025],
    elevation_m: 740,
    risk_score: 78,
    risk_level: 'HIGH_RISK',
    population_exposed: 4200,
    vulnerable_population: 1260,
    primary_hazard: 'Kabini Tributary Overflow & Backwater Ponding',
    trend: 'Increasing',
    time_to_impact: '4h 15m',
    action: 'Move lower ward residents to Higher Secondary Camp',
    last_updated: '14:32:08',
    nearest_shelter: 'Mananthavady Higher Secondary Camp',
    shelter_distance_km: 1.4,
    data_sources: ['CWC Kabini Gauge K-08', 'KSDMA Inundation Map'],
    lead_time_formatted: '4h 15m',
    lead_time_minutes: 255,
    evac_priority: 'P2 PREPARE',
    hazard_breakdown: { cyclone: 65, rainfall: 80, flood: 86, landslide: 55 }
  },
  {
    id: 'ZN-06',
    name: 'Panamaram Backwater Basin',
    taluk: 'Mananthavady',
    coordinates: [76.0689, 11.7240],
    elevation_m: 735,
    risk_score: 76,
    risk_level: 'HIGH_RISK',
    population_exposed: 3950,
    vulnerable_population: 1180,
    primary_hazard: 'Low-Lying Confluence Ponding',
    trend: 'Increasing',
    time_to_impact: '4h 50m',
    action: 'Activate sluice bypass; alert riverbank families',
    last_updated: '14:32:08',
    nearest_shelter: 'Panamaram High School Relief Camp',
    shelter_distance_km: 1.2,
    data_sources: ['KSDMA Hydrology Model', 'AW3D30 DEM'],
    lead_time_formatted: '4h 50m',
    lead_time_minutes: 290,
    evac_priority: 'P2 PREPARE',
    hazard_breakdown: { cyclone: 62, rainfall: 78, flood: 85, landslide: 50 }
  },
  {
    id: 'ZN-07',
    name: 'Padinjarathara Dam Downstream',
    taluk: 'Vythiri',
    coordinates: [75.9850, 11.6720],
    elevation_m: 760,
    risk_score: 74,
    risk_level: 'HIGH_RISK',
    population_exposed: 3100,
    vulnerable_population: 930,
    primary_hazard: 'Banasura Spillway Runoff Surge',
    trend: 'Stable',
    time_to_impact: '5h 30m',
    action: 'Maintain flood barrier readiness; monitor spill gates',
    last_updated: '14:32:08',
    nearest_shelter: 'Padinjarathara Community Center',
    shelter_distance_km: 2.1,
    data_sources: ['KSEB Dam Safety Bulletin', 'SRTM DEM'],
    lead_time_formatted: '5h 30m',
    lead_time_minutes: 330,
    evac_priority: 'P2 PREPARE',
    hazard_breakdown: { cyclone: 60, rainfall: 82, flood: 82, landslide: 60 }
  },
  {
    id: 'ZN-09',
    name: 'Pozhuthana Valley',
    taluk: 'Vythiri',
    coordinates: [76.0280, 11.5950],
    elevation_m: 750,
    risk_score: 68,
    risk_level: 'HIGH_RISK',
    population_exposed: 2400,
    vulnerable_population: 720,
    primary_hazard: 'Flash Creek Surge & Tea Slope Slump',
    trend: 'Increasing',
    time_to_impact: '6h 15m',
    action: 'Close pedestrian suspension bridges; enforce river buffer',
    last_updated: '14:32:08',
    nearest_shelter: 'Pozhuthana Panchayat Hall',
    shelter_distance_km: 1.5,
    data_sources: ['GSI Landslide Hazard Map', 'Soil Moisture Probe SM-04'],
    lead_time_formatted: '6h 15m',
    lead_time_minutes: 375,
    evac_priority: 'P3 STANDBY',
    hazard_breakdown: { cyclone: 58, rainfall: 75, flood: 68, landslide: 70 }
  },
  {
    id: 'ZN-10',
    name: 'Thondernad Tea Slopes',
    taluk: 'Mananthavady',
    coordinates: [75.9250, 11.8420],
    elevation_m: 810,
    risk_score: 64,
    risk_level: 'HIGH_RISK',
    population_exposed: 2150,
    vulnerable_population: 645,
    primary_hazard: 'Shallow Slope Failures in Terraced Tea Soils',
    trend: 'Increasing',
    time_to_impact: '7h 00m',
    action: 'Issue advisory to plantation staff; restrict steep tracks',
    last_updated: '14:32:08',
    nearest_shelter: 'Koranpeedika Relief Center',
    shelter_distance_km: 3.2,
    data_sources: ['GSI Slump Survey', 'AW3D30 DEM'],
    lead_time_formatted: '7h 00m',
    lead_time_minutes: 420,
    evac_priority: 'P3 STANDBY',
    hazard_breakdown: { cyclone: 55, rainfall: 72, flood: 58, landslide: 74 }
  },
  {
    id: 'ZN-11',
    name: 'Kalpetta South Basin',
    taluk: 'Vythiri',
    coordinates: [76.0827, 11.6103],
    elevation_m: 780,
    risk_score: 58,
    risk_level: 'WATCH',
    population_exposed: 3800,
    vulnerable_population: 1140,
    primary_hazard: 'Urban Flash Drainage Choke',
    trend: 'Increasing',
    time_to_impact: '7h 30m',
    action: 'Clear stormwater culverts; station de-watering pumps',
    last_updated: '14:32:08',
    nearest_shelter: 'SKMJ Higher Secondary Hall',
    shelter_distance_km: 0.8,
    data_sources: ['Municipality Drainage Map', 'SRTM DEM'],
    lead_time_formatted: '7h 30m',
    lead_time_minutes: 450,
    evac_priority: 'P3 STANDBY',
    hazard_breakdown: { cyclone: 50, rainfall: 65, flood: 68, landslide: 45 }
  },
  {
    id: 'ZN-20',
    name: 'Meenangadi Plateau',
    taluk: 'Sulthan Bathery',
    coordinates: [76.1720, 11.6610],
    elevation_m: 840,
    risk_score: 35,
    risk_level: 'WATCH',
    population_exposed: 2900,
    vulnerable_population: 870,
    primary_hazard: 'Localized Stream Backflow (Broad Stable Ridge)',
    trend: 'Stable',
    time_to_impact: '8h 45m',
    action: 'Regional Fuel & Food Rations Staging Warehouse Ready',
    last_updated: '14:32:08',
    nearest_shelter: 'Meenangadi Community Hall (SAFE)',
    shelter_distance_km: 0.9,
    data_sources: ['KSDMA Logistics Map', 'SRTM DEM'],
    lead_time_formatted: '8h 45m',
    lead_time_minutes: 525,
    evac_priority: 'P3 STANDBY',
    hazard_breakdown: { cyclone: 35, rainfall: 42, flood: 38, landslide: 22 }
  },
  {
    id: 'ZN-12',
    name: 'Vellamunda Terrace',
    taluk: 'Mananthavady',
    coordinates: [75.9520, 11.7580],
    elevation_m: 770,
    risk_score: 52,
    risk_level: 'WATCH',
    population_exposed: 2800,
    vulnerable_population: 840,
    primary_hazard: 'Minor Gully Inflow',
    trend: 'Stable',
    time_to_impact: '9h 00m',
    action: 'Monitor culvert discharge on PWD Road',
    last_updated: '14:32:08',
    nearest_shelter: 'Vellamunda Govt LP School Camp',
    shelter_distance_km: 1.1,
    data_sources: ['PWD Engineering Survey', 'AW3D30 DEM'],
    lead_time_formatted: '9h 00m',
    lead_time_minutes: 540,
    evac_priority: 'P3 STANDBY',
    hazard_breakdown: { cyclone: 45, rainfall: 58, flood: 55, landslide: 42 }
  },
  {
    id: 'ZN-13',
    name: 'Pulpally Border Flats',
    taluk: 'Sulthan Bathery',
    coordinates: [76.2820, 11.7920],
    elevation_m: 830,
    risk_score: 48,
    risk_level: 'WATCH',
    population_exposed: 2600,
    vulnerable_population: 780,
    primary_hazard: 'Agricultural Ditch Ponding',
    trend: 'Stable',
    time_to_impact: '10h 30m',
    action: 'Stage reserve grain stocks in dry storage',
    last_updated: '14:32:08',
    nearest_shelter: 'Pulpally St. Marys Hall',
    shelter_distance_km: 1.6,
    data_sources: ['Agriculture Dept Flood Log', 'SRTM DEM'],
    lead_time_formatted: '10h 30m',
    lead_time_minutes: 630,
    evac_priority: 'P3 STANDBY',
    hazard_breakdown: { cyclone: 38, rainfall: 50, flood: 52, landslide: 28 }
  },
  {
    id: 'ZN-14',
    name: 'Banasura Foothills East',
    taluk: 'Vythiri',
    coordinates: [76.0120, 11.6480],
    elevation_m: 790,
    risk_score: 44,
    risk_level: 'WATCH',
    population_exposed: 1900,
    vulnerable_population: 570,
    primary_hazard: 'Hill Stream Sheet Runoff',
    trend: 'Decreasing',
    time_to_impact: '11h 30m',
    action: 'Enforce tourist restriction around lake perimeter',
    last_updated: '14:32:08',
    nearest_shelter: 'Taruvana Village Office Camp',
    shelter_distance_km: 2.8,
    data_sources: ['KSEB Reservoir Catchment Data', 'AW3D30 DEM'],
    lead_time_formatted: '11h 30m',
    lead_time_minutes: 690,
    evac_priority: 'P3 STANDBY',
    hazard_breakdown: { cyclone: 40, rainfall: 52, flood: 45, landslide: 40 }
  },
  {
    id: 'ZN-15',
    name: 'Kottathara Valley',
    taluk: 'Vythiri',
    coordinates: [76.0450, 11.6850],
    elevation_m: 745,
    risk_score: 42,
    risk_level: 'WATCH',
    population_exposed: 2200,
    vulnerable_population: 660,
    primary_hazard: 'Paddy Field Sheet Flooding',
    trend: 'Stable',
    time_to_impact: '13h 00m',
    action: 'Clear farm ditches; prepare tractor transport',
    last_updated: '14:32:08',
    nearest_shelter: 'Kottathara Panchayat Building',
    shelter_distance_km: 1.0,
    data_sources: ['KSDMA Hydrology Bulletin', 'SRTM DEM'],
    lead_time_formatted: '13h 00m',
    lead_time_minutes: 780,
    evac_priority: 'P3 STANDBY',
    hazard_breakdown: { cyclone: 36, rainfall: 48, flood: 48, landslide: 30 }
  },
  {
    id: 'ZN-16',
    name: 'Sulthan Bathery Safe Hub',
    taluk: 'Sulthan Bathery',
    coordinates: [76.2570, 11.6628],
    elevation_m: 930,
    risk_score: 24,
    risk_level: 'SAFE',
    population_exposed: 1800,
    vulnerable_population: 540,
    primary_hazard: 'None (Well-Drained Granitic Plateau)',
    trend: 'Stable',
    time_to_impact: 'Safe / No Threat',
    action: 'Designated Primary Relief Command & Staging Hub',
    last_updated: '14:32:08',
    nearest_shelter: 'Sulthan Bathery Safe Hub (Mega Facility)',
    shelter_distance_km: 0.4,
    data_sources: ['GSI Granitic Bedrock Survey', 'SRTM DEM'],
    lead_time_formatted: '24h+',
    lead_time_minutes: 1440,
    evac_priority: 'SAFE RELIEF NODE',
    hazard_breakdown: { cyclone: 25, rainfall: 28, flood: 18, landslide: 15 }
  },
  {
    id: 'ZN-17',
    name: 'Muttil Central Plain',
    taluk: 'Vythiri',
    coordinates: [76.1280, 11.6420],
    elevation_m: 815,
    risk_score: 20,
    risk_level: 'SAFE',
    population_exposed: 1340,
    vulnerable_population: 400,
    primary_hazard: 'None (Well-drained Topography)',
    trend: 'Stable',
    time_to_impact: 'Safe / No Threat',
    action: 'Designated Staging Post for Relief Logistics',
    last_updated: '14:32:08',
    nearest_shelter: 'WMO Arts & Science College Relief Camp',
    shelter_distance_km: 1.2,
    data_sources: ['DEM AW3D30', 'PWD Infrastructure Registry'],
    lead_time_formatted: '24h+',
    lead_time_minutes: 1440,
    evac_priority: 'SAFE STAGING HUB',
    hazard_breakdown: { cyclone: 22, rainfall: 25, flood: 15, landslide: 14 }
  },
  {
    id: 'ZN-18',
    name: 'Ambalavayal Ridge',
    taluk: 'Sulthan Bathery',
    coordinates: [76.2163, 11.6214],
    elevation_m: 910,
    risk_score: 18,
    risk_level: 'SAFE',
    population_exposed: 1250,
    vulnerable_population: 375,
    primary_hazard: 'None (Stable Granitic Bedrock)',
    trend: 'Stable',
    time_to_impact: 'Safe / No Threat',
    action: 'Active Medical Support & Shelter Distribution Node',
    last_updated: '14:32:08',
    nearest_shelter: 'Ambalavayal Agricultural Research Station',
    shelter_distance_km: 1.1,
    data_sources: ['GSI Granitic Bedrock Survey', 'SRTM DEM'],
    lead_time_formatted: '24h+',
    lead_time_minutes: 1440,
    evac_priority: 'SAFE MEDICAL NODE',
    hazard_breakdown: { cyclone: 20, rainfall: 22, flood: 14, landslide: 12 }
  },
  {
    id: 'ZN-19',
    name: 'Pookode Highland Plateau',
    taluk: 'Vythiri',
    coordinates: [76.0260, 11.5420],
    elevation_m: 770,
    risk_score: 15,
    risk_level: 'SAFE',
    population_exposed: 980,
    vulnerable_population: 290,
    primary_hazard: 'None (Natural Basin with Controlled Sluice)',
    trend: 'Decreasing',
    time_to_impact: 'Safe / No Threat',
    action: 'Auxiliary Camp Readiness for Displaced Families',
    last_updated: '14:32:08',
    nearest_shelter: 'Pookode Veterinary College Camp',
    shelter_distance_km: 1.8,
    data_sources: ['PWD Irrigation Gauge', 'SRTM DEM'],
    lead_time_formatted: '24h+',
    lead_time_minutes: 1440,
    evac_priority: 'SAFE AUXILIARY CAMP',
    hazard_breakdown: { cyclone: 18, rainfall: 20, flood: 10, landslide: 12 }
  }
];

// ============================================================================
// 4. EMERGENCY FACILITIES & SAFE SHELTER CARRYING CAPACITY (Section 11)
// ============================================================================
export const WAYANAD_EMERGENCY_NODES: EmergencyFacility[] = [
  {
    id: 'SH-01',
    name: 'Meppadi Multipurpose Center',
    type: 'shelter',
    coordinates: [76.1264, 11.5518],
    elevation_m: 730,
    status: 'OPERATIONAL (PRIMARY RELIEF HUB)',
    operational: true,
    capacity: 2500,
    occupied: 1620,
    headroom: 880,
    contact: '+91-4936-282240',
    source: 'District Disaster Management Authority (DDMA)'
  },
  {
    id: 'SH-02',
    name: 'SKMJ Higher Secondary Hall',
    type: 'shelter',
    coordinates: [76.0827, 11.6103],
    elevation_m: 780,
    status: 'OPERATIONAL (URBAN RELIEF HUB)',
    operational: true,
    capacity: 1800,
    occupied: 940,
    headroom: 860,
    contact: '+91-4936-202350',
    source: 'DDMA / Education Dept'
  },
  {
    id: 'SH-03',
    name: 'Sulthan Bathery Safe Hub',
    type: 'shelter',
    coordinates: [76.2570, 11.6628],
    elevation_m: 930,
    status: 'OPERATIONAL (REGIONAL SAFE HUB)',
    operational: true,
    capacity: 3200,
    occupied: 1100,
    headroom: 2100,
    contact: '+91-4936-220220',
    source: 'DDMA Wayanad'
  },
  {
    id: 'SH-04',
    name: 'Ambalavayal Rations Depot & Camp',
    type: 'shelter',
    coordinates: [76.2163, 11.6214],
    elevation_m: 910,
    status: 'OPERATIONAL (SAFE STAGING)',
    operational: true,
    capacity: 1600,
    occupied: 450,
    headroom: 1150,
    contact: '+91-4936-260421',
    source: 'KAU / DDMA'
  },
  {
    id: 'SH-05',
    name: 'WMO Arts & Science College Camp',
    type: 'shelter',
    coordinates: [76.1280, 11.6420],
    elevation_m: 815,
    status: 'OPERATIONAL (HIGH GROUND HUB)',
    operational: true,
    capacity: 1500,
    occupied: 620,
    headroom: 880,
    contact: '+91-4936-240112',
    source: 'Higher Education Dept'
  },
  {
    id: 'SH-06',
    name: 'Vythiri Town Hall Relief Shelter',
    type: 'shelter',
    coordinates: [76.0420, 11.5540],
    elevation_m: 790,
    status: 'OPERATIONAL (WESTERN SAFE TRANSIT)',
    operational: true,
    capacity: 1400,
    occupied: 510,
    headroom: 890,
    contact: '+91-4936-255301',
    source: 'Vythiri Grama Panchayat'
  },
  {
    id: 'HP-01',
    name: 'Wayanad District Hospital, Mananthavady',
    type: 'hospital',
    coordinates: [76.0039, 11.8025],
    elevation_m: 740,
    status: 'ACTIVE EMERGENCY TRIAGE',
    operational: true,
    capacity: 350,
    occupied: 280,
    headroom: 70,
    contact: '+91-4935-240223',
    source: 'Directorate of Health Services'
  },
  {
    id: 'HP-02',
    name: 'General Hospital, Kalpetta',
    type: 'hospital',
    coordinates: [76.0827, 11.6140],
    elevation_m: 780,
    status: 'SURGICAL TRAUMA READY',
    operational: true,
    capacity: 250,
    occupied: 190,
    headroom: 60,
    contact: '+91-4936-202245',
    source: 'Health Dept Kerala'
  },
  {
    id: 'BR-01',
    name: 'Chooralmala Bridge Crossing',
    type: 'bridge',
    coordinates: [76.1410, 11.5435],
    elevation_m: 685,
    status: 'SUBMERGENCE ALERT (ROUTE B INTERSECTION)',
    operational: true,
    source: 'PWD Bridges Division'
  }
];

// ============================================================================
// 5. REALISTIC RIVERS & FLOWING WATER NETWORK (Section 2 & 3)
// ============================================================================
// Coordinates in downstream direction (High mountain -> Valley -> Confluence)
export const WAYANAD_RIVERS_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // 1. Chaliyar River Main Stem (Chembra Scarp -> Mundakkai -> Chooralmala -> Meppadi -> Nilambur)
    {
      type: 'Feature',
      properties: {
        name: 'Chaliyar River Basin',
        basin: 'Chaliyar',
        flow_direction: 'Downstream Southwest',
        danger_level_m: 4.5,
        current_level_m: 4.8,
        length_km: 32.4
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.1620, 11.5220], // Chembra headwaters
          [76.1480, 11.5340], // Mundakkai upper reach
          [76.1410, 11.5435], // Chooralmala Bridge
          [76.1320, 11.5490], // Chooralmala-Meppadi gorge
          [76.1264, 11.5518], // Meppadi bend
          [76.1120, 11.5610], // Valley opening
          [76.0850, 11.5720], // Downstream flats
          [76.0350, 11.5800], // Lowland corridor
          [75.9750, 11.5740], // Malabar plains transition
          [75.9150, 11.5620]
        ]
      }
    },
    // 2. Panamaram River & Banasura Inflow
    {
      type: 'Feature',
      properties: {
        name: 'Panamaram River System',
        basin: 'Kabini',
        flow_direction: 'Downstream Northeast',
        danger_level_m: 4.8,
        current_level_m: 4.3,
        length_km: 26.8
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [75.9450, 11.6580], // Banasura spillway
          [75.9850, 11.6720], // Padinjarathara
          [76.0180, 11.6920], // Kottathara meander
          [76.0520, 11.7120], // Panamaram valley
          [76.0689, 11.7240]  // Koodalkadavu confluence
        ]
      }
    },
    // 3. Mananthavady River
    {
      type: 'Feature',
      properties: {
        name: 'Mananthavady River',
        basin: 'Kabini',
        flow_direction: 'Downstream Southeast',
        danger_level_m: 5.0,
        current_level_m: 4.6,
        length_km: 24.1
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [75.9050, 11.8550], // Periya headwaters
          [75.9550, 11.8250], // Thondernad
          [76.0039, 11.8025], // Mananthavady town
          [76.0380, 11.7650], // River bend
          [76.0689, 11.7240]  // Koodalkadavu confluence
        ]
      }
    },
    // 4. Kabini Main Stem (Post-confluence eastward into Karnataka)
    {
      type: 'Feature',
      properties: {
        name: 'Kabini River Main Stem',
        basin: 'Cauvery',
        flow_direction: 'Downstream East',
        danger_level_m: 5.5,
        current_level_m: 4.9,
        length_km: 28.5
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.0689, 11.7240], // Koodalkadavu
          [76.1180, 11.7210], // Panamaram east
          [76.1750, 11.7150], // Kaniyambetta plain
          [76.2420, 11.7310], // Pulpally south
          [76.3150, 11.7580]  // State boundary
        ]
      }
    },
    // 5. Karapuzha Basin & Kalpetta Drainage Stream
    {
      type: 'Feature',
      properties: {
        name: 'Karapuzha Feeder Channel',
        basin: 'Kabini',
        flow_direction: 'Downstream East',
        danger_level_m: 4.2,
        current_level_m: 3.8,
        length_km: 18.2
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.0827, 11.6103], // Kalpetta
          [76.1250, 11.6240], // Muttil stream
          [76.1680, 11.6210], // Karapuzha reservoir inflow
          [76.2050, 11.6180]  // Reservoir spillway
        ]
      }
    }
  ]
};

// ============================================================================
// 6. EVACUATION ROUTES & ROAD NETWORK (Section 10)
// ============================================================================
export function getRoadsGeoJSON(timelineStepIndex: number): GeoJSON.FeatureCollection {
  // Step 3 (T+14h) or Step 4 (T+24h) has Route B blocked at Chooralmala Bridge!
  const isRouteBBlocked = timelineStepIndex >= 3 && timelineStepIndex <= 4;
  const isRouteBCaution = timelineStepIndex === 1 || timelineStepIndex === 2;

  return {
    type: 'FeatureCollection',
    features: [
      // 1. NH-766 National Highway (Always open, backbone spine)
      {
        type: 'Feature',
        properties: {
          name: 'NH-766 Highway Corridor',
          status: 'OPEN',
          color: '#64748b',
          stroke_width: 3.5,
          speed_kmh: 55
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [76.0200, 11.5400], [76.0827, 11.6103], [76.1280, 11.6420],
            [76.1720, 11.6610], [76.2570, 11.6628]
          ]
        }
      },
      // 2. Route B: Western Ridge Elevated Bypass (Primary Evacuation Path)
      {
        type: 'Feature',
        properties: {
          name: isRouteBBlocked
            ? 'Route B: Chooralmala Bridge SUBMERGED (CUT OFF)'
            : isRouteBCaution
            ? 'Route B: Elevated Ridge Bypass (Water on Low Segments)'
            : 'Route B: Western Ridge Elevated Bypass (SAFE CORRIDOR)',
          status: isRouteBBlocked ? 'BLOCKED' : isRouteBCaution ? 'CAUTION' : 'RECOMMENDED_SAFE',
          color: isRouteBBlocked ? '#ef4444' : isRouteBCaution ? '#f59e0b' : '#22c55e',
          stroke_width: isRouteBBlocked ? 5.5 : 4.5
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [76.1452, 11.5458], [76.1380, 11.5435], [76.1310, 11.5600],
            [76.1150, 11.5820], [76.0950, 11.6020], [76.0827, 11.6103],
            [76.1280, 11.6420]
          ]
        }
      },
      // 3. Route C: Northern Elevated Evacuation Route (Active when Route B blocked)
      {
        type: 'Feature',
        properties: {
          name: 'Route C: Northern Granitic Crest Corridor (ACTIVE BYPASS)',
          status: isRouteBBlocked ? 'ACTIVE_PRIMARY' : 'STANDBY',
          color: isRouteBBlocked ? '#10b981' : '#38bdf8',
          stroke_width: isRouteBBlocked ? 5.0 : 3.0
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [76.1452, 11.5458], [76.1580, 11.5620], [76.1680, 11.5950],
            [76.1820, 11.6320], [76.2163, 11.6214], [76.2570, 11.6628]
          ]
        }
      },
      // 4. Route A: Low Valley Road (Flash Inundated)
      {
        type: 'Feature',
        properties: {
          name: 'Route A: Riverbank Lowland Road',
          status: 'BLOCKED',
          color: '#dc2626',
          stroke_width: 3.5
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [76.1452, 11.5458], [76.1360, 11.5400], [76.1264, 11.5518]
          ]
        }
      }
    ]
  };
}

// ============================================================================
// 7. DYNAMIC FLOODPLAIN INUNDATION POLYGONS (Section 3 & 4)
// ============================================================================
export function getFloodInundationGeoJSON(timelineStepIndex: number): GeoJSON.FeatureCollection {
  // Flood extends dynamically as river level increases
  // T0: baseline (~0.8 sq km)
  // T+4h: Chaliyar riverbank breach (~2.4 sq km)
  // T+9h: Valley expansion (~4.5 sq km)
  // T+14h: Peak flash inundation covering valley floor (~8.2 sq km)
  const features: GeoJSON.Feature[] = [];

  if (timelineStepIndex >= 0) {
    // Primary Riverbed Buffer
    features.push({
      type: 'Feature',
      properties: { name: 'Chaliyar Active River Channel', flood_depth_m: 1.8, risk: 'MODERATE' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.1410, 11.5380], [76.1360, 11.5440], [76.1280, 11.5500],
          [76.1240, 11.5540], [76.1280, 11.5520], [76.1380, 11.5460],
          [76.1430, 11.5400], [76.1410, 11.5380]
        ]]
      }
    });
  }

  if (timelineStepIndex >= 1) { // T+4h (River Warning Breach +0.3m)
    features.push({
      type: 'Feature',
      properties: { name: 'Chaliyar Floodplain Tier 1 (+0.3m Breach)', flood_depth_m: 2.6, risk: 'HIGH' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.1460, 11.5360], [76.1390, 11.5420], [76.1320, 11.5480],
          [76.1220, 11.5520], [76.1150, 11.5580], [76.1180, 11.5640],
          [76.1300, 11.5580], [76.1420, 11.5500], [76.1490, 11.5420],
          [76.1460, 11.5360]
        ]]
      }
    });
  }

  if (timelineStepIndex >= 2) { // T+9h (Soil Moisture >90% Runout Inundation)
    features.push({
      type: 'Feature',
      properties: { name: 'Mundakkai Debris Splay Inundation Zone', flood_depth_m: 3.4, risk: 'CRITICAL' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.1220, 11.5260], [76.1360, 11.5250], [76.1420, 11.5380],
          [76.1350, 11.5450], [76.1200, 11.5440], [76.1140, 11.5340],
          [76.1220, 11.5260]
        ]]
      }
    });
  }

  if (timelineStepIndex >= 3) { // T+14h (Peak Flash Flood covering Chooralmala Bridge & Meppadi Valley)
    features.push({
      type: 'Feature',
      properties: { name: 'Peak Valley Flash Inundation (Bridge Submergence)', flood_depth_m: 4.8, risk: 'CRITICAL_BREACH' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.1520, 11.5350], [76.1600, 11.5480], [76.1510, 11.5600],
          [76.1350, 11.5650], [76.1180, 11.5680], [76.1080, 11.5580],
          [76.1120, 11.5450], [76.1280, 11.5380], [76.1450, 11.5320],
          [76.1520, 11.5350]
        ]]
      }
    });
  }

  return { type: 'FeatureCollection', features };
}

// ============================================================================
// 8. LANDSLIDE SUSCEPTIBILITY WITH SLOPE & FoS (Section 9)
// ============================================================================
export function getLandslideSusceptibilityGeoJSON(timelineStepIndex: number): GeoJSON.FeatureCollection {
  const isFailure = timelineStepIndex >= 2; // T+9h onwards FoS < 0.60
  return {
    type: 'FeatureCollection',
    features: [
      // 1. Mundakkai Chembra Scarp Chute (Slope 38 deg)
      {
        type: 'Feature',
        properties: {
          name: 'Mundakkai Chembra Chute',
          slope_deg: 38.5,
          soil_moisture_pct: isFailure ? 93.4 : 87.2,
          fos: isFailure ? 0.54 : 0.68,
          risk: isFailure ? 'CRITICAL_FAILURE' : 'HIGH_INSTABILITY',
          color: isFailure ? '#dc2626' : '#ea580c'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [76.1260, 11.5200], [76.1440, 11.5180], [76.1460, 11.5320],
            [76.1340, 11.5360], [76.1220, 11.5280], [76.1260, 11.5200]
          ]]
        }
      },
      // 2. Chooralmala Valley Ridge Chute (Slope 34 deg)
      {
        type: 'Feature',
        properties: {
          name: 'Chooralmala Valley Scarp',
          slope_deg: 34.0,
          soil_moisture_pct: isFailure ? 92.0 : 86.5,
          fos: isFailure ? 0.58 : 0.71,
          risk: isFailure ? 'CRITICAL_FAILURE' : 'HIGH_INSTABILITY',
          color: isFailure ? '#dc2626' : '#f97316'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [76.1420, 11.5400], [76.1560, 11.5380], [76.1600, 11.5540],
            [76.1450, 11.5580], [76.1380, 11.5480], [76.1420, 11.5400]
          ]]
        }
      },
      // 3. Vellarimala Torrential Ravines (Slope 42 deg)
      {
        type: 'Feature',
        properties: {
          name: 'Vellarimala Western Escarpment',
          slope_deg: 42.0,
          soil_moisture_pct: isFailure ? 95.0 : 88.0,
          fos: isFailure ? 0.51 : 0.65,
          risk: 'CRITICAL_FAILURE',
          color: '#dc2626'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [76.0950, 11.4850], [76.1180, 11.4880], [76.1150, 11.5050],
            [76.0920, 11.5020], [76.0950, 11.4850]
          ]]
        }
      }
    ]
  };
}

// ============================================================================
// 9. DYNAMIC MULTI-HAZARD ZONES GEOJSON (Derived from Multi-Hazard Engine)
// ============================================================================
export function getMultiHazardZonesGeoJSON(timelineStepIndex: number): {
  critical: GeoJSON.FeatureCollection;
  highRisk: GeoJSON.FeatureCollection;
  watch: GeoJSON.FeatureCollection;
  safe: GeoJSON.FeatureCollection;
} {
  const step = CYCLONE_TIMELINE_STEPS[timelineStepIndex] || CYCLONE_TIMELINE_STEPS[0];
  const locations = getLocationsForCycloneStep(timelineStepIndex);

  const critFeatures: GeoJSON.Feature[] = [];
  const highFeatures: GeoJSON.Feature[] = [];
  const watchFeatures: GeoJSON.Feature[] = [];
  const safeFeatures: GeoJSON.Feature[] = [];

  // Polygons around key settlements
  const polygonBounds: Record<string, [number, number][]> = {
    'ZN-01': [[76.138, 11.542], [76.155, 11.540], [76.159, 11.552], [76.148, 11.558], [76.136, 11.552], [76.138, 11.542]],
    'ZN-02': [[76.120, 11.528], [76.135, 11.527], [76.139, 11.539], [76.126, 11.542], [76.118, 11.535], [76.120, 11.528]],
    'ZN-03': [[76.118, 11.545], [76.134, 11.546], [76.135, 11.558], [76.121, 11.560], [76.118, 11.545]],
    'ZN-04': [[76.095, 11.485], [76.115, 11.485], [76.118, 11.505], [76.095, 11.505], [76.095, 11.485]],
    'ZN-05': [[75.992, 11.795], [76.015, 11.796], [76.016, 11.810], [75.995, 11.811], [75.992, 11.795]],
    'ZN-06': [[76.058, 11.716], [76.080, 11.718], [76.079, 11.732], [76.059, 11.730], [76.058, 11.716]],
    'ZN-07': [[75.975, 11.662], [75.995, 11.663], [75.996, 11.678], [75.976, 11.677], [75.975, 11.662]],
    'ZN-11': [[76.072, 11.602], [76.094, 11.603], [76.095, 11.618], [76.074, 11.617], [76.072, 11.602]],
    'ZN-16': [[76.242, 11.652], [76.272, 11.653], [76.273, 11.674], [76.244, 11.673], [76.242, 11.652]],
    'ZN-17': [[76.115, 11.632], [76.141, 11.633], [76.142, 11.652], [76.117, 11.651], [76.115, 11.632]]
  };

  locations.forEach((loc) => {
    const coords = polygonBounds[loc.id];
    if (!coords) return;

    const feature: GeoJSON.Feature = {
      type: 'Feature',
      properties: {
        id: loc.id,
        name: loc.name,
        risk_score: loc.risk_score,
        risk_level: loc.risk_level,
        primary_hazard: loc.primary_hazard,
        lead_time: loc.lead_time_formatted,
        multi_hazard_index: loc.risk_score
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    };

    if (loc.risk_level === 'CRITICAL') critFeatures.push(feature);
    else if (loc.risk_level === 'HIGH_RISK') highFeatures.push(feature);
    else if (loc.risk_level === 'WATCH') watchFeatures.push(feature);
    else safeFeatures.push(feature);
  });

  return {
    critical: { type: 'FeatureCollection', features: critFeatures },
    highRisk: { type: 'FeatureCollection', features: highFeatures },
    watch: { type: 'FeatureCollection', features: watchFeatures },
    safe: { type: 'FeatureCollection', features: safeFeatures }
  };
}

// ============================================================================
// 10. CYCLONE GEOMETRIES (Cone, Wind, Tracks)
// ============================================================================
export const CYCLONE_HISTORICAL_TRACK_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Historical Track', style: 'solid' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [75.60, 9.20], [75.35, 9.90], [75.10, 10.50], [74.85, 11.25]
        ]
      }
    }
  ]
};

export const CYCLONE_FORECAST_TRACK_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Forecast Track', style: 'dashed' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.85, 11.25], [74.60, 11.85], [74.35, 12.45], [73.90, 13.20], [73.20, 14.10]
        ]
      }
    }
  ]
};

export const CYCLONE_UNCERTAINTY_CONE_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Probability Cone of Uncertainty (IMD)' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.85, 11.25], [74.30, 11.85], [73.85, 12.50], [73.30, 13.25],
          [72.60, 14.10], [74.40, 14.10], [74.85, 13.20], [74.90, 12.45],
          [74.95, 11.85], [74.85, 11.25]
        ]]
      }
    }
  ]
};

export const CYCLONE_WIND_ZONES_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { risk_level: 'EXTREME', name: 'Extreme Gale Wind Zone (>120 km/h)', color: '#ef4444', fill_opacity: 0.30 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.85, 11.65], [75.15, 11.50], [75.25, 11.25], [75.15, 11.00],
          [74.85, 10.85], [74.55, 11.00], [74.45, 11.25], [74.55, 11.50], [74.85, 11.65]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { risk_level: 'HIGH', name: 'High Wind Zone (90-120 km/h)', color: '#f97316', fill_opacity: 0.22 },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.85, 12.05], [75.45, 11.75], [75.65, 11.25], [75.45, 10.75],
          [74.85, 10.45], [74.25, 10.75], [74.05, 11.25], [74.25, 11.75], [74.85, 12.05]
        ]]
      }
    }
  ]
};

export const CYCLONE_RAINFALL_SWATH_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Heavy Orographic Rainfall Swath (>150mm/12h)' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [75.80, 11.40], [76.30, 11.45], [76.35, 11.85], [75.85, 11.80], [75.80, 11.40]
        ]]
      }
    }
  ]
};

export const CYCLONE_LANDSLIDE_SUSCEPTIBILITY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Critical Landslide Chutes (Chooralmala-Mundakkai Escarpment)' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [76.10, 11.50], [76.16, 11.51], [76.17, 11.57], [76.11, 11.56], [76.10, 11.50]
        ]]
      }
    }
  ]
};

export const WAYANAD_DISTRICT_BOUNDARY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Wayanad District Administrative Boundary' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [75.9200, 11.9500], [76.0500, 11.9600], [76.2200, 11.8800],
          [76.3800, 11.7800], [76.4200, 11.6500], [76.3500, 11.5200],
          [76.2200, 11.4500], [76.0800, 11.4800], [75.9600, 11.5500],
          [75.8800, 11.7000], [75.9200, 11.9500]
        ]]
      }
    }
  ]
};

// ============================================================================
// 11. DYNAMIC LOCATIONS PER TIMELINE STEP (Formula Based Normalized Multi-Hazard)
// ============================================================================
export function getLocationsForCycloneStep(stepIndex: number): GeoLocation[] {
  // Step 0: T0 (Current)
  // Step 1: T+4h (River Warning Breach)
  // Step 2: T+9h (Soil Moisture > 90% Landslide Failure)
  // Step 3: T+14h (Peak Valley Flood & Route B Cutoff)
  // Step 4: T+24h (Prolonged Backwater)
  // Step 5: T+48h (Receding Stabilization)

  return WAYANAD_LOCATIONS.map((base) => {
    let cyc = base.hazard_breakdown?.cyclone || 50;
    let rain = base.hazard_breakdown?.rainfall || 50;
    let flood = base.hazard_breakdown?.flood || 50;
    let slide = base.hazard_breakdown?.landslide || 50;
    let pop = base.population_exposed;
    let leadFormatted = base.lead_time_formatted;
    let leadMin = base.lead_time_minutes;
    let priority = base.evac_priority;

    if (stepIndex === 0) { // T0
      // Baseline values as defined
    } else if (stepIndex === 1) { // T+4h
      flood = Math.min(100, Math.round(flood * 1.12));
      rain = Math.min(100, Math.round(rain * 1.08));
      pop = Math.round(pop * 1.10);
      leadMin = Math.max(30, leadMin - 30);
      leadFormatted = `${Math.floor(leadMin / 60)}h ${leadMin % 60}m`;
    } else if (stepIndex === 2) { // T+9h
      slide = Math.min(100, Math.round(slide * 1.25));
      flood = Math.min(100, Math.round(flood * 1.18));
      pop = Math.round(pop * 1.20);
      leadMin = Math.max(15, leadMin - 60);
      leadFormatted = `${Math.floor(leadMin / 60)}h ${leadMin % 60}m`;
      if (base.risk_level === 'HIGH_RISK') priority = 'P1 ACT NOW';
    } else if (stepIndex === 3) { // T+14h (Peak)
      flood = Math.min(100, Math.round(flood * 1.35));
      slide = Math.min(100, Math.round(slide * 1.30));
      pop = Math.round(pop * 1.35);
      leadMin = Math.max(0, leadMin - 105);
      leadFormatted = leadMin === 0 ? '0m IMPACT' : `${Math.floor(leadMin / 60)}h ${leadMin % 60}m`;
      if (base.risk_score >= 70) priority = 'P1 ACT NOW';
    } else if (stepIndex === 4) { // T+24h
      flood = Math.min(100, Math.round(flood * 1.20));
      pop = Math.round(pop * 1.15);
      leadFormatted = 'Secondary Surge';
    } else if (stepIndex === 5) { // T+48h
      flood = Math.max(15, Math.round(flood * 0.65));
      slide = Math.max(15, Math.round(slide * 0.60));
      rain = Math.max(20, Math.round(rain * 0.50));
      pop = Math.round(pop * 0.60);
      leadFormatted = 'Recovery Phase';
    }

    const { score, level } = computeMultiHazardScore(cyc, rain, flood, slide);

    return {
      ...base,
      risk_score: score,
      risk_level: level,
      population_exposed: pop,
      lead_time_formatted: leadFormatted,
      lead_time_minutes: leadMin,
      evac_priority: priority,
      hazard_breakdown: { cyclone: cyc, rainfall: rain, flood, landslide: slide }
    };
  });
}

// Fallback exports for backward compatibility
export const CRITICAL_DANGER_ZONES_GEOJSON: GeoJSON.FeatureCollection = getMultiHazardZonesGeoJSON(0).critical;
export const HIGH_RISK_ZONES_GEOJSON: GeoJSON.FeatureCollection = getMultiHazardZonesGeoJSON(0).highRisk;
export const WATCH_ZONES_GEOJSON: GeoJSON.FeatureCollection = getMultiHazardZonesGeoJSON(0).watch;
export const SAFE_ZONES_GEOJSON: GeoJSON.FeatureCollection = getMultiHazardZonesGeoJSON(0).safe;
export const WAYANAD_ROADS_GEOJSON: GeoJSON.FeatureCollection = getRoadsGeoJSON(0);
export const CYCLONE_LIVE_DATA = {
  name: 'SEVERE CYCLONIC STORM SHAKTI (ARB-02)',
  intensity: 'Sustained 110 km/h | Gusts 135 km/h',
  pressure: '978 hPa',
  movement: 'NNW at 14 km/h',
  eye_coordinates: [75.10, 10.90] as [number, number]
};
