import json
from typing import Dict, List, Any
from models import (
    Zone, Demographics, Infrastructure, HazardFactors, RiskScore,
    RiskLevel, PriorityLevel, ExplainableAttribution, Shelter,
    ShelterStatus, ShelterResources, AlertMessage
)

# 12 Administrative Wards/Villages in Kaveri-Wayanad Basin
RAW_ZONES = [
    {
        "id": "ZN-01",
        "name": "Mundakkai Riverside",
        "taluk": "Vythiri",
        "centroid_lat": 11.5342,
        "centroid_lng": 76.1284,
        "polygon_coords": [
            [11.540, 76.120], [11.542, 76.135], [11.530, 76.138],
            [11.526, 76.125], [11.540, 76.120]
        ],
        "demographics": {
            "total_population": 4820,
            "exposed_population": 3940,
            "children": 620,
            "elderly": 480,
            "pwd": 87,
            "medically_dependent": 42,
            "vulnerable_households": 340
        },
        "infrastructure": {
            "buildings_total": 940,
            "buildings_inundated": 412,
            "hospitals": 1,
            "schools": 2,
            "bridges": 2,
            "critical_facilities": 3
        },
        "hazard_factors": {
            "rainfall_mm": 195.0,
            "rainfall_forecast_24h_mm": 230.0,
            "river_level_m": 6.8,
            "elevation_m": 710.0,
            "slope_deg": 28.5,
            "soil_saturation_pct": 94.0,
            "distance_to_river_m": 45.0,
            "historical_flood_freq": 7,
            "drainage_capacity_score": 0.25
        },
        "evacuated_count": 820,
        "in_risk_count": 2980,
        "trapped_count": 140
    },
    {
        "id": "ZN-02",
        "name": "Chooralmala Valley",
        "taluk": "Vythiri",
        "centroid_lat": 11.5510,
        "centroid_lng": 76.1550,
        "polygon_coords": [
            [11.558, 76.148], [11.560, 76.164], [11.544, 76.166],
            [11.542, 76.149], [11.558, 76.148]
        ],
        "demographics": {
            "total_population": 5210,
            "exposed_population": 4650,
            "children": 740,
            "elderly": 590,
            "pwd": 112,
            "medically_dependent": 58,
            "vulnerable_households": 410
        },
        "infrastructure": {
            "buildings_total": 1120,
            "buildings_inundated": 680,
            "hospitals": 1,
            "schools": 3,
            "bridges": 3,
            "critical_facilities": 4
        },
        "hazard_factors": {
            "rainfall_mm": 210.0,
            "rainfall_forecast_24h_mm": 245.0,
            "river_level_m": 7.1,
            "elevation_m": 690.0,
            "slope_deg": 32.0,
            "soil_saturation_pct": 96.5,
            "distance_to_river_m": 30.0,
            "historical_flood_freq": 8,
            "drainage_capacity_score": 0.20
        },
        "evacuated_count": 1100,
        "in_risk_count": 3320,
        "trapped_count": 230
    },
    {
        "id": "ZN-03",
        "name": "Meppadi Lowland",
        "taluk": "Vythiri",
        "centroid_lat": 11.5580,
        "centroid_lng": 76.1260,
        "polygon_coords": [
            [11.565, 76.118], [11.568, 76.134], [11.550, 76.136],
            [11.548, 76.120], [11.565, 76.118]
        ],
        "demographics": {
            "total_population": 6340,
            "exposed_population": 4820,
            "children": 810,
            "elderly": 640,
            "pwd": 95,
            "medically_dependent": 44,
            "vulnerable_households": 380
        },
        "infrastructure": {
            "buildings_total": 1450,
            "buildings_inundated": 520,
            "hospitals": 2,
            "schools": 4,
            "bridges": 2,
            "critical_facilities": 5
        },
        "hazard_factors": {
            "rainfall_mm": 180.0,
            "rainfall_forecast_24h_mm": 210.0,
            "river_level_m": 6.4,
            "elevation_m": 730.0,
            "slope_deg": 18.0,
            "soil_saturation_pct": 89.0,
            "distance_to_river_m": 80.0,
            "historical_flood_freq": 6,
            "drainage_capacity_score": 0.35
        },
        "evacuated_count": 1450,
        "in_risk_count": 3280,
        "trapped_count": 90
    },
    {
        "id": "ZN-04",
        "name": "Attamala Hillside",
        "taluk": "Vythiri",
        "centroid_lat": 11.5200,
        "centroid_lng": 76.1400,
        "polygon_coords": [
            [11.528, 76.132], [11.530, 76.148], [11.512, 76.150],
            [11.510, 76.134], [11.528, 76.132]
        ],
        "demographics": {
            "total_population": 3100,
            "exposed_population": 2410,
            "children": 380,
            "elderly": 320,
            "pwd": 45,
            "medically_dependent": 21,
            "vulnerable_households": 190
        },
        "infrastructure": {
            "buildings_total": 620,
            "buildings_inundated": 180,
            "hospitals": 0,
            "schools": 1,
            "bridges": 1,
            "critical_facilities": 2
        },
        "hazard_factors": {
            "rainfall_mm": 175.0,
            "rainfall_forecast_24h_mm": 205.0,
            "river_level_m": 5.9,
            "elevation_m": 820.0,
            "slope_deg": 34.0,
            "soil_saturation_pct": 91.0,
            "distance_to_river_m": 120.0,
            "historical_flood_freq": 5,
            "drainage_capacity_score": 0.30
        },
        "evacuated_count": 650,
        "in_risk_count": 1720,
        "trapped_count": 40
    },
    {
        "id": "ZN-05",
        "name": "Kalpetta South Basin",
        "taluk": "Kalpetta",
        "centroid_lat": 11.6050,
        "centroid_lng": 76.0820,
        "polygon_coords": [
            [11.614, 76.072], [11.616, 76.092], [11.596, 76.094],
            [11.594, 76.074], [11.614, 76.072]
        ],
        "demographics": {
            "total_population": 8400,
            "exposed_population": 3600,
            "children": 1050,
            "elderly": 890,
            "pwd": 130,
            "medically_dependent": 65,
            "vulnerable_households": 510
        },
        "infrastructure": {
            "buildings_total": 2200,
            "buildings_inundated": 310,
            "hospitals": 3,
            "schools": 6,
            "bridges": 4,
            "critical_facilities": 8
        },
        "hazard_factors": {
            "rainfall_mm": 130.0,
            "rainfall_forecast_24h_mm": 160.0,
            "river_level_m": 4.8,
            "elevation_m": 780.0,
            "slope_deg": 12.0,
            "soil_saturation_pct": 74.0,
            "distance_to_river_m": 210.0,
            "historical_flood_freq": 3,
            "drainage_capacity_score": 0.55
        },
        "evacuated_count": 1800,
        "in_risk_count": 1750,
        "trapped_count": 50
    },
    {
        "id": "ZN-06",
        "name": "Vellarimala Foot",
        "taluk": "Vythiri",
        "centroid_lat": 11.4850,
        "centroid_lng": 76.1650,
        "polygon_coords": [
            [11.495, 76.155], [11.498, 76.175], [11.475, 76.178],
            [11.472, 76.158], [11.495, 76.155]
        ],
        "demographics": {
            "total_population": 2900,
            "exposed_population": 2100,
            "children": 350,
            "elderly": 290,
            "pwd": 38,
            "medically_dependent": 18,
            "vulnerable_households": 180
        },
        "infrastructure": {
            "buildings_total": 580,
            "buildings_inundated": 240,
            "hospitals": 0,
            "schools": 1,
            "bridges": 2,
            "critical_facilities": 2
        },
        "hazard_factors": {
            "rainfall_mm": 185.0,
            "rainfall_forecast_24h_mm": 220.0,
            "river_level_m": 6.2,
            "elevation_m": 790.0,
            "slope_deg": 35.0,
            "soil_saturation_pct": 93.0,
            "distance_to_river_m": 70.0,
            "historical_flood_freq": 6,
            "drainage_capacity_score": 0.28
        },
        "evacuated_count": 520,
        "in_risk_count": 1510,
        "trapped_count": 70
    },
    {
        "id": "ZN-07",
        "name": "Mananthavady North Riverfront",
        "taluk": "Mananthavady",
        "centroid_lat": 11.8020,
        "centroid_lng": 76.0040,
        "polygon_coords": [
            [11.812, 76.000], [11.815, 76.015], [11.792, 76.018],
            [11.790, 76.002], [11.812, 76.000]
        ],
        "demographics": {
            "total_population": 7200,
            "exposed_population": 4100,
            "children": 890,
            "elderly": 760,
            "pwd": 110,
            "medically_dependent": 52,
            "vulnerable_households": 420
        },
        "infrastructure": {
            "buildings_total": 1650,
            "buildings_inundated": 490,
            "hospitals": 2,
            "schools": 4,
            "bridges": 3,
            "critical_facilities": 6
        },
        "hazard_factors": {
            "rainfall_mm": 160.0,
            "rainfall_forecast_24h_mm": 190.0,
            "river_level_m": 5.8,
            "elevation_m": 740.0,
            "slope_deg": 14.0,
            "soil_saturation_pct": 86.0,
            "distance_to_river_m": 60.0,
            "historical_flood_freq": 5,
            "drainage_capacity_score": 0.40
        },
        "evacuated_count": 1300,
        "in_risk_count": 2720,
        "trapped_count": 80
    },
    {
        "id": "ZN-08",
        "name": "Sulthan Bathery East",
        "taluk": "Sulthan Bathery",
        "centroid_lat": 11.6620,
        "centroid_lng": 76.2580,
        "polygon_coords": [
            [11.672, 76.248], [11.675, 76.268], [11.652, 76.270],
            [11.650, 76.250], [11.672, 76.248]
        ],
        "demographics": {
            "total_population": 9100,
            "exposed_population": 2200,
            "children": 1120,
            "elderly": 940,
            "pwd": 140,
            "medically_dependent": 70,
            "vulnerable_households": 310
        },
        "infrastructure": {
            "buildings_total": 2400,
            "buildings_inundated": 110,
            "hospitals": 4,
            "schools": 7,
            "bridges": 2,
            "critical_facilities": 9
        },
        "hazard_factors": {
            "rainfall_mm": 95.0,
            "rainfall_forecast_24h_mm": 115.0,
            "river_level_m": 3.6,
            "elevation_m": 930.0,
            "slope_deg": 8.0,
            "soil_saturation_pct": 58.0,
            "distance_to_river_m": 450.0,
            "historical_flood_freq": 2,
            "drainage_capacity_score": 0.70
        },
        "evacuated_count": 400,
        "in_risk_count": 1790,
        "trapped_count": 10
    },
    {
        "id": "ZN-09",
        "name": "Panamaram Confluence",
        "taluk": "Mananthavady",
        "centroid_lat": 11.7450,
        "centroid_lng": 76.0720,
        "polygon_coords": [
            [11.755, 76.062], [11.758, 76.082], [11.735, 76.084],
            [11.732, 76.064], [11.755, 76.062]
        ],
        "demographics": {
            "total_population": 5800,
            "exposed_population": 3950,
            "children": 710,
            "elderly": 610,
            "pwd": 88,
            "medically_dependent": 39,
            "vulnerable_households": 360
        },
        "infrastructure": {
            "buildings_total": 1300,
            "buildings_inundated": 460,
            "hospitals": 1,
            "schools": 3,
            "bridges": 3,
            "critical_facilities": 5
        },
        "hazard_factors": {
            "rainfall_mm": 170.0,
            "rainfall_forecast_24h_mm": 200.0,
            "river_level_m": 6.1,
            "elevation_m": 720.0,
            "slope_deg": 16.0,
            "soil_saturation_pct": 88.0,
            "distance_to_river_m": 50.0,
            "historical_flood_freq": 6,
            "drainage_capacity_score": 0.32
        },
        "evacuated_count": 1150,
        "in_risk_count": 2710,
        "trapped_count": 90
    },
    {
        "id": "ZN-10",
        "name": "Pookode Highland Plateau",
        "taluk": "Vythiri",
        "centroid_lat": 11.5420,
        "centroid_lng": 76.0280,
        "polygon_coords": [
            [11.552, 76.018], [11.555, 76.038], [11.532, 76.040],
            [11.530, 76.020], [11.552, 76.018]
        ],
        "demographics": {
            "total_population": 3600,
            "exposed_population": 980,
            "children": 420,
            "elderly": 360,
            "pwd": 35,
            "medically_dependent": 19,
            "vulnerable_households": 110
        },
        "infrastructure": {
            "buildings_total": 780,
            "buildings_inundated": 40,
            "hospitals": 1,
            "schools": 2,
            "bridges": 1,
            "critical_facilities": 3
        },
        "hazard_factors": {
            "rainfall_mm": 110.0,
            "rainfall_forecast_24h_mm": 130.0,
            "river_level_m": 3.2,
            "elevation_m": 880.0,
            "slope_deg": 10.0,
            "soil_saturation_pct": 62.0,
            "distance_to_river_m": 600.0,
            "historical_flood_freq": 2,
            "drainage_capacity_score": 0.65
        },
        "evacuated_count": 200,
        "in_risk_count": 775,
        "trapped_count": 5
    },
    {
        "id": "ZN-11",
        "name": "Ambalavayal Ridge",
        "taluk": "Sulthan Bathery",
        "centroid_lat": 11.6210,
        "centroid_lng": 76.2150,
        "polygon_coords": [
            [11.631, 76.205], [11.634, 76.225], [11.611, 76.227],
            [11.609, 76.207], [11.631, 76.205]
        ],
        "demographics": {
            "total_population": 4900,
            "exposed_population": 1250,
            "children": 580,
            "elderly": 490,
            "pwd": 52,
            "medically_dependent": 28,
            "vulnerable_households": 160
        },
        "infrastructure": {
            "buildings_total": 1100,
            "buildings_inundated": 65,
            "hospitals": 1,
            "schools": 3,
            "bridges": 1,
            "critical_facilities": 4
        },
        "hazard_factors": {
            "rainfall_mm": 105.0,
            "rainfall_forecast_24h_mm": 125.0,
            "river_level_m": 3.5,
            "elevation_m": 910.0,
            "slope_deg": 9.0,
            "soil_saturation_pct": 60.0,
            "distance_to_river_m": 520.0,
            "historical_flood_freq": 2,
            "drainage_capacity_score": 0.68
        },
        "evacuated_count": 350,
        "in_risk_count": 890,
        "trapped_count": 10
    },
    {
        "id": "ZN-12",
        "name": "Banasura Foothill",
        "taluk": "Vythiri",
        "centroid_lat": 11.6750,
        "centroid_lng": 75.9550,
        "polygon_coords": [
            [11.685, 75.945], [11.688, 75.965], [11.665, 75.967],
            [11.663, 75.947], [11.685, 75.945]
        ],
        "demographics": {
            "total_population": 4200,
            "exposed_population": 2680,
            "children": 520,
            "elderly": 430,
            "pwd": 62,
            "medically_dependent": 31,
            "vulnerable_households": 240
        },
        "infrastructure": {
            "buildings_total": 890,
            "buildings_inundated": 290,
            "hospitals": 1,
            "schools": 2,
            "bridges": 2,
            "critical_facilities": 4
        },
        "hazard_factors": {
            "rainfall_mm": 165.0,
            "rainfall_forecast_24h_mm": 195.0,
            "river_level_m": 5.7,
            "elevation_m": 840.0,
            "slope_deg": 26.0,
            "soil_saturation_pct": 87.0,
            "distance_to_river_m": 90.0,
            "historical_flood_freq": 5,
            "drainage_capacity_score": 0.38
        },
        "evacuated_count": 780,
        "in_risk_count": 1840,
        "trapped_count": 60
    }
]

