"""
Serial reader for Arduino sensor data.
Supports real serial port or mock mode for development/demo.
"""

import asyncio
import random
import time
from typing import Optional

from state_store import SensorReading

try:
    import serial
except ImportError:
    serial = None


class SerialReader:
    """Reads sensor data from Arduino over serial USB."""

    def __init__(self, port: str = "/dev/ttyUSB0", baud: int = 9600):
        self.port = port
        self.baud = baud
        self._serial: Optional[object] = None

    def connect(self) -> bool:
        if serial is None:
            print("pyserial not installed, cannot use real serial")
            return False
        try:
            self._serial = serial.Serial(self.port, self.baud, timeout=1)
            print(f"Connected to {self.port} at {self.baud} baud")
            return True
        except Exception as e:
            print(f"Serial connection failed: {e}")
            return False

    def read_line(self) -> Optional[SensorReading]:
        if self._serial is None:
            return None
        try:
            line = self._serial.readline().decode("utf-8").strip()
            if not line:
                return None
            parts = line.split(",")
            # Expected: timestamp,temp,humidity[,ph]
            if len(parts) >= 3:
                return SensorReading(
                    timestamp=float(parts[0]),
                    temperature=float(parts[1]),
                    humidity=float(parts[2]),
                    ph=float(parts[3]) if len(parts) > 3 else None,
                )
        except Exception as e:
            print(f"Serial read error: {e}")
        return None

    def close(self):
        if self._serial:
            self._serial.close()


class MockSerialReader:
    """
    Simulates sensor readings for development and demo.
    Generates realistic fluctuating values with occasional anomalies.
    """

    def __init__(self):
        # Base values (healthy algae conditions)
        self._temp_base = 24.0
        self._humidity_base = 65.0
        self._ph_base = 7.0
        self._light_base = 400.0
        self._step = 0
        self._anomaly_active = False
        self._anomaly_countdown = 0

    async def read(self) -> SensorReading:
        """Generate a simulated sensor reading."""
        self._step += 1

        # Randomly trigger anomalies (~5% chance per reading)
        if not self._anomaly_active and random.random() < 0.02:
            self._anomaly_active = True
            self._anomaly_countdown = random.randint(5, 15)

        if self._anomaly_active:
            self._anomaly_countdown -= 1
            if self._anomaly_countdown <= 0:
                self._anomaly_active = False

        # Normal drift
        drift = lambda base, scale: base + random.gauss(0, scale)

        temp = drift(self._temp_base, 0.3)
        humidity = drift(self._humidity_base, 1.5)
        ph = drift(self._ph_base, 0.05)
        light = drift(self._light_base, 15.0)

        # Add anomaly effects
        if self._anomaly_active:
            anomaly_type = self._step % 3
            if anomaly_type == 0:
                temp += random.uniform(3, 6)  # temperature spike
            elif anomaly_type == 1:
                humidity -= random.uniform(15, 25)  # humidity drop
            else:
                ph += random.uniform(0.8, 1.5)  # pH spike

        # Clamp to reasonable ranges
        temp = max(15.0, min(40.0, temp))
        humidity = max(20.0, min(95.0, humidity))
        ph = max(4.0, min(10.0, ph))
        light = max(0.0, min(1000.0, light))

        return SensorReading(
            timestamp=time.time(),
            temperature=round(temp, 2),
            humidity=round(humidity, 2),
            ph=round(ph, 2),
            light=round(light, 1),
        )
