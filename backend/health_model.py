"""
Health scoring model for bioreactor conditions.
Uses weighted scoring with configurable target ranges.
"""

from dataclasses import dataclass
from typing import Optional

from state_store import ImageFeatures, SensorReading


@dataclass
class TargetRanges:
    """Optimal ranges for algae growth conditions."""
    temp_min: float = 20.0
    temp_max: float = 28.0
    temp_ideal: float = 24.0

    humidity_min: float = 50.0
    humidity_max: float = 80.0
    humidity_ideal: float = 65.0

    ph_min: float = 6.5
    ph_max: float = 8.0
    ph_ideal: float = 7.2

    light_min: float = 200.0
    light_max: float = 600.0
    light_ideal: float = 400.0

    # Vision targets
    green_ratio_min: float = 0.35
    turbidity_max: float = 0.15


TARGETS = TargetRanges()

# Weights for health score components
WEIGHTS = {
    "temperature": 0.30,
    "humidity": 0.20,
    "ph": 0.20,
    "vision": 0.15,
    "light": 0.15,
}

# If pH not available, redistribute
WEIGHTS_NO_PH = {
    "temperature": 0.35,
    "humidity": 0.25,
    "vision": 0.20,
    "light": 0.20,
}


def _range_score(value: float, min_val: float, max_val: float, ideal: float) -> float:
    """
    Score 0-100 based on how close value is to ideal within acceptable range.
    100 = at ideal, 0 = far outside range.
    """
    if min_val <= value <= max_val:
        # Within range: score based on distance from ideal
        range_half = max(max_val - ideal, ideal - min_val)
        if range_half == 0:
            return 100.0
        distance = abs(value - ideal)
        return max(0.0, 100.0 - (distance / range_half) * 30.0)
    else:
        # Outside range: penalize based on how far out
        if value < min_val:
            overshoot = min_val - value
            range_size = max_val - min_val
        else:
            overshoot = value - max_val
            range_size = max_val - min_val
        penalty = (overshoot / max(range_size, 1)) * 100
        return max(0.0, 60.0 - penalty)


def compute_temp_score(temp: float) -> float:
    return _range_score(temp, TARGETS.temp_min, TARGETS.temp_max, TARGETS.temp_ideal)


def compute_humidity_score(humidity: float) -> float:
    return _range_score(humidity, TARGETS.humidity_min, TARGETS.humidity_max, TARGETS.humidity_ideal)


def compute_ph_score(ph: float) -> float:
    return _range_score(ph, TARGETS.ph_min, TARGETS.ph_max, TARGETS.ph_ideal)


def compute_light_score(light: float) -> float:
    return _range_score(light, TARGETS.light_min, TARGETS.light_max, TARGETS.light_ideal)


def compute_vision_score(features: Optional[ImageFeatures]) -> float:
    """Score based on visual features — green ratio and turbidity."""
    if features is None:
        return 50.0  # neutral if no vision data

    score = 50.0

    # Green ratio: higher is better for algae (up to a point)
    if features.green_ratio >= TARGETS.green_ratio_min:
        score += 30.0
    else:
        score += 30.0 * (features.green_ratio / TARGETS.green_ratio_min)

    # Turbidity: moderate is okay, very high is bad
    if features.turbidity <= TARGETS.turbidity_max:
        score += 20.0
    else:
        overshoot = features.turbidity - TARGETS.turbidity_max
        score += max(0, 20.0 - overshoot * 200)

    return min(100.0, max(0.0, score))


def compute_health_score(
    reading: SensorReading,
    image_features: Optional[ImageFeatures] = None,
) -> tuple[float, dict[str, float]]:
    """
    Compute overall health score from sensor data and image features.
    Returns (overall_score, component_scores).
    """
    components = {}

    components["temperature"] = compute_temp_score(reading.temperature) if reading.temperature is not None else 50.0
    components["humidity"] = compute_humidity_score(reading.humidity) if reading.humidity is not None else 50.0
    components["vision"] = compute_vision_score(image_features)
    components["light"] = compute_light_score(reading.light) if reading.light is not None else 50.0

    if reading.ph is not None:
        components["ph"] = compute_ph_score(reading.ph)
        weights = WEIGHTS
    else:
        weights = WEIGHTS_NO_PH

    overall = sum(components.get(k, 50.0) * w for k, w in weights.items())
    overall = round(min(100.0, max(0.0, overall)), 1)

    return overall, components


def compute_trend(history: list[float], window: int = 10) -> str:
    """Determine trend from recent health scores."""
    if len(history) < 3:
        return "stable"

    recent = history[-window:]
    if len(recent) < 3:
        return "stable"

    # Compare first half average to second half average
    mid = len(recent) // 2
    first_half = sum(recent[:mid]) / mid
    second_half = sum(recent[mid:]) / (len(recent) - mid)
    diff = second_half - first_half

    if diff > 3:
        return "improving"
    elif diff < -3:
        return "declining"
    return "stable"


def compute_anomaly_risk(components: dict[str, float]) -> str:
    """Determine anomaly risk from component scores."""
    min_score = min(components.values())
    below_50_count = sum(1 for v in components.values() if v < 50)

    if min_score < 25 or below_50_count >= 3:
        return "high"
    elif min_score < 45 or below_50_count >= 2:
        return "medium"
    return "low"
