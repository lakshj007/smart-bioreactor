"""
BioSphere Backend — FastAPI server with WebSocket streaming.
Combines sensor data + image features → health score + recommendations.

Run: uvicorn main:app --reload --port 8000
"""

import asyncio
import inspect
import json
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from assistant import BiosphereAssistant
from health_model import compute_anomaly_risk, compute_health_score, compute_trend
from image_processor import ImageProcessor, MockImageProcessor
from ml_predictor import MLPredictor
from recommendation_engine import generate_recommendation
from serial_reader import MockSerialReader
from state_store import StateStore, SystemState, ImageFeatures

# ── Global state ──────────────────────────────────────────────
store = StateStore()
sensor_reader = MockSerialReader()
ml_predictor = MLPredictor()
assistant = BiosphereAssistant(store)
connected_clients: list[WebSocket] = []
health_history: list[float] = []

# ── Camera setup: try real camera, fall back to mock ─────────
client_image_features = None

TICK_INTERVAL = 2.0  # seconds between sensor reads


async def broadcast(data: dict):
    """Send state to all connected WebSocket clients."""
    message = json.dumps(data)
    disconnected = []
    for ws in connected_clients:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        connected_clients.remove(ws)


async def get_sensor_reading():
    """Read a sensor sample from either the mock or real reader."""
    if hasattr(sensor_reader, "read"):
        if inspect.iscoroutinefunction(sensor_reader.read):
            return await sensor_reader.read()
        return await asyncio.to_thread(sensor_reader.read)

    if hasattr(sensor_reader, "read_line"):
        return await asyncio.to_thread(sensor_reader.read_line)

    raise AttributeError("Sensor reader has no supported read method")


async def get_image_features():
    """Capture image features from either the mock or real processor."""
    return client_image_features


