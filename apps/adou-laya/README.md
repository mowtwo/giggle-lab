# Adou Laya

This is the isolated LayaAir source project for the rebuilt Adou game.
Next.js only embeds the built Web output from `public/adou-laya`.

## Build Model

- Source lives here: `apps/adou-laya`.
- Original static assets stay canonical at `public/songjiang-duel/original`.
- `pnpm build:laya` stages a temporary project under `.laya-build/adou-laya`,
  copies the original assets into that staged project, and builds Web output to
  `public/adou-laya`.
- `public/adou-laya` is generated output and is not committed.
- The root `pnpm build` runs the Laya build first, then `next build`, so Vercel
  deploys one static site with the Laya game inside it.

## Original Bundle Porting Rules

Put original game bundles or extracted code under `vendor/original` before
porting. The port should keep the local game systems and remove runtime pieces
that cannot work on a static Vercel deployment:

- remove platform SDK calls;
- remove login, account, share, ad, ranking, payment, and analytics flows;
- replace remote saves with local storage;
- replace remote config with committed JSON data;
- keep battle flow, bag/codex/loadout, generals, skills, weapons, animation, and
  audio behavior.

The goal is to translate source behavior first. UI and gameplay should be Laya
canvas driven, not React-driven.
