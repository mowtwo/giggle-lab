import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempOutDir = path.join(tmpdir(), "giggle-lab-adou-clean-promote");
const publicOutDir = path.join(rootDir, "public/adou-laya");

function runCleanBuild() {
  const result = spawnSync(
    process.execPath,
    [path.join(rootDir, "scripts/build-adou-clean.mjs")],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        ADOU_CLEAN_OUT_DIR: tempOutDir,
      },
      stdio: "inherit",
    },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function promoteFile(relativePath) {
  const source = path.join(tempOutDir, relativePath);
  const target = path.join(publicOutDir, relativePath);
  if (!existsSync(source)) throw new Error(`Missing clean build artifact: ${relativePath}`);
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(source, target);
}

if (!existsSync(publicOutDir)) {
  throw new Error(
    "public/adou-laya does not exist. Stop the Next dev server and run pnpm build:adou once for a full static output.",
  );
}

runCleanBuild();

for (const relativePath of [
  "index.html",
  "js/index.js",
  "js/adou-clean.js",
  "adou-build-info.json",
]) {
  promoteFile(relativePath);
}

for (const stalePath of [
  "js/bundle.js",
  "gameIndex.html",
]) {
  rmSync(path.join(publicOutDir, stalePath), { force: true });
}

console.log("Promoted clean Adou build entry files without copying watched resource trees.");
