#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const rootDir = path.resolve(fileURLToPath(import.meta.url), "../..");
const sourceRoot = path.join(rootDir, "apps/adou-laya");
const srcDir = path.join(sourceRoot, "src");
const originalGameDir = path.join(sourceRoot, "vendor/original/game");
const outDir = path.resolve(
  process.env.ADOU_CLEAN_OUT_DIR ?? path.join(rootDir, "public/adou-laya"),
);

const runtimePaths = [
  "libs",
  "resources",
  "prefab",
  "data",
  "splash.png",
  "fileconfig.json",
];

function isSameOrInside(parentDir, childPath) {
  const relative = path.relative(parentDir, childPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function getActiveNextDevLock() {
  const lockPath = path.join(rootDir, ".next/dev/lock");
  if (!existsSync(lockPath)) return null;

  try {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    if (!Number.isInteger(lock.pid)) return null;
    process.kill(lock.pid, 0);
    return lock;
  } catch {
    return null;
  }
}

function assertSafePublicOutput() {
  if (process.env.ADOU_CLEAN_ALLOW_PUBLIC_WRITE_DURING_NEXT_DEV === "1") return;
  if (!isSameOrInside(path.join(rootDir, "public"), outDir)) return;
  const lock = getActiveNextDevLock();
  if (!lock) return;

  throw new Error(
    [
      `Refusing to write clean Adou output into ${path.relative(rootDir, outDir)} while Next dev is running.`,
      `Active dev server: ${lock.appUrl ?? `pid ${lock.pid}`}.`,
      "Stop the dev server, set ADOU_CLEAN_OUT_DIR to a temp path, or set ADOU_CLEAN_ALLOW_PUBLIC_WRITE_DURING_NEXT_DEV=1 if you really want to force it.",
    ].join("\n"),
  );
}

function assertPath(filePath) {
  if (!existsSync(filePath)) throw new Error(`Missing required path: ${filePath}`);
}

function collectTsFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function moduleId(filePath) {
  return path.relative(sourceRoot, filePath).replaceAll(path.sep, "/");
}

function jsString(value) {
  return JSON.stringify(value);
}

function compileModule(filePath) {
  const source = readFileSync(filePath, "utf8");
  const result = ts.transpileModule(source, {
    fileName: filePath,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      strict: true,
      strictNullChecks: false,
      esModuleInterop: true,
      skipLibCheck: true,
      sourceMap: false,
      importHelpers: false,
    },
  });

  const diagnostics = result.diagnostics ?? [];
  const errors = diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (errors.length > 0) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => rootDir,
      getNewLine: () => "\n",
    });
    throw new Error(formatted);
  }

  return result.outputText;
}

function writeCleanBundle() {
  const files = [
    path.join(srcDir, "Main.ts"),
    ...collectTsFiles(path.join(srcDir, "adou-core")),
    ...collectTsFiles(path.join(srcDir, "laya-adapter")),
  ].sort();

  const moduleIds = new Set(files.map(moduleId));
  const chunks = [];
  chunks.push(`(() => {
  const modules = Object.create(null);
  const cache = Object.create(null);

  function normalize(path) {
    const parts = [];
    for (const part of path.split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") parts.pop();
      else parts.push(part);
    }
    return parts.join("/");
  }

  function dirname(id) {
    const index = id.lastIndexOf("/");
    return index < 0 ? "" : id.slice(0, index);
  }

  function resolve(fromId, request) {
    if (!request.startsWith(".")) return request;
    const base = normalize(dirname(fromId) + "/" + request);
    const withTs = base + ".ts";
    if (modules[withTs]) return withTs;
    const withIndex = base + "/index.ts";
    if (modules[withIndex]) return withIndex;
    throw new Error("Cannot resolve " + request + " from " + fromId);
  }

  function define(id, factory) {
    modules[id] = factory;
  }

  function requireModule(id) {
    if (cache[id]) return cache[id].exports;
    const factory = modules[id];
    if (!factory) throw new Error("Unknown module " + id);
    const module = { exports: {} };
    cache[id] = module;
    factory((request) => requireModule(resolve(id, request)), module.exports, module);
    return module.exports;
  }
`);

  for (const file of files) {
    const id = moduleId(file);
    if (!moduleIds.has(id)) continue;
    chunks.push(`  define(${jsString(id)}, function(require, exports, module) {\n${compileModule(file)}\n  });\n`);
  }

  chunks.push(`  requireModule("src/Main.ts");
})();\n`);
  writeFileSync(path.join(outDir, "js/adou-clean.js"), chunks.join("\n"));
}

function writeCleanIndex() {
  const html = `<!doctype html>
<html>
<head>
  <title>阿斗</title>
  <meta charset="utf-8" />
  <meta name="renderer" content="webkit" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="full-screen" content="true" />
  <meta name="x5-fullscreen" content="true" />
  <meta name="360-fullscreen" content="true" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #17110d; color: #fff; }
    #splash { position: absolute; inset: 0; z-index: 10; background: #17110d url("splash.png") center 30% no-repeat; transition: opacity 240ms ease; }
  </style>
</head>
<body>
  <div id="splash"></div>
  <script>
    window.hideSplashScreen = () => {
      const splash = document.getElementById("splash");
      if (!splash) return;
      splash.style.opacity = "0";
      setTimeout(() => splash.remove(), 260);
    };
    window.onSplashProgress = () => {};
  </script>
  <script src="libs/laya.core.js"></script>
  <script src="libs/laya.webgl_2D.js"></script>
  <script src="libs/laya.ui.js"></script>
  <script src="libs/laya.trailCommon.js"></script>
  <script src="libs/laya.trail2D.js"></script>
  <script src="libs/spine-core-3.7.js"></script>
  <script src="libs/laya.spine.js"></script>
  <script src="js/adou-clean.js"></script>
  <script src="js/index.js"></script>
</body>
</html>
`;
  writeFileSync(path.join(outDir, "index.html"), html);
}

function writeCleanLayaIndex() {
  const originalIndex = readFileSync(path.join(originalGameDir, "js/index.js"), "utf8");
  writeFileSync(
    path.join(outDir, "js/index.js"),
    originalIndex
      .replace(/"scaleMode":"fixedwidth"/, "\"scaleMode\":\"showall\"")
      .replace(/"screenMode":"vertical"/, "\"screenMode\":\"none\"")
      .replace(/"alignV":"top"/, "\"alignV\":\"middle\"")
      .replace(/"alignH":"left"/, "\"alignH\":\"center\"")
      .replace(/"backgroundColor":"#888888"/, "\"backgroundColor\":\"#17110d\"")
      .replace("\"startupScene\":\"scene/LoadScene.ls\"", "\"startupScene\":\"\""),
  );
}

function main() {
  assertPath(originalGameDir);
  assertPath(path.join(srcDir, "Main.ts"));
  assertSafePublicOutput();

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(path.join(outDir, "js"), { recursive: true });

  for (const runtimePath of runtimePaths) {
    const source = path.join(originalGameDir, runtimePath);
    if (!existsSync(source)) continue;
    cpSync(source, path.join(outDir, runtimePath), { recursive: true });
  }

  writeCleanBundle();
  writeCleanLayaIndex();
  writeCleanIndex();
  writeFileSync(
    path.join(outDir, "adou-build-info.json"),
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        source: "clean-laya-adapter",
        entry: "apps/adou-laya/src/Main.ts",
        includesOriginalBundle: false,
        outDir,
      },
      null,
      2,
    ),
  );
}

main();
