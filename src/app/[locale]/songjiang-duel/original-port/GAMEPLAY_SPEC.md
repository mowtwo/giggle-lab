# Original Gameplay Spec

This file is the working contract for the original-game port. The user should
not need to re-list the full game rules by hand; missing or uncertain items
must be extracted from `/tmp/4399_bundle.pretty.js` first, then checked against
the playable result.

## Scope

Keep the battle game and the parts needed by it:

- Mobile-first battle scene.
- Pre-game loadout: generals, weapons, 2 active skills, 5 passive skills.
- Refresh bar, drag placement, merge/upgrade/move/range display.
- Enemy waves, bosses, AI opponent, active/passive prop logic.
- Weapon system, weapon rarity, bullet and hit animations.
- Audio and animation adapter for the original Laya behavior.

Remove or stub only after the first complete playable port:

- Login, sharing, rank, stamina ads, shop/network services.
- Platform-specific SDK calls.
- Non-battle monetization flow.

## Bundle Source Map

- Global battle/player runtime:
  - `/tmp/4399_bundle.pretty.js:370` to `:437`
  - Tracks HP, gold, refresh cost, wave index, AI difficulty, start delay,
    active flags, and reset behavior.
- Deck:
  - `/tmp/4399_bundle.pretty.js:449` to `:459`
  - Original starting tokens are copied into `rules.ts`.
- Enemy and boss data:
  - `/tmp/4399_bundle.pretty.js:462` to `:574`
  - Wave counts, HP tables, boss rounds/probabilities, boss skill data.
- Main game startup:
  - `/tmp/4399_bundle.pretty.js:1917` to `:1919`
  - Starts map, enemy data, generals, refresh manager, battle runtime, player.
- Enemy stat lookup:
  - `/tmp/4399_bundle.pretty.js:1937` to `:1948`
  - Computes mob HP/speed and boss HP/speed/range/cooldown.
- Prop definitions and prop implementations:
  - Definitions near `/tmp/4399_bundle.pretty.js:1288`.
  - Active prop classes around `:7563`, `:7701`, `:7732`, `:7891`,
    `:7936`, `:7983`, `:8078`, `:8120`.
- Enemy manager:
  - `/tmp/4399_bundle.pretty.js:10673` onward.
  - Spawning, spatial index, target queries, boss selection, danger events.
- Battle manager:
  - `/tmp/4399_bundle.pretty.js:17252` to `:17275`
  - `delayTime`, `iX = 1500`, `sX = 5000`, wave start, slot spawning.
- Battle scene and mobile UI:
  - `/tmp/4399_bundle.pretty.js:20063` onward.
  - Map drawing, refresh button, skill boxes, danger animation, path tips.
- Weapon data loading:
  - `/tmp/4399_bundle.pretty.js:1828` to `:1834`
  - Uses `data/weapon.json` and `data/weaponTxt.json`.
- Weapon attack examples:
  - Bow/arrow paths around `/tmp/4399_bundle.pretty.js:12453`.
  - Pike paths around `/tmp/4399_bundle.pretty.js:13781`.

## Core Gameplay Contract

### 1. Pre-Game

- First screen is a game title/loadout screen, not an already-running battle.
- Player can inspect/select:
  - active skills: exactly 2 slots.
  - passive skills: up to 5 slots.
  - generals.
  - weapons and weapon assignment per general.
- Weapon and skill descriptions must be visible on mobile without cursor-only
  behavior.

### 2. Start and Refresh

- Starting gold is 20.
- Initial refresh cost is 10 and increases by 2 after refresh.
- Refresh slots hold 5 tokens.
- Player clicks the battle refresh/recruit button to fill the refresh bar.
- Refresh consumes from the original deck for general-name tokens; basic tokens
  remain non-consuming.
- Refresh interactions need the original visual feedback:
  - button squash/light animation.
  - cost increase animation.
  - card deal/slot animation.

### 3. Battle Flow

- Wave phase machine:
  - prepare delay: 10000 ms.
  - spawning: one spawn slot every 1500 ms.
  - cooldown: 5000 ms.
- Each spawn slot spawns for both sides.
- Wave counts are:
  - `10, 11, 12, 13, 15, 16, 18, 19, 21, 24, 26, 29, 31, 35, 38, 42, 46, 51, 56, 61`.
- Boss rounds are:
  - `3, 6, 9, 12, 15, 18`.
- Boss probabilities are:
  - `0.1, 0.2, 0.3, 0.5, 0.9, 1`.
- Enemy paths are map-derived road paths, not arbitrary straight movement.
- Both lanes need warning/danger effects when enemies are close to the end.

### 4. Map and Containers

- Map is split into road, buildable space, grass/unopened land, and blocked
  cells.
