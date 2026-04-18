"""
Image processor for extracting visual features from camera feed.
Uses OpenCV for basic image analysis — no deep learning needed.
"""

import time
from typing import Optional

import numpy as np

from state_store import ImageFeatures

try:
    import cv2
except ImportError:
    cv2 = None


class ImageProcessor:
    """Extracts visual features from bioreactor camera images."""

    def __init__(self, camera_index: int = 0):
        self.camera_index = camera_index
        self._cap = None

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

    def capture_and_analyze(self) -> Optional[ImageFeatures]:
        if self._cap is None or not self._cap.isOpened():
            return None
        ret, frame = self._cap.read()
        if not ret:
            return None
        return self.analyze_frame(frame)

    def analyze_frame(self, frame: np.ndarray) -> ImageFeatures:
        """Extract visual features from a single frame."""
        # Average color channels (BGR in OpenCV)
        avg_b, avg_g, avg_r = cv2.mean(frame)[:3]

        # Brightness (grayscale average)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        avg_brightness = float(np.mean(gray))

        # Turbidity proxy: edge density using Canny
        edges = cv2.Canny(gray, 50, 150)
        turbidity = float(np.sum(edges > 0)) / edges.size

        # Green ratio — useful for algae monitoring
        total = avg_r + avg_g + avg_b
        green_ratio = avg_g / total if total > 0 else 0.0

        return ImageFeatures(
            timestamp=time.time(),
            avg_brightness=round(avg_brightness, 2),
            avg_green=round(avg_g, 2),
            avg_red=round(avg_r, 2),
            avg_blue=round(avg_b, 2),
            turbidity=round(turbidity, 4),
            green_ratio=round(green_ratio, 4),
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

        return ImageFeatures(
            timestamp=time.time(),
            avg_brightness=round(brightness, 2),
            avg_green=round(green, 2),
            avg_red=round(red, 2),
            avg_blue=round(blue, 2),
            turbidity=round(turbidity, 4),
            green_ratio=round(green_ratio, 4),
        )
