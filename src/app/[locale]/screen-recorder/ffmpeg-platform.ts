const WASM_MAGIC = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

export function classifyFfmpegPlatform(features: {
  webAssembly: boolean;
  worker: boolean;
}): "ok" | "unsupported" {
  if (!features.webAssembly || !features.worker) return "unsupported";
  return "ok";
}

export function ffmpegPlatformSupport(): "ok" | "unsupported" {
  let webAssembly = false;
  try {
    webAssembly =
      typeof WebAssembly === "object" &&
      typeof WebAssembly.validate === "function" &&
      WebAssembly.validate(WASM_MAGIC);
  } catch {
    webAssembly = false;
  }
  return classifyFfmpegPlatform({
    webAssembly,
    worker: typeof Worker === "function",
  });
}
