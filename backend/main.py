from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

from models import (
    Zone, Shelter, RiskScore, RiskLevel, PriorityLevel, Demographics,
    Infrastructure, HazardFactors, SimulationScenario, SimulationDelta,
    AlertMessage, CopilotQuery, CopilotResponse, RelocationRecommendation
)
from database import RAW_ZONES, RAW_SHELTERS, INITIAL_ALERTS
from risk_exposure_engine import risk_engine
from carrying_capacity_engine import capacity_engine
from relocation_optimizer import relocation_optimizer
from safe_routing_engine import routing_engine
from what_if_simulator import simulator
from alerts_engine import alerts_engine
from ai_copilot import copilot
from cyclone_engine import cyclone_engine

app = FastAPI(
    title="RescueNet AI Platform API",
    description="Multi-Hazard 3D AI-Powered Hazard Zoning, Carrying Capacity & Intelligent Relocation Platform (SIH26191)",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "platform": "RescueNet AI (SIH26191)",
        "status": "OPERATIONAL",
        "theater": "Wayanad, Kerala, India & Arabian Sea Cyclone Basin",
        "frontend_dashboard": "http://localhost:5173",
        "api_docs": "http://127.0.0.1:8010/docs"
    }

def build_all_zones() -> List[Zone]:
    shelters = capacity_engine.evaluate_all(RAW_SHELTERS)
    zones = []
    for rz in RAW_ZONES:
        demo = Demographics(**rz["demographics"])
        infra = Infrastructure(**rz["infrastructure"])
        haz = HazardFactors(**rz["hazard_factors"])

        risk_sc = risk_engine.evaluate_zone_risk(rz["hazard_factors"], demo, infra)
        vuln_pop = demo.children + demo.elderly + demo.pwd
        p_lvl, p_reason = relocation_optimizer.determine_priority(
            risk_sc.normalized_score, risk_sc.hazard_prob_pct, demo.exposed_population, vuln_pop
        )

        ranked = relocation_optimizer.rank_shelters_for_zone(
            rz["centroid_lat"], rz["centroid_lng"], demo.exposed_population, shelters
        )
        rec_id = ranked[0]["shelter_id"] if ranked else None
        rec_name = ranked[0]["shelter_name"] if ranked else None

        zones.append(Zone(
            id=rz["id"],
            name=rz["name"],
            taluk=rz["taluk"],
            centroid_lat=rz["centroid_lat"],
            centroid_lng=rz["centroid_lng"],
            polygon_coords=rz["polygon_coords"],
            demographics=demo,
            infrastructure=infra,
            hazard_factors=haz,
            risk_score=risk_sc,
            priority_level=p_lvl,
            priority_reason=p_reason,
            evacuated_count=rz["evacuated_count"],
            in_risk_count=rz["in_risk_count"],
            trapped_count=rz["trapped_count"],
            recommended_shelter_id=rec_id,
            recommended_shelter_name=rec_name
        ))
    return zones

@app.get("/api/health")
def health_check():
    return {"status": "ONLINE", "platform": "RescueNet AI Multi-Hazard Platform", "version": "2.1.0"}

@app.get("/api/overview")
def get_overview():
    zones = build_all_zones()
    shelters = capacity_engine.evaluate_all(RAW_SHELTERS)
    cyc = cyclone_engine.get_current_state()

    crit_zones = [z for z in zones if z.risk_score.risk_level == RiskLevel.CRITICAL]
    high_zones = [z for z in zones if z.risk_score.risk_level == RiskLevel.HIGH_RISK]
    watch_zones = [z for z in zones if z.risk_score.risk_level == RiskLevel.WATCH]
    safe_zones = [z for z in zones if z.risk_score.risk_level == RiskLevel.SAFE]

    total_pop = sum(z.demographics.total_population for z in zones)
    total_exposed = sum(z.demographics.exposed_population for z in zones)
    immediate_reloc = sum(z.demographics.exposed_population for z in crit_zones)
    total_vuln = sum(z.demographics.children + z.demographics.elderly + z.demographics.pwd for z in zones)
    inundated_bldgs = sum(z.infrastructure.buildings_inundated for z in zones)

    avail_cap = sum(s.available_capacity for s in shelters if s.status.value != "UNSAFE")

    return {
        "platform": "RescueNet AI",
        "cyclone_status": cyc["summary"],
        "kpis": {
            "active_hazards": 4, # Cyclone + Flood + Landslide + Wind
            "critical_zones": len(crit_zones),
            "high_risk_zones": len(high_zones),
            "watch_zones": len(watch_zones),
            "safe_zones": len(safe_zones),
            "total_population": total_pop,
            "people_at_risk": total_exposed,
            "immediate_relocation": immediate_reloc,
            "vulnerable_people": total_vuln,
            "available_shelter_capacity": avail_cap,
            "blocked_roads": 7,
            "active_alerts": len(alerts_engine.get_active_alerts()),
            "inundated_addresses": inundated_bldgs,
            "safe_routes": 12,
            "cyclone_wind_kmh": cyc["current"]["wind_kmh"],
            "cyclone_category": cyc["summary"]["category"]
        },
        "risk_distribution": [
            {"grade": "Very High / Critical (80-100)", "count": len(crit_zones), "color": "#ef4444"},
            {"grade": "High Risk (60-80)", "count": len(high_zones), "color": "#f97316"},
            {"grade": "Medium / Watch (30-60)", "count": len(watch_zones), "color": "#eab308"},
            {"grade": "Low / Safe (0-30)", "count": len(safe_zones), "color": "#38bdf8"}
        ]
    }

