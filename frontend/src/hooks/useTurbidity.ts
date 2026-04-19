/**
 * useTurbidity — Client-side turbidity estimation using the device camera.
 *
 * Opens the rear-facing camera via getUserMedia, periodically samples frames
 * on an offscreen canvas, and computes a turbidity score (0 = clear, 1 = opaque)
 * using three ensemble methods:
 *   1. Sharpness (Laplacian-like variance of grayscale)
 *   2. Color channel ratios (saturation, blue/red)
 *   3. Brightness deviation from baseline
 *
 * The computed turbidity is POSTed to the backend so it integrates with the
 * health-score pipeline.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface TurbidityResult {
  turbidity: number;
  sharpness: number;
  colorScore: number;
  brightnessScore: number;
  avgBrightness: number;
  saturationMean: number;
  blueRedRatio: number;
  calibrated: boolean;
}

interface Baseline {
  brightness: number;
  sharpness: number;
  saturation: number;
  blueRedRatio: number;
}

// ── Pixel analysis helpers ─────────────────────────────────

/** Compute grayscale from RGB. */
function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** HSV saturation from RGB (0–255 each). */
function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : ((max - min) / max) * 255;
}

/**
 * Approximate Laplacian variance — measures sharpness / texture.
 * We apply a 3×3 Laplacian kernel to the grayscale image and take
 * the variance of the result. Low variance = blurry = turbid.
 */
function laplacianVariance(
  gray: Float32Array,
  width: number,
  height: number
): number {
  // Laplacian kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap =
        gray[idx - width] +
        gray[idx - 1] +
        -4 * gray[idx] +
        gray[idx + 1] +
        gray[idx + width];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  const mean = sum / count;
  return sumSq / count - mean * mean; // variance
}

/**
 * Analyze a single frame and return turbidity metrics.
 */
function analyzeFrame(
  imageData: ImageData,
  baseline: Baseline | null
): TurbidityResult {
  const { data, width, height } = imageData;
  const pixelCount = width * height;

  // ── Compute averages over center 50% to avoid edge artifacts ──
  const marginX = Math.floor(width * 0.25);
  const marginY = Math.floor(height * 0.25);
  const roiW = width - 2 * marginX;
  const roiH = height - 2 * marginY;
  const roiPixels = roiW * roiH;

  let sumR = 0,
    sumG = 0,
    sumB = 0,
    sumGray = 0,
    sumSat = 0;

  const gray = new Float32Array(roiW * roiH);

  let idx = 0;
  for (let y = marginY; y < height - marginY; y++) {
    for (let x = marginX; x < width - marginX; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      sumR += r;
      sumG += g;
      sumB += b;

      const lum = luminance(r, g, b);
      gray[idx] = lum;
      sumGray += lum;
      sumSat += saturation(r, g, b);
      idx++;
    }
  }

  const avgR = sumR / roiPixels;
  const avgG = sumG / roiPixels;
  const avgB = sumB / roiPixels;
  const avgBrightness = sumGray / roiPixels;
  const avgSaturation = sumSat / roiPixels;
  const brRatio = avgB / Math.max(avgR, 1);

  // ── Method 1: Sharpness (Laplacian variance) ──
  const lapVar = laplacianVariance(gray, roiW, roiH);
  let sharpnessTurbidity: number;

  if (baseline) {
    const ratio = lapVar / Math.max(baseline.sharpness, 1);
    sharpnessTurbidity = Math.max(0, Math.min(1, 1 - ratio));
  } else {
    sharpnessTurbidity = Math.max(0, Math.min(1, 1 - lapVar / 500));
  }

  // ── Method 2: Color / Saturation ──
  let colorTurbidity: number;

  if (baseline && baseline.saturation > 0) {
    const satRatio = avgSaturation / baseline.saturation;
    const satTurbidity = Math.max(0, Math.min(1, 1 - satRatio));
    const brTurbidity = Math.max(
      0,
      Math.min(1, Math.abs(1 - brRatio / Math.max(baseline.blueRedRatio, 0.01)))
    );
    colorTurbidity = 0.6 * satTurbidity + 0.4 * brTurbidity;
  } else {
    colorTurbidity = Math.max(0, Math.min(1, 1 - avgSaturation / 100));
  }

  // ── Method 3: Brightness deviation ──
  let brightnessTurbidity: number;

  if (baseline && baseline.brightness > 0) {
    const bRatio = avgBrightness / baseline.brightness;
    brightnessTurbidity = Math.max(0, Math.min(1, Math.abs(1 - bRatio)));
  } else {
    brightnessTurbidity = Math.max(
      0,
      Math.min(1, Math.abs(avgBrightness - 128) / 128)
    );
  }

  // ── Ensemble ──
  const turbidity = Math.max(
    0,
    Math.min(
      1,
      0.4 * sharpnessTurbidity + 0.3 * colorTurbidity + 0.3 * brightnessTurbidity
    )
  );

  return {
    turbidity: Math.round(turbidity * 10000) / 10000,
    sharpness: Math.round(sharpnessTurbidity * 10000) / 10000,
    colorScore: Math.round(colorTurbidity * 10000) / 10000,
    brightnessScore: Math.round(brightnessTurbidity * 10000) / 10000,
    avgBrightness: Math.round(avgBrightness * 100) / 100,
    saturationMean: Math.round(avgSaturation * 100) / 100,
    blueRedRatio: Math.round(brRatio * 10000) / 10000,
    calibrated: baseline !== null,
  };
}

