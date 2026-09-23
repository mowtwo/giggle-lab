import assert from "node:assert/strict";
import test from "node:test";

import { classifyFfmpegPlatform } from "./ffmpeg-platform.ts";

test("ffmpeg needs both webassembly and a worker", () => {
  assert.equal(classifyFfmpegPlatform({ webAssembly: true, worker: true }), "ok");
  assert.equal(classifyFfmpegPlatform({ webAssembly: false, worker: true }), "unsupported");
  assert.equal(classifyFfmpegPlatform({ webAssembly: true, worker: false }), "unsupported");
  assert.equal(classifyFfmpegPlatform({ webAssembly: false, worker: false }), "unsupported");
});
