"""
Test the pretrained model with random data + injected anomalies.
Plots health scores, predictions, and recommendations over time.

Usage: python test_model.py
"""

import random
import sys

from ml_predictor import MLPredictor
from health_model import compute_health_score, compute_anomaly_risk, compute_trend
from recommendation_engine import generate_recommendation
from state_store import SensorReading

predictor = MLPredictor()
predictor.load()

# ── Generate random sensor timeline ──────────────────────────

N_TICKS = 80
ANOMALY_PROB = 0.12  # 12% chance per tick

readings = []
for i in range(N_TICKS):
    is_anomaly = random.random() < ANOMALY_PROB

    if is_anomaly:
        # Pick a random anomaly type
        atype = random.choice(["temp_spike", "temp_drop", "humid_crash", "ph_spike", "multi"])
        temp = {"temp_spike": random.uniform(33, 40),
                "temp_drop": random.uniform(5, 14),
                "multi": random.uniform(32, 38)}.get(atype, random.gauss(24, 0.5))
        humidity = {"humid_crash": random.uniform(15, 35),
                    "multi": random.uniform(20, 35)}.get(atype, random.gauss(65, 2))
        ph = {"ph_spike": random.uniform(9.0, 10.5),
              "multi": random.uniform(4.5, 5.5)}.get(atype, random.gauss(7.2, 0.1))
        light = random.gauss(400, 20) if atype != "multi" else random.uniform(50, 120)
    else:
        temp = random.gauss(24, 1.2)
        humidity = random.gauss(65, 3)
        ph = random.gauss(7.2, 0.15)
        light = random.gauss(400, 30)

    readings.append({
        "tick": i,
        "anomaly_injected": is_anomaly,
        "temperature": round(max(2, min(42, temp)), 2),
        "humidity": round(max(10, min(98, humidity)), 2),
        "ph": round(max(3, min(11, ph)), 2),
        "light": round(max(0, min(1000, light)), 1),
    })

# ── Run model on each reading ────────────────────────────────

health_history = []
results = []

for r in readings:
    sensor = SensorReading(
        timestamp=r["tick"],
        temperature=r["temperature"],
        humidity=r["humidity"],
        ph=r["ph"],
        light=r["light"],
    )

    # Rules-based score
    rules_score, components = compute_health_score(sensor, None)

    # ML score
    ml_result = predictor.predict({"temperature": r["temperature"]})
    ml_score = predictor.predict_health_score({"temperature": r["temperature"]})

    # Blended score (same as main.py: 60/40)
    blended = round(0.6 * rules_score + 0.4 * ml_score, 1)
    health_history.append(blended)

    trend = compute_trend(health_history)
    anomaly_risk = compute_anomaly_risk(components)

    rec = generate_recommendation(
        components=components,
        temperature=r["temperature"],
        humidity=r["humidity"],
        ph=r["ph"],
        light=r["light"],
        anomaly_risk=anomaly_risk,
    )

    results.append({
        **r,
        "rules_score": rules_score,
        "ml_score": ml_score,
        "blended_score": blended,
        "ml_class": ml_result["health_class"],
        "ml_anomaly": ml_result["is_anomaly"],
        "anomaly_risk": anomaly_risk,
        "trend": trend,
        "recommendation": rec,
    })

# ── Print results ─────────────────────────────────────────────

BOLD = "\033[1m"
RED = "\033[91m"
YEL = "\033[93m"
GRN = "\033[92m"
DIM = "\033[2m"
RST = "\033[0m"

def color_score(s):
    if s >= 75: return f"{GRN}{s:5.1f}{RST}"
    if s >= 50: return f"{YEL}{s:5.1f}{RST}"
    return f"{RED}{s:5.1f}{RST}"

def color_risk(r):
    if r == "high": return f"{RED}{r:>6s}{RST}"
    if r == "medium": return f"{YEL}{r:>6s}{RST}"
    return f"{GRN}{r:>6s}{RST}"

print(f"\n{BOLD}{'='*120}")
print(f"  BioSphere Model Test — {N_TICKS} ticks, {ANOMALY_PROB*100:.0f}% anomaly injection rate")
print(f"{'='*120}{RST}\n")

print(f"{'Tick':>4s} {'ANO':>3s} {'Temp':>6s} {'Humid':>6s} {'pH':>6s} {'Light':>6s} "
      f"{'Rules':>6s} {'ML':>6s} {'Blend':>6s} {'Risk':>7s} {'Trend':>10s} {'ML Class':>10s} {'Recommendation'}")
print("-" * 120)

for r in results:
    ano_mark = f"{RED}*{RST}" if r["anomaly_injected"] else " "
    print(
        f"{r['tick']:4d} {ano_mark:>3s} "
        f"{r['temperature']:6.1f} {r['humidity']:6.1f} {r['ph']:6.2f} {r['light']:6.0f} "
        f"{color_score(r['rules_score'])} {color_score(r['ml_score'])} {color_score(r['blended_score'])} "
        f"{color_risk(r['anomaly_risk'])} {r['trend']:>10s} {r['ml_class']:>10s} "
        f"{DIM}{r['recommendation'][:50]}{RST}"
    )

# ── Summary stats ─────────────────────────────────────────────

anomaly_ticks = [r for r in results if r["anomaly_injected"]]
normal_ticks = [r for r in results if not r["anomaly_injected"]]

print(f"\n{BOLD}{'='*80}")
print(f"  Summary")
print(f"{'='*80}{RST}")
print(f"  Total ticks:        {N_TICKS}")
print(f"  Anomalies injected: {len(anomaly_ticks)}")
print(f"  Normal ticks:       {len(normal_ticks)}")
print()

if normal_ticks:
    avg_normal = sum(r["blended_score"] for r in normal_ticks) / len(normal_ticks)
    print(f"  Avg health (normal):  {color_score(avg_normal)}")

if anomaly_ticks:
    avg_anomaly = sum(r["blended_score"] for r in anomaly_ticks) / len(anomaly_ticks)
    print(f"  Avg health (anomaly): {color_score(avg_anomaly)}")

    # Check recommendation changes during anomalies
    unique_recs = set(r["recommendation"] for r in anomaly_ticks)
    print(f"\n  {BOLD}Recommendations during anomalies:{RST}")
    for rec in unique_recs:
        print(f"    - {rec}")

risk_counts = {}
for r in results:
    risk_counts[r["anomaly_risk"]] = risk_counts.get(r["anomaly_risk"], 0) + 1
print(f"\n  Risk distribution: {risk_counts}")

# Detection rate: how many injected anomalies got medium/high risk
if anomaly_ticks:
    detected = sum(1 for r in anomaly_ticks if r["anomaly_risk"] in ("medium", "high"))
    print(f"  Anomaly detection rate: {detected}/{len(anomaly_ticks)} ({detected/len(anomaly_ticks)*100:.0f}%)")

# ── ASCII Sparkline chart ────────────────────────────────────

print(f"\n{BOLD}  Health Score Over Time{RST}")
print(f"  (normal = ·  anomaly = {RED}*{RST})\n")

max_h = 100
rows = 12
for row in range(rows, -1, -1):
    threshold = (row / rows) * max_h
    line = f"  {threshold:5.0f} |"
    for r in results:
        if r["blended_score"] >= threshold:
            if r["anomaly_injected"]:
                line += f"{RED}*{RST}"
            else:
                line += f"{GRN}#{RST}"
        else:
            line += " "
    print(line)

print(f"        +{''.join(['-' for _ in results])}")
print(f"         {'tick →':>{len(results)}s}")
print()
