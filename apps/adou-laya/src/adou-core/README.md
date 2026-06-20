# Adou Core Migration

This folder is the clean TypeScript gameplay core that will gradually replace
the original bundled game code.

The current production route still runs `vendor/original/game` as the playable
reference baseline. New code here should be written as small domain modules that
can be verified against that baseline, then wired into the Laya scene layer.

## Boundaries

- `adou-core`: gameplay rules, deterministic state transitions, card pools,
  merges, skills, weapons, AI, waves, damage, codex data, resource manifests,
  feedback cues, and persistence models.
- Laya adapter: scene creation, drag input, animation playback, audio playback,
  atlas/spine loading, and responsive layout.
- Vendor package: temporary reference artifact and asset source. Do not add new
  gameplay behavior there.

## Port Order

1. Card pool, hand refresh, merge, split, and level inheritance.
2. Map grid, pathing, two-cell placement, dragging, and range preview.
3. Weapons, weapon rarity, equipment rules, and projectile/effect descriptors.
4. Active/passive skills and target-selection rules.
5. Wave spawning, boss skills, AI, damage, and end-of-match flow.
6. Local persistence for loadout, codex state, settings, and progress.
7. Laya adapter replacement for the original scene/dialog scripts.

`src/laya-adapter/adou-battle-scene.ts` is the first clean adapter layer. It is
still a minimal canvas implementation, but it already runs the core start flow,
hand refresh/merge/place actions, range preview, active-skill targeting, enemy
movement, Adou HP display, manual end flow, sound lookup, and feedback cues.

The important rule: the vendor bundle can explain behavior, but the replacement
module should be readable TypeScript with explicit names and tests/checks.

## Current Modules

- `cards.ts`: original token pool, card kinds, draw/refresh helpers, and general
  two-character definitions.
- `assets.ts`: original resource registry for sounds, music, Spine animations,
  prefabs, and atlas roots used by clean core descriptors.
- `codex.ts`: unified general, weapon, and skill codex entries with Chinese
  labels, descriptions, default weapons, compatible weapons, and base stats.
- `hand.ts`: selectable hand slots that can hold raw cards or composed units,
  including hand-slot merge, upgrade, split, and returning discarded items to
  the card pool.
- `merge.ts`: card composition, same-unit upgrade, farmer upgrade, and general
  split level inheritance.
- `map.ts`: original 8x10 maps, route extraction, and side/tile predicates.
- `placement.ts`: two-cell occupancy, placement, movement, swapping, and unit
  upgrade checks.
- `weapons.ts`: translated original `weapon.json`, rarity, icon atlas keys,
  exclusive weapons, and compatibility checks.
- `skills.ts`: translated original prop/skill table with active, passive,
  special, and instant classifications.
- `loadout.ts`: normalized local loadout persistence model for 2 active skills,
  5 passive skills, and compatible weapon assignments.
- `battle-rules.ts` and `battle-state.ts`: battle constants, wave state,
  starting flow, boss slots, enemy spawning, hand refresh, and Adou HP events.
- `units.ts`: unit combat stats, level scaling, farmer income intervals, weapon
  range parsing, damage, attack interval, and range calculations.
- `combat.ts`: enemy route positions, unit range cells, target candidates, attack
  plans, and pure damage application.
- `attack-effects.ts`: declarative attack visual/audio specs for bow, pike,
  sword, blade, cavalry, and important weapon special effects.
- `boss-skills.ts`: boss skill intent planning, including the blind-mask boss
  skill as a Boss intent rather than general UI state.
- `enemies.ts`: enemy timers, movement, slow/silt modifiers, boss skill triggers,
  and Adou damage when enemies reach the route end.
- `ai.ts`: pure AI planner for threat checks, active-skill use, hand merging,
  deployment, dynamic-tile target selection, and refresh decisions.
- `skill-effects.ts`: active/passive/instant skill use validation and effect
  intents for dragged targets such as units, roads, hand slots, and map cells.
- `event-feedback.ts`: maps executable core events to audio, animation, prefab,
  message, and damage/heart feedback cues for the Laya adapter.
- `reducer.ts`: executable core actions for hand merges, placement, dragging
  units back to hand, active skills, trap checks, unit attacks, enemy movement,
  boss-skill intent application, passive timer rewards such as 洛阳铲,
  scheduled AI ticks, AI bonus rounds, and one-step battle ticking.
