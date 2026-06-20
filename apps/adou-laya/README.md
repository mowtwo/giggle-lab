# Adou Laya

This is the isolated LayaAir source project for the rebuilt Adou game.
Next.js only embeds the built Web output from `public/adou-laya`.

## Build Model

- Source lives here: `apps/adou-laya`.
- The clean Laya entry is `src/Main.ts`; it mounts
  `src/laya-adapter/adou-battle-scene.ts`, which consumes `src/adou-core`
  directly for the start screen, battle board, hand slots, skills, HUD, enemies,
  audio cues, and simple feedback tweens.
- The reproducible original game snapshot lives at `vendor/original/game`.
- `pnpm build:adou` now emits the clean static Laya site to
  `public/adou-laya` without `js/bundle.js`. It uses TypeScript's compiler API
  to bundle `src/Main.ts`, `src/adou-core`, and `src/laya-adapter`, then copies
  original Laya runtime libraries and art/audio resources.
- `pnpm build:adou:original` is the temporary fallback that copies the original
  snapshot to `public/adou-laya`, patches the entry page for static hosting,
  removes the 4399 SDK script, and writes a local platform bootstrap.
- `public/adou-laya` is generated output and is not committed.
- `pnpm build:laya` is kept as a fallback LayaAir project build. It stages a
  temporary project under the system temp directory,
  copies the original assets into that staged project, and builds Web output to
  `public/adou-laya`.
- The LayaAir CLI cache also lives under the system temp directory by default.
  Override it with `LAYAAIR_INSTALL_DIR` only when a persistent cache is needed.
- The build script refuses to write into `public` while a Next dev server from
  this repo is active. Stop `pnpm dev`, or set `LAYA_OUT_DIR` to a temp path for
  local Laya-only builds.
- While `pnpm dev` is running, use `pnpm build:adou:dev-public` after code
  changes. It builds to a temp directory, promotes only `index.html`,
  `js/index.js`, `js/adou-clean.js`, and `adou-build-info.json`, and removes
  stale `js/bundle.js`/`gameIndex.html` without copying the large watched
  resource trees.
- The root `pnpm build` runs `build:adou` first, then `next build`, so Vercel
  deploys one static site with the clean Laya game package inside it.

## Original Bundle Porting Rules

Put original game bundles or extracted code under `vendor/original` before
porting. The port should keep the local game systems and remove runtime pieces
that cannot work on a static Vercel deployment:

- write new clean gameplay modules under `src/adou-core` first, then connect
  them to Laya scene adapters;
- remove platform SDK calls;
- remove login, account, share, ad, ranking, payment, and analytics flows;
- replace remote saves with local storage;
- replace remote config with committed JSON data;
- keep battle flow, bag/codex/loadout, generals, skills, weapons, animation, and
  audio behavior.

The goal is to translate source behavior first. UI and gameplay should be Laya
canvas driven, not React-driven.