// ── Hook ─────────────────────────────────────────────────────

export function useTurbidity(active: boolean, analysisIntervalMs = 2000) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [result, setResult] = useState<TurbidityResult | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<Baseline | null>(null);

  // Start / stop camera
  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function startCamera() {
      try {
        // Request back camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
        }

        setCameraReady(true);
        setCameraError(null);
      } catch (err: any) {
        console.error("[useTurbidity] Camera error:", err);
        setCameraError(
          err.name === "NotAllowedError"
            ? "Camera permission denied"
            : err.name === "NotFoundError"
              ? "No camera found"
              : `Camera error: ${err.message}`
        );
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
    };
  }, [active]);

  // Analysis loop
  useEffect(() => {
    if (!cameraReady || !active) return;

    function sampleFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const res = analyzeFrame(imageData, baseline);
      setResult(res);

      // Send to backend (fire-and-forget)
      fetch("/api/camera/turbidity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(res),
      }).catch(() => { });
    }

    intervalRef.current = setInterval(sampleFrame, analysisIntervalMs);
    // Run immediately once
    sampleFrame();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraReady, active, baseline, analysisIntervalMs]);

  // Calibrate: snapshot current frame as the "clear water" baseline
  const calibrate = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Compute baseline values from center ROI
    const { width, height, data } = imageData;
    const marginX = Math.floor(width * 0.25);
    const marginY = Math.floor(height * 0.25);
    const roiW = width - 2 * marginX;
    const roiH = height - 2 * marginY;
    const roiPixels = roiW * roiH;

    let sumR = 0,
      sumG = 0,
      sumB = 0,
      sumGray = 0,
      sumSat = 0;
    const gray = new Float32Array(roiW * roiH);
    let idx = 0;

    for (let y = marginY; y < height - marginY; y++) {
      for (let x = marginX; x < width - marginX; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        sumR += r;
        sumG += g;
        sumB += b;
        const lum = luminance(r, g, b);
        gray[idx] = lum;
        sumGray += lum;
        sumSat += saturation(r, g, b);
        idx++;
      }
    }

    const newBaseline: Baseline = {
      brightness: sumGray / roiPixels,
      sharpness: laplacianVariance(gray, roiW, roiH),
      saturation: sumSat / roiPixels,
      blueRedRatio: sumB / roiPixels / Math.max(sumR / roiPixels, 1),
    };

    setBaseline(newBaseline);

    // Send calibration to backend
    fetch("/api/camera/calibrate-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBaseline),
    }).catch(() => { });

    return newBaseline;
  }, []);

  return {
    videoRef,
    canvasRef,
    result,
    cameraReady,
    cameraError,
    calibrated: baseline !== null,
    calibrate,
  };
}
