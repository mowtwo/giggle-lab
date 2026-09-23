import type { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegPromise: Promise<FFmpeg> | null = null;
let multiThread = false;
let queue: Promise<unknown> = Promise.resolve();
let lastLog = "";
let activeController: AbortController | null = null;
let activeInstance: FFmpeg | null = null;
let progressListener: ((ratio: number) => void) | null = null;

export function ffmpegUsesThreads() {
  return multiThread;
}

export function setFfmpegProgressListener(listener: ((ratio: number) => void) | null) {
  progressListener = listener;
}

export function interruptFfmpeg() {
  activeController?.abort();
  try {
    activeInstance?.terminate();
  } catch {
    // The worker may already be gone.
  }
  activeController = null;
  activeInstance = null;
  ffmpegPromise = null;
  queue = Promise.resolve();
}

async function loadVariant(mt: boolean) {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => {
    lastLog = message;
  });
  ffmpeg.on("progress", ({ progress }) => {
    if (!Number.isFinite(progress)) return;
    progressListener?.(Math.min(1, Math.max(0, progress)));
  });
  const base = new URL(mt ? "/ffmpeg/mt/" : "/ffmpeg/st/", window.location.href);
  const classWorkerURL = new URL("/ffmpeg/class/worker.js", window.location.href).toString();
  const coreURL = new URL("ffmpeg-core.js", base).toString();
  const wasmURL = new URL("ffmpeg-core.wasm", base).toString();
  if (mt) {
    await ffmpeg.load({
      classWorkerURL,
      coreURL,
      wasmURL,
      workerURL: new URL("ffmpeg-core.worker.js", base).toString(),
    });
    multiThread = true;
  } else {
    await ffmpeg.load({ classWorkerURL, coreURL, wasmURL });
    multiThread = false;
  }
  return ffmpeg;
}

export function loadFfmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const wantThreads =
        typeof crossOriginIsolated === "boolean" && crossOriginIsolated;
      if (wantThreads) {
        try {
          return await loadVariant(true);
        } catch (error) {
          console.warn("Multi-thread ffmpeg failed, falling back.", error);
        }
      }
      return loadVariant(false);
    })().catch((error: unknown) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

export function enqueueFfmpeg<T>(task: (ffmpeg: FFmpeg) => Promise<T>) {
  const run = queue.then(async () => task(await loadFfmpeg()));
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function execFfmpeg(ffmpeg: FFmpeg, args: string[]) {
  lastLog = "";
  const controller = new AbortController();
  activeController = controller;
  activeInstance = ffmpeg;
  try {
    const code = await ffmpeg.exec(args, -1, { signal: controller.signal });
    if (controller.signal.aborted) {
      throw new DOMException("FFmpeg interrupted", "AbortError");
    }
    if (code !== 0) {
      throw new Error(lastLog || `ffmpeg exited ${code}`);
    }
  } finally {
    if (activeController === controller) activeController = null;
  }
}

export function threadArgs() {
  return ffmpegUsesThreads() ? ["-threads", "4"] : [];
}

export async function readOutput(ffmpeg: FFmpeg, name: string) {
  const data = await ffmpeg.readFile(name);
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data.slice();
}

export async function discard(ffmpeg: FFmpeg, name: string) {
  try {
    await ffmpeg.deleteFile(name);
  } catch {
    // The file may already be gone after a failed exec.
  }
}
