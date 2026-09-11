import math
from typing import Dict, Any, Tuple
from models import RiskScore, RiskLevel, Demographics, Infrastructure, HazardFactors
from ai_hazard_engine import ai_engine

class RiskExposureEngine:
    """
    Computes Hazard x Exposure x Vulnerability = Normalized Risk (0 - 100)
    Integrates population demographics, medical dependency, and infrastructure.
    """

    @staticmethod
    def calculate_exposure_score(demo: Demographics, infra: Infrastructure) -> float:
        """
        Calculates Exposure component (0 - 100) based on people and critical facilities.
        """
        if demo.total_population <= 0:
            return 0.0
        pop_ratio = min(1.0, demo.exposed_population / demo.total_population)
        bldg_ratio = min(1.0, infra.buildings_inundated / max(1, infra.buildings_total))
        infra_critical = min(1.0, (infra.hospitals * 3 + infra.schools * 1.5 + infra.bridges * 2.5) / 15.0)

        # 60% population exposure, 25% building inundation, 15% critical assets
        score = (0.60 * pop_ratio + 0.25 * bldg_ratio + 0.15 * infra_critical) * 100.0
        return round(float(score), 1)

    @staticmethod
    def calculate_vulnerability_score(demo: Demographics, infra: Infrastructure) -> float:
        """
        Calculates Vulnerability component (0 - 100) prioritizing vulnerable groups:
        Children, Elderly, Persons with Disabilities, Medically dependent.
        """
        exp_pop = max(1, demo.exposed_population)
        child_ratio = min(1.0, (demo.children / exp_pop) / 0.22) # normalized against 22% demographic baseline
        elder_ratio = min(1.0, (demo.elderly / exp_pop) / 0.14) # 14% baseline
        pwd_ratio = min(1.0, (demo.pwd / exp_pop) / 0.03)       # 3% baseline
        med_ratio = min(1.0, (demo.medically_dependent / exp_pop) / 0.015) # 1.5% baseline

        demo_vuln = (0.28 * child_ratio + 0.32 * elder_ratio + 0.24 * pwd_ratio + 0.16 * med_ratio)

        # Bridge vulnerability index: few bridges = high isolation risk
        isolation_risk = 0.8 if infra.bridges <= 1 else (0.5 if infra.bridges == 2 else 0.2)

        vulnerability = (0.75 * demo_vuln + 0.25 * isolation_risk) * 100.0
        return round(float(min(100.0, max(10.0, vulnerability))), 1)

    @classmethod
    def evaluate_zone_risk(cls, factors: Dict[str, Any], demo: Demographics, infra: Infrastructure) -> RiskScore:
        ai_res = ai_engine.predict(factors)
        hazard_component = ai_res["hazard_prob_pct"]
        exposure_component = cls.calculate_exposure_score(demo, infra)
        vulnerability_component = cls.calculate_vulnerability_score(demo, infra)

        # Risk = Hazard * Exposure * Vulnerability (geometric mean scaled)
        h = max(1.0, hazard_component) / 100.0
        e = max(1.0, exposure_component) / 100.0
        v = max(1.0, vulnerability_component) / 100.0

        raw_geom = (h * e * v) ** (1.0 / 3.0)
        # Scaled calibration for 0 - 100
        normalized_score = min(100.0, max(5.0, round(float(raw_geom * 108.0), 1)))

        if normalized_score >= 80.0:
            level = RiskLevel.CRITICAL
        elif normalized_score >= 60.0:
            level = RiskLevel.HIGH_RISK
        elif normalized_score >= 30.0:
            level = RiskLevel.WATCH
        else:
            level = RiskLevel.SAFE

        return RiskScore(
            normalized_score=normalized_score,
            hazard_prob_pct=hazard_component,
            confidence_pct=ai_res["confidence_pct"],
            risk_level=level,
            hazard_component=hazard_component,
            exposure_component=exposure_component,
            vulnerability_component=vulnerability_component,
            attributions=ai_res["attributions"]
        )

risk_engine = RiskExposureEngine()
