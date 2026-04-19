"""
Image processor for extracting visual features from camera feed.
Uses a multi-method ensemble for turbidity estimation:
  1. Laplacian variance (sharpness / contrast)
  2. Color channel ratios (blue/red, saturation)
  3. Brightness deviation from baseline

Supports ROI selection and clear-water baseline calibration.
"""

import json
import os
import time
from pathlib import Path
from typing import Optional, Tuple

import numpy as np

from state_store import ImageFeatures

try:
    import cv2
except ImportError:
    cv2 = None

# ── Calibration file path ─────────────────────────────────────
CALIBRATION_FILE = Path(__file__).parent / "calibration.json"


class TurbidityEstimator:
    """Multi-method turbidity estimation from a single frame ROI."""

    # Weights for ensemble
    WEIGHT_SHARPNESS = 0.40
    WEIGHT_COLOR = 0.30
    WEIGHT_BRIGHTNESS = 0.30

    def __init__(self):
        # Baseline values (set during calibration with clear water)
        self.baseline_brightness: Optional[float] = None
        self.baseline_laplacian: Optional[float] = None
        self.baseline_saturation: Optional[float] = None
        self.baseline_blue_red: Optional[float] = None

    def calibrate(self, roi: np.ndarray) -> dict:
        """Capture baseline values from a clear-water frame ROI."""
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

        self.baseline_brightness = float(np.mean(gray))
        self.baseline_laplacian = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        self.baseline_saturation = float(np.mean(hsv[:, :, 1]))

        avg_b, avg_g, avg_r = cv2.mean(roi)[:3]
        self.baseline_blue_red = avg_b / max(avg_r, 1.0)

        calibration = {
            "brightness": self.baseline_brightness,
            "laplacian": self.baseline_laplacian,
            "saturation": self.baseline_saturation,
            "blue_red_ratio": self.baseline_blue_red,
            "timestamp": time.time(),
        }

        # Persist calibration to disk
        with open(CALIBRATION_FILE, "w") as f:
            json.dump(calibration, f, indent=2)

        print(f"[Turbidity] Calibrated — baseline: {calibration}")
        return calibration

    def load_calibration(self) -> bool:
        """Load saved calibration from disk."""
        if not CALIBRATION_FILE.exists():
            return False
        try:
            with open(CALIBRATION_FILE) as f:
                cal = json.load(f)
            self.baseline_brightness = cal["brightness"]
            self.baseline_laplacian = cal["laplacian"]
            self.baseline_saturation = cal["saturation"]
            self.baseline_blue_red = cal["blue_red_ratio"]
            print(f"[Turbidity] Loaded calibration from {CALIBRATION_FILE}")
            return True
        except Exception as e:
            print(f"[Turbidity] Failed to load calibration: {e}")
            return False

    @property
    def is_calibrated(self) -> bool:
        return self.baseline_laplacian is not None

    def estimate(self, roi: np.ndarray) -> Tuple[float, dict]:
        """
        Estimate turbidity from an ROI using multi-method ensemble.

        Returns:
            (turbidity, components) where turbidity is 0.0 (clear) to 1.0 (opaque)
            and components is a dict of sub-method scores.
        """
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

        # ── Method 1: Laplacian variance (sharpness) ─────────
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        if self.is_calibrated and self.baseline_laplacian > 0:
            # Ratio of current sharpness to baseline (1.0 = same as clear water)
            sharpness_ratio = laplacian_var / self.baseline_laplacian
            # Invert: low sharpness = high turbidity
            sharpness_turbidity = max(0.0, min(1.0, 1.0 - sharpness_ratio))
        else:
            # Heuristic: assume laplacian <50 is very turbid, >500 is clear
            sharpness_turbidity = max(0.0, min(1.0, 1.0 - (laplacian_var / 500.0)))

        # ── Method 2: Color channel ratios ────────────────────
        avg_b, avg_g, avg_r = cv2.mean(roi)[:3]
        blue_red_ratio = avg_b / max(avg_r, 1.0)
        mean_saturation = float(np.mean(hsv[:, :, 1]))

        if self.is_calibrated and self.baseline_saturation > 0:
            # Saturation drops with turbidity
            sat_ratio = mean_saturation / self.baseline_saturation
            sat_turbidity = max(0.0, min(1.0, 1.0 - sat_ratio))

            # Blue/red ratio changes with turbidity
            br_ratio = blue_red_ratio / max(self.baseline_blue_red, 0.01)
            br_turbidity = max(0.0, min(1.0, abs(1.0 - br_ratio)))

            color_turbidity = 0.6 * sat_turbidity + 0.4 * br_turbidity
        else:
            # Heuristic: saturation < 30 is very turbid, > 100 is clear
            sat_turbidity = max(0.0, min(1.0, 1.0 - (mean_saturation / 100.0)))
            color_turbidity = sat_turbidity

        # ── Method 3: Brightness deviation ─────────────────────
        mean_brightness = float(np.mean(gray))

        if self.is_calibrated and self.baseline_brightness > 0:
            # Turbid water usually scatters → brighter/hazier than clear water
            brightness_ratio = mean_brightness / self.baseline_brightness
            # Deviation from baseline in either direction indicates change
            brightness_turbidity = max(0.0, min(1.0, abs(1.0 - brightness_ratio)))
        else:
            # Heuristic: moderate brightness is neutral
            brightness_turbidity = max(0.0, min(1.0, abs(mean_brightness - 128.0) / 128.0))

        # ── Ensemble ──────────────────────────────────────────
        turbidity = (
            self.WEIGHT_SHARPNESS * sharpness_turbidity
            + self.WEIGHT_COLOR * color_turbidity
            + self.WEIGHT_BRIGHTNESS * brightness_turbidity
        )
        turbidity = round(max(0.0, min(1.0, turbidity)), 4)

        components = {
            "sharpness": round(sharpness_turbidity, 4),
            "color": round(color_turbidity, 4),
            "brightness": round(brightness_turbidity, 4),
            "laplacian_var": round(laplacian_var, 2),
            "saturation_mean": round(mean_saturation, 2),
            "blue_red_ratio": round(blue_red_ratio, 4),
            "calibrated": self.is_calibrated,
        }

        return turbidity, components


