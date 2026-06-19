import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const bundlePath = process.argv[2] ?? "/tmp/4399_bundle.pretty.js";
const outputPath =
  process.argv[3] ?? "public/songjiang-duel/original-assets.generated.json";
const publicRoot = process.argv[4] ?? "public/songjiang-duel/original";

const source = readFileSync(bundlePath, "utf8");
const assets = new Set();
const assetPattern =
  /["'`](?:(resources\/(?:img|anim|music|sound|loading)\/[^"'`$]+?|prefab\/[^"'`$]+?|data\/[^"'`$]+?))["'`]/g;

for (const match of source.matchAll(assetPattern)) {
  const asset = match[1];
  if (!asset) continue;
  if (asset.includes("${")) continue;
  assets.add(asset);
}

const sortedAssets = [...assets].sort((a, b) => a.localeCompare(b));
const missing = sortedAssets.filter((asset) => !existsSync(join(publicRoot, asset)));
const payload = {
  bundlePath,
  publicRoot,
  generatedAt: new Date().toISOString(),
  total: sortedAssets.length,
  missing: missing.length,
  assets: sortedAssets,
  missingAssets: missing,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

console.log(
  `Extracted ${sortedAssets.length} asset refs; ${missing.length} missing under ${publicRoot}.`,
);
