"""
ML Predictor — loads pretrained models and runs inference.
Handles partial sensor input gracefully (fills missing features with training means).
"""

import os
import pickle

import numpy as np

MODELS_PATH = os.path.join(os.path.dirname(__file__), "models", "biosphere_models.pkl")


class MLPredictor:
    """Runs pretrained models for growth prediction, health classification, and anomaly detection."""

    def __init__(self):
        self.loaded = False
        self.growth_model = None
        self.health_model = None
        self.anomaly_model = None
        self.scaler = None
        self.feature_columns = []
        self.training_stats = {}

    def load(self) -> bool:
        if not os.path.exists(MODELS_PATH):
            print(f"Model file not found: {MODELS_PATH}")
            print("Run 'python train_model.py' first.")
            return False

        with open(MODELS_PATH, "rb") as f:
            artifacts = pickle.load(f)

        self.growth_model = artifacts["growth_predictor"]
        self.health_model = artifacts["health_classifier"]
        self.anomaly_model = artifacts["anomaly_detector"]
        self.scaler = artifacts["scaler"]
        self.feature_columns = artifacts["feature_columns"]
        self.training_stats = artifacts["training_stats"]
        self.loaded = True
        print(f"Models loaded ({len(self.feature_columns)} features, trained on {self.training_stats['n_samples']} samples)")
        return True

    def _build_feature_vector(self, sensor_data: dict) -> np.ndarray:
        """
        Build a feature vector from available sensor data.
        Missing features are filled with training means (neutral prediction).

        sensor_data keys can include:
            temperature, salinity, dissolved_oxygen, phosphate,
            silicate, nitrite, nitrate, depth
        """
        # Map from user-facing names to training column names
        name_map = {
            "temperature": "T_degC",
            "salinity": "Salnty",
            "dissolved_oxygen": "O2ml_L",
            "phosphate": "PO4uM",
            "silicate": "SiO3uM",
            "nitrite": "NO2uM",
            "nitrate": "NO3uM",
            "depth": "Depthm",
        }

        means = self.training_stats["feature_means"]
        features = []

        for col in self.feature_columns:
            # Check if value provided via any name mapping
            value = None
            for user_key, train_col in name_map.items():
                if train_col == col and user_key in sensor_data:
                    value = sensor_data[user_key]
                    break

            # Also check direct column name
            if value is None and col in sensor_data:
                value = sensor_data[col]

            # Fall back to training mean
            if value is None:
                value = means[col]

            features.append(float(value))

        return np.array(features).reshape(1, -1)

    def predict(self, sensor_data: dict) -> dict:
        """
        Run all models on sensor data.

        Returns:
            {
                "predicted_chlorophyll": float,
                "health_class": "healthy" | "warning" | "critical",
                "anomaly_score": float,  # higher = more normal
                "is_anomaly": bool,
                "confidence": float,
            }
        """
        if not self.loaded:
            return {
                "predicted_chlorophyll": 0.0,
                "health_class": "warning",
                "anomaly_score": 0.0,
                "is_anomaly": False,
                "confidence": 0.0,
            }

        X = self._build_feature_vector(sensor_data)
        X_scaled = self.scaler.transform(X)

        # Growth prediction (ChlorA)
        chlora_pred = float(self.growth_model.predict(X_scaled)[0])
        chlora_pred = max(0.0, chlora_pred)

        # Health classification
        health_class = self.health_model.predict(X_scaled)[0]
        health_proba = self.health_model.predict_proba(X_scaled)[0]
        confidence = float(max(health_proba))

        # Anomaly detection
        anomaly_score = float(self.anomaly_model.decision_function(X_scaled)[0])
        is_anomaly = bool(self.anomaly_model.predict(X_scaled)[0] == -1)

        return {
            "predicted_chlorophyll": round(chlora_pred, 3),
            "health_class": health_class,
            "anomaly_score": round(anomaly_score, 4),
            "is_anomaly": is_anomaly,
            "confidence": round(confidence, 3),
        }

    def predict_health_score(self, sensor_data: dict) -> float:
        """
        Convert ML prediction into a 0-100 health score.
        Blends predicted chlorophyll level with anomaly score.
        """
        result = self.predict(sensor_data)

        # ChlorA-based score (map to 0-100 using training distribution)
        chlora_mean = self.training_stats["chlora_mean"]
        chlora_std = self.training_stats["chlora_std"]
        chlora_z = (result["predicted_chlorophyll"] - chlora_mean) / max(chlora_std, 0.01)
        chlora_score = 50 + chlora_z * 15  # center at 50, spread

        # Health class bonus/penalty
        class_modifier = {"healthy": 15, "warning": 0, "critical": -20}
        chlora_score += class_modifier.get(result["health_class"], 0)

        # Anomaly penalty
        if result["is_anomaly"]:
            chlora_score -= 15

        return round(max(0, min(100, chlora_score)), 1)
