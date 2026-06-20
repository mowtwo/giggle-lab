#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const outDir = path.join(mkdtempSync(path.join(tmpdir(), "adou-clean-check-")), "site");

const result = spawnSync(
  "node",
  ["scripts/build-adou-clean.mjs"],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      ADOU_CLEAN_OUT_DIR: outDir,
    },
    stdio: "inherit",
  },
);

if (result.status !== 0) process.exit(result.status ?? 1);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const html = readFileSync(path.join(outDir, "index.html"), "utf8");
  const cleanBundle = readFileSync(path.join(outDir, "js/adou-clean.js"), "utf8");
  const index = readFileSync(path.join(outDir, "js/index.js"), "utf8");

  assert(!existsSync(path.join(outDir, "js/bundle.js")), "clean build must not emit original js/bundle.js");
  assert(html.includes("js/adou-clean.js"), "clean index should load adou-clean.js");
  assert(html.includes("js/index.js"), "clean index should load Laya bootstrap index.js");
  assert(!html.includes("js/bundle.js"), "clean index must not load original bundle.js");
  assert(cleanBundle.includes("src/Main.ts"), "clean bundle should contain the rebuilt Main module");
  assert(cleanBundle.includes("AdouBattleScene"), "clean bundle should include the Laya adapter");
  assert(!index.includes("\"startupScene\":\"scene/LoadScene.ls\""), "clean Laya bootstrap should not auto-open original scene");
  assert(existsSync(path.join(outDir, "resources/sound/bow_attack.mp3")), "clean build should copy original sounds");
  assert(existsSync(path.join(outDir, "resources/loading/title.png")), "clean build should copy loading art");

  console.log("adou clean build checks passed");
} finally {
  rmSync(path.dirname(outDir), { recursive: true, force: true });
}
