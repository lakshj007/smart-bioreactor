"""In-memory state store for sensor data, image features, and computed metrics."""

from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class SensorReading:
    timestamp: float
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    ph: Optional[float] = None
    light: Optional[float] = None


@dataclass
class ImageFeatures:
    timestamp: float
    avg_brightness: float = 0.0
    avg_green: float = 0.0
    avg_red: float = 0.0
    avg_blue: float = 0.0
    turbidity: float = 0.0  # edge density proxy
    green_ratio: float = 0.0


@dataclass
class SystemState:
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    ph: Optional[float] = None
    light: Optional[float] = None
    health_score: float = 0.0
    trend: str = "stable"
    anomaly_risk: str = "low"
    recommendation: str = "Waiting for data..."
    image_features: Optional[ImageFeatures] = None
    timestamp: float = 0.0


class StateStore:
    def __init__(self, max_history: int = 500):
        self.sensor_history: deque[SensorReading] = deque(maxlen=max_history)
        self.image_history: deque[ImageFeatures] = deque(maxlen=max_history)
        self.state_history: deque[SystemState] = deque(maxlen=max_history)
        self.current_state = SystemState()

    def add_sensor_reading(self, reading: SensorReading):
        self.sensor_history.append(reading)

    def add_image_features(self, features: ImageFeatures):
        self.image_history.append(features)

    def update_state(self, state: SystemState):
        self.current_state = state
        self.state_history.append(state)

    def get_recent_sensors(self, n: int = 30) -> list[SensorReading]:
        return list(self.sensor_history)[-n:]

    def get_recent_images(self, n: int = 10) -> list[ImageFeatures]:
        return list(self.image_history)[-n:]

    def get_state_payload(self) -> dict:
        s = self.current_state
        return {
            "temperature": s.temperature,
            "humidity": s.humidity,
            "ph": s.ph,
            "light": s.light,
            "healthScore": s.health_score,
            "trend": s.trend,
            "anomalyRisk": s.anomaly_risk,
            "recommendation": s.recommendation,
            "timestamp": s.timestamp,
        }

    def get_history_payload(self, n: int = 60) -> list[dict]:
        """Return recent state history for trend charts."""
        return [
            {
                "temperature": s.temperature,
                "humidity": s.humidity,
                "ph": s.ph,
                "healthScore": s.health_score,
                "anomalyRisk": s.anomaly_risk,
                "timestamp": s.timestamp,
            }
            for s in list(self.state_history)[-n:]
        ]
