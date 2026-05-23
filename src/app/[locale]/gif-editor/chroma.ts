"use client";

import type { RGBAFrame } from "./decode";

export type ChromaConfig = {
  /** Target colour to remove, as 0xRRGGBB. */
  color: number;
  /** Tolerance 0–1; how broad the colour match is. */
  tolerance: number;
  /** Feather 0–1; soft alpha falloff outside the core match. */
  feather: number;
};

export function applyChromaToFrame(
  frame: RGBAFrame,
  config: ChromaConfig,
): RGBAFrame {
  const { color, tolerance, feather } = config;
  const tr = (color >> 16) & 0xff;
  const tg = (color >> 8) & 0xff;
  const tb = color & 0xff;
  // Max distance in RGB space = sqrt(3 * 255^2) ≈ 441.7
  const innerRadius = Math.max(0, tolerance) * 441.673;
  const outerRadius = innerRadius + Math.max(0, feather) * 441.673;
  const next = new Uint8ClampedArray(frame.data.length);

  for (let i = 0; i < frame.data.length; i += 4) {
    const r = frame.data[i];
    const g = frame.data[i + 1];
    const b = frame.data[i + 2];
    const a = frame.data[i + 3];
    const dr = r - tr;
    const dg = g - tg;
    const db = b - tb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    let alpha = a;
    if (dist <= innerRadius) {
      alpha = 0;
    } else if (dist < outerRadius && outerRadius > innerRadius) {
      const t = (dist - innerRadius) / (outerRadius - innerRadius);
      alpha = Math.round(a * t);
    }
    next[i] = r;
    next[i + 1] = g;
    next[i + 2] = b;
    next[i + 3] = alpha;
  }

  return {
    data: next,
    width: frame.width,
    height: frame.height,
    delayMs: frame.delayMs,
  };
}

export function pickColorAt(
  frame: RGBAFrame,
  x: number,
  y: number,
): number {
  const ix = Math.max(0, Math.min(frame.width - 1, Math.round(x)));
  const iy = Math.max(0, Math.min(frame.height - 1, Math.round(y)));
  const idx = (iy * frame.width + ix) * 4;
  const r = frame.data[idx];
  const g = frame.data[idx + 1];
  const b = frame.data[idx + 2];
  return (r << 16) | (g << 8) | b;
}

export function colorToHex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function hexToColor(hex: string): number {
  const clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    const r = Number.parseInt(clean[0] + clean[0], 16);
    const g = Number.parseInt(clean[1] + clean[1], 16);
    const b = Number.parseInt(clean[2] + clean[2], 16);
    return (r << 16) | (g << 8) | b;
  }
  return Number.parseInt(clean.slice(0, 6), 16);
}
