"use client";

/**
 * Decoders for the GIF editor. All decoders dynamically import their heavy
 * dependencies (gifuct-js) so the editor entry chunk stays light.
 */

export type RGBAFrame = {
  /** Raw RGBA pixels, length = width * height * 4. */
  data: Uint8ClampedArray;
  width: number;
  height: number;
  /** Display delay in milliseconds for this frame. */
  delayMs: number;
};

export type DecodedClip = {
  width: number;
  height: number;
  frames: RGBAFrame[];
  source: "gif" | "webm";
};

const GIF_DEFAULT_DELAY_MS = 100;
const WEBM_MAX_FRAMES = 240;
const WEBM_SAMPLE_FPS = 15;

export async function decodeGif(file: File): Promise<DecodedClip> {
  const [{ parseGIF, decompressFrames }, buffer] = await Promise.all([
    import(/* webpackChunkName: "gifuct" */ "gifuct-js"),
    file.arrayBuffer(),
  ]);

  const gif = parseGIF(buffer);
  const rawFrames = decompressFrames(gif, true);
  if (rawFrames.length === 0) throw new Error("GIF has no frames");

  const width = gif.lsd.width;
  const height = gif.lsd.height;

  // Build a composite canvas to honour disposal methods (gifuct decompressFrames
  // already runs LZW; disposal logic is on us).
  const composite = new Uint8ClampedArray(width * height * 4);
  let prevSnapshot: Uint8ClampedArray | null = null;

  const out: RGBAFrame[] = [];
  for (const raw of rawFrames) {
    const patch = raw.patch;
    const dims = raw.dims;
    const disposal = raw.disposalType;

    if (disposal === 3 && prevSnapshot) {
      composite.set(prevSnapshot);
    }
    prevSnapshot = new Uint8ClampedArray(composite);

    for (let py = 0; py < dims.height; py += 1) {
      for (let px = 0; px < dims.width; px += 1) {
        const idx = (py * dims.width + px) * 4;
        const alpha = patch[idx + 3];
        if (alpha === 0) continue;
        const dst = ((dims.top + py) * width + (dims.left + px)) * 4;
        composite[dst] = patch[idx];
        composite[dst + 1] = patch[idx + 1];
        composite[dst + 2] = patch[idx + 2];
        composite[dst + 3] = 255;
      }
    }

    out.push({
      data: new Uint8ClampedArray(composite),
      width,
      height,
      delayMs:
        raw.delay && raw.delay > 0 ? raw.delay : GIF_DEFAULT_DELAY_MS,
    });

    if (disposal === 2) {
      // Restore to background colour by clearing the patch region.
      for (let py = 0; py < dims.height; py += 1) {
        for (let px = 0; px < dims.width; px += 1) {
          const dst = ((dims.top + py) * width + (dims.left + px)) * 4;
          composite[dst] = 0;
          composite[dst + 1] = 0;
          composite[dst + 2] = 0;
          composite[dst + 3] = 0;
        }
      }
    }
  }

  return { width, height, frames: out, source: "gif" };
}

export async function decodeWebm(file: File): Promise<DecodedClip> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  try {
    await new Promise<void>((resolve, reject) => {
      const ok = () => resolve();
      const fail = () => reject(new Error("WebM load failed"));
      video.addEventListener("loadedmetadata", ok, { once: true });
      video.addEventListener("error", fail, { once: true });
    });

    const width = video.videoWidth;
    const height = video.videoHeight;
    const duration = video.duration;
    if (!width || !height || !Number.isFinite(duration)) {
      throw new Error("WebM has no usable metadata");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas unavailable");

    const frameCount = Math.min(
      WEBM_MAX_FRAMES,
      Math.max(1, Math.round(duration * WEBM_SAMPLE_FPS)),
    );
    const delayMs = Math.round(1000 / WEBM_SAMPLE_FPS);
    const frames: RGBAFrame[] = [];

    for (let i = 0; i < frameCount; i += 1) {
      const t = (i / frameCount) * duration;
      await seekTo(video, t);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      frames.push({
        data: new Uint8ClampedArray(imageData.data),
        width,
        height,
        delayMs,
      });
    }

    return { width, height, frames, source: "webm" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let timeout: number | null = null;
    const done = () => {
      video.removeEventListener("seeked", done);
      video.removeEventListener("error", fail);
      if (timeout !== null) window.clearTimeout(timeout);
      resolve();
    };
    const fail = () => {
      video.removeEventListener("seeked", done);
      video.removeEventListener("error", fail);
      if (timeout !== null) window.clearTimeout(timeout);
      reject(new Error(`seek to ${time} failed`));
    };
    video.addEventListener("seeked", done, { once: true });
    video.addEventListener("error", fail, { once: true });
    video.currentTime = time;
    // Some browsers fail to fire 'seeked' if currentTime resolves immediately.
    timeout = window.setTimeout(done, 1500);
  });
}

export async function decodeFile(file: File): Promise<DecodedClip> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".gif") || file.type === "image/gif") {
    return decodeGif(file);
  }
  if (
    name.endsWith(".webm") ||
    file.type === "video/webm" ||
    file.type.startsWith("video/")
  ) {
    return decodeWebm(file);
  }
  throw new Error("Unsupported file type. Use .gif or .webm.");
}