async def sensor_loop():
    """Main loop: read sensors, process images, compute state, broadcast."""
    while True:
        try:
            # Read sensor data
            reading = await get_sensor_reading()
            if reading is None:
                await asyncio.sleep(TICK_INTERVAL)
                continue
            store.add_sensor_reading(reading)

            # Capture & analyze image
            image_features = await get_image_features()
            if image_features is not None:
                store.add_image_features(image_features)

            # Compute health score (rules-based)
            score, components = compute_health_score(reading, image_features)

            # Blend with ML prediction if model is loaded
            ml_result = None
            if ml_predictor.loaded:
                sensor_data = {"temperature": reading.temperature}
                if reading.ph is not None:
                    # Map pH to approximate dissolved oxygen for ML model
                    sensor_data["dissolved_oxygen"] = 5.0  # default
                ml_result = ml_predictor.predict(sensor_data)
                ml_score = ml_predictor.predict_health_score(sensor_data)
                # Blend: 60% rules-based, 40% ML
                score = round(0.6 * score + 0.4 * ml_score, 1)

            health_history.append(score)
            if len(health_history) > 300:
                del health_history[:-300]

            # Compute trend and anomaly risk
            trend = compute_trend(health_history)
            anomaly_risk = compute_anomaly_risk(components)

            # Generate recommendation
            recommendation = generate_recommendation(
                components=components,
                temperature=reading.temperature,
                humidity=reading.humidity,
                ph=reading.ph,
                light=reading.light,
                anomaly_risk=anomaly_risk,
            )

            # Update state
            state = SystemState(
                temperature=reading.temperature,
                humidity=reading.humidity,
                ph=reading.ph,
                light=reading.light,
                health_score=score,
                trend=trend,
                anomaly_risk=anomaly_risk,
                recommendation=recommendation,
                image_features=image_features,
                timestamp=time.time(),
            )
            store.update_state(state)

            # Broadcast to all clients
            payload = store.get_state_payload()
            payload["components"] = components
            payload["history"] = store.get_history_payload()
            if ml_result:
                payload["ml"] = ml_result
            await broadcast(payload)

        except Exception as e:
            print(f"Sensor loop error: {e}")

        await asyncio.sleep(TICK_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models and start the sensor loop on startup."""
    ml_predictor.load()
    task = asyncio.create_task(sensor_loop())
    yield
    task.cancel()


# ── FastAPI app ───────────────────────────────────────────────
app = FastAPI(title="BioSphere API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "project": "BioSphere"}


@app.get("/api/state")
def get_state():
    """Get current reactor state (REST fallback)."""
    return store.get_state_payload()


@app.get("/api/history")
def get_history():
    """Get recent state history for charting."""
    return store.get_history_payload()


@app.get("/api/predict")
def predict(temperature: float = 24.0, salinity: float = 33.5, dissolved_oxygen: float = 5.0,
            phosphate: float = 0.9, nitrate: float = 8.7, ph: float = 7.2):
    """Run ML prediction on custom sensor values."""
    if not ml_predictor.loaded:
        return {"error": "Model not loaded. Run train_model.py first."}
    sensor_data = {
        "temperature": temperature,
        "salinity": salinity,
        "dissolved_oxygen": dissolved_oxygen,
        "phosphate": phosphate,
        "nitrate": nitrate,
    }
    result = ml_predictor.predict(sensor_data)
    result["health_score"] = ml_predictor.predict_health_score(sensor_data)
    return result


class TurbidityData(BaseModel):
    turbidity: float
    sharpness: float
    colorScore: float
    brightnessScore: float
    avgBrightness: float
    saturationMean: float
    blueRedRatio: float
    calibrated: bool

@app.post("/api/camera/turbidity")
def update_turbidity(data: TurbidityData):
    """Receive client-calculated turbidity features."""
    global client_image_features
    # Map frontend scores to backend ImageFeatures
    client_image_features = ImageFeatures(
        timestamp=time.time(),
        avg_brightness=data.avgBrightness,
        turbidity=data.turbidity,
        laplacian_variance=data.sharpness,
        saturation_mean=data.saturationMean,
        blue_red_ratio=data.blueRedRatio,
        turbidity_components={
            "sharpness": data.sharpness,
            "color": data.colorScore,
            "brightness": data.brightnessScore,
            "calibrated": data.calibrated
        }
    )
    return {"status": "ok"}

class CalibrationData(BaseModel):
    brightness: float
    sharpness: float
    saturation: float
    blueRedRatio: float

@app.post("/api/camera/calibrate-client")
def calibrate_client(data: CalibrationData):
    """Calibrate turbidity baseline with client features."""
    return {"status": "ok", "baseline": data.model_dump() if hasattr(data, "model_dump") else data.dict()}

@app.get("/api/camera/snapshot")
def get_snapshot():
    """Get a single analyzed frame (useful for debugging)."""
    if not client_image_features:
        return {"error": "No camera data received from frontend."}
    return {
        "turbidity": client_image_features.turbidity,
        "turbidity_components": client_image_features.turbidity_components,
        "avg_brightness": client_image_features.avg_brightness,
        "laplacian_variance": client_image_features.laplacian_variance,
        "saturation_mean": client_image_features.saturation_mean,
        "blue_red_ratio": client_image_features.blue_red_ratio,
    }

# ── AI Assistant endpoints ────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class TTSRequest(BaseModel):
    text: str


@app.post("/api/assistant/chat")
async def assistant_chat(req: ChatRequest):
    """Chat with the BioSphere AI assistant."""
    response = await assistant.chat(req.message, req.history)
    return {"response": response}


@app.get("/api/assistant/insight")
async def assistant_insight():
    """Get an auto-generated status insight."""
    response = await assistant.quick_insight()
    return {"response": response}


@app.post("/api/assistant/tts")
async def assistant_tts(req: TTSRequest):
    """Convert assistant text to speech via ElevenLabs."""
    audio = await assistant.text_to_speech(req.text)
    if audio is None:
        return {"error": "TTS service unavailable"}
    return Response(content=audio, media_type="audio/mpeg")


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """WebSocket endpoint for live state streaming."""
    await ws.accept()
    connected_clients.append(ws)
    try:
        # Send current state immediately
        payload = store.get_state_payload()
        payload["history"] = store.get_history_payload()
        await ws.send_text(json.dumps(payload))
        # Keep connection alive
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if ws in connected_clients:
            connected_clients.remove(ws)
