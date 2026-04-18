"""
BioSphere Model Training Pipeline
Trains on CalCOFI ocean data to learn optimal conditions for algae growth.

Models produced:
1. Growth predictor — predicts ChlorA (algae biomass) from environmental features
2. Health classifier — classifies conditions as healthy/warning/critical
3. Anomaly detector — Isolation Forest for detecting unusual conditions

Usage: python train_model.py
"""

import os
import pickle

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, IsolationForest, RandomForestClassifier
from sklearn.metrics import classification_report, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "calcofi_bottle.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# Features we train on — the full sensor suite
FEATURE_COLS = [
    "T_degC",      # Temperature (°C)
    "Salnty",      # Salinity (PSU)
    "O2ml_L",      # Dissolved oxygen (mL/L)
    "PO4uM",       # Phosphate (µM)
    "SiO3uM",      # Silicate (µM)
    "NO2uM",       # Nitrite (µM)
    "NO3uM",       # Nitrate (µM)
    "Depthm",      # Depth (m) — proxy for light/pressure
]

TARGET_COL = "ChlorA"  # Chlorophyll-A — direct algae biomass indicator


def load_and_clean(path: str) -> pd.DataFrame:
    """Load CalCOFI data and clean for model training."""
    print(f"Loading data from {path}...")
    df = pd.read_csv(path, encoding="latin-1", low_memory=False)
    print(f"  Raw shape: {df.shape}")

    # Keep only rows where target is available
    df = df[df[TARGET_COL].notna()].copy()
    print(f"  After requiring ChlorA: {df.shape}")

    # Keep only rows with all features available
    all_cols = FEATURE_COLS + [TARGET_COL]
    df = df.dropna(subset=all_cols)
    print(f"  After dropping NaN features: {df.shape}")

    # Remove obvious outliers
    df = df[df["T_degC"] < 40]          # temp below 40°C
    df = df[df["T_degC"] > 0]           # temp above 0°C
    df = df[df["O2ml_L"] > 0]           # positive oxygen
    df = df[df[TARGET_COL] > 0]         # positive chlorophyll
    df = df[df[TARGET_COL] < 50]        # remove extreme outliers
    df = df[df["Salnty"] > 20]          # reasonable salinity
    print(f"  After outlier removal: {df.shape}")

    return df


def create_health_labels(chlora: pd.Series) -> pd.Series:
    """
    Derive health labels from ChlorA concentration.
    Higher ChlorA = more algae biomass = healthier growth.
    """
    # Based on CalCOFI ChlorA distribution
    labels = pd.Series("warning", index=chlora.index)
    labels[chlora >= chlora.quantile(0.6)] = "healthy"
    labels[chlora <= chlora.quantile(0.2)] = "critical"
    return labels


def train_growth_predictor(X_train, X_test, y_train, y_test):
    """Train a regression model to predict ChlorA from environmental features."""
    print("\n=== Training Growth Predictor (GradientBoosting) ===")

    model = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"  MAE:  {mae:.4f}")
    print(f"  R²:   {r2:.4f}")

    # Feature importance
    print("\n  Feature importance:")
    for name, imp in sorted(
        zip(FEATURE_COLS, model.feature_importances_), key=lambda x: -x[1]
    ):
        print(f"    {name:>10s}: {imp:.4f}")

    return model


def train_health_classifier(X_train, X_test, y_train_labels, y_test_labels):
    """Train a classifier: healthy / warning / critical."""
    print("\n=== Training Health Classifier (RandomForest) ===")

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train_labels)

    y_pred = model.predict(X_test)
    print(classification_report(y_test_labels, y_pred))

    return model


def train_anomaly_detector(X_train):
    """Train an Isolation Forest for anomaly detection."""
    print("\n=== Training Anomaly Detector (IsolationForest) ===")

    model = IsolationForest(
        n_estimators=100,
        contamination=0.05,  # expect ~5% anomalies
        random_state=42,
    )
    model.fit(X_train)

    scores = model.decision_function(X_train)
    print(f"  Anomaly score range: [{scores.min():.3f}, {scores.max():.3f}]")
    print(f"  Mean score: {scores.mean():.3f}")

    return model


def main():
    # Load and clean data
    df = load_and_clean(DATA_PATH)

    # Prepare features and targets
    X = df[FEATURE_COLS].values
    y_chlora = df[TARGET_COL].values
    y_labels = create_health_labels(df[TARGET_COL])

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split
    X_train, X_test, y_train, y_test, labels_train, labels_test = train_test_split(
        X_scaled, y_chlora, y_labels, test_size=0.2, random_state=42
    )

    print(f"\nTrain set: {X_train.shape[0]} samples")
    print(f"Test set:  {X_test.shape[0]} samples")

    # Train all models
    growth_model = train_growth_predictor(X_train, X_test, y_train, y_test)
    health_model = train_health_classifier(X_train, X_test, labels_train, labels_test)
    anomaly_model = train_anomaly_detector(X_train)

    # Save everything
    os.makedirs(MODELS_DIR, exist_ok=True)

    artifacts = {
        "growth_predictor": growth_model,
        "health_classifier": health_model,
        "anomaly_detector": anomaly_model,
        "scaler": scaler,
        "feature_columns": FEATURE_COLS,
        "target_column": TARGET_COL,
        "training_stats": {
            "n_samples": len(df),
            "n_features": len(FEATURE_COLS),
            "chlora_mean": float(y_chlora.mean()),
            "chlora_std": float(y_chlora.std()),
            "feature_means": dict(zip(FEATURE_COLS, scaler.mean_.tolist())),
            "feature_stds": dict(zip(FEATURE_COLS, scaler.scale_.tolist())),
        },
    }

    model_path = os.path.join(MODELS_DIR, "biosphere_models.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(artifacts, f)

    print(f"\n=== Models saved to {model_path} ===")
    print(f"  File size: {os.path.getsize(model_path) / 1024 / 1024:.1f} MB")

    # Also save a summary of what the models learned about optimal ranges
    stats = artifacts["training_stats"]
    print("\n=== Learned Optimal Ranges (from training data) ===")
    for feat in FEATURE_COLS:
        m = stats["feature_means"][feat]
        s = stats["feature_stds"][feat]
        print(f"  {feat:>10s}: mean={m:.2f}, std={s:.2f}")


if __name__ == "__main__":
    main()
