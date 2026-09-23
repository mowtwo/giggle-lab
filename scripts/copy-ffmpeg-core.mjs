import { access, cp, mkdir, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

async function sameSize(from, to) {
  try {
    await access(to);
  } catch {
    return false;
  }
  const [source, dest] = await Promise.all([stat(from), stat(to)]);
  return source.size === dest.size;
}

async function copyCore(pkg, dest, files) {
  const entry = require.resolve(pkg);
  const srcDir = join(dirname(entry), "..", "esm");
  await mkdir(dest, { recursive: true });
  for (const name of files) {
    const from = join(srcDir, name);
    const to = join(dest, name);
    try {
      await access(from);
    } catch {
      continue;
    }
    if (await sameSize(from, to)) continue;
    await cp(from, to);
  }
}

const root = process.cwd();
await copyCore("@ffmpeg/core", join(root, "public/ffmpeg/st"), [
  "ffmpeg-core.js",
  "ffmpeg-core.wasm",
]);
await copyCore("@ffmpeg/core-mt", join(root, "public/ffmpeg/mt"), [
  "ffmpeg-core.js",
  "ffmpeg-core.wasm",
  "ffmpeg-core.worker.js",
]);

const classDir = join(root, "public/ffmpeg/class");
await mkdir(classDir, { recursive: true });
const classSrc = dirname(require.resolve("@ffmpeg/ffmpeg/worker"));
for (const name of ["worker.js", "const.js", "errors.js"]) {
  const from = join(classSrc, name);
  const to = join(classDir, name);
  if (await sameSize(from, to)) continue;
  await cp(from, to);
}