# 8 Designated Shelters in the District with Resource Vectors
RAW_SHELTERS = [
    {
        "id": "SH-01",
        "name": "St. Joseph Higher Secondary School Camp",
        "lat": 11.5650,
        "lng": 76.1380,
        "max_capacity": 1500,
        "current_occupancy": 1180,
        "is_in_flood_plain": False,
        "distance_from_river_m": 620.0,
        "resources": {
            "water_liters_per_person_day": 22.0,
            "food_stock_days": 6.5,
            "toilet_ratio": 32.0,
            "medical_staff_count": 4,
            "isolation_beds": 18,
            "backup_generator": True,
            "structural_safety_grade": "A"
        }
    },
    {
        "id": "SH-02",
        "name": "Meppadi Community Multipurpose Cyclone Shelter",
        "lat": 11.5720,
        "lng": 76.1150,
        "max_capacity": 2200,
        "current_occupancy": 850,
        "is_in_flood_plain": False,
        "distance_from_river_m": 850.0,
        "resources": {
            "water_liters_per_person_day": 28.0,
            "food_stock_days": 9.0,
            "toilet_ratio": 26.0,
            "medical_staff_count": 6,
            "isolation_beds": 30,
            "backup_generator": True,
            "structural_safety_grade": "A"
        }
    },
    {
        "id": "SH-03",
        "name": "Government Polytechnic College Relief Center",
        "lat": 11.5890,
        "lng": 76.1020,
        "max_capacity": 1800,
        "current_occupancy": 640,
        "is_in_flood_plain": False,
        "distance_from_river_m": 1100.0,
        "resources": {
            "water_liters_per_person_day": 25.0,
            "food_stock_days": 8.0,
            "toilet_ratio": 28.0,
            "medical_staff_count": 5,
            "isolation_beds": 24,
            "backup_generator": True,
            "structural_safety_grade": "A"
        }
    },
    {
        "id": "SH-04",
        "name": "Vythiri High School Emergency Hall",
        "lat": 11.5480,
        "lng": 76.0420,
        "max_capacity": 1200,
        "current_occupancy": 1150,
        "is_in_flood_plain": False,
        "distance_from_river_m": 450.0,
        "resources": {
            "water_liters_per_person_day": 14.0,
            "food_stock_days": 2.5,
            "toilet_ratio": 48.0,
            "medical_staff_count": 2,
            "isolation_beds": 8,
            "backup_generator": True,
            "structural_safety_grade": "B"
        }
    },
    {
        "id": "SH-05",
        "name": "Kalpetta District Indoor Stadium",
        "lat": 11.6120,
        "lng": 76.0850,
        "max_capacity": 3000,
        "current_occupancy": 1400,
        "is_in_flood_plain": False,
        "distance_from_river_m": 980.0,
        "resources": {
            "water_liters_per_person_day": 30.0,
            "food_stock_days": 12.0,
            "toilet_ratio": 22.0,
            "medical_staff_count": 10,
            "isolation_beds": 45,
            "backup_generator": True,
            "structural_safety_grade": "A"
        }
    },
    {
        "id": "SH-06",
        "name": "Mananthavady Government Higher Secondary Camp",
        "lat": 11.8080,
        "lng": 76.0120,
        "max_capacity": 1600,
        "current_occupancy": 920,
        "is_in_flood_plain": False,
        "distance_from_river_m": 750.0,
        "resources": {
            "water_liters_per_person_day": 20.0,
            "food_stock_days": 6.0,
            "toilet_ratio": 35.0,
            "medical_staff_count": 4,
            "isolation_beds": 15,
            "backup_generator": True,
            "structural_safety_grade": "A"
        }
    },
    {
        "id": "SH-07",
        "name": "Banasura Valley Camp 3 (Low Elevation)",
        "lat": 11.6620,
        "lng": 75.9620,
        "max_capacity": 900,
        "current_occupancy": 890,
        "is_in_flood_plain": True,
        "distance_from_river_m": 120.0,
        "resources": {
            "water_liters_per_person_day": 8.0,
            "food_stock_days": 1.5,
            "toilet_ratio": 65.0,
            "medical_staff_count": 1,
            "isolation_beds": 4,
            "backup_generator": False,
            "structural_safety_grade": "UNSAFE"
        }
    },
    {
        "id": "SH-08",
        "name": "Sulthan Bathery Municipal Town Hall",
        "lat": 11.6680,
        "lng": 76.2620,
        "max_capacity": 2500,
        "current_occupancy": 450,
        "is_in_flood_plain": False,
        "distance_from_river_m": 1400.0,
        "resources": {
            "water_liters_per_person_day": 35.0,
            "food_stock_days": 14.0,
            "toilet_ratio": 20.0,
            "medical_staff_count": 8,
            "isolation_beds": 35,
            "backup_generator": True,
            "structural_safety_grade": "A"
        }
    }
]

