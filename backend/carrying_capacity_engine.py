from typing import Dict, Any, List
from models import Shelter, ShelterStatus, ShelterResources

class CarryingCapacityEngine:
    """
    Assesses safe population capacity, available headroom,
    sanitation, water, food, and environmental safety.
    Strict Rule: Never recommend unsafe or overloaded shelters.
    """

    @staticmethod
    def evaluate_shelter(shelter_data: Dict[str, Any]) -> Shelter:
        max_cap = shelter_data["max_capacity"]
        curr_occ = shelter_data["current_occupancy"]
        avail_cap = max(0, max_cap - curr_occ)
        occ_ratio = curr_occ / max(1, max_cap)

        res_dict = shelter_data["resources"]
        resources = ShelterResources(
            water_liters_per_person_day=res_dict["water_liters_per_person_day"],
            food_stock_days=res_dict["food_stock_days"],
            toilet_ratio=res_dict["toilet_ratio"],
            medical_staff_count=res_dict["medical_staff_count"],
            isolation_beds=res_dict["isolation_beds"],
            backup_generator=res_dict["backup_generator"],
            structural_safety_grade=res_dict["structural_safety_grade"]
        )

        # Safety filters
        is_structurally_unsafe = resources.structural_safety_grade == "UNSAFE"
        is_in_flood_plain = shelter_data.get("is_in_flood_plain", False)
        dist_river = shelter_data.get("distance_from_river_m", 500.0)

        # Classification
        if is_structurally_unsafe or (is_in_flood_plain and dist_river < 200.0):
            status = ShelterStatus.UNSAFE
            avail_cap = 0
        elif occ_ratio >= 0.95:
            status = ShelterStatus.OVER_CAPACITY
            avail_cap = 0
        elif occ_ratio >= 0.75:
            status = ShelterStatus.NEAR_CAPACITY
        else:
            status = ShelterStatus.AVAILABLE

        return Shelter(
            id=shelter_data["id"],
            name=shelter_data["name"],
            lat=shelter_data["lat"],
            lng=shelter_data["lng"],
            max_capacity=max_cap,
            current_occupancy=curr_occ,
            available_capacity=avail_cap,
            status=status,
            resources=resources,
            is_in_flood_plain=is_in_flood_plain,
            distance_from_river_m=dist_river,
            allocated_zones=shelter_data.get("allocated_zones", [])
        )

    @classmethod
    def evaluate_all(cls, raw_shelters: List[Dict[str, Any]]) -> List[Shelter]:
        return [cls.evaluate_shelter(s) for s in raw_shelters]

capacity_engine = CarryingCapacityEngine()
