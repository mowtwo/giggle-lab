import { ADOU_BOSS_DEFS } from "./battle-rules";
import type { AdouSoundKey } from "./assets";
import type { AdouBattleState, AdouEnemy } from "./battle-state";
import { getAdouEnemyPoint } from "./combat";
import { isAdouBuildTileForSide, type AdouPoint } from "./map";
import { getAdouUnitAt } from "./placement";

export type AdouBossSkillIntent =
  | { type: "backfire"; damageFraction: number }
  | { type: "chaos-units"; unitUids: readonly number[]; durationSeconds: number }
  | { type: "summon"; label: string; count: number }
  | { type: "buff-enemies"; hpFraction: number; speedMultiplier: number }
  | { type: "block-tile"; point: AdouPoint }
  | { type: "attack-speed-down"; subtractMultiplier: number; minMultiplier: number }
  | { type: "charm-unit"; unitUid: number; summonLabel: string }
  | { type: "downgrade-and-lock"; unitUid: number; lockSeconds: number; mergeLockSeconds: number }
  | { type: "devour-nearby"; unitUids: readonly number[]; healFractionOfUnitHp: number; radiusGrowth: number }
  | { type: "knockdown-units"; unitUids: readonly number[]; durationSeconds: number }
  | { type: "blind"; durationSeconds: number }
  | { type: "seal-unit"; unitUid: number; durationSeconds: number };

export type AdouBossSkillPlan = {
  bossId: number;
  bossName: string;
  skillName: string;
  message: string;
  sound: AdouSoundKey;
  origin: { x: number; y: number };
  intents: readonly AdouBossSkillIntent[];
};

export function adouBossSkillSound(bossId: number): AdouSoundKey {
  const sounds: readonly AdouSoundKey[] = [
    "zhangJiao_skill_horn",
    "boss_sweep_skill",
    "dongZhuo_skill_phantom",
    "caoCao_skill_seal",
    "zhenFu_skill_rain",
    "diaoChan_skill_charm",
    "summon_cavalry_skill",
    "luBu_skill",
    "dongZhuo_skill_phase1_suck",
    "xiahouDun_skill_cloud",
    "xiahouDun_skill_lightning",
    "caoCao_skill_seal",
  ];
  return sounds[bossId] ?? "boss_sweep_skill";
}

function nearbyUnitUids(
  state: Pick<AdouBattleState, "units">,
  origin: { x: number; y: number },
  side: AdouEnemy["targetSide"],
  manhattanRange: number,
) {
  return state.units
    .filter((unit) => unit.side === side)
    .filter((unit) => Math.abs(unit.col + unit.width / 2 - origin.x) + Math.abs(unit.row + 0.5 - origin.y) < manhattanRange)
    .map((unit) => unit.uid);
}

function lowestTierUnitUid(state: Pick<AdouBattleState, "units">, side: AdouEnemy["targetSide"]) {
  return [...state.units].filter((unit) => unit.side === side).sort((a, b) => a.tier - b.tier)[0]?.uid;
}

function highestTierUnitUid(state: Pick<AdouBattleState, "units">, side: AdouEnemy["targetSide"]) {
  return [...state.units].filter((unit) => unit.side === side).sort((a, b) => b.tier - a.tier)[0]?.uid;
}

function randomEmptyBuildTile(
  state: Pick<AdouBattleState, "tiles" | "units">,
  side: AdouEnemy["targetSide"],
  rng: () => number,
) {
  const empty = state.tiles
    .filter((tile) => isAdouBuildTileForSide(tile, side))
    .filter((tile) => !getAdouUnitAt(state.units, tile));
  return empty.length > 0 ? empty[Math.floor(rng() * empty.length)] : undefined;
}

export function planAdouBossSkill(
  state: AdouBattleState,
  enemy: AdouEnemy,
  rng: () => number = Math.random,
): AdouBossSkillPlan | null {
  if (enemy.bossId === undefined) return null;
  const boss = ADOU_BOSS_DEFS[enemy.bossId];
  if (!boss) return null;

  const side = enemy.targetSide;
  const runtime = state.sides[side];
  const origin = getAdouEnemyPoint(state, enemy);

  if (runtime.bossBackfireChance > 0 && rng() < runtime.bossBackfireChance) {
    return {
      bossId: enemy.bossId,
      bossName: boss.name,
      skillName: boss.skillName,
      message: `${boss.name} 施法失败`,
      sound: "skill_ink_splash",
      origin,
      intents: [{ type: "backfire", damageFraction: 0.08 }],
    };
  }

  const units = state.units.filter((unit) => unit.side === side);
  const firstThree = units.slice(0, 3).map((unit) => unit.uid);
  const lowest = lowestTierUnitUid(state, side);
  const highest = highestTierUnitUid(state, side);
  const intents: AdouBossSkillIntent[] = [];

  switch (enemy.bossId) {
    case 0:
      intents.push({ type: "chaos-units", unitUids: firstThree, durationSeconds: 5 });
      break;
    case 1:
      intents.push({ type: "summon", label: "魂", count: 2 });
      break;
    case 2:
      intents.push({ type: "buff-enemies", hpFraction: 0.35, speedMultiplier: 1.28 });
      break;
    case 3: {
      const tile = randomEmptyBuildTile(state, side, rng);
      if (tile) intents.push({ type: "block-tile", point: { col: tile.col, row: tile.row } });
      break;
    }
    case 4:
      intents.push({ type: "attack-speed-down", subtractMultiplier: 0.24, minMultiplier: 0.55 });
      break;
    case 5:
      if (lowest !== undefined) intents.push({ type: "charm-unit", unitUid: lowest, summonLabel: "叛" });
      break;
    case 6:
      intents.push({ type: "summon", label: "骑", count: 3 });
      break;
    case 7:
      if (highest !== undefined) {
        intents.push({
          type: "downgrade-and-lock",
          unitUid: highest,
          lockSeconds: 8,
          mergeLockSeconds: 6,
        });
      }
      break;
    case 8: {
      const unitUids = nearbyUnitUids(state, origin, side, 2.3);
      intents.push({
        type: "devour-nearby",
        unitUids,
        healFractionOfUnitHp: 0.45,
        radiusGrowth: 0.05,
      });
      break;
    }
    case 9:
      intents.push({ type: "knockdown-units", unitUids: firstThree, durationSeconds: 5.5 });
      break;
    case 10:
      intents.push({ type: "blind", durationSeconds: 8 });
      break;
    case 11:
      if (highest !== undefined) intents.push({ type: "seal-unit", unitUid: highest, durationSeconds: 9 });
      break;
    default:
      break;
  }

  return {
    bossId: enemy.bossId,
    bossName: boss.name,
    skillName: boss.skillName,
    message: `${boss.name}：${boss.skillName}`,
    sound: adouBossSkillSound(enemy.bossId),
    origin,
    intents,
  };
}