class ImageProcessor:
    """Extracts visual features from bioreactor camera images."""

    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self._cap = None
        self._turbidity = TurbidityEstimator()
        # ROI as (x, y, w, h) — None means use full frame
        self._roi: Optional[Tuple[int, int, int, int]] = None

        # Try to load saved calibration and ROI
        self._turbidity.load_calibration()
        self._load_roi()

    def connect(self) -> bool:
        if cv2 is None:
            print("OpenCV not installed")
            return False
        try:
            self._cap = cv2.VideoCapture(self.camera_index)
            if self._cap.isOpened():
                print(f"Camera {self.camera_index} connected")
                return True
            return False
        except Exception as e:
            print(f"Camera connection failed: {e}")
            return False

    def set_roi(self, x: int, y: int, w: int, h: int):
        """Set the Region of Interest for turbidity analysis."""
        self._roi = (x, y, w, h)
        # Persist ROI alongside calibration
        roi_file = Path(__file__).parent / "roi.json"
        with open(roi_file, "w") as f:
            json.dump({"x": x, "y": y, "w": w, "h": h}, f)
        print(f"[ImageProcessor] ROI set to ({x}, {y}, {w}, {h})")

    def _load_roi(self):
        """Load saved ROI from disk."""
        roi_file = Path(__file__).parent / "roi.json"
        if roi_file.exists():
            try:
                with open(roi_file) as f:
                    r = json.load(f)
                self._roi = (r["x"], r["y"], r["w"], r["h"])
                print(f"[ImageProcessor] Loaded ROI: {self._roi}")
            except Exception:
                pass

    def _get_roi(self, frame: np.ndarray) -> np.ndarray:
        """Extract the ROI from a frame, or return the center 50% if no ROI is set."""
        if self._roi is not None:
            x, y, w, h = self._roi
            return frame[y : y + h, x : x + w]
        # Default: center 50% of the frame to avoid edges/reflections
        h, w = frame.shape[:2]
        margin_y, margin_x = h // 4, w // 4
        return frame[margin_y : h - margin_y, margin_x : w - margin_x]

    def calibrate(self) -> Optional[dict]:
        """Capture a frame and calibrate turbidity baseline (clear water)."""
        if self._cap is None or not self._cap.isOpened():
            print("[ImageProcessor] Camera not connected, cannot calibrate")
            return None
        ret, frame = self._cap.read()
        if not ret:
            return None
        roi = self._get_roi(frame)
        return self._turbidity.calibrate(roi)

    def select_roi_interactive(self):
        """Open an OpenCV window for interactive ROI selection."""
        if self._cap is None or not self._cap.isOpened():
            print("[ImageProcessor] Camera not connected")
            return
        ret, frame = self._cap.read()
        if not ret:
            return
        print("[ImageProcessor] Select the jar region and press ENTER/SPACE. Press C to cancel.")
        roi = cv2.selectROI("Select Jar Region", frame, fromCenter=False, showCrosshair=True)
        cv2.destroyAllWindows()
        if roi[2] > 0 and roi[3] > 0:
            self.set_roi(*roi)
            print(f"[ImageProcessor] ROI selected: {roi}")
        else:
            print("[ImageProcessor] ROI selection cancelled")

    def capture_and_analyze(self) -> Optional[ImageFeatures]:
        if self._cap is None or not self._cap.isOpened():
            return None
        ret, frame = self._cap.read()
        if not ret:
            return None
        return self.analyze_frame(frame)

    def analyze_frame(self, frame: np.ndarray) -> ImageFeatures:
        """Extract visual features from a single frame with multi-method turbidity."""
        # Average color channels (BGR in OpenCV)
        avg_b, avg_g, avg_r = cv2.mean(frame)[:3]

        # Brightness (grayscale average)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        avg_brightness = float(np.mean(gray))

        # Green ratio — useful for algae monitoring
        total = avg_r + avg_g + avg_b
        green_ratio = avg_g / total if total > 0 else 0.0

        # ── Multi-method turbidity estimation on ROI ──────────
        roi = self._get_roi(frame)
        turbidity, turb_components = self._turbidity.estimate(roi)

        return ImageFeatures(
            timestamp=time.time(),
            avg_brightness=round(avg_brightness, 2),
            avg_green=round(avg_g, 2),
            avg_red=round(avg_r, 2),
            avg_blue=round(avg_b, 2),
            turbidity=turbidity,
            green_ratio=round(green_ratio, 4),
            laplacian_variance=turb_components.get("laplacian_var", 0.0),
            saturation_mean=turb_components.get("saturation_mean", 0.0),
            blue_red_ratio=turb_components.get("blue_red_ratio", 0.0),
            turbidity_components=turb_components,
        )

    def close(self):
        if self._cap:
            self._cap.release()


