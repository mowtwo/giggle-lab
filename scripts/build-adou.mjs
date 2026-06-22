#!/usr/bin/env node

// Build the Adou static site.
//
// Pipeline:
//   1. Run sync-adou-original.mjs to assemble the base static package into the
//      output dir (original engine libs + ALL original resources/scenes +
//      patched index.html/index.js + local platform bootstrap). This is the
//      verified M0 baseline.
//   2. Compile our reconstructed TypeScript (apps/adou-laya/src/Main.ts) with
//      esbuild into js/adou-rebuilt.js.
//   3. In "hybrid" mode (default) inject adou-rebuilt.js AFTER js/bundle.js so
//      our @regClass(uuid) registrations OVERRIDE the original classes while we
//      port them one at a time. In "rebuilt" mode, drop the original bundle.js
//      entirely and ship only our compiled bundle (final cutover).
//
// No Laya IDE or Laya CLI is required: we keep all resources as-is and the
// engine runtime owns class binding by UUID.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const rootDir = path.resolve(fileURLToPath(import.meta.url), "../..");
const appDir = path.join(rootDir, "apps/adou-laya");
const entry = path.join(appDir, "src/Main.ts");
const tsconfig = path.join(appDir, "tsconfig.json");
const outDir = path.resolve(
  process.env.ADOU_ORIGINAL_OUT_DIR ?? path.join(rootDir, "public/adou-laya"),
);

// "hybrid" = original bundle + our overrides (default during reconstruction).
// "rebuilt" = ship only our compiled bundle (final cutover).
const mode = process.env.ADOU_MODE ?? "hybrid";

async function compileBundle() {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    target: "es2019",
    charset: "utf8",
    platform: "browser",
    legalComments: "none",
    tsconfig,
    write: false,
    logLevel: "info",
  });
  return result.outputFiles[0].text;
}

function injectRebuilt(indexHtml, { dropOriginal, version }) {
  const bundleTag =
    '<script type="text/javascript" src="js/bundle.js"></script>';
  // Cache-bust the rebuilt bundle: the URL is otherwise static, so browsers
  // (and the dev static server) happily serve a stale copy after a rebuild.
  const rebuiltTag =
    `<script type="text/javascript" src="js/adou-rebuilt.js?v=${version}"></script>`;

  if (dropOriginal) {
    // Final cutover: our bundle replaces the original entirely.
    return indexHtml.replace(bundleTag, rebuiltTag);
  }
  // Hybrid: load our bundle right after the original so our registrations win.
  return indexHtml.replace(bundleTag, `${bundleTag}\n    ${rebuiltTag}`);
}

async function main() {
  // 1. Assemble the base package (original-static baseline).
  execFileSync("node", [path.join(rootDir, "scripts/sync-adou-original.mjs")], {
    stdio: "inherit",
    env: process.env,
  });

  // 2. Compile our reconstructed TS.
  const compiled = await compileBundle();
  writeFileSync(path.join(outDir, "js/adou-rebuilt.js"), compiled);

  // 3. Wire it into index.html.
  const indexPath = path.join(outDir, "index.html");
  const dropOriginal = mode === "rebuilt";
  writeFileSync(
    indexPath,
    injectRebuilt(readFileSync(indexPath, "utf8"), { dropOriginal, version: compiled.length }),
  );
  if (dropOriginal) {
    rmSync(path.join(outDir, "js/bundle.js"), { force: true });
  }

  // 4. Update build info.
  const infoPath = path.join(outDir, "adou-build-info.json");
  const info = existsSync(infoPath)
    ? JSON.parse(readFileSync(infoPath, "utf8"))
    : {};
  writeFileSync(
    infoPath,
    JSON.stringify(
      { ...info, mode: `reconstruction-${mode}`, rebuiltBytes: compiled.length },
      null,
      2,
    ),
  );

  console.log(
    `Built Adou (${mode}) -> ${path.relative(rootDir, outDir)} (rebuilt bundle ${compiled.length} bytes)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
