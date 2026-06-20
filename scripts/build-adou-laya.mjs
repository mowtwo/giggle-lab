#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { get } from "node:https";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(fileURLToPath(import.meta.url), "../..");
const layaVersion = process.env.LAYAAIR_VERSION ?? "3.4.0";
const transientRoot = path.join(tmpdir(), "giggle-lab-adou-laya");
const cliInstallDir = path.resolve(
  process.env.LAYAAIR_INSTALL_DIR ?? path.join(transientRoot, ".layaair-cache"),
);
const layaBin =
  process.env.LAYAAIR_BIN ??
  path.join(cliInstallDir, process.platform === "win32" ? "layaair.cmd" : "layaair");
const sourceProjectDir = path.join(rootDir, "apps/adou-laya");
const bootstrapScriptPath = path.join(
  sourceProjectDir,
  "static/adou-bootstrap.js",
);
const stageProjectDir = path.resolve(
  process.env.LAYA_STAGE_DIR ?? path.join(transientRoot, "stage/adou-laya"),
);
const originalAssetDir = path.join(rootDir, "public/songjiang-duel/original");
const outDir = path.resolve(
  process.env.LAYA_OUT_DIR ?? path.join(rootDir, "public/adou-laya"),
);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(
      `Command failed: ${command} ${args.join(" ")} (${result.status ?? "signal"})`,
    );
  }
}

function download(url, target) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        download(response.headers.location, target).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed: ${url} (${response.statusCode})`));
        return;
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        writeFileSync(target, Buffer.concat(chunks));
        resolve();
      });
    });

    request.on("error", reject);
  });
}

async function ensureLayaCli() {
  if (process.env.LAYAAIR_BIN && existsSync(process.env.LAYAAIR_BIN)) {
    return process.env.LAYAAIR_BIN;
  }

  if (process.platform === "win32") {
    throw new Error(
      "Automatic LayaAir CLI install is only wired for macOS/Linux. Set LAYAAIR_BIN on Windows.",
    );
  }

  if (!existsSync(layaBin)) {
    mkdirSync(cliInstallDir, { recursive: true });
    const installerPath = path.join(
      tmpdir(),
      `layaair-install-${Date.now()}-${Math.random().toString(16).slice(2)}.sh`,
    );
    await download(
      "https://raw.githubusercontent.com/layabox/layaair-cli/master/install.sh",
      installerPath,
    );

    const fakeHome = path.join(cliInstallDir, "home");
    mkdirSync(fakeHome, { recursive: true });
    run("bash", [installerPath], {
      env: {
        ...process.env,
        HOME: fakeHome,
        LAYAAIR_INSTALL_DIR: cliInstallDir,
      },
    });
  }

  if (!existsSync(path.join(cliInstallDir, layaVersion))) {
    run(layaBin, ["install", layaVersion]);
  }

  return layaBin;
}

function copyIfPresent(from, to) {
  if (!existsSync(from)) {
    throw new Error(`Required Laya source asset path is missing: ${from}`);
  }

  cpSync(from, to, { recursive: true });
}

function isSameOrInside(parentDir, childPath) {
  const relative = path.relative(parentDir, childPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function getActiveNextDevLock() {
  const lockPath = path.join(rootDir, ".next/dev/lock");
  if (!existsSync(lockPath)) {
    return null;
  }

  try {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    if (!Number.isInteger(lock.pid)) {
      return null;
    }

    process.kill(lock.pid, 0);
    return lock;
  } catch {
    return null;
  }
}

function assertSafePublicOutput() {
  if (process.env.LAYA_ALLOW_PUBLIC_WRITE_DURING_NEXT_DEV === "1") {
    return;
  }

  if (!isSameOrInside(path.join(rootDir, "public"), outDir)) {
    return;
  }

  const lock = getActiveNextDevLock();
  if (!lock) {
    return;
  }

  throw new Error(
    [
      `Refusing to write Laya output into ${path.relative(rootDir, outDir)} while Next dev is running.`,
      `Active dev server: ${lock.appUrl ?? `pid ${lock.pid}`}.`,
      "Stop the dev server first, set LAYA_OUT_DIR to a temp path, or set LAYA_ALLOW_PUBLIC_WRITE_DURING_NEXT_DEV=1 if you really want to force it.",
    ].join("\n"),
  );
}

function stageProject() {
  if (!existsSync(sourceProjectDir)) {
    throw new Error(`Laya project is missing: ${sourceProjectDir}`);
  }

  if (!existsSync(originalAssetDir)) {
    throw new Error(`Original game assets are missing: ${originalAssetDir}`);
  }

  rmSync(stageProjectDir, { recursive: true, force: true });
  mkdirSync(path.dirname(stageProjectDir), { recursive: true });
  cpSync(sourceProjectDir, stageProjectDir, {
    recursive: true,
    filter(source) {
      const relative = path.relative(sourceProjectDir, source);
      return ![
        "bin",
        "library",
        "local",
        "node_modules",
        "release",
        "temp",
      ].some((ignored) => relative === ignored || relative.startsWith(`${ignored}${path.sep}`));
    },
  });

  copyIfPresent(
    path.join(originalAssetDir, "resources"),
    path.join(stageProjectDir, "assets/resources"),
  );
  copyIfPresent(
    path.join(originalAssetDir, "prefab"),
    path.join(stageProjectDir, "assets/prefab"),
  );
  copyIfPresent(
    path.join(originalAssetDir, "data"),
    path.join(stageProjectDir, "assets/data"),
  );
}

async function main() {
  assertSafePublicOutput();
  const cli = await ensureLayaCli();
  stageProject();

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(path.dirname(outDir), { recursive: true });

  run(cli, ["build", "web", "-p", stageProjectDir, "-o", outDir]);

  const outBootstrapPath = path.join(outDir, "js/adou-bootstrap.js");
  cpSync(bootstrapScriptPath, outBootstrapPath);

  writeFileSync(
    path.join(outDir, "adou-build-info.json"),
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        layaVersion,
        source: "apps/adou-laya",
        originalAssets: "public/songjiang-duel/original",
        stageProjectDir,
        outDir,
      },
      null,
      2,
    ),
  );

  const indexPath = path.join(outDir, "index.html");
  const indexHtml = readFileSync(indexPath, "utf8");
  writeFileSync(
    indexPath,
    indexHtml
      .replace("<title>AdouLaya</title>", "<title>阿斗</title>")
      .replace(
        '<script type="text/javascript" src="js/index.js"></script>',
        [
          '<script type="text/javascript" src="js/adou-bootstrap.js"></script>',
          '    <script type="text/javascript" src="js/index.js"></script>',
        ].join("\n"),
      ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