# Initial Active Alerts
INITIAL_ALERTS = [
    {
        "id": "ALT-101",
        "timestamp": "10-Sep-2026 13:25 IST",
        "severity": "CRITICAL",
        "title": "RED ALERT: Mundakkai & Chooralmala Flash Flood & Debris Flow",
        "message": "Immediate mandatory evacuation ordered for Mundakkai Riverside & Chooralmala Valley. Rapid water surge exceeding danger mark by 1.8m. Proceed via Route B (Elevated Bypass) to Meppadi Community Multipurpose Shelter (SH-02). Do NOT take Bridge 2 road.",
        "target_zone_id": "ZN-01",
        "recommended_shelter_id": "SH-02",
        "evacuation_window_min": 75,
        "is_active": True
    },
    {
        "id": "ALT-102",
        "timestamp": "10-Sep-2026 13:10 IST",
        "severity": "HIGH",
        "title": "ORANGE ALERT: Meppadi & Attamala Saturated Slope Warning",
        "message": "Soil moisture saturation exceeded 90%. Landslide danger high on cut slopes. Prepare vulnerable elderly & medically dependent residents for stage-2 transit.",
        "target_zone_id": "ZN-03",
        "recommended_shelter_id": "SH-03",
        "evacuation_window_min": 120,
        "is_active": True
    },
    {
        "id": "ALT-103",
        "timestamp": "10-Sep-2026 12:45 IST",
        "severity": "WARNING",
        "title": "YELLOW ADVISORY: Panamaram River Confluence Level Rising",
        "message": "Kabini tributary level at 6.1m, 0.4m below flood stage. Low-lying agricultural riverfront monitoring in effect.",
        "target_zone_id": "ZN-09",
        "recommended_shelter_id": "SH-06",
        "evacuation_window_min": 240,
        "is_active": True
    }
]
