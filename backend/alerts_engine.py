import time
from typing import List, Dict, Any
from models import AlertMessage
from database import INITIAL_ALERTS

class EmergencyAlertsEngine:
    def __init__(self):
        self.alerts: List[AlertMessage] = [AlertMessage(**a) for a in INITIAL_ALERTS]

    def get_active_alerts(self) -> List[AlertMessage]:
        return [a for a in self.alerts if a.is_active]

    def broadcast_alert(
        self,
        severity: str,
        title: str,
        message: str,
        target_zone_id: str = None,
        recommended_shelter_id: str = None,
        evacuation_window_min: int = 90
    ) -> AlertMessage:
        alert_id = f"ALT-{int(time.time())}"
        new_alert = AlertMessage(
            id=alert_id,
            timestamp="Just Now",
            severity=severity,
            title=title,
            message=message,
            target_zone_id=target_zone_id,
            recommended_shelter_id=recommended_shelter_id,
            evacuation_window_min=evacuation_window_min,
            is_active=True
        )
        self.alerts.insert(0, new_alert)
        return new_alert

alerts_engine = EmergencyAlertsEngine()
