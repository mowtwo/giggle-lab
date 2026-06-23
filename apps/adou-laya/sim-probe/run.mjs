#!/usr/bin/env node
// 用 esbuild 把 check.ts(及其 import 的真实 MathE)打包成内存 ESM 后直接运行。
// 提供一个最小 Laya 桩,以防 MathE 顶层意外触及 Laya(当前不会,纯保险)。

import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

const result = await build({
  entryPoints: [path.join(dir, "check.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2020",
  write: false,
  banner: {
    js: "globalThis.Laya = globalThis.Laya || { Vector2: class { setValue(){return this;} }, ColorUtils: { create: () => ({ arrColor: [0,0,0,0] }) }, ColorFilter: class {} };",
  },
});

const code = result.outputFiles[0].text;
await import("data:text/javascript," + encodeURIComponent(code));
