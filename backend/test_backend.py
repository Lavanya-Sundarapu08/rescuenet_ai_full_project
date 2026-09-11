import pytest
from database import RAW_ZONES, RAW_SHELTERS
from ai_hazard_engine import ai_engine
from risk_exposure_engine import risk_engine
from carrying_capacity_engine import capacity_engine
from relocation_optimizer import relocation_optimizer
from safe_routing_engine import routing_engine
from what_if_simulator import simulator
from models import Demographics, Infrastructure, SimulationScenario

def test_ai_hazard_prediction():
    res = ai_engine.predict({
        "rainfall_forecast_24h_mm": 220.0,
        "river_level_m": 6.8,
        "slope_deg": 30.0,
        "soil_saturation_pct": 95.0,
        "distance_to_river_m": 40.0,
        "historical_flood_freq": 7,
        "drainage_capacity_score": 0.2,
        "elevation_m": 710.0
    })
    assert res["hazard_prob_pct"] > 75.0
    assert res["confidence_pct"] >= 80.0
    assert len(res["attributions"]) >= 5
    print("AI Hazard Prediction Test: PASS")

def test_risk_formula_bounds():
    demo = Demographics(**RAW_ZONES[0]["demographics"])
    infra = Infrastructure(**RAW_ZONES[0]["infrastructure"])
    score = risk_engine.evaluate_zone_risk(RAW_ZONES[0]["hazard_factors"], demo, infra)
    assert 0.0 <= score.normalized_score <= 100.0
    assert score.risk_level.value in ["SAFE", "WATCH", "HIGH_RISK", "CRITICAL"]
    print(f"Risk Evaluation Test: PASS (Score={score.normalized_score})")

def test_carrying_capacity_constraints():
    shelters = capacity_engine.evaluate_all(RAW_SHELTERS)
    for s in shelters:
        if s.status.value in ["UNSAFE", "OVER_CAPACITY"]:
            assert s.available_capacity == 0
        else:
            assert s.available_capacity > 0
    print("Carrying Capacity Constraints Test: PASS")

def test_safe_routing_rejects_hazard():
    routes = routing_engine.generate_routes("ZN-01", "SH-02")
    rejected = [r for r in routes if r.type == "REJECTED"]
    optimal = [r for r in routes if r.type == "OPTIMAL"]
    assert len(rejected) >= 1
    assert len(optimal) >= 1
    # Shortest route must have high hazard score and be rejected
    assert rejected[0].hazard_exposure_score > 80.0
    assert rejected[0].is_recommended is False
    assert optimal[0].is_recommended is True
    print("Safe Routing Hazard Penalty Test: PASS")

def test_what_if_simulation_escalation():
    scenario = SimulationScenario(
        scenario_name="Catastrophic Surge",
        rainfall_mm=230.0,
        river_level_m=7.2,
        duration_hours=6.0,
        dam_discharge_cumec=1500.0
    )
    res = simulator.run_simulation(scenario)
    assert res["delta"]["delta_exposed"] > 0
    assert res["delta"]["simulated_exposed"] > res["delta"]["current_exposed"]
    print(f"What-If Simulator Test: PASS (+{res['delta']['delta_exposed']} exposed)")

if __name__ == "__main__":
    test_ai_hazard_prediction()
    test_risk_formula_bounds()
    test_carrying_capacity_constraints()
    test_safe_routing_rejects_hazard()
    test_what_if_simulation_escalation()
    print("\nALL BACKEND UNIT TESTS PASSED SUCCESSFULLY!")
