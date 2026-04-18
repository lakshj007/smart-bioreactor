"""
Recommendation engine — turns analytics into actionable advice.
Picks the biggest deviation from target and generates a message.
"""

from health_model import TARGETS


def generate_recommendation(
    components: dict[str, float],
    temperature: float | None = None,
    humidity: float | None = None,
    ph: float | None = None,
    light: float | None = None,
    anomaly_risk: str = "low",
) -> str:
    """Generate a recommendation based on the weakest component."""

    if not components:
        return "Waiting for sensor data..."

    # Find the weakest component
    weakest = min(components, key=components.get)
    weakest_score = components[weakest]

    # If everything looks good
    if weakest_score >= 70:
        if anomaly_risk == "low":
            return "Conditions stable. No action needed."
        else:
            return "Conditions appear acceptable but monitor closely."

    # Generate specific recommendations
    recommendations = []

    if components.get("temperature", 100) < 60 and temperature is not None:
        if temperature < TARGETS.temp_ideal:
            recommendations.append(
                f"Temperature is low ({temperature:.1f}°C). Consider increasing heat."
            )
        else:
            recommendations.append(
                f"Temperature is high ({temperature:.1f}°C). Reduce heat exposure or improve ventilation."
            )

    if components.get("humidity", 100) < 60 and humidity is not None:
        if humidity < TARGETS.humidity_ideal:
            recommendations.append(
                f"Humidity below target ({humidity:.1f}%). Increase moisture."
            )
        else:
            recommendations.append(
                f"Humidity above target ({humidity:.1f}%). Improve airflow."
            )

    if components.get("ph", 100) < 60 and ph is not None:
        if ph < TARGETS.ph_ideal:
            recommendations.append(
                f"pH is low ({ph:.2f}). Solution may be too acidic."
            )
        else:
            recommendations.append(
                f"pH is high ({ph:.2f}). Solution may be too alkaline."
            )

    if components.get("light", 100) < 60 and light is not None:
        if light < TARGETS.light_ideal:
            recommendations.append(
                f"Light level is low ({light:.0f} lux). Increase light exposure."
            )
        else:
            recommendations.append(
                f"Light level is high ({light:.0f} lux). Reduce light intensity."
            )

    if components.get("vision", 100) < 50:
        recommendations.append(
            "Visual appearance has changed unexpectedly. Inspect reactor for contamination."
        )

    if anomaly_risk == "high":
        recommendations.append("ALERT: Multiple parameters out of range. Inspect immediately.")

    if not recommendations:
        return f"{weakest.capitalize()} score is below optimal. Monitor and adjust if trend continues."

    return " ".join(recommendations[:2])  # cap at 2 recommendations
