# Original Port

This folder is the clean TypeScript port of the original Laya game logic.
The goal is to translate the original battle game first, then replace Laya,
platform, network, ad, animation, and audio dependencies with explicit ports.

## Source Map

- `rules.ts`
  - Deck data from `/tmp/4399_bundle.pretty.js` around `v.constructor`.
  - Enemy wave, HP, boss, and difficulty tables from `k.constructor`.
  - Prop definitions from the original props table around `Ue`.
- `battle-flow.ts`
  - Translates original `BattleMgr` (`vn`) state machine:
    - `delayTime` -> prepare phase.
    - `iX = 1500` -> spawn interval.
    - `sX = 5000` -> wave cooldown.
    - `oi` -> current wave.
    - `aX/eX` -> wave size/spawned count.
- `ports.ts`
  - Replaces Laya loader, tween, spine, sound, and platform calls.
  - First implementation is intentionally minimal; Pixi/audio patches should implement this interface.
- `assets.ts`
  - Records original preload and critical battle asset paths.
  - `scripts/extract-songjiang-original-assets.mjs` generates the full resource report from the bundle.
- `core.ts`
  - The new target game core that will replace the current ad-hoc `game-core.ts`.
  - It currently covers start, refresh, wave progression, enemy spawn, and boss slot selection.

## Port Order

1. Battle flow and enemy spawning.
2. Refresh slots, drag containers, reserve/placement rules.
3. Soldier/general merge, movement, and attack targeting.
4. Weapon bullets and hit effects.
5. Active/passive prop effects.
6. AI controller.
7. Pixi/mobile view adapter.
