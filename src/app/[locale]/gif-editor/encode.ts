"use client";

import type { RGBAFrame } from "./decode";

export type ExportProgress = {
  done: number;
  total: number;
};

export async function encodeGif(
  frames: RGBAFrame[],
  options: { transparent: boolean; onProgress?: (p: ExportProgress) => void },
): Promise<Blob> {
  if (frames.length === 0) throw new Error("No frames to encode");
  const { GIFEncoder, quantize, applyPalette } = await import(
    /* webpackChunkName: "gifenc" */ "gifenc"
  );

  const { width, height } = frames[0];
  const enc = GIFEncoder();
  const total = frames.length;
  // Yield to the UI between frames so we don't lock the main thread.
  for (let i = 0; i < total; i += 1) {
    const frame = frames[i];
    const rgba = frame.data;
    // Quantize to 256-color palette per frame. With `transparent` enabled,
    // gifenc reserves palette index 0 as the transparent slot.
    const palette = quantize(rgba, 256, {
      format: "rgba4444",
    });
    const index = applyPalette(rgba, palette, "rgba4444");
    enc.writeFrame(index, width, height, {
      palette,
      delay: frame.delayMs,
      transparent: options.transparent,
      transparentIndex: 0,
      dispose: options.transparent ? 2 : -1,
    });
    options.onProgress?.({ done: i + 1, total });
    if (i % 4 === 3) await new Promise((r) => setTimeout(r, 0));
  }
  enc.finish();
  const bytes = enc.bytes();
  return new Blob([bytes as BlobPart], { type: "image/gif" });
}

export async function encodeWebm(
  frames: RGBAFrame[],
  options: { onProgress?: (p: ExportProgress) => void; fps?: number },
): Promise<Blob> {
  if (frames.length === 0) throw new Error("No frames to encode");
  const { width, height } = frames[0];
  // Pick a sensible fps: respect the median frame delay, capped at 30 fps.
  const fps =
    options.fps ??
    Math.max(
      4,
      Math.min(30, Math.round(1000 / medianDelay(frames))),
    );
  const frameMs = 1000 / fps;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const stream = canvas.captureStream(fps);
  const mime = pickWebmMime();
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 4_500_000,
  });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () =>
      resolve(new Blob(chunks, { type: mime }));
    recorder.onerror = (e) => reject(e);
  });

  recorder.start();

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    const imageData = new ImageData(
      new Uint8ClampedArray(frame.data),
      frame.width,
      frame.height,
    );
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(imageData, 0, 0);
    options.onProgress?.({ done: i + 1, total: frames.length });
    await wait(frameMs);
  }

  // Give the encoder a moment to flush the last frame.
  await wait(frameMs);
  recorder.stop();
  return done;
}

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

function medianDelay(frames: RGBAFrame[]): number {
  if (frames.length === 0) return 80;
  const delays = frames.map((f) => f.delayMs).sort((a, b) => a - b);
  return delays[Math.floor(delays.length / 2)] || 80;
}

function pickWebmMime(): string {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const c of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(c)
    ) {
      return c;
    }
  }
  return "video/webm";
}
