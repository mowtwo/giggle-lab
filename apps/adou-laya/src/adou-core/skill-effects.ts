import type { AdouSide } from "./cards";
import type { AdouSoundKey } from "./assets";
import type { AdouBattleState } from "./battle-state";
import {
  isAdouFarmTileForSide,
  isAdouRoadTileForSide,
  type AdouPoint,
  type AdouTile,
} from "./map";
import { getAdouUnitAt } from "./placement";
import { getAdouSkill, type AdouSkillId } from "./skills";

export type AdouSkillUseTarget =
  | { type: "none" }
  | { type: "cell"; col: number; row: number }
  | { type: "hand"; index: number };

export type AdouSkillIntent =
  | { type: "dig-tile"; point: AdouPoint; treasure: boolean }
  | { type: "push-enemies"; distance: number }
  | { type: "redraw-hand"; index: number }
  | { type: "recycle-hand"; index: number; mantouGain: number }
  | { type: "upgrade-unit"; unitUid: number; stable: boolean; failDowngradeChance: number }
  | { type: "heal-adou"; amount: number; failDamageChance?: number }
  | { type: "set-range-multiplier"; multiplier: number }
  | { type: "slow-enemies"; durationSeconds: number; multiplier: number }
  | { type: "place-trap"; point: AdouPoint; trapKind: "trap" | "landmine" }
  | { type: "speed-up-unit"; unitUid: number; addMultiplier: number; permanent: boolean }
  | { type: "boss-backfire"; chance: number }
  | { type: "add-mantou"; amount: number }
  | { type: "enable-meteor" }
  | { type: "enable-shovel-treasure" }
  | { type: "enable-super-shovel"; intervalSeconds: number }
  | { type: "increase-promotion"; chance: number };

export type AdouSkillPlan =
  | {
      ok: true;
      skillId: AdouSkillId;
      title: string;
      message: string;
      sound?: AdouSoundKey;
      intents: readonly AdouSkillIntent[];
    }
  | {
      ok: false;
      reason: "invalid-skill" | "wrong-target" | "empty-target";
      message: string;
    };

function targetPoint(target: AdouSkillUseTarget) {
  return target.type === "cell" ? { col: target.col, row: target.row } : null;
}

function getAdouStateTile(state: Pick<AdouBattleState, "tiles">, point: AdouPoint | null) {
  if (!point) return null;
  return state.tiles.find((tile) => tile.col === point.col && tile.row === point.row) ?? null;
}

function targetUnitUid(state: AdouBattleState, side: AdouSide, target: AdouSkillUseTarget) {
  const point = targetPoint(target);
  if (!point) return null;
  const unit = getAdouUnitAt(state.units, point);
  return unit && unit.side === side ? unit.uid : null;
}

function skillPlan(
  skillId: AdouSkillId,
  title: string,
  message: string,
  intents: readonly AdouSkillIntent[],
  sound?: AdouSoundKey,
): AdouSkillPlan {
  return { ok: true, skillId, title, message, intents, sound };
}