# Cyclone Endpoints
@app.get("/api/cyclone/live")
def get_live_cyclone():
    return cyclone_engine.get_current_state()

@app.post("/api/cyclone/step/{step_idx}")
def update_cyclone_step(step_idx: int):
    return cyclone_engine.set_timeline_step(step_idx)

@app.get("/api/zones", response_model=List[Zone])
def get_zones():
    return build_all_zones()

@app.get("/api/zones/{zone_id}", response_model=Zone)
def get_zone(zone_id: str):
    zones = build_all_zones()
    for z in zones:
        if z.id == zone_id:
            return z
    raise HTTPException(status_code=404, detail="Zone not found")

@app.get("/api/shelters", response_model=List[Shelter])
def get_shelters():
    return capacity_engine.evaluate_all(RAW_SHELTERS)

@app.get("/api/routes/{zone_id}", response_model=RelocationRecommendation)
def get_evacuation_plan(zone_id: str):
    zones = build_all_zones()
    shelters = capacity_engine.evaluate_all(RAW_SHELTERS)

    target_zone = next((z for z in zones if z.id == zone_id), None)
    if not target_zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    top_shelters = relocation_optimizer.rank_shelters_for_zone(
        target_zone.centroid_lat, target_zone.centroid_lng,
        target_zone.demographics.exposed_population, shelters
    )
    if not top_shelters:
        raise HTTPException(status_code=400, detail="No safe shelter capacity available")

    selected = top_shelters[0]
    routes = routing_engine.generate_routes(target_zone.id, selected["shelter_id"])

    rationale = (
        f"Selected {selected['shelter_name']} ({selected['distance_km']} km away) because it provides "
        f"{selected['available_capacity']:,} verified safe capacity, reinforced structural safety grade, "
        f"and emergency power generation. Route B provides elevated mountain ridge safe passage avoiding submerged Bridge 2."
    )

    return RelocationRecommendation(
        zone_id=target_zone.id,
        zone_name=target_zone.name,
        priority_level=target_zone.priority_level,
        population_to_evacuate=target_zone.demographics.exposed_population,
        top_shelters=top_shelters,
        selected_shelter_id=selected["shelter_id"],
        selected_shelter_name=selected["shelter_name"],
        selection_rationale=rationale,
        routes=routes
    )

@app.post("/api/simulate")
def run_simulation(scenario: SimulationScenario):
    return simulator.run_simulation(scenario)

@app.get("/api/alerts", response_model=List[AlertMessage])
def get_alerts():
    return alerts_engine.get_active_alerts()

@app.post("/api/alerts/broadcast")
def broadcast_alert(payload: Dict[str, Any]):
    return alerts_engine.broadcast_alert(
        severity=payload.get("severity", "CRITICAL"),
        title=payload.get("title", "Emergency Evacuation Directive"),
        message=payload.get("message", "Mandatory evacuation in effect."),
        target_zone_id=payload.get("target_zone_id"),
        recommended_shelter_id=payload.get("recommended_shelter_id"),
        evacuation_window_min=payload.get("evacuation_window_min", 90)
    )

@app.post("/api/copilot", response_model=CopilotResponse)
def ask_copilot(query: CopilotQuery):
    return copilot.process_query(query.query)
