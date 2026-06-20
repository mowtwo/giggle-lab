# Adou Reconstruction — Progress & Cutover Criteria

Source of truth: `vendor/original/game/js/bundle.js` (beautified at
`reference/bundle.pretty.js`). Behaviour recovered from it, never invented.
See `CLASS-MAP.md` for the full UUID→class map.

## Build modes

- `pnpm build:adou` — **hybrid** (default during reconstruction): original
  `js/bundle.js` + our `js/adou-rebuilt.js` loaded after it, overriding classes
  by `@regClass(uuid)` as they are ported. Game stays fully runnable.
- `pnpm build:adou:rebuilt` — **cutover**: drop the original bundle entirely,
  ship only our compiled code.
- `pnpm build:adou:original` — pure original (M0 baseline / fallback).

## Status

### Infrastructure — DONE
- [x] M0: original bundle boots as static mini-app (all resources load)
- [x] esbuild pipeline (`scripts/build-adou.mjs`), hybrid + rebuilt modes
- [x] Next.js embed: `/adou-duel` iframe → `/adou-laya/index.html`
- [x] In-browser verification harness (`window.__ADOU_REBUILT__.modules`)

### Foundation singletons / utilities
- [x] `Singleton` base (`C`)
- [x] `EventMgr` event bus (`p`)
- [x] `MathE` math/geometry/random (`f`)
- [x] `SceneMgr` scene+dialog navigation (`Z`/`K`)
- [x] `AudioMgr` (`$`) — playSound / music / ad pause-resume
- [x] `PrivacyAgreementMgr` (`Kr`/`Zr`) — platform config + agreement gate/dialog
- [x] `PlatformMgr` (`Mt`) — static-safe stub (exit; grows as callers are ported)
- [ ] zIndex constants (`X`)
- [ ] TipMgr + loading-mask (`tt`, `J`)
- [ ] event-name registry (`u`/`c`)
- [ ] Save / player-data manager(s) (`st`, `U`, ...)
- [ ] EffectMgr / button-feedback manager (`N`/`q`)
- [ ] Data-table loaders (weapon.json / weaponTxt.json / rank.json; Map(54)/Map(44))
- [ ] Game/battle state managers (`U`, ...), weapon + bullet factories

### Scenes (0 / 11) — `@regClass` bound to `scene/*.ls`
- [ ] LoadScene · LoadMaskScene · MainScene · MatchScene · BattleScene
- [ ] GameOverScene · ShopScene · WeaponScene · RankScene · SettingScene
- [ ] AvatarSettingScene

### Dialogs (0 / 17) — `@regClass` bound to `dialog/*.lh`
- [ ] Authorize · BossTip · Deck · DeletePropsTip · GetStamina · GM · NewWeapon
- [ ] Pause · PrivacyPolicy · RankReward · RecycleWeapon · ReplacePropsTip
- [ ] ShareLp · Sidebar · Tip · UnitInfo · WeaponIntro

### Prefab/component classes (0 / 5)
- [ ] mapBg1/2/3 · self-rotation effect (`Co`) · `ro`

## When can the original `js/bundle.js` be deleted?

Run `pnpm build:adou:rebuilt` (original dropped) and the full game must work.
That is safe only when ALL of the following hold:

1. **All 33 `@regClass(uuid)` classes** (11 scenes + 17 dialogs + 3 mapBg + 2
   components) are registered by our bundle under their exact UUIDs.
2. **Every support singleton/system on the runtime path is ported** (audio,
   save/config, platform stub, data loaders, tip/mask, battle/game state,
   weapon+bullet factories) — i.e. our code references no original-bundle-only
   global.
3. **Full playthrough verified in rebuilt mode**, behaviour matching the
   original: Load → Main → Match → Battle → GameOver, plus Shop / Weapon / Rank /
   Setting / AvatarSetting and their dialogs — with scene/img/anim/audio
   resources all loading.
4. `pnpm typecheck:adou` clean and no runtime errors in console during the
   playthrough.

Until then we stay in **hybrid** mode: every ported class is verified against
the live original before moving on, so the game is never broken.

Rough completeness today: infrastructure 100%, foundation ~35%, scenes/dialogs/
gameplay 0% → overall ~10–15% by surface area. The heavy, interconnected parts
(battle system, data/save, weapon+bullet factories) are still ahead.
