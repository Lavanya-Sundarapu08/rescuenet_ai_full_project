from typing import Dict, Any, List
from models import SimulationScenario, SimulationDelta, Zone, ShelterStatus
from database import RAW_ZONES, RAW_SHELTERS
from risk_exposure_engine import risk_engine
from carrying_capacity_engine import capacity_engine
from relocation_optimizer import relocation_optimizer
from cyclone_engine import cyclone_engine

class WhatIfDisasterSimulator:
    """
    Multi-Hazard Simulator:
    Simulates compound disaster escalations combining:
    - Cyclone Wind Speed (60 - 180 km/h)
    - Storm Rainfall (100 - 350 mm / 24h)
    - Proximity to Cyclone Track (20 - 200 km)
    - River Surge & Dam Discharge
    Calculates newly inundated zones, landslide triggers, blocked roads, and shelter stress.
    """

    def run_simulation(self, scenario: SimulationScenario) -> Dict[str, Any]:
        sim_rainfall = scenario.rainfall_mm
        sim_river = scenario.river_level_m
        sim_dam = scenario.dam_discharge_cumec
        sim_wind = scenario.cyclone_wind_kmh
        sim_storm_rain = scenario.cyclone_rainfall_mm
        sim_prox = scenario.cyclone_proximity_km

        # Effective compound rainfall combining monsoon and cyclone squall
        effective_rainfall = max(sim_rainfall, sim_storm_rain * (1.0 - (sim_prox - 20.0) / 250.0))

        current_exposed = 0
        simulated_exposed = 0
        current_p1_zones = []
        simulated_p1_zones = []
        zone_impacts = []

        for rz in RAW_ZONES:
            curr_factors = dict(rz["hazard_factors"])
            curr_demo = rz["demographics"]
            curr_infra = rz["infrastructure"]

            current_exposed += curr_demo["exposed_population"]

            # Simulated factors
            sim_factors = dict(curr_factors)
            sim_factors["rainfall_mm"] = effective_rainfall
            sim_factors["rainfall_forecast_24h_mm"] = effective_rainfall * 1.30

            # River rise depends on proximity and dam discharge
            elev = curr_factors["elevation_m"]
            dist_r = curr_factors["distance_to_river_m"]
            slope = curr_factors["slope_deg"]

            river_rise = (sim_river - 4.5) * (1.0 + (sim_dam / 2000.0))
            sim_factors["river_level_m"] = round(sim_river, 2)
            sim_factors["soil_saturation_pct"] = min(100.0, curr_factors["soil_saturation_pct"] + (effective_rainfall - 100.0) * 0.18)

            from models import Demographics, Infrastructure
            d_obj = Demographics(**curr_demo)
            i_obj = Infrastructure(**curr_infra)

            curr_risk = risk_engine.evaluate_zone_risk(curr_factors, d_obj, i_obj)
            sim_risk = risk_engine.evaluate_zone_risk(sim_factors, d_obj, i_obj)

            # Wind factor penalty for exposed elevated settlements
            wind_penalty = 0.0
            if sim_wind > 100.0 and elev > 750.0:
                wind_penalty = (sim_wind - 100.0) * 0.12

            final_sim_score = min(100.0, sim_risk.normalized_score + wind_penalty)

            # Population exposure expands with storm inundation
            expansion_factor = 1.0 + min(0.85, max(0.0, (effective_rainfall - 90.0) / 190.0) + max(0.0, (sim_river - 4.5) / 4.5))
            new_exposed = min(d_obj.total_population, int(d_obj.exposed_population * expansion_factor))
            simulated_exposed += new_exposed

            vuln_pop = d_obj.children + d_obj.elderly + d_obj.pwd

            curr_p, curr_reason = relocation_optimizer.determine_priority(
                curr_risk.normalized_score, curr_risk.hazard_prob_pct, d_obj.exposed_population, vuln_pop
            )
            sim_p, sim_reason = relocation_optimizer.determine_priority(
                final_sim_score, sim_risk.hazard_prob_pct, new_exposed, vuln_pop
            )

            if "Priority 1" in curr_p.value:
                current_p1_zones.append(rz["name"])
            if "Priority 1" in sim_p.value:
                simulated_p1_zones.append(rz["name"])

            zone_impacts.append({
                "zone_id": rz["id"],
                "zone_name": rz["name"],
                "current_risk_score": curr_risk.normalized_score,
                "simulated_risk_score": round(final_sim_score, 1),
                "risk_delta": round(final_sim_score - curr_risk.normalized_score, 1),
                "current_exposed": d_obj.exposed_population,
                "simulated_exposed": new_exposed,
                "exposed_delta": new_exposed - d_obj.exposed_population,
                "current_priority": curr_p.value,
                "simulated_priority": sim_p.value,
                "simulated_reason": sim_reason,
                "landslide_surge": round(max(0.0, (slope - 15.0) * (effective_rainfall / 120.0)), 1)
            })

        total_evac_needed = sum(z["simulated_exposed"] for z in zone_impacts if "Priority 1" in z["simulated_priority"] or "Priority 2" in z["simulated_priority"])
        shelters = capacity_engine.evaluate_all(RAW_SHELTERS)
        total_avail_cap = sum(s.available_capacity for s in shelters if s.status != ShelterStatus.UNSAFE)

        over_cap_shelters = []
        for s in shelters:
            if s.current_occupancy >= s.max_capacity * 0.85 or s.status == ShelterStatus.UNSAFE:
                over_cap_shelters.append(s.name)

        new_critical = [z for z in simulated_p1_zones if z not in current_p1_zones]
        delta_exposed = simulated_exposed - current_exposed

        # Calculate potentially blocked roads & infrastructure under storm scenario
        blocked_roads_est = min(9, 4 + int((effective_rainfall - 150) / 40) if effective_rainfall > 150 else 4)

        delta = SimulationDelta(
            current_exposed=current_exposed,
            simulated_exposed=simulated_exposed,
            delta_exposed=delta_exposed,
            current_p1_zones_count=len(current_p1_zones),
            simulated_p1_zones_count=len(simulated_p1_zones),
            new_critical_zones=new_critical,
            shelters_near_or_over_capacity=over_cap_shelters,
            system_stress_index=min(100.0, round((total_evac_needed / max(1, total_avail_cap)) * 68.0, 1)),
            narrative_summary=(
                f"Under {scenario.cyclone_category} conditions ({sim_wind:.0f} km/h wind, {effective_rainfall:.0f} mm effective rainfall): "
                f"Hazard inundation expands by {delta_exposed:,} people ({simulated_exposed:,} total at risk). "
                f"{len(new_critical)} additional zones escalate to Priority 1 Immediate Relocation ({', '.join(new_critical[:3])}). "
                f"Estimated {blocked_roads_est} road segments flooded. Shelter capacity deficit: {max(0, total_evac_needed - total_avail_cap):,} spaces."
            )
        )

        return {
            "scenario": scenario.dict(),
            "delta": delta.dict(),
            "zone_impacts": zone_impacts,
            "cyclone_impact": {
                "wind_speed_kmh": sim_wind,
                "effective_rainfall_mm": effective_rainfall,
                "blocked_roads_est": blocked_roads_est,
                "high_risk_settlements": len(simulated_p1_zones)
            }
        }

simulator = WhatIfDisasterSimulator()
