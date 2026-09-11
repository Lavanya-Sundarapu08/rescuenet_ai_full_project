import math
from typing import List, Dict, Any, Tuple, Optional
from models import PriorityLevel, Shelter, ShelterStatus, Zone, RelocationRecommendation, EvacuationRouteOption

class RelocationPriorityAndOptimizerEngine:
    """
    1. Determines evacuation priority (P1 to P4) with human-readable rationale.
    2. Solves multi-objective allocation matching vulnerable zones to safe shelters.
    """

    @staticmethod
    def determine_priority(risk_score: float, hazard_prob: float, exposed_pop: int, vuln_pop: int) -> Tuple[PriorityLevel, str]:
        if risk_score >= 80.0 or (hazard_prob >= 82.0 and vuln_pop >= 400):
            level = PriorityLevel.P1_IMMEDIATE
            reason = (
                f"Priority 1 because hazard probability is {hazard_prob:.0f}%, "
                f"{exposed_pop:,} people are directly exposed, {vuln_pop:,} vulnerable residents "
                f"(children, elderly, PwD) are present, and predicted inundation impact is within 2 hours."
            )
        elif risk_score >= 60.0:
            level = PriorityLevel.P2_URGENT
            reason = (
                f"Priority 2 because risk score is {risk_score:.0f}/100 with {exposed_pop:,} exposed. "
                f"Saturated soil and rising tributary levels require staged evacuation within 4 hours."
            )
        elif risk_score >= 30.0:
            level = PriorityLevel.P3_PREPARE
            reason = (
                f"Priority 3 because area is on WATCH status ({risk_score:.0f}/100). "
                f"Residents should stage emergency kits, and transport assets should be placed on standby."
            )
        else:
            level = PriorityLevel.P4_MONITOR
            reason = f"Priority 4: Safe elevation and manageable drainage. Routine sensor monitoring active."

        return level, reason

    @staticmethod
    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)

    @classmethod
    def rank_shelters_for_zone(
        cls,
        zone_lat: float,
        zone_lng: float,
        pop_needed: int,
        shelters: List[Shelter]
    ) -> List[Dict[str, Any]]:
        """
        Multi-objective ranking:
        Safety (structural + distance from river) + Headroom capacity + Travel time + Resources
        NEVER ranks UNSAFE or OVER_CAPACITY shelters.
        """
        candidates = []
        for s in shelters:
            if s.status in [ShelterStatus.UNSAFE, ShelterStatus.OVER_CAPACITY]:
                continue
            if s.available_capacity <= 50:
                continue

            dist_km = cls.haversine_km(zone_lat, zone_lng, s.lat, s.lng)
            # Average travel speed on hilly terrain = 28 km/h
            travel_time_min = round((dist_km / 28.0) * 60.0 + 3.0, 1)

            # Capacity suitability: penalize if headroom cannot absorb needed pop
            cap_score = min(1.0, s.available_capacity / max(1, pop_needed))

            # Proximity score (shorter is better, within 20km)
            dist_score = max(0.0, 1.0 - (dist_km / 25.0))

            # Resource score
            res = s.resources
            res_score = (
                min(1.0, res.water_liters_per_person_day / 25.0) * 0.35 +
                min(1.0, res.food_stock_days / 7.0) * 0.35 +
                (1.0 if res.backup_generator else 0.0) * 0.15 +
                min(1.0, res.medical_staff_count / 4.0) * 0.15
            )

            # Safety margin
            safety_score = 1.0 if (not s.is_in_flood_plain and s.distance_from_river_m > 400.0) else 0.5

            # Composite Suitability Score (0 - 100)
            suitability = (
                0.35 * safety_score +
                0.25 * cap_score +
                0.25 * dist_score +
                0.15 * res_score
            ) * 100.0

            candidates.append({
                "shelter_id": s.id,
                "shelter_name": s.name,
                "lat": s.lat,
                "lng": s.lng,
                "available_capacity": s.available_capacity,
                "current_occupancy": s.current_occupancy,
                "max_capacity": s.max_capacity,
                "distance_km": dist_km,
                "travel_time_min": travel_time_min,
                "suitability_score": round(suitability, 1),
                "water_supply_days": round(res.food_stock_days, 1),
                "medical_support": f"{res.medical_staff_count} doctors, {res.isolation_beds} beds",
                "status": s.status.value
            })

        # Sort descending by suitability
        candidates.sort(key=lambda x: x["suitability_score"], reverse=True)
        return candidates[:3]

relocation_optimizer = RelocationPriorityAndOptimizerEngine()