class MockImageProcessor:
    """Simulates image feature extraction for dev/demo."""

    def __init__(self):
        self._step = 0

    async def capture_and_analyze(self) -> ImageFeatures:
        import random

        self._step += 1

        # Simulate gradually increasing green (healthy algae growth)
        base_green = 120 + min(self._step * 0.1, 30)
        green = base_green + random.gauss(0, 3)
        red = 80 + random.gauss(0, 3)
        blue = 90 + random.gauss(0, 3)
        brightness = (green + red + blue) / 3.0
        total = red + green + blue
        green_ratio = green / total if total > 0 else 0.33

        turbidity = 0.05 + random.gauss(0, 0.008)
        turbidity = max(0.0, min(0.5, turbidity))

        # Simulate sub-metrics
        laplacian_var = max(10, 350 - self._step * 0.3 + random.gauss(0, 15))
        sat_mean = max(20, 80 + random.gauss(0, 5))
        br_ratio = max(0.5, 1.1 + random.gauss(0, 0.05))

        return ImageFeatures(
            timestamp=time.time(),
            avg_brightness=round(brightness, 2),
            avg_green=round(green, 2),
            avg_red=round(red, 2),
            avg_blue=round(blue, 2),
            turbidity=round(turbidity, 4),
            green_ratio=round(green_ratio, 4),
            laplacian_variance=round(laplacian_var, 2),
            saturation_mean=round(sat_mean, 2),
            blue_red_ratio=round(br_ratio, 4),
            turbidity_components={
                "sharpness": round(turbidity * 0.8, 4),
                "color": round(turbidity * 1.1, 4),
                "brightness": round(turbidity * 0.9, 4),
                "calibrated": False,
            },
        )