- Player and AI each own a side.
- Original containers to preserve behaviorally:
  - battle map/grid.
  - road layer.
  - buildable layer.
  - refresh bar.
  - active/passive prop boxes for both sides.
  - enemy/game-object layer.
  - effect layer.
- Mobile layout has priority:
  - full-screen canvas.
  - bottom/side controls reachable by thumb.
  - no desktop-only hover dependency.

### 5. Placement, Movement, Merge

- Cards can be dragged from refresh slots to valid own cells.
- Placed units remain interactable:
  - tap/click shows attack range.
  - drag moves the unit if the target is valid.
  - drag onto compatible unit upgrades/merges.
  - valid swap/move behavior follows original container checks.
- General-name parts merge into a 2-cell general.
- Original general body width is two grid cells.
- General upgrade uses matching name parts.
- Same base token upgrades same unit.

### 6. Targeting and Combat

- Units query enemies through the enemy manager target APIs.
- Target priority is based on enemies on the correct side and their path
  progress/distance, not random selection.
- Attack cadence follows per-unit/per-general cooldown.
- Combat must support:
  - basic soldier attacks.
  - general attacks.
  - weapon-modified bullets/effects.
  - area, pierce, single-target, and special behaviors.

### 7. Weapons

- Weapon data comes from `data/weapon.json` and `data/weaponTxt.json`.
- Weapon rarity/color must match the original:
  - white, green, blue, purple, yellow.
- Weapons belong to weapon classes and compatible generals.
- Weapon UI must show icon, rarity, name, description, and assignment state.
- Projectile behavior must match source:
  - Bow displays the bow glyph/icon at the origin and fires an ink arrow asset.
  - Pike/spear must not fire a text "枪"; it should use the original spear
    projectile/trail behavior.
  - Knife/sword effects must use slash/trail hit effects, not generic text.
- Missing original resource files must be reported through the asset manifest,
  not silently replaced with unrelated generated art.

### 8. Active Skills

- Active skills can be instant or target-dragged.
- Target types include:
  - refresh slot.
  - unit.
  - map cell.
  - road.
  - none/instant.
- Cooldown mask and ready animation must be visible.
- Important source effects to preserve:
  - shovel digs grass into space.
  - bulldozer pushes enemies back along path.
  - writing brush changes a refresh slot.
  - training/up-level spells target units.
  - life pill can add or remove HP.
  - inkstone slows enemies.
  - trap/landmine go on roads.
  - attack-speed and range buffs apply globally.

### 9. Passive Skills

- Passive skills are configured before battle.
- Passive effects may modify:
  - deck contents.
  - summon/refresh probabilities.
  - unit initial level.
  - shovel generation.
  - gold gain from shovel.
  - meteor/auto-protection.
  - global attack speed, range, HP, or road slow.
- Passive UI must show icon, name/description, and selected state.

### 10. AI

- AI is not a random card player.
- Source areas to finish extracting:
  - AI gold and bonus handling around `/tmp/4399_bundle.pretty.js:17001`
    to `:17130`.
  - AI side refresh/placement manager around the unit and refresh managers.
  - AI loadout configuration around `/tmp/4399_bundle.pretty.js:18780`.
- Minimum port behavior before replacement:
  - AI refreshes when useful.
  - AI places combat units near route pressure.
  - AI completes name-pair generals.
  - AI upgrades useful units.
  - AI uses target active props on valid targets.

### 11. Enemy and Bosses

- Boss list and skills are source data, not invented.
- Boss entrance uses source boss slot selection and boss tip behavior.
- Boss skills to preserve behaviorally:
  - chaos.
  - summon/revive.
  - encourage/speed/HP buff.
  - demolition.
  - rain/attack-speed reduction.
  - charm/convert lowest unit.
  - cavalry call.
  - halberd level-down/merge-lock.
  - devour.
  - knockdown.
  - blind.
  - seal highest unit.

### 12. Animation and Audio

- Laya calls are replaced through `ports.ts`, not removed from behavior.
- Required adapters:
  - frame animation.
  - tween chains.
  - spine animation calls.
  - trail/bullet effects.
  - sound effect playback.
  - music playback.
- First-pass adapter can be approximate, but every missing animation must have
  a tracked item in the implementation checklist.

## Definition of Done for First Complete Port

- Mobile viewport can play a full battle from title screen to win/lose.
- Player can configure skills and weapons before battle.
- Refresh, drag placement, movement, merge, range display all work.
- Enemy waves never stall.
- AI opponent keeps playing without random dead states.
- Weapon attacks visually match the original asset intent.
- Active/passive skills match source descriptions and targets.
- Missing assets are either present under `public/songjiang-duel/original` or
  listed in the generated missing-assets report.
- No Laya, SDK, ad, network, rank, or stamina code is required to run battle.