export function planAdouSkillUse(
  state: AdouBattleState,
  side: AdouSide,
  skillId: AdouSkillId,
  target: AdouSkillUseTarget = { type: "none" },
): AdouSkillPlan {
  const skill = getAdouSkill(skillId);
  if (!skill) return { ok: false, reason: "invalid-skill", message: "技能无效" };

  if (skill.target !== "none" && target.type === "none") {
    return { ok: false, reason: "wrong-target", message: `${skill.title} 需要选择目标` };
  }

  if (skillId === "shovel") {
    const point = targetPoint(target);
    const tile = getAdouStateTile(state, point);
    if (!point || !tile || !isAdouFarmTileForSide(tile, side) || tile.kind !== "grass") {
      return { ok: false, reason: "wrong-target", message: "铲子只能开荒己方空白草地" };
    }
    return skillPlan(
      skillId,
      skill.title,
      state.sides[side].shovelFindsTreasure ? "摸金开荒" : "开荒成功",
      [{ type: "dig-tile", point, treasure: state.sides[side].shovelFindsTreasure }],
      state.sides[side].shovelFindsTreasure ? "shovel_treasure_box" : "shovel_use",
    );
  }

  if (skillId === "bulldozer") {
    return skillPlan(skillId, skill.title, "推车出动", [{ type: "push-enemies", distance: 1.6 }], "bulldozer_push");
  }

  if (skillId === "writingBrush") {
    if (target.type !== "hand") {
      return { ok: false, reason: "wrong-target", message: "毛笔要拖到一格刷新栏" };
    }
    return skillPlan(skillId, skill.title, "逆天改字", [{ type: "redraw-hand", index: target.index }], "talisman_burn");
  }

  if (skillId === "trashCan") {
    if (target.type !== "hand") {
      return { ok: false, reason: "wrong-target", message: "垃圾桶要拖到一格刷新栏" };
    }
    if (!state.sides[side].hand[target.index]) {
      return { ok: false, reason: "empty-target", message: "这个刷新格是空的" };
    }
    return skillPlan(skillId, skill.title, "回收文字，馒头 +1", [{ type: "recycle-hand", index: target.index, mantouGain: 1 }], "mantou_add");
  }

  if (skillId === "trainingSpell" || skillId === "upLvlSpell") {
    const unitUid = targetUnitUid(state, side, target);
    if (unitUid === null) {
      return { ok: false, reason: "wrong-target", message: "符纸需要拖到己方单位" };
    }
    return skillPlan(
      skillId,
      skill.title,
      skillId === "upLvlSpell" ? "单位提升一级" : "练兵",
      [{
        type: "upgrade-unit",
        unitUid,
        stable: skillId === "upLvlSpell",
        failDowngradeChance: skillId === "trainingSpell" ? 0.28 : 0,
      }],
      "general_level_up",
    );
  }

  if (skillId === "lifePill") {
    return skillPlan(skillId, skill.title, "包子续命", [{ type: "heal-adou", amount: 1, failDamageChance: 0.45 }], "mantou_add");
  }

  if (skillId === "longRange") {
    return skillPlan(skillId, skill.title, "远程范围翻倍", [{ type: "set-range-multiplier", multiplier: 2 }], "holyBlade_skill");
  }

  if (skillId === "inkstone") {
    return skillPlan(skillId, skill.title, "墨汁减速", [{ type: "slow-enemies", durationSeconds: 5, multiplier: 0.42 }], "skill_ink_splash");
  }

  if (skillId === "trap" || skillId === "landmine") {
    const point = targetPoint(target);
    const tile: AdouTile | null = getAdouStateTile(state, point);
    if (!point || !isAdouRoadTileForSide(tile, side)) {
      return { ok: false, reason: "wrong-target", message: `${skill.title} 要放在己方道路上` };
    }
    return skillPlan(
      skillId,
      skill.title,
      skillId === "trap" ? "挖好陷阱" : "埋下地雷",
      [{ type: "place-trap", point, trapKind: skillId }],
      "shovel_use",
    );
  }

  if (skillId === "attSpeedSpell") {
    const unitUid = targetUnitUid(state, side, target);
    if (unitUid === null) {
      return { ok: false, reason: "wrong-target", message: "攻速符需要拖到己方单位" };
    }
    return skillPlan(
      skillId,
      skill.title,
      "单位攻速提升",
      [{ type: "speed-up-unit", unitUid, addMultiplier: 0.4, permanent: true }],
      "general_level_up",
    );
  }

  if (skillId === "exorcismSpell") {
    return skillPlan(skillId, skill.title, "Boss 施法可能反噬", [{ type: "boss-backfire", chance: 0.5 }], "skill_ink_splash");
  }

  if (skillId === "marchPill") {
    return skillPlan(skillId, skill.title, "体力转化为馒头", [{ type: "add-mantou", amount: 10 }], "mantou_add");
  }

  if (skillId === "meteor") {
    return skillPlan(skillId, skill.title, "陨石守护阿斗", [{ type: "enable-meteor" }], "meteor_fall");
  }

  if (skillId === "superShovel") {
    return skillPlan(skillId, skill.title, "洛阳铲开始产铲", [{ type: "enable-super-shovel", intervalSeconds: 60 }], "shovel_treasure_box");
  }

  if (skillId === "goldSeeker") {
    return skillPlan(skillId, skill.title, "铲子会挖出宝箱", [{ type: "enable-shovel-treasure" }], "shovel_treasure_box");
  }

  if (skillId === "promotionOrder") {
    return skillPlan(skillId, skill.title, "新兵有概率二级入场", [{ type: "increase-promotion", chance: 0.15 }], "general_level_up");
  }

  return skillPlan(skillId, skill.title, skill.title, [], undefined);
}
