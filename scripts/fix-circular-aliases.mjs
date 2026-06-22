// One-off codemod: replace top-level `const <id> = <SingletonOrFactory>;` aliases
// with direct class references. Under esbuild's circular-module evaluation these
// aliases get captured as `undefined`, so any `<id>.instance()` at runtime throws
// "Cannot read properties of undefined (reading 'instance')". Direct class refs
// use the live binding (defined by the time methods run).
//
// Only converts a whitelist of dot-accessed Singleton/Factory classes (never used
// with `new`/`extends`), per-file mapping (handles aliases like `de` that mean
// different classes in different files). Uses a negative lookbehind so property
// access (`obj.q.x`) is never touched.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(import.meta.url), "../../apps/adou-laya/src");

const WHITELIST = new Set([
  "EffectMgr", "UpdateMgr", "BuffMgr", "PrefabFactory", "BattlePropsMgr", "TipMgr",
  "EntityRegistry", "PlatformMgr", "BoardMgr", "WeaponFragmentMgr", "SpawnQueueMgr",
  "AvatarMgr", "PrefabPool", "WeaponFactory", "HitStrategyFactory", "BulletSpawnMgr",
  "RankScoreMgr", "GameController", "TutorialMgr", "ServerReportMgr", "StaminaCtrl",
  "BoardInputMgr", "LeaderboardMgr", "AnalyticsMgr", "PropsFactory", "BattleMgr",
  "FocusMgr", "PlacementValidator", "PoolFactory", "EnemySpatialMgr", "DragVisualMgr",
  "EnemyFactory", "GeneralMergeFactory", "PlacementMgr", "GeneralAIController",
  "WeaponMgr", "DamageStatsMgr", "GameMgr", "SceneMgr", "AudioMgr", "EventMgr",
  "PreloadMgr", "SaveMgr", "RankMgr", "WeaponDataMgr", "GeneralMgr", "StaminaMgr",
  "PrivacyAgreementMgr", "MathE",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}

let totalFiles = 0;
let totalAliases = 0;
for (const file of walk(root)) {
  let src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  const map = {};
  const kept = [];
  for (const line of lines) {
    const m = line.match(/^const (\w+) = (\w+);$/);
    if (m && WHITELIST.has(m[2])) {
      map[m[1]] = m[2];
      continue; // drop the alias declaration
    }
    kept.push(line);
  }
  const ids = Object.keys(map);
  if (ids.length === 0) continue;
  let body = kept.join("\n");
  for (const id of ids) {
    // Multi-char aliases: replace bare + `.method` (lookbehind avoids property
    // access `obj.id`; lookahead avoids longer identifiers `idName`).
    // Single-char aliases (q/j/z/K/F/f/y/H/G/...) only replace `<id>.` — a bare
    // single letter also matches object keys (`y:`), method names (`K$`) and path
    // strings (`layer-z`). Their rare bare uses are fixed by hand after typecheck.
    if (id.length >= 2) {
      body = body.replace(new RegExp(`(?<![\\w.])${id}(?![\\w])`, "g"), map[id]);
    } else {
      // Single-char alias: match `<id>.` allowing whitespace/newline before the
      // dot (chained calls split across lines), keeping the original spacing.
      body = body.replace(new RegExp(`(?<![\\w.])${id}(\\s*\\.)`, "g"), `${map[id]}$1`);
    }
  }
  writeFileSync(file, body);
  totalFiles += 1;
  totalAliases += ids.length;
  console.log(`${path.relative(root, file)}: ${ids.map((i) => `${i}->${map[i]}`).join(", ")}`);
}
console.log(`\nDone: ${totalAliases} aliases across ${totalFiles} files.`);
