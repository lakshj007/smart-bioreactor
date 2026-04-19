"""
BioSphere AI Assistant — Cerebras LLM + ElevenLabs TTS
Context-aware bioreactor guidance using live sensor data.
"""

import os

import httpx

from state_store import StateStore

CEREBRAS_API_KEY = os.environ.get(
    "CEREBRAS_API_KEY",
    "csk-h2we4cf48f5x954n4x6kkwwt8fx6c85eccfr6c4dvdpmtdm3",
)
CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions"
CEREBRAS_MODEL = "llama3.1-8b"

ELEVENLABS_API_KEY = os.environ.get(
    "ELEVENLABS_API_KEY",
    "ba77b52c3203becb0f17855a4efe4ccb10ee096c46f1aa382096067fcbf986be",
)
ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel
ELEVENLABS_URL = (
    f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
)


class BiosphereAssistant:
    def __init__(self, store: StateStore):
        self.store = store
        self.client = httpx.AsyncClient(timeout=30)

    # ── Sensor context ────────────────────────────────────────

    @staticmethod
    def _trend(values: list[float]) -> str:
        if len(values) < 2:
            return "stable"
        mid = len(values) // 2
        first = sum(values[:mid]) / max(mid, 1)
        second = sum(values[mid:]) / max(len(values) - mid, 1)
        diff = second - first
        if abs(diff) < 0.05 * max(abs(first), 1):
            return "stable"
        return "rising" if diff > 0 else "falling"

    def _build_sensor_context(self) -> str:
        """10-second sensor averages + trends + health state."""
        recent_sensors = self.store.get_recent_sensors(5)  # 5 x 2s = 10s
        recent_images = self.store.get_recent_images(5)
        current = self.store.current_state

        if not recent_sensors:
            return "No sensor data available yet."

        lines: list[str] = []

        temps = [r.temperature for r in recent_sensors if r.temperature is not None]
        if temps:
            lines.append(f"Temperature: {sum(temps)/len(temps):.1f} C ({self._trend(temps)})")

        phs = [r.ph for r in recent_sensors if r.ph is not None]
        if phs:
            lines.append(f"pH: {sum(phs)/len(phs):.2f} ({self._trend(phs)})")

        hums = [r.humidity for r in recent_sensors if r.humidity is not None]
        if hums:
            lines.append(f"Humidity: {sum(hums)/len(hums):.1f}% ({self._trend(hums)})")

        lights = [r.light for r in recent_sensors if r.light is not None]
        if lights:
            lines.append(f"Light: {sum(lights)/len(lights):.0f} lux ({self._trend(lights)})")

        turbs = [f.turbidity for f in recent_images]
        if turbs:
            avg_ntu = sum(turbs) / len(turbs) * 50  # 0-1 -> 0-50 NTU
            lines.append(f"Turbidity: {avg_ntu:.1f} NTU ({self._trend(turbs)})")

        lines.append(f"Health Score: {current.health_score:.0f}/100 (trend: {current.trend})")
        lines.append(f"Anomaly Risk: {current.anomaly_risk}")
        lines.append(f"System Recommendation: {current.recommendation}")

        return "\n".join(lines)

    def _system_prompt(self) -> str:
        ctx = self._build_sensor_context()
        return (
            "You are BioSphere AI, an expert bioreactor lab assistant monitoring "
            "an algae/microbial culture system in real time.\n\n"
            f"CURRENT REACTOR STATE (last 10-second averages):\n{ctx}\n\n"
            "OPTIMAL RANGES:\n"
            "- Temperature: 22-26 C (algae growth sweet spot)\n"
            "- pH: 6.8-7.5 (neutral to slightly alkaline)\n"
            "- Turbidity: 5-25 NTU during active growth\n"
            "- Humidity: 55-75%\n"
            "- Light: 300-500 lux (photosynthetic range)\n"
            "- Health Score: 70+ good, below 50 critical\n\n"
            "GUIDELINES:\n"
            "- Reference actual sensor readings and trends.\n"
            "- Be concise: 2-4 sentences for quick questions, more for analysis.\n"
            "- If values drift out of range, explain and recommend action.\n"
            "- If the onboard system already recommends something, agree/disagree/elaborate.\n"
            "- Be practical and actionable."
        )

    # ── Cerebras LLM ──────────────────────────────────────────

    async def chat(self, user_message: str, history: list[dict] | None = None) -> str:
        """Chat with Cerebras LLM, injecting live sensor context."""
        messages = [{"role": "system", "content": self._system_prompt()}]
        if history:
            messages.extend(history[-6:])  # last 3 exchanges
        messages.append({"role": "user", "content": user_message})

        try:
            resp = await self.client.post(
                CEREBRAS_URL,
                headers={
                    "Authorization": f"Bearer {CEREBRAS_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": CEREBRAS_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 512,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            return f"Assistant unavailable (HTTP {e.response.status_code}). Try again shortly."
        except Exception as e:
            return f"Assistant unavailable ({type(e).__name__}). Try again shortly."

    async def quick_insight(self) -> str:
        """Auto-generated status insight."""
        return await self.chat(
            "Give a brief status summary of the bioreactor right now. "
            "Highlight anything needing attention and suggest one actionable improvement. "
            "Keep it under 4 sentences."
        )

    # ── ElevenLabs TTS ────────────────────────────────────────

    async def text_to_speech(self, text: str) -> bytes | None:
        """Convert text to speech. Returns MP3 bytes or None on failure."""
        try:
            resp = await self.client.post(
                ELEVENLABS_URL,
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                    },
                },
                timeout=15,
            )
            resp.raise_for_status()
            return resp.content
        except Exception as e:
            print(f"[TTS] Error: {e}")
            return None
